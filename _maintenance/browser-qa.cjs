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
      await page.route('**/*',route=>{
        const url=route.request().url();
        const portrait='https://d2ol7oe51mr4n9.cloudfront.net/user_3JUngcUhRYYa2eBXLpGvHnUaQyO/62b3565b-2cb2-45c3-b47a-654990b640cc.png';
        return url.startsWith(base)||url===portrait?route.continue():route.abort();
      });
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
        assert(new URL(page.url()).pathname==='/viewer.html','Dedicated report page did not open');
        await page.waitForFunction(()=>document.getElementById('full-image').naturalWidth>0);
        assert(/poc-01-full\.webp/.test(await page.locator('#full-image').getAttribute('src')));
        assert.equal(await page.locator('#close-viewer').evaluate(el=>Math.round(el.getBoundingClientRect().left)<window.innerWidth/3),true,'Close X must be top left');
        await page.locator('#zoom-in').click();
        assert(await page.locator('#zoom-level').textContent()!=='100%','Image zoom must work');
        if(width===390){
          const gesture=await page.evaluate(()=>{
            if(typeof Touch!=='function'||typeof TouchEvent!=='function')return {supported:false};
            const stage=document.getElementById('image-surface'),img=document.getElementById('full-image');
            const pt=(id,x,y)=>new Touch({identifier:id,target:stage,clientX:x,clientY:y});
            const emit=(type,touches,changed)=>stage.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:changed}));
            const a=pt(1,100,400),b=pt(2,180,400),c=pt(1,60,400),d=pt(2,220,400);
            emit('touchstart',[a,b],[a,b]);
            emit('touchmove',[c,d],[c,d]);
            emit('touchend',[],[c,d]);
            const percent=Number(document.getElementById('zoom-level').textContent.replace('%',''));
            const before=img.style.transform;
            const finger=pt(3,190,430),next=pt(3,255,430);
            emit('touchstart',[finger],[finger]);
            emit('touchmove',[next],[next]);
            emit('touchend',[],[next]);
            return {supported:true,percent,moved:img.style.transform!==before};
          });
          if(gesture.supported){
            assert(gesture.percent>=250,'Pinch to zoom failed: '+JSON.stringify(gesture));
            assert(gesture.moved,'Touch drag after pinch failed: '+JSON.stringify(gesture));
          }
        }

        await page.locator('#close-viewer').click();
        await page.waitForURL(url=>url.pathname==='/');
      }
      await page.locator('#language').click();
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
      assert.equal(await page.locator('#voices h2').textContent(),'Feedback from the fourth camp');
      assert.equal(await page.locator('#voices blockquote').first().getAttribute('lang'),'en');
      assert.equal(await page.locator('#voices blockquote').first().getAttribute('dir'),'ltr');
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
