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

  function restructureAboutSection() {
    const journeyStory = document.querySelector(".journey-story");
    const combinedCard = document.querySelector(".proof-card-combined");
    const combinedParts = combinedCard?.querySelectorAll(".proof-combined-part");

    if (!journeyStory || !combinedCard || !combinedParts || combinedParts.length < 2) return;

    const startPart = combinedParts[0];
    const practicalPart = combinedParts[1];
    const startTitle = startPart.querySelector(".proof-title-orange");
    const startCopy = startPart.querySelector("p");

    const arStart = "بدأت رحلتي في الـBug Bounty سنة 2022 ومن وقتها بهانت بشكل فعلي على Targets حقيقية وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة.";
    const enStart = "I started my Bug Bounty journey in 2022 and have since hunted on real targets and submitted security reports at different severity levels across public and private Bug Bounty programs.";

    if (startTitle) startTitle.textContent = "STARTED IN 2022";

    if (startCopy) {
      startCopy.dataset.ar = arStart;
      startCopy.dataset.en = enStart;
      startCopy.textContent = document.documentElement.lang === "en" ? enStart : arStart;
    }

    practicalPart.remove();

    journeyStory.classList.remove("reveal");
    startPart.appendChild(journeyStory);
  }

  async function bootstrap() {
    try {
      localStorage.setItem("rvuIntroSeenV5", "1");
    } catch (_) {}

    try {
      await loadScript("./application-submit.js");
      await loadScript("./app-core.js");
      restructureAboutSection();
    } catch (error) {
      console.error(error);
    }
  }

  bootstrap();
})();
