"use strict";

(function () {
  const params = new URLSearchParams(window.location.search);
  const isPaidLinkedIn =
    params.get("utm_source") === "linkedin" ||
    params.get("utm_medium") === "paid-social" ||
    params.has("li_fat_id");

  function isEnglish() {
    return document.documentElement.lang === "en";
  }

  function track(eventName) {
    if (typeof window.rvuTrackClarity === "function") {
      window.rvuTrackClarity(eventName);
    }
  }

  function injectStyles() {
    if (document.getElementById("rvuCampaignFixStyles")) return;
    const style = document.createElement("style");
    style.id = "rvuCampaignFixStyles";
    style.textContent = `
      .rvu-paid-summary {
        width: min(1120px, calc(100% - 32px));
        margin: 18px auto 34px;
        border: 1px solid rgba(255,106,0,.38);
        background: linear-gradient(135deg, rgba(255,106,0,.10), rgba(10,10,10,.96));
        border-radius: 12px;
        padding: 18px;
        display: grid;
        gap: 14px;
        box-shadow: 0 16px 46px rgba(0,0,0,.32);
      }
      .rvu-paid-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }
      .rvu-paid-summary-item {
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.28);
        border-radius: 8px;
        padding: 12px 10px;
        text-align: center;
      }
      .rvu-paid-summary-item b {
        display: block;
        color: #fffaf5;
        font-size: .95rem;
        margin-bottom: 3px;
      }
      .rvu-paid-summary-item span {
        color: #b8b2aa;
        font-size: .78rem;
      }
      .rvu-paid-summary-price {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .rvu-paid-summary-price strong {
        color: #ff7a1a;
        font-size: 1.18rem;
      }
      .rvu-paid-summary-note,
      .rvu-international-payment-note {
        color: #c9c2ba;
        font-size: .82rem;
        line-height: 1.65;
      }
      .rvu-international-payment-note {
        display: block;
        margin-top: 9px;
        text-align: center;
      }
      body.rvu-paid-landing .reveal {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
      @media (max-width: 760px) {
        .rvu-paid-summary {
          width: min(100% - 20px, 680px);
          margin-top: 10px;
          padding: 14px;
        }
        .rvu-paid-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .rvu-paid-summary-item {
          padding: 10px 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function addPaidSummary() {
    if (!isPaidLinkedIn || document.getElementById("rvuPaidSummary")) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const box = document.createElement("div");
    box.id = "rvuPaidSummary";
    box.className = "rvu-paid-summary";
    box.innerHTML = isEnglish()
      ? `
        <div class="rvu-paid-summary-grid">
          <div class="rvu-paid-summary-item"><b>6 Weeks</b><span>36+ live hours</span></div>
          <div class="rvu-paid-summary-item"><b>Weekly 1:1</b><span>Personal follow-up</span></div>
          <div class="rvu-paid-summary-item"><b>12 Students</b><span>Small cohort</span></div>
          <div class="rvu-paid-summary-item"><b>Interview First</b><span>No payment before acceptance</span></div>
        </div>
        <div class="rvu-paid-summary-price"><strong>4000 EGP</strong><button type="button" class="btn-primary" id="rvuPaidApply">Apply for the interview</button></div>
        <div class="rvu-paid-summary-note">Applicants outside Egypt are welcome. International payment options are arranged after acceptance.</div>
      `
      : `
        <div class="rvu-paid-summary-grid">
          <div class="rvu-paid-summary-item"><b>6 أسابيع</b><span>أكثر من 36 ساعة Live</span></div>
          <div class="rvu-paid-summary-item"><b>1:1 أسبوعيًا</b><span>متابعة شخصية</span></div>
          <div class="rvu-paid-summary-item"><b>12 طالب فقط</b><span>دفعة صغيرة</span></div>
          <div class="rvu-paid-summary-item"><b>الانترفيو أولًا</b><span>مفيش دفع قبل القبول</span></div>
        </div>
        <div class="rvu-paid-summary-price"><strong>4000 جنيه</strong><button type="button" class="btn-primary" id="rvuPaidApply">قدّم للانترفيو</button></div>
        <div class="rvu-paid-summary-note">التقديم متاح من خارج مصر وطرق الدفع الدولية بتتحدد بعد القبول.</div>
      `;

    hero.appendChild(box);
    const apply = document.getElementById("rvuPaidApply");
    if (apply) {
      apply.addEventListener("click", function () {
        const existing = document.querySelector("[data-open-application]");
        if (existing) existing.click();
      });
    }
  }

  function reorderPaidSections() {
    if (!isPaidLinkedIn) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const ordered = [
      document.getElementById("outcomes-section"),
      document.getElementById("about"),
      document.getElementById("contact"),
      document.getElementById("fit-section"),
      document.getElementById("level-check"),
      document.getElementById("execution"),
      document.getElementById("curriculum"),
      document.getElementById("legal-bonus-section"),
      document.getElementById("faq-section"),
    ].filter(Boolean);

    let cursor = hero;
    ordered.forEach(function (section) {
      cursor.insertAdjacentElement("afterend", section);
      cursor = section;
    });
  }

  function improveCountryPicker() {
    const select = document.getElementById("appCountryCode");
    if (!select || select.dataset.rvuEnhanced === "1") return;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = isEnglish() ? "Choose country code" : "اختار كود الدولة";
    select.insertBefore(placeholder, select.firstChild);
    select.value = "";
    select.dataset.rvuEnhanced = "1";
  }

  function addInternationalPaymentNote() {
    if (document.getElementById("rvuInternationalPaymentNote")) return;
    const installment = document.getElementById("installmentPaymentNote");
    if (!installment || !installment.parentNode) return;

    const note = document.createElement("span");
    note.id = "rvuInternationalPaymentNote";
    note.className = "rvu-international-payment-note";
    note.textContent = isEnglish()
      ? "Outside Egypt? International payment options are available after acceptance."
      : "من خارج مصر؟ طرق دفع دولية متاحة بعد القبول.";
    installment.insertAdjacentElement("afterend", note);
  }

  function addRealFormStartTracking() {
    const form = document.getElementById("applicationForm");
    if (!form || form.dataset.rvuStartTracking === "1") return;
    let started = false;
    const markStarted = function () {
      if (started) return;
      started = true;
      track("Application_Form_Start");
    };
    form.addEventListener("focusin", markStarted, { passive: true });
    form.addEventListener("input", markStarted, { passive: true });
    form.dataset.rvuStartTracking = "1";
  }

  injectStyles();
  if (isPaidLinkedIn) document.body.classList.add("rvu-paid-landing");
  addPaidSummary();
  reorderPaidSections();
  improveCountryPicker();
  addInternationalPaymentNote();
  addRealFormStartTracking();
})();
