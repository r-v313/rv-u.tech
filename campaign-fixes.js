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
        margin: 16px auto 34px;
        border: 1px solid rgba(255,106,0,.38);
        background: linear-gradient(135deg, rgba(255,106,0,.10), rgba(10,10,10,.97));
        border-radius: 12px;
        padding: 20px;
        display: grid;
        gap: 15px;
        box-shadow: 0 16px 46px rgba(0,0,0,.32);
      }
      .rvu-paid-summary h1 {
        margin: 0;
        color: #fffaf5;
        font-size: clamp(1.25rem, 4.2vw, 2rem);
        line-height: 1.4;
      }
      .rvu-paid-summary-lead {
        color: #c8c1b9;
        line-height: 1.7;
        font-size: .92rem;
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
      .rvu-paid-summary-note {
        text-align: center;
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
        <h1>You know the basics — but still freeze when you open a real target?</h1>
        <div class="rvu-paid-summary-lead">A six-week live Bug Bounty mentorship built around methodology, real practice and direct feedback — not another recorded course.</div>
        <div class="rvu-paid-summary-grid">
          <div class="rvu-paid-summary-item"><b>6 Weeks</b><span>36+ live hours</span></div>
          <div class="rvu-paid-summary-item"><b>Weekly 1:1</b><span>Personal follow-up</span></div>
          <div class="rvu-paid-summary-item"><b>3 Previous Camps</b><span>35 students</span></div>
          <div class="rvu-paid-summary-item"><b>12 Students</b><span>Small online cohort</span></div>
        </div>
        <div class="rvu-paid-summary-price"><strong>4000 EGP</strong><button type="button" class="btn-primary" id="rvuPaidApply">Apply for the interview</button></div>
        <div class="rvu-paid-summary-note">The interview comes first. No payment before acceptance. Applicants outside Egypt are welcome; an available international payment method is arranged after acceptance.</div>
      `
      : `
        <h1>عندك الأساسيات لكن أول ما تفتح Target حقيقي بتقف ومش عارف تبدأ منين؟</h1>
        <div class="rvu-paid-summary-lead">Mentorship لايف لمدة 6 أسابيع مبنية على الـMethodology والتطبيق الحقيقي والـFeedback المباشر — مش كورس مسجل جديد.</div>
        <div class="rvu-paid-summary-grid">
          <div class="rvu-paid-summary-item"><b>6 أسابيع</b><span>أكثر من 36 ساعة Live</span></div>
          <div class="rvu-paid-summary-item"><b>1:1 أسبوعيًا</b><span>متابعة شخصية</span></div>
          <div class="rvu-paid-summary-item"><b>3 Camps سابقة</b><span>35 طالب</span></div>
          <div class="rvu-paid-summary-item"><b>12 طالب فقط</b><span>دفعة أونلاين صغيرة</span></div>
        </div>
        <div class="rvu-paid-summary-price"><strong>4000 جنيه</strong><button type="button" class="btn-primary" id="rvuPaidApply">قدّم للانترفيو</button></div>
        <div class="rvu-paid-summary-note">الانترفيو الأول ومفيش دفع قبل القبول. التقديم متاح من خارج مصر ووسيلة دفع دولية مناسبة بتتحدد بعد القبول.</div>
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
    if (!document.getElementById("rvuInternationalPaymentNote")) {
      const installment = document.getElementById("installmentPaymentNote");
      if (installment && installment.parentNode) {
        const note = document.createElement("span");
        note.id = "rvuInternationalPaymentNote";
        note.className = "rvu-international-payment-note";
        note.textContent = isEnglish()
          ? "Outside Egypt? An available international payment method is arranged after acceptance."
          : "من خارج مصر؟ وسيلة دفع دولية متاحة ليك بتتحدد بعد القبول.";
        installment.insertAdjacentElement("afterend", note);
      }
    }

    const faqItems = Array.from(document.querySelectorAll("#faq-section .faq-item"));
    const paymentItem = faqItems.find(function (item) {
      const q = item.querySelector(".faq-question .i18n");
      return q && (q.dataset.ar === "إزاي أدفع" || q.textContent.trim() === "إزاي أدفع");
    });
    const answer = paymentItem && paymentItem.querySelector(".faq-answer");
    if (answer) {
      const ar = "بعد الانترفيو والقبول فقط لو قررت تدخل. داخل مصر متاح Vodafone Cash أو Orange Cash أو Instapay، ومن خارج مصر بنتفق بعد القبول على وسيلة دفع دولية متاحة ليك. القبول لوحده مش بيلزمك تدفع.";
      const en = "Payment only happens after the interview and acceptance if you decide to join. In Egypt, Vodafone Cash, Orange Cash and Instapay are available. Outside Egypt, an available international payment method is arranged after acceptance. Acceptance alone does not obligate you to pay.";
      answer.dataset.ar = ar;
      answer.dataset.en = en;
      answer.textContent = isEnglish() ? en : ar;
    }
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
