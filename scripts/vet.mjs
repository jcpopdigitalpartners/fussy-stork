import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const help = `Usage: npm run vet -- MODE [options]

Modes:
  process    Check the HTTP process, without requiring a database
  api        Check readiness, input rejection, and a real record round trip
  image      Check a running Podman container against an expected local image
  cluster    Check API behavior and ready Kubernetes Service endpoints
  security   Check API behavior and selected running-container boundaries

Options:
  --url URL                API origin (default http://127.0.0.1:3000)
  --container NAME         Running Podman container (image/security)
  --image REFERENCE        Expected local OCI image (image/security)
  --context NAME           Explicit kubectl context (cluster)
  --namespace NAME         Workload namespace (cluster)
  --deployment NAME        API Deployment (cluster)
  --service NAME           API Service (cluster)
  --min-ready NUMBER       Required ready replicas/endpoints (default 2)
  --baseline FILE          Reuse a saved marker after a change or recovery
  --output FILE            Save the machine-readable evidence report
  --help                   Show this help

API/cluster/security checks create one retained marker unless --baseline is used.
Security checks attempt a unique root-file write and remove it if it succeeds.
The checker never restarts containers, changes cluster resources, or installs tools.
Exit: 0 pass, 1 observed failure/blocked check, 2 invalid invocation.
`;

export function parseArgs(argv) {
  if (argv.includes('--help')) return {help: true};
  const [mode, ...rest] = argv;
  if (!['process', 'api', 'image', 'cluster', 'security'].includes(mode)) throw Error('Choose a vet mode. Use --help for the available checks.');
  const options = {mode, url: 'http://127.0.0.1:3000', minReady: 2};
  const flags = {'--url':'url', '--container':'container', '--image':'image', '--context':'context', '--namespace':'namespace', '--deployment':'deployment', '--service':'service', '--min-ready':'minReady', '--baseline':'baselinePath', '--output':'output'};
  for (let i = 0; i < rest.length; i += 2) {
    const key = flags[rest[i]], value = rest[i + 1];
    if (!key || !value || value.startsWith('--')) throw Error(`Invalid option: ${rest[i] || '(missing)'}`);
    options[key] = value;
  }
  const url = new URL(options.url);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('--url must be an HTTP API origin without credentials or a route path.');
  options.url = url.origin;
  options.minReady = Number(options.minReady);
  if (!Number.isInteger(options.minReady) || options.minReady < 1 || options.minReady > 100) throw Error('--min-ready must be an integer from 1 to 100.');
  const required = mode === 'cluster' ? ['context','namespace','deployment','service'] : ['image','security'].includes(mode) ? ['container','image'] : [];
  for (const key of required) if (!options[key] || options[key].startsWith('-')) throw Error(`--${key} is required for ${mode}.`);
  return options;
}

function defaultRunner(command, args) {
  return execFileSync(command, args, {encoding: 'utf8', timeout: 15_000, maxBuffer: 2 * 1024 * 1024, stdio: ['ignore','pipe','pipe']});
}

export function deploymentSelector(selector) {
  const parts = Object.entries(selector?.matchLabels || {}).map(([key,value]) => `${key}=${value}`);
  for (const expression of selector?.matchExpressions || []) {
    const {key, operator, values = []} = expression;
    if (operator === 'In') parts.push(`${key} in (${values.join(',')})`);
    else if (operator === 'NotIn') parts.push(`${key} notin (${values.join(',')})`);
    else if (operator === 'Exists') parts.push(key);
    else if (operator === 'DoesNotExist') parts.push(`!${key}`);
    else throw Error(`Unsupported selector operator: ${operator}`);
  }
  if (!parts.length) throw Error('The Deployment has no usable Pod selector.');
  return parts.join(',');
}

export async function runVet(options, {fetchImpl = fetch, runner = defaultRunner} = {}) {
  const report = {schemaVersion: 1, mode: options.mode, generatedAt: new Date().toISOString(), target: {url: options.url}, checks: [], limitations: []};
  async function check(id, title, operation) {
    try {
      const result = await operation();
      report.checks.push({id, title, status: result.ok ? 'pass' : 'fail', detail: result.detail});
      return result.ok;
    } catch (error) {
      report.checks.push({id, title, status: 'fail', detail: String(error.message).slice(0, 600)});
      return false;
    }
  }
  const blocked = (id,title,detail) => report.checks.push({id,title,status:'blocked',detail});
  async function request(path, {method = 'GET', body} = {}) {
    const response = await fetchImpl(new URL(path, options.url), {method, signal: AbortSignal.timeout(5000), headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)});
    const data = await response.json();
    return {status: response.status, data};
  }
  const health = await check('http-process','HTTP process answers',async () => {
    const result = await request('/health');
    report.target.instance = result.data.instance || null;
    return {ok: result.status === 200 && result.data.status === 'ok', detail: `GET /health returned HTTP ${result.status}.`};
  });
  if (options.mode === 'process' || options.mode === 'image') {
    report.limitations.push('A health response does not prove database access, persistence, load distribution, or security.');
  } else {
    const ready = await check('database-ready','API can query its database',async () => {
      const result = await request('/ready');
      return {ok: result.status === 200 && result.data.ready === true, detail: `GET /ready returned HTTP ${result.status}.`};
    });
    await check('invalid-value','Empty records are rejected',async () => {
      const result = await request('/records',{method:'POST',body:{value:''}});
      return {ok: result.status === 400, detail: `Empty value returned HTTP ${result.status}; expected 400.`};
    });
    await check('invalid-json','Malformed JSON is rejected',async () => {
      const result = await request('/records',{method:'POST',body:'{'});
      return {ok: result.status === 400, detail: `Malformed JSON returned HTTP ${result.status}; expected 400.`};
    });
    await check('missing-route','Unknown routes are rejected',async () => {
      const result = await request('/cip-vet-route-that-does-not-exist');
      return {ok: result.status === 404, detail: `Unknown route returned HTTP ${result.status}; expected 404.`};
    });
    if (health && ready) {
      await check('record-roundtrip',options.baseline ? 'Saved marker survives the change' : 'A real marker can be stored and read',async () => {
        let marker = options.baseline?.record;
        if (options.baseline && (!marker || marker.id === undefined || typeof marker.value !== 'string')) throw Error('The baseline report has no valid saved record.');
        if (!marker) {
          const value = `cip-vet-${randomUUID()}`;
          const created = await request('/records',{method:'POST',body:{value}});
          if (created.status !== 201 || created.data.id === undefined || created.data.value !== value) return {ok:false,detail:`POST /records did not return the expected new record (HTTP ${created.status}).`};
          marker = {id:created.data.id,value};
        }
        report.record = {...marker};
        const found = await request('/records');
        const exists = found.status === 200 && Array.isArray(found.data.records) && found.data.records.some(row => String(row.id) === String(marker.id) && row.value === marker.value);
        return {ok:exists,detail:exists ? `Record ${marker.id} was read back with its expected value.` : 'The expected record was not returned by GET /records.'};
      });
    } else blocked('record-roundtrip','Record round trip','Resolve the process/readiness failures first. No marker was created.');
    report.limitations.push('A record round trip proves the observed API path. It does not prove a backup restore or that a fault actually occurred.');
    if (!options.baseline) report.limitations.push('One cip-vet marker remains in the disposable lab database as evidence.');
  }

  if (['image','security'].includes(options.mode)) {
    let container;
    report.target.container = options.container;
    await check('image-identity','Running container uses the expected local image',() => {
      [container] = JSON.parse(runner('podman',['container','inspect',options.container]));
      const [expected] = JSON.parse(runner('podman',['image','inspect',options.image]));
      if (!container || !expected) throw Error('Podman did not return both inspection objects.');
      report.target.imageId = container.Image;
      report.target.expectedImageId = expected.Id;
      const id = value => String(value || '').replace(/^sha256:/,'');
      return {ok: !!container.State?.Running && !!id(container.Image) && id(container.Image) === id(expected.Id), detail:'Compared the running container’s image ID with the resolved local image ID.'};
    });
    report.limitations.push('The supplied URL must reach this container. Local image IDs are not proof of a registry signature or admission decision.');
    if (options.mode === 'security') {
      if (container) {
        await check('read-only-root','Root filesystem is configured read-only',() => ({ok:container.HostConfig?.ReadonlyRootfs === true,detail:`ReadonlyRootfs=${String(container.HostConfig?.ReadonlyRootfs)}.`}));
        let proc;
        const observed = await check('process-state','PID 1 state is observable',() => {
          proc = runner('podman',['exec',options.container,'cat','/proc/1/status']);
          return {ok:/^Uid:/m.test(proc) && /^CapEff:/m.test(proc) && /^Seccomp:/m.test(proc),detail:'Read the running process state from /proc/1/status.'};
        });
        if (observed) {
          await check('non-root','PID 1 has a nonzero effective UID',() => {const uid=proc.match(/^Uid:\s+\d+\s+(\d+)/m)?.[1];return {ok:!!uid && Number(uid)!==0,detail:`Effective UID=${uid || 'unavailable'}.`};});
          await check('capabilities','PID 1 has no effective Linux capabilities',() => {const cap=proc.match(/^CapEff:\s+([0-9a-f]+)/mi)?.[1];return {ok:!!cap && BigInt(`0x${cap}`)===0n,detail:`CapEff=${cap || 'unavailable'}. This profile expects zero effective capabilities.`};});
          await check('seccomp','PID 1 has seccomp filtering enabled',() => {const mode=proc.match(/^Seccomp:\s+(\d+)/m)?.[1];return {ok:mode==='2',detail:`Seccomp=${mode || 'unavailable'}; filter mode is 2.`};});
        } else blocked('process-boundaries','Process boundary checks','UID, capability and seccomp state could not be evaluated.');
        await check('denied-root-write','A protected root-file write is denied',() => {
          const path = `/.cip-vet-${randomUUID()}`;
          const program = `const fs=require('node:fs');const p=${JSON.stringify(path)};try{fs.writeFileSync(p,'vet')}catch(e){console.log(JSON.stringify({denied:['EROFS','EACCES','EPERM'].includes(e.code),reason:e.code}));process.exit(0)}let cleanup=true;try{fs.unlinkSync(p)}catch{cleanup=false}console.log(JSON.stringify({denied:false,cleanup}));`;
          const result = JSON.parse(runner('podman',['exec',options.container,'node','-e',program]));
          return {ok:result.denied===true,detail:result.denied ? `The write failed with ${result.reason}.` : `The write succeeded; probe cleanup=${result.cleanup}.`};
        });
      } else blocked('runtime-security','Runtime boundaries','The target container could not be inspected.');
      report.limitations.push('These are selected PID 1 and filesystem checks. They do not establish which syscalls a seccomp policy denies, validate all child processes, assess vulnerabilities/SBOMs, or prove Kubernetes admission/trust policy.');
    }
  }

  if (options.mode === 'cluster') {
    report.target.context = options.context;
    report.target.namespace = options.namespace;
    await check('cluster-endpoints','Deployment and Service have enough matching ready endpoints',() => {
      const get = (kind,name,...extra) => JSON.parse(runner('kubectl',['--context',options.context,'--namespace',options.namespace,'get',kind,...(name?[name]:[]),...extra,'-o','json']));
      const deployment = get('deployment',options.deployment);
      const service = get('service',options.service);
      const pods = get('pods',null,'-l',deploymentSelector(deployment.spec?.selector)).items || [];
      const slices = get('endpointslices',null,'-l',`kubernetes.io/service-name=${options.service}`).items || [];
      const selector = service.spec?.selector || {};
      const matching = new Set(pods.filter(pod => Object.keys(selector).length && Object.entries(selector).every(([key,value])=>pod.metadata?.labels?.[key]===value)).map(pod=>pod.metadata.name));
      const endpoints = new Set(slices.flatMap(slice => slice.endpoints || []).filter(endpoint => endpoint.conditions?.ready === true && endpoint.targetRef?.kind === 'Pod' && matching.has(endpoint.targetRef.name)).map(endpoint=>endpoint.targetRef.name));
      const desired = deployment.spec?.replicas ?? 1, ready = deployment.status?.readyReplicas ?? 0;
      report.cluster = {deployment:options.deployment, service:options.service, desiredReplicas:desired, readyReplicas:ready, matchingReadyEndpoints:endpoints.size};
      return {ok:desired>=options.minReady && ready>=options.minReady && endpoints.size>=options.minReady,detail:`Desired=${desired}, ready=${ready}, matching ready Service endpoints=${endpoints.size}; required=${options.minReady}.`};
    });
    report.limitations.push('These are control-plane snapshots, not proof of request distribution or HPA scale-out. The supplied URL must reach the named Service. A kubectl Service port-forward can select one Pod and cannot prove load balancing.');
  }
  report.result = report.checks.every(check => check.status === 'pass') ? 'pass' : 'fail';
  return report;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {console.log(help);return;}
  if (options.baselinePath) options.baseline = JSON.parse(await readFile(options.baselinePath,'utf8'));
  const report = await runVet(options);
  for (const check of report.checks) console.log(`[${check.status.toUpperCase()}] ${check.title}\n  ${check.detail}`);
  console.log(`\nResult: ${report.result.toUpperCase()}`);
  console.log('\nProof limits:');for (const limit of report.limitations) console.log(`- ${limit}`);
  if (options.output) {const path=resolve(options.output);await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(`\nSaved report: ${path}`);}
  process.exitCode = report.result === 'pass' ? 0 : 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error.message);process.exitCode=2;});
