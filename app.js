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
    document.title = ar ? 'الدفعة الخامسة — التقديم مفتوح الآن | RVU Mentorship Camp' : 'Cohort 05 — Applications Open | RVU Mentorship Camp';
    $('form-error').hidden = true;
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
  const videos = new Set(['0O1a8Uv2RIs', 'xZR5-4iXnI0', 'CZx_WauYbcI', 'FDWt0pSoFTA']);
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
      ? `طلب تقديم — RVU Camp / الدفعة الخامسة\n\nالاسم: ${name}\nواتساب: ${phone}\nالمستوى: ${level}\nهدفي: ${goal}\n\nالمصدر: موقع RVU Camp الرسمي`
      : `Application — RVU Camp / Cohort 05\n\nName: ${name}\nWhatsApp: ${phone}\nLevel: ${level}\nGoal: ${goal}\n\nSource: RVU Camp official website`;
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
        page_url:location.origin + location.pathname, cohort:'05',
        source:'camp-website', language:isArabic() ? 'ar' : 'en',
        _subject:'RVU Camp cohort 05 application - ' + payload.name
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
  const shelves=[createShelf('gallery-track','gallery')];

  // Reports gallery: native touch swipe, mouse drag, keyboard and a visible range scrollbar.
  function setupReportsCarousel() {
    const track=$('reports-track'),bar=$('reports-scrollbar');
    if(!track||!bar)return {reset(){}};
    let frame=null,drag=null,suppressUntil=0,barDragging=false;
    const rtl=()=>getComputedStyle(track).direction==='rtl';
    const max=()=>Math.max(0,track.scrollWidth-track.clientWidth);
    const position=()=>Math.min(max(),Math.max(0,Math.abs(track.scrollLeft)));
    const moveTo=(offset,smooth=false)=>{
      const clamped=Math.min(max(),Math.max(0,offset));
      const signed=clamped*(rtl()?-1:1);
      track.scrollTo({left:signed,behavior:smooth&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
    };
    function update(){
      const distance=max();
      const val=distance?Math.round(position()/distance*1000):0;
      if(!barDragging)bar.value=String(val);
      bar.style.setProperty('--reports-progress',val/10+'%');
      bar.disabled=distance<4;
    }
    const schedule=()=>{
      if(frame!==null)return;
      frame=requestAnimationFrame(()=>{frame=null;update()});
    };
    track.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(schedule).observe(track);
    bar.addEventListener('pointerdown',()=>{barDragging=true;track.classList.add('is-dragging')});
    bar.addEventListener('input',()=>{
      const val=Number(bar.value);
      track.classList.add('is-dragging');
      bar.style.setProperty('--reports-progress',val/10+'%');
      moveTo(max()*val/1000);
    });
    const releaseBar=()=>{
      if(!barDragging)return;
      barDragging=false;
      track.classList.remove('is-dragging');
      schedule();
    };
    bar.addEventListener('change',releaseBar);
    bar.addEventListener('pointerup',releaseBar);
    bar.addEventListener('pointercancel',releaseBar);
    bar.addEventListener('blur',releaseBar);
    track.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button===0)
        drag={id:event.pointerId,startX:event.clientX,scroll:track.scrollLeft,moved:false};
    });
    track.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const delta=event.clientX-drag.startX;
      if(!drag.moved&&Math.abs(delta)<7)return;
      if(!drag.moved){
        drag.moved=true;
        track.classList.add('is-dragging');
        track.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      const bound=max(),newPos=drag.scroll-delta;
      track.scrollLeft=rtl()?Math.max(-bound,Math.min(0,newPos)):Math.max(0,Math.min(bound,newPos));
      schedule();
    });
    const finish=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const moved=drag.moved;
      drag=null;
      track.classList.remove('is-dragging');
      if(track.hasPointerCapture?.(event.pointerId))track.releasePointerCapture(event.pointerId);
      if(moved){suppressUntil=performance.now()+350;schedule()}
    };
    window.addEventListener('pointerup',finish);
    window.addEventListener('pointercancel',finish);
    track.addEventListener('lostpointercapture',finish);
    track.addEventListener('dragstart',event=>event.preventDefault());
    track.addEventListener('click',event=>{
      if(performance.now()<suppressUntil&&event.detail!==0){
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
    track.addEventListener('keydown',event=>{
      if(event.target!==track)return;
      const cards=[...track.querySelectorAll('.research-card')];
      const step=(cards[0]?.getBoundingClientRect().width||300)+(parseFloat(getComputedStyle(track).gap)||12);
      let dest=null;
      if(event.key==='Home')dest=0;
      else if(event.key==='End')dest=max();
      else if(event.key==='ArrowLeft')dest=position()+(rtl()?step:-step);
      else if(event.key==='ArrowRight')dest=position()+(rtl()?-step:step);
      if(dest===null)return;
      event.preventDefault();
      moveTo(dest,true);
    });
    requestAnimationFrame(update);
    return {reset(){barDragging=false;track.classList.remove('is-dragging');moveTo(0);update()}};
  }
  const reportCarousel=setupReportsCarousel();
  shelves.push(reportCarousel);


  const researchImages = [
    ['Account Takeover','Account Takeover'],
    ['Information Disclosure','Information Disclosure'],
    ['API Authorization','API Authorization'],
    ['Access Control','Access Control'],
    ['Stored XSS','Stored XSS'],
    ['Report Accepted','Report Accepted']
  ];
  let activeImage = 0;
  function showResearchImage(index) {
    activeImage = (index + researchImages.length) % researchImages.length;
    const title = researchImages[activeImage][isArabic() ? 0 : 1];
    const path = `/poc-0${activeImage+1}-full.webp`;
    const original = `/poc-0${activeImage+1}.png`;
    $('image-title').textContent = title;
    $('image-original').href = original;
    $('gallery-full-image').alt = title;
    $('image-error').hidden = true;
    $('gallery-full-image').hidden = false;
    $('image-stage').classList.remove('is-zoomed');
    $('image-zoom').setAttribute('aria-pressed', 'false');
    $('image-stage').scrollTo({top:0,left:0,behavior:'instant'});
    $('gallery-full-image').src = path;
  }
  $('image-zoom').addEventListener('click', () => {
    const zoomed = $('image-stage').classList.toggle('is-zoomed');
    $('image-zoom').setAttribute('aria-pressed',String(zoomed));
    $('image-stage').scrollTo({top:0,left:0,behavior:'instant'});
  });
  $('gallery-full-image').addEventListener('error', () => { $('image-error').hidden = false; $('gallery-full-image').hidden = true; });
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {showResearchImage(Number(button.dataset.image));openDialog($('image-dialog'));}));
})();
