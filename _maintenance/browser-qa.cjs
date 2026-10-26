'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.ico':'image/x-icon','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
  try{
    const uri=new URL(req.url,'http://127.0.0.1');
    const raw=decodeURIComponent(uri.pathname);
    const target=path.resolve(root,'.'+raw+(raw.endsWith('/')?'index.html':''));
    if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    fs.readFile(target,(err,buf)=>{
      if(err){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(buf);
    });
  }catch(e){res.writeHead(400);res.end();}
});
(async()=>{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+server.address().port;
  const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
  assert(executablePath,'Headless Chrome/Chromium is required');
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const configs=[[320,720],[360,780],[390,844],[430,932],[540,860],[600,960],[768,1024],[800,1280],[820,1180],[850,1000],[900,1180],[1024,768],[1100,800],[1280,800],[1440,900],[1920,1080]];
  try{
    for(const pair of configs){
      const width=pair[0],height=pair[1],page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
      await page.goto(base+'/?layout-review=1',{waitUntil:'domcontentloaded'});
      await page.locator('.cover-portrait img').waitFor();
      await page.waitForFunction(()=>document.querySelector('.cover-portrait img').complete);
      const info=await page.evaluate(()=>{
        const picture=document.querySelector('.cover-portrait img');
        const hero=document.querySelector('.mentor-cover').getBoundingClientRect();
        const reportTitle=document.querySelector('#research h2');
        return {
          full:document.documentElement.scrollWidth,
          viewport:window.innerWidth,
          portraitLoaded:picture.naturalWidth>0,
          heroLeft:hero.left,heroRight:hero.right,
          title:getComputedStyle(reportTitle).fontSize,
          tag:getComputedStyle(document.querySelector('#mentorship .rhythm-list article>span')).fontSize,
          topBorder:getComputedStyle(document.querySelector('#journey')).borderTopWidth
        };
      });
      assert(info.full<=width+3,'Horizontal overflow at '+width+'px '+JSON.stringify(info));
      assert(info.portraitLoaded,'Portrait missing at '+width);
      assert(info.heroLeft>=-3 && info.heroRight<=width+3,'Hero card clipped at '+width);
      assert.equal(info.topBorder,'0px','No border above camp statistics');
      assert(parseFloat(info.tag)>=12.5,'Tiny session labels at '+width);
      assert.equal(await page.locator('#voices h2').textContent(),'بعض الآراء من الكامب الرابع');
      assert.equal(await page.locator('#reports-track .research-card').count(),6);
      assert.equal(await page.locator('#research .reports-footer .gallery-arrows button').count(),2);
      assert.equal(await page.locator('#image-original,#image-zoom').count(),0);
      if([320,390,800,1280].includes(width)){
        await page.locator('#reports-track [data-image="0"]').click();
        assert(await page.locator('#image-dialog').evaluate(el=>el.open),'Image dialog did not open');
        await page.waitForFunction(()=>document.querySelector('#gallery-full-image').naturalWidth>0);
        assert(/poc-01-full\.webp/.test(await page.locator('#gallery-full-image').getAttribute('src')));
        await page.locator('#image-dialog [data-close]').click();
        assert.equal(await page.locator('#image-dialog').evaluate(el=>el.open),false);
      }
      await page.locator('#language').click();
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
      assert.equal(await page.locator('#voices h2').textContent(),'Feedback from the fourth camp');
      let englishWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert(englishWidth<=width+3,'English horizontal overflow '+width);
      await page.locator('#language').click();
      if([320,800,1280].includes(width)){
        const btn=page.locator('[data-apply]:visible').first();
        await btn.click();
        assert(await page.locator('#apply-dialog').evaluate(d=>d.open),'Application dialog did not open');
        let modal=await page.locator('#apply-dialog').evaluate(d=>{let r=d.getBoundingClientRect();return {left:r.left,right:r.right,scroll:d.scrollWidth,client:d.clientWidth};});
        assert(modal.left>=-3&&modal.right<=width+3&&modal.scroll<=modal.client+3,'Form layout overflow '+width+': '+JSON.stringify(modal));
        await page.locator('#apply-dialog [data-close]').click();
        if(width<=850){
          await page.locator('#menu-toggle').click();
          assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
          await page.locator('#menu-toggle').click();
          assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
        }
      }
      assert.deepEqual(errors,[],'JS error at '+width);
      console.log('PASS: responsive Chromium '+width+'x'+height+' AR/EN; session label '+info.tag);
      await page.close();
    }
  }finally{
    await browser.close();
    await new Promise(ok=>server.close(ok));
  }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
