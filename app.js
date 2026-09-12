"use strict";

(function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function patchExperienceStart() {
    const huntingTitle = document.querySelector(".proof-title-orange");
    const huntingCopy = huntingTitle?.nextElementSibling;

    if (!huntingTitle || !huntingCopy) return;

    const ar = "بدأت رحلتي في الـBug Bounty سنة 2022 ومن وقتها بهانت بشكل فعلي على Targets حقيقية وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة.";
    const en = "I started my Bug Bounty journey in 2022 and have since hunted on real targets and submitted security reports at different severity levels across public and private Bug Bounty programs.";

    huntingTitle.textContent = "BUG BOUNTY SINCE 2022";
    huntingCopy.dataset.ar = ar;
    huntingCopy.dataset.en = en;
    huntingCopy.textContent = document.documentElement.lang === "en" ? en : ar;
  }

  async function bootstrap() {
    try {
      localStorage.setItem("rvuIntroSeenV5", "1");
    } catch (_) {}

    try {
      await loadScript("./application-submit.js");
      await loadScript("./app-core.js");
      patchExperienceStart();
    } catch (error) {
      console.error(error);
    }
  }

  bootstrap();
})();
