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
      if ([390,850,1440].includes(width)) {
        const styles=await page.evaluate(()=>{
          const roles=document.querySelector('.cover-roles');
          const underline=getComputedStyle(roles.querySelector('span'),'::after');
          const grid=document.querySelector('.student-feedback-grid');
          const rect=selector=>document.querySelector(selector).getBoundingClientRect();
          const gaps={
            bioToAnnouncement:rect('.hero-introduction').top-rect('.cover-bio').bottom,
            announcementToBanner:rect('.application-open-banner').top-rect('.hero-introduction').bottom,
            bannerToApplication:rect('.hero-actions').top-rect('.application-open-banner').bottom
          };
          const nav=document.querySelector('.hero-quick-links');
          const items=[...nav.querySelectorAll('.hero-quick-link')];
          const links=items.map(el=>{
            const rect=el.getBoundingClientRect();
            const shape=el.querySelector('.hero-quick-shape');
            const box=shape.getBoundingClientRect(),style=getComputedStyle(shape);
            return {href:el.getAttribute('href'),center:rect.left+rect.width/2,width:box.width,height:box.height,
              radius:style.borderRadius,background:style.backgroundColor,color:style.color};
          });
          const reviewsLink=document.querySelector('.hero-quick-link-reviews');
          const reports=document.querySelector('#reports-track');
          const reportCards=[...reports.querySelectorAll('.research-card')];
          const title=document.querySelector('.hero-visual-unified > .cover-top').getBoundingClientRect();
          const portraitCard=document.querySelector('.mentor-cover').getBoundingClientRect();
          const bar=document.querySelector('#reports-scrollbar');
          return {externalTitleAbovePhoto:title.bottom<=portraitCard.top+1,
            sloganAbsent:!document.querySelector('.cover-name > .eyebrow'),
            centeredCohort:getComputedStyle(document.querySelector('.application-open-label')).textAlign==='center',
            cohortText:document.querySelector('.application-open-label').textContent,
            reportShelf:{display:getComputedStyle(reports).display,maxScroll:reports.scrollWidth-reports.clientWidth,
              cardWidth:reportCards[0].getBoundingClientRect().width,trackWidth:reports.getBoundingClientRect().width,
              cardCount:reportCards.length,rangeVisible:bar.getBoundingClientRect().width>0,
              rangeMax:bar.max,rangeType:bar.type},
            roleCount:roles.querySelectorAll('span').length,
            borderStyle:getComputedStyle(roles).borderBottomStyle,
            underlineHeight:underline.height,
            columns:getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
            reviews:grid.querySelectorAll('.student-feedback-card').length,
            ghada:grid.lastElementChild.querySelector('h3').textContent,
            removedCapacity:!document.querySelector('.cohort-capacity'),
            quickLinks:links,
            reviewsJumpLabel:reviewsLink.querySelector('.hero-quick-pill [data-en="Reviews"]').textContent,
            reviewsArrow:reviewsLink.querySelector('.hero-quick-arrow').textContent,
            noQuote:!nav.textContent.includes('“')&&!nav.textContent.includes('”'),
            deletedBlocks:!document.querySelector('.hero-benefits-inline,.hero-lead-followup'),
            bannerNextIsApplication:document.querySelector('.application-open-banner').nextElementSibling.classList.contains('hero-actions'),
            gaps,
            bioAccent:getComputedStyle(document.querySelector('.bio-name')).color,
            bioRegular:getComputedStyle(document.querySelector('.cover-bio-copy p')).color,
            goalUnderline:(()=>{const line=getComputedStyle(document.querySelector('.cover-bio-goal'),'::after');return {content:line.content,display:line.display};})()};
        });
        assert.equal(styles.roleCount,3,'Profile must show all three career titles');
        assert(styles.externalTitleAbovePhoto,'RVU camp title must be above the portrait card');
        assert(styles.sloganAbsent,'Old step-by-step slogan must be removed under portrait');
        assert(styles.centeredCohort,'Fifth cohort label must be centered');
        assert.equal(styles.cohortText,'الدفعة الخامسة');
        assert.equal(styles.reportShelf.display,'flex','Reports must be placed in one horizontal row');
        assert.equal(styles.reportShelf.cardCount,6);
        assert(styles.reportShelf.maxScroll>100,'Reports must have horizontal overflow for swiping');
        assert(styles.reportShelf.rangeVisible,'Interactive progress bar must be visible');
        assert.equal(styles.reportShelf.rangeType,'range');
        assert.equal(styles.reportShelf.rangeMax,'1000');
        if(width===390)assert(styles.reportShelf.cardWidth<styles.reportShelf.trackWidth,
          'Mobile must show part of next report as a swipe hint');
        assert.equal(styles.borderStyle,'solid','Profile credentials require an underline');
        assert.equal(styles.underlineHeight,'2px','Each career title has a clear orange underline');
        assert.equal(styles.reviews,3,'All three genuine student reviews are published');
        assert.equal(styles.ghada,'Ghada Abdelrahman');
        assert.equal(styles.columns,width===1440?3:width===850?2:1,
          'Three reviews must fit a responsive grid at '+width+'px');
        assert(styles.removedCapacity,'Deleted cohort stat strip must not render');
        assert.deepEqual(styles.quickLinks.map(l=>l.href),
          ['https://www.linkedin.com/in/ramez-medhat-rvu/','#voices','#research']);
        assert(styles.quickLinks[0].center>styles.quickLinks[1].center&&styles.quickLinks[1].center>styles.quickLinks[2].center,
          'LinkedIn right, reviews centered and reports left at '+width+'px');
        assert.equal(styles.reviewsJumpLabel,'الآراء');
        assert.equal(styles.reviewsArrow,'↓');
        assert(styles.noQuote,'Reviews pill must not display quotation marks');
        assert(styles.quickLinks.every(l=>l.color==='rgb(255, 138, 18)'&&l.background==='rgb(8, 9, 11)'),
          'All three controls must be dark with bright orange content');
        assert(styles.quickLinks.every(l=>l.width>40&&l.width<135),
          'All three quick links must fit responsively');
        assert(Math.abs(styles.quickLinks[0].width-styles.quickLinks[0].height)<1);
        assert(Math.abs(styles.quickLinks[2].width-styles.quickLinks[2].height)<1);
        assert(styles.quickLinks[1].width>styles.quickLinks[1].height,
          'Reviews control must be oval rather than circular');
        assert(styles.quickLinks[1].radius==='999px');
        assert(styles.deletedBlocks,'Removed duplicate duration/features must not render');
        assert(styles.bannerNextIsApplication,'Application banner must be immediately above application buttons');
        for(const [name,gap] of Object.entries(styles.gaps))
          assert(gap>=-3&&gap<=38,'Excessive intro vertical gap '+name+' at '+width+'px: '+gap);
        assert.notEqual(styles.bioAccent,styles.bioRegular,'Instructor name has visible highlight color');
        assert(['none','normal'].includes(styles.goalUnderline.content),'Decorative line above thanks must be removed');
        assert.equal(styles.goalUnderline.display,'inline','No decorative block should appear after the camp goal');
      }
      assert.equal(await page.locator('#reports-track .research-image img').first().evaluate(img=>getComputedStyle(img).objectFit),'contain','Report previews must preserve full original image');
      for(const target of ['.hero-copy','.hero-visual','.price-panel','.mentor-cover']){
        const box=await page.locator(target).first().evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}));
        assert(box.left>=-3&&box.right<=width+3,'Out-of-viewport primary content '+target+' at '+width+': '+JSON.stringify(box));
      }
      if(width===390){
        const positionBefore=await page.locator('#reports-track').evaluate(el=>Math.abs(el.scrollLeft));
        await page.locator('#reports-scrollbar').evaluate(el=>{
          el.value='620';
          el.dispatchEvent(new Event('input',{bubbles:true}));
        });
        await page.waitForFunction(()=>Math.abs(document.querySelector('#reports-track').scrollLeft)>80);
        const positionAfter=await page.locator('#reports-track').evaluate(el=>Math.abs(el.scrollLeft));
        assert(positionAfter>positionBefore+50,'Dragging reports slider must move the reports');
        const reviewsLink=page.locator('.hero-quick-link-reviews');
        assert.equal(await reviewsLink.getAttribute('href'),'#voices');
        await reviewsLink.click();
        await page.waitForFunction(()=>location.hash==='#voices');
        assert.equal(await page.locator('#voices .student-feedback-card').count(),3);
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
