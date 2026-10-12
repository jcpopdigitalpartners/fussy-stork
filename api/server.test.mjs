import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.mjs';

export async function withApp(pool, operation) {
  const app=createApp(pool);await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  try{return await operation(`http://127.0.0.1:${app.address().port}`);}
  finally{app.closeIdleConnections();await new Promise(resolve=>app.close(resolve));}
}
export function memoryPool() {
  const records=[];
  return {records,query:async(sql,args)=>{
    if(sql==='SELECT 1')return {rows:[{result:1}]};
    if(sql.startsWith('INSERT')){const row={id:String(records.length+1),value:args[0]};records.push(row);return {rows:[row]};}
    if(sql.startsWith('SELECT id'))return {rows:[...records]};
    throw Error(`Unexpected test query: ${sql}`);
  }};
}
test('process health can pass while database readiness fails',async()=>withApp({query:async()=>{throw Error('test datastore unavailable');}},async url=>{
  const health=await fetch(url+'/health');assert.equal(health.status,200);assert.equal((await health.json()).probe,'process-only');
  assert.equal((await fetch(url+'/ready')).status,503);
}));
test('records round trip through parameterized SQL',async()=>{
  const pool=memoryPool();let captured;const query=pool.query;pool.query=async(sql,args)=>{captured={sql,args};return query(sql,args);};
  await withApp(pool,async url=>{
    const response=await fetch(url+'/records',{method:'POST',body:JSON.stringify({value:"O'Reilly"})});
    assert.equal(response.status,201);assert.deepEqual(captured.args,["O'Reilly"]);assert.ok(captured.sql.includes('$1'));
    assert.deepEqual((await (await fetch(url+'/records')).json()).records,[{id:'1',value:"O'Reilly"}]);
    assert.equal((await fetch(url+'/ready')).status,200);
  });
});
test('invalid input does not reach the datastore',async()=>withApp({query:async()=>assert.fail('Invalid input reached SQL')},async url=>{
  for(const body of ['{','{}','null','[]',JSON.stringify({value:''}),JSON.stringify({value:'   '}),JSON.stringify({value:'x'.repeat(501)})])assert.equal((await fetch(url+'/records',{method:'POST',body})).status,400);
  assert.equal((await fetch(url+'/missing')).status,404);
}));
