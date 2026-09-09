'use strict';
(function(){
  const STORAGE_KEY='rvuApplicationPendingV1';
  const STATUS_KEY='rvuApplicationStatusV1';
  const ERROR_KEY='rvuApplicationErrorV1';
  const TRACK_PREFIX='rvuLinkedInTracked:';
  const CONVERSION_ID=30331010;
  const form=document.getElementById('applicationForm');
  if(!form)return;

  function ar(){return (window.RVU_LANG||document.documentElement.lang||'ar').toLowerCase().startsWith('ar');}
  function setLocalized(el,arabic,english){
    if(!el)return;
    el.dataset.ar=arabic;
    el.dataset.en=english;
    el.textContent=ar()?arabic:english;
  }
  function selectedText(select){
    if(!select||select.selectedIndex<0)return'';
    return select.options[select.selectedIndex].textContent.trim();
  }
  function safeJson(raw){try{return JSON.parse(raw);}catch(_){return null;}}

  // Add WhatsApp number to the existing form without changing the site's visual system.
  if(!document.getElementById('appWhatsApp')){
    const nameInput=document.getElementById('appName');
    const nameField=nameInput&&nameInput.closest('.form-field');
    if(nameField){
      const field=document.createElement('div');
      field.className='form-field';
      const label=document.createElement('label');
      label.className='i18n';
      label.htmlFor='appWhatsApp';
      label.dataset.ar='رقم واتساب';
      label.dataset.en='WhatsApp number';
      label.textContent='رقم واتساب';
      const input=document.createElement('input');
      input.id='appWhatsApp';
      input.name='whatsapp';
      input.type='tel';
      input.inputMode='tel';
      input.autocomplete='tel';
      input.maxLength=20;
      input.required=true;
      input.placeholder='مثال: +20 10 1234 5678';
      input.dataset.placeholderAr='مثال: +20 10 1234 5678';
      input.dataset.placeholderEn='e.g. +20 10 1234 5678';
      field.append(label,input);
      nameField.insertAdjacentElement('afterend',field);
    }
  }

  const privacy=form.querySelector('.form-privacy');
  setLocalized(
    privacy,
    'بيانات التقديم بتتحفظ عشان أراجع طلبك وبعد نجاح الحفظ هتظهرلك رسالة واتساب جاهزة للتواصل وإنت اللي تختار تبعتها.',
    'Your application is saved for review. After it is stored successfully, you can optionally send the prepared WhatsApp message for follow-up.'
  );

  const submitBtn=form.querySelector('.application-submit');
  if(submitBtn){
    submitBtn.dataset.ar='إرسال طلب التقديم';
    submitBtn.dataset.en='Submit Application';
    submitBtn.textContent='إرسال طلب التقديم';
  }

  const success=document.getElementById('applicationSuccess');
  if(success){
    const title=success.querySelector('h3');
    const copy=success.querySelector('p');
    setLocalized(title,'تم استلام طلبك','Application received');
    setLocalized(
      copy,
      'طلبك اتحفظ بنجاح وهراجعه ولو المستوى مناسب هنحدد الانترفيو. تقدر تبعت رسالة واتساب الجاهزة دلوقتي عشان نكمل التواصل بسرعة.',
      'Your application was saved successfully. I will review it and, if the level fits, we will schedule the interview. You can send the prepared WhatsApp message now for faster follow-up.'
    );
  }

  // Keep the FAQ consistent with the new server-side application flow.
  const faqItems=document.querySelectorAll('#faq-section .faq-item');
  if(faqItems.length){
    const lastAnswer=faqItems[faqItems.length-1].querySelector('.faq-answer');
    if(lastAnswer){
      setLocalized(
        lastAnswer,
        'هتملا طلب مختصر على الموقع وبيتحفظ عندي للمراجعة وبعدها تقدر تبعت رسالة واتساب جاهزة للمتابعة. لو المستوى مناسب هنحدد الانترفيو وبعده هقولك بصراحة Accepted أو Not Yet ولو محتاج تراجع جزء معين هقولك عليه والدفع بيكون بس بعد القبول لو إنت قررت تدخل.',
        'You submit a short application on the website and it is saved for review. You can then send a prepared WhatsApp message for follow-up. If the level fits, we schedule the interview and then I tell you directly Accepted or Not Yet. Payment only happens after acceptance if you decide to join.'
      );
    }
  }

  let errorBox=document.getElementById('applicationError');
  if(!errorBox){
    errorBox=document.createElement('div');
    errorBox.id='applicationError';
    errorBox.className='form-privacy';
    errorBox.setAttribute('role','alert');
    errorBox.style.display='none';
    errorBox.style.color='#ff9b73';
    if(submitBtn)form.insertBefore(errorBox,submitBtn);
  }

  function setBusy(busy){
    if(!submitBtn)return;
    submitBtn.disabled=busy;
    submitBtn.setAttribute('aria-busy',busy?'true':'false');
    submitBtn.textContent=busy?(ar()?'جارٍ حفظ طلبك...':'Saving application...'):(ar()?'إرسال طلب التقديم':'Submit Application');
    if(!busy)submitBtn.removeAttribute('aria-busy');
  }

  function newId(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  }

  function getPayload(){
    const name=document.getElementById('appName').value.trim();
    const whatsapp=document.getElementById('appWhatsApp').value.trim();
    const levelSelect=document.getElementById('appLevel');
    const liveSelect=document.getElementById('appLiveTargets');
    const goal=document.getElementById('appGoal').value.trim();
    const originalUrl=new URL(window.location.href);
    originalUrl.searchParams.delete('rvu_application');
    const p=originalUrl.searchParams;
    return {
      submission_id:newId(),
      name:name,
      whatsapp:whatsapp,
      level:levelSelect.value,
      level_display:selectedText(levelSelect),
      liveTargets:liveSelect.value,
      live_targets_display:selectedText(liveSelect),
      goal:goal,
      language:ar()?'ar':'en',
      page_url:originalUrl.href,
      return_url:originalUrl.href,
      referrer:document.referrer||'direct',
      submitted_at:new Date().toISOString(),
      utm_source:p.get('utm_source')||'',
      utm_medium:p.get('utm_medium')||'',
      utm_campaign:p.get('utm_campaign')||'',
      utm_content:p.get('utm_content')||'',
      utm_term:p.get('utm_term')||'',
      li_fat_id:p.get('li_fat_id')||''
    };
  }

  // Capture phase prevents the legacy local-only WhatsApp submit handler from firing.
  form.addEventListener('submit',function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!form.reportValidity())return;
    errorBox.style.display='none';
    errorBox.textContent='';
    const payload=getPayload();
    try{
      sessionStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
      sessionStorage.removeItem(STATUS_KEY);
      sessionStorage.removeItem(ERROR_KEY);
    }catch(err){
      errorBox.textContent=ar()?'المتصفح منع حفظ بيانات الطلب مؤقتًا. افتح الموقع في تبويب عادي وجرب تاني.':'The browser blocked temporary application storage. Open the site in a normal tab and try again.';
      errorBox.style.display='block';
      return;
    }
    if(typeof window.rvuTrackClarity==='function')window.rvuTrackClarity('Application_Submit_Start');
    setBusy(true);
    window.location.assign('./submit.html');
  },true);

  function restoreFields(payload){
    const name=document.getElementById('appName');
    const whatsapp=document.getElementById('appWhatsApp');
    const level=document.getElementById('appLevel');
    const live=document.getElementById('appLiveTargets');
    const goal=document.getElementById('appGoal');
    if(name)name.value=payload.name||'';
    if(whatsapp)whatsapp.value=payload.whatsapp||'';
    if(level)level.value=payload.level||'';
    if(live)live.value=payload.liveTargets||'';
    if(goal)goal.value=payload.goal||'';
  }

  function buildWhatsApp(payload){
    const isArabic=payload.language==='ar';
    return isArabic
      ?`طلب تقديم لانترفيو rv_u camp — أول دفعة أونلاين\n\nالاسم: ${payload.name}\nواتساب: ${payload.whatsapp}\nالمستوى الحالي: ${payload.level_display}\nاشتغلت على Live Targets قبل كده؟ ${payload.live_targets_display}\nهدفي من الكامب: ${payload.goal}\n\nفاهم إن التقديم لا يعني قبول تلقائي، وإن مفيش باونتي مضمونة، والنتائج تعتمد على الاجتهاد والاستمرار.`
      :`rv_u camp Interview Application — Online Cohort 01\n\nName: ${payload.name}\nWhatsApp: ${payload.whatsapp}\nCurrent level: ${payload.level_display}\nHunted live targets before? ${payload.live_targets_display}\nGoal: ${payload.goal}\n\nI understand that applying does not guarantee acceptance or a bounty, and that results depend on consistent practice and effort.`;
  }

  function openModal(){
    const modal=document.getElementById('applicationModal');
    if(!modal)return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    document.body.classList.add('application-open');
  }

  function trackLinkedInOnce(payload){
    const key=TRACK_PREFIX+payload.submission_id;
    try{if(sessionStorage.getItem(key)==='1')return;}catch(_){}
    let tries=0;
    function send(){
      if(typeof window.lintrk==='function'){
        window.lintrk('track',{conversion_id:CONVERSION_ID});
        try{sessionStorage.setItem(key,'1');}catch(_){}
        return;
      }
      if(tries++<8)setTimeout(send,350);
    }
    send();
  }

  function cleanMarker(){
    try{
      const u=new URL(window.location.href);
      if(u.searchParams.has('rvu_application')){
        u.searchParams.delete('rvu_application');
        history.replaceState(null,'',u.pathname+(u.search?u.search:'')+u.hash);
      }
    }catch(_){}
  }

  function handleReturn(){
    let status=null,payload=null,error='';
    try{
      status=sessionStorage.getItem(STATUS_KEY);
      payload=safeJson(sessionStorage.getItem(STORAGE_KEY));
      error=sessionStorage.getItem(ERROR_KEY)||'';
    }catch(_){}
    if(!status||!payload)return;

    // Returning from submit.html should not replay the full intro animation.
    const skip=document.getElementById('skipIntro');
    if(skip&&typeof skip.click==='function')skip.click();
    restoreFields(payload);
    openModal();
    setBusy(false);

    if(status==='success'){
      if(success)success.classList.add('show');
      form.style.display='none';
      const summary=document.getElementById('applicationSummary');
      const isArabic=payload.language==='ar';
      if(summary){
        summary.textContent=isArabic
          ?`الاسم: ${payload.name}\nواتساب: ${payload.whatsapp}\nالمستوى: ${payload.level_display}\nLive Targets: ${payload.live_targets_display}\nالهدف: ${payload.goal}`
          :`Name: ${payload.name}\nWhatsApp: ${payload.whatsapp}\nLevel: ${payload.level_display}\nLive Targets: ${payload.live_targets_display}\nGoal: ${payload.goal}`;
      }
      const wa=document.getElementById('applicationWhatsApp');
      if(wa){
        const u=new URL('https://wa.me/201280499854');
        u.searchParams.set('text',buildWhatsApp(payload));
        wa.href=u.href;
        wa.rel='noopener noreferrer';
      }
      const edit=document.getElementById('applicationEdit');
      if(edit)edit.style.display='none';
      if(typeof window.rvuTrackClarity==='function')window.rvuTrackClarity('Application_Form_Complete');
      trackLinkedInOnce(payload);
    }else{
      if(success)success.classList.remove('show');
      form.style.display='grid';
      errorBox.textContent=ar()?'حصلت مشكلة أثناء حفظ الطلب. بياناتك لسه موجودة، جرّب الإرسال مرة تانية.':'We could not save your application. Your answers are still here; please try again.';
      if(error)errorBox.title=error;
      errorBox.style.display='block';
      if(typeof window.rvuTrackClarity==='function')window.rvuTrackClarity('Application_Submit_Error');
    }

    try{
      sessionStorage.removeItem(STATUS_KEY);
      sessionStorage.removeItem(ERROR_KEY);
    }catch(_){}
    cleanMarker();
  }

  window.RVUApplicationPatch={afterCore:handleReturn};
})();
