/*
 * Conceptual Analytics pixel.
 *
 * Mintlify loads every .js file in this directory on every docs page. The docs
 * are served under www.kernel.sh/docs via a rewrite from the marketing site, so
 * both the c15t consent cookie and the c15t API are same-origin here and the
 * two halves of the site can share one consent decision.
 */
(function () {
  var CONSENT_CATEGORY = "marketing";
  var PIXEL_KEY =
    "acfc03eea265bec68ec3dfb5bc9f1bf6cda7644ceed3260980286b6f0b4098a3";
  var LOADER_SRC =
    "https://plfalg.kernel.sh/analytics/loader-v1.js?key=" +
    encodeURIComponent(PIXEL_KEY) +
    "&v=1.1.0";
  var JURISDICTION_URL = "/api/c15t/show-consent-banner";

  // true granted, false declined, null no decision recorded yet.
  function storedConsent() {
    try {
      var cookie = document.cookie.match(/(?:^|;\s*)c15t=([^;]*)/);
      if (cookie && cookie[1]) {
        if (cookie[1].indexOf("c." + CONSENT_CATEGORY + ":1") !== -1) return true;
        if (cookie[1].indexOf("c." + CONSENT_CATEGORY + ":0") !== -1) return false;
      }
    } catch (e) {}

    try {
      var raw = localStorage.getItem("c15t");
      if (raw) {
        var parsed = JSON.parse(raw);
        var consents = parsed && parsed.consents;
        if (consents && typeof consents[CONSENT_CATEGORY] === "boolean") {
          return consents[CONSENT_CATEGORY];
        }
      }
    } catch (e) {}

    return null;
  }

  function load() {
    if (window.ca) return;

    // measure-v1.js reads __CA_CONFIG once at init, so it has to be set before
    // the loader injects it. Both flags are off in the shipped pixel config.
    window.__CA_CONFIG = window.__CA_CONFIG || {};
    window.__CA_CONFIG.respectDNT = true;
    window.__CA_CONFIG.anonymizeIP = true;

    window.ca = function () {
      (window.ca.q = window.ca.q || []).push(arguments);
    };

    var script = document.createElement("script");
    script.async = true;
    script.src = LOADER_SRC;
    document.head.appendChild(script);
  }

  // The pixel sends one page_view on init and has no router hooks, so docs
  // navigation between pages is invisible unless we send it ourselves.
  function trackNavigations() {
    var lastPath = location.pathname + location.search;

    function onNavigate() {
      var path = location.pathname + location.search;
      if (path === lastPath) return;
      lastPath = path;
      if (window.ca) window.ca("track", "page_view");
    }

    ["pushState", "replaceState"].forEach(function (method) {
      var original = history[method];
      history[method] = function () {
        var result = original.apply(this, arguments);
        onNavigate();
        return result;
      };
    });

    window.addEventListener("popstate", onNavigate);
  }

  function start() {
    load();
    trackNavigations();
  }

  var stored = storedConsent();
  if (stored !== null) {
    if (stored) start();
    return;
  }

  // Nobody has decided yet, which is the normal case for a visitor whose first
  // page is a docs page — the consent banner lives in the marketing site's app
  // and never renders here. Apply the same rule c15t applies there: it only
  // prompts in regulated jurisdictions and auto-grants everywhere else. Any
  // failure leaves the pixel unloaded.
  fetch(JURISDICTION_URL, { credentials: "same-origin" })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      if (data && data.showConsentBanner === false) start();
    })
    .catch(function () {});
})();
