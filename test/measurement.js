'use strict';
(() => {
  const allowed = new Set(['Interview_Open','Teaching_Video_Open','Application_Saved','WhatsApp_Click','Guide_Download','PDF_Open','Labs_Open']);
  window.rvuTrack = event => {
    if (!allowed.has(event)) return;
    document.dispatchEvent(new CustomEvent('rvu:interaction', {detail:{event}}));
    // Reuse the owner's measurement only after promotion to the root website.
    // The /test/ preview sends no tracking requests and stores no event data.
    if (location.pathname === '/' && typeof window.clarity === 'function') window.clarity('event', event);
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
