/*
 * Show the parent group in the page eyebrow when the eyebrow repeats the title.
 *
 * Mintlify shows the sidebar group name above every page title. On a section's
 * overview page the title is the section name, so the eyebrow would repeat it.
 * On those pages, show the next group up from the sidebar instead ("Configure"
 * above "Proxies", "How it works" above "Configure"). The name goes in a
 * data attribute that style.css renders, so React keeps owning the text node.
 * If there is no parent group to show, hide the eyebrow.
 * Mintlify loads every .js file in this directory on every docs page and
 * navigates client-side, so re-check whenever the header changes.
 */
(function () {
  function parentGroup() {
    var item = document.querySelector(
      '#navigation-items li[data-active-nav-item="true"]'
    );
    if (!item) return null;
    var groups = [];
    for (var el = item.parentElement; el; el = el.parentElement) {
      if (el.matches("li[data-group-tag]")) groups.push(el);
    }
    // groups[0] is the page's own group, the one the eyebrow names.
    if (groups.length > 1) return groups[1].getAttribute("data-title");
    if (!groups.length) return null;
    var section = groups[0].parentElement.previousElementSibling;
    var heading =
      section &&
      section.classList.contains("sidebar-group-header") &&
      section.querySelector(".sidebar-title");
    return heading ? heading.textContent.trim() : null;
  }

  function sync() {
    var header = document.getElementById("header");
    if (!header) return;
    var eyebrow = header.querySelector(".eyebrow");
    var title = document.getElementById("page-title");
    if (!eyebrow || !title) return;
    var same =
      eyebrow.textContent.trim().toLowerCase() ===
      title.textContent.trim().toLowerCase();
    var parent = same ? parentGroup() : null;
    if (parent) {
      eyebrow.setAttribute("data-parent-group", parent);
    } else {
      eyebrow.removeAttribute("data-parent-group");
    }
    eyebrow.style.display = same && !parent ? "none" : "";
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
