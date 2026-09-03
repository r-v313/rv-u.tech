if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function rvuForceTop() {
  const root = document.documentElement;
  const previousInlineBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  requestAnimationFrame(() => { root.style.scrollBehavior = previousInlineBehavior; });
}
rvuForceTop();
window.addEventListener('pageshow', rvuForceTop, { once: true });
window.addEventListener('load', () => requestAnimationFrame(rvuForceTop), { once: true });
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.updateCardName = function(val) {
    const cardName = document.getElementById('holoCardName');
    if (!cardName) return;
    const trimmed = (val || '').trim().replace(/\s+/g, ' ');
    const isAr = window.RVU_LANG === 'ar';
    const defaultText = isAr ? 'اكتب اسمك هنا' : 'PUT YOUR NAME';
    const displayVal = trimmed.length > 0 ? trimmed.toUpperCase() : defaultText;
    
    cardName.textContent = displayVal;
    const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
    cardName.style.direction = hasArabic ? 'rtl' : 'ltr';
    cardName.style.unicodeBidi = 'isolate';
    cardName.style.fontFamily = hasArabic ? "'IBM Plex Sans Arabic', sans-serif" : "'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif";

    const displayLen = displayVal.length;
    if (displayLen > 24) {
      cardName.style.fontSize = 'clamp(.82rem, 2.2vw, 1.15rem)';
    } else if (displayLen > 18) {
      cardName.style.fontSize = 'clamp(1rem, 2.8vw, 1.45rem)';
    } else if (displayLen > 12) {
      cardName.style.fontSize = 'clamp(1.2rem, 3.5vw, 1.8rem)';
    } else {
      cardName.style.fontSize = '';
    }

    requestAnimationFrame(() => {
      if (!cardName.clientWidth || cardName.scrollWidth <= cardName.clientWidth) return;
      let size = parseFloat(getComputedStyle(cardName).fontSize) || 18;
      while (cardName.scrollWidth > cardName.clientWidth && size > 11) {
        size -= 1;
        cardName.style.fontSize = `${size}px`;
      }
    });
  };

  (function () {
    const preloader = document.getElementById('preloader');
    const canvas = document.getElementById('spaceCanvas');
    if (!preloader) return;

    const INTRO_DURATION = 10000;
    const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const startedAt = performance.now();
    let finished = false;
    let animId = 0;
    let resizeCanvas = null;
    let seenIntro = false;

    try {
      seenIntro = window.localStorage.getItem('rvuIntroSeenV5') === '1';
    } catch (_) {}

    if (seenIntro) preloader.classList.add('seen-before');
    if (!seenIntro) {
      try { window.localStorage.setItem('rvuIntroSeenV5', '1'); } catch (_) {}
    }

    document.body.classList.add('loading');

    function setStage(name) {
      preloader.classList.add(name);
    }

    function cleanupIntro() {
      if (animId) cancelAnimationFrame(animId);
      if (resizeCanvas) window.removeEventListener('resize', resizeCanvas);
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }

    function finishIntro(fast) {
      if (finished) return;
      finished = true;
      if (!fast) setStage('stage-reveal');
      preloader.classList.add('hide');
      document.body.classList.remove('loading');
      document.body.classList.add('intro-complete');
      rvuForceTop();
      setTimeout(cleanupIntro, fast ? 100 : 320);
    }

    const skipIntro = document.getElementById('skipIntro');
    if (skipIntro) skipIntro.addEventListener('click', () => finishIntro(true));

    if (reduceMotion) {
      setStage('stage-brand');
      setStage('stage-tagline');
      setTimeout(() => finishIntro(true), 420);
    } else if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      const TAU = Math.PI * 2;
      const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
      const smoothstep = (a, b, v) => {
        const x = clamp((v - a) / (b - a));
        return x * x * (3 - 2 * x);
      };
      const easeOutCubic = v => 1 - Math.pow(1 - clamp(v), 3);
      const lerp = (a, b, t) => a + (b - a) * t;

      const nodeDefs = [
        { id:'target', label:'PRIMARY', sub:'target', x:.50, y:.50, hot:true },
        { id:'api', label:'api', sub:'200', x:.73, y:.29, hot:true },
        { id:'auth', label:'auth', sub:'200', x:.29, y:.28 },
        { id:'admin', label:'admin', sub:'403', x:.78, y:.56 },
        { id:'graphql', label:'graphql', sub:'200', x:.25, y:.61, hot:true },
        { id:'cdn', label:'cdn', sub:'200', x:.14, y:.42 },
        { id:'dev', label:'dev', sub:'403', x:.84, y:.73 },
        { id:'assets', label:'assets', sub:'200', x:.46, y:.18 },
        { id:'mobile', label:'mobile-api', sub:'200', x:.55, y:.78 },
        { id:'payments', label:'payments', sub:'401', x:.66, y:.68 },
        { id:'staging', label:'staging', sub:'403', x:.37, y:.78 },
        { id:'docs', label:'docs', sub:'200', x:.13, y:.73 },
        { id:'ws', label:'socket', sub:'101', x:.88, y:.39 }
      ];

      const links = [
        ['target','api'],['target','auth'],['target','admin'],['target','graphql'],['target','cdn'],['target','assets'],['target','mobile'],['target','payments'],['target','staging'],
        ['api','payments'],['api','ws'],['auth','graphql'],['graphql','docs'],['admin','dev'],['cdn','auth'],['mobile','staging'],['assets','api']
      ];

      const nodeMap = new Map(nodeDefs.map((n, i) => [n.id, { ...n, index:i }]));
      let viewport = { w: innerWidth, h: innerHeight, dpr:1, compact:false };
      let particles = [];
      let lastFrame = performance.now();

      function seedParticles(w, h, compact) {
        const count = compact ? 44 : 82;
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: .25 + Math.random() * .8,
          a: .05 + Math.random() * .18,
          phase: Math.random() * TAU,
          speed: .00035 + Math.random() * .00075
        }));
      }

      resizeCanvas = function () {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const compact = w < 760;
        const pixelBudgetDpr = Math.max(1, Math.sqrt(4200000 / Math.max(1, w * h)));
        const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.55, pixelBudgetDpr);
        viewport = { w, h, dpr, compact };
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        seedParticles(w, h, compact);
      };

      function pointFor(node, mapAmount, collapseAmount) {
        const { w, h, compact } = viewport;
        const cx = w * .5;
        const cy = h * .5;
        const marginX = compact ? 34 : Math.max(56, w * .055);
        const marginY = compact ? 86 : Math.max(72, h * .09);
        const tx = marginX + node.x * (w - marginX * 2);
        const ty = marginY + node.y * (h - marginY * 2);
        const spread = easeOutCubic(mapAmount);
        let x = lerp(cx, tx, spread);
        let y = lerp(cy, ty, spread);
        if (collapseAmount > 0) {
          const collapseEase = smoothstep(0, 1, collapseAmount);
          x = lerp(x, cx, collapseEase);
          y = lerp(y, cy, collapseEase);
        }
        return { x, y };
      }

      function drawBackground(now, p) {
        const { w, h } = viewport;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, w, h);

        const glowStrength = .04 + smoothstep(.20, .55, p) * .055;
        const g = ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.min(w,h)*.5);
        g.addColorStop(0, `rgba(255,106,0,${glowStrength})`);
        g.addColorStop(.28, `rgba(255,106,0,${glowStrength*.2})`);
        g.addColorStop(1, 'rgba(255,106,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,w,h);

        for (const d of particles) {
          const pulse = .55 + Math.sin(now * d.speed + d.phase) * .45;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, TAU);
          ctx.fillStyle = `rgba(230,232,228,${d.a * pulse})`;
          ctx.fill();
        }
      }

      function drawLink(a, b, reveal, collapse, now, hot) {
        const pa = pointFor(a, reveal, collapse);
        const pb = pointFor(b, reveal, collapse);
        const lineReveal = clamp((reveal * 1.28) - (Math.max(a.index,b.index) % 5) * .045);
        if (lineReveal <= 0) return;
        const x2 = lerp(pa.x, pb.x, easeOutCubic(lineReveal));
        const y2 = lerp(pa.y, pb.y, easeOutCubic(lineReveal));
        const fade = 1 - smoothstep(.32, 1, collapse);
        ctx.save();
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -(now * .018);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = hot ? `rgba(255,106,0,${.23*fade})` : `rgba(215,218,212,${.13*fade})`;
        ctx.lineWidth = hot ? 1.05 : .75;
        ctx.stroke();
        ctx.restore();
      }

      function drawNode(node, reveal, collapse, now) {
        const { compact } = viewport;
        const delay = (node.index % 7) * .055;
        const local = clamp((reveal - delay) / .48);
        if (local <= 0) return;
        const pt = pointFor(node, reveal, collapse);
        const fade = (1 - smoothstep(.18, 1, collapse)) * easeOutCubic(local);
        const pulse = .78 + Math.sin(now * .0032 + node.index) * .22;
        const baseR = node.id === 'target' ? 6.5 : (node.hot ? 4.1 : 3.2);
        const r = baseR * (1 - collapse * .55);

        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * (node.hot ? 3.4 : 2.5), 0, TAU);
        ctx.fillStyle = node.hot ? `rgba(255,106,0,${.035*pulse*fade})` : `rgba(255,255,255,${.018*fade})`;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, TAU);
        ctx.fillStyle = node.id === 'target' ? `rgba(255,106,0,${fade})` : node.hot ? `rgba(255,130,44,${.86*fade})` : `rgba(218,221,215,${.72*fade})`;
        ctx.fill();

        if (node.id !== 'target' && collapse < .22 && !compact) {
          const alignRight = pt.x > viewport.w * .68;
          const lx = pt.x + (alignRight ? -10 : 10);
          const alpha = .72 * fade;
          ctx.textAlign = alignRight ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          ctx.font = '600 10px "IBM Plex Mono", monospace';
          ctx.fillStyle = `rgba(221,222,216,${alpha})`;
          ctx.fillText(node.label.toUpperCase(), lx, pt.y - 5);
          ctx.font = '500 8px "IBM Plex Mono", monospace';
          ctx.fillStyle = node.hot ? `rgba(255,122,28,${.72*fade})` : `rgba(112,114,110,${.78*fade})`;
          ctx.fillText(node.sub, lx, pt.y + 8);
        }
      }

      function drawTargetReticle(p, now, collapse) {
        if (p < .24 || collapse > .65) return;
        const { w, h } = viewport;
        const cx = w*.5, cy = h*.5;
        const lock = smoothstep(.32,.46,p);
        const fade = 1 - smoothstep(.22,.72,collapse);
        const radius = lerp(92, 64, lock);
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(now * .00033);
        ctx.strokeStyle = `rgba(255,106,0,${(.16 + lock*.44)*fade})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([18,12,5,12]);
        ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
        ctx.rotate(-now * .00071);
        ctx.strokeStyle = `rgba(228,230,224,${(.10 + lock*.16)*fade})`;
        ctx.setLineDash([3,11]);
        ctx.beginPath();ctx.arc(0,0,radius+18,0,TAU);ctx.stroke();
        ctx.setLineDash([]);
        const arm = radius + 30;
        ctx.strokeStyle = `rgba(255,106,0,${.26*lock*fade})`;
        for (let i=0;i<4;i++) {
          ctx.rotate(Math.PI/2);
          ctx.beginPath();ctx.moveTo(arm-13,0);ctx.lineTo(arm,0);ctx.stroke();
        }
        ctx.restore();
      }

      function drawCollapseCore(collapse) {
        if (collapse <= .02) return;
        const { w,h } = viewport;
        const cx=w*.5, cy=h*.5;
        const e=smoothstep(0,1,collapse);
        const r=18 + e*105;
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(255,138,40,${.12 + e*.2})`);
        g.addColorStop(.18,`rgba(255,106,0,${.08 + e*.12})`);
        g.addColorStop(1,'rgba(255,106,0,0)');
        ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.globalCompositeOperation='source-over';
      }

      function updateStages(p) {
        if (p >= .035) setStage('stage-boot');
        if (p >= .115) setStage('stage-map');
        if (p >= .34) setStage('stage-lock');
        if (p >= .64) setStage('stage-collapse');
        if (p >= .73) setStage('stage-brand');
        if (p >= .82) setStage('stage-tagline');
        if (p >= .93) {
          setStage('stage-reveal');
          if (!document.body.classList.contains('intro-complete')) {
            document.body.classList.add('intro-complete');
            rvuForceTop();
          }
        }
      }

      function renderIntro() {
        const now = performance.now();
        const dt = Math.min(2.4, Math.max(.25, (now-lastFrame)/16.6667));
        lastFrame = now;
        const p = clamp((now-startedAt)/INTRO_DURATION);
        updateStages(p);

        const mapAmount = smoothstep(.10,.38,p);
        const collapseAmount = smoothstep(.63,.775,p);
        drawBackground(now,p);

        if (p >= .09 && p < .92) {
          for (const [aId,bId] of links) {
            const a=nodeMap.get(aId), b=nodeMap.get(bId);
            drawLink(a,b,mapAmount,collapseAmount,now,a.hot || b.hot);
          }
          for (const node of nodeDefs) drawNode(nodeMap.get(node.id),mapAmount,collapseAmount,now);
          drawTargetReticle(p,now,collapseAmount);
          drawCollapseCore(collapseAmount);
        }

        // Tiny deterministic camera drift keeps the map alive without inducing motion sickness.
        if (dt && !viewport.compact && p > .12 && p < .63) {
          canvas.style.transform = `translate3d(${Math.sin(now*.00037)*1.6}px,${Math.cos(now*.00029)*1.2}px,0)`;
        } else {
          canvas.style.transform = 'translate3d(0,0,0)';
        }

        if (!finished) animId = requestAnimationFrame(renderIntro);
      }

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, { passive:true });
      renderIntro();
      setTimeout(() => finishIntro(false), INTRO_DURATION);
    } else {
      setStage('stage-brand');
      setStage('stage-tagline');
      setTimeout(() => finishIntro(true), 700);
    }

    function markFontsReady() {
      document.documentElement.classList.add('fonts-loaded');
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(markFontsReady).catch(markFontsReady);
      setTimeout(markFontsReady, 1200);
    } else {
      markFontsReady();
    }
  })();

  (function(){
    var toggleBtn = document.getElementById('langToggle');
    var i18nEls = document.querySelectorAll('.i18n');
    i18nEls.forEach(function(el){
      if (!el.dataset.ar) el.dataset.ar = el.innerHTML;
    });
    var lang = 'ar';
    window.RVU_LANG = lang;
    function apply(){
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      i18nEls.forEach(function(el){ el.innerHTML = lang === 'ar' ? el.dataset.ar : el.dataset.en; });
      document.querySelectorAll('[data-placeholder-ar][data-placeholder-en]').forEach(function(el){
        el.placeholder = lang === 'ar' ? el.dataset.placeholderAr : el.dataset.placeholderEn;
      });
      document.querySelectorAll('[data-aria-ar][data-aria-en]').forEach(function(el){
        el.setAttribute('aria-label', lang === 'ar' ? el.dataset.ariaAr : el.dataset.ariaEn);
      });
      if (toggleBtn) {
        toggleBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
        toggleBtn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English Language' : 'التبديل إلى اللغة العربية');
      }
      window.RVU_LANG = lang;
      if (typeof window.updateApplicationLanguage === 'function') window.updateApplicationLanguage();
      
      var decBtn = document.getElementById('decBtn');
      var incBtn = document.getElementById('incBtn');
      if (decBtn) decBtn.setAttribute('aria-label', lang === 'ar' ? 'إنقاص المعرف' : 'Decrease Target Identifier ID');
      if (incBtn) incBtn.setAttribute('aria-label', lang === 'ar' ? 'زيادة المعرف' : 'Increase Target Identifier ID');

      var nameInput = document.getElementById('holoNameInput');
      if (typeof window.updateCardName === 'function') {
        window.updateCardName(nameInput ? nameInput.value : '');
      }

      if (typeof window.renderDemo === 'function') window.renderDemo();
      if (typeof window.updateRadarNode === 'function') window.updateRadarNode();
      if (typeof window.resetDownloadBtn === 'function') window.resetDownloadBtn();
      document.dispatchEvent(new CustomEvent('rvu:languagechange', { detail: { lang: lang } }));
    }
    if (toggleBtn){
      toggleBtn.addEventListener('click', function(){
        lang = lang === 'ar' ? 'en' : 'ar';
        apply();
      });
    }
    apply();
  })();

  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  const navCta = document.querySelector('.nav-cta');

  function updateBurgerAccessibility(isOpen) {
    if (!burger) return;
    const ar = window.RVU_LANG === 'ar';
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    burger.setAttribute('aria-label', isOpen
      ? (ar ? 'إغلاق قائمة التنقل' : 'Close navigation menu')
      : (ar ? 'افتح قائمة التنقل' : 'Open navigation menu'));
  }

  function closeMobileNav() {
    if (navLinks && navLinks.classList.contains('open')) navLinks.classList.remove('open');
    updateBurgerAccessibility(false);
  }

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      updateBurgerAccessibility(isOpen);
    });
    document.addEventListener('rvu:languagechange', () => {
      updateBurgerAccessibility(navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
    if (navCta) navCta.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !burger.contains(e.target)) {
        closeMobileNav();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080) closeMobileNav();
    });
  }

  (function(){
    const sections = Array.from(document.querySelectorAll('header[id], section[id]'));
    const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    let ticking = false;
    let lastSectionId = null;

    function updateScrollSpy() {
      let currentSectionId = '';
      const scrollPos = window.scrollY + 120;
      for (const sec of sections) {
        const top = sec.offsetTop;
        if (scrollPos >= top && scrollPos < top + sec.offsetHeight) {
          currentSectionId = sec.id;
          break;
        }
      }
      if (currentSectionId !== lastSectionId) {
        lastSectionId = currentSectionId;
        navAnchors.forEach(a => a.classList.toggle('active', currentSectionId && a.getAttribute('href') === `#${currentSectionId}`));
      }
      ticking = false;
    }

    function onScrollSpy() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollSpy);
    }

    window.addEventListener('scroll', onScrollSpy, { passive: true });
    window.addEventListener('resize', onScrollSpy, { passive: true });
    updateScrollSpy();
  })();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.06, rootMargin: '0px 0px -3% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  (function(){
    const modal = document.getElementById('pocModal');
    const modalImg = document.getElementById('pocModalImg');
    const modalClose = document.getElementById('pocModalClose');
    let lastPocTrigger = null;

    function makePocPlaceholder(label) {
      const safeLabel = String(label || 'PoC image unavailable').replace(/[<>&"']/g, '');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <rect width="800" height="450" fill="#0b0b0b"/>
        <rect x="18" y="18" width="764" height="414" rx="16" fill="none" stroke="#f97316" stroke-opacity=".55" stroke-width="2"/>
        <text x="400" y="216" fill="#f2f2f0" font-family="Arial, sans-serif" font-size="30" text-anchor="middle">${safeLabel}</text>
        <text x="400" y="260" fill="#f97316" font-family="monospace" font-size="18" text-anchor="middle">IMAGE COULD NOT BE LOADED</text>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    function installImageFallback(img) {
      if (!img || img.dataset.fallbackReady === '1') return;
      img.dataset.fallbackReady = '1';

      img.addEventListener('error', function(){
        const stage = Number(img.dataset.fallbackStage || '0');
        const fallbackSrc = img.dataset.fallbackSrc;

        if (stage === 0 && fallbackSrc && img.src !== fallbackSrc) {
          img.dataset.fallbackStage = '1';
          img.src = fallbackSrc;
          return;
        }

        img.dataset.fallbackStage = '2';
        img.classList.add('poc-fallback');
        img.src = makePocPlaceholder(img.alt || 'PoC image unavailable');
      });
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event('error'));
      }
    }

    const cards = document.querySelectorAll('.poc-card-item');
    cards.forEach(card => {
      const img = card.querySelector('img');
      installImageFallback(img);

      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Open ${img ? img.alt : 'PoC evidence'}`);

      const open = () => openModal(img);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    function openModal(sourceImg) {
      if (!modal || !modalImg || !sourceImg) return;

      const displayedSrc = sourceImg.currentSrc || sourceImg.src;
      modalImg.classList.toggle('poc-fallback', sourceImg.classList.contains('poc-fallback'));
      modalImg.alt = sourceImg.alt ? `${sourceImg.alt} — Full Evidence` : 'Full PoC Evidence';
      lastPocTrigger = document.activeElement;
      modalImg.src = displayedSrc;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (modalClose) modalClose.focus({ preventScroll: true });
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (modalImg) modalImg.removeAttribute('src');
      if (lastPocTrigger && typeof lastPocTrigger.focus === 'function') lastPocTrigger.focus({ preventScroll: true });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!modal || !modal.classList.contains('show')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab' && modalClose) {
        e.preventDefault();
        modalClose.focus({ preventScroll: true });
      }
    });
  })();

  (function(){
    const baseId = 4471;
    const records = {
      '-3': {name:'Mahmoud A.', email:'m.a•••@gmail.com', amount:'$1,050'},
      '-2': {name:'Dina F.',    email:'d.f•••@yahoo.com', amount:'$3,420'},
      '-1': {name:'Karim N.',   email:'k.n•••@outlook.com', amount:'$670'},
      '0':  {name:'You',        email:'you@session.local', amount:'—', self:true},
      '1':  {name:'Sara A.',    email:'s.a•••@yahoo.com', amount:'$2,340'},
      '2':  {name:'Layla H.',   email:'l.h•••@outlook.com', amount:'$5,120'},
      '3':  {name:'Mostafa K.', email:'m.k•••@gmail.com', amount:'$890'},
    };
    let offset = 0;
    const idDisplay = document.getElementById('idDisplay');
    const endpointId = document.getElementById('endpointId');
    const statusEl = document.getElementById('statusEl');
    const jsonEl = document.getElementById('jsonEl');
    const noteEl = document.getElementById('noteEl');
    const decBtn = document.getElementById('decBtn');
    const incBtn = document.getElementById('incBtn');

    function render(){
      if(!idDisplay || !endpointId || !statusEl || !jsonEl) return;
      const id = baseId + offset;
      const rec = records[String(offset)] || records['0'];
      idDisplay.textContent = '#' + id;
      endpointId.textContent = id;

      const statusText = window.RVU_LANG === 'ar'
        ? { ok: '200 OK — تمام دي بيانات حسابك انت', leak: '200 OK — السيرفر سربلك بيانات حساب تاني!' }
        : { ok: '200 OK — your own data', leak: '200 OK — unauthorized data returned' };

      if (rec.self){
        statusEl.className = 'demo-status ok';
        statusEl.textContent = statusText.ok;
        if(noteEl) noteEl.classList.remove('show');
      } else {
        statusEl.className = 'demo-status leak';
        statusEl.textContent = statusText.leak;
        if(noteEl) noteEl.classList.add('show');
      }

      jsonEl.innerHTML =
        '{\n' +
        '  <span class="k">"user_id"</span>: <span class="v">' + id + '</span>,\n' +
        '  <span class="k">"name"</span>: <span class="v">"' + escapeHTML(rec.name) + '"</span>,\n' +
        '  <span class="k">"email"</span>: <span class="v">"' + escapeHTML(rec.email) + '"</span>,\n' +
        '  <span class="k">"invoice_total"</span>: <span class="v">"' + escapeHTML(rec.amount) + '"</span>\n' +
        '}';

      if(decBtn) decBtn.disabled = offset <= -3;
      if(incBtn) incBtn.disabled = offset >= 3;
    }

    window.renderDemo = render;
    if(decBtn) decBtn.addEventListener('click', () => { offset = Math.max(-3, offset - 1); render(); });
    if(incBtn) incBtn.addEventListener('click', () => { offset = Math.min(3, offset + 1); render(); });
    render();
  })();

  (function(){
    const reduceTiltMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceTiltMotion) return;
    const interactiveCards = document.querySelectorAll('.tilt-card, .hunt-loop-step, .schedule-item, .outcome-session, .faq-item');
    interactiveCards.forEach(card => {
      if (card.id === 'holoCard' || card.classList.contains('holo-box')) return;
      let frameId = 0;
      let pointerX = 0;
      let pointerY = 0;

      function applyTilt() {
        frameId = 0;
        if (card.classList.contains('exporting')) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(rect.width, pointerX - rect.left));
        const y = Math.max(0, Math.min(rect.height, pointerY - rect.top));
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 4.2;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4.2;
        card.style.transform = `perspective(1050px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0) scale3d(1.012, 1.012, 1.012)`;
      }

      function handleMove(e) {
        if (e.pointerType === 'touch') return;
        pointerX = e.clientX;
        pointerY = e.clientY;
        if (!frameId) frameId = requestAnimationFrame(applyTilt);
      }

      function handleLeave() {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        card.style.transform = 'perspective(1050px) rotateX(0deg) rotateY(0deg) translateZ(0) scale3d(1, 1, 1)';
      }

      card.addEventListener('pointermove', handleMove, { passive: true });
      card.addEventListener('pointerleave', handleLeave);
    });
  })();

  (function(){
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    let isRadarVisible = false;
    let animFrameId = null;
    let resizeFrameId = null;
    let renderDpr = 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      renderDpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
      canvas.width = Math.max(1, Math.round(rect.width * renderDpr));
      canvas.height = Math.max(1, Math.round(rect.height * renderDpr));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(renderDpr, renderDpr);
    }
    function scheduleResize() {
      if (resizeFrameId) return;
      resizeFrameId = requestAnimationFrame(() => { resizeFrameId = null; resize(); });
    }
    resize();
    window.addEventListener('resize', scheduleResize, { passive: true });

    function drawRadar() {
      if (!isRadarVisible) return;

      const width = canvas.width / renderDpr;
      const height = canvas.height / renderDpr;

      if (width > 0 && height > 0) {
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(0, width / 2 - 10);

        ctx.clearRect(0, 0, width, height);

        if (radius > 0) {
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (radius / 3) * i, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
          ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
          ctx.stroke();

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          
          let gradient;
          if (ctx.createConicGradient) {
            gradient = ctx.createConicGradient(0, 0, 0);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
            gradient.addColorStop(0.2, 'rgba(249, 115, 22, 0.05)');
            gradient.addColorStop(1, 'transparent');
          } else {
            gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, radius);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
            gradient.addColorStop(1, 'transparent');
          }
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius, 0, Math.PI * 0.4);
          ctx.fill();
          ctx.restore();
        }
      }

      angle += 0.02;
      animFrameId = requestAnimationFrame(drawRadar);
    }

    const radarObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isRadarVisible = entry.isIntersecting;
        if (isRadarVisible) {
          cancelAnimationFrame(animFrameId);
          drawRadar();
        } else {
          cancelAnimationFrame(animFrameId);
        }
      });
    }, { threshold: 0.1 });

    radarObserver.observe(canvas.parentElement);

    const radarData = [
      {badge:'SESSION 02 // REQUEST CONTEXT',title:{en:'Read the Request in Context',ar:'افهم الـRequest في سياقها'},desc:{en:'Understand HTTP, state, identity and session context so you can separate user-controlled input from authorization state.',ar:'تفهم HTTP والـState والهوية والـSessions بحيث تعرف إيه اللي تحت تحكمك وإيه اللي يحدد صلاحيتك داخل الـFlow.'},vuln:{en:'CORE: Request / Response · State · Identity context',ar:'CORE: Request / Response · State · Identity context'},module:{en:'CURRICULUM: Week 01 · Session 02',ar:'CURRICULUM: WEEK 01 · SESSION 02'}},
      {badge:'SESSION 03 // ATTACK SURFACE',title:{en:'Turn a Target into an Attack Surface',ar:'حوّل الـTarget لـAttack Surface'},desc:{en:'Use recon to prioritize assets, endpoints and parameters instead of collecting noise without a testing plan.',ar:'تستخدم Recon علشان ترتب Assets وEndpoints وParameters بدل جمع Noise من غير خطة اختبار.'},vuln:{en:'CORE: Recon for prioritization',ar:'CORE: Recon for prioritization'},module:{en:'CURRICULUM: Week 02 · Session 03',ar:'CURRICULUM: WEEK 02 · SESSION 03'}},
      {badge:'SESSION 04 // AUTHORIZATION MODEL',title:{en:'Model Authorization Before Testing',ar:'ابنِ Authorization Model قبل الاختبار'},desc:{en:'Map roles, object ownership and authorization boundaries, then derive repeatable IDOR/BOLA tests from the model.',ar:'ترسم Roles وObject ownership وحدود الصلاحيات، وبعدها تطلع اختبارات IDOR/BOLA من الـModel بدل التخمين.'},vuln:{en:'CORE: Authorization · Object ownership · IDOR/BOLA',ar:'CORE: Authorization · Object ownership · IDOR/BOLA'},module:{en:'CURRICULUM: Week 02 · Session 04',ar:'CURRICULUM: WEEK 02 · SESSION 04'}},
      {badge:'SESSIONS 05–06 // WORKFLOW REASONING',title:{en:'Turn Workflows into Attack Hypotheses',ar:'حوّل الـWorkflow لفرضيات هجوم'},desc:{en:'Identify trust assumptions across business flows and account lifecycles, then test how state, concurrency and recovery behavior can break them.',ar:'تحدد Trust assumptions في الـBusiness Flow والـAccount Lifecycle وتختبر تأثير الـState والـConcurrency والـRecovery عليها.'},vuln:{en:'CORE: Business logic · Account flows',ar:'CORE: Business logic · Account flows'},module:{en:'CURRICULUM: Week 03 · Sessions 05–06',ar:'CURRICULUM: WEEK 03 · SESSIONS 05–06'}},
      {badge:'SESSIONS 07–08 // API METHODOLOGY',title:{en:'Test the API, Then Write Your Methodology',ar:'اختبر الـAPI وابنِ Methodology خاصة بيك'},desc:{en:'Map endpoints, parameters, schemas and authorization boundaries in REST/GraphQL, then turn what you learned into a methodology that matches the target.',ar:'تعمل Mapping للـEndpoints والParameters والSchemas وحدود الصلاحيات في REST/GraphQL، وبعدها تبني Methodology تناسب الـTarget نفسها.'},vuln:{en:'CORE: API testing · Your methodology',ar:'CORE: API testing · Your methodology'},module:{en:'CURRICULUM: Week 04 · Sessions 07–08',ar:'CURRICULUM: WEEK 04 · SESSIONS 07–08'}}
    ];

    let currentRadarNode = 0;
    const targetNodes = document.querySelectorAll('.radar-target-node');
    const rBadge = document.getElementById('radarBadge');
    const rTitle = document.getElementById('radarTitle');
    const rDesc = document.getElementById('radarDesc');
    const rVuln = document.getElementById('radarVuln');
    const rModule = document.getElementById('radarModule');

    function updateRadarNode() {
      if(!rBadge || !rTitle || !rDesc || !rVuln || !rModule) return;
      const data = radarData[currentRadarNode];
      const isAr = window.RVU_LANG === 'ar';

      rBadge.textContent = data.badge;
      rTitle.textContent = isAr ? data.title.ar : data.title.en;
      rDesc.textContent = isAr ? data.desc.ar : data.desc.en;
      rVuln.textContent = isAr ? data.vuln.ar : data.vuln.en;
      rModule.textContent = isAr ? data.module.ar : data.module.en;

      targetNodes.forEach((node, idx) => {
        if (idx === currentRadarNode) {
          node.classList.add('active');
          node.setAttribute('aria-pressed', 'true');
        } else {
          node.classList.remove('active');
          node.setAttribute('aria-pressed', 'false');
        }
      });
    }

    window.updateRadarNode = updateRadarNode;

    targetNodes.forEach(node => {
      node.addEventListener('click', () => {
        currentRadarNode = parseInt(node.dataset.node, 10);
        updateRadarNode();
      });
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          currentRadarNode = parseInt(node.dataset.node, 10);
          updateRadarNode();
        }
      });
    });
  })();



  (function(){
    const nameInput = document.getElementById('holoNameInput');
    const holoCard = document.getElementById('holoCard');
    const downloadBtn = document.getElementById('downloadHoloBtn');
    const shareBtn = document.getElementById('shareHoloBtn');
    const holoCardDate = document.getElementById('holoCardDate');

    const now = new Date();
    const monthNamesEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const dayPadded = String(now.getDate()).padStart(2, '0');
    const formattedDate = dayPadded + ' ' + monthNamesEn[now.getMonth()] + ' ' + now.getFullYear();
    if (holoCardDate) holoCardDate.textContent = 'ISSUED: ' + formattedDate;

    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        if (typeof window.updateCardName === 'function') {
          window.updateCardName(e.target.value);
        }
      });
      if (typeof window.updateCardName === 'function') {
        window.updateCardName(nameInput.value);
      }
    }

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (holoCard) {
      let activeTouchPointer = null;

      function updateCardTilt(clientX, clientY, maxAngle, scale) {
        if (holoCard.classList.contains('exporting')) return;
        const rect = holoCard.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * maxAngle;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxAngle;
        const shineX = ((x / rect.width) * 100) - 50;
        const shineY = ((y / rect.height) * 100) - 50;
        holoCard.style.transform = `perspective(1300px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
        holoCard.style.setProperty('--shine-x', `${shineX.toFixed(1)}%`);
        holoCard.style.setProperty('--shine-y', `${shineY.toFixed(1)}%`);
      }

      function resetCardTilt(e) {
        if (e && activeTouchPointer !== null && typeof holoCard.releasePointerCapture === 'function') {
          try { if (holoCard.hasPointerCapture(activeTouchPointer)) holoCard.releasePointerCapture(activeTouchPointer); } catch (_) {}
        }
        activeTouchPointer = null;
        holoCard.classList.remove('is-touching');
        holoCard.style.transform = 'perspective(1300px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        holoCard.style.setProperty('--shine-x', '0%');
        holoCard.style.setProperty('--shine-y', '0%');
      }

      let hoverFrame = 0;
      let hoverX = 0;
      let hoverY = 0;
      function handleCardHover(e) {
        if (e.pointerType === 'touch') return;
        hoverX = e.clientX;
        hoverY = e.clientY;
        if (hoverFrame) return;
        hoverFrame = requestAnimationFrame(() => {
          hoverFrame = 0;
          updateCardTilt(hoverX, hoverY, 14, 1.018);
        });
      }
      function handleCardLeave(e) {
        if (hoverFrame) cancelAnimationFrame(hoverFrame);
        hoverFrame = 0;
        resetCardTilt(e);
      }
      holoCard.addEventListener('pointermove', handleCardHover, { passive: true });
      holoCard.addEventListener('mousemove', handleCardHover, { passive: true });
      holoCard.addEventListener('pointerleave', handleCardLeave);
      holoCard.addEventListener('mouseleave', handleCardLeave);

      if (coarsePointer) {
        holoCard.addEventListener('pointerdown', (e) => {
          if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
          activeTouchPointer = e.pointerId;
          if (typeof holoCard.setPointerCapture === 'function') {
            try { holoCard.setPointerCapture(e.pointerId); } catch (_) {}
          }
          holoCard.classList.add('is-touching');
          updateCardTilt(e.clientX, e.clientY, 7, 1.015);
        }, { passive: true });
        holoCard.addEventListener('pointermove', (e) => {
          if (activeTouchPointer !== e.pointerId) return;
          updateCardTilt(e.clientX, e.clientY, 7, 1.015);
        }, { passive: true });
        holoCard.addEventListener('pointerup', resetCardTilt);
        holoCard.addEventListener('pointercancel', resetCardTilt);
        holoCard.addEventListener('pointerleave', (e) => {
          if (activeTouchPointer === e.pointerId) resetCardTilt();
        });
      }
    }

    function roundRectPath(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function fitCanvasText(ctx, text, maxWidth, initialPx, minPx, family, weight) {
      let size = initialPx;
      while (size > minPx) {
        ctx.font = `${weight} ${size}px ${family}`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 2;
      }
      return size;
    }

    async function renderCampCardCanvas() {
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 756;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      const W = canvas.width;
      const H = canvas.height;
      const pad = 58;
      const radius = 34;

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#111111');
      bg.addColorStop(0.55, '#030303');
      bg.addColorStop(1, '#0b0704');
      roundRectPath(ctx, 4, 4, W - 8, H - 8, radius);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(249,115,22,.76)';
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      for (let x = 90; x < W; x += 105) {
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 20); ctx.stroke();
      }
      for (let y = 90; y < H; y += 105) {
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
      }
      ctx.restore();

      const glow = ctx.createRadialGradient(W * .5, H * .48, 10, W * .5, H * .48, W * .42);
      glow.addColorStop(0, 'rgba(249,115,22,.15)');
      glow.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.textBaseline = 'middle';
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f2f2f0';
      ctx.font = '700 38px "IBM Plex Mono", monospace';
      ctx.fillText('rv', pad, 85);
      ctx.fillStyle = '#f97316';
      ctx.fillText('_', pad + 48, 85);
      ctx.fillStyle = '#f2f2f0';
      ctx.fillText('u camp', pad + 72, 85);

      const sealText = 'TAKE A SEAT';
      ctx.font = '700 23px "IBM Plex Mono", monospace';
      const sealWidth = ctx.measureText(sealText).width + 42;
      const sealX = W - pad - sealWidth;
      roundRectPath(ctx, sealX, 55, sealWidth, 58, 12);
      ctx.fillStyle = 'rgba(34,197,94,.12)'; ctx.fill();
      ctx.strokeStyle = 'rgba(34,197,94,.82)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#8cf0ad'; ctx.textAlign = 'center';
      ctx.fillText(sealText, sealX + sealWidth / 2, 84);

      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pad, 145); ctx.lineTo(W - pad, 145); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f2f2f0';
      ctx.font = '700 80px "IBM Plex Mono", monospace';
      ctx.fillText('rv', W / 2 - 74, 278);
      ctx.fillStyle = '#f97316'; ctx.fillText('_', W / 2, 278);
      ctx.fillStyle = '#f2f2f0'; ctx.fillText('u camp', W / 2 + 112, 278);
      ctx.fillStyle = '#8f8f8a';
      ctx.font = '500 23px "IBM Plex Mono", monospace';
      ctx.fillText('from bug hunter to bug hunter', W / 2, 340);

      const rawName = (nameInput ? nameInput.value.trim() : '') || (window.RVU_LANG === 'ar' ? 'اكتب اسمك هنا' : 'PUT YOUR NAME');
      const displayName = /[\u0600-\u06FF]/.test(rawName) ? rawName : rawName.toUpperCase();
      const arabicName = /[\u0600-\u06FF]/.test(displayName);
      ctx.direction = arabicName ? 'rtl' : 'ltr';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      const family = arabicName ? '"IBM Plex Sans Arabic", sans-serif' : '"IBM Plex Sans", sans-serif';
      const nameSize = fitCanvasText(ctx, displayName, W - pad * 2, 82, 42, family, 700);
      ctx.font = `700 ${nameSize}px ${family}`;
      ctx.fillText(displayName, W / 2, 455);

      ctx.direction = 'ltr';
      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.beginPath(); ctx.moveTo(pad, H - 132); ctx.lineTo(W - pad, H - 132); ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f2f2f0';
      ctx.font = '700 44px "Caveat", cursive';
      ctx.fillText('Ramez Medhat', pad, H - 72);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#8f8f8a';
      ctx.font = '600 22px "IBM Plex Mono", monospace';
      ctx.fillText(`ISSUED: ${formattedDate}`, W - pad, H - 72);

      return canvas;
    }

    function setDownloadStatus(arText, enText) {
      if (!downloadBtn) return;
      const label = downloadBtn.querySelector('.i18n');
      const text = window.RVU_LANG === 'ar' ? arText : enText;
      if (label) label.textContent = text;
      else downloadBtn.textContent = text;
    }

    resetDownloadBtn = function() {
      if (!downloadBtn) return;
      setDownloadStatus('Download Camp Card', 'Download Camp Card');
      downloadBtn.disabled = false;
    };
    window.resetDownloadBtn = resetDownloadBtn;

    if (downloadBtn && holoCard) {
      downloadBtn.addEventListener('click', async function() {
        if (downloadBtn.disabled) return;
        downloadBtn.disabled = true;
        setDownloadStatus('جاري تجهيز الكارت...', 'Preparing card...');
        try {
          const canvas = await renderCampCardCanvas();
          setDownloadStatus('تم تجهيز الكارت', 'Card ready');
          const link = document.createElement('a');
          const rawName = (nameInput ? nameInput.value.trim() : '') || 'RVU_Candidate';
          const safeName = rawName.replace(/[^\w\s\u0600-\u06FF-]/g, '').replace(/[\/\\?%*:|"<>.]/g, '').replace(/\s+/g, '_');
          link.download = `${safeName}_RVU_Cohort_Card.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(window.resetDownloadBtn, 2200);
        } catch (_) {
          setDownloadStatus('تعذر تصدير الكارت', 'Export failed');
          setTimeout(window.resetDownloadBtn, 2200);
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        const studentName = (nameInput ? nameInput.value.trim() : '') || 'RV_U Student';
        const isAr = window.RVU_LANG === 'ar';
        
        const textAr = `عملت Take a Seat Card لـ rv_u camp — أول دفعة أونلاين.\nاسم الطالب: ${studentName}\n\nشوف تفاصيل المعسكر واطلب شارتك من هنا: https://rv-u.tech/`;
        const textEn = `I generated my Take a Seat card for rv_u camp — Online Cohort 01.\nCandidate: ${studentName}\n\nCheck out the bootcamp details here: https://rv-u.tech/`;
        
        const shareText = encodeURIComponent(isAr ? textAr : textEn);
        window.open(`https://wa.me/?text=${shareText}`, '_blank', 'noopener,noreferrer');
      });
    }
  })();


  (function(){
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const opening = !item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            const openBtn = openItem.querySelector('.faq-question');
            if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('open', opening);
        btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
      });
    });
  })();
  (function(){
    const scale = document.getElementById('justiceScales');
    if (!scale) return;

    let current = -8;
    let target = -8;
    let velocity = 0;
    let restingSide = 1;
    let active = false;
    let rafId = 0;

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    function tick(){
      const spring = (target - current) * 0.045;
      velocity = (velocity + spring) * 0.84;
      current += velocity;
      current = clamp(current, -11, 11);
      scale.style.setProperty('--justice-tilt', `${current.toFixed(3)}deg`);
      if (Math.abs(target-current) > 0.015 || Math.abs(velocity) > 0.015 || active) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    }

    function ensureTick(){ if (!rafId) rafId = requestAnimationFrame(tick); }

    function engageFromPoint(clientX, clientY){
      const rect = scale.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      target = (x - 0.5) * 20;
      scale.style.setProperty('--jx', `${(x*100).toFixed(1)}%`);
      scale.style.setProperty('--jy', `${(y*100).toFixed(1)}%`);
      scale.classList.add('engaged');
      active = true;
      ensureTick();
    }

    function settle(){
      active = false;
      scale.classList.remove('engaged');
      target = restingSide * 7.5;
      restingSide *= -1;
      scale.style.setProperty('--jx','50%');
      scale.style.setProperty('--jy','50%');
      ensureTick();
    }

    scale.addEventListener('pointerenter', (e) => engageFromPoint(e.clientX, e.clientY));
    scale.addEventListener('pointermove', (e) => engageFromPoint(e.clientX, e.clientY));
    scale.addEventListener('pointerleave', settle);
    scale.addEventListener('focus', () => { active=true; target=0; scale.classList.add('engaged'); ensureTick(); });
    scale.addEventListener('blur', settle);
    scale.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); active=true; scale.classList.add('engaged');
        target = e.key === 'ArrowLeft' ? -9 : 9; ensureTick();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); active=true; target=0; scale.classList.add('engaged'); ensureTick();
        setTimeout(settle, 850);
      }
    });
    scale.addEventListener('click', () => {
      active = true; target = 0; scale.classList.add('engaged'); ensureTick();
      setTimeout(settle, 900);
    });

    ensureTick();
  })();


  (function(){
    const modal = document.getElementById('applicationModal');
    const closeBtn = document.getElementById('applicationClose');
    const form = document.getElementById('applicationForm');
    const success = document.getElementById('applicationSuccess');
    const summary = document.getElementById('applicationSummary');
    const waLink = document.getElementById('applicationWhatsApp');
    const editBtn = document.getElementById('applicationEdit');
    const hero = document.querySelector('.hero');
    const footer = document.getElementById('pageFooter');
    const mobileApplyButton = document.getElementById('mobileApplyButton');
    const mobileApplyFab = document.getElementById('mobileApplyFab');
    let lastFocused = null;
    let curtainCleanupTimer = null;

    function getModalFocusable() {
      if (!modal) return [];
      return Array.from(modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
    }

    function openApplication(mode = 'standard'){
      if (!modal) return;
      if (curtainCleanupTimer) {
        clearTimeout(curtainCleanupTimer);
        curtainCleanupTimer = null;
      }
      if (mode === 'curtain') modal.classList.add('curtain-mode');
      else modal.classList.remove('curtain-mode');
      lastFocused = document.activeElement;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('application-open');
      updateMobileApplyFab();
      setTimeout(() => {
        const first = document.getElementById('appName');
        if (first) first.focus({ preventScroll: true });
      }, mode === 'curtain' ? 240 : 80);
    }

    function closeApplication(){
      if (!modal) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      curtainCleanupTimer = setTimeout(() => {
        modal.classList.remove('curtain-mode');
        curtainCleanupTimer = null;
      }, 900);
      document.body.style.overflow = '';
      document.body.classList.remove('application-open');
      updateMobileApplyFab();
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }



    document.querySelectorAll('[data-open-application]').forEach(btn => {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        openApplication('standard');
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', closeApplication);

    if (mobileApplyButton) {
      mobileApplyButton.addEventListener('click', function(e){
        e.preventDefault();
        openApplication('curtain');
      });
    }

    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeApplication(); });
    document.addEventListener('keydown', e => {
      if (modal && modal.classList.contains('show')) {
        if (e.key === 'Escape') { closeApplication(); return; }
        if (e.key === 'Tab') {
          const focusable = getModalFocusable();
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });

    if (form) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if (!form.reportValidity()) return;

        const name = document.getElementById('appName').value.trim();
        const levelSelect = document.getElementById('appLevel');
        const liveSelect = document.getElementById('appLiveTargets');
        const goal = document.getElementById('appGoal').value.trim();
        const level = levelSelect.options[levelSelect.selectedIndex].textContent.trim();
        const live = liveSelect.options[liveSelect.selectedIndex].textContent.trim();
        const isAr = window.RVU_LANG === 'ar';

        const messageAr = `طلب تقديم لانترفيو rv_u camp — أول دفعة أونلاين

الاسم: ${name}
المستوى الحالي: ${level}
اشتغلت على Live Targets قبل كده؟ ${live}
هدفي من الكامب: ${goal}

فاهم إن التقديم لا يعني قبول تلقائي، وإن مفيش باونتي مضمونة، والنتائج تعتمد على الاجتهاد والاستمرار.`;
        const messageEn = `rv_u camp Interview Application — Online Cohort 01

Name: ${name}
Current level: ${level}
Hunted live targets before? ${live}
Goal: ${goal}

I understand that applying does not guarantee acceptance or a bounty, and that results depend on consistent practice and effort.`;
        const message = isAr ? messageAr : messageEn;

        if (summary) {
          summary.textContent = isAr
            ? `الاسم: ${name}
المستوى: ${level}
Live Targets: ${live}
الهدف: ${goal}`
            : `Name: ${name}
Level: ${level}
Live Targets: ${live}
Goal: ${goal}`;
        }
        if (waLink) waLink.href = `https://wa.me/201280499854?text=${encodeURIComponent(message)}`;

        form.style.display = 'none';
        if (success) success.classList.add('show');
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', function(){
        if (success) success.classList.remove('show');
        if (form) form.style.display = 'grid';
        const first = document.getElementById('appName');
        if (first) first.focus();
      });
    }
    function updateMobileApplyFab() {
      if (!mobileApplyFab) return;
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const contactSection = document.getElementById('contact');
      const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
      const heroVisible = heroRect && heroRect.bottom > 110;
      const contactVisible = contactRect && contactRect.top < window.innerHeight * 0.92 && contactRect.bottom > 0;
      const shouldShow = !heroVisible && !contactVisible && !document.body.classList.contains('application-open');
      mobileApplyFab.classList.toggle('show', shouldShow);
      mobileApplyFab.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      mobileApplyFab.inert = !shouldShow;
    }
    updateMobileApplyFab();
    window.addEventListener('scroll', updateMobileApplyFab, { passive: true });
    window.addEventListener('resize', updateMobileApplyFab, { passive: true });

    window.updateApplicationLanguage = function(){
      const isAr = window.RVU_LANG === 'ar';
      const name = document.getElementById('appName');
      const goal = document.getElementById('appGoal');
      const close = document.getElementById('applicationClose');
      if (name) name.placeholder = isAr ? 'مثال: أحمد محمد' : 'e.g. Ahmed Mohamed';
      if (goal) goal.placeholder = isAr ? 'اكتب هدفك باختصار: إيه اللي موقفك دلوقتي وإيه اللي عاوز توصله؟' : 'Briefly describe what is blocking you now and what you want to achieve.';
      if (close) close.setAttribute('aria-label', isAr ? 'إغلاق نموذج التقديم' : 'Close application form');
    };
    window.updateApplicationLanguage();
  })();
