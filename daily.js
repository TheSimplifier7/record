/* daily.js · THE DAILY SERIES · 12 November 2026 · note 69 on the record

   By the founder's ruling of 12 November 2026 a level is named for gold, silver and platinum on every trading
   day, on X at 08:00 CET, and each one is graded on that day's close. This file reads daily.json, grades every
   row by arithmetic on its close and draws the blocks the pages show: today's levels, the last days, every day
   since the series began, and the count. The same code runs in two places, so the two can never disagree:

     in Node      make_home.js and make_daily.js call it to write the blocks into index.html and levels.html, so a
                  reader with scripts off sees the levels that were on file at the last upload, under their date;
     in a page    it fetches daily.json and redraws the same blocks, so a day added to daily.json alone shows on
                  every page without a rebuild.

   THE RULE, as the pages print it (note 71): each level is a floor or a ceiling, and each has one Exit, a daily
   close through it. A floor exits on a close below it, a ceiling on a close above it; a close exactly on the
   level counts as held. The close is 17:00 in New York, 23:00 in Madrid in most weeks, read off the founder's
   own chart. Nothing is typed as a grade: the word is worked out from the side, the level and the close, here
   and nowhere else.

   A weekday inside the series with no row in daily.json is drawn as "Not on file", and a day he named nothing is
   written { "date": ..., "none": true } and drawn as "None named". Neither is ever left out, so a day that was
   missed shows as plainly as a level that was wrong. Days the market is shut go in "closed".

   No odds and no target anywhere (note 51). No free text on a row: a level carries its side and nothing else.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.Daily = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ORDER = ["Gold", "Silver", "Platinum"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var X = "https://x.com/TheSimplifier7";
  var COUNSEL = "This is structural analysis. It is not a recommendation to buy or sell. I develop and sell The Fan, the indicator these levels are read from.";
  var RULE = "Each level is a floor or a ceiling, and each has one Exit: a daily close through it. A floor exits on a close below it. A ceiling exits on a close above it. A close exactly on the level counts as held. Held means the day closed on the side I named; it is not a trade result. The close is 17:00 New York, 23:00 Madrid in most weeks, read off my own chart.";

  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var isIso = function (s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d0(s).getTime()) && d0(s).toISOString().slice(0, 10) === s; };
  function d0(iso) { return new Date(iso + "T12:00:00Z"); }
  var addDays = function (iso, n) { var d = d0(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var dow = function (iso) { return d0(iso).getUTCDay(); };
  var isWeekday = function (iso) { var w = dow(iso); return w >= 1 && w <= 5; };
  var longDay = function (iso) { var d = d0(iso); return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]; };
  /* a day in a block is written Thu 12 November: the weekday short, so a page of dates carries no weekday as a word */
  var midDay = function (iso) { var d = d0(iso); return DAYS[d.getUTCDay()].slice(0, 3) + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]; };
  var shortDay = function (iso) { var d = d0(iso); return DAYS[d.getUTCDay()].slice(0, 3) + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()].slice(0, 3); };
  var longDate = function (iso) { var d = d0(iso); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
  var isNum = function (s) { return typeof s === "string" && /^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(s); };
  var num = function (s) { return Number(String(s).replace(/,/g, "")); };
  var decs = function (s) { return (String(s).split(".")[1] || "").length; };
  var fmt = function (v, d) { return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); };

  /* The grade, by arithmetic on the close and nothing else. */
  function grade(side, level, close) {
    if (close == null || close === "") return "open";
    var c = num(close), l = num(level);
    if (side === "floor") return c < l ? "wrong" : "held";
    return c > l ? "wrong" : "held";
  }
  function distance(level, close) {
    var c = num(close), l = num(level), d = Math.max(2, decs(level));
    if (c === l) return "on the level";
    return fmt(Math.abs(c - l), d) + (c > l ? " above" : " under");
  }
  var must = function (side) { return side === "floor" ? "The day must close above it." : "The day must close under it."; };
  var kind = function (side) { return side === "floor" ? "Floor" : "Ceiling"; };
  var WORD = { held: "Held", wrong: "Wrong", open: "Open" };

  /* What is wrong with a daily.json, as a list of plain sentences. An empty list means it can be drawn. */
  var BANNED = /[—–!#]|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  var READ = /^\d{2}:\d{2} CES?T(, \d{1,2} [A-Z][a-z]+ \d{4})?$/;
  function problems(D) {
    var p = [];
    if (!D || typeof D !== "object") return ["daily.json is not an object"];
    if (!isIso(D.start)) p.push("start is not a date");
    if (!Array.isArray(D.days)) return p.concat(["days is not a list"]);
    var closed = Array.isArray(D.closed) ? D.closed : [];
    closed.forEach(function (c) { if (!isIso(c)) p.push("closed carries " + JSON.stringify(c) + ", not a date"); });
    var seen = {};
    D.days.forEach(function (day, i) {
      var at = "day " + (i + 1) + (day && day.date ? " (" + day.date + ")" : "");
      if (!day || typeof day !== "object") { p.push(at + " is not an object"); return; }
      Object.keys(day).forEach(function (k) { if (["date", "none", "post", "levels", "closes", "read"].indexOf(k) < 0) p.push(at + " carries " + k + ", which a day does not have"); });
      if (!isIso(day.date)) { p.push(at + " has no date"); return; }
      if (seen[day.date]) p.push(at + " is on file twice"); seen[day.date] = 1;
      if (isIso(D.start) && day.date < D.start) p.push(at + " is before the series began");
      if (!isWeekday(day.date)) p.push(at + " is not a trading day");
      if (closed.indexOf(day.date) >= 0) p.push(at + " is listed as a day the market was shut");
      if (day.post != null && !/^https:\/\/x\.com\/TheSimplifier7\/status\/\d+$/.test(day.post)) p.push(at + " links a post that is not on @TheSimplifier7");
      if (day.read != null && (typeof day.read !== "string" || !READ.test(day.read))) p.push(at + " has a read time that is not a time, as in 23:05 CET");
      if (day.none === true) { if (day.levels || day.closes) p.push(at + " is marked none named and still carries levels"); return; }
      if (day.none != null) p.push(at + " has none set to something other than true");
      if (!Array.isArray(day.levels) || !day.levels.length) { p.push(at + " has no levels and is not marked none named"); return; }
      var metals = {};
      day.levels.forEach(function (r) {
        if (!r || typeof r !== "object") { p.push(at + " has a level that is not an object"); return; }
        Object.keys(r).forEach(function (k) { if (["metal", "level", "side"].indexOf(k) < 0) p.push(at + ", " + (r.metal || "a level") + " carries " + k + "; a level has a metal, a level and a side, nothing else"); });
        if (ORDER.indexOf(r.metal) < 0) p.push(at + " names " + JSON.stringify(r.metal) + ", not gold, silver or platinum");
        if (metals[r.metal]) p.push(at + " names " + r.metal + " twice"); metals[r.metal] = 1;
        if (!isNum(r.level)) p.push(at + ", " + r.metal + " level " + JSON.stringify(r.level) + " is not a figure");
        if (r.side !== "floor" && r.side !== "ceiling") p.push(at + ", " + r.metal + " has no side: floor or ceiling");
      });
      if (day.closes != null) {
        if (typeof day.closes !== "object") p.push(at + " closes is not an object");
        else Object.keys(day.closes).forEach(function (m) {
          if (!metals[m]) p.push(at + " carries a close for " + m + ", which has no level that day");
          else if (!isNum(day.closes[m])) p.push(at + ", " + m + " close " + JSON.stringify(day.closes[m]) + " is not a figure");
        });
      }
    });
    (Array.isArray(D.corrections) ? D.corrections : D.corrections == null ? [] : [null]).forEach(function (c, i) {
      if (!c || !isIso(c.date) || typeof c.text !== "string" || !c.text || c.text.length > 400) p.push("correction " + (i + 1) + " needs a date and its words");
      else if (BANNED.test(c.text)) p.push("correction " + (i + 1) + " carries a mark brand law rules out");
    });
    return p;
  }

  /* Every trading day from the start to the newest day on file, newest first: a row on file, a day he named
     nothing, or a weekday with nothing on file. And the count. */
  function model(D) {
    var by = {}, closed = {}, last = null;
    (D.closed || []).forEach(function (c) { closed[c] = 1; });
    D.days.forEach(function (d) { by[d.date] = d; if (!last || d.date > last) last = d.date; });
    var days = [], t = { held: 0, wrong: 0, open: 0, none: 0, gap: 0, days: 0 };
    if (last) for (var iso = D.start; iso <= last; iso = addDays(iso, 1)) {
      if (!isWeekday(iso) || closed[iso]) continue;
      var d = by[iso];
      if (!d) { days.push({ date: iso, state: "gap" }); t.gap++; continue; }
      if (d.none === true) { days.push({ date: iso, state: "none", post: d.post || null }); t.none++; continue; }
      var rows = d.levels.slice().sort(function (a, b) { return ORDER.indexOf(a.metal) - ORDER.indexOf(b.metal); }).map(function (r) {
        var close = d.closes && d.closes[r.metal] != null ? d.closes[r.metal] : null, g = grade(r.side, r.level, close);
        t[g]++;
        return { metal: r.metal, level: r.level, side: r.side, close: close, grade: g, dist: close == null ? "" : distance(r.level, close) };
      });
      days.push({ date: iso, state: "named", post: d.post || null, read: d.read || null, rows: rows }); t.days++;
    }
    days.reverse();
    return { start: D.start, last: last, days: days, tally: t, corrections: (D.corrections || []).slice().reverse() };
  }

  /* ---- the blocks ---- */
  /* A grade is its word beside a short line: gold for a line that stands, red for a line that broke, ivory for one still open. */
  var mark = function (g) { return '<span class="dy-g dy-' + g + '">' + WORD[g] + "</span>"; };
  var postLink = function (day, words) { return day.post ? '<a href="' + esc(day.post) + '" rel="noopener">' + words + "</a>" : ""; };
  var followBtn = function (where) { return '<a class="hs-btn hs-gold" href="' + X + '" rel="noopener" data-x="' + esc(where) + '">Follow on X for the 08:00 levels</a>'; };

  /* One level, drawn as ASSAY's gauge draws it on the week card: the line in gold, the side that proves it wrong hatched and
     fading from the line, and once the day has closed a pearl where the close sat, above the line or under it. */
  function levelRows(day) {
    return '<ol class="dy-rows">' + day.rows.map(function (r) {
      var says = r.grade === "open" ? must(r.side) : "Closed " + '<span class="dy-fig">' + esc(r.close) + "</span>, " + esc(r.dist) + ".";
      var pin = r.grade === "open" ? "" : '<i class="dy-pin dy-pin-' + (num(r.close) > num(r.level) ? "above" : num(r.close) < num(r.level) ? "under" : "on") + '"></i>';
      return '<li class="dy-row dy-' + r.side + " dy-is-" + r.grade + '"><p class="dy-top"><span class="dy-metal">' + esc(r.metal) + '</span><span class="dy-lv">' + esc(r.level) + "</span></p>" +
        '<div class="dy-gauge" aria-hidden="true">' + pin + "</div>" +
        '<p class="dy-k"><span><b>' + kind(r.side) + ".</b> " + says + '</span><span class="dy-st">' + WORD[r.grade] + "</span></p></li>";
    }).join("") + "</ol>";
  }

  /* Today's levels. today is the date in Madrid, or null when the page is written (the page then says whose
     levels it shows by their date and makes no claim about today). */
  function todayCard(M, today, where) {
    var named = M.days.filter(function (d) { return d.state === "named"; }), day = named[0] || null;
    var head, body, foot = "", w = esc(where || "today");
    var onX = '<a href="' + X + '" rel="noopener" data-x="' + w + '-see">See it on X</a>';
    if (!day) {
      head = '<div class="dy-head"><h2 class="dy-t" id="dy-t">Today\'s levels</h2><p class="dy-d">Posted at 08:00 CET</p></div>';
      body = '<p class="dy-none">The daily series began on ' + esc(longDay(M.start)) + " " + M.start.slice(0, 4) + ". No day is on file here yet. Each day's three levels are on X first, at 08:00 CET.</p>";
    } else {
      var isToday = !!today && day.date === today;
      head = '<div class="dy-head"><h2 class="dy-t" id="dy-t">' + (isToday ? "Today's levels" : "The latest levels on file") + '</h2><p class="dy-d">' + esc(midDay(day.date)) + "</p></div>";
      body = levelRows(day);
      if (today && !isToday && isWeekday(today) && today > day.date) body += '<p class="dy-none">Today\'s levels are not on file here yet. They are on X first, at 08:00 CET.</p>';
      if (day.post) onX = '<a href="' + esc(day.post) + '" rel="noopener" data-x="' + w + '-post">The 08:00 post on X</a>';
      var prev = named[1];
      if (prev && day.rows.every(function (r) { return r.grade === "open"; })) {
        foot = '<div class="dy-prev"><p class="dy-ph">' + esc(midDay(prev.date)) + ', graded</p><table><thead><tr><th scope="col"><span class="dy-sr">Metal</span></th><th scope="col" class="dy-n">Level</th><th scope="col" class="dy-n">Close</th><th scope="col"><span class="dy-sr">Grade</span></th></tr></thead><tbody>' + prev.rows.map(function (r) {
          return '<tr><th scope="row">' + esc(r.metal) + '</th><td class="dy-fig dy-n">' + esc(r.level) + '</td><td class="dy-fig dy-n">' + (r.close == null ? "" : esc(r.close)) + "</td><td>" + mark(r.grade) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      }
    }
    return '<div class="dy dy-today">' + head + body + foot +
      '<p class="dy-f"><a href="levels.html#days">Every day, graded</a>' + onX + "</p>" +
      '<p class="dy-c">' + esc(COUNSEL) + "</p></div>";
  }

  /* The last n trading days, one line a day, all three metals with the same weight. */
  function lastDays(M, n) {
    var days = M.days.slice(0, n);
    if (!days.length) return '<div class="dy dy-last"><p class="dy-none">The first graded day appears here after its close.</p></div>';
    var cell = function (r) { return r ? '<span class="dy-cell"><span class="dy-fig">' + esc(r.level) + "</span>" + mark(r.grade) + "</span>" : '<span class="dy-mut">No level</span>'; };
    return '<div class="dy dy-last"><table><thead><tr><th scope="col">Day</th>' + ORDER.map(function (m) { return '<th scope="col">' + m + "</th>"; }).join("") + "</tr></thead><tbody>" + days.map(function (d) {
      if (d.state !== "named") return '<tr><th scope="row">' + esc(shortDay(d.date)) + '</th><td colspan="3" class="dy-mut">' + (d.state === "none" ? "None named" : "Not on file") + "</td></tr>";
      var by = {}; d.rows.forEach(function (r) { by[r.metal] = r; });
      return '<tr><th scope="row">' + (d.post ? '<a href="' + esc(d.post) + '" rel="noopener">' + esc(shortDay(d.date)) + "</a>" : esc(shortDay(d.date))) + "</th>" + ORDER.map(function (m) { return "<td>" + cell(by[m]) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }

  /* Every day since the series began, in full: one ledger, a group of rows to a day, the columns in line down the page. */
  function table(M) {
    if (!M.days.length) return '<div class="dy dy-all"><p class="dy-none">No day is on file yet. The first appears here once its levels are written to daily.json.</p></div>';
    var cols = '<thead><tr><th scope="col">Metal</th><th scope="col">Side</th><th scope="col" class="dy-n">Level</th><th scope="col" class="dy-n">Close</th><th scope="col" class="dy-n dy-wide">Distance</th><th scope="col">Grade</th></tr></thead>';
    return '<div class="dy dy-all"><table>' + cols + M.days.map(function (d) {
      var h = '<tr class="dy-dayrow" id="d-' + d.date + '"><th scope="rowgroup" colspan="6"><span class="dy-day">' + esc(midDay(d.date)) + "</span>" + (d.post ? '<span class="dy-src">' + postLink(d, "The post on X") + "</span>" : "") + "</th></tr>";
      if (d.state === "gap") return "<tbody>" + h + '<tr><td colspan="6" class="dy-mut">Not on file. No level for this day was written here, so none is graded.</td></tr></tbody>';
      if (d.state === "none") return "<tbody>" + h + '<tr><td colspan="6" class="dy-mut">None named. No level was posted for this day.</td></tr></tbody>';
      return "<tbody>" + h + d.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r.metal) + "</th><td>" + kind(r.side) + '</td><td class="dy-fig dy-n">' + esc(r.level) + '</td><td class="dy-fig dy-n">' + (r.close == null ? "" : esc(r.close)) + '</td><td class="dy-fig dy-n dy-wide">' + esc(r.dist) + "</td><td>" + mark(r.grade) + "</td></tr>";
      }).join("") + (d.read ? '<tr class="dy-readrow"><td colspan="6">Closes read off my chart, ' + esc(d.read) + ".</td></tr>" : "") + "</tbody>";
    }).join("") + "</table>" + (M.corrections.length ? '<h3 class="dy-h">Corrections</h3><ul class="dy-corr">' + M.corrections.map(function (c) { return "<li><b>" + esc(longDate(c.date)) + ".</b> " + esc(c.text) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
  }

  /* The count, as one line. */
  function tally(M) {
    var t = M.tally, since = "since " + longDay(M.start).split(" ").slice(1).join(" ");
    if (!M.days.length) return '<span class="dy-tally">The daily series, from ' + esc(longDate(M.start)) + ": no day on file yet</span>";
    var parts = ["<b>" + t.held + "</b> held", "<b>" + t.wrong + "</b> wrong"];
    if (t.open) parts.push("<b>" + t.open + "</b> open");
    if (t.none) parts.push("<b>" + t.none + "</b> " + (t.none === 1 ? "day" : "days") + " none named");
    if (t.gap) parts.push("<b>" + t.gap + "</b> " + (t.gap === 1 ? "day" : "days") + " not on file");
    return '<span class="dy-tally">The daily series, ' + esc(since) + ": " + parts.join(", ") + "</span>";
  }

  /* The look, in ASSAY's tokens (brand.css). The levels sit on a pane of glass over the record's rosette (plate.js). A level is a
     line: gold while it stands, red once a close is through it. */
  var CSS = [
    ".dy{color:var(--c-sec);font-family:var(--c-ui)}.dy *{box-sizing:border-box}:where(.dy) p{margin:0}",
    ".dy a{color:var(--c-ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;text-decoration-color:var(--c-rule-2);transition:text-decoration-color .15s ease}.dy a:hover{text-decoration-color:currentColor}",
    ".dy-fig,.dy-lv{font-family:var(--c-fig);font-variant-numeric:tabular-nums;font-feature-settings:'zero' 0}.dy-n{text-align:right!important}.dy-mut{color:var(--c-mut)}",
    ".dy-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    ".dy-g{color:var(--c-ink);white-space:nowrap}.dy-g::before{content:'';display:inline-block;width:12px;height:2px;margin-right:8px;vertical-align:middle;position:relative;top:-1px;background:var(--c-gold)}.dy-g.dy-wrong::before{background:var(--c-red)}.dy-g.dy-open::before{background:var(--c-ink);opacity:.4}",
    ".dy-today{position:relative;border-radius:16px;padding:28px 32px 24px;background-color:rgba(17,35,60,.55);background-image:linear-gradient(180deg,rgba(255,255,255,.085) 0%,rgba(255,255,255,.03) 45%,rgba(255,255,255,.015) 100%);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 1px 0 0 rgba(255,255,255,.05),inset 0 -1px 0 rgba(0,0,0,.3),inset 0 0 0 1px rgba(255,255,255,.05),0 2px 3px rgba(0,0,0,.35),4px 26px 46px -14px rgba(0,0,0,.72)}",
    ".dy-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px}.dy .dy-t{font:500 16px/1.5 var(--c-ui)!important;letter-spacing:0!important;margin:0;color:var(--c-ink)}.dy-d{font-size:14px;line-height:1.5;color:var(--c-mut);text-align:right}",
    ".dy-rows{list-style:none;margin:4px 0 0;padding:0}.dy-row{padding-top:16px}",
    ".dy-top{display:flex;justify-content:space-between;align-items:baseline;gap:16px}",
    ".dy-gauge{position:relative;height:28px;margin-top:4px}.dy-gauge::before{content:'';position:absolute;left:0;right:0;top:13px;height:2px;background:var(--c-gold)}.dy-is-wrong .dy-gauge::before{background:var(--c-red)}",
    ".dy-gauge::after{content:'';position:absolute;left:0;right:0;height:12px;background:repeating-linear-gradient(135deg,rgba(243,237,226,.32) 0 1px,transparent 1px 6px)}.dy-is-wrong .dy-gauge::after{background:repeating-linear-gradient(135deg,rgba(240,96,74,.75) 0 1px,transparent 1px 6px)}",
    ".dy-floor .dy-gauge::after{top:15px;-webkit-mask-image:linear-gradient(180deg,#000,transparent);mask-image:linear-gradient(180deg,#000,transparent)}.dy-ceiling .dy-gauge::after{top:1px;-webkit-mask-image:linear-gradient(0deg,#000,transparent);mask-image:linear-gradient(0deg,#000,transparent)}",
    ".dy-pin{position:absolute;left:66%;top:8px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:radial-gradient(circle at 36% 32%,#fff 0,var(--c-ink) 45%,var(--c-sec) 100%);box-shadow:0 0 0 2px var(--c-gold)}.dy-is-wrong .dy-pin{box-shadow:0 0 0 2px var(--c-red)}.dy-pin-above{top:-2px}.dy-pin-under{top:18px}",
    ".dy-metal{font:500 18px/1.2 var(--c-ui);color:var(--c-ink)}.dy-lv{font-weight:500;font-size:28px;line-height:1;letter-spacing:-.02em;color:var(--c-ink)}",
    ".dy-k{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:4px;font-size:14px;line-height:1.5}.dy-k b{font-weight:400;color:var(--c-ink)}.dy-k .dy-fig{font-size:13px}.dy-st{color:var(--c-ink);white-space:nowrap}",
    ".dy-none{font-size:15px;line-height:1.6;color:var(--c-sec);padding-top:16px}.dy-rows+.dy-none{padding-top:20px}",
    ".dy-prev{margin-top:28px;padding-top:20px;border-top:1px solid var(--c-rule)}.dy-ph{font-size:14px;line-height:1.5;color:var(--c-mut)}",
    ".dy-prev table{width:100%;border-collapse:collapse;margin-top:4px;font-size:14px}.dy-prev th,.dy-prev td{padding:4px 0 4px 16px;line-height:1.75;text-align:left;font-weight:400;vertical-align:baseline;white-space:nowrap}.dy-prev th:first-child{padding-left:0}.dy-prev thead th{font-size:13px;color:var(--c-mut);padding-bottom:0}.dy-prev tbody th{color:var(--c-ink)}.dy-prev td.dy-fig{font-size:13px;color:var(--c-sec)}.dy-prev td:last-child{width:1%;padding-left:20px}",
    ".dy-f{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;margin-top:28px;font-size:14px;line-height:1.5}",
    ".dy-c{margin-top:16px;padding-top:16px;border-top:1px solid var(--c-rule);font-size:12.5px;line-height:1.5;color:var(--c-mut)}",
    ".dy-last table,.dy-all table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.5}",
    ".dy-last th,.dy-last td,.dy-all th,.dy-all td{text-align:left;padding:16px 24px 16px 0;border-bottom:1px solid var(--c-rule);vertical-align:baseline;font-weight:400}.dy-last tr>:last-child,.dy-all tr>:last-child{padding-right:0}",
    ".dy-last thead th,.dy-all thead th{font-size:13px;color:var(--c-mut);padding-top:0;padding-bottom:12px;border-bottom-color:var(--c-rule-2)}.dy-last tbody th,.dy-all tbody th{color:var(--c-ink);white-space:nowrap}",
    ".dy-cell{display:inline-flex;align-items:baseline;gap:16px;white-space:nowrap}.dy-cell .dy-fig,.dy-all td.dy-fig{font-size:14px;color:var(--c-ink)}.dy-all td.dy-wide{color:var(--c-sec)}",
    ".dy-all .dy-dayrow th{padding-top:40px;padding-bottom:12px;border-bottom-color:var(--c-rule-2)}.dy-all tbody:first-of-type .dy-dayrow th{padding-top:24px}.dy-day{font:500 17px/1.4 var(--c-ui);color:var(--c-ink)}.dy-src{float:right;font-size:14px}",
    ".dy-all .dy-readrow td{border-bottom:0;padding-top:8px;padding-bottom:0;font-size:13px;color:var(--c-mut)}.dy-all td:last-child{width:1%}",
    ".dy .dy-h{font:500 17px/1.4 var(--c-ui)!important;color:var(--c-ink);margin:40px 0 8px}.dy-corr{margin:0;padding-left:18px;font-size:15px;line-height:1.6}.dy-corr b{font-weight:500;color:var(--c-ink)}",
    ".dy-tally b{font:500 .9375em var(--c-fig);color:var(--c-ink)}",
    "@media (max-width:560px){.dy-today{padding:20px 20px 20px;border-radius:12px}.dy-lv{font-size:24px}.dy-metal{font-size:17px}.dy-last th,.dy-last td,.dy-all th,.dy-all td{padding:12px 12px 12px 0}.dy-last table{font-size:14px}.dy-cell{display:flex;flex-direction:column;align-items:flex-start;gap:2px}.dy-cell .dy-fig,.dy-all td.dy-fig{font-size:13px}.dy-cell .dy-g{font-size:13px}.dy-all table{font-size:14px}.dy-all .dy-wide{display:none}.dy-src{float:none;display:block;margin-top:2px}}"
  ].join("\n");

  var api = { ORDER: ORDER, X: X, COUNSEL: COUNSEL, RULE: RULE, CSS: CSS, problems: problems, model: model, grade: grade, distance: distance, todayCard: todayCard, lastDays: lastDays, table: table, tally: tally, longDay: longDay, longDate: longDate, followBtn: followBtn };

  /* In a page: read the file as it stands now and redraw each block that asks for it. A file that cannot be
     read, or that carries a problem, leaves the page as it was written. */
  if (typeof document !== "undefined" && typeof fetch === "function") {
    var madridToday = function () {
      try {
        var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()), o = {};
        parts.forEach(function (x) { o[x.type] = x.value; });
        return o.year + "-" + o.month + "-" + o.day;
      } catch (e) { return null; }
    };
    var draw = function () {
      var slots = document.querySelectorAll("[data-daily]");
      if (!slots.length) return;
      fetch("daily.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (D) {
        if (!D || problems(D).length) return;
        var M = model(D), today = madridToday();
        Array.prototype.forEach.call(slots, function (el) {
          var k = el.getAttribute("data-daily"), w = el.getAttribute("data-where") || "page";
          /* with no day on file the last-days slot is left as the page wrote it: the front page shows the weekly series there until the first day is graded */
          var html = k === "today" ? todayCard(M, today, w) : k === "last" ? (M.days.length ? lastDays(M, 5) : null) : k === "table" ? table(M) : k === "tally" ? tally(M) : null;
          if (html != null) el.innerHTML = html;
        });
      }).catch(function () {});
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
  }
  return api;
});
