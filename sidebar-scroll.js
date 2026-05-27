(function () {
  if (typeof window === "undefined") return;

  // Mintlify's markup is not a stable contract; take the first scrollable match.
  function findSidebar() {
    var candidates = document.querySelectorAll(
      "aside, nav[aria-label='Sidebar'], aside[aria-label='Sidebar'], #sidebar"
    );
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].scrollHeight > candidates[i].clientHeight + 1) {
        return candidates[i];
      }
    }
    return null;
  }

  function showActive() {
    var sb = findSidebar();
    if (!sb) return;
    var link = sb.querySelector(
      "a[aria-current='page'], a[aria-current='true'], a[data-active='true']"
    );
    // Guard against acting on the previous page's link before the DOM updates.
    if (!link || link.pathname !== location.pathname) return;

    var sbRect = sb.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    var margin = 24;

    if (linkRect.top < sbRect.top + margin) {
      sb.scrollTop -= sbRect.top + margin - linkRect.top;
    } else if (linkRect.bottom > sbRect.bottom - margin) {
      sb.scrollTop += linkRect.bottom - (sbRect.bottom - margin);
    }
  }

  // Mintlify has no navigation event, but it rewrites data-current-path on
  // <html> on every client-side route change. That mutation is our signal.
  var html = document.documentElement;
  var last = html.getAttribute("data-current-path");
  new MutationObserver(function () {
    var cur = html.getAttribute("data-current-path");
    if (cur === last) return;
    last = cur;
    requestAnimationFrame(showActive);
  }).observe(html, { attributes: true, attributeFilter: ["data-current-path"] });

  if (document.readyState === "complete") showActive();
  else window.addEventListener("load", showActive);
})();
