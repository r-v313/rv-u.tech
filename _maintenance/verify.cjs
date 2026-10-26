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
  assert.equal(d.querySelector('.hero-problem'),null,'Target qualification paragraph must be completely removed');
  assert.equal(d.querySelector('.hero-lead').textContent,'بشكر ربنا على نجاح الدفعة الرابعة من الكامب والأولى أونلاين.. وبعلن عن الدفعة الخامسة من RVU Mentorship Camp والتقديم للانترفيو مفتوح دلوقتي لأي حد حابب يطور من نفسه.');
  assert.equal(d.querySelector('.hero-lead .thanks-oval').textContent,'بشكر ربنا');
  assert.equal(d.querySelectorAll('.hero-lead .thanks-oval').length,1,'Thank-you oval appears once');
  assert.equal(d.querySelector('.hero-lead-followup'),null,'Remove redundant long six-week promise');
  assert.equal(d.querySelector('.hero-benefits-inline'),null,'Remove duplicate duration and personal-mentoring row');
  assert.equal(d.querySelector('.hero-facts-featured'),null,'Removed large hero metric boxes must not return');
  const unifiedHero=d.querySelector('section.hero.hero-unified');
  assert(unifiedHero,'Hero must use one full-width unified card');
  assert.equal(unifiedHero.querySelectorAll('.mentor-cover').length,1);
  assert.equal(unifiedHero.querySelectorAll('.hero-copy').length,1);
  assert.equal(unifiedHero.querySelectorAll('.application-open-banner').length,1);
  const profile=unifiedHero.querySelector('.mentor-cover');
  const ordered=['.cover-portrait','.cover-name','.cover-bio','.hero-copy h1','.hero-lead','.hero-quick-links','.application-open-banner','.hero-actions'];
  const nodes=ordered.map(selector=>profile.querySelector(selector));
  assert(nodes.every(Boolean),'Portrait, biography, story and fifth-cohort CTA must share one card');
  for(let i=1;i<nodes.length;i++)assert(nodes[i-1].compareDocumentPosition(nodes[i]) & w.Node.DOCUMENT_POSITION_FOLLOWING,'Hero sequence: '+ordered[i-1]+' before '+ordered[i]);
  assert.equal(profile.querySelector('.application-open-banner').nextElementSibling.className,'hero-actions','Enrollment banner must sit directly above application controls');
  assert.equal(profile.querySelector('.hero-introduction').nextElementSibling.className,'application-open-banner','The application banner must directly follow the announcement and reviews jump');
  assert.equal(profile.querySelector('.cohort-capacity'),null,'Remove obsolete six-week/twelve-student stat strip');
  const quickNav=profile.querySelector('.hero-quick-links');
  assert(quickNav&&quickNav.closest('.hero-introduction'),'Quick links must sit below the gratitude announcement');
  assert.equal(quickNav.getAttribute('dir'),'rtl','LinkedIn appears on right and reports on left in either language');
  assert.deepEqual([...quickNav.querySelectorAll('a')].map(a=>a.getAttribute('href')),
    ['https://www.linkedin.com/in/ramez-medhat-rvu/','#voices','#research'],
    'Ordered quick links are LinkedIn (right), reviews (center), reports (left)');
  const reviewsJump=quickNav.querySelector('.hero-quick-link-reviews');
  assert.equal(reviewsJump.getAttribute('aria-label'),'الانتقال إلى آراء الطلاب');
  assert.equal(reviewsJump.querySelector('.hero-quick-pill [data-en="Reviews"]').textContent,'الآراء');
  assert.equal(reviewsJump.querySelector('.hero-quick-arrow').textContent,'↓');
  assert(!quickNav.textContent.includes('“')&&!quickNav.textContent.includes('”'),'No quotation icon in the new Reviews pill');
  assert.equal(d.querySelector('a[href="#workbench"]'),null,'Deleted demo anchor and arrow must remain absent');
  assert.equal(d.querySelector('h1').closest('.mentor-cover'),profile,'The main headline follows the instructor profile in the same card');
  assert.equal(d.querySelector('.history-next .history-number').textContent,'05');
  assert.match(d.querySelector('.history-next h3').textContent,/الدفعة الخامسة/);
  assert.match(d.querySelector('.hero-lead').textContent,/الدفعة الخامسة من RVU Mentorship Camp والتقديم للانترفيو مفتوح/);
  assert.match(d.querySelector('title').textContent,/الدفعة الخامسة/);
  assert.equal(d.querySelector('meta[property="og:title"]').content,'RVU Mentorship Camp — Cohort 05 | Applications Open');
  assert(!/الدفعة الثانية|COHORT 02|Cohort 02|cohort 02/.test(html),'Stale overall cohort numbering must not survive');
  assert.equal(d.querySelectorAll('.cohort-capacity').length,0);
  assert.equal(d.querySelector('.mobile-cta > span').textContent,'الدفعة 12 طالب فقط + متابعة 1:1');
  assert.match(d.querySelector('.hero-lead').textContent,/التقديم للانترفيو مفتوح/);
  assert.equal(d.querySelector('.history-next p').textContent,'التقديم مفتوح الآن');
  assert(!/بجهز للدفعة الثانية|الإعلان ١ نوفمبر|Official announcement on 1 November|Coming next · announcement/.test(html),'No future-announcement copy in launch content');
  assert.match(d.querySelector('meta[name=description]').content,/التقديم مفتوح الآن/);
  assert.match(d.querySelector('meta[property="og:title"]').content,/Applications Open/);
  assert(!d.querySelector('.section.mentor'),'Standalone about-me section must be removed');
  assert(!html.includes('05 / A LITTLE ABOUT ME'));
  assert(!html.includes('شوف أربع مقتطفات من شرحي في الكامب'));
  assert(!html.includes('أربع فيديوهات من شرحي في الكامب'));
  const bio=d.querySelector('.mentor-cover .cover-bio#mentor');
  assert(bio,'Instructor biography must be inside the mentor portrait card');
  const bioParagraphs=[...bio.querySelectorAll('.cover-bio-copy p')];
  assert.equal(bioParagraphs.length,2);
  assert.deepEqual(bioParagraphs.map(p=>p.textContent),[
    'أنا Ramez Medhat بدأت رحلتي في Bug Bounty سنة ٢٠٢٢ وقدمت تقارير لـ Public and Private Programs وكمان لـ External Companies جوه وبره مصر وقررت ابني الكامب ده علشان اساعد الشباب اللي حابه المجال ومحتاجه حد يكون معاها خطوة بخطوة لحد ما يبقوا قادرين يكملوا لوحدهم',
    'الهدف من الكامب هو الفهم والتطبيق العملي وكمان هنشتغل Live Hunting مع بعض وهراجع طريقة تفكير كل واحد بنفسي وهيكون في متابعه شخصية مع كل مهندس كل اسبوعين علي الاقل علشان اعرف مستوى تقدمة واعرف ومحتاج ايه بالظبط'
  ],'Approved new instructor biography must remain word for word');
  assert.equal(bioParagraphs[0].querySelector('.bio-name').textContent,'Ramez Medhat','Instructor name must be highlighted');
  assert.equal(bioParagraphs[1].querySelector('.bio-goal-title').textContent,'الهدف من الكامب','The goal headline must be highlighted');
  assert(bioParagraphs[0].querySelector('.bio-name').matches('strong'));
  assert(bioParagraphs[1].querySelector('.bio-goal-title').matches('strong'));
  assert.equal(bioParagraphs[1].className,'cover-bio-goal','Preserve the goal paragraph without the former divider');
  assert(!bio.textContent.includes('قدمت ٣ كامبات أوفلاين وكامب أونلاين'),'Retired instructor biography must not return');
  const profileLink=quickNav.querySelector('.hero-quick-linkedin');
  assert(profileLink&&profileLink.href==='https://www.linkedin.com/in/ramez-medhat-rvu/');
  assert.equal(profileLink.getAttribute('target'),'_blank');
  assert.equal(profileLink.getAttribute('rel'),'noopener noreferrer');
  const reportsLink=quickNav.querySelector('.hero-quick-reports');
  assert(reportsLink&&reportsLink.getAttribute('href')==='#research');
  assert.equal(d.querySelectorAll('.hero-quick-link svg[aria-hidden=true]').length,2);
  assert.equal(bio.querySelector('.cover-bio-links'),null,'Old LinkedIn/reports buttons must not stay beside the biography');
  const titleAboveCard=d.querySelector('.hero-visual-unified > .cover-top');
  const portraitHeading=titleAboveCard?.querySelector('.mono');
  assert(portraitHeading,'Camp heading must sit above the entire mentor card');
  assert.equal(portraitHeading.textContent.trim(),'RVU MENTORSHIP · ONLINE BUG BOUNTY CAMP');
  assert.equal(titleAboveCard.getAttribute('dir'),'ltr');
  assert(titleAboveCard.compareDocumentPosition(d.querySelector('.mentor-cover')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(d.querySelector('.mentor-cover .cover-top'),null,'Heading must not be inside the photo card');
  assert.equal(d.querySelector('.cover-name > .eyebrow'),null,'Remove redundant step-by-step slogan under portrait');
  assert.equal(d.querySelectorAll('.hero-camp-label,.hero-camp-label .live-dot').length,0,'Remove duplicate hero badge and glow');
  assert.equal(d.querySelectorAll('.hero-visual-unified > .cover-top .live-dot').length,0,'External camp heading must not have a glowing dot');
  const styles=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  assert(!styles.includes('.hero.hero-unified .cover-bio-copy p.cover-bio-goal::after'),'Line above the thank-you message must be removed');
  assert(!styles.includes('.hero.hero-unified .hero-benefits-inline span::before'),'The two orange dots under the intro must be removed');
  assert(!styles.includes('border-bottom:1px solid #34363c;'),'Mentor biography divider must be removed');
  assert(!styles.includes('.hero.hero-unified .hero-problem{'),'Deleted target paragraph must not retain hero-specific CSS');
  assert.match(styles,/\.hero\.hero-unified \.hero-lead \.thanks-oval\s*\{/,'Oval thank-you label must be styled');
  assert.match(styles,/\.hero\.hero-unified \.hero-quick-pill\s*\{/,'Reviews link must be an oval black and orange control');
  assert.match(styles,/\.hero\.hero-unified \.hero-quick-shape\s*\{/,'Side links must be black and orange circles');
  assert(!styles.includes('.cohort-capacity'),'Removed cohort stat strip must not retain CSS');
  assert(!styles.includes('.hero.hero-unified .hero-lead-followup'),'Deleted paragraph CSS must not remain');
  assert(!styles.includes('.hero.hero-unified .hero-benefits-inline'),'Deleted standalone feature row CSS must not remain');
  assert.match(styles,/\.hero\.hero-unified \.cover-bio-copy \.bio-accent\s*\{/,'Highlighted biography labels must be styled');
  assert.deepEqual([...d.querySelectorAll('.mentor-cover .cover-roles span')].map(x=>x.textContent),
    ['Application Security Researcher','Bug Bounty Hunter','Instructor']);
  assert.match(styles,/.hero-visual \.mentor-cover \.cover-roles span::after/,'Orange underline on role labels must remain styled');
  assert.match(styles,/.student-feedback-grid:has\(> \.student-feedback-card:nth-child\(3\)\)/,
    'Three real student reviews must fit a desktop row');
  assert.match(styles,/\.hero\.hero-unified \.hero-visual-unified>\.cover-top\s*\{/,'External title must have dedicated layout styles');
  assert.match(styles,/\.hero\.hero-unified \.hero-visual-unified>\.cover-top \.mono\s*\{/,'Camp title must have prominent typography');
  assert(!styles.includes('Standalone hero label:'),'Retired hero badge styles must be gone');
  assert.equal(d.querySelectorAll('#application-ready,#save-title,#save-status,#edit-application,#application-whatsapp').length,0,'Private save UI was removed');
  assert.equal(d.querySelectorAll('.brand-wordmark .brand-name').length,1);
  assert.equal(d.querySelectorAll('.brand-wordmark .brand-light').length,1);
  assert([...d.querySelectorAll('a[href^="https://wa.me/"]')].every(a=>new URL(a.href).pathname==='/201012809358'),'Every static WhatsApp link must use the current number');
  assert.match(d.querySelector('meta[name=robots]').content,/^index,follow/);
  assert.match(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),/<loc>https:\/\/rv-u\.tech\/<\/loc>/);
  assert.match(fs.readFileSync(path.join(root,'robots.txt'),'utf8'),/Sitemap: https:\/\/rv-u\.tech\/sitemap\.xml/);
  for(const a of d.querySelectorAll('a[href^="#"]')) assert(d.getElementById(a.hash.slice(1)),`Missing anchor ${a.hash}`);
  for(const el of d.querySelectorAll('img[src],script[src],link[rel=stylesheet],a[download]')) {
    const value=el.getAttribute('src')||el.getAttribute('href');
    if(!value||/^https?:/.test(value))continue;
    const resolved=path.join(root,new URL(value,w.location.href).pathname);
    assert(fs.existsSync(resolved),`Missing asset ${value}`);
  }
  assert.deepEqual([...d.querySelectorAll('#gallery-track>[data-kind]')].map(x=>x.dataset.kind),['videos','videos','videos','videos']);
  assert.equal(d.querySelectorAll('#reports-track [data-image]').length,6);
  assert.equal(d.querySelector('#reports-scrollbar').getAttribute('type'),'range','Reports must have a draggable scrollbar');
  assert.equal(d.querySelector('#reports-scrollbar').getAttribute('max'),'1000');
  assert.equal(d.querySelector('.reports-scroll-ui label').textContent,'اسحب الشريط أو مرر للتقارير التالية');
  assert.equal(d.querySelector('.reports-carousel-shell #reports-track')?.getAttribute('role'),'list');
  assert.equal(d.querySelector('#research .section-heading .eyebrow'),null,'Reports should never display step numbering');
  assert.match(styles,/Horizontal report shelf:/,'Swipeable report carousel CSS must be present');
  const approvedLessons=['xZR5-4iXnI0','0O1a8Uv2RIs','CZx_WauYbcI','FDWt0pSoFTA'];
  const lessonButtons=[...d.querySelectorAll('#gallery-track button[data-video]')];
  assert.deepEqual(lessonButtons.map(el=>el.dataset.video),approvedLessons);
  assert.equal(lessonButtons[2].dataset.title,'Find Logic Vulns');
  assert.equal(lessonButtons[2].closest('.media-card').querySelector('.gallery-card-info h3').textContent,'Find Logic Vulns');
  const posterPaths=['api','jwt','account-testing','account-methodology'];
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
  // Publish only verified student testimonials; old illustrative reviews have been deleted.
  const reviewSection=d.querySelector('#voices.student-feedback');
  assert(reviewSection&&reviewSection.closest('main'),'Student testimonials must be in the main page');
  assert.equal(d.querySelector('#student-feedback-title').textContent,'من آراء طلاب الكامب');
  const reviews=[...reviewSection.querySelectorAll('.student-feedback-card')];
  assert.equal(reviews.length,3,'All three authentic student testimonials must be published');
  assert.deepEqual(reviews.map(card=>card.querySelector('h3').textContent),['Ahmed Alaa','Zain Ali','Ghada Abdelrahman']);
  assert.deepEqual(reviews.map(card=>card.querySelector('.student-feedback-person > div > span').textContent),
    ['طالب من الدفعة الرابعة','طالب من الدفعة الرابعة','طالبة من الدفعة الرابعة'],
    'Testimonials must accurately identify students of cohort four');
  assert(reviews.every(card=>card.querySelector('.student-feedback-person > div > span').getAttribute('data-en')==='Student from the fourth cohort'),
    'English student labels must use the fourth cohort');
  assert(!html.includes('طالب في الكامب')&&!html.includes('طالبة في الكامب'),'Old testimonial labels must not return');
  assert(reviews.every(card=>card.querySelector('h3').compareDocumentPosition(card.querySelector('blockquote')) & w.Node.DOCUMENT_POSITION_FOLLOWING),'Student name precedes the review');
  assert(reviews.every(card=>card.querySelector('blockquote').getAttribute('lang')==='ar'&&card.querySelector('blockquote').getAttribute('dir')==='rtl'),'Original Arabic reviews keep their language and direction');
  assert(reviews.every(card=>!card.querySelector('blockquote').hasAttribute('data-en')),'Do not replace authentic Arabic quotes with machine-generated translations');
  assert.equal(reviews[0].querySelector('blockquote').textContent,
    "الكامب جميل جدا الصراحه وضاف ليا كتير المحتوي الحمدلله يعتبر كله عملي وده فرق معايا لان النظري ممل بالنسبالي وحضرتك ماشاء الله عندك معلومات محترمه وبقدر الامكان بتحاول تسهل الدنيا وتوصلهالنا\n" +
    "فملخص الكامب هو ان انا استفدت منه وطلعت باكتر من معلومه جديده منه وده سهل ليا اني اخد الخطوات الصح ف ال hunting وافهم الادوات والشغل ف مجال ال penteration testing بشكل اوضح.");
  assert.match(reviews[0].querySelector('blockquote').textContent,/penteration testing بشكل اوضح/);
  assert.match(reviews[1].querySelector('blockquote').textContent,/رأيى بكل صراحة/);
  assert.match(reviews[1].querySelector('blockquote').textContent,/وربنا يباركلك/);
  assert.equal(reviews[2].querySelector('blockquote').textContent,
    'الكامب رائع جدا و مهندس رامز متميز جدا فى توصيل المعلومات و المحتوى منظم جدا وكل اللى كان عنده تحدى فى اى حاجه كان بيلجأله وهو كان معانا علطول\n' +
    'الكورس معمول باحترافية شديدة ومحتاج متدربين متحمسين و منظمين وقتهم عشان يحققوا هدفهم من الكورس وشكرا لحضرتك يا بشمهندس');
  assert.equal(reviews[2].querySelector('h3').textContent,'Ghada Abdelrahman');
  assert.equal(reviews[2].querySelector('.student-feedback-person > div > span').textContent,'طالبة من الدفعة الرابعة');
  assert(!html.includes('RVU STUDENT REVIEWS DISABLED')&&!html.includes('class="review-tile"'),'Retired placeholder testimonial markup must not remain');
  assert.equal(d.querySelectorAll('.student-voices,.reviews-grid,.review-tile,.demo-label').length,0,'Old illustrative review cards must not exist');



  const cohortBanner=d.querySelector('.application-open-banner');
  assert(cohortBanner&&cohortBanner.hasAttribute('data-apply'),'Application banner must remain actionable');
  assert.equal(cohortBanner.querySelector('.application-open-label').textContent,'الدفعة الخامسة');
  assert.equal(cohortBanner.querySelector('.application-open-label').dataset.en,'COHORT 05');
  assert(!cohortBanner.querySelector('.application-open-label').textContent.includes('باب التقديم مفتوح'));
  assert.match(styles,/\.hero\.hero-unified \.application-open-label\s*\{/,'Cohort label must be centered');
  assert.equal(cohortBanner.querySelector('strong').textContent,'التقديم مفتوح الآن');
  assert.match(styles,/\.hero-visual \.application-open-banner strong/);
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
  assert.match(d.querySelector('#mentorship').textContent,/٦ أسابيع/);
  assert.match(d.querySelector('.camp-price').textContent,/4000/);
  assert(!d.querySelector('.camp-price').closest('details'));
  assert.match(d.querySelector('#mentorship').textContent,/١٢ جلسة مباشرة/);
  assert(!d.querySelector('.facts,.week-preview'));
  assert.equal(d.querySelectorAll('.offline-cohorts li').length,3);
  assert.equal(d.querySelectorAll('.outcome-example').length,6);
  assert.equal(d.querySelectorAll('.outcome-example span').length,0,'Remove label but preserve six output names');
  assert(d.querySelector('.capstone-note'));
  assert(!d.querySelector('a[href*="/labs"],#labs,#lab-challenge,[data-step],[data-answer]'));
  assert(!/RVU LABS|rvu-commerce/.test(html));
  for(const old of ['labs','test','submit.html','submit.js','submit.css','legacy-redirect.js','not-found.js'])assert(!fs.existsSync(path.join(root,old)),`Retired asset remains: ${old}`);
  assert([...d.querySelectorAll('#resources a')].every(a=>new URL(a.href).pathname.endsWith('.pdf')));
  assert.equal(d.querySelectorAll('[data-pdf-guide],[data-resource],.resource-note').length,0);
  assert.equal(d.querySelectorAll('#resources .resource-card').length,3);
  assert([...d.querySelectorAll('#resources .resource-card a')].every(a=>a.getAttribute('href').endsWith('-ar.pdf')),'All three guides remain Arabic only');
  assert(!html.includes('لو عندك الأساسيات وعندك معلومات بس أول ما تفتح Target حقيقي'),'Old target prompt must not remain in page');
  assert.equal(d.querySelector('.hero .hero-title'),null,'Remove old visible target headline');
  assert.equal(d.querySelector('h1').textContent,'RVU Mentorship Camp — الدفعة الخامسة');
  assert(d.querySelector('h1').classList.contains('sr-only'),'Keep main semantic heading accessible without displaying removed copy');
  assert(!html.includes('افهم الـ Target')&&!html.includes('وابن</span>'),'Retired hero headline must not return');
  [...d.querySelectorAll('[data-apply]')].forEach(b=>assert(b.matches('button')&&b.type==='button','Every apply control must be a proper button'));
  assert(!/[\u064b-\u065f\u0670]/.test(d.body.textContent));
  assert(fs.readFileSync(path.join(root,'assets/ramez-signature.svg'),'utf8').includes('<title>Ramez Medhat</title>'));

  assert.equal(d.getElementById('workbench'),null,'Obsolete demo workbench section must be fully removed');
  assert.equal(d.querySelector('a[href="#workbench"]'),null,'Hero must not link to deleted demo');
  assert.equal(d.querySelector('[data-work],#work-content,#work-filename'),null,'Demo controls must not remain');
  assert.equal(d.querySelector('.fit-note'),null,'Uncertain-level interview note must be removed');
  assert(!html.includes('03 / YOUR WORK, MADE VISIBLE')&&!html.includes('target-map.md')&&!html.includes('لو محتار في مستواك'),'Obsolete demo copy must be absent');
  assert(!/5 لـ 7 ساعات في الأسبوع|5 to 7 hours weekly|اشتغلت بالبرب بس بتقف/.test(html),'Removed weekly-hour quotas and outdated fit copy must remain absent');
  assert.match(d.querySelector('.fit-yes').textContent,/عندك الأساسيات وعندك معلومات كتير/);
  assert.match(d.querySelector('.fit-yes').textContent,/مستعد تخصص وقت للتطبيق/);
  assert(!d.querySelector('#reports-track .card-kicker,#reports-track .report-context,#reports-track .gallery-card-info > p'));
  assert.equal(d.querySelectorAll('#reports-track .research-card').length,6);
  assert.equal(d.querySelectorAll('#reports-track .research-card .gallery-card-info h3').length,6);
  // Six proof cards show only their vulnerability titles; no repeated label or explanatory paragraphs.
  const reportTitles=['Account Takeover','Information Disclosure','API Authorization','Access Control','Stored XSS','Report Accepted'];
  const proofCards=[...d.querySelectorAll('#reports-track .research-card')];
  assert.deepEqual(proofCards.map(card=>card.querySelector('.gallery-card-info h3').textContent),reportTitles);
  for (const card of proofCards) {
    const info=card.querySelector('.gallery-card-info');
    assert.equal(info.textContent.trim(),info.querySelector('h3').textContent.trim(),'Only vulnerability name appears below screenshot');
    assert.equal(info.querySelectorAll('p,small,.eyebrow,.mono').length,0,'Old report labels are removed from HTML');
    assert.equal(card.querySelectorAll('.research-image[data-image]').length,1,'Screenshot still opens the image viewer');
  }
  assert(!d.querySelector('#reports-prev,#reports-next,#reports-position,#reports-help,#image-prev,#image-next,#image-position'));
  assert(!d.querySelector('#research .gallery-toolbar,#research .gallery-footer'));
  assert.equal(d.querySelector('#research .section-heading h2').textContent,'جزء من شغلي');
  assert.equal(d.querySelector('#research .section-heading .eyebrow'),null,'Do not number the security research section');
  assert.match(d.querySelector('.faq-list').textContent,/دور الكامب انه يطور مهاراتك/);
  assert(d.querySelector('.legal').textContent.includes('١٧٥'));
  const price=[...d.querySelectorAll('.faq-list details')].find(x=>x.textContent.includes('٤٠٠٠'));
  assert(price&&!price.open,'Price is inside a closed FAQ');
  d.getElementById('language').click();
  assert.equal(d.documentElement.lang,'en');assert.equal(d.documentElement.dir,'ltr');
  assert.match(d.querySelector('.fit-yes').textContent,/You know the fundamentals and have plenty of information/);
  assert.match(d.querySelector('.fit-yes').textContent,/make time to practise alongside the sessions/);
  assert.match(d.querySelector('.hero-lead').textContent,/interview applications are now open to anyone who wants to improve their skills/i);
  assert.equal(d.querySelector('.hero-lead .thanks-oval').textContent,'I thank God');
  assert.equal(d.querySelector('.hero-lead-followup'),null);
  assert.equal(d.querySelector('.hero-benefits-inline'),null);
  assert.equal(d.querySelector('.hero-facts-featured'),null);
  assert.match(d.querySelector('.hero-lead').textContent,/fifth cohort of RVU Mentorship Camp/);
  assert.equal(d.querySelector('.hero-quick-pill [data-en="Reviews"]').textContent,'Reviews');
  assert.equal(d.querySelector('.hero-quick-link-reviews').getAttribute('aria-label'),'Jump to student reviews');
  assert.equal(d.querySelector('.hero-quick-linkedin .hero-quick-caption').textContent,'LinkedIn');
  assert.equal(d.querySelector('.hero-quick-reports .hero-quick-caption').textContent,'Reports');
  assert.equal(d.querySelectorAll('.cohort-capacity').length,0);
  assert.equal(d.querySelector('.mobile-cta > span').textContent,'Only 12 students + 1:1 mentoring');
  assert.equal(d.querySelector('.history-next p').textContent,'Applications are open now');
  assert.equal(d.querySelector('.hero-visual-unified > .cover-top .mono').textContent.trim(),'RVU MENTORSHIP · ONLINE BUG BOUNTY CAMP');
  assert.equal(d.querySelector('#student-feedback-title').textContent,'What my students say');
  assert.equal(d.querySelector('#review-ahmed-name').textContent,'Ahmed Alaa');
  assert.equal(d.querySelector('#review-ghada-name').textContent,'Ghada Abdelrahman');
  assert.deepEqual([...d.querySelectorAll('.student-feedback-card .student-feedback-person > div > span')].map(el=>el.textContent),
    ['Student from the fourth cohort','Student from the fourth cohort','Student from the fourth cohort']);
  assert.equal(d.querySelector('.cover-bio-copy .bio-goal-title').textContent,'The aim of the camp');
  assert.equal(d.querySelector('.cover-bio-copy .bio-name').textContent,'Ramez Medhat');
  assert.equal(d.querySelector('.student-feedback-card:last-child blockquote').getAttribute('lang'),'ar');
  assert.match(d.querySelector('#review-zain-name').closest('article').querySelector('blockquote').textContent,/رأيى بكل صراحة/);
  assert([...d.querySelectorAll('#resources .resource-card a')].every(a=>a.href.endsWith('-ar.pdf')));
  assert.match(d.querySelector('.camp-price').textContent,/4,000 EGP/);
  assert(!d.querySelector('[data-resource],[data-pdf-guide]'));
  assert.equal(d.querySelector('.hero h1').textContent,'RVU Mentorship Camp — Fifth Cohort');
  assert(d.querySelector('.signature-title img'),'Translation must retain signature');
  assert.equal(d.querySelector('.application-open-banner strong').textContent,'Applications are open now');
  assert.equal(d.querySelector('.application-open-label').textContent,'COHORT 05');
  assert.equal(d.querySelector('.reports-scroll-ui label').textContent,'Drag the bar or swipe to see more reports');
  assert.equal(d.querySelector('#reports-scrollbar').getAttribute('aria-label'),'Scroll through reports');
  assert.equal(d.querySelectorAll('summary .ui-toggle').length,d.querySelectorAll('details').length);

  d.getElementById('language').click();assert.equal(d.documentElement.dir,'rtl');
  assert.equal(d.getElementById('workbench'),null,'Deleted demo must stay absent after language switching');
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
  d.getElementById('image-dialog').close();assert(!d.getElementById('gallery-full-image').hasAttribute('src'));
  d.querySelector('[data-image="1"]').click();assert(d.getElementById('image-dialog').open);
  assert.match(d.getElementById('gallery-full-image').src,/poc-02-full\.webp$/);
  assert.match(d.getElementById('image-original').href,/poc-02\.png$/);
  assert(!stage.classList.contains('is-zoomed'),'Zoom must reset when opening another report');
  assert.equal(zoom.getAttribute('aria-pressed'),'false');
  d.getElementById('image-dialog').close();
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
