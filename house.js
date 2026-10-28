/* =========================================================================
   house.js  ·  THE HOUSE  ·  22 October 2026  ·  note 53 on the record

   What the head of every page beside the record does once it is open:
   1. THE STRIP. The count, from record.json's tally, by the record's rule:
      graded is held and wrong together, a hit is counted once as held,
      never reached and open count for neither side. Removed is 0: nothing
      on the record has been removed, which its edit history and the
      Internet Archive show (notes 40 and 49). The close that grades the
      open lines is Friday 23:00 in Madrid, from the open rows' own dates;
      the reader's clock only says how far away it is. If record.json does
      not load, the strip stays hidden. Nothing is typed.
   2. THE SWITCH. White by day and navy at night, following the device; the
      switch holds the reader's own choice, the same "theme" the record
      holds. A choice that matches the device is forgotten.
   3. THE COUNTER (note 37). A TradingView door used, by path alone:
      door-tradingview/<where>. Nothing else.
   No cookie, no address, nothing sent but the counter's one event.
   ========================================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  try { if (document.querySelector(".hs-bot")) document.body.classList.add("hs-has-bot"); } catch (e) {}

  /* 2. THE SWITCH */
  try {
    var sw = $("hs-theme"), word = $("hs-theme-word"), meta = document.querySelector('meta[name="theme-color"]');
    var mq = null; try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) {}
    var device = function () { return true; }; /* 29 Oct 2026, note 63: the ground is dark for everyone unless the reader chose light (the founder's ruling of 29 October 2026). It read: !!(mq && mq.matches) */
    var dark = function () { var t = root.getAttribute("data-theme"); return t ? t === "dark" : device(); };
    var keep = function (v) { try { if (v) localStorage.setItem("theme", v); else localStorage.removeItem("theme"); } catch (e) {} };
    var paint = function () {
      var d = dark();
      if (word) word.textContent = d ? "Light" : "Dark";
      if (sw) sw.setAttribute("aria-label", d ? "Switch to the light ground" : "Switch to the dark ground");
      if (meta) meta.setAttribute("content", d ? "#14244a" : "#0f1e3a");
    };
    if (sw) sw.addEventListener("click", function () {
      var next = dark() ? "light" : "dark";
      if ((next === "dark") === device()) { root.setAttribute("data-theme", "dark"); keep(null); } else { root.setAttribute("data-theme", next); keep(next); }
      paint();
    });
    if (mq) { if (mq.addEventListener) mq.addEventListener("change", paint); else if (mq.addListener) mq.addListener(paint); }
    paint();
  } catch (e) {}

  /* 3. THE COUNTER */
  try {
    var ev = function (p, t) {
      var go = function () { try { window.goatcounter.count({ path: p, title: t, event: true }); } catch (e) {} };
      if (window.goatcounter && typeof window.goatcounter.count === "function") { go(); return; }
      var s = document.querySelector("script[data-goatcounter]");
      if (s) s.addEventListener("load", function () { if (window.goatcounter && typeof window.goatcounter.count === "function") go(); }, { once: true });
    };
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[data-tv]") : null;
      if (a) ev("door-tradingview/" + (a.getAttribute("data-tv") || ""), "A door used: TradingView");
    }, true);
  } catch (e) {}

  /* 1. THE STRIP */
  var strip = $("hs-strip");
  if (!strip || !window.fetch) return;
  var madridOffsetMin = function (d) {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", timeZoneName: "longOffset" }).formatToParts(d);
      var tz = ""; for (var i = 0; i < parts.length; i++) if (parts[i].type === "timeZoneName") tz = parts[i].value;
      var m = tz.match(/([+-])(\d{2}):?(\d{2})?/); if (!m) return 120;
      return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10));
    } catch (e) { return 120; }
  };
  var closeAfter = function (iso) {
    var d = new Date(iso + "T12:00:00Z"); if (isNaN(d)) return null;
    var add = (5 - d.getUTCDay() + 7) % 7; if (add === 0) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
    /* note 60: 17:00 in New York, by New York's own clock. WAS:
    var guess = new Date(d.toISOString().slice(0, 10) + "T23:00:00Z");
    return new Date(guess.getTime() - madridOffsetMin(guess) * 60000); */
    var iso = d.toISOString().slice(0, 10), g = new Date(iso + "T21:00:00Z"), ny = -240;
    try {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", timeZoneName: "longOffset" }).formatToParts(g), z = "";
      for (var k = 0; k < p.length; k++) if (p[k].type === "timeZoneName") z = p[k].value;
      var mm = z.match(/([+-])(\d{2}):?(\d{2})?/); if (mm) ny = (mm[1] === "-" ? -1 : 1) * (parseInt(mm[2], 10) * 60 + parseInt(mm[3] || "0", 10));
    } catch (e) {}
    return new Date(Date.parse(iso + "T17:00:00Z") - ny * 60000);
  };
  var DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  fetch("record.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (!j || !j.tally) return;
    var t = j.tally, held = +t.held, wrong = +t.wrong, nr = +t.never_reached, open = +t.open;
    if (![held, wrong, nr, open].every(isFinite)) return;
    $("hs-graded").textContent = held + wrong; $("hs-held").textContent = held; $("hs-wrong").textContent = wrong;
    $("hs-nr").textContent = nr; $("hs-open").textContent = open;
    var cl = (j.rows || []).filter(function (r) { return r.grade === "pending" && r.named; }).map(function (r) { return closeAfter(r.named); }).filter(Boolean).sort(function (a, b) { return a - b; });
    if (cl.length) {
      var c = cl[0], local = new Date(c.getTime() + madridOffsetMin(c) * 60000);
      $("hs-when").textContent = DAY[local.getUTCDay()] + " " + local.getUTCDate() + " " + MON[local.getUTCMonth()] + " · " + String(local.getUTCHours()).padStart(2, "0") + ":" + String(local.getUTCMinutes()).padStart(2, "0") + " " + (madridOffsetMin(c) === 60 ? "CET" : "CEST");   /* note 60. This read: " · 23:00 " + ... */
      var tick = function () {
        var ms = c.getTime() - Date.now();
        if (ms <= 0) { $("hs-cd").textContent = "· close printed, grade pending"; return; }
        var m = Math.floor(ms / 60000), d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
        $("hs-cd").textContent = "· in " + (d ? d + "d " : "") + hh + "h " + (mm < 10 ? "0" : "") + mm + "m";
      };
      tick(); setInterval(tick, 30000);
      $("hs-next").hidden = false;
    }
    strip.classList.add("on");
  }).catch(function () {});
})();
