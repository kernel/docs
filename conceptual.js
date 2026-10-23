/*
 * Conceptual Analytics pixel.
 *
 * Mintlify loads every .js file in this directory on every docs page. The docs
 * are served under www.kernel.sh/docs via a rewrite from the marketing site, so
 * both the c15t consent cookie and the c15t API are same-origin here and the
 * two halves of the site can share one consent decision.
 *
 * It also carries the first-touch campaign to dashboard sign-up. Launch posts
 * link straight to docs pages with UTM params, but sign-ups are tracked on the
 * dashboard, so the params are lost at the hop. That's attribution too, so it
 * runs under the same Do Not Track and consent rules as the pixel.
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
  // Calendly's opaque passthrough. A booking happens on their domain, so
  // ca_device_id would never reach us; salesforce_uuid surfaces in the
  // invitee.created webhook instead. The UTM slots carry real campaign data.
  var CALENDLY_DOMAIN = "calendly.com";
  var CALENDLY_PARAM = "salesforce_uuid";
  // kernel/website (src/lib/utm.ts) reads and writes the same cookie, so the
  // name and format are shared: the UTM params as a query string. First touch
  // on either site wins.
  var UTM_COOKIE = "kernel_utm";
  var UTM_COOKIE_DOMAIN = "kernel.sh";
  var UTM_MAX_AGE = 30 * 24 * 60 * 60;
  var UTM_HOST = "dashboard.onkernel.com";
  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];
  // Marks links we added the campaign to, so a withdrawal strips only ours
  // and hand-tagged links keep theirs.
  var UTM_DECORATED_ATTR = "data-utm-passthrough";

  // Honouring Do Not Track has to cover the whole integration, not just the
  // vendor's events. respectDNT stops the pixel sending, but it doesn't stop
  // getDeviceId() minting an identifier or the handoff carrying it to another
  // domain, so nothing loads at all when the header is set.
  function doNotTrackEnabled() {
    return (
      navigator.doNotTrack === "1" ||
      navigator.msDoNotTrack === "1" ||
      window.doNotTrack === "1"
    );
  }

  function handoffParamFor(url) {
    if (
      url.hostname === HANDOFF_DOMAIN ||
      url.hostname.endsWith("." + HANDOFF_DOMAIN)
    ) {
      return HANDOFF_PARAM;
    }
    if (
      url.hostname === CALENDLY_DOMAIN ||
      url.hostname.endsWith("." + CALENDLY_DOMAIN)
    ) {
      return CALENDLY_PARAM;
    }
    return null;
  }

  // Parses both the landing URL and the stored cookie, so the two can't
  // disagree about what counts as a campaign.
  function utmParamsFrom(search) {
    var query = new URLSearchParams(search);
    var params = new URLSearchParams();
    UTM_KEYS.forEach(function (key) {
      var value = (query.get(key) || "").trim();
      if (value) params.set(key, value);
    });
    return params.toString() ? params : null;
  }

  function storedUtm() {
    var cookie = document.cookie.match(/(?:^|;\s*)kernel_utm=([^;]*)/);
    return cookie ? utmParamsFrom(cookie[1]) : null;
  }

  // Shared across kernel.sh subdomains. Anywhere else (local preview) the
  // browser rejects a .kernel.sh cookie, so it stays host-only there.
  function writeUtmCookie(value, maxAge) {
    var host = window.location.hostname;
    var cookie =
      UTM_COOKIE +
      "=" +
      value +
      "; Path=/; Max-Age=" +
      maxAge +
      "; SameSite=Lax";
    if (host === UTM_COOKIE_DOMAIN || host.endsWith("." + UTM_COOKIE_DOMAIN)) {
      cookie += "; Domain=." + UTM_COOKIE_DOMAIN;
    }
    if (window.location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  // First touch wins: a later campaign never replaces the stored one.
  function storeFirstTouch(landing) {
    if (landing && !storedUtm()) {
      writeUtmCookie(landing.toString(), UTM_MAX_AGE);
    }
  }

  // Appends the stored campaign to a dashboard URL, unless the link was
  // tagged by hand. Returns whether it added anything.
  function addUtm(url) {
    if (url.hostname !== UTM_HOST) return false;

    var keys = Array.from(url.searchParams.keys());
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf("utm_") === 0) return false;
    }

    var utm = storedUtm();
    if (!utm) return false;

    utm.forEach(function (value, key) {
      url.searchParams.set(key, value);
    });
    return true;
  }

  // A click rewrites the anchor in place, so a decorated href outlives it. A
  // later decline stops new rewrites but leaves the identifier and campaign
  // sitting in the DOM, so they have to be taken back out.
  function undecorateLinks() {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      try {
        var url = new URL(links[i].href, window.location.href);
        var before = url.toString();

        // delete() reserializes the whole query even when the key is absent.
        var param = handoffParamFor(url);
        if (param && url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }

        if (links[i].hasAttribute(UTM_DECORATED_ATTR)) {
          links[i].removeAttribute(UTM_DECORATED_ATTR);
          UTM_KEYS.forEach(function (key) {
            url.searchParams.delete(key);
          });
        }

        if (url.toString() !== before) links[i].href = url.toString();
      } catch (e) {}
    }
  }

  // Declined or withdrawn: drop the stored campaign along with anything
  // already written into links.
  function withdraw() {
    writeUtmCookie("", 0);
    undecorateLinks();
  }

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
    //
    // trackPageViews and trackUnload are what let the consent re-check below
    // mean anything. Left on, the vendor emits a page view at init and installs
    // scroll, click and form-submit listeners, all routed through its own
    // internal track() rather than through ours — none of which we can gate.
    // Off, the script emits nothing on its own and every event is one we sent.
    //
    // respectDNT takes effect: the pixel checks it before every event.
    // anonymizeIP currently does not — the shipped script defines it and never
    // reads it, and resolves the visitor's full address from the vendor's IP
    // endpoint to send as client_ip regardless. It's set here so it applies if
    // the vendor implements it; until then full-IP processing is what happens.
    window.__CA_CONFIG = window.__CA_CONFIG || {};
    window.__CA_CONFIG.respectDNT = true;
    window.__CA_CONFIG.anonymizeIP = true;
    window.__CA_CONFIG.trackPageViews = false;
    window.__CA_CONFIG.trackUnload = false;

    window.ca = function () {
      (window.ca.q = window.ca.q || []).push(arguments);
    };

    var script = document.createElement("script");
    script.async = true;
    script.src = LOADER_SRC;
    document.head.appendChild(script);

    // The vendor's own page view is off, so the landing one is ours to send.
    window.ca("track", "page_view");
  }

  // The pixel sends one page_view on init and has no router hooks, so docs
  // navigation between pages is invisible unless we send it ourselves.
  function trackNavigations() {
    var lastPath = location.pathname + location.search;

    function onNavigate() {
      var path = location.pathname + location.search;
      if (path === lastPath) return;
      lastPath = path;

      // Consent can be withdrawn on the marketing site while a docs page stays
      // open. There's no consent UI here to react to, so every navigation
      // re-reads the decision rather than trusting the one made at page load.
      if (storedConsent() === false) {
        withdraw();
        return;
      }

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
  // never credited. Hand ours over on the way out, with the campaign that
  // brought the visitor in; the dashboard reads both back.
  function handOffOnNavigation() {
    function decorate(event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      if (storedConsent() === false) {
        withdraw();
        return;
      }

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (e) {
        return;
      }
      var before = url.toString();

      var param = handoffParamFor(url);
      if (param && typeof window.ca.getDeviceId === "function") {
        url.searchParams.set(param, window.ca.getDeviceId());
      }
      if (addUtm(url)) link.setAttribute(UTM_DECORATED_ATTR, "");

      if (url.toString() !== before) link.href = url.toString();
    }

    // auxclick covers a middle-click opening sign-up in a new tab.
    document.addEventListener("click", decorate, { capture: true });
    document.addEventListener("auxclick", decorate, { capture: true });
  }

  function start() {
    storeFirstTouch(landingUtm);
    load();
    trackNavigations();
    handOffOnNavigation();
  }

  // Nothing loads under Do Not Track, and a campaign stored before it was
  // turned on is dropped.
  if (doNotTrackEnabled()) {
    writeUtmCookie("", 0);
    return;
  }

  // Read before the consent check: the jurisdiction lookup below can resolve
  // after a client-side navigation has dropped the query.
  var landingUtm = utmParamsFrom(window.location.search);

  var stored = storedConsent();
  if (stored !== null) {
    if (stored) start();
    else writeUtmCookie("", 0);
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
