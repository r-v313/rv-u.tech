"use strict";
window.RVU_CLARITY_PROJECT_ID = "ydzz6gt587";
window.clarity =
  window.clarity ||
  function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
(function () {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.clarity.ms/tag/" + window.RVU_CLARITY_PROJECT_ID;
  s.referrerPolicy = "no-referrer";
  document.head.appendChild(s);
})();
function rvuTrackClarity(eventName) {
  if (typeof window.clarity === "function") window.clarity("event", eventName);
}

(function () {
  const toggleBtn = document.getElementById("langToggle");
  const i18nEls = document.querySelectorAll(".i18n");
  const template = document.createElement("template");
  function setLocalizedContent(el, value) {
    template.innerHTML = String(value || "");
    const fragment = document.createDocumentFragment();
    const appendSafe = (source, target) => {
      source.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          target.appendChild(document.createTextNode(node.nodeValue || ""));
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName === "SPAN") {
          const span = document.createElement("span");
          const className = node.getAttribute("class");
          if (className) span.className = className;
          appendSafe(node, span);
          target.appendChild(span);
          return;
        }
        appendSafe(node, target);
      });
    };
    appendSafe(template.content, fragment);
    el.replaceChildren(fragment);
  }
  let lang = "ar";
  window.RVU_LANG = lang;
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    i18nEls.forEach((el) =>
      setLocalizedContent(el, lang === "ar" ? el.dataset.ar : el.dataset.en),
    );
    document
      .querySelectorAll("[data-placeholder-ar][data-placeholder-en]")
      .forEach(function (el) {
        el.placeholder =
          lang === "ar" ? el.dataset.placeholderAr : el.dataset.placeholderEn;
      });
    document
      .querySelectorAll("[data-aria-ar][data-aria-en]")
      .forEach(function (el) {
        el.setAttribute(
          "aria-label",
          lang === "ar" ? el.dataset.ariaAr : el.dataset.ariaEn,
        );
      });
    if (toggleBtn) {
      toggleBtn.textContent = lang === "ar" ? "EN" : "AR";
      toggleBtn.setAttribute(
        "aria-label",
        lang === "ar"
          ? "Switch to English Language"
          : "التبديل إلى اللغة العربية",
      );
    }
    window.RVU_LANG = lang;
    if (typeof window.updateApplicationLanguage === "function")
      window.updateApplicationLanguage();
    document.dispatchEvent(
      new CustomEvent("rvu:languagechange", { detail: { lang: lang } }),
    );
  }
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      lang = lang === "ar" ? "en" : "ar";
      apply();
    });
  }
  apply();
})();
const burger = document.getElementById("navBurger");
const navLinks = document.getElementById("navLinks");
const navCta = document.querySelector(".nav-cta");
function updateBurgerAccessibility(isOpen) {
  if (!burger) return;
  const ar = window.RVU_LANG === "ar";
  burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  burger.setAttribute(
    "aria-label",
    isOpen
      ? ar
        ? "إغلاق قائمة التنقل"
        : "Close navigation menu"
      : ar
        ? "افتح قائمة التنقل"
        : "Open navigation menu",
  );
}
function closeMobileNav() {
  if (navLinks && navLinks.classList.contains("open"))
    navLinks.classList.remove("open");
  updateBurgerAccessibility(false);
}
if (burger && navLinks) {
  burger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    updateBurgerAccessibility(isOpen);
  });
  document.addEventListener("rvu:languagechange", () => {
    updateBurgerAccessibility(navLinks.classList.contains("open"));
  });
  navLinks
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMobileNav));
  if (navCta) navCta.addEventListener("click", closeMobileNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });
  document.addEventListener("click", (e) => {
    if (
      navLinks.classList.contains("open") &&
      !navLinks.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      closeMobileNav();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMobileNav();
  });
}
(function () {
  const sections = Array.from(
    document.querySelectorAll("header[id], section[id]"),
  );
  const navAnchors = Array.from(
    document.querySelectorAll('.nav-links a[href^="#"]'),
  );
  let ticking = false;
  let lastSectionId = null;
  function updateScrollSpy() {
    let currentSectionId = "";
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
      navAnchors.forEach((a) =>
        a.classList.toggle(
          "active",
          currentSectionId && a.getAttribute("href") === `#${currentSectionId}`,
        ),
      );
    }
    ticking = false;
  }
  function onScrollSpy() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollSpy);
  }
  window.addEventListener("scroll", onScrollSpy, { passive: true });
  window.addEventListener("resize", onScrollSpy, { passive: true });
  updateScrollSpy();
})();
(function () {
  const modal = document.getElementById("pocModal");
  const modalImg = document.getElementById("pocModalImg");
  const modalClose = document.getElementById("pocModalClose");
  let lastPocTrigger = null;
  function makePocPlaceholder(label) {
    const safeLabel = String(label || "PoC image unavailable").replace(
      /[<>&"']/g,
      "",
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <rect width="800" height="450" fill="#0b0b0b"/>
        <rect x="18" y="18" width="764" height="414" rx="16" fill="none" stroke="#f97316" stroke-opacity=".55" stroke-width="2"/>
        <text x="400" y="216" fill="#f2f2f0" font-family="Arial, sans-serif" font-size="30" text-anchor="middle">${safeLabel}</text>
        <text x="400" y="260" fill="#f97316" font-family="monospace" font-size="18" text-anchor="middle">IMAGE COULD NOT BE LOADED</text>
      </svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }
  function installImageFallback(img) {
    if (!img || img.dataset.fallbackReady === "1") return;
    img.dataset.fallbackReady = "1";
    img.addEventListener("error", function () {
      const stage = Number(img.dataset.fallbackStage || "0");
      const fallbackSrc = img.dataset.fallbackSrc;
      if (stage === 0 && fallbackSrc && img.src !== fallbackSrc) {
        img.dataset.fallbackStage = "1";
        img.src = fallbackSrc;
        return;
      }
      img.dataset.fallbackStage = "2";
      img.classList.add("poc-fallback");
      img.src = makePocPlaceholder(img.alt || "PoC image unavailable");
    });
    if (img.complete && img.naturalWidth === 0) {
      img.dispatchEvent(new Event("error"));
    }
  }
  const cards = document.querySelectorAll(".poc-card-item");
  cards.forEach((card) => {
    const img = card.querySelector("img");
    installImageFallback(img);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Open ${img ? img.alt : "PoC evidence"}`);
    const open = () => openModal(img);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  function openModal(sourceImg) {
    if (!modal || !modalImg || !sourceImg) return;
    const displayedSrc = sourceImg.currentSrc || sourceImg.src;
    modalImg.classList.toggle(
      "poc-fallback",
      sourceImg.classList.contains("poc-fallback"),
    );
    modalImg.alt = sourceImg.alt
      ? `${sourceImg.alt} — Full Evidence`
      : "Full PoC Evidence";
    lastPocTrigger = document.activeElement;
    modalImg.src = displayedSrc;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (modalClose) modalClose.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modalImg) modalImg.removeAttribute("src");
    if (lastPocTrigger && typeof lastPocTrigger.focus === "function")
      lastPocTrigger.focus({ preventScroll: true });
  }
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (!modal || !modal.classList.contains("show")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab" && modalClose) {
      e.preventDefault();
      modalClose.focus({ preventScroll: true });
    }
  });
})();
(function () {
  const reduceTiltMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceTiltMotion) return;
  const interactiveCards = document.querySelectorAll(
    ".tilt-card, .schedule-item, .outcome-session, .faq-item",
  );
  interactiveCards.forEach((card) => {
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;
    function applyTilt() {
      frameId = 0;
      if (card.classList.contains("exporting")) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(rect.width, pointerX - rect.left));
      const y = Math.max(0, Math.min(rect.height, pointerY - rect.top));
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
      const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 4.2;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4.2;
      card.style.transform = `perspective(1050px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0) scale3d(1.012, 1.012, 1.012)`;
    }
    function handleMove(e) {
      if (e.pointerType === "touch") return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!frameId) frameId = requestAnimationFrame(applyTilt);
    }
    function handleLeave() {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      card.style.transform =
        "perspective(1050px) rotateX(0deg) rotateY(0deg) translateZ(0) scale3d(1, 1, 1)";
    }
    card.addEventListener("pointermove", handleMove, { passive: true });
    card.addEventListener("pointerleave", handleLeave);
  });
})();
(function () {
  const questions = document.querySelectorAll(".faq-question");
  questions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (!item) return;
      const opening = !item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          const openBtn = openItem.querySelector(".faq-question");
          if (openBtn) openBtn.setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("open", opening);
      btn.setAttribute("aria-expanded", opening ? "true" : "false");
    });
  });
})();
(function () {
  const scale = document.getElementById("justiceScales");
  if (!scale || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let current = -8;
  let target = -8;
  let velocity = 0;
  let restingSide = 1;
  let active = false;
  let rafId = 0;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  function tick() {
    const spring = (target - current) * 0.045;
    velocity = (velocity + spring) * 0.84;
    current += velocity;
    current = clamp(current, -11, 11);
    scale.style.setProperty("--justice-tilt", `${current.toFixed(3)}deg`);
    if (
      Math.abs(target - current) > 0.015 ||
      Math.abs(velocity) > 0.015 ||
      active
    ) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }
  function ensureTick() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function engageFromPoint(clientX, clientY) {
    const rect = scale.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    target = (x - 0.5) * 20;
    scale.style.setProperty("--jx", `${(x * 100).toFixed(1)}%`);
    scale.style.setProperty("--jy", `${(y * 100).toFixed(1)}%`);
    scale.classList.add("engaged");
    active = true;
    ensureTick();
  }
  function settle() {
    active = false;
    scale.classList.remove("engaged");
    target = restingSide * 7.5;
    restingSide *= -1;
    scale.style.setProperty("--jx", "50%");
    scale.style.setProperty("--jy", "50%");
    ensureTick();
  }
  scale.addEventListener("pointerenter", (e) =>
    engageFromPoint(e.clientX, e.clientY),
  );
  scale.addEventListener("pointermove", (e) =>
    engageFromPoint(e.clientX, e.clientY),
  );
  scale.addEventListener("pointerleave", settle);
  scale.addEventListener("focus", () => {
    active = true;
    target = 0;
    scale.classList.add("engaged");
    ensureTick();
  });
  scale.addEventListener("blur", settle);
  scale.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      active = true;
      scale.classList.add("engaged");
      target = e.key === "ArrowLeft" ? -9 : 9;
      ensureTick();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      active = true;
      target = 0;
      scale.classList.add("engaged");
      ensureTick();
      setTimeout(settle, 850);
    }
  });
  scale.addEventListener("click", () => {
    active = true;
    target = 0;
    scale.classList.add("engaged");
    ensureTick();
    setTimeout(settle, 900);
  });
  ensureTick();
})();
(function () {
  const modal = document.getElementById("applicationModal");
  const closeBtn = document.getElementById("applicationClose");
  const form = document.getElementById("applicationForm");
  const success = document.getElementById("applicationSuccess");
  const summary = document.getElementById("applicationSummary");
  const waLink = document.getElementById("applicationWhatsApp");
  const editBtn = document.getElementById("applicationEdit");
  const hero = document.querySelector(".hero");
  const mobileApplyButton = document.getElementById("mobileApplyButton");
  const mobileApplyFab = document.getElementById("mobileApplyFab");
  let lastFocused = null;
  let curtainCleanupTimer = null;
  function getModalFocusable() {
    if (!modal) return [];
    return Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
  }
  function openApplication(mode = "standard") {
    if (!modal) return;
    if (curtainCleanupTimer) {
      clearTimeout(curtainCleanupTimer);
      curtainCleanupTimer = null;
    }
    if (mode === "curtain") modal.classList.add("curtain-mode");
    else modal.classList.remove("curtain-mode");
    lastFocused = document.activeElement;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.body.classList.add("application-open");
    updateMobileApplyFab();
    setTimeout(
      () => {
        const first = document.getElementById("appName");
        if (first) first.focus({ preventScroll: true });
      },
      mode === "curtain" ? 240 : 80,
    );
  }
  function closeApplication() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    curtainCleanupTimer = setTimeout(() => {
      modal.classList.remove("curtain-mode");
      curtainCleanupTimer = null;
    }, 900);
    document.body.style.overflow = "";
    document.body.classList.remove("application-open");
    updateMobileApplyFab();
    if (lastFocused && typeof lastFocused.focus === "function")
      lastFocused.focus();
  }
  document.querySelectorAll("[data-open-application]").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      rvuTrackClarity("Apply_Click");
      openApplication("standard");
    });
  });
  if (closeBtn) closeBtn.addEventListener("click", closeApplication);
  if (mobileApplyButton) {
    mobileApplyButton.addEventListener("click", function (e) {
      e.preventDefault();
      rvuTrackClarity("Apply_Click");
      openApplication("curtain");
    });
  }
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeApplication();
    });
  document.addEventListener("keydown", (e) => {
    if (modal && modal.classList.contains("show")) {
      if (e.key === "Escape") {
        closeApplication();
        return;
      }
      if (e.key === "Tab") {
        const focusable = getModalFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
  if (waLink) {
    waLink.addEventListener("click", () => rvuTrackClarity("WhatsApp_Click"));
  }
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      if (success) success.classList.remove("show");
      if (form) form.style.display = "grid";
      document.dispatchEvent(new Event("rvu:applicationedit"));
      const first = document.getElementById("appName");
      if (first) first.focus();
    });
  }
  function updateMobileApplyFab() {
    if (!mobileApplyFab) return;
    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const contactSection = document.getElementById("contact");
    const contactRect = contactSection
      ? contactSection.getBoundingClientRect()
      : null;
    const heroVisible = heroRect && heroRect.bottom > 110;
    const contactVisible =
      contactRect &&
      contactRect.top < window.innerHeight * 0.92 &&
      contactRect.bottom > 0;
    const shouldShow =
      !heroVisible &&
      !contactVisible &&
      !document.body.classList.contains("application-open");
    mobileApplyFab.classList.toggle("show", shouldShow);
    mobileApplyFab.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    mobileApplyFab.inert = !shouldShow;
  }
  updateMobileApplyFab();
  window.addEventListener("scroll", updateMobileApplyFab, { passive: true });
  window.addEventListener("resize", updateMobileApplyFab, { passive: true });
  window.updateApplicationLanguage = function () {
    const isAr = window.RVU_LANG === "ar";
    const name = document.getElementById("appName");
    const goal = document.getElementById("appGoal");
    const close = document.getElementById("applicationClose");
    if (name)
      name.placeholder = isAr ? "مثال: أحمد محمد" : "e.g. Ahmed Mohamed";
    if (goal)
      goal.placeholder = isAr
        ? "اكتب هدفك باختصار: إيه اللي موقفك دلوقتي وإيه اللي عاوز توصله؟"
        : "Briefly describe what is blocking you now and what you want to achieve.";
    if (close)
      close.setAttribute(
        "aria-label",
        isAr ? "إغلاق نموذج التقديم" : "Close application form",
      );
  };
  window.updateApplicationLanguage();
})();
