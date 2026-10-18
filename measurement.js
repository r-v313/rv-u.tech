'use strict';
(() => {
  const live = window.top === window.self && !new URLSearchParams(location.search).has('layout-review');
  if (live) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push('9685434');
    window.lintrk = window.lintrk || function (action, data) { window.lintrk.q.push([action, data]); };
    window.lintrk.q = window.lintrk.q || [];
    for (const src of ['https://www.clarity.ms/tag/ydzz6gt587', 'https://snap.licdn.com/li.lms-analytics/insight.min.js']) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      document.head.append(script);
    }
  }
  const allowed = new Set(['Interview_Open','Teaching_Video_Open','Application_Saved','WhatsApp_Click','Guide_Download','PDF_Open','Labs_Open']);
  window.rvuTrack = event => {
    if (!allowed.has(event)) return;
    if (live) {
      window.clarity('event', event);
      if (event === 'Application_Saved') window.lintrk('track', {conversion_id: 30331010});
    }
    document.dispatchEvent(new CustomEvent('rvu:interaction', {detail:{event}}));


  };
  document.addEventListener('click', event => {
    const target = event.target.closest('button,a');
    if (!target) return;
    if (target.matches('[data-apply]')) window.rvuTrack('Interview_Open');
    else if (target.matches('[data-video]')) window.rvuTrack('Teaching_Video_Open');
    else if (target.matches('[data-resource]')) window.rvuTrack('Guide_Download');
    else if (target.matches('[data-pdf-guide]')) window.rvuTrack('PDF_Open');
    else if (target.href?.startsWith('https://wa.me/')) window.rvuTrack('WhatsApp_Click');
    else if (target.getAttribute('href') === '/labs/') window.rvuTrack('Labs_Open');
  });
})();
