import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import postcss from 'postcss';

const bem=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const classes=new Set();
const files=(await fs.readdir('src',{recursive:true})).filter(p=>p.endsWith('.tsx'));
function collect(node){
 if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)){
  for(const name of node.text.trim().split(/\s+/).filter(Boolean)){
   assert(bem.test(name),`Invalid BEM class: ${name}`);classes.add(name);
  }
 }
 ts.forEachChild(node,collect);
}
for(const file of files){
 const source=ts.createSourceFile(file,await fs.readFile(path.join('src',file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node){if(ts.isJsxAttribute(node)&&node.name.getText(source)==='className'&&node.initializer)collect(node.initializer);else ts.forEachChild(node,visit)}
 visit(source);
}
let rules=0;
for(const file of ['src/styles/global.css','src/photobooth/photobooth.css','src/photobooth/photo-stack.css']){
 const root=postcss.parse(await fs.readFile(file,'utf8'),{from:file});
 root.walkRules(rule=>{
  rules++;
  for(const [,name] of rule.selector.matchAll(/\.([a-z][\w-]*)/g)){
   assert(bem.test(name),`${file}: invalid class .${name}`);
   assert(classes.has(name),`${file}: orphan CSS class .${name}`);
  }
 });
}
console.log(`PASS: ${classes.size} JSX BEM classes, ${rules} CSS rules, no orphan CSS classes.`);
