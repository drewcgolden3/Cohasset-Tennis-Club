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

  /* Mirror the enquiry into Switchboard OS so it shows up in the club's
     Leads dashboard alongside chat leads. Fire-and-forget: Google Forms
     stays the system of record and the UI never waits on this. */
  function mirrorLead() {
    var isJunior = !!document.getElementById("jr-player");
    var val = function (id) {
      var el = document.getElementById(id);
      return el && el.value.trim() ? el.value.trim() : null;
    };
    var player = val(isJunior ? "jr-player" : "a-player");
    var parent = val(isJunior ? "jr-parent" : "a-parent");
    var body = {
      clientSlug: "cohasset-tennis-club",
      // For juniors the parent is the person the club actually contacts.
      name: (isJunior ? parent || player : player) || "Website visitor",
      email: val(isJunior ? "jr-email" : "a-email"),
      phone: isJunior ? null : val("a-phone"),
      interest: isJunior ? "Junior Program Registration" : "Private Lesson Request",
      source: isJunior ? "Junior Registration Form" : "Lesson Request Form",
      notes: isJunior && parent && player ? "Player: " + player : null,
      path: location.pathname,
      referrer: document.referrer || null,
    };
    try {
      var utm = JSON.parse(sessionStorage.getItem("ctc_utm") || "{}");
      for (var k in utm) body[k] = utm[k];
    } catch (err) {}
    try {
      fetch("https://switchboard-os.vercel.app/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          // Same key the chat widget uses, so a later booking-option click
          // in the chat is attributed to this person.
          if (d && d.id) localStorage.setItem("sb_lead_cohasset-tennis-club", d.id);
        })
        .catch(function () {});
    } catch (err) {}
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    mirrorLead();

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
