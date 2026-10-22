'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const language = $('language');
  if (!language) return;
  const translated = Array.from(document.querySelectorAll('[data-en]'));
  const arabicContent = new Map(translated.map(el => [el, [...el.childNodes].map(node => node.cloneNode(true))]));
  let lastFocus = null;
  const isArabic = () => document.documentElement.lang === 'ar';
  function setLanguage(lang) {
    const ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    translated.forEach(el => {
      if (ar) el.replaceChildren(...arabicContent.get(el).map(node => node.cloneNode(true)));
      else el.textContent = el.dataset.en;
    });
    document.querySelectorAll('[data-label-en]').forEach(el => el.setAttribute('aria-label', el.dataset[ar ? 'labelAr' : 'labelEn']));
    language.textContent = ar ? 'EN' : 'AR';
    language.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    document.title = ar ? 'الدفعة الثانية — التقديم مفتوح الآن | RVU Mentorship Camp' : 'Cohort 02 — Applications Open | RVU Mentorship Camp';
    $('form-error').hidden = true;
    renderWork();
    shelves.forEach(shelf => shelf.reset());
    if ($('image-dialog').open) showResearchImage(activeImage);
  }
  language.addEventListener('click', () => setLanguage(isArabic() ? 'en' : 'ar'));
  const nav = $('navigation');
  const toggle = $('menu-toggle');
  function closeMenu() { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  function openDialog(dialog) {
    lastFocus = document.activeElement;
    closeMenu();
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (dialog.id === 'video-dialog') $('video-mount').replaceChildren();
      if (dialog.id === 'image-dialog') $('gallery-full-image').removeAttribute('src');
      document.body.classList.remove('modal-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  document.querySelectorAll('[data-apply]').forEach(button => button.addEventListener('click', () => openDialog($('apply-dialog'))));
  const videos = new Set(['0O1a8Uv2RIs', 'xZR5-4iXnI0']);
  document.querySelectorAll('[data-video]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.video;
      if (!videos.has(id)) return;
      $('video-title').textContent = button.dataset.title;
      $('video-link').href = `https://www.youtube.com/watch?v=${id}`;
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = button.dataset.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      $('video-mount').replaceChildren(frame);
      openDialog($('video-dialog'));
    });
  });
  const form = $('application-form');
  function normalizedPhone(value) {
    const raw = value.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6f0)).trim();
    if (!/^[+\d\s().-]+$/.test(raw)) return null;
    let number = raw.replace(/[\s().-]/g, '');
    if (number.startsWith('00')) number = '+' + number.slice(2);
    const country = $('phone-country')?.value || '';
    if (!number.startsWith('+')) {
      if (country === '+20' && /^01[0125]\d{8}$/.test(number)) number = '+20' + number.slice(1);
      else if (/^201[0125]\d{8}$/.test(number)) number = '+' + number;
      else if (country) number = country + number.replace(/^0+/, '');
    }
    if (!/^\+[1-9]\d{7,14}$/.test(number)) return null;
    if (number.startsWith('+20') && !/^\+201[0125]\d{8}$/.test(number)) return null;
    return number;
  }
  function prepareMessage() {
    const fields = form.elements;
    const name = fields.name.value.trim();
    const phone = normalizedPhone(fields.phone.value);
    const goal = fields.goal.value.trim();
    if (!name || !phone || !goal || !fields.level.value) return false;
    const level = fields.level.selectedOptions[0].textContent;
    const message = isArabic()
      ? `طلب تقديم — RVU Camp / الدفعة الثانية\n\nالاسم: ${name}\nواتساب: ${phone}\nالمستوى: ${level}\nهدفي: ${goal}\n\nالمصدر: موقع RVU Camp الرسمي`
      : `Application — RVU Camp / Cohort 02\n\nName: ${name}\nWhatsApp: ${phone}\nLevel: ${level}\nGoal: ${goal}\n\nSource: RVU Camp official website`;
    const url = new URL('https://wa.me/201012809358');
    url.searchParams.set('text', message);
    return url.href;
  }
  // Visitor goes straight to WhatsApp. Keepalive may finish the form POST
  // after page unload, but does not guarantee server receipt.
  let submitting = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submitting) return;
    $('form-error').hidden = true;
    if (!form.reportValidity()) return;
    const whatsappUrl = prepareMessage();
    if (!whatsappUrl) {
      $('form-error').textContent = isArabic()
        ? 'راجع اسمك وهدفك، واكتب رقم واتساب صحيح بكود الدولة، مثل +20.'
        : 'Check your name and goal, and enter a valid WhatsApp number with country code, such as +20.';
      $('form-error').hidden = false;
      return;
    }
    submitting = true;
    const fields = form.elements;
    const payload = {
      name:fields.name.value.trim(),
      phone:normalizedPhone(fields.phone.value),
      level:fields.level.value,
      goal:fields.goal.value.trim()
    };
    try {
      const submissionId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
      Object.assign(payload, {
        submission_id:submissionId, submitted_at:new Date().toISOString(),
        page_url:location.origin + location.pathname, cohort:'02',
        source:'camp-website', language:isArabic() ? 'ar' : 'en',
        _subject:'RVU Camp cohort 02 application - ' + payload.name
      });
      const params = new URLSearchParams(location.search);
      for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
        payload[key] = (params.get(key) || '').slice(0,200);
      }
      // Form-encoded avoids JSON CORS preflight and fits the 64 KiB keepalive cap.
      const request = fetch('https://formspree.io/f/xoeqykpq', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',Accept:'application/json'},
        body:new URLSearchParams(payload).toString(),
        keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'
      });
      Promise.resolve(request).then(response => {
        if (response.ok) {
          try { window.rvuTrack?.('Application_Saved'); } catch (_) {}
        }
      }).catch(() => {});
    } catch (_) {
      // WhatsApp remains available even when the background POST cannot start.
    }
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_self';
    link.rel = 'noreferrer';
    link.click();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) submitting = false;
  });

  const samples = {
    ar: {
      map: {file:'target-map.md', title:'خريطة تطبيق تجريبي', intro:'ابدأ بالوظائف والحسابات وحدود الصلاحيات. حدد سؤالا واضحا لكل جزء.', headers:['الجزء','إيه اللي نفهمه؟','سؤال الاختبار'], rows:[['الحسابات','زائر · عميل A · عميل B','مين يقدر يشوف أو يعدل إيه؟'],['الطلبات','إنشاء الطلب · عرضه · إلغاؤه','هل الملكية بتتراجع في كل خطوة؟'],['الـAPI','المسارات · المعرفات · الجلسة','هل الصلاحيات متطابقة مع الواجهة؟']], note:'الأولوية: ابدأ بالوظائف الحساسة داخل الـScope  وسجل اللي لسه مش فاهمه.'},
      plan: {file:'test-plan.md', title:'من سؤال لفرضية اختبار', intro:'مثال: مراجعة صلاحيات عرض الطلبات بين حسابين اختباريين تملكهم.', headers:['الخطوة','التطبيق','الدليل المطلوب'], rows:[['Baseline','اعرض طلب A من حساب A','استجابة متوقعة ومرجع للمقارنة'],['الاختبار','اطلب مورد B من جلسة A','تحديد المورد والحساب بوضوح'],['التحقق','قارن البيانات والصلاحيات','رفض الوصول أم تسريب بيانات فعلية؟']], note:'كود 200 وحده لا يثبت الثغرة. وثق النتيجة حتى لو النظام منع الوصول بشكل صحيح.'},
      report: {file:'finding-draft.md', title:'تقرير يسهل إعادة الاختبار', intro:'هيكل تعليمي لتقرير محتمل  لا يزعم وجود ثغرة أو نتيجة فعلية.', items:[['الملخص','حدد الوظيفة والسلوك غير المتوقع والشرط اللازم لحدوثه.'],['الخطوات','اذكر الحسابات التجريبية  الطلب المرجعي  والتغيير الواحد الذي اختبرته.'],['الدليل','اربط كل خطوة باستجابة مناسبة بعد إخفاء البيانات الحساسة.'],['الأثر','اشرح الوصول غير المصرح به الذي أثبته فقط  وحدود ما اختبرته.']], note:'قبل الإرسال: راجع الـScope  وأزل الأسرار  وتأكد إن شخص تاني يقدر يعيد الخطوات.'}
    },
    en: {
      map: {file:'target-map.md',title:'Map a sample application',intro:'Start with features, accounts and authorization boundaries. Give each area a specific question.',headers:['Area','Understand','Test question'],rows:[['Accounts','Guest · customer A · customer B','Who can view or change what?'],['Orders','Create · view · cancel','Is ownership checked at every step?'],['API','Routes · identifiers · sessions','Are permissions consistent with the UI?']],note:'Prioritize sensitive, in-scope features. Record what you do not yet understand.'},
      plan: {file:'test-plan.md',title:'Turn a question into a test',intro:'Example: review order-viewing permissions using two test accounts you own.',headers:['Step','Action','Evidence'],rows:[['Baseline','View order A as account A','Expected response for comparison'],['Test','Request B’s resource as A','Clearly identify account and resource'],['Verify','Compare data and permissions','Access denied, or actual data exposure?']],note:'HTTP 200 alone proves nothing. Document the result even when access is correctly denied.'},
      report: {file:'finding-draft.md',title:'Make your test reproducible',intro:'An educational outline for a potential report; not a claim of an actual vulnerability or result.',items:[['Summary','Identify the feature, unexpected behavior and required conditions.'],['Steps','Describe test accounts, the baseline request and the one change you tested.'],['Evidence','Link each step to an appropriate response, with sensitive information removed.'],['Impact','Describe only the unauthorized access you demonstrated and the limits of your testing.']],note:'Before submitting: check scope, remove secrets and ensure someone else can reproduce your steps.'}
    }
  };
  let activeWork = 'map';
  function node(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function renderWork() {
    const sample = samples[isArabic() ? 'ar' : 'en'][activeWork];
    $('work-filename').textContent = sample.file;
    const content = $('work-content');
    content.replaceChildren(node('h3', sample.title), node('p', sample.intro, 'sample-intro'));
    if (sample.rows) {
      const table = document.createElement('table'); table.className = 'sample-table';
      const caption = node('caption',sample.title,'sr-only'); table.append(caption);
      const head = document.createElement('thead'), row = document.createElement('tr');
      sample.headers.forEach(text => { const th = node('th',text); th.scope = 'col'; row.append(th); });
      head.append(row); table.append(head);
      const body = document.createElement('tbody');
      sample.rows.forEach(cells => { const tr = document.createElement('tr'); cells.forEach(text => tr.append(node('td',text))); body.append(tr); });
      table.append(body); content.append(table);
    } else {
      const report = document.createElement('div'); report.className = 'sample-report';
      sample.items.forEach(([label,copy]) => { const article = document.createElement('article'); article.append(node('strong',label),node('span',copy)); report.append(article); });
      content.append(report);
    }
    content.append(node('p',sample.note,'sample-note'));
  }
  document.querySelectorAll('[data-work]').forEach(button => button.addEventListener('click', () => {
    activeWork = button.dataset.work;
    document.querySelectorAll('[data-work]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderWork();
  }));
  function createShelf(trackId, prefix) {
    const track = $(trackId);
    let frame = null, drag = null, suppressUntil = 0;
    const rtl = () => document.documentElement.dir === 'rtl';
    function metrics() {
      const cards = Array.from(track.querySelectorAll('.gallery-card'));
      return {cards, step:(cards[0]?.getBoundingClientRect().width || 350)+(parseFloat(getComputedStyle(track).columnGap)||20), max:Math.max(0,track.scrollWidth-track.clientWidth)};
    }
    function update() {
      const {cards,step,max}=metrics(), position=Math.min(max,Math.abs(track.scrollLeft));
      const first=max?Math.min(cards.length,Math.floor((position+2)/step)+1):1;
      const last=max?Math.min(cards.length,Math.ceil((position+track.clientWidth-2)/step)):cards.length;
      $(prefix+'-prev').disabled=position<=2;
      $(prefix+'-next').disabled=position>=max-2;
      const status = $(prefix+'-position');
      if (status) status.textContent=isArabic()?`العناصر ${first}–${Math.max(first,last)} من ${cards.length}`:`Items ${first}–${Math.max(first,last)} of ${cards.length}`;
    }
    function schedule() {
      if(frame!==null)return;
      frame=requestAnimationFrame(()=>{frame=null;update();});
    }
    function scroll(position,smooth=true) {
      const left=Math.max(0,Math.min(metrics().max,position))*(rtl()?-1:1);
      track.scrollTo({left,behavior:smooth&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
      schedule();
    }
    function move(direction){scroll(Math.abs(track.scrollLeft)+metrics().step*direction);}
    $(prefix+'-prev').addEventListener('click',()=>move(-1));
    $(prefix+'-next').addEventListener('click',()=>move(1));
    track.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(schedule).observe(track);
    track.addEventListener('keydown',event=>{
      if(event.target!==track)return;
      if(event.key==='Home')scroll(0);
      else if(event.key==='End')scroll(metrics().max);
      else if(event.key==='ArrowLeft')move(rtl()?1:-1);
      else if(event.key==='ArrowRight')move(rtl()?-1:1);
      else return;
      event.preventDefault();
    });
    track.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button===0)drag={id:event.pointerId,x:event.clientX,scroll:track.scrollLeft,moved:false};
    });
    track.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const delta=event.clientX-drag.x;
      if(!drag.moved&&Math.abs(delta)<7)return;
      if(!drag.moved){drag.moved=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);}
      event.preventDefault();
      const max=metrics().max;
      track.scrollLeft=rtl()?Math.max(-max,Math.min(0,drag.scroll-delta)):Math.max(0,Math.min(max,drag.scroll-delta));
      schedule();
    });
    function finish(event){
      if(!drag||event.pointerId!==drag.id)return;
      const moved=drag.moved;drag=null;track.classList.remove('is-dragging');
      if(track.hasPointerCapture?.(event.pointerId))track.releasePointerCapture(event.pointerId);
      if(moved){suppressUntil=performance.now()+250;const {step}=metrics();scroll(Math.round(Math.abs(track.scrollLeft)/step)*step);}
    }
    window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);track.addEventListener('lostpointercapture',finish);
    track.addEventListener('dragstart',event=>event.preventDefault());
    track.addEventListener('click',event=>{if(performance.now()<suppressUntil&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}},true);
    update();
    return {reset(){scroll(0,false);update();}};
  }
  const shelves=[createShelf('gallery-track','gallery'),createShelf('reports-track','reports')];

  const researchImages = [
    ['تأكيد تقرير استيلاء على الحساب','Account takeover confirmation'],
    ['كشف معلومات — تم إصلاحه','Information disclosure — resolved'],
    ['تأكيد تقرير IDOR في الـAPI','API authorization confirmation'],
    ['خلل في الصلاحيات — تم إصلاحه','Access control — resolved'],
    ['تقرير Stored XSS — تم إصلاحه','Stored XSS — resolved'],
    ['رسالة قبول تقرير ومكافأة','Report acceptance and reward']
  ];
  let activeImage = 0;
  function showResearchImage(index) {
    activeImage = (index + researchImages.length) % researchImages.length;
    const title = researchImages[activeImage][isArabic() ? 0 : 1];
    const path = `/poc-0${activeImage+1}.png`;
    $('image-title').textContent = title;
    $('gallery-full-image').alt = title;
    $('image-error').hidden = true;
    $('gallery-full-image').hidden = false;
    $('image-stage').classList.remove('is-zoomed');
    $('image-zoom').setAttribute('aria-pressed', 'false');
    $('image-stage').scrollTo({top:0,left:0,behavior:'instant'});
    $('gallery-full-image').src = path;
    $('image-position').textContent = `${activeImage+1} / ${researchImages.length}`;
  }
  $('image-zoom').addEventListener('click', () => {
    const zoomed = $('image-stage').classList.toggle('is-zoomed');
    $('image-zoom').setAttribute('aria-pressed',String(zoomed));
    $('image-stage').scrollTo({top:0,left:0,behavior:'instant'});
  });
  $('gallery-full-image').addEventListener('error', () => { $('image-error').hidden = false; $('gallery-full-image').hidden = true; });
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {showResearchImage(Number(button.dataset.image));openDialog($('image-dialog'));}));
  $('image-prev').addEventListener('click', () => showResearchImage(activeImage-1));
  $('image-next').addEventListener('click', () => showResearchImage(activeImage+1));
  $('image-dialog').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showResearchImage(activeImage + (isArabic() ? 1 : -1));
    else if (event.key === 'ArrowRight') showResearchImage(activeImage + (isArabic() ? -1 : 1));
    else return;
    event.preventDefault();
  });

  renderWork();
})();
