'use strict';
(() => {
  const language = document.getElementById('language');
  const ar = () => document.documentElement.lang === 'ar';
  function updateResources() {
    document.querySelectorAll('[data-resource]').forEach(link => {
      link.href = `./resources/${link.dataset.resource}-${ar() ? 'ar' : 'en'}.md`;
    });
    document.querySelectorAll('[data-pdf-guide]').forEach(link => {
      const page = link.dataset[ar() ? 'pageAr' : 'pageEn'];
      link.href = './resources/RVU_Field_Kit_AR_EN.pdf' + (page ? '#page=' + page : '');
    });
  }
  function decorateTechnicalTerms() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (!/[\u0600-\u06ff]/.test(text.nodeValue) || !/[A-Za-z]/.test(text.nodeValue)) continue;
      if (text.parentElement.closest('bdi,script,style,svg,option,textarea,code,pre')) continue;
      nodes.push(text);
    }
    nodes.forEach(text => {
      const fragment = document.createDocumentFragment();
      const pattern = /[A-Za-z][A-Za-z0-9]*(?:[ /+.-][A-Za-z][A-Za-z0-9]*)*/g;
      let start = 0;
      for (const match of text.nodeValue.matchAll(pattern)) {
        fragment.append(document.createTextNode(text.nodeValue.slice(start, match.index)));
        const term = document.createElement('bdi');
        term.dir = 'ltr'; term.textContent = match[0]; fragment.append(term);
        start = match.index + match[0].length;
      }
      fragment.append(document.createTextNode(text.nodeValue.slice(start)));
      text.replaceWith(fragment);
    });
  }
  language.addEventListener('click', () => { updateResources(); decorateTechnicalTerms(); });
  document.querySelectorAll('[data-work],[data-step],[data-answer]').forEach(button => button.addEventListener('click', decorateTechnicalTerms));
  updateResources();
  decorateTechnicalTerms();
  const country = document.getElementById('phone-country');
  const phone = document.querySelector('input[name="phone"]');
  country.addEventListener('change', () => {
    phone.placeholder = country.value === '+20' ? '010 1234 5678' : country.value ? '5xx xxx xxxx' : '+44 7xxx xxxxxx';
  });
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
