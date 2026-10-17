'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const language = $('language');
  const translated = Array.from(document.querySelectorAll('[data-en]'));
  translated.forEach(el => { el.dataset.ar = el.textContent; });
  const steps = {
    ar: [
      ['افهم السلوك الطبيعي الأول.', 'إيه اللي بيتغير لما تضيف منتج للسلة؟ تابع الريكوست والنتيجة قبل ما تبدأ تعدّل.'],
      ['اسأل عن الافتراض اللي ورا الـFlow.', 'السيرفر بيتأكد من الكمية والسعر إزاي؟ ومين المسؤول عن حساب الإجمالي؟ حوّل السؤال لفرضية اختبار.'],
      ['اثبت النتيجة، مش اختلاف الريكوست.', 'قارن حالة السلة قبل الاختبار وبعده، وتأكد من الأثر على السيرفر. سجّل الدليل وحدود اللي قدرت تثبته.']
    ],
    en: [
      ['Understand normal behavior first.', 'What changes when you add an item? Follow the request and result before changing an input.'],
      ['Question the assumption behind the flow.', 'How does the server validate quantity and price? Who calculates the total? Turn the question into a test hypothesis.'],
      ['Verify the outcome, not just the request.', 'Compare the cart before and after, verify server-side impact, and document both your evidence and its limits.']
    ]
  };
  let activeStep = 0;
  let lastFocus = null;
  const isArabic = () => document.documentElement.lang === 'ar';
  function updateStep() {
    const copy = steps[isArabic() ? 'ar' : 'en'][activeStep];
    $('step-title').textContent = copy[0];
    $('step-copy').textContent = copy[1];
  }
  function setLanguage(lang) {
    const ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    translated.forEach(el => { el.textContent = el.dataset[ar ? 'ar' : 'en']; });
    language.textContent = ar ? 'EN' : 'AR';
    language.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    document.title = ar ? 'الدفعة الثانية | RVU Mentorship Camp' : 'Cohort 02 | RVU Mentorship Camp';
    $('form-error').hidden = true;
    updateStep();
    renderWork();
    renderChallenge();
    renderSaveStatus();
    shelves.forEach(shelf => shelf.reset());
    if ($('image-dialog').open) showResearchImage(activeImage);
    if (!$('application-ready').hidden) prepareMessage();
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
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => {
      activeStep = Number(button.dataset.step);
      document.querySelectorAll('[data-step]').forEach(b => {
        const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
      });
      updateStep();
    });
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
    if (/^01[0125]\d{8}$/.test(number)) number = '+20' + number.slice(1);
    if (/^201[0125]\d{8}$/.test(number)) number = '+' + number;
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
      ? `طلب تقديم — RVU Camp / الدفعة الثانية\n\nالاسم: ${name}\nواتساب: ${phone}\nالمستوى: ${level}\nهدفي: ${goal}\n\nالمصدر: صفحة معاينة الدفعة الثانية /test/`
      : `Application — RVU Camp / Cohort 02\n\nName: ${name}\nWhatsApp: ${phone}\nLevel: ${level}\nGoal: ${goal}\n\nSource: Cohort 02 preview /test/`;
    const url = new URL('https://wa.me/201280499854');
    url.searchParams.set('text', message);
    $('application-whatsapp').href = url.href;
    return true;
  }
  let saveState = 'pending';
  let submitting = false;
  const attempts = new Map();
  const saveCopy = {
    ar: {
      pending: ['جاري حفظ طلبك…', 'بنحاول نحفظ بياناتك. تقدر تفتح واتساب وتكمّل التواصل في أي وقت.'],
      saved: ['تم حفظ طلبك بنجاح.', 'وصل تأكيد من خدمة التقديم بحفظ البيانات. تقدر تكمل على واتساب لتنسيق الانترفيو. التقديم لا يعني القبول أو حجز المقعد.'],
      unconfirmed: ['ماقدرناش نتأكد من حفظ الطلب.', 'ممكن يكون الاتصال انقطع أو خدمة التقديم غير متاحة. ابعت الرسالة الجاهزة على واتساب عشان تتأكد إن طلبك وصل.']
    },
    en: {
      pending: ['Saving your application…', 'We are trying to save your details. You can continue on WhatsApp at any time.'],
      saved: ['Your application has been saved.', 'The application service confirmed the save. Continue on WhatsApp to arrange your interview. Applying does not mean acceptance or reserve a seat.'],
      unconfirmed: ['We could not confirm the save.', 'The connection may have been interrupted or the service may be unavailable. Send the prepared WhatsApp message to make sure your application reaches me.']
    }
  };
  function renderSaveStatus() {
    const copy = saveCopy[isArabic() ? 'ar' : 'en'][saveState];
    $('save-title').textContent = copy[0];
    $('save-status').textContent = copy[1];
    const mark = document.querySelector('.ready-mark');
    mark.dataset.state = saveState;
    mark.textContent = saveState === 'saved' ? '✓' : saveState === 'pending' ? '…' : '!';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    $('form-error').hidden = true;
    if (!form.reportValidity()) return;
    if (!prepareMessage()) {
      $('form-error').textContent = isArabic() ? 'راجع اسمك وهدفك، واكتب رقم واتساب صحيح بكود الدولة، مثل +20.' : 'Check your name and goal, and enter a valid WhatsApp number with country code, such as +20.';
      $('form-error').hidden = false;
      return;
    }
    const fields = form.elements;
    const payload = {name: fields.name.value.trim(), phone: normalizedPhone(fields.phone.value), level: fields.level.value, goal: fields.goal.value.trim()};
    const fingerprint = JSON.stringify(payload);
    const previous = attempts.get(fingerprint);
    form.hidden = true;
    $('application-ready').hidden = false;
    saveState = previous || 'pending';
    renderSaveStatus();
    $('application-whatsapp').focus();
    // An uncertain response may already have saved: never automatically retry it.
    if (previous) return;
    submitting = true;
    $('edit-application').disabled = true;
    attempts.set(fingerprint, 'pending');
    Object.assign(payload, {submission_id: crypto.randomUUID(), submitted_at: new Date().toISOString(), page_url: location.origin + location.pathname, cohort: '02', source: 'test-preview', language: isArabic() ? 'ar' : 'en', _subject: 'RVU Camp cohort 02 application — ' + payload.name});
    const params = new URLSearchParams(location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) payload[key] = (params.get(key) || '').slice(0, 200);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('https://formspree.io/f/xoeqykpq', {
        method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('Save not confirmed');
      saveState = 'saved';
    } catch (_) { saveState = 'unconfirmed'; }
    finally {
      clearTimeout(timeout);
      attempts.set(fingerprint, saveState);
      submitting = false;
      $('edit-application').disabled = false;
      renderSaveStatus();
    }
  });
  $('edit-application').addEventListener('click', () => {
    if (submitting) return;
    $('application-ready').hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  const samples = {
    ar: {
      map: {file:'target-map.md', title:'خريطة تطبيق تجريبي', intro:'ابدأ بالوظائف والحسابات وحدود الصلاحيات. حدّد سؤالًا واضحًا لكل جزء.', headers:['الجزء','إيه اللي نفهمه؟','سؤال الاختبار'], rows:[['الحسابات','زائر · عميل A · عميل B','مين يقدر يشوف أو يعدّل إيه؟'],['الطلبات','إنشاء الطلب · عرضه · إلغاؤه','هل الملكية بتتراجع في كل خطوة؟'],['الـAPI','المسارات · المعرفات · الجلسة','هل الصلاحيات متطابقة مع الواجهة؟']], note:'الأولوية: ابدأ بالوظائف الحساسة داخل الـScope، وسجّل اللي لسه مش فاهمه.'},
      plan: {file:'test-plan.md', title:'من سؤال لفرضية اختبار', intro:'مثال: مراجعة صلاحيات عرض الطلبات بين حسابين اختباريين تملكهم.', headers:['الخطوة','التطبيق','الدليل المطلوب'], rows:[['Baseline','اعرض طلب A من حساب A','استجابة متوقعة ومرجع للمقارنة'],['الاختبار','اطلب مورد B من جلسة A','تحديد المورد والحساب بوضوح'],['التحقّق','قارن البيانات والصلاحيات','رفض الوصول أم تسريب بيانات فعلية؟']], note:'كود 200 وحده لا يثبت الثغرة. وثّق النتيجة حتى لو النظام منع الوصول بشكل صحيح.'},
      report: {file:'finding-draft.md', title:'تقرير يسهّل إعادة الاختبار', intro:'هيكل تعليمي لتقرير محتمل؛ لا يزعم وجود ثغرة أو نتيجة فعلية.', items:[['الملخّص','حدّد الوظيفة والسلوك غير المتوقع والشرط اللازم لحدوثه.'],['الخطوات','اذكر الحسابات التجريبية، الطلب المرجعي، والتغيير الواحد الذي اختبرته.'],['الدليل','اربط كل خطوة باستجابة مناسبة بعد إخفاء البيانات الحساسة.'],['الأثر','اشرح الوصول غير المصرح به الذي أثبتّه فقط، وحدود ما اختبرته.']], note:'قبل الإرسال: راجع الـScope، وأزل الأسرار، وتأكد إن شخص تاني يقدر يعيد الخطوات.'}
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
  let selectedAnswer = null;
  const answers = {
    ar: {
      report:['لسه محتاج دليل أقوى.','تغيّر السعر في الواجهة ممكن يكون مجرد عرض محلي. قبل التقرير، قارن المبلغ اللي السيرفر اعتمده مع السعر المتوقع وحالة الطلب داخل البيئة التدريبية.'],
      verify:['بالضبط. اثبت النتيجة على السيرفر.','راجع الإجمالي المحفوظ وحالة الطلب باستخدام حساباتك التجريبية. لو السيرفر حسب السعر الصحيح، تغيير الواجهة وحده مش ثغرة. ولو ثبت اختلاف غير مصرح به، وثّق الخطوات والأثر وحدود الدليل.'],
      tools:['ارجع للسلوك الأساسي الأول.','تجربة قيم أكتر من غير متابعة حالة الطلب بتزود الضوضاء. اعرف القيمة الأصلية، غيّر متغير واحد، وقارن النتيجة اللي السيرفر اعتمدها.']
    },
    en: {
      report:['You still need stronger evidence.','The displayed price might only be a local UI change. Before reporting, compare the server-approved amount with the expected price and order state in the training environment.'],
      verify:['Exactly. Verify the server-side outcome.','Check the stored total and order state using your test accounts. If the server calculates the correct price, a UI change alone is not a vulnerability. If you prove an unauthorized discrepancy, document the steps, impact and evidence limits.'],
      tools:['Return to the baseline first.','Trying more values without following the order state adds noise. Establish the original value, change one variable, and compare the server-approved outcome.']
    }
  };
  function renderChallenge() {
    if (!selectedAnswer) return;
    const [title,copy] = answers[isArabic() ? 'ar' : 'en'][selectedAnswer];
    $('challenge-result').hidden = false;
    $('challenge-result').replaceChildren(node('strong',title),node('p',copy));
  }
  document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    selectedAnswer = button.dataset.answer;
    document.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    renderChallenge();
  }));
  // Independent media shelves share the same drag, touch and keyboard behavior.
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
      $(prefix+'-position').textContent=isArabic()?`العناصر ${first}–${Math.max(first,last)} من ${cards.length}`:`Items ${first}–${Math.max(first,last)} of ${cards.length}`;
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
    $('gallery-full-image').src = path;
    $('image-position').textContent = `${activeImage+1} / ${researchImages.length}`;
  }
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
  renderSaveStatus();
})();
