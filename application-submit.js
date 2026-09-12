"use strict";
(function () {
  const form = document.getElementById("applicationForm");
  if (!form) return;
  const phone = document.getElementById("appPhone");
  const country = document.getElementById("appCountryCode");
  const submit = form.querySelector(".application-submit");
  const error = document.getElementById("applicationError");
  const handoff = document.getElementById("applicationSuccess");
  const link = document.getElementById("applicationWhatsApp");
  const KEY = "rvuApplicationPendingV3";
  const TTL = 30 * 60 * 1000;
  let current = null, submitting = false, started = false;
  const ar = () => (document.documentElement.lang || "ar") === "ar";
  const track = name => { if (typeof window.rvuTrackClarity === "function") window.rvuTrackClarity(name); };
  const storage = {
    get(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch (_) {} },
    remove(key) { try { sessionStorage.removeItem(key); } catch (_) {} }
  };
  try {
    const old = JSON.parse(storage.get(KEY) || "null");
    if (old && Date.now() - old.created < TTL && old.payload && old.fingerprint) current = old;
    else storage.remove(KEY);
  } catch (_) { storage.remove(KEY); }
  storage.remove("rvuApplicationPendingV2");
  function asciiDigits(value) {
    return value.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660))
      .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6f0));
  }
  function normalizedPhone() {
    const raw = asciiDigits(phone.value).trim();
    if (!/^[+\d\s().-]+$/.test(raw)) return null;
    const dial = country.value.replace(/\D/g, "");
    let digits = raw.replace(/\D/g, "");
    if (/^\+|^00/.test(raw)) {
      if (raw.startsWith("00")) digits = digits.slice(2);
      if (!digits.startsWith(dial)) return null;
      digits = digits.slice(dial.length);
    }
    // Italian numbers preserve their significant leading zero.
    if (dial === "7" && digits.length === 11 && digits.startsWith("8")) digits = digits.slice(1);
    if (dial !== "39") digits = digits.replace(/^0+/, "");
    if (dial === "20" && !/^1[0125]\d{8}$/.test(digits)) return null;
    const full = dial + digits;
    if (digits.length < 6 || full.length > 15 || full.length < 8) return null;
    return "+" + full;
  }
  function selected(id) {
    const el = document.getElementById(id);
    return el.options[el.selectedIndex]?.textContent.trim() || "";
  }
  function values() {
    return {
      name: document.getElementById("appName").value.trim(), phone: normalizedPhone(),
      country: country.options[country.selectedIndex].dataset.country, country_code: country.value,
      level: document.getElementById("appLevel").value, level_display: selected("appLevel"),
      liveTargets: document.getElementById("appLiveTargets").value, live_targets_display: selected("appLiveTargets"),
      goal: document.getElementById("appGoal").value.trim(), language: ar() ? "ar" : "en"
    };
  }
  function payloadFor(v) {
    const fingerprint = JSON.stringify([v.name, v.phone, v.country, v.level, v.liveTargets, v.goal]);
    if (current && current.fingerprint === fingerprint && Date.now() - current.created < TTL) {
      Object.assign(current.payload, v); return current;
    }
    const url = new URL(window.location.href), params = url.searchParams;
    const payload = { ...v, submission_id: crypto.randomUUID(), submitted_at: new Date().toISOString(), page_url: url.origin + url.pathname, referrer: document.referrer || "direct" };
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "li_fat_id"]) payload[key] = (params.get(key) || "").slice(0, 500);
    current = { payload, fingerprint, created: Date.now(), status: "ready" };
    storage.set(KEY, JSON.stringify(current)); return current;
  }
  function whatsappUrl(p) {
    const message = ar()
      ? `طلب تقديم لانترفيو RVU Camp\n\nالاسم: ${p.name}\nرقم واتسابي: ${p.phone}\nالمستوى: ${p.level_display}\nاشتغلت على Live Targets؟ ${p.live_targets_display}\nهدفي: ${p.goal}`
      : `RVU Camp interview application\n\nName: ${p.name}\nWhatsApp: ${p.phone}\nLevel: ${p.level_display}\nHunted live targets? ${p.live_targets_display}\nGoal: ${p.goal}`;
    const url = new URL("https://wa.me/201280499854"); url.searchParams.set("text", message); return url.href;
  }
  function convertOnce(p) {
    const key = "rvuLinkedInSaved:" + p.submission_id;
    if (storage.get(key)) return;
    if (typeof window.lintrk === "function") {
      window.lintrk("track", { conversion_id: 30331010 }); storage.set(key, "1");
    }
  }
  function clearRecord(record) {
    try {
      const pending = JSON.parse(storage.get(KEY) || "null");
      if (pending?.payload?.submission_id === record.payload.submission_id) storage.remove(KEY);
    } catch (_) {}
  }
  function backup(record) {
    // No automatic retry: an interrupted response may already have saved.
    if (record.status !== "ready") return;
    record.status = "pending"; storage.set(KEY, JSON.stringify(record));
    const fd = new FormData();
    for (const [key, value] of Object.entries(record.payload)) fd.append(key, value);
    fd.append("_subject", "RVU Camp application — " + record.payload.name);
    track("Application_Submit_Start");
    fetch("https://formspree.io/f/xoeqykpq", {
      method: "POST", body: fd, headers: { Accept: "application/json" }, keepalive: true
    }).then(response => {
      if (!response.ok) throw new Error("Application request failed");
      record.status = "saved"; clearRecord(record);
      track("Application_Save_Success"); convertOnce(record.payload);
    }).catch(() => {
      record.status = "unconfirmed"; clearRecord(record); track("Application_Save_Unconfirmed");
    });
  }
  phone.addEventListener("input", () => phone.setCustomValidity(""));
  country.addEventListener("change", () => phone.setCustomValidity(""));
  form.addEventListener("input", () => { if (!started) { started = true; track("Application_Form_Start"); } });
  document.addEventListener("rvu:applicationedit", () => { submitting = false; submit.disabled = false; });
  form.addEventListener("submit", function (event) {
    event.preventDefault(); if (submitting) return;
    error.hidden = true;
    phone.setCustomValidity(normalizedPhone() ? "" : (ar() ? "اكتب رقم واتساب صحيح وتأكد من كود الدولة" : "Enter a valid WhatsApp number and check the country code"));
    if (!form.reportValidity()) return;
    const v = values();
    if (!v.name || !v.goal) {
      error.textContent = ar() ? "اكتب اسمك وهدفك قبل المتابعة." : "Enter your name and goal before continuing.";
      error.hidden = false; return;
    }
    const record = payloadFor(v), url = whatsappUrl(record.payload);
    link.href = url; form.style.display = "none"; handoff.classList.add("show");
    submitting = true; submit.disabled = true; track("Application_Form_Complete");
    // Synchronous user activation: the backup cannot delay WhatsApp.
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch (_) {}
    track("WhatsApp_Open_Attempt"); link.focus({ preventScroll: true }); backup(record);
  });
})();
