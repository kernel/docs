/*
 * First-touch UTM passthrough to dashboard sign-up.
 *
 * Launch posts link straight to docs pages with UTM params, but sign-ups are
 * tracked on the dashboard, so the params are lost at the hop. Store them on
 * landing and append them to dashboard links on the way out. kernel/website
 * writes the same kernel_utm cookie, so the first touch on either site wins.
 * Mintlify loads every .js file in this directory on every docs page.
 */
(function () {
  var COOKIE_NAME = "kernel_utm";
  var COOKIE_DOMAIN = "kernel.sh";
  var MAX_AGE = 60 * 60 * 24 * 30;
  var DASHBOARD_HOST = "dashboard.onkernel.com";
  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

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
  function cookieAttributes() {
    var host = location.hostname;
    var attrs = "; path=/; max-age=" + MAX_AGE + "; SameSite=Lax";
    if (host === COOKIE_DOMAIN || host.endsWith("." + COOKIE_DOMAIN)) {
      attrs += "; domain=." + COOKIE_DOMAIN;
    }
    if (location.protocol === "https:") attrs += "; Secure";
    return attrs;
  }

  function captureFirstTouch() {
    if (readStored()) return;

    var params = new URLSearchParams(location.search);
    var utm = {};
    var found = false;
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        utm[key] = value;
        found = true;
      }
    });
    if (!found) return;

    document.cookie =
      COOKIE_NAME +
      "=" +
      encodeURIComponent(JSON.stringify(utm)) +
      cookieAttributes();
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

    var keys = Array.from(url.searchParams.keys());
    if (keys.some(function (key) { return key.indexOf("utm_") === 0; })) return;

    var utm = readStored();
    if (!utm) return;

    UTM_KEYS.forEach(function (key) {
      if (utm[key]) url.searchParams.set(key, utm[key]);
    });
    link.href = url.toString();
  }

  captureFirstTouch();
  document.addEventListener("click", decorate, { capture: true });
  document.addEventListener("auxclick", decorate, { capture: true });
})();
