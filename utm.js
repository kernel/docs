/*
 * First-touch UTM passthrough to dashboard sign-up.
 *
 * Launch posts link straight to docs pages with UTM params, but sign-ups are
 * tracked on the dashboard, so the params are lost at the hop. Store them on
 * landing and append them to dashboard links on the way out. kernel/website
 * writes the same kernel_utm cookie, so the first touch on either site wins.
 * Mintlify loads every .js file in this directory on every docs page.
 *
 * This is attribution, so it follows the same rules as conceptual.js: nothing
 * runs under Do Not Track, and otherwise it needs marketing consent.
 */
(function () {
  var COOKIE_NAME = "kernel_utm";
  var COOKIE_DOMAIN = "kernel.sh";
  var MAX_AGE = 60 * 60 * 24 * 30;
  var DASHBOARD_HOST = "dashboard.onkernel.com";
  var CONSENT_CATEGORY = "marketing";
  var JURISDICTION_URL = "/api/c15t/show-consent-banner";
  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  function doNotTrackEnabled() {
    return (
      navigator.doNotTrack === "1" ||
      navigator.msDoNotTrack === "1" ||
      window.doNotTrack === "1"
    );
  }

  // true granted, false declined, null no decision recorded yet. c15t omits
  // declined categories from its record, so see conceptual.js for why a
  // record without the category means no.
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

  function readStored() {
    try {
      var match = document.cookie.match(
        new RegExp("(?:^|;\\s*)" + COOKIE_NAME + "=([^;]*)")
      );
      if (!match) return null;
      var parsed = JSON.parse(decodeURIComponent(match[1]));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  // Shared across www.kernel.sh and the docs. Off kernel.sh (local preview)
  // the browser would reject the domain, so fall back to a host-only cookie.
  function writeCookie(value, maxAge) {
    var host = location.hostname;
    var cookie =
      COOKIE_NAME +
      "=" +
      value +
      "; path=/; max-age=" +
      maxAge +
      "; SameSite=Lax";
    if (host === COOKIE_DOMAIN || host.endsWith("." + COOKIE_DOMAIN)) {
      cookie += "; domain=." + COOKIE_DOMAIN;
    }
    if (location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  function landingParams() {
    var params = new URLSearchParams(location.search);
    var utm = null;
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        utm = utm || {};
        utm[key] = value;
      }
    });
    return utm;
  }

  // Delegated so it covers the navbar buttons and links rendered after
  // client-side navigation. Capture phase rewrites the href before the
  // browser follows it.
  function decorate(event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;

    var url;
    try {
      url = new URL(link.href, location.href);
    } catch (e) {
      return;
    }
    if (url.hostname !== DASHBOARD_HOST) return;

    // Consent can be withdrawn on the marketing site while a docs page stays
    // open, so re-read it rather than trusting the decision made at load.
    if (storedConsent() === false) {
      writeCookie("", 0);
      return;
    }

    var keys = Array.from(url.searchParams.keys());
    if (keys.some(function (key) { return key.indexOf("utm_") === 0; })) return;

    var utm = readStored();
    if (!utm) return;

    UTM_KEYS.forEach(function (key) {
      if (utm[key]) url.searchParams.set(key, utm[key]);
    });
    link.href = url.toString();
  }

  // First touch wins: a later campaign never replaces the stored one.
  function start(landing) {
    if (landing && !readStored()) {
      writeCookie(encodeURIComponent(JSON.stringify(landing)), MAX_AGE);
    }
    document.addEventListener("click", decorate, { capture: true });
    document.addEventListener("auxclick", decorate, { capture: true });
  }

  if (doNotTrackEnabled()) return;

  // Read before the consent check: the jurisdiction lookup can resolve after a
  // client-side navigation has dropped the query.
  var landing = landingParams();

  var stored = storedConsent();
  if (stored !== null) {
    if (stored) start(landing);
    return;
  }

  // No decision yet, the normal case for a visitor whose first page is a docs
  // page. Apply c15t's rule: it auto-grants outside regulated jurisdictions.
  fetch(JURISDICTION_URL, { credentials: "same-origin" })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      if (data && data.showConsentBanner === false) start(landing);
    })
    .catch(function () {});
})();
