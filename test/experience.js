'use strict';
(() => {
  const language = document.getElementById('language');
  const readiness = [...document.querySelectorAll('input[name="readiness"]')];
  const result = document.getElementById('readiness-result');
  const ar = () => document.documentElement.lang === 'ar';
  function updateReadiness() {
    const count = readiness.filter(input => input.checked).length;
    const messages = ar() ? [
      'اختار اللي ينطبق عليك؛ ولو محتاج تجهّز حاجة، قائمة التجهيز تساعدك تبدأ.',
      'بداية كويسة. راجع النقط المتبقية، ونتكلم عن أنسب خطوة ليك في الانترفيو.',
      'الأساسيات والوقت عندك متوافقين مع القائمة. الانترفيو يساعدنا نفهم مستواك وهدفك أكتر.'
    ] : [
      'Select what applies to you. Use the preparation guide to work on any gaps.',
      'A good start. Review the remaining items; we can discuss your next step in the interview.',
      'Your foundations and availability match this checklist. The interview helps me understand your level and goals.'
    ];
    result.textContent = (ar() ? `${count} من ٤ · ` : `${count} of 4 · `) + messages[count === 0 ? 0 : count === 4 ? 2 : 1];
  }
  function updateResources() {
    document.querySelectorAll('[data-resource]').forEach(link => {
      link.href = `./resources/${link.dataset.resource}-${ar() ? 'ar' : 'en'}.md`;
    });
  }
  readiness.forEach(input => input.addEventListener('change', updateReadiness));
  language.addEventListener('click', () => { updateReadiness(); updateResources(); });
  updateReadiness(); updateResources();
  // Section links expose the active reading location without shifting focus.
  const links = [...document.querySelectorAll('#navigation a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const current = links.find(link => visible.get(link.hash.slice(1)));
      links.forEach(link => {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin: '-12% 0px -50% 0px', threshold: 0});
    links.forEach(link => { const section = document.querySelector(link.hash); if(section) observer.observe(section); });
  }
})();
