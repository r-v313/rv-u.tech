"use strict";
(function () {
  const STORAGE_KEY = "rvuApplicationPendingV2";
  const TRACK_PREFIX = "rvuLinkedInTracked:";
  const CONVERSION_ID = 30331010;
  const form = document.getElementById("applicationForm");
  if (!form) return;

  const COUNTRY_CODES = [
    ["EG", "🇪🇬 Egypt", "+20"],
    ["AF", "🇦🇫 Afghanistan", "+93"],
    ["AL", "🇦🇱 Albania", "+355"],
    ["DZ", "🇩🇿 Algeria", "+213"],
    ["AS", "🇦🇸 American Samoa", "+1 684"],
    ["AD", "🇦🇩 Andorra", "+376"],
    ["AO", "🇦🇴 Angola", "+244"],
    ["AI", "🇦🇮 Anguilla", "+1 264"],
    ["AQ", "🇦🇶 Antarctica", "+672"],
    ["AG", "🇦🇬 Antigua & Barbuda", "+1 268"],
    ["AR", "🇦🇷 Argentina", "+54"],
    ["AM", "🇦🇲 Armenia", "+374"],
    ["AW", "🇦🇼 Aruba", "+297"],
    ["AU", "🇦🇺 Australia", "+61"],
    ["AT", "🇦🇹 Austria", "+43"],
    ["AZ", "🇦🇿 Azerbaijan", "+994"],
    ["BS", "🇧🇸 Bahamas", "+1 242"],
    ["BH", "🇧🇭 Bahrain", "+973"],
    ["BD", "🇧🇩 Bangladesh", "+880"],
    ["BB", "🇧🇧 Barbados", "+1 246"],
    ["BY", "🇧🇾 Belarus", "+375"],
    ["BE", "🇧🇪 Belgium", "+32"],
    ["BZ", "🇧🇿 Belize", "+501"],
    ["BJ", "🇧🇯 Benin", "+229"],
    ["BM", "🇧🇲 Bermuda", "+1 441"],
    ["BT", "🇧🇹 Bhutan", "+975"],
    ["BO", "🇧🇴 Bolivia", "+591"],
    ["BQ", "🇧🇶 Bonaire, Sint Eustatius & Saba", "+599"],
    ["BA", "🇧🇦 Bosnia & Herzegovina", "+387"],
    ["BW", "🇧🇼 Botswana", "+267"],
    ["BR", "🇧🇷 Brazil", "+55"],
    ["IO", "🇮🇴 British Indian Ocean Territory", "+246"],
    ["VG", "🇻🇬 British Virgin Islands", "+1 284"],
    ["BN", "🇧🇳 Brunei", "+673"],
    ["BG", "🇧🇬 Bulgaria", "+359"],
    ["BF", "🇧🇫 Burkina Faso", "+226"],
    ["BI", "🇧🇮 Burundi", "+257"],
    ["CV", "🇨🇻 Cabo Verde", "+238"],
    ["KH", "🇰🇭 Cambodia", "+855"],
    ["CM", "🇨🇲 Cameroon", "+237"],
    ["CA", "🇨🇦 Canada", "+1"],
    ["KY", "🇰🇾 Cayman Islands", "+1 345"],
    ["CF", "🇨🇫 Central African Republic", "+236"],
    ["TD", "🇹🇩 Chad", "+235"],
    ["CL", "🇨🇱 Chile", "+56"],
    ["CN", "🇨🇳 China", "+86"],
    ["CX", "🇨🇽 Christmas Island", "+61"],
    ["CC", "🇨🇨 Cocos (Keeling) Islands", "+61"],
    ["CO", "🇨🇴 Colombia", "+57"],
    ["KM", "🇰🇲 Comoros", "+269"],
    ["CG", "🇨🇬 Congo", "+242"],
    ["CD", "🇨🇩 DR Congo", "+243"],
    ["CK", "🇨🇰 Cook Islands", "+682"],
    ["CR", "🇨🇷 Costa Rica", "+506"],
    ["CI", "🇨🇮 Côte d’Ivoire", "+225"],
    ["HR", "🇭🇷 Croatia", "+385"],
    ["CU", "🇨🇺 Cuba", "+53"],
    ["CW", "🇨🇼 Curaçao", "+599"],
    ["CY", "🇨🇾 Cyprus", "+357"],
    ["CZ", "🇨🇿 Czechia", "+420"],
    ["DK", "🇩🇰 Denmark", "+45"],
    ["DJ", "🇩🇯 Djibouti", "+253"],
    ["DM", "🇩🇲 Dominica", "+1 767"],
    ["DO809", "🇩🇴 Dominican Republic", "+1 809"],
    ["DO829", "🇩🇴 Dominican Republic", "+1 829"],
    ["DO849", "🇩🇴 Dominican Republic", "+1 849"],
    ["EC", "🇪🇨 Ecuador", "+593"],
    ["SV", "🇸🇻 El Salvador", "+503"],
    ["GQ", "🇬🇶 Equatorial Guinea", "+240"],
    ["ER", "🇪🇷 Eritrea", "+291"],
    ["EE", "🇪🇪 Estonia", "+372"],
    ["SZ", "🇸🇿 Eswatini", "+268"],
    ["ET", "🇪🇹 Ethiopia", "+251"],
    ["FK", "🇫🇰 Falkland Islands", "+500"],
    ["FO", "🇫🇴 Faroe Islands", "+298"],
    ["FJ", "🇫🇯 Fiji", "+679"],
    ["FI", "🇫🇮 Finland", "+358"],
    ["FR", "🇫🇷 France", "+33"],
    ["GF", "🇬🇫 French Guiana", "+594"],
    ["PF", "🇵🇫 French Polynesia", "+689"],
    ["GA", "🇬🇦 Gabon", "+241"],
    ["GM", "🇬🇲 Gambia", "+220"],
    ["GE", "🇬🇪 Georgia", "+995"],
    ["DE", "🇩🇪 Germany", "+49"],
    ["GH", "🇬🇭 Ghana", "+233"],
    ["GI", "🇬🇮 Gibraltar", "+350"],
    ["GR", "🇬🇷 Greece", "+30"],
    ["GL", "🇬🇱 Greenland", "+299"],
    ["GD", "🇬🇩 Grenada", "+1 473"],
    ["GP", "🇬🇵 Guadeloupe", "+590"],
    ["GU", "🇬🇺 Guam", "+1 671"],
    ["GT", "🇬🇹 Guatemala", "+502"],
    ["GG", "🇬🇬 Guernsey", "+44 1481"],
    ["GN", "🇬🇳 Guinea", "+224"],
    ["GW", "🇬🇼 Guinea-Bissau", "+245"],
    ["GY", "🇬🇾 Guyana", "+592"],
    ["HT", "🇭🇹 Haiti", "+509"],
    ["HN", "🇭🇳 Honduras", "+504"],
    ["HK", "🇭🇰 Hong Kong", "+852"],
    ["HU", "🇭🇺 Hungary", "+36"],
    ["IS", "🇮🇸 Iceland", "+354"],
    ["IN", "🇮🇳 India", "+91"],
    ["ID", "🇮🇩 Indonesia", "+62"],
    ["IR", "🇮🇷 Iran", "+98"],
    ["IQ", "🇮🇶 Iraq", "+964"],
    ["IE", "🇮🇪 Ireland", "+353"],
    ["IM", "🇮🇲 Isle of Man", "+44 1624"],
    ["IL", "🇮🇱 Israel", "+972"],
    ["IT", "🇮🇹 Italy", "+39"],
    ["JM876", "🇯🇲 Jamaica", "+1 876"],
    ["JM658", "🇯🇲 Jamaica", "+1 658"],
    ["JP", "🇯🇵 Japan", "+81"],
    ["JE", "🇯🇪 Jersey", "+44 1534"],
    ["JO", "🇯🇴 Jordan", "+962"],
    ["KZ", "🇰🇿 Kazakhstan", "+7"],
    ["KE", "🇰🇪 Kenya", "+254"],
    ["KI", "🇰🇮 Kiribati", "+686"],
    ["XK", "🇽🇰 Kosovo", "+383"],
    ["KW", "🇰🇼 Kuwait", "+965"],
    ["KG", "🇰🇬 Kyrgyzstan", "+996"],
    ["LA", "🇱🇦 Laos", "+856"],
    ["LV", "🇱🇻 Latvia", "+371"],
    ["LB", "🇱🇧 Lebanon", "+961"],
    ["LS", "🇱🇸 Lesotho", "+266"],
    ["LR", "🇱🇷 Liberia", "+231"],
    ["LY", "🇱🇾 Libya", "+218"],
    ["LI", "🇱🇮 Liechtenstein", "+423"],
    ["LT", "🇱🇹 Lithuania", "+370"],
    ["LU", "🇱🇺 Luxembourg", "+352"],
    ["MO", "🇲🇴 Macao", "+853"],
    ["MG", "🇲🇬 Madagascar", "+261"],
    ["MW", "🇲🇼 Malawi", "+265"],
    ["MY", "🇲🇾 Malaysia", "+60"],
    ["MV", "🇲🇻 Maldives", "+960"],
    ["ML", "🇲🇱 Mali", "+223"],
    ["MT", "🇲🇹 Malta", "+356"],
    ["MH", "🇲🇭 Marshall Islands", "+692"],
    ["MQ", "🇲🇶 Martinique", "+596"],
    ["MR", "🇲🇷 Mauritania", "+222"],
    ["MU", "🇲🇺 Mauritius", "+230"],
    ["YT", "🇾🇹 Mayotte", "+262"],
    ["MX", "🇲🇽 Mexico", "+52"],
    ["FM", "🇫🇲 Micronesia", "+691"],
    ["MD", "🇲🇩 Moldova", "+373"],
    ["MC", "🇲🇨 Monaco", "+377"],
    ["MN", "🇲🇳 Mongolia", "+976"],
    ["ME", "🇲🇪 Montenegro", "+382"],
    ["MS", "🇲🇸 Montserrat", "+1 664"],
    ["MA", "🇲🇦 Morocco", "+212"],
    ["MZ", "🇲🇿 Mozambique", "+258"],
    ["MM", "🇲🇲 Myanmar", "+95"],
    ["NA", "🇳🇦 Namibia", "+264"],
    ["NR", "🇳🇷 Nauru", "+674"],
    ["NP", "🇳🇵 Nepal", "+977"],
    ["NL", "🇳🇱 Netherlands", "+31"],
    ["NC", "🇳🇨 New Caledonia", "+687"],
    ["NZ", "🇳🇿 New Zealand", "+64"],
    ["NI", "🇳🇮 Nicaragua", "+505"],
    ["NE", "🇳🇪 Niger", "+227"],
    ["NG", "🇳🇬 Nigeria", "+234"],
    ["NU", "🇳🇺 Niue", "+683"],
    ["NF", "🇳🇫 Norfolk Island", "+672"],
    ["KP", "🇰🇵 North Korea", "+850"],
    ["MK", "🇲🇰 North Macedonia", "+389"],
    ["MP", "🇲🇵 Northern Mariana Islands", "+1 670"],
    ["NO", "🇳🇴 Norway", "+47"],
    ["OM", "🇴🇲 Oman", "+968"],
    ["PK", "🇵🇰 Pakistan", "+92"],
    ["PW", "🇵🇼 Palau", "+680"],
    ["PS", "🇵🇸 Palestine", "+970"],
    ["PA", "🇵🇦 Panama", "+507"],
    ["PG", "🇵🇬 Papua New Guinea", "+675"],
    ["PY", "🇵🇾 Paraguay", "+595"],
    ["PE", "🇵🇪 Peru", "+51"],
    ["PH", "🇵🇭 Philippines", "+63"],
    ["PL", "🇵🇱 Poland", "+48"],
    ["PT", "🇵🇹 Portugal", "+351"],
    ["PR787", "🇵🇷 Puerto Rico", "+1 787"],
    ["PR939", "🇵🇷 Puerto Rico", "+1 939"],
    ["QA", "🇶🇦 Qatar", "+974"],
    ["RE", "🇷🇪 Réunion", "+262"],
    ["RO", "🇷🇴 Romania", "+40"],
    ["RU", "🇷🇺 Russia", "+7"],
    ["RW", "🇷🇼 Rwanda", "+250"],
    ["BL", "🇧🇱 Saint Barthélemy", "+590"],
    ["SH", "🇸🇭 Saint Helena", "+290"],
    ["KN", "🇰🇳 Saint Kitts & Nevis", "+1 869"],
    ["LC", "🇱🇨 Saint Lucia", "+1 758"],
    ["MF", "🇲🇫 Saint Martin", "+590"],
    ["PM", "🇵🇲 Saint Pierre & Miquelon", "+508"],
    ["VC", "🇻🇨 Saint Vincent & Grenadines", "+1 784"],
    ["WS", "🇼🇸 Samoa", "+685"],
    ["SM", "🇸🇲 San Marino", "+378"],
    ["ST", "🇸🇹 São Tomé & Príncipe", "+239"],
    ["SA", "🇸🇦 Saudi Arabia", "+966"],
    ["SN", "🇸🇳 Senegal", "+221"],
    ["RS", "🇷🇸 Serbia", "+381"],
    ["SC", "🇸🇨 Seychelles", "+248"],
    ["SL", "🇸🇱 Sierra Leone", "+232"],
    ["SG", "🇸🇬 Singapore", "+65"],
    ["SX", "🇸🇽 Sint Maarten", "+1 721"],
    ["SK", "🇸🇰 Slovakia", "+421"],
    ["SI", "🇸🇮 Slovenia", "+386"],
    ["SB", "🇸🇧 Solomon Islands", "+677"],
    ["SO", "🇸🇴 Somalia", "+252"],
    ["ZA", "🇿🇦 South Africa", "+27"],
    ["KR", "🇰🇷 South Korea", "+82"],
    ["SS", "🇸🇸 South Sudan", "+211"],
    ["ES", "🇪🇸 Spain", "+34"],
    ["LK", "🇱🇰 Sri Lanka", "+94"],
    ["SD", "🇸🇩 Sudan", "+249"],
    ["SR", "🇸🇷 Suriname", "+597"],
    ["SE", "🇸🇪 Sweden", "+46"],
    ["CH", "🇨🇭 Switzerland", "+41"],
    ["SY", "🇸🇾 Syria", "+963"],
    ["TW", "🇹🇼 Taiwan", "+886"],
    ["TJ", "🇹🇯 Tajikistan", "+992"],
    ["TZ", "🇹🇿 Tanzania", "+255"],
    ["TH", "🇹🇭 Thailand", "+66"],
    ["TL", "🇹🇱 Timor-Leste", "+670"],
    ["TG", "🇹🇬 Togo", "+228"],
    ["TK", "🇹🇰 Tokelau", "+690"],
    ["TO", "🇹🇴 Tonga", "+676"],
    ["TT", "🇹🇹 Trinidad & Tobago", "+1 868"],
    ["TN", "🇹🇳 Tunisia", "+216"],
    ["TR", "🇹🇷 Türkiye", "+90"],
    ["TM", "🇹🇲 Turkmenistan", "+993"],
    ["TC", "🇹🇨 Turks & Caicos Islands", "+1 649"],
    ["TV", "🇹🇻 Tuvalu", "+688"],
    ["UG", "🇺🇬 Uganda", "+256"],
    ["UA", "🇺🇦 Ukraine", "+380"],
    ["AE", "🇦🇪 United Arab Emirates", "+971"],
    ["GB", "🇬🇧 United Kingdom", "+44"],
    ["US", "🇺🇸 United States", "+1"],
    ["VI", "🇻🇮 U.S. Virgin Islands", "+1 340"],
    ["UY", "🇺🇾 Uruguay", "+598"],
    ["UZ", "🇺🇿 Uzbekistan", "+998"],
    ["VU", "🇻🇺 Vanuatu", "+678"],
    ["VA", "🇻🇦 Vatican City", "+39"],
    ["VE", "🇻🇪 Venezuela", "+58"],
    ["VN", "🇻🇳 Vietnam", "+84"],
    ["WF", "🇼🇫 Wallis & Futuna", "+681"],
    ["EH", "🇪🇭 Western Sahara", "+212"],
    ["YE", "🇾🇪 Yemen", "+967"],
    ["ZM", "🇿🇲 Zambia", "+260"],
    ["ZW", "🇿🇼 Zimbabwe", "+263"],
  ];

  function ar() {
    return (window.RVU_LANG || document.documentElement.lang || "ar")
      .toLowerCase()
      .startsWith("ar");
  }
  function setLocalized(el, arabic, english) {
    if (!el) return;
    el.dataset.ar = arabic;
    el.dataset.en = english;
    el.textContent = ar() ? arabic : english;
  }
  function selectedText(select) {
    if (!select || select.selectedIndex < 0) return "";
    return select.options[select.selectedIndex].textContent.trim();
  }

  function ensurePhoneField() {
    let input = document.getElementById("appPhone");
    if (input)
      return {
        input: input,
        country: document.getElementById("appCountryCode"),
      };

    const nameInput = document.getElementById("appName");
    const nameField = nameInput && nameInput.closest(".form-field");
    if (!nameField) return { input: null, country: null };

    const wrap = document.createElement("div");
    wrap.className = "form-field full";

    const label = document.createElement("label");
    label.className = "i18n";
    label.htmlFor = "appPhone";
    label.dataset.ar = "رقم واتسابك";
    label.dataset.en = "Your WhatsApp number";
    label.textContent = ar() ? "رقم واتسابك" : "Your WhatsApp number";

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "minmax(145px, 0.9fr) minmax(0, 1.6fr)";
    row.style.gap = "10px";
    row.style.direction = "ltr";

    const country = document.createElement("select");
    country.id = "appCountryCode";
    country.name = "country_code";
    country.required = true;
    country.setAttribute(
      "aria-label",
      ar() ? "كود الدولة" : "Country calling code",
    );
    COUNTRY_CODES.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item[2];
      option.dataset.country = item[0];
      option.textContent = item[1] + "  " + item[2];
      if (item[0] === "EG") option.selected = true;
      country.appendChild(option);
    });

    input = document.createElement("input");
    input.id = "appPhone";
    input.name = "phone_local";
    input.type = "tel";
    input.required = true;
    input.autocomplete = "tel-national";
    input.inputMode = "tel";
    input.maxLength = 24;
    input.placeholder = ar() ? "مثال: 01012345678" : "Phone number";
    input.setAttribute(
      "aria-label",
      ar()
        ? "رقم واتساب بدون كود الدولة"
        : "WhatsApp number without country code",
    );
    input.style.minWidth = "0";

    input.addEventListener("input", function () {
      input.setCustomValidity("");
    });
    row.appendChild(country);
    row.appendChild(input);
    wrap.appendChild(label);
    wrap.appendChild(row);
    nameField.insertAdjacentElement("afterend", wrap);
    return { input: input, country: country };
  }

  const phoneUI = ensurePhoneField();
  const phoneInput = phoneUI.input;
  const countrySelect = phoneUI.country;

  const submitBtn = form.querySelector(".application-submit");
  if (submitBtn) {
    submitBtn.dataset.ar = "إرسال الطلب والمتابعة على واتساب";
    submitBtn.dataset.en = "Submit & Continue on WhatsApp";
    submitBtn.textContent = ar()
      ? "إرسال الطلب والمتابعة على واتساب"
      : "Submit & Continue on WhatsApp";
  }

  const faqItems = document.querySelectorAll("#faq-section .faq-item");
  if (faqItems.length) {
    const lastAnswer =
      faqItems[faqItems.length - 1].querySelector(".faq-answer");
    if (lastAnswer)
      setLocalized(
        lastAnswer,
        "هتملا طلب مختصر وتختار كود الدولة وتكتب رقم واتسابك. بعد الإرسال بيتحفظ الطلب كنسخة احتياطية ويفتح واتساب تلقائيًا برسالة جاهزة. لو المستوى مناسب هنحدد الانترفيو وبعده هقولك بصراحة Accepted أو Not Yet، والدفع بيكون بس بعد القبول لو إنت قررت تدخل.",
        "You fill in a short application, choose your country code, and enter your WhatsApp number. The application is backed up, then WhatsApp opens automatically with a prepared message. If the level fits, we schedule the interview. Payment only happens after acceptance if you decide to join.",
      );
  }

  let errorBox = document.getElementById("applicationError");
  if (!errorBox) {
    errorBox = document.createElement("div");
    errorBox.id = "applicationError";
    errorBox.className = "form-privacy";
    errorBox.setAttribute("role", "alert");
    errorBox.style.display = "none";
    errorBox.style.color = "#ff9b73";
    if (submitBtn) form.insertBefore(errorBox, submitBtn);
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    if (busy) {
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.textContent = ar()
        ? "جارٍ حفظ الطلب وفتح واتساب..."
        : "Saving application & opening WhatsApp...";
    } else {
      submitBtn.removeAttribute("aria-busy");
      submitBtn.textContent = ar()
        ? "إرسال الطلب والمتابعة على واتساب"
        : "Submit & Continue on WhatsApp";
    }
  }
  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function")
      return window.crypto.randomUUID();
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12)
    );
  }

  function validatePhone() {
    if (!phoneInput || !countrySelect) return false;
    const digits = phoneInput.value.replace(/\D/g, "");
    if (digits.length < 5 || digits.length > 15) {
      phoneInput.setCustomValidity(
        ar()
          ? "اكتب رقم واتساب صحيح بدون كود الدولة"
          : "Enter a valid WhatsApp number without the country code",
      );
      phoneInput.reportValidity();
      return false;
    }
    phoneInput.setCustomValidity("");
    return true;
  }

  function getPayload() {
    const name = document.getElementById("appName").value.trim();
    const localPhone = phoneInput.value.trim();
    const dialCode = countrySelect.value.trim();
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex];
    const countryName = selectedCountry
      ? selectedCountry.textContent.replace(/\s+[+]\d.*$/, "").trim()
      : "";
    const fullPhone = (dialCode + " " + localPhone).trim();
    const levelSelect = document.getElementById("appLevel");
    const liveSelect = document.getElementById("appLiveTargets");
    const goal = document.getElementById("appGoal").value.trim();
    const originalUrl = new URL(window.location.href);
    originalUrl.searchParams.delete("rvu_application");
    const p = originalUrl.searchParams;
    return {
      submission_id: newId(),
      name: name,
      country: countryName,
      country_code: dialCode,
      phone_local: localPhone,
      phone: fullPhone,
      level: levelSelect.value,
      level_display: selectedText(levelSelect),
      liveTargets: liveSelect.value,
      live_targets_display: selectedText(liveSelect),
      goal: goal,
      language: ar() ? "ar" : "en",
      page_url: originalUrl.href,
      referrer: document.referrer || "direct",
      submitted_at: new Date().toISOString(),
      utm_source: p.get("utm_source") || "",
      utm_medium: p.get("utm_medium") || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_content: p.get("utm_content") || "",
      utm_term: p.get("utm_term") || "",
      utm_id: p.get("utm_id") || "",
      li_fat_id: p.get("li_fat_id") || "",
    };
  }

  function trackLinkedInOnce(payload) {
    const key = TRACK_PREFIX + payload.submission_id;
    try {
      if (sessionStorage.getItem(key) === "1") return;
    } catch (_) {}
    let tries = 0;
    function send() {
      if (typeof window.lintrk === "function") {
        window.lintrk("track", { conversion_id: CONVERSION_ID });
        try {
          sessionStorage.setItem(key, "1");
        } catch (_) {}
        return;
      }
      if (tries++ < 5) setTimeout(send, 150);
    }
    send();
  }

  form.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!validatePhone()) return;
      if (!form.reportValidity()) return;
      errorBox.style.display = "none";
      errorBox.textContent = "";
      try {
        const payload = getPayload();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        if (typeof window.rvuTrackClarity === "function") {
          window.rvuTrackClarity("Application_Form_Complete");
          window.rvuTrackClarity("Application_Submit_Start");
        }
        trackLinkedInOnce(payload);
        setBusy(true);
        window.location.assign("./submit.html");
      } catch (err) {
        setBusy(false);
        errorBox.textContent = ar()
          ? "حصلت مشكلة أثناء تجهيز الطلب. جرّب تاني من تبويب عادي ومتقفلش التخزين للموقع."
          : "Could not prepare the application. Please retry in a normal browser tab with site storage enabled.";
        errorBox.style.display = "block";
      }
    },
    true,
  );
})();
