import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../api/server.mjs';
import {runVet,parseArgs,deploymentSelector} from '../scripts/vet.mjs';

function datastore(){const rows=[];return {rows,query:async(sql,args)=>{if(sql==='SELECT 1')return {rows:[]};if(sql.startsWith('INSERT')){const row={id:String(rows.length+1),value:args[0]};rows.push(row);return {rows:[row]};}return {rows:[...rows]};}};}
async function withServer(pool,operation){const app=createApp(pool);await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));try{return await operation(`http://127.0.0.1:${app.address().port}`);}finally{app.closeIdleConnections();await new Promise(resolve=>app.close(resolve));}}
const options=(mode,url,extra={})=>({mode,url,minReady:2,...extra});
test('API vet creates one marker, then tests continuity without writing another',async()=>{
  const pool=datastore();await withServer(pool,async url=>{
    const first=await runVet(options('api',url));assert.equal(first.result,'pass');assert.equal(pool.rows.length,1);
    const second=await runVet(options('api',url,{baseline:first}));assert.equal(second.result,'pass');assert.equal(pool.rows.length,1);
    pool.rows.length=0;const lost=await runVet(options('api',url,{baseline:first}));assert.equal(lost.result,'fail');assert.equal(lost.checks.find(c=>c.id==='record-roundtrip').status,'fail');
  });
});
test('unavailable datastore cannot receive a green API result',async()=>withServer({query:async()=>{throw Error('test offline')}},async url=>{
  const report=await runVet(options('api',url));assert.equal(report.result,'fail');assert.equal(report.checks.find(c=>c.id==='database-ready').status,'fail');assert.equal(report.checks.find(c=>c.id==='record-roundtrip').status,'blocked');assert.equal(report.record,undefined);
  assert.equal((await runVet(options('process',url))).result,'pass','Process-only mode makes a narrower claim');
}));
test('image checks reject a container using a different image',async()=>withServer(datastore(),async url=>{
  const runner=(_cmd,args)=>JSON.stringify(args[0]==='container'?[{Image:'sha256:a',State:{Running:true}}]:[{Id:'sha256:b'}]);
  const report=await runVet(options('image',url,{container:'api',image:'expected'}),{runner});assert.equal(report.result,'fail');assert.equal(report.checks.find(c=>c.id==='image-identity').status,'fail');
}));
test('security checks require real process state and a denied write',async()=>withServer(datastore(),async url=>{
  let permissive=false;
  const runner=(_cmd,args)=>{
    if(args[0]==='container')return JSON.stringify([{Image:'sha256:a',State:{Running:true},HostConfig:{ReadonlyRootfs:!permissive}}]);
    if(args[0]==='image')return JSON.stringify([{Id:'sha256:a'}]);
    if(args.includes('/proc/1/status'))return `Uid:\t${permissive?'0\t0':'1000\t1000'}\t1000\t1000\nCapEff:\t${permissive?'0000000000000001':'0000000000000000'}\nSeccomp:\t2\n`;
    return JSON.stringify(permissive?{denied:false,cleanup:true}:{denied:true,reason:'EROFS'});
  };
  const args=options('security',url,{container:'api',image:'expected'});assert.equal((await runVet(args,{runner})).result,'pass');
  permissive=true;const failed=await runVet(args,{runner});assert.equal(failed.result,'fail');for(const id of ['non-root','capabilities','read-only-root','denied-root-write'])assert.equal(failed.checks.find(c=>c.id===id).status,'fail');
}));
test('cluster checks ignore unready and unrelated endpoints and use explicit context',async()=>withServer(datastore(),async url=>{
  let ready=true;const calls=[];
  const runner=(_cmd,args)=>{
    calls.push(args);const kind=args[args.indexOf('get')+1];
    if(kind==='deployment')return JSON.stringify({spec:{replicas:2,selector:{matchLabels:{app:'api'}}},status:{readyReplicas:2}});
    if(kind==='service')return JSON.stringify({spec:{selector:{app:'api'}}});
    if(kind==='pods')return JSON.stringify({items:['a','b'].map(name=>({metadata:{name,labels:{app:'api'}}}))});
    return JSON.stringify({items:[{endpoints:[{conditions:{ready:true},targetRef:{kind:'Pod',name:'a'}},{conditions:{ready},targetRef:{kind:'Pod',name:'b'}},{conditions:{ready:true},targetRef:{kind:'Pod',name:'unrelated'}}]}]});
  };
  const args=options('cluster',url,{context:'kind-containers-lab',namespace:'practice',deployment:'api',service:'api'});
  assert.equal((await runVet(args,{runner})).result,'pass');assert.ok(calls.every(args=>args[0]==='--context'&&args[1]==='kind-containers-lab'));
  ready=false;const failed=await runVet(args,{runner});assert.equal(failed.result,'fail');assert.equal(failed.cluster.matchingReadyEndpoints,1);
}));
test('invalid CLI inputs and empty selectors fail before inspection',()=>{
  assert.throws(()=>parseArgs(['security']),/container/);assert.throws(()=>parseArgs(['cluster']),/context/);assert.throws(()=>parseArgs(['api','--url','http://localhost:3000/health']),/origin/);assert.throws(()=>parseArgs(['api','--min-ready','0']),/min-ready/);
  assert.throws(()=>deploymentSelector({}),/selector/);assert.equal(deploymentSelector({matchLabels:{app:'api'},matchExpressions:[{key:'tier',operator:'In',values:['backend']}]}),'app=api,tier in (backend)');
});
