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

  /* ---- Booking-intent tracking ------------------------------------------
     Any link carrying data-book (CourtReserve reservations, membership
     purchase, member log in) pings Switchboard on click, so the club's
     dashboard shows how many people the site actually pushed into booking.
     Fire-and-forget with keepalive — the navigation is never delayed. */
  var TRACK_BASE = "https://switchboard-os.vercel.app";
  var TRACK_SLUG = "cohasset-tennis-club";

  function trackSessionId() {
    try {
      var key = "sb_sid", id = sessionStorage.getItem(key);
      if (!id) {
        id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
           : String(Date.now()) + Math.random().toString(36).slice(2);
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (e) { return null; }
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[data-book]") : null;
    if (!a) return;
    var payload = { clientSlug: TRACK_SLUG, path: "/book-click/" + a.getAttribute("data-book"),
                    referrer: location.pathname, sessionId: trackSessionId() };
    try {
      var utm = JSON.parse(sessionStorage.getItem("ctc_utm") || "{}");
      for (var k in utm) payload[k] = utm[k];
      var lead = localStorage.getItem("sb_lead_" + TRACK_SLUG);
      if (lead) payload.leadId = lead;
    } catch (err) {}
    try {
      fetch(TRACK_BASE + "/api/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), keepalive: true,
      }).catch(function () {});
    } catch (err) {}
  }, true);

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
