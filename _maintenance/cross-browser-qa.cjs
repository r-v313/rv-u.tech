'use strict';
/* Real Firefox and WebKit (Safari-engine) plus WCAG 2.1 AA automated audit.
 * No real form submission, tracking, or off-site requests.
 * WebKit on Linux is a Safari-engine compatibility test, not an iOS device test.
 */
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const {firefox,webkit}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const media={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png',
  '.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    const pathnameSafe=pathname.endsWith('/')?pathname+'index.html':pathname;
    const filename=path.resolve(root,'.'+pathnameSafe);
    if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    fs.readFile(filename,(err,body)=>{
      if(err){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':media[path.extname(filename)]||'application/octet-stream',
        'Cache-Control':'no-store'});res.end(body);
    });
  }catch(_){res.writeHead(400);res.end();}
});
const axeScript=require.resolve('axe-core/axe.min.js');
const audit=async(page,label)=>{
  await page.addScriptTag({path:axeScript});
  const report=await page.evaluate(async()=>window.axe.run(document,{
    runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},
    rules:{'color-contrast':{enabled:true}}
  }));
  const summary=report.violations.map(v=>({
    id:v.id,impact:v.impact,description:v.help,
    nodes:v.nodes.slice(0,6).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,250)}))
  }));
  if(summary.length)console.log('ACCESSIBILITY VIOLATIONS '+label+' '+JSON.stringify(summary));
  assert.equal(summary.length,0,label+': WCAG 2.1 A/AA automated violations found');
  console.log('PASS: axe WCAG 2.1 AA '+label+'; '+report.passes.length+' checks passed');
};
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const [engine,type] of [['Firefox',firefox],['WebKit',webkit]]){
      const browser=await type.launch({headless:true});
      try{
        for(const width of [320,390,640,850,1024,1440]){
          const context=await browser.newContext({viewport:{width,height:850},deviceScaleFactor:2,
            bypassCSP:true,locale:'ar-EG'});
          const page=await context.newPage();
          const errors=[];
          page.on('pageerror',err=>errors.push(err.message));
          await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
          await page.goto(base+'/',{waitUntil:'domcontentloaded'});
          await page.locator('.cover-portrait img').waitFor();
          await page.waitForFunction(()=>document.querySelector('.cover-portrait img')?.complete);
          const check=async(lang)=>{
            const info=await page.evaluate(()=>{
              const img=document.querySelector('.cover-portrait img');
              const report=document.querySelector('#reports-track .research-image img');
              return {lang:document.documentElement.lang,dir:document.documentElement.dir,
                page:document.documentElement.scrollWidth,viewport:innerWidth,
                picture:img.naturalWidth,
                pictureFit:getComputedStyle(report).objectFit,
                date:document.querySelector('.edition-date').getAttribute('datetime')};
            });
            assert.equal(info.lang,lang,engine+' language mismatch');
            assert(info.page<=width+3,engine+' horizontal overflow '+width+' '+lang+' '+JSON.stringify(info));
            assert(info.picture>0,engine+' portrait image failed');
            assert.equal(info.pictureFit,'contain',engine+' image evidence was cropped');
            assert.equal(info.date,'2026-11-01');
          };
          await check('ar');
          if(width===390){
            const first=page.locator('#reports-track [data-image="0"]');
            await first.scrollIntoViewIfNeeded();await first.click();
            assert(await page.locator('#image-dialog').evaluate(d=>d.open),'Image dialog should open');
            await page.waitForFunction(()=>document.getElementById('gallery-full-image').naturalWidth>0);
            await page.locator('#image-zoom').click();
            assert.equal(await page.locator('#image-zoom').getAttribute('aria-pressed'),'true');
            await page.locator('#image-next').click();
            assert.equal(await page.locator('#image-zoom').getAttribute('aria-pressed'),'false');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#image-dialog').evaluate(d=>d.open),false,'Escape closes image');
            await audit(page,engine+' Arabic main page');
          }
          await page.locator('#language').click();
          await check('en');
          if(width===390){
            await audit(page,engine+' English main page');
          }
          if([320,390,850].includes(width)){
            const menu=page.locator('#menu-toggle');
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'),'true');
            await menu.click();
            assert.equal(await menu.getAttribute('aria-expanded'),'false');
          }
          if([320,390,1024].includes(width)){
            const button=page.locator('[data-apply]:visible').first();
            await button.click();
            assert(await page.locator('#apply-dialog').evaluate(d=>d.open),'Application modal failed');
            const focus=await page.evaluate(()=>document.activeElement?.closest('dialog')?.id);
            assert.equal(focus,'apply-dialog',engine+' keyboard focus must enter modal');
            const box=await page.locator('#apply-dialog').evaluate(d=>({left:d.getBoundingClientRect().left,
              right:d.getBoundingClientRect().right,scroll:d.scrollWidth,client:d.clientWidth}));
            assert(box.left>=-3&&box.right<=width+3&&box.scroll<=box.client+3,
              engine+' application modal clipped '+width+' '+JSON.stringify(box));
            if(width===390)await audit(page,engine+' application form');
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#apply-dialog').evaluate(d=>d.open),false,'Escape closes application');
            assert.equal(await button.evaluate(el=>document.activeElement===el),true,
              engine+' modal focus must return to opener');
          }
          assert.deepEqual(errors,[],engine+' script exceptions at '+width);
          console.log('PASS: '+engine+' '+width+'px AR+EN layout, images and interaction');
          await context.close();
        }
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
