(function () {
  if (typeof window === "undefined") return;

  // Mintlify's DOM is not a stable contract, so selection is defensive:
  // pick the first sidebar-ish element that is actually scrollable.
  function findSidebar() {
    var candidates = document.querySelectorAll(
      "aside, nav[aria-label='Sidebar'], aside[aria-label='Sidebar'], #sidebar"
    );
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.scrollHeight > el.clientHeight + 1) return el;
    }
    return null;
  }

  function findActiveLink(sb) {
    return sb.querySelector(
      "a[aria-current='page'], a[aria-current='true'], a[data-active='true']"
    );
  }

  // Scroll the sidebar the minimum amount needed to bring the current page's
  // link into view. No-op if it's already visible. Anchored to the active
  // item (semantic) rather than a remembered pixel offset, so it stays correct
  // even when the sidebar's contents differ between pages.
  function showActive() {
    var sb = findSidebar();
    if (!sb) return false;
    var link = findActiveLink(sb);
    if (!link) return false;

    var sbRect = sb.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    var margin = 24; // breathing room so the item isn't flush against an edge

    if (linkRect.top < sbRect.top + margin) {
      sb.scrollTop -= sbRect.top + margin - linkRect.top;
    } else if (linkRect.bottom > sbRect.bottom - margin) {
      sb.scrollTop += linkRect.bottom - (sbRect.bottom - margin);
    }
    return true;
  }

  // After a route change the sidebar may not exist yet; poll until it does.
  // On success, re-apply once more to survive a late re-render that resets it.
  function pollShow() {
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (showActive()) {
        clearInterval(iv);
        setTimeout(showActive, 150);
      } else if (attempts > 30) {
        clearInterval(iv);
      }
    }, 50);
  }

  var origPush = history.pushState;
  history.pushState = function () {
    var r = origPush.apply(this, arguments);
    pollShow();
    return r;
  };
  var origReplace = history.replaceState;
  history.replaceState = function () {
    var r = origReplace.apply(this, arguments);
    pollShow();
    return r;
  };
  window.addEventListener("popstate", pollShow);

  if (document.readyState === "complete") {
    pollShow();
  } else {
    window.addEventListener("load", pollShow);
  }
})();
