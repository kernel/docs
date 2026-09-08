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
  var HANDOFF_PARAM = "ca_device_id";
  var HANDOFF_DOMAIN = "onkernel.com";

  // true granted, false declined, null no decision recorded yet.
  //
  // c15t omits false values from its cookie rather than writing them, so a
  // decline is the absence of the key. Any stored consent record therefore
  // means a decision was made, and a missing category in one means no.
  function storedConsent() {
    try {
      var cookie = document.cookie.match(/(?:^|;\s*)c15t=([^;]*)/);
      if (cookie && cookie[1]) {
        return cookie[1].indexOf("c." + CONSENT_CATEGORY + ":1") !== -1;
      }
    } catch (e) {}

    try {
      var raw = localStorage.getItem("c15t");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.consents) {
          return parsed.consents[CONSENT_CATEGORY] === true;
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

  // The device ID is stored per-domain, and the docs link to dashboard sign-up
  // in several places, so without this the ad click that led to a signup is
  // never credited. Hand ours over on the way out; the dashboard reads it back.
  function handOffDeviceIdOnNavigation() {
    document.addEventListener(
      "click",
      function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (!link || typeof window.ca.getDeviceId !== "function") return;

        var url = new URL(link.href, window.location.href);
        if (
          url.hostname !== HANDOFF_DOMAIN &&
          !url.hostname.endsWith("." + HANDOFF_DOMAIN)
        ) {
          return;
        }

        url.searchParams.set(HANDOFF_PARAM, window.ca.getDeviceId());
        link.href = url.toString();
      },
      { capture: true }
    );
  }

  function start() {
    load();
    trackNavigations();
    handOffDeviceIdOnNavigation();
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
