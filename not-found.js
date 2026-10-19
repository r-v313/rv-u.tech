'use strict';
(() => {
  const files = new Set(["RVU_Field_Kit_AR_EN.pdf","report-template-ar.pdf","report-template-en.pdf","recon-checklist-ar.pdf","recon-checklist-en.pdf","camp-preparation-ar.pdf","camp-preparation-en.pdf","camp-preparation-ar.md","camp-preparation-en.md","recon-checklist-ar.md","recon-checklist-en.md","report-template-ar.md","report-template-en.md"]);
  const prefix = '/test/resources/';
  if (!location.pathname.startsWith(prefix)) return;
  const filename = location.pathname.slice(prefix.length);
  if (!files.has(filename)) return;
  const target = new URL('/resources/' + filename, location.origin);
  target.hash = location.hash;
  location.replace(target.href);
})();
