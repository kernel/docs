/*
 * Hide the page eyebrow when it repeats the page title.
 *
 * Mintlify shows the sidebar group name above every page title. On a section's
 * overview page the title is the section name, so the eyebrow would repeat it.
 * Mintlify loads every .js file in this directory on every docs page and
 * navigates client-side, so re-check whenever the header changes.
 */
(function () {
  function sync() {
    var header = document.getElementById("header");
    if (!header) return;
    var eyebrow = header.querySelector(".eyebrow");
    var title = document.getElementById("page-title");
    if (!eyebrow || !title) return;
    var same =
      eyebrow.textContent.trim().toLowerCase() ===
      title.textContent.trim().toLowerCase();
    eyebrow.style.display = same ? "none" : "";
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
