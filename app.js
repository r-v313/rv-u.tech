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

  async function bootstrap() {
    try {
      localStorage.setItem("rvuIntroSeenV5", "1");
    } catch (_) {}

    try {
      await loadScript("./application-submit.js");
      await loadScript("./app-core.js");
    } catch (error) {
      console.error(error);
    }
  }

  bootstrap();
})();
