'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM,VirtualConsole} = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const minCSS = fs.readFileSync(path.join(root,'styles.min.css'),'utf8');
const scripts = ['measurement.js','app.js','experience.js'];

function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(html,{url:'https://rv-u.tech/?layout-review=1',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w = dom.window, d = w.document;
  w.matchMedia = () => ({matches:false});
  w.requestAnimationFrame = f => {f();return 1;};
  w.HTMLElement.prototype.scrollTo = function(arg) {this.scrollLeft = arg.left || 0;this.scrollTop = arg.top || 0;};
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.HTMLDialogElement.prototype.showModal = function() {this.open=true;};
  w.HTMLDialogElement.prototype.close = function() {this.open=false;this.dispatchEvent(new w.Event('close'));};
  const submits = [], navigation = [];
  const originalClick = w.HTMLAnchorElement.prototype.click;
  w.HTMLAnchorElement.prototype.click = function() {
    if(this.href.indexOf('https://wa.me/')===0){navigation.push(this.href);return;}
    originalClick.call(this);
  };
  w.fetch = (url,opts) => {submits.push({url,opts});return Promise.resolve({ok:true});};
  scripts.forEach(name => w.eval(fs.readFileSync(path.join(root,name),'utf8')));
  return {dom,w,d,errors,submits,navigation};
}

(async () => {
  const {dom,w,d,errors,submits,navigation} = boot();
  assert.equal(d.compatMode,'CSS1Compat');
  assert.equal(d.querySelectorAll('h1').length,1);
  const ids = [...d.querySelectorAll('[id]')].map(e=>e.id);
  assert.equal(new Set(ids).size,ids.length,'All IDs must be unique');
  for(const required of ['hero','mentorship','curriculum','outcomes','research','voices','resources','fit','apply','faq']) {
    assert(d.querySelector('#'+(required==='hero'?'top':required)),'Missing section '+required);
  }
  for(const link of d.querySelectorAll('a[href^="#"]')) {
    assert(d.getElementById(link.hash.slice(1)),'Missing anchor '+link.hash);
  }
  assert.equal(d.querySelector('#student-feedback-title').textContent,'بعض الآراء من الكامب الرابع');
  assert.equal(d.querySelectorAll('#voices .student-feedback-card').length,3);
  assert.equal(d.querySelector('#research h2').textContent,'جزء من شغلي');
  assert.equal(d.querySelectorAll('#reports-track .research-card').length,6);
  assert.equal(d.querySelectorAll('#gallery-track .media-card').length,4);
  assert.equal(d.querySelectorAll('#reports-prev,#reports-next,#gallery-prev,#gallery-next').length,4);
  assert(!d.getElementById('reports-scrollbar'));
  assert(!d.querySelector('#image-original,#image-zoom,.image-dialog-footer'));
  assert(!d.querySelector('.history-intro,.setup-note,.hero-problem'));
  assert(!html.includes('أونلاين..'));
  assert(!html.includes('Cormorant+Garamond'));
  assert(!html.includes('poc-01.png'));
  assert(/border-top:0/.test(css),'Statistics top border removed');
  assert(/#journey\s+\.history-stats\s+article\s*\+\s*article\s*\{\s*border-inline-start:1px solid #444046!important;?\s*\}/.test(css),'Desktop statistic dividers must remain between cards');
  assert(/#journey \.history-stats article \+ article \{\s*border-top:0!important;\s*border-inline-start:1px solid #444046!important;\s*\}/.test(css),'Statistics must show only vertical dividers between the three items');
  assert.equal(d.querySelector('meta[property="og:image"]').content,d.querySelector('.cover-portrait img').src,'Social preview must match the displayed portrait');
  assert(d.querySelector('meta[name="description"]').content.includes('RVU Mentorship Camp'),'SEO description must be present and reference the camp');
  assert(d.querySelector('meta[property="og:description"]').content.includes('RVU Mentorship Camp'),'Social description must be present and reference the camp');
  assert(d.querySelector('meta[property="og:title"]').content.includes('Cohort 06'),'Social title must match cohort 06');
  assert(/#curriculum .week-topics span/.test(css),'Weekly topics retain readable font rules');
  assert.equal(d.querySelector('.hero-apply-date-value').getAttribute('datetime'),'2026-11-25','Camp start date must be 25 November 2026');
  assert.equal(d.querySelector('.hero-apply-date-value').textContent.trim(),'11 / 25','Visible start date must match');
  assert.equal(d.querySelector('.hero-primary-apply').textContent,'قدم لانترفيو الكامب السادس','Current camp CTA must say sixth');
  const structuredCourse=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'].find(entry=>entry['@type']==='Course');
  assert.equal(structuredCourse.hasCourseInstance.startDate,'2026-11-25','Structured course date must match');
  assert.equal(structuredCourse.name,'RVU Mentorship Camp — Cohort 06');

  assert.equal(structuredCourse.offers,undefined,'Course structured data must not expose a price');
  assert(!/(?:2,000|4,000|2000|4000|٢٠٠٠|٤٠٠٠|EGP|جنيه مصري|سعر الكامب|تكلفة الكامب|InstaPay|Vodafone Cash|Orange Cash)/i.test(html),'No camp prices or payment methods anywhere on the public page');
  assert.equal(d.querySelector('#pricing,.price-display,.price-before,.price-payment'),null,'No pricing cards, amounts or payment instructions');
  const switchTheme=d.getElementById('theme-toggle');
  assert(switchTheme,'Dark/cream switch is required in header');
  assert.equal(d.documentElement.getAttribute('data-theme'),'dark');
  switchTheme.click();
  assert.equal(d.documentElement.getAttribute('data-theme'),'light');
  assert.equal(switchTheme.getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelector('meta[name="theme-color"]').content,'#f5f1e6');
  assert.equal(switchTheme.querySelector('.theme-toggle-text').textContent,'داكن');
  switchTheme.click();
  assert.equal(d.documentElement.getAttribute('data-theme'),'dark');
  assert.equal(switchTheme.getAttribute('aria-pressed'),'false');
  assert.equal(d.querySelector('.mobile-cta-promo').textContent,'خصم 50% على الكامب السادس فقط');
  assert(d.querySelector('.mobile-cta .mobile-cta-apply[data-apply]'),'Dock CTA must open application');
  const discountBadge=d.querySelector('.discount-float');
  assert(discountBadge,'Sixth-cohort offer must be visible');
  assert.equal(discountBadge.parentElement,d.querySelector('.hero.hero-unified .mentor-cover'),'Discount must sit in top-left hero card instead of the viewport');
  assert.equal(discountBadge.previousElementSibling,null,'Offer badge must precede portrait');
  assert(/\.mentor-cover\s*>\s*\.discount-float\s*\{\s*position:absolute/.test(css),'Badge must be card-anchored, not viewport-fixed');
  assert.equal(discountBadge.getAttribute('href'),'#apply','Offer badge opens application section');
  assert.equal(discountBadge.querySelector('.discount-float-percent').textContent.trim(),'50%');
  assert.equal(discountBadge.querySelector('.discount-float-price').textContent.trim(),'للكامب السادس');
  assert.equal(d.querySelector('.price-offer').textContent.trim(),'خصم 50% مخصص للكامب السادس فقط');
  assert(d.querySelector('.price-panel [data-apply]'),'Application button must remain in the offer panel');
  assert(css.includes('.discount-float')&&minCSS.includes('.discount-float'),'Refined offer styles must be published');
  assert(d.querySelector('link[href*="styles.min.css"]'));
  assert.equal(d.querySelectorAll('[data-en]').length>160,true,'English translations required');
  for(const asset of d.querySelectorAll('[src],[href]')){
    const raw = asset.getAttribute('src')||asset.getAttribute('href');
    if(!raw || !raw.startsWith('./') && !raw.startsWith('/')) continue;
    const local = raw.split('?')[0].replace(/^\/+/,'').replace(/^\.\//,'');
    assert(fs.existsSync(path.join(root,local)),'Missing asset '+local);
  }
  for(let i=1;i<=6;i++){
    const base='poc-0'+i;
    assert(fs.existsSync(path.join(root,base+'-thumb.webp')));
    assert(fs.existsSync(path.join(root,base+'-full.webp')));
  }
  const video=d.querySelector('[data-video]');
  assert(video);
  video.click();
  assert(d.querySelector('#video-dialog').open);
  assert.equal(d.querySelectorAll('#video-mount iframe').length,1);
  d.querySelector('#video-dialog [data-close]').click();
  assert.equal(d.querySelectorAll('#video-mount iframe').length,0);
  const firstReport=d.querySelector('#reports-track [data-image="0"]');
  assert.equal(firstReport.tagName,'A');
  assert.equal(firstReport.getAttribute('href'),'/viewer.html?image=1');
  assert.equal(d.querySelector('meta[name="viewport"]').content.includes('user-scalable=yes'),true);
  assert(fs.existsSync(path.join(root,'viewer.html')));
  assert(fs.existsSync(path.join(root,'viewer.js')));
  assert(fs.existsSync(path.join(root,'viewer.css')));
  d.getElementById('language').click();
  assert.equal(d.documentElement.lang,'en');
  assert.equal(d.documentElement.dir,'ltr');
  assert.equal(switchTheme.querySelector('.theme-toggle-text').textContent,'Light');
  assert.equal(d.querySelector('.mobile-cta-promo').textContent,'50% OFF · COHORT 06 ONLY');
  assert.equal(d.querySelector('#student-feedback-title').textContent,'Feedback from the fourth camp');
  assert.equal(d.querySelector('#voices blockquote').lang,'en');
  assert.equal(d.querySelector('#voices blockquote').dir,'ltr');
  assert(d.querySelector('#voices blockquote').textContent.startsWith('The camp was very good'));
  assert.equal(d.querySelector('#reports-track img').alt,'Confirmation of account takeover report');
  assert.equal(d.querySelector('#reports-track [data-image="0"]').getAttribute('href'),'/viewer.html?image=1&lang=en');
  assert.equal(d.querySelector('#research h2').textContent,'Some of my work');
  assert.equal(d.querySelectorAll('#reports-track .research-card').length,6);
  d.getElementById('language').click();
  assert.equal(d.documentElement.lang,'ar');
  assert.equal(d.documentElement.dir,'rtl');
  assert.equal(d.querySelector('#student-feedback-title').textContent,'بعض الآراء من الكامب الرابع');
  assert.equal(d.querySelector('#voices blockquote').lang,'ar');
  assert.equal(d.querySelector('#voices blockquote').dir,'rtl');
  assert(d.querySelector('#voices blockquote').textContent.startsWith('الكامب جميل جدا'));
  assert.equal(d.querySelector('#reports-track [data-image="0"]').getAttribute('href'),'/viewer.html?image=1');
  const form=d.getElementById('application-form');
  form.elements.name.value='Browser QA';
  form.elements.phone.value='+201012345678';
  form.elements.level.value='basics';
  form.elements.goal.value='Practise authorised testing';
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await Promise.resolve();
  assert.equal(submits.length,1,'Exactly one background form POST');
  assert.equal(submits[0].url,'https://formspree.io/f/xoeqykpq');
  assert.equal(submits[0].opts.keepalive,true);
  assert.equal(navigation.length,1,'WhatsApp navigation is immediate');
  assert(navigation[0].indexOf('https://wa.me/')===0);
  // Form-created links bypass delegated click listeners; track the conversion explicitly.
  assert.equal(typeof w.rvuTrack,'function');
  assert.equal(submits[0].opts.credentials,'omit');
  const restoredPage = new w.Event('pageshow');
  Object.defineProperty(restoredPage,'persisted',{value:true});
  w.dispatchEvent(restoredPage);
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await Promise.resolve();
  assert.equal(submits.length,2,'Page return restores ability to submit');
  assert.equal(navigation.length,2,'Page return restores WhatsApp navigation');
  assert.equal(errors.length,0,errors.join('\n'));
  assert(minCSS.length>0);
  dom.window.close();
  console.log('PASS: current bilingual content, local WebP assets, gallery, video, responsive markers, application flow, security and no client-side errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
