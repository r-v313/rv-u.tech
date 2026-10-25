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
    for(const width of [280,320,344,360,375,390,412,430,480,540,600,640,768,820,850,851,900,1024,1100,1280,1440,1920]){
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
        const suspects=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,65):'',id:el.id,left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),client:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX})).filter(x=>(x.right>innerWidth+3||x.left< -3)).slice(0,35));
        const sections=await page.evaluate(()=>[...document.querySelectorAll('html,body,main,header,footer,main>section,.container,.gallery-track')].map(el=>({name:el.tagName.toLowerCase()+'#'+el.id+'.'+(typeof el.className==='string'?el.className.slice(0,30):''),rect:Math.round(el.getBoundingClientRect().width),left:Math.round(el.getBoundingClientRect().left),client:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX})).filter(x=>x.scroll>x.client+2||x.left< -3).slice(0,35));
        console.log('OVERFLOW DIAGNOSTICS',JSON.stringify({width,suspects,sections}));
      }
      assert(metrics.documentWidth<=width+2,'Horizontal overflow at '+width+'px: '+JSON.stringify(metrics));
      assert(metrics.portraitWidth>0,'Portrait failed to load at '+width);
      assert(metrics.logoWidth>0,'Logo failed to load at '+width);
      assert(metrics.cardLeft>=-2&&metrics.cardRight<=width+2,'Portrait card out of viewport at '+width);
      assert.equal(metrics.headingAlign,'center','Portrait heading is not centered');
      assert.equal(metrics.reports,6);
      assert.equal(metrics.ytFrames,0,'YouTube must stay unloaded until interaction');
      assert.equal(await page.locator('#reports-track .research-image img').first().evaluate(img=>getComputedStyle(img).objectFit),'contain','Report previews must preserve full original image');
      for(const target of ['.hero-copy','.hero-visual','.price-panel','.mentor-cover']){
        const box=await page.locator(target).first().evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}));
        assert(box.left>=-3&&box.right<=width+3,'Out-of-viewport primary content '+target+' at '+width+': '+JSON.stringify(box));
      }
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
        await page.locator('[data-close=image-dialog]').click();
        const second=page.locator('#reports-track [data-image="1"]');
        await second.scrollIntoViewIfNeeded();
        await second.click();
        assert.equal(await page.locator('#image-zoom').getAttribute('aria-pressed'),'false');
        assert.match(await page.locator('#gallery-full-image').getAttribute('src'),/poc-02-full\.webp/);
        await page.locator('[data-close=image-dialog]').click();
        await page.locator('#language').click();
        assert.equal(await page.locator('html').getAttribute('lang'),'en');
      }
      if(width!==390) await page.locator('#language').click();
      const en=await page.evaluate(()=>{
        const portrait=document.querySelector('.mentor-cover').getBoundingClientRect();
        return {dir:document.documentElement.dir,lang:document.documentElement.lang,scroll:document.documentElement.scrollWidth,
          portraitLeft:portrait.left,portraitRight:portrait.right,
          imageLabel:document.querySelector('[data-image="0"]').getAttribute('aria-label')};
      });
      assert.equal(en.lang,'en','English locale at '+width);
      assert.equal(en.dir,'ltr');
      assert(en.scroll<=width+2,'English horizontal overflow at '+width+': '+JSON.stringify(en));
      assert(en.portraitLeft>=-2&&en.portraitRight<=width+2,'English cover clipped at '+width);
      assert.match(en.imageLabel,/View account takeover report/);
      await page.emulateMedia({reducedMotion:'reduce',contrast:'more'});
      assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto','Reduced-motion setting respected');
      if([320,390,768,1024].includes(width)){
        await page.evaluate(()=>{document.documentElement.style.fontSize='150%'});
        const scaled=await page.evaluate(()=>document.documentElement.scrollWidth);
        assert(scaled<=width+2,'Font-scaling overflow at '+width+'px: '+scaled);
      }
      if([280,320,390,640,850,1024].includes(width)){
        const applyButton=page.locator('[data-apply]:visible').first();
        await applyButton.click();
        assert(await page.locator('#apply-dialog').evaluate(d=>d.open),'Application dialog opens at '+width);
        const bounds=await page.locator('#apply-dialog').evaluate(d=>{
          const outer=d.getBoundingClientRect();
          return {left:outer.left,right:outer.right,width:outer.width,scroll:d.scrollWidth,client:d.clientWidth,
            fields:[...d.querySelectorAll('input,select,textarea')].map(el=>{
              const b=el.getBoundingClientRect();
              return {name:el.name,left:b.left,right:b.right,width:b.width};
            })};
        });
        assert(bounds.left>=-3&&bounds.right<=width+3,'Application dialog extends outside viewport '+width+': '+JSON.stringify(bounds));
        assert(bounds.scroll<=bounds.client+3,'Application dialog requires horizontal scroll '+width+': '+JSON.stringify(bounds));
        assert(bounds.fields.every(b=>b.width>60&&b.left>=bounds.left-3&&b.right<=bounds.right+3),'Application fields clipped '+width+': '+JSON.stringify(bounds));
        await page.locator('#apply-dialog [data-close]').click();
        if(width<=850){
          const menu=page.locator('#menu-toggle');
          await menu.click();
          assert.equal(await menu.getAttribute('aria-expanded'),'true','Mobile navigation accessible at '+width);
          await menu.click();
          assert.equal(await menu.getAttribute('aria-expanded'),'false','Mobile navigation dismisses at '+width);
        }
      }
      assert.deepEqual(errors,[],'Client-side exceptions at '+width+'px');
      console.log('PASS: Chromium '+width+'px AR+EN, image fidelity, adaptive settings; document '+metrics.documentWidth+'px');
      await page.close();
    }
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
