const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts = ['measurement.js','app.js','experience.js'].map(n=>fs.readFileSync(path.join(root,n),'utf8'));
function boot(success=true) {
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError', e=>errors.push(e));
  const dom=new JSDOM(html,{url:'https://rv-u.tech/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:false});
  w.HTMLElement.prototype.scrollTo=function({left}) {this.scrollLeft=left;this.dispatchEvent(new w.Event('scroll'));};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.HTMLElement.prototype.setPointerCapture=function(){};
  w.HTMLElement.prototype.hasPointerCapture=()=>false;
  w.requestAnimationFrame=fn=>{fn();return 1;};
  let requests=[];
  const navigations=[];
  const originalAnchorClick=w.HTMLAnchorElement.prototype.click;
  w.HTMLAnchorElement.prototype.click=function(){
    if(this.href.startsWith('https://wa.me/')){navigations.push(this.href);return;}
    return originalAnchorClick.call(this);
  };
  w.fetch=async(url,options)=>{
    requests.push({url,body:Object.fromEntries(new URLSearchParams(options.body)),options});
    return{ok:success};
  };
  const events=[],clarityEvents=[];
  d.addEventListener('rvu:interaction',e=>events.push(e.detail));
  w.clarity=(...args)=>clarityEvents.push(args);
  scripts.forEach(code=>w.eval(code));
  return {dom,w,d,errors,requests,navigations,events,clarityEvents};
}
(async()=>{
  const {dom,w,d,errors,requests,navigations,events,clarityEvents}=boot();
  const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);
  assert.equal(new Set(ids).size,ids.length,'IDs must be unique');
  assert.equal(d.querySelectorAll('h1').length,1);
  assert.equal(d.querySelectorAll('img[src^="./assets/ramez-medhat-480.webp"]').length,1);
  assert(!html.includes('IBM+Plex+Mono:wght'),'No redundant monospaced Google Font request');
  assert(fs.readFileSync(path.join(root,'measurement.js'),'utf8').includes('requestIdleCallback'));
  assert.match(d.querySelector('.hero-lead').textContent,/اتعلن رسميا/);
  assert.match(d.querySelector('.hero-lead').textContent,/التقديم للانترفيو مفتوح/);
  assert.equal(d.querySelector('.history-next p').textContent,'التقديم مفتوح الآن');
  assert(!/بجهز للدفعة الثانية|الإعلان ١ نوفمبر|Official announcement on 1 November|Coming next · announcement/.test(html),'No future-announcement copy in launch content');
  assert.match(d.querySelector('meta[name=description]').content,/التقديم مفتوح الآن/);
  assert.match(d.querySelector('meta[property="og:title"]').content,/Applications Open/);
  const portraitHeading=d.querySelector('.mentor-cover .cover-top .mono');
  assert(portraitHeading,'Mentor card heading exists');
  assert.equal(portraitHeading.textContent.trim(),'RVU MENTORSHIP · ONLINE BUG BOUNTY CAMP');
  assert.equal(d.querySelector('.mentor-cover .cover-top').getAttribute('dir'),'ltr');
  assert.equal(d.querySelectorAll('.hero-camp-label,.hero-camp-label .live-dot').length,0,'Remove duplicate hero badge and glow');
  assert.equal(d.querySelectorAll('.mentor-cover .cover-top .live-dot').length,0,'Portrait heading must not have a glowing dot');
  const styles=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  assert.match(styles,/\.mentor-cover \.cover-top\s*\{[\s\S]*?justify-content:center;/);
  assert.match(styles,/\.mentor-cover \.cover-top \.mono\s*\{[\s\S]*?background:none;/);
  assert(!styles.includes('Standalone hero label:'),'Retired hero badge styles must be gone');
  assert.equal(d.querySelectorAll('#application-ready,#save-title,#save-status,#edit-application,#application-whatsapp').length,0,'Private save UI was removed');
  assert.equal(d.querySelectorAll('.brand-wordmark .brand-name').length,1);
  assert.equal(d.querySelectorAll('.brand-wordmark .brand-light').length,1);
  assert([...d.querySelectorAll('a[href^="https://wa.me/"]')].every(a=>new URL(a.href).pathname==='/201012809358'),'Every static WhatsApp link must use the current number');
  assert.match(d.querySelector('meta[name=robots]').content,/^index,follow/);
  for(const a of d.querySelectorAll('a[href^="#"]')) assert(d.getElementById(a.hash.slice(1)),`Missing anchor ${a.hash}`);
  for(const el of d.querySelectorAll('img[src],script[src],link[rel=stylesheet],a[download]')) {
    const value=el.getAttribute('src')||el.getAttribute('href');
    if(!value||/^https?:/.test(value))continue;
    const resolved=path.join(root,new URL(value,w.location.href).pathname);
    assert(fs.existsSync(resolved),`Missing asset ${value}`);
  }
  assert.deepEqual([...d.querySelectorAll('#gallery-track>[data-kind]')].map(x=>x.dataset.kind),['videos','videos','videos','videos']);
  assert.equal(d.querySelectorAll('#reports-track [data-image]').length,6);
  const approvedLessons=['xZR5-4iXnI0','0O1a8Uv2RIs','CZx_WauYbcI','FDWt0pSoFTA'];
  const lessonButtons=[...d.querySelectorAll('#gallery-track button[data-video]')];
  assert.deepEqual(lessonButtons.map(el=>el.dataset.video),approvedLessons);
  assert.equal(lessonButtons[2].dataset.title,'Find Logic Vulns');
  assert.equal(lessonButtons[2].closest('.media-card').querySelector('.gallery-card-info h3').textContent,'Find Logic Vulns');
  const posterPaths=['api','jwt','solving-labs','account-testing'];
  lessonButtons.forEach((button,i)=>{
    const poster=button.querySelector('img');
    assert(poster&&poster.getAttribute('src').includes('rvu-video-'+posterPaths[i]+'.webp'));
    assert.equal(poster.getAttribute('loading'),'lazy');
    assert(fs.statSync(path.join(root,'assets','rvu-video-'+posterPaths[i]+'.webp')).size<140000);
    assert.equal(button.closest('.gallery-card').querySelector('.gallery-card-info a').href,
      'https://www.youtube.com/watch?v='+approvedLessons[i]);
  });
  for(let i=1;i<=6;i++){
    assert(fs.existsSync(path.join(root,`poc-0${i}-full.webp`)),'Optimized screenshot '+i+' exists');
    assert(fs.statSync(path.join(root,`poc-0${i}-full.webp`)).size<fs.statSync(path.join(root,`poc-0${i}.png`)).size,'Optimized screenshot saves bandwidth');
  }
  assert(fs.existsSync(path.join(root,'assets/ramez-medhat-640.webp')));
  const screenshotDimensions=[[960,271],[383,720],[960,275],[392,720],[387,720],[515,720]];
  const screenshots=[...d.querySelectorAll('#reports-track .research-image img')];
  assert.equal(screenshots.length,6);
  screenshots.forEach((img,i)=>{
    assert.equal(Number(img.width),screenshotDimensions[i][0]);
    assert.equal(Number(img.height),screenshotDimensions[i][1]);
    assert.equal(img.getAttribute('loading'),'lazy');
    assert.equal(img.getAttribute('fetchpriority'),'low');
  });
  assert.equal(d.querySelectorAll('link[rel="stylesheet"][href*="styles.min.css"]').length,1);
  assert(!d.querySelector('link[rel="stylesheet"][href*="styles.css"]'));
  assert(!d.documentElement.hasAttribute('data-saver'),'No alternative data-saver mode');
  assert.equal(d.querySelectorAll('#voices,.student-voices,.reviews-grid,.review-tile,.demo-label').length,0,'Sample student reviews must remain absent from the rendered page');
  assert(html.includes('RVU STUDENT REVIEWS DISABLED'),'Retain commented-out testimonials for future replacement');
  assert.equal((html.match(/class="review-tile"/g)||[]).length,3,'Keep all three sample cards in the HTML comment');
  assert(!d.querySelector('#gallery-track .review-tile'));
  assert.equal(d.querySelector('.edition-number').textContent,'1 / 11');
  assert.equal(d.querySelector('.edition-number').getAttribute('datetime'),'2026-11-01');
  assert.equal(d.querySelector('.edition-note span[data-en]').textContent,'الدفعة الثانية · موعد البداية');
  assert.equal(d.querySelector('.edition-note strong').textContent,'التقديم مفتوح الآن');
  assert.equal(d.querySelectorAll('summary .ui-toggle').length,d.querySelectorAll('details').length);
  assert.equal(d.querySelectorAll('.close-button.ui-close').length,3);
  assert.equal(d.querySelectorAll('.close-button').length,3);
  assert(d.querySelector('.signature-title img'));
  assert.equal(d.querySelector('.signature-footer img').getAttribute('loading'),'lazy');
  assert.equal(d.querySelectorAll('[data-en] [data-en]').length,0);
  for(const summary of d.querySelectorAll('summary'))assert(!summary.hasAttribute('data-en'),'Translation must not erase icons');

  assert.equal(d.querySelectorAll('a[href$=".png"]:not(#image-original)').length,0,'No unexpected direct PNG downloads');
  assert.equal(d.querySelectorAll('a#image-original[href$=".png"]').length,1,'Full-fidelity evidence remains accessible on demand');
  assert.equal(d.querySelectorAll('#curriculum details').length,6);
  assert.equal(d.querySelectorAll('.week-practice,.week-output').length,0);
  assert.equal(d.querySelectorAll('#outcomes .outcomes-list article').length,6);
  assert.equal(d.querySelectorAll('#fit .fit-columns article').length,2);
  assert.equal(d.querySelectorAll('img[src^="./assets/ramez-medhat-480.webp"]').length,1);
  assert.equal(d.querySelectorAll('#readiness,#gallery-help,#gallery-position,.cover-edition').length,0);
  assert(!d.querySelector('#curriculum').textContent.includes('السيشن'));
  assert(!d.body.textContent.includes('موعد أول سيشن'));
  assert(!d.body.textContent.includes('٤–٦'));
  assert(!d.body.textContent.includes('اضغط + لقراءة'));
  assert(!d.querySelector('#research .section-heading > p'));
  assert.equal(d.querySelector('#research h2').textContent,'جزء من شغلي');
  assert.match(d.querySelector('#mentorship').textContent,/5 لـ 7/);
  assert.match(d.querySelector('.camp-price').textContent,/4000/);
  assert(!d.querySelector('.camp-price').closest('details'));
  assert.match(d.querySelector('.camp-summary').textContent,/11 لـ 13/);
  assert(!d.querySelector('.facts,.week-preview'));
  assert.equal(d.querySelectorAll('.offline-cohorts li').length,3);
  assert.equal(d.querySelectorAll('.outcome-example').length,6);
  assert(d.querySelector('.capstone-note'));
  assert(!d.querySelector('a[href*="/labs"],#labs,#lab-challenge,[data-step],[data-answer]'));
  assert(!/RVU LABS|rvu-commerce/.test(html));
  for(const old of ['labs','test','submit.html','submit.js','submit.css','legacy-redirect.js','not-found.js'])assert(!fs.existsSync(path.join(root,old)),`Retired asset remains: ${old}`);
  assert([...d.querySelectorAll('#resources a')].every(a=>new URL(a.href).pathname.endsWith('.pdf')));
  assert.equal(d.querySelectorAll('[data-pdf-guide]').length,3);
  [...d.querySelectorAll('[data-pdf-guide]')].forEach(a=>assert(a.href.endsWith(a.dataset.pdfGuide+'-ar.pdf')));
  assert.match(d.querySelector('.hero-problem').textContent,/الأساسيات/);
  assert(d.querySelector('h1 bdi'));
  assert.match(d.querySelector('h1').textContent,/الـ Target/);
  [...d.querySelectorAll('[data-apply]')].forEach(b=>assert.match(b.textContent,/للانترفيو/));
  assert(!/[\u064b-\u065f\u0670]/.test(d.body.textContent));
  assert(fs.readFileSync(path.join(root,'assets/ramez-signature.svg'),'utf8').includes('<title>Ramez Medhat</title>'));

  assert(d.querySelector('#workbench .feedback-disclosure'),'Feedback must be inside work samples');
  assert(d.querySelector('.legal').textContent.includes('١٧٥'));
  const price=[...d.querySelectorAll('.faq-list details')].find(x=>x.textContent.includes('٤٠٠٠'));
  assert(price&&!price.open,'Price is inside a closed FAQ');
  d.getElementById('language').click();
  assert.equal(d.documentElement.lang,'en');assert.equal(d.documentElement.dir,'ltr');
  assert.match(d.querySelector('.hero-lead').textContent,/applications for the free interview are open now/i);
  assert.equal(d.querySelector('.history-next p').textContent,'Applications are open now');
  assert.equal(d.querySelector('.mentor-cover .cover-top .mono').textContent.trim(),'RVU MENTORSHIP · ONLINE BUG BOUNTY CAMP');
  [...d.querySelectorAll('[data-pdf-guide]')].forEach(a=>assert(a.href.endsWith(a.dataset.pdfGuide+'-en.pdf')));
  assert.match(d.querySelector('.camp-price').textContent,/4,000 EGP/);
  [...d.querySelectorAll('[data-resource]')].forEach(x=>assert.match(x.href,/-en\.pdf$/));
  assert.match(d.querySelector('.hero h1').textContent,/Understand/);
  assert(d.querySelector('.signature-title img'),'Translation must retain signature');
  assert.equal(d.querySelector('.edition-number').textContent,'1 / 11');
  assert.equal(d.querySelectorAll('summary .ui-toggle').length,d.querySelectorAll('details').length);

  d.querySelector('[data-work=report]').click();assert.match(d.getElementById('work-content').textContent,/reproducible/);
  d.getElementById('language').click();assert.equal(d.documentElement.dir,'rtl');
  assert.match(d.getElementById('work-content').textContent,/تقرير/);
  d.querySelector('[data-video="xZR5-4iXnI0"]').click();
  assert(d.getElementById('video-dialog').open);
  assert.match(d.querySelector('#video-mount iframe').src,/youtube-nocookie.com\/embed\/xZR5-4iXnI0/);
  d.getElementById('video-dialog').close();assert.equal(d.getElementById('video-mount').children.length,0);
  for(const id of ['CZx_WauYbcI','FDWt0pSoFTA']){
    d.querySelector('#gallery-track [data-video="'+id+'"]').click();
    assert(d.getElementById('video-dialog').open);
    assert(d.querySelector('#video-mount iframe').src.includes('youtube-nocookie.com/embed/'+id));
    assert(d.getElementById('video-link').href.endsWith('watch?v='+id));
    d.getElementById('video-dialog').close();
  }
  d.querySelector('[data-image="0"]').click();assert(d.getElementById('image-dialog').open);
  assert.match(d.getElementById('gallery-full-image').src,/poc-01-full\.webp$/);
  assert.match(d.getElementById('image-original').href,/poc-01\.png$/);
  const stage=d.getElementById('image-stage'),zoom=d.getElementById('image-zoom');
  assert(!stage.classList.contains('is-zoomed'));
  zoom.click();assert(stage.classList.contains('is-zoomed'));
  assert.equal(zoom.getAttribute('aria-pressed'),'true');
  d.getElementById('image-next').click();assert.match(d.getElementById('gallery-full-image').src,/poc-02-full\.webp$/);
  assert.match(d.getElementById('image-original').href,/poc-02\.png$/);
  assert(!stage.classList.contains('is-zoomed'),'Zoom must reset when changing report');
  assert.equal(zoom.getAttribute('aria-pressed'),'false');
  d.getElementById('image-dialog').close();assert(!d.getElementById('gallery-full-image').hasAttribute('src'));
  d.getElementById('menu-toggle').click();assert.equal(d.getElementById('menu-toggle').getAttribute('aria-expanded'),'true');
  d.querySelector('#navigation a').click();assert.equal(d.getElementById('menu-toggle').getAttribute('aria-expanded'),'false');
  d.querySelector('[data-apply]').click();assert(d.getElementById('apply-dialog').open);
  const form=d.getElementById('application-form');
  form.elements.name.value='QA Example';
  form.elements.phone.value='٠١٠١٢٣٤٥٦٧٨';
  form.elements.level.value='basics';
  form.elements.goal.value='Practice systematic testing';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(r=>setTimeout(r,5));
  assert.equal(requests.length,1);
  assert.equal(requests[0].body.phone,'+201012345678');
  assert.equal(requests[0].url,'https://formspree.io/f/xoeqykpq');
  assert.equal(requests[0].options.keepalive,true,'The save request must support navigation');
  assert.match(requests[0].options.headers['Content-Type'],/^application\/x-www-form-urlencoded/);
  assert.equal(navigations.length,1,'Immediate WhatsApp navigation');
  assert.equal(new URL(navigations[0]).hostname,'wa.me');
  assert.equal(new URL(navigations[0]).pathname,'/201012809358');
  assert(new URL(navigations[0]).searchParams.get('text').includes('QA Example'));
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(requests.length,1,'Duplicate submit suppressed');
  assert.equal(navigations.length,1,'Duplicate WhatsApp navigation suppressed');
  assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
  assert(events.every(e=>Object.keys(e).join(',')==='event'));
  assert(clarityEvents.every(args=>args.length===2&&args[0]==='event'&&typeof args[1]==='string'));
  dom.window.close();

  const bad=boot(false),bf=bad.d.getElementById('application-form');
  bf.elements.name.value='QA';
  bf.elements.phone.value='+201012345678';
  bf.elements.level.value='basics';
  bf.elements.goal.value='Test';
  bf.dispatchEvent(new bad.w.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(r=>setTimeout(r,5));
  assert.equal(bad.requests.length,1);
  assert.equal(bad.navigations.length,1,'WhatsApp available even when Formspree responds with an error');
  assert(!bad.d.getElementById('application-ready'));
  bad.dom.window.close();

  for(const [country,local,expected] of [
    ['+966','0551234567','+966551234567'],
    ['+971','0501234567','+971501234567'],
    ['','+447700900123','+447700900123']
  ]) {
    const test=boot(),tf=test.d.getElementById('application-form');
    test.d.getElementById('phone-country').value=country;
    tf.elements.name.value='Regional QA';tf.elements.phone.value=local;
    tf.elements.level.value='basics';tf.elements.goal.value='Example';
    tf.dispatchEvent(new test.w.Event('submit',{bubbles:true,cancelable:true}));
    await new Promise(r=>setTimeout(r,5));
    assert.equal(test.requests[0].body.phone,expected);
    assert.equal(test.navigations.length,1);
    assert.equal(test.errors.length,0);test.dom.window.close();
  }
  for(const mode of ['uuid-fallback','analytics-failure','network-rejection','sync-fetch-error','network-stall']) {
    const test=boot(),tf=test.d.getElementById('application-form');
    if(mode==='uuid-fallback')test.w.crypto.randomUUID=undefined;
    if(mode==='analytics-failure')test.w.rvuTrack=()=>{throw new Error('Analytics unavailable');};
    if(mode==='network-rejection')test.w.fetch=()=>Promise.reject(new Error('Offline'));
    if(mode==='sync-fetch-error')test.w.fetch=()=>{throw new Error('Unsupported API');};
    if(mode==='network-stall')test.w.fetch=()=>new Promise(()=>{});
    tf.elements.name.value='Compatibility QA';tf.elements.phone.value='+201012345678';
    tf.elements.level.value='basics';tf.elements.goal.value='Example';
    tf.dispatchEvent(new test.w.Event('submit',{bubbles:true,cancelable:true}));
    await new Promise(r=>setTimeout(r,5));
    assert.equal(test.navigations.length,1,mode+' should not block WhatsApp');
    if(mode==='uuid-fallback')assert.match(test.requests[0].body.submission_id,/^[a-f0-9]{32}$/);
    assert.equal(test.errors.length,0,mode);
    test.dom.window.close();
  }
  console.log('PASS: content structure, bilingual UI, assets, mobile-oriented markup, navigation, privacy, immediate WhatsApp, keepalive Formspree POST, failure handling, duplicate prevention and international numbers. No actual submissions.');
})().catch(e=>{console.error(e);process.exit(1);});
