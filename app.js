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

  function injectAboutFixStyles() {
    if (document.getElementById("about-layout-fix")) return;

    const style = document.createElement("style");
    style.id = "about-layout-fix";
    style.textContent = `
      #about .profile-body {
        gap: 20px;
      }

      #about .hunt-proof-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: stretch;
        gap: 18px;
      }

      #about .hunt-proof-grid .proof-card-combined,
      #about .hunt-proof-grid .proof-card-wide {
        grid-column: span 1;
        min-width: 0;
        height: 100%;
      }

      #about .proof-card-combined {
        display: flex;
        flex-direction: column;
      }

      #about .proof-card-combined .proof-combined-part {
        padding: 0;
        border: 0;
      }

      #about .journey-story.journey-story-embedded {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 106, 0, 0.22);
      }

      #about .journey-story.journey-story-embedded .journey-kicker {
        display: block;
        margin-bottom: 7px;
        font-size: 0.78rem;
      }

      #about .journey-story.journey-story-embedded h3 {
        margin: 0 0 9px;
        font-size: clamp(1.05rem, 1.7vw, 1.28rem);
        line-height: 1.45;
      }

      #about .journey-story.journey-story-embedded p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.75;
      }

      #about .proof-card-wide {
        display: flex;
        flex-direction: column;
      }

      #about .offline-camp-lines {
        margin-top: 14px;
        display: grid;
        gap: 9px;
      }

      #about .offline-camp-line {
        width: 100%;
      }

      @media (max-width: 900px) {
        #about .hunt-proof-grid {
          grid-template-columns: 1fr;
        }

        #about .hunt-proof-grid .proof-card-combined,
        #about .hunt-proof-grid .proof-card-wide {
          grid-column: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function restructureAboutSection() {
    const journeyStory = document.querySelector("#about .journey-story");
    const grid = document.querySelector("#about .hunt-proof-grid");
    const combinedCard = grid?.querySelector(".proof-card-combined");
    const offlineCard = grid?.querySelector(".proof-card-wide");
    const combinedParts = combinedCard?.querySelectorAll(":scope > .proof-combined-part");

    if (!journeyStory || !grid || !combinedCard || !offlineCard || !combinedParts || combinedParts.length < 2) return;

    const startPart = combinedParts[0];
    const practicalPart = combinedParts[1];
    const startTitle = startPart.querySelector(".proof-title-orange");
    const startCopy = startPart.querySelector("p");

    const arStart = "بدأت رحلتي في الـBug Bounty سنة 2022 ومن وقتها بدأت أشتغل بشكل فعلي على Targets حقيقية وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة.";
    const enStart = "I started my Bug Bounty journey in 2022. Since then, I have actively worked on real targets and submitted security reports at different severity levels across public and private Bug Bounty programs.";

    if (startTitle) startTitle.textContent = "STARTED IN 2022";

    if (startCopy) {
      startCopy.dataset.ar = arStart;
      startCopy.dataset.en = enStart;
      startCopy.textContent = document.documentElement.lang === "en" ? enStart : arStart;
    }

    practicalPart.remove();

    journeyStory.classList.remove("reveal");
    journeyStory.classList.add("journey-story-embedded");
    combinedCard.appendChild(journeyStory);

    combinedCard.classList.remove("proof-card-combined");
    combinedCard.classList.add("proof-card-started");

    offlineCard.classList.remove("proof-card-wide");
    offlineCard.classList.add("proof-card-camps");

    injectAboutFixStyles();

    const fixedStyle = document.getElementById("about-layout-fix");
    if (fixedStyle) {
      fixedStyle.textContent = fixedStyle.textContent
        .replaceAll(".proof-card-combined", ".proof-card-started")
        .replaceAll(".proof-card-wide", ".proof-card-camps");
    }
  }

  function skipIntroImmediately() {
    const skip = document.getElementById("skipIntro");
    if (skip) skip.click();
  }

  async function bootstrap() {
    try {
      localStorage.setItem("rvuIntroSeenV5", "1");
    } catch (_) {}

    try {
      await loadScript("./application-submit.js");
      await loadScript("./app-core.js");
      skipIntroImmediately();
      await loadScript("./campaign-fixes.js");
      restructureAboutSection();
    } catch (error) {
      console.error(error);
    }
  }

  bootstrap();
})();
