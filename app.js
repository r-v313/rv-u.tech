"use strict";
// A cached pre-update page must reload its matching HTML and script bundle.
(function () {
  if (document.getElementById("appPhone")) return;
  const url = new URL(location.href);
  if (url.searchParams.get("rvu_release") === "20260913") return;
  url.searchParams.set("rvu_release", "20260913");
  location.replace(url.href);
})();
