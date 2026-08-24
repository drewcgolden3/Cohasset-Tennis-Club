/* =============================================================================
   COHASSET TENNIS CLUB — tier-aware join form
   Each membership tier has its own CourtReserve registration widget, restricted
   to that one membership. Clicking "Join as Family" loads ?tier=family, and
   this swaps the embedded form to the Family-only widget so the visitor can't
   land on the wrong tier. No tier in the URL keeps the default all-tiers form.

   The tier lives in the URL, so the choice survives a reload and the link is
   shareable — "join as a family" is a page you can send someone.
   ============================================================================= */
(function () {
  "use strict";

  var WIDGETS = {
    junior:     { id: "105151", label: "Junior" },
    individual: { id: "105152", label: "Individual" },
    couples:    { id: "105153", label: "Couples" },
    family:     { id: "105154", label: "Family" },
    trial:      { id: "105155", label: "Junior Trial" }
  };
  var DEFAULT_ID = "105147";
  var BASE = "https://widgets.courtreserve.com/Online/Public/EmbedCode/16801/";

  var frame = document.getElementById("cr-join-widget");
  if (!frame) return;

  var tier;
  try { tier = new URLSearchParams(location.search).get("tier"); } catch (e) { tier = null; }

  var chosen = tier && Object.prototype.hasOwnProperty.call(WIDGETS, tier)
    ? WIDGETS[tier] : null;
  var id = chosen ? chosen.id : DEFAULT_ID;

  /* Point the frame at the right widget. The class carries the embed id
     because cr-widget.js sizes frames by "form-iframe-<embedCodeId>". */
  frame.src = BASE + id;
  frame.className = "cr-widget form-iframe-" + id;

  /* Say which tier is being joined, with a way back to the full list. */
  var note = document.getElementById("cr-join-chosen");
  if (note) {
    if (chosen) {
      note.innerHTML = 'You’re joining as <strong>' + chosen.label + '</strong>. ' +
        '<a href="membership.html#tiers" class="inline-link">Choose a different membership</a>';
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }
})();
