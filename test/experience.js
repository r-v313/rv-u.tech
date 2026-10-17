'use strict';
(() => {
  const language = document.getElementById('language');
  const ar = () => document.documentElement.lang === 'ar';
  function updateResources() {
    document.querySelectorAll('[data-resource]').forEach(link => {
      link.href = `./resources/${link.dataset.resource}-${ar() ? 'ar' : 'en'}.md`;
    });
  }
  language.addEventListener('click', updateResources);
  updateResources();
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
