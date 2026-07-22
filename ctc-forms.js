/* ==========================================================================
   COHASSET TENNIS CLUB — native form → Google Forms bridge
   Posts the on-brand form straight to the club's real Google Form
   (formResponse endpoint + entry IDs), with client-side validation
   and an in-page success state. No page navigation, no backend.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("form[data-gform]");
  if (!form) return;

  var statusEl = document.getElementById("formStatus");
  var submitBtn = form.querySelector('button[type="submit"]');
  var errorSummary = document.getElementById("formErrorSummary");

  function groupInvalid(group) {
    var type = group.getAttribute("data-required");
    if (type === "text" || type === "select") {
      var f = group.querySelector("input, select, textarea");
      return !f || f.value.trim() === "";
    }
    // radio / checkbox group
    var checked = group.querySelectorAll("input:checked");
    return checked.length === 0;
  }

  function setError(group, on) {
    var err = group.querySelector(".form-error");
    if (err) err.classList.toggle("show", on);
    group.classList.toggle("has-error", on);
  }

  function validate() {
    var groups = form.querySelectorAll(".fgroup[data-required]");
    var firstBad = null;
    groups.forEach(function (g) {
      var bad = groupInvalid(g);
      setError(g, bad);
      if (bad && !firstBad) firstBad = g;
    });
    if (errorSummary) errorSummary.classList.toggle("show", !!firstBad);
    if (firstBad) {
      var focusable = firstBad.querySelector("input, select, textarea");
      var y = firstBad.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (focusable) { try { focusable.focus({ preventScroll: true }); } catch (e) {} }
    }
    return !firstBad;
  }

  // Clear a group's error as soon as the user fixes it
  form.addEventListener("input", function (e) {
    var g = e.target.closest(".fgroup[data-required]");
    if (g && g.classList.contains("has-error") && !groupInvalid(g)) setError(g, false);
  });
  form.addEventListener("change", function (e) {
    var g = e.target.closest(".fgroup[data-required]");
    if (g && g.classList.contains("has-error") && !groupInvalid(g)) setError(g, false);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
    }

    var body = new URLSearchParams();
    new FormData(form).forEach(function (value, key) {
      if (String(value).trim() !== "") body.append(key, value);
    });

    var done = false;
    function finish() {
      if (done) return; done = true;
      if (statusEl) {
        form.style.display = "none";
        statusEl.classList.add("show");
        window.scrollTo({ top: statusEl.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
      }
    }

    // Fire-and-forget POST to Google Forms. no-cors -> opaque response,
    // but the submission is recorded. We resolve the UI either way.
    fetch(form.action, { method: "POST", mode: "no-cors", body: body })
      .then(finish)
      .catch(finish);
    // Safety net in case the network promise stalls.
    setTimeout(finish, 2500);
  });
})();
