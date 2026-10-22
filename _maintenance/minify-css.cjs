'use strict';
/** RVU Camp deterministic, whitespace-only CSS build (preserves original cascade). */
const fs = require('node:fs');
const path = require('node:path');
function minifyCss(input) {
  let output='',pending=false,quote='',comment=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i],next=input[i+1]||'';
    if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue;}
    if(quote){
      if(pending){output+=' ';pending=false;}
      output+=ch;
      if(ch==='\\'&&i+1<input.length){output+=input[++i];continue;}
      if(ch===quote)quote='';
      continue;
    }
    if(ch==='/'&&next==='*'){comment=true;i++;continue;}
    if(ch==='"'||ch==="'"){
      if(pending){const prev=output.slice(-1);if(prev&&!/[{;}:,]/.test(prev))output+=' ';pending=false;}
      quote=ch;output+=ch;continue;
    }
    if(/\s/.test(ch)){pending=true;continue;}
    if(pending){
      const prev=output.slice(-1);
      if(prev&&!/[{;}:,]/.test(prev)&&!/[{;},]/.test(ch))output+=' ';
      pending=false;
    }
    if(ch==='}'&&output.endsWith(';'))output=output.slice(0,-1);
    output+=ch;
  }
  return output.trim();
}
const root=path.resolve(__dirname,'..');
const input=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const target=path.join(root,'styles.min.css');
const output=minifyCss(input);
if(process.argv.includes('--check')){
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output){
    console.error('styles.min.css is out of sync: run node _maintenance/minify-css.cjs');
    process.exit(1);
  }
  console.log('PASS: generated stylesheet is up to date');
}else{
  fs.writeFileSync(target,output,'utf8');
  console.log('CSS output '+Buffer.byteLength(input)+' -> '+Buffer.byteLength(output)+' bytes');
}
