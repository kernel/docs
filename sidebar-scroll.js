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

  function findActiveLink(sb) {
    return sb.querySelector(
      "a[aria-current='page'], a[aria-current='true'], a[data-active='true']"
    );
  }

  function showActive() {
    var sb = findSidebar();
    if (!sb) return false;
    var link = findActiveLink(sb);
    if (!link) return false;

    var sbRect = sb.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    var margin = 24;

    if (linkRect.top < sbRect.top + margin) {
      sb.scrollTop -= sbRect.top + margin - linkRect.top;
    } else if (linkRect.bottom > sbRect.bottom - margin) {
      sb.scrollTop += linkRect.bottom - (sbRect.bottom - margin);
    }
    return true;
  }

  // Sidebar may not be mounted yet after a route change; retry until it is,
  // then re-apply once to survive a late re-render that resets scroll.
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
