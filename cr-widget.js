/* =============================================================================
   COHASSET TENNIS CLUB — CourtReserve widget auto-height
   Official widgets (widgets.courtreserve.com) post their rendered height back
   to the host page so the iframe can grow instead of scrolling internally.

   This is a hardened rewrite of CourtReserve's own snippet, which accepts a
   setHeight message from ANY origin and applies whatever number arrives —
   including the bogus `height: 12` their widget emits before the real value,
   which collapses the frame to a sliver. Here we check the sender and
   range-check the value first.

   Usage: give the iframe class "form-iframe-<embedCodeId>" and include this
   file. Any number of widgets can share one page.
   ============================================================================= */
(function () {
  "use strict";

  var WIDGET_ORIGIN = "https://widgets.courtreserve.com";
  var MIN_H = 200, MAX_H = 6000;

  window.addEventListener("message", function (e) {
    if (e.origin !== WIDGET_ORIGIN) return;

    var d = e.data;
    if (!d || d.action !== "setHeight") return;

    var h = parseInt(d.height, 10);
    if (!isFinite(h) || h < MIN_H || h > MAX_H) return;

    // The payload names its embed code, so the right frame grows even when
    // several widgets share a page.
    var targets = d.embedCodeId
      ? document.getElementsByClassName("form-iframe-" + d.embedCodeId)
      : document.getElementsByClassName("cr-widget");

    for (var i = 0; i < targets.length; i++) {
      targets[i].style.height = h + "px";
    }
  }, false);
})();
