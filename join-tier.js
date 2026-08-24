/* =============================================================================
   COHASSET TENNIS CLUB — tier-aware signup page (join.html)
   Each membership has its own CourtReserve registration widget, restricted to
   that one membership, so arriving from a tier card lands you on a form that
   can only sign you up for what you picked.

   CourtReserve's widget is a React app on another origin, so it can't be
   preselected from here — restricting the widget is the supported equivalent.

   The tier lives in the URL, so the choice survives a reload and the link is
   shareable: join.html?tier=family is "join as a family".
   ============================================================================= */
(function () {
  "use strict";

  var TIERS = {
    junior:     { id: "105151", label: "Junior",       price: "$560 / year",   heading: "Join as a Junior." },
    individual: { id: "105152", label: "Individual",   price: "$1,235 / year", heading: "Join as an Individual." },
    couples:    { id: "105153", label: "Couples",      price: "$1,350 / year", heading: "Join as a Couple." },
    family:     { id: "105154", label: "Family",       price: "$1,800 / year", heading: "Join as a Family." },
    trial:      { id: "105155", label: "Junior Trial", price: "$150 / year",   heading: "Start a junior trial." }
  };
  var ALL_TIERS_ID = "105147";
  var BASE = "https://widgets.courtreserve.com/Online/Public/EmbedCode/16801/";

  var frame = document.getElementById("cr-join-widget");
  if (!frame) return;

  var slug;
  try { slug = new URLSearchParams(location.search).get("tier"); } catch (e) { slug = null; }

  /* Only ever an allowlist key — never interpolated into the page. */
  var tier = slug && Object.prototype.hasOwnProperty.call(TIERS, slug) ? TIERS[slug] : null;
  var id = tier ? tier.id : ALL_TIERS_ID;

  /* Point the frame at the right widget. The class carries the embed id
     because cr-widget.js sizes frames by "form-iframe-<embedCodeId>". */
  frame.src = BASE + id;
  frame.className = "cr-widget form-iframe-" + id;

  var note = document.getElementById("cr-join-chosen");
  var heading = document.getElementById("join-heading");

  if (tier) {
    if (heading) heading.textContent = tier.heading;
    if (note) {
      note.innerHTML =
        '<strong>' + tier.label + '</strong> &middot; ' + tier.price +
        ' <a href="membership.html#tiers" class="inline-link">Change membership</a>';
      note.hidden = false;
    }
    document.title = tier.heading.replace(/\.$/, "") + " | Cohasset Tennis Club";
  } else if (note) {
    /* Arrived without picking — the form still offers every tier, but point
       people at the comparison in case they want to weigh them up first. */
    note.innerHTML =
      'Choose your membership in the form below, or ' +
      '<a href="membership.html#tiers" class="inline-link">compare the tiers first</a>.';
    note.hidden = false;
  }
})();
