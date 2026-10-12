import test from 'node:test';
import assert from 'node:assert/strict';
import {measure,parseLoadArgs} from '../scripts/load.mjs';

test('load harness accounts for HTTP errors and network failures separately',async()=>{
  let number=0;
  const fetchImpl=async()=>{number++;if(number%3===0)throw Error('test offline');const ok=number%3===1;return new Response(JSON.stringify({instance:ok?'pod-a':'pod-b'}),{status:ok?200:503});};
  const report=await measure({url:'http://localhost:3000/records',requests:12,concurrency:3,timeout:1000},{fetchImpl});
  assert.equal(report.completed,12);assert.equal(report.successful,4);assert.equal(report.httpErrors,4);assert.equal(report.networkErrors,4);assert.equal(report.instances['pod-a'],4);assert.ok(report.latencyMs.p95>=report.latencyMs.p50);
});
test('load settings reject accidental unbounded or malformed profiles',()=>{
  assert.throws(()=>parseLoadArgs(['--requests','0']),/requests/);assert.throws(()=>parseLoadArgs(['--concurrency','1000']),/concurrency/);assert.throws(()=>parseLoadArgs(['--url','ftp://localhost']),/HTTP/);
  assert.equal(parseLoadArgs(['--requests','2','--concurrency','8']).concurrency,2);
});
