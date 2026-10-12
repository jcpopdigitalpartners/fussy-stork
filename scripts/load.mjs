import {performance} from 'node:perf_hooks';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function parseLoadArgs(argv) {
  if(argv.includes('--help'))return {help:true};
  const options={url:'http://127.0.0.1:3000/records',requests:200,concurrency:4,timeout:5000};
  const flags={'--url':'url','--requests':'requests','--concurrency':'concurrency','--timeout':'timeout','--output':'output'};
  for(let i=0;i<argv.length;i+=2){const key=flags[argv[i]],value=argv[i+1];if(!key||!value||value.startsWith('--'))throw Error(`Invalid option: ${argv[i]}`);options[key]=value;}
  const url=new URL(options.url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Use an HTTP URL without embedded credentials.');
  for(const [key,max] of [['requests',100000],['concurrency',256],['timeout',60000]]){options[key]=Number(options[key]);if(!Number.isInteger(options[key])||options[key]<1||options[key]>max)throw Error(`${key} must be between 1 and ${max}.`);}
  options.concurrency=Math.min(options.concurrency,options.requests);return options;
}
export async function measure(options,{fetchImpl=fetch}={}) {
  let next=0,successful=0,networkErrors=0;const samples=[],statusCounts={},instances={};
  const started=performance.now();
  await Promise.all(Array.from({length:options.concurrency},async()=>{
    while(next<options.requests){next++;const before=performance.now();
      try{const response=await fetchImpl(options.url,{signal:AbortSignal.timeout(options.timeout),headers:{Connection:'close'}});const text=await response.text();statusCounts[response.status]=(statusCounts[response.status]||0)+1;if(response.ok)successful++;
        try{const data=JSON.parse(text);if(typeof data.instance==='string')instances[data.instance]=(instances[data.instance]||0)+1;}catch{}
      }catch{networkErrors++;}finally{samples.push(performance.now()-before);}
    }
  }));
  const elapsed=(performance.now()-started)/1000;const sorted=[...samples].sort((a,b)=>a-b),percentile=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]||0;
  return {schemaVersion:1,generatedAt:new Date().toISOString(),profile:{...options,output:undefined},completed:samples.length,successful,httpErrors:samples.length-successful-networkErrors,networkErrors,statusCounts,instances,elapsedSeconds:elapsed,successfulRequestsPerSecond:successful/Math.max(elapsed,.001),latencyMs:{mean:samples.reduce((a,b)=>a+b,0)/samples.length,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99)},scope:'Closed-loop GET measurement. Client, network and datastore costs contribute. Instance counts are observations, not proof of balanced traffic.'};
}
async function main(){const options=parseLoadArgs(process.argv.slice(2));if(options.help){console.log('npm run load -- --url http://127.0.0.1:3000/records --requests 200 --concurrency 4 --timeout 5000 --output evidence/module-2/baseline.json');return;}const report=await measure(options);console.log(JSON.stringify(report,null,2));if(options.output){const path=resolve(options.output);await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');}process.exitCode=report.httpErrors||report.networkErrors?1:0;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=2;});
