"use strict";
// Compatibility for visitors whose previous cached page linked here.
(function () {
  let payload;
  try {
    payload = JSON.parse(sessionStorage.getItem("rvuApplicationPendingV2") || "null");
    sessionStorage.removeItem("rvuApplicationPendingV2");
  } catch (_) {}
  if (!payload) return;
  const en = payload.language === "en";
  if (en) {
    document.documentElement.lang = "en"; document.documentElement.dir = "ltr";
    document.getElementById("title").textContent = "Continue on WhatsApp";
    document.getElementById("copy").textContent = "Open WhatsApp and send the prepared message to continue your application.";
    document.getElementById("continueWhatsApp").textContent = "Open WhatsApp";
    document.getElementById("returnHome").textContent = "Return to the website";
  }
  const message = en
    ? `RVU Camp interview application\nName: ${payload.name || ''}\nWhatsApp: ${payload.phone || ''}\nLevel: ${payload.level_display || ''}\nGoal: ${payload.goal || ''}`
    : `طلب تقديم لانترفيو RVU Camp\nالاسم: ${payload.name || ''}\nواتساب: ${payload.phone || ''}\nالمستوى: ${payload.level_display || ''}\nالهدف: ${payload.goal || ''}`;
  const url = new URL("https://wa.me/201280499854"); url.searchParams.set("text", message);
  document.getElementById("continueWhatsApp").href = url.href;
  location.replace(url.href);
})();
