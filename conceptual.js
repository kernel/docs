/*
 * Conceptual Analytics pixel.
 *
 * Mintlify loads every .js file in this directory on every docs page. The docs
 * are served under www.kernel.sh/docs via a rewrite from the marketing site, so
 * the c15t consent cookie the marketing site sets is readable here and the two
 * halves of the origin share one consent decision.
 */
(function () {
  var CONSENT_CATEGORY = "marketing";
  var PIXEL_KEY =
    "acfc03eea265bec68ec3dfb5bc9f1bf6cda7644ceed3260980286b6f0b4098a3";
  var LOADER_SRC =
    "https://plfalg.kernel.sh/analytics/loader-v1.js?key=" +
    encodeURIComponent(PIXEL_KEY) +
    "&v=1.1.0";

  function hasConsent() {
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
        return !!(parsed && parsed.consents && parsed.consents[CONSENT_CATEGORY]);
      }
    } catch (e) {}

    return false;
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

  if (!hasConsent()) return;

  load();
  trackNavigations();
})();
