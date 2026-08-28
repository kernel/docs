(function () {
  if (typeof window === "undefined") return;

  var KEY = "kernel-docs-sidebar-scroll";

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

  function save() {
    var sb = findSidebar();
    if (sb) {
      try { sessionStorage.setItem(KEY, String(sb.scrollTop)); } catch (e) {}
    }
  }

  function restore() {
    var sb = findSidebar();
    if (!sb) return false;
    var raw;
    try { raw = sessionStorage.getItem(KEY); } catch (e) { return false; }
    if (raw === null) return false;
    var top = parseInt(raw, 10);
    if (isNaN(top)) return false;
    if (Math.abs(sb.scrollTop - top) > 1) sb.scrollTop = top;
    return true;
  }

  var saveTimer;
  document.addEventListener(
    "scroll",
    function (e) {
      var sb = findSidebar();
      if (!sb) return;
      var t = e.target;
      if (t === sb || (t.contains && t.contains(sb)) || sb.contains(t)) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 80);
      }
    },
    true
  );

  document.addEventListener(
    "click",
    function (e) {
      if (e.target && e.target.closest && e.target.closest("a")) save();
    },
    true
  );

  function pollRestore() {
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (restore() || attempts > 30) clearInterval(iv);
    }, 50);
  }

  var origPush = history.pushState;
  history.pushState = function () {
    var r = origPush.apply(this, arguments);
    pollRestore();
    return r;
  };
  var origReplace = history.replaceState;
  history.replaceState = function () {
    var r = origReplace.apply(this, arguments);
    pollRestore();
    return r;
  };
  window.addEventListener("popstate", pollRestore);

  if (document.readyState === "complete") {
    pollRestore();
  } else {
    window.addEventListener("load", pollRestore);
  }
})();
