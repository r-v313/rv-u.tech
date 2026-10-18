'use strict';
(() => {
  const destination = new URL('/', location.origin);
  destination.hash = location.hash;
  const current = new URLSearchParams(location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    if (current.has(key)) destination.searchParams.set(key, current.get(key).slice(0, 200));
  }
  location.replace(destination.href);
})();
