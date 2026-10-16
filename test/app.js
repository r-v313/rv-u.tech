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
  form.addEventListener('submit', event => {
    event.preventDefault();
    $('form-error').hidden = true;
    if (!form.reportValidity()) return;
    if (!prepareMessage()) {
      $('form-error').textContent = isArabic() ? 'راجع اسمك وهدفك، واكتب رقم واتساب صحيح بكود الدولة، مثل +20.' : 'Check your name and goal, and enter a valid WhatsApp number with country code, such as +20.';
      $('form-error').hidden = false;
      return;
    }
    form.hidden = true;
    $('application-ready').hidden = false;
    $('application-whatsapp').focus();
  });
  $('edit-application').addEventListener('click', () => {
    $('application-ready').hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();
