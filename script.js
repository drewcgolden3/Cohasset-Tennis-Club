/* ==========================================================================
   COHASSET TENNIS CLUB — shared behavior
   Nav state · mobile menu · Lenis smooth scroll · staggered scroll-reveal
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Nav: solidify on scroll ------------------------------------------ */
  var nav = document.getElementById("navbar");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ------------------------------------------------------- */
  var burger = document.getElementById("hamburger");
  var menu = document.getElementById("mobileMenu");
  function toggleMenu(open) {
    if (!burger || !menu) return;
    var isOpen = open === undefined ? !menu.classList.contains("open") : open;
    menu.classList.toggle("open", isOpen);
    burger.classList.toggle("open", isOpen);
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { toggleMenu(); });
  window.closeMobile = function () { toggleMenu(false); };

  /* ---- Footer year ------------------------------------------------------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Scroll reveal (staggered) ---------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    // Assign stagger delay to children of [data-reveal-stagger]
    document.querySelectorAll("[data-reveal-stagger]").forEach(function (parent) {
      var kids = parent.querySelectorAll("[data-reveal]");
      Array.prototype.forEach.call(kids, function (kid, i) {
        kid.style.transitionDelay = (i * 90) + "ms";
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
