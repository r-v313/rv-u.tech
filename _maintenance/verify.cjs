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
  assert(/#journey\s+\.history-stats\s+article\s*\+\s*article\s*\{\s*border-top:1px solid #444046!important;?\s*\}/.test(css),'Mobile statistic dividers must remain between cards');
  assert.equal(d.querySelector('meta[property="og:image"]').content,d.querySelector('.cover-portrait img').src,'Social preview must match the displayed portrait');
  assert(d.querySelector('meta[name="description"]').content.includes('الدفعة الخامسة'),'SEO description must match cohort 05');
  assert(d.querySelector('meta[property="og:description"]').content.includes('الدفعة الخامسة'),'Social description must match cohort 05');
  assert(/#curriculum .week-topics span/.test(css),'Weekly topics retain readable font rules');
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
  assert.equal(errors.length,0,errors.join('\n'));
  assert(minCSS.length>0);
  dom.window.close();
  console.log('PASS: current bilingual content, local WebP assets, gallery, video, responsive markers, application flow, security and no client-side errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
