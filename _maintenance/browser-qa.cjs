'use strict';
/** Render-level regression QA for RVU Camp in a real headless Chromium browser.
 * The test uses local files only and never sends real forms or analytics.
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
  try{
    const raw=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const target=path.resolve(root,'.'+raw+(raw.endsWith('/')?'index.html':''));
    if(!target.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    fs.readFile(target,(error,data)=>{
      if(error){res.writeHead(404);res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(data);
    });
  }catch(_){res.writeHead(400);res.end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
  assert(executablePath,'A headless Chrome/Chromium binary is required');
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const width of [320,360,390,430,768,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
      await page.goto(base+'/?layout-review=1',{waitUntil:'domcontentloaded'});
      await page.locator('.cover-portrait img').waitFor();
      await page.waitForFunction(()=>document.querySelector('.cover-portrait img')?.complete);
      const metrics=await page.evaluate(()=>{
        const portrait=document.querySelector('.cover-portrait img');
        const card=document.querySelector('.mentor-cover').getBoundingClientRect();
        const coverHeading=document.querySelector('.cover-top .mono');
        return {
          screen:innerWidth,documentWidth:document.documentElement.scrollWidth,
          portraitWidth:portrait.naturalWidth,portraitDrawn:portrait.getBoundingClientRect().width,
          logoWidth:document.querySelector('.brand img').naturalWidth,
          cardLeft:card.left,cardRight:card.right,
          headingAlign:getComputedStyle(coverHeading).textAlign,
          reports:document.querySelectorAll('#reports-track .research-image img').length,
          ytFrames:document.querySelectorAll('iframe[src*=youtube]').length
        };
      });
      if(metrics.documentWidth>width+2){
        const suspects=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,65):'',id:el.id,left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),client:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX})).filter(x=>x.right>innerWidth+3&&x.left<innerWidth).slice(0,35));
        console.log('OVERFLOW DIAGNOSTICS',JSON.stringify({width,suspects}));
      }
      assert(metrics.documentWidth<=width+2,'Horizontal overflow at '+width+'px: '+JSON.stringify(metrics));
      assert(metrics.portraitWidth>0,'Portrait failed to load at '+width);
      assert(metrics.logoWidth>0,'Logo failed to load at '+width);
      assert(metrics.cardLeft>=-2&&metrics.cardRight<=width+2,'Portrait card out of viewport at '+width);
      assert.equal(metrics.headingAlign,'center','Portrait heading is not centered');
      assert.equal(metrics.reports,6);
      assert.equal(metrics.ytFrames,0,'YouTube must stay unloaded until interaction');
      if(width===390){
        const preview=page.locator('#reports-track .research-image').first();
        await preview.scrollIntoViewIfNeeded();
        await preview.click();
        assert.equal(await page.locator('#image-dialog').evaluate(e=>e.open),true);
        await page.waitForFunction(()=>document.getElementById('gallery-full-image').naturalWidth>0);
        assert.match(await page.locator('#gallery-full-image').getAttribute('src'),/poc-01-full\.webp/);
        assert.match(await page.locator('#image-original').getAttribute('href'),/poc-01\.png/);
        await page.locator('#image-zoom').click();
        assert.equal(await page.locator('#image-zoom').getAttribute('aria-pressed'),'true');
        await page.locator('#image-next').click();
        assert.equal(await page.locator('#image-zoom').getAttribute('aria-pressed'),'false');
        await page.locator('[data-close=image-dialog]').click();
        await page.locator('#language').click();
        assert.equal(await page.locator('html').getAttribute('lang'),'en');
      }
      assert.deepEqual(errors,[],'Client-side exceptions at '+width+'px');
      console.log('PASS: Chromium viewport '+width+'px; portrait '+metrics.portraitWidth+'px, document '+metrics.documentWidth+'px');
      await page.close();
    }
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
