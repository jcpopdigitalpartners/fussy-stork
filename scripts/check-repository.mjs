import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function files(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>['.git','node_modules'].includes(entry.name)?[]:entry.isDirectory()?files(resolve(directory,entry.name)):[resolve(directory,entry.name)]);}
const map=JSON.parse(readFileSync(resolve(root,'course-map.json'),'utf8'));
assert.deepEqual(map.modules.map(module=>module.id),[0,1,2,3,4]);
assert.equal(map.modules.flatMap(module=>module.lessons).length,44);
for(const module of map.modules)for(const path of [module.path,...module.lessons.map(lesson=>lesson.path)])assert.ok(existsSync(resolve(root,path)),path);
const all=files(root);
for(const file of all){
  if(extname(file)==='.mjs')execFileSync(process.execPath,['--check',file]);
  if(extname(file)==='.md')for(const match of readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){
    const link=match[1].split('#')[0];if(!link||/^[a-z][a-z0-9+.-]*:/i.test(link))continue;
    assert.ok(existsSync(resolve(dirname(file),link)),`${relative(root,file)} -> ${link}`);
  }
}
console.log(`PASS: 5 module indexes, 44 lesson briefs, local documentation links and JavaScript syntax (${all.length} tracked-source candidates).`);
