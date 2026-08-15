/* =============================================================================
   COHASSET TENNIS CLUB — branded AI receptionist
   Talks to the Switchboard OS backend (/api/chat + /api/track), styled to the
   site's pine/sea-glass palette. Also fires the page-view ping every widget
   page load, so the club's dashboard sees traffic as well as conversations.
   ============================================================================= */
(function () {
  "use strict";
  var clientSlug = "cohasset-tennis-club";
  var apiBase = "https://switchboard-os.vercel.app";
  var title = "Cohasset Tennis Club";
  var greeting = "Hi! I'm the club's virtual front desk.";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PINE = "#1C4459", CLAY = "#144F63", INK = "#163540", SOFT = "#43585F", LINE = "#D6E1E1", BG = "#F5F8F8";
  var GRAD = "linear-gradient(135deg," + PINE + "," + CLAY + ")";
  var FONT = "'DM Sans', system-ui, -apple-system, sans-serif";
  var CHAT_SVG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';

  function css(el, s) { for (var k in s) el.style[k] = s[k]; }
  function isNarrow() { return window.matchMedia("(max-width: 760px)").matches; }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  /* Campaign tags from the URL, remembered for the visit so a lead captured
     three pages later still credits the ad that brought them in. */
  var UTM_KEY = "ctc_utm";
  var attribution = {};
  try {
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) {
      var v = qs.get(k); if (v) attribution[k] = v.slice(0, 200);
    });
    if (Object.keys(attribution).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(attribution));
    else attribution = JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
  } catch (e) { attribution = {}; }

  /* page-view tracking — fire-and-forget, never blocks the page.
     sessionId lives in sessionStorage: one tab, no cookie, gone on close. */
  function sessionId() {
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

  try {
    fetch(apiBase + "/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign(
        { clientSlug: clientSlug, path: location.pathname, referrer: document.referrer || null,
          sessionId: sessionId() },
        attribution
      )),
      keepalive: true,
    }).catch(function () {});
  } catch (e) {}

  var messages = [];
  var open = false;

  /* ---- launcher + pulse ring ---- */
  var ring = document.createElement("span");
  css(ring, { position: "fixed", right: "22px", bottom: "22px", width: "60px", height: "60px", borderRadius: "50%", background: CLAY, opacity: ".5", zIndex: "2147482999", pointerEvents: "none" });
  if (!reduce && ring.animate) ring.animate([{ transform: "scale(1)", opacity: .4 }, { transform: "scale(1.8)", opacity: 0 }], { duration: 2200, iterations: Infinity, easing: "ease-out" });
  else ring.style.display = "none";

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Chat with Cohasset Tennis Club");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = CHAT_SVG;
  css(launcher, { position: "fixed", right: "22px", bottom: "22px", width: "60px", height: "60px", borderRadius: "50%", border: "none", cursor: "pointer", background: GRAD, boxShadow: "0 12px 28px -8px rgba(18,49,65,.55)", zIndex: "2147483000", display: "grid", placeItems: "center", transition: "transform .2s ease" });
  launcher.onmouseenter = function () { launcher.style.transform = "scale(1.06)"; };
  launcher.onmouseleave = function () { launcher.style.transform = "scale(1)"; };

  /* ---- proactive greeting bubble ---- */
  var promo = document.createElement("div");
  promo.setAttribute("role", "status");
  css(promo, { position: "fixed", right: "22px", bottom: "94px", maxWidth: "252px", background: "#fff", color: INK, fontFamily: FONT, fontSize: "15px", fontWeight: "500", lineHeight: "1.4", padding: "14px 16px", borderRadius: "16px 16px 4px 16px", boxShadow: "0 18px 44px -12px rgba(18,49,65,.4)", zIndex: "2147483000", cursor: "pointer", opacity: "0", transform: "translateY(10px)", transition: "opacity .35s ease, transform .35s ease", display: "none" });
  var promoText = document.createElement("span");
  promoText.textContent = "Questions about lessons or membership? Ask me — I reply instantly.";
  var promoX = document.createElement("button");
  promoX.type = "button"; promoX.setAttribute("aria-label", "Dismiss"); promoX.innerHTML = "&times;";
  css(promoX, { position: "absolute", top: "5px", right: "8px", border: "none", background: "transparent", color: SOFT, fontSize: "18px", lineHeight: "1", cursor: "pointer", padding: "2px 4px" });
  promo.appendChild(promoX); promo.appendChild(promoText);
  if (isNarrow()) css(promo, { maxWidth: "212px", fontSize: "14px", padding: "12px 14px", bottom: "88px" });

  /* ---- panel ---- */
  var panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Cohasset Tennis Club");
  css(panel, { position: "fixed", right: "22px", bottom: "94px", width: "372px", maxWidth: "calc(100vw - 32px)", height: "524px", maxHeight: "calc(100vh - 130px)", background: "#fff", borderRadius: "18px", boxShadow: "0 26px 60px -16px rgba(18,49,65,.5)", display: "none", flexDirection: "column", overflow: "hidden", fontFamily: FONT, zIndex: "2147483001", border: "1px solid " + LINE });

  var head = document.createElement("div");
  css(head, { background: GRAD, color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" });
  head.innerHTML =
    '<span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;flex:none">' +
      '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>' +
    '</span>' +
    '<span style="flex:1;min-width:0">' +
      '<span style="display:block;font-weight:700;font-size:15px;letter-spacing:.01em">' + esc(title) + '</span>' +
      '<span style="display:block;font-size:12px;opacity:.85">We reply instantly</span>' +
    '</span>' +
    '<button class="ctc-close" type="button" aria-label="Close chat" style="border:none;background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px">&times;</button>';

  var bodyEl = document.createElement("div");
  css(bodyEl, { flex: "1", overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", background: BG });

  var row = document.createElement("div");
  css(row, { display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid " + LINE, background: "#fff", alignItems: "center" });
  var input = document.createElement("input");
  input.type = "text"; input.placeholder = "Type your message…"; input.setAttribute("aria-label", "Message");
  css(input, { flex: "1", border: "1.5px solid " + LINE, borderRadius: "999px", padding: "10px 14px", fontSize: "14px", fontFamily: FONT, outline: "none", color: INK });
  input.onfocus = function () { input.style.borderColor = CLAY; };
  input.onblur = function () { input.style.borderColor = LINE; };
  var send = document.createElement("button");
  send.type = "button"; send.setAttribute("aria-label", "Send message");
  send.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  css(send, { border: "none", background: GRAD, color: "#fff", borderRadius: "50%", width: "42px", height: "42px", flex: "none", cursor: "pointer", display: "grid", placeItems: "center" });

  row.appendChild(input); row.appendChild(send);
  panel.appendChild(head); panel.appendChild(bodyEl); panel.appendChild(row);

  function addMsg(role, text) {
    var b = document.createElement("div");
    b.textContent = text;
    css(b, { maxWidth: "84%", padding: "10px 13px", fontSize: "14px", lineHeight: "1.45", whiteSpace: "pre-wrap", borderRadius: "14px", fontFamily: FONT });
    if (role === "user") css(b, { alignSelf: "flex-end", background: GRAD, color: "#fff", borderBottomRightRadius: "4px" });
    else css(b, { alignSelf: "flex-start", background: "#fff", color: INK, border: "1px solid " + LINE, borderBottomLeftRadius: "4px" });
    bodyEl.appendChild(b); bodyEl.scrollTop = bodyEl.scrollHeight;
    return b;
  }

  /* Options the receptionist offers as buttons — lesson requests, junior
     registration, membership tiers. Each href is a signed tracking link that
     logs the click, so the club can see which option a visitor chose. The
     lead id rides along when we know who they are. */
  function addOptions(options) {
    var wrap = document.createElement("div");
    css(wrap, { display: "flex", flexDirection: "column", gap: "6px", maxWidth: "84%", alignSelf: "flex-start", margin: "2px 0 4px" });

    var lead = null;
    try { lead = localStorage.getItem("sb_lead_" + clientSlug); } catch (e) {}

    options.forEach(function (o) {
      var a = document.createElement("a");
      a.href = o.url + (lead ? "?lead=" + encodeURIComponent(lead) : "");
      a.target = "_blank"; a.rel = "noopener";
      css(a, { display: "block", padding: "10px 13px", borderRadius: "12px", border: "1.5px solid " + CLAY, background: "#fff", color: INK, fontFamily: FONT, fontSize: "14px", textDecoration: "none", lineHeight: "1.35" });
      a.onmouseenter = function () { a.style.background = BG; };
      a.onmouseleave = function () { a.style.background = "#fff"; };

      var name = document.createElement("span");
      css(name, { fontWeight: "700" });
      name.textContent = o.label;
      a.appendChild(name);

      if (o.priceNote) {
        var price = document.createElement("span");
        css(price, { color: CLAY, fontWeight: "700", marginLeft: "6px" });
        price.textContent = o.priceNote;
        a.appendChild(price);
      }
      if (o.description) {
        var desc = document.createElement("span");
        css(desc, { display: "block", fontSize: "12px", color: SOFT, marginTop: "2px" });
        desc.textContent = o.description;
        a.appendChild(desc);
      }
      wrap.appendChild(a);
    });

    bodyEl.appendChild(wrap); bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  addMsg("assistant", greeting + "\nAsk me about lessons, junior tennis, membership, or this week's schedule.");

  /* ---- open / close ---- */
  function openPanel() { open = true; panel.style.display = "flex"; hidePromo(true); launcher.setAttribute("aria-expanded", "true"); setTimeout(function () { input.focus(); }, 60); }
  function closePanel() { open = false; panel.style.display = "none"; launcher.setAttribute("aria-expanded", "false"); }
  launcher.addEventListener("click", function () { open ? closePanel() : openPanel(); });
  head.querySelector(".ctc-close").addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) closePanel(); });

  /* Site buttons can open the chat: <a data-open-chat href="contact.html">.
     The href stays as a fallback for the no-JS crawler and the widget failing. */
  window.CTC_CHAT = { open: openPanel };
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("[data-open-chat]");
    if (t) { e.preventDefault(); openPanel(); }
  });

  /* ---- send ---- */
  function doSend() {
    var t = input.value.trim(); if (!t) return;
    input.value = "";
    messages.push({ role: "user", content: t }); addMsg("user", t);
    var typing = addMsg("assistant", "…");
    fetch(apiBase + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientSlug: clientSlug, messages: messages }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        // The receptionist saved this visitor as a lead — keep the id so later
        // option clicks are attributed to them. Same key ctc-forms.js uses.
        try { if (d.leadId) localStorage.setItem("sb_lead_" + clientSlug, d.leadId); } catch (e) {}
        var reply = d.reply || d.error || "Sorry, something went wrong.";
        typing.textContent = reply; messages.push({ role: "assistant", content: reply });
        if (d.options && d.options.length) addOptions(d.options);
        bodyEl.scrollTop = bodyEl.scrollHeight; })
      .catch(function () { typing.textContent = "Sorry, I couldn't reach the club just now — please try again in a moment, or call (781) 383-9533."; });
  }
  send.addEventListener("click", doSend);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") doSend(); });

  /* ---- proactive greeting ---- */
  function showPromo() {
    try { if (sessionStorage.getItem("ctc_chat_seen")) return; } catch (e) {}
    if (open) return;
    promo.style.display = "block";
    requestAnimationFrame(function () { promo.style.opacity = "1"; promo.style.transform = "translateY(0)"; });
    // On phones the bubble sits near the hero CTA, so it retires on its own.
    if (isNarrow()) setTimeout(function () { if (!open) hidePromo(false); }, 6000);
  }
  function hidePromo(remember) {
    promo.style.opacity = "0"; promo.style.transform = "translateY(10px)";
    setTimeout(function () { promo.style.display = "none"; }, 350);
    if (remember) { try { sessionStorage.setItem("ctc_chat_seen", "1"); } catch (e) {} }
  }
  promoX.addEventListener("click", function (e) { e.stopPropagation(); hidePromo(true); });
  promo.addEventListener("click", openPanel);

  /* ---- mount ---- */
  document.body.appendChild(ring);
  document.body.appendChild(launcher);
  document.body.appendChild(promo);
  document.body.appendChild(panel);

  /* ---- phones: stay out of the hero ----
     Hold the launcher back until the visitor scrolls past the first screen,
     so it never covers the hero's primary CTA. */
  if (isNarrow()) {
    var revealed = false;
    css(launcher, { opacity: "0", pointerEvents: "none", transition: "opacity .3s ease, transform .2s ease" });
    ring.style.display = "none";
    var revealLauncher = function () {
      if (revealed || window.scrollY < window.innerHeight * 0.75) return;
      revealed = true;
      css(launcher, { opacity: "1", pointerEvents: "auto" });
      if (!reduce) ring.style.display = "";
      window.removeEventListener("scroll", revealLauncher);
      setTimeout(showPromo, 600);
    };
    window.addEventListener("scroll", revealLauncher, { passive: true });
    revealLauncher();
  } else {
    setTimeout(showPromo, 1400);
  }
})();
