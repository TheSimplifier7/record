#!/usr/bin/env node
/* =========================================================================
   make_bank_pages.js  ·  24 September 2026  ·  record notes 35 and 36

   One page per row on the bank board, and one link card per page, so every
   bank target this desk grades has its own address: the quote, the kill
   this desk assigned, where gold stood, the backstory, and everything the
   same house has said, on the board and off it.

   Reads record.json only (targets, targets_left_off, closes). Never typed
   by hand. Writes, beside the record and in no folder, because a plain
   upload to GitHub flattens folders (note 36):
     <slug>.html   the page, the address record.json gives as page
     <slug>.png    its link card, 1200 x 630, rendered from memory when
                   playwright is installed; the page's og:image points at it
   The card's source is not written to the site. Without playwright it is
   written to the system's temporary folder, to be rendered by hand.

   THE RULES, the board's rules, unchanged:
     1. The claim, never the person. The house is the source.
     2. The exact quote, dated, linked.
     3. One rule grades every row, stated on every page.
     4. Nothing on a page is typed that is not in record.json, except the
        BACKSTORY paragraphs below, which the desk writes from the row's own
        sources and the record's own closes, and which never carry a grade.
     5. No page grades before the close. An open row says when it grades.

   Run after make_record_json.js:
     node make_record_json.js && node make_bank_pages.js
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const R = JSON.parse(fs.readFileSync(path.join(__dirname, "record.json"), "utf8"));
/* 24 Sep 2026, note 36. This wrote to banks/ and banks/cards/. */
const OUT = __dirname;
const SITE = "https://thesimplifier7.github.io/record/";

/* ---------------------------------------------------------------- helpers */
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmtDate = iso => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const fmtNum = (v, dec) => Number(v).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const num = s => Number(String(s).replace(/,/g, ""));

/* The house, not the channel it was reported through. */
function house(src) {
  let b = String(src).split(/,\s*(as reported|via)\b/i)[0].trim();
  const MAP = { "Citi Research": "Citi", "Goldman Sachs Research": "Goldman Sachs", "J.P. Morgan Global Research": "J.P. Morgan" };
  return MAP[b] || b;
}
const slugify = s => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const metalOf = t => t.metal || "Gold";
const slugOf = t => [slugify(house(t.source)), slugify(metalOf(t)), String(t.level), t.window].join("-");

/* The last Friday on or before the window's last day: the close that grades
   it. Christmas Day 2026 is a Friday with the market shut, so a December
   2026 window is described in words, as the kill text already does. */
function gradingFriday(windowIso) {
  const d = new Date(windowIso + "T00:00:00Z");
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1);
  const iso = d.toISOString().slice(0, 10);
  return iso === "2026-12-25" ? null : iso;
}
function lastClose(metal) {
  for (let i = R.closes.length - 1; i >= 0; i--) if (R.closes[i][metal]) return { date: R.closes[i].date, value: R.closes[i][metal] };
  return null;
}
const GRADE = { pending: ["Open", "pending"], pass: ["Held", "pass"], miss: ["Wrong", "miss"], notest: ["Never reached", "notest"] };

/* ---------------------------------------------------------------- backstories
   Written by the desk from the row's own source and the record's own closes.
   Every figure here is already on the record, in a row, a result or a note.
   A row without an entry falls back to its note, which is sourced. */
const UBS_FIRST = "The first number UBS put on the year held. On 29 December 2025, with gold at 4,322.40 as reported, it said 5,000 by September 2026. Weekly closes above 5,000 printed in February, and that row is graded held.";
const UBS_6200 = "Gold printed its high of 2026 on 28 January, 5,589.38 as reported. The next day UBS raised its gold target to 6,200 for March, June and September 2026, up from 5,000. One number, three windows, one sentence, so the board grades it as three rows, each on its own window.";
const BACKSTORY = {
  "ubs-gold-6200-2026-09-30": [
    UBS_6200,
    "March shut on the 27 March close without a weekly close at 6,200. June shut on the 26 June close at 4,088.97, 2,111.03 under the line. Both rows are graded wrong and both stay on the board.",
    "By the time June shut, UBS had cut its year-end target from 5,900 to 5,500, on 27 May. That cut is its own row, open until the last weekly close of the year.",
    UBS_FIRST,
    "September is the last of the three windows. The weekly close of 18 September was 4,377.290, 1,822.71 under the line. The row grades on the founder's read of the 25 September close, and not before it."
  ],
  "ubs-gold-6200-2026-06-30": [
    UBS_6200,
    "June was the second window. It shut on the 26 June close at 4,088.97, read off the founder's chart, 2,111.03 under the line. Wrong, and it stays.",
    "A month before it shut, on 27 May, UBS cut its year-end target from 5,900 to 5,500. That cut is its own row."
  ],
  "ubs-gold-6200-2026-03-31": [
    UBS_6200,
    "March was the first window. It shut on the 27 March close without a weekly close at 6,200. Wrong, and it stays."
  ],
  "ubs-gold-5000-2026-09-30": [
    "UBS's first number for 2026. On 29 December 2025, with gold at 4,322.40 as reported, it said 5,000 by September 2026, and 5,400 if the US midterm elections brought political or economic turmoil. The same note saw a pull back to 4,800 by the end of 2026.",
    "Only the first clause carries a level, a window and one direction, so only it is on the board. The 5,400 is a condition and the 4,800 is the return leg of a path; both are listed below with their reasons.",
    "Weekly closes above 5,000 printed in February, seven months inside the window: Friday 20 February closed above the line and Friday 27 February printed 5,232.50 as reported. Held."
  ],
  "ubs-gold-5000-2026-03-31": [
    "A week after its first number, on 6 January, UBS restated it with a nearer window: 5,000 by March, stay there to September, then moderate towards 4,800 by the end of 2026.",
    "Only the first clause carries a level, a window and one direction. Stay there to September names no close to grade, and towards is not a level; it is listed below.",
    "Friday 20 February closed above 5,000 and Friday 27 February printed 5,232.50 as reported, inside the window. Held."
  ],
  "ubs-gold-5500-2026-12-31": [
    "On 27 May UBS cut its year-end 2026 gold target from 5,900 to 5,500, as reported by Kitco.",
    "The 5,900 it was cut from was published on 29 January as the return leg of a path from 6,200, so it is listed below the board with that reason; the 6,200 is on the board as three rows, one per window.",
    "Open until the last weekly close of 2026."
  ]
};

/* The card's line for a graded row, written from the row's own result. */
const CARD_LINE = {
  "ubs-gold-6200-2026-03-31": "shut on the 27 March close without a weekly close at 6,200",
  "ubs-gold-6200-2026-06-30": "shut on the 26 June close at 4,088.97 \u00b7 2,111.03 under the line",
  "ubs-gold-5000-2026-09-30": "weekly closes above 5,000 printed in February, seven months inside the window",
  "ubs-gold-5000-2026-03-31": "Friday 27 February printed 5,232.50 as reported, inside the window",
  "citi-gold-5000-2026-03-31": "weekly closes above 5,000 printed in February, inside the window",
  "citi-silver-100-2026-03-31": "silver crossed 100 on Friday 23 January, ten days after the target"
};

/* ---------------------------------------------------------------- the data */
/* 24 Sep 2026, note 35: record.json names each row's page; this file writes it
   there and stops if its own slug would disagree. */
const ROWS = R.targets.map(t => {
  const slug = t.page ? String(t.page).replace(/^banks\//, "").replace(/\.html$/, "") : slugOf(t);
  if (slug !== slugOf(t)) throw new Error("record.json names " + t.page + " for a row this file would write at " + slugOf(t));
  return { ...t, house: house(t.source), metal: metalOf(t), slug };
});
const LEFT = (R.targets_left_off || []).map(a => ({ date: a[0], house: house(a[1]), source: a[1], quote: a[2], reason: a[3] }));
const byHouse = h => ROWS.filter(r => r.house === h).sort((a, b) => (a.published + a.window).localeCompare(b.published + b.window));
const count = rows => ({ pass: rows.filter(r => r.grade === "pass").length, miss: rows.filter(r => r.grade === "miss").length, pending: rows.filter(r => r.grade === "pending").length });
/* 24 Sep 2026, note 35: a window that opens on a figure takes a separator, so "4,800 0 to 3 months" reads "4,800 · 0 to 3 months". */
const lvWin = (lv, w) => lv + (/^\d/.test(String(w)) ? " · " : " ") + w;
const title = r => `${r.house} · ${r.metal === "Gold" ? "" : r.metal.toLowerCase() + " "}${lvWin(fmtNum(r.level, r.level % 1 ? 2 : 0), r.windowText)}`;

/* ---------------------------------------------------------------- the page */
const CSS = `
  :root{--bg:#141210;--panel:#1D1A16;--rule:#4A4238;--rule-soft:#3A342C;--ink:#EFE8DC;--ink-3:#CFC6B8;--ink-5:#B8AE9E;--ink-6:#A69C8C;
    --gold:#CBA43C;--miss:#D2764A;--pass:#5FA57A;--notest:#9C9282;--pending:#6BA3C7;
    --serif:'Newsreader',Georgia,serif;--mono:'IBM Plex Mono',ui-monospace,monospace;--pad:44px}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink-3);font-family:var(--serif);font-variant-numeric:tabular-nums;line-height:1.6;-webkit-font-smoothing:antialiased;text-wrap:pretty}
  .wrap{max-width:760px;margin:0 auto;padding:44px var(--pad) 64px}
  a{color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(203,164,60,.35)} a:hover{color:var(--ink)}
  header{border-bottom:1px solid var(--ink);padding-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:12px} .brand svg{width:34px;height:26px;display:block;overflow:visible}
  .brand .name{font-family:var(--mono);font-size:13px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--ink)}
  header .desc{font-family:var(--mono);font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-5)}
  header .desc a{border:0;color:inherit}
  .kick{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:40px 0 12px}
  h1{font-size:42px;font-weight:500;line-height:1.08;color:var(--ink);letter-spacing:-.01em;margin:0 0 18px}
  .status{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 26px}
  .g{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:6px 11px;border:1.5px solid currentColor;border-radius:2px}
  .g i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
  .g.pending{color:var(--pending)} .g.pass{color:var(--pass)} .g.miss{color:var(--miss)} .g.notest{color:var(--notest)}
  .status .when{font-family:var(--mono);font-size:13px;color:var(--ink-5)}
  .facts{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--rule);margin:0 0 28px}
  .facts div{padding:14px 14px 14px 0;border-bottom:1px solid var(--rule-soft)}
  .facts .t{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-6)}
  .facts .v{font-family:var(--mono);font-size:17px;font-weight:600;color:var(--ink);margin-top:4px}
  .facts .v.gold{color:var(--gold);font-size:26px} .facts .s{font-family:var(--mono);font-size:13px;color:var(--ink-5);margin-top:2px}
  blockquote{border-left:3px solid var(--gold);padding:4px 0 4px 18px;margin:0 0 30px}
  blockquote p{font-size:22px;line-height:1.45;color:var(--ink);font-style:italic}
  blockquote cite{display:block;font-style:normal;font-family:var(--mono);font-size:13px;color:var(--ink-5);margin-top:10px}
  h2{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin:36px 0 12px}
  p.body{font-size:18px;margin:0 0 14px;color:var(--ink-3)}
  .kill{font-family:var(--mono);font-size:14.5px;line-height:1.7;color:var(--ink);background:var(--panel);border:1px solid var(--rule-soft);padding:16px 18px}
  .fine{font-family:var(--mono);font-size:13px;line-height:1.7;color:var(--ink-6);margin-top:10px}
  .result{font-family:var(--mono);font-size:14px;line-height:1.7;color:var(--ink-3);margin-top:10px}
  .tally{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-5);margin:0 0 10px}
  .tally b{font-size:22px;letter-spacing:0;margin-right:6px} .tally .pass b{color:var(--pass)} .tally .miss b{color:var(--miss)} .tally .pending b{color:var(--pending)}
  ol.house{list-style:none;border-top:1px solid var(--rule)}
  ol.house li{display:grid;grid-template-columns:1fr auto;gap:4px 14px;align-items:center;padding:13px 0;border-bottom:1px solid var(--rule-soft)}
  ol.house .l{font-family:var(--mono);font-size:15px;font-weight:600;color:var(--ink)} ol.house .l a{border:0;color:var(--ink)} ol.house .l a:hover{color:var(--gold)}
  ol.house .d{font-family:var(--mono);font-size:12.5px;color:var(--ink-6);grid-column:1}
  ol.house .g{grid-row:1 / span 2;grid-column:2;font-size:11px;padding:4px 9px}
  ol.house li.here{background:linear-gradient(90deg,rgba(203,164,60,.08),transparent)}
  ol.house li.here .d::after{content:"  ·  this page";color:var(--gold)}
  ul.out{list-style:none;border-top:1px solid var(--rule)} ul.out li{padding:13px 0;border-bottom:1px solid var(--rule-soft)}
  ul.out .q{font-size:17px;color:var(--ink);font-style:italic} ul.out .m{font-family:var(--mono);font-size:12.5px;color:var(--ink-6);margin-top:4px}
  .rule-box{font-family:var(--mono);font-size:13.5px;line-height:1.75;color:var(--ink-5);padding-left:14px;border-left:3px solid var(--rule);margin:10px 0 0}
  .links{display:flex;gap:18px;flex-wrap:wrap;margin-top:34px;font-family:var(--mono);font-size:13px;letter-spacing:.12em;text-transform:uppercase}
  footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--rule);display:flex;justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap}
  .law{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
  .handle{font-family:var(--mono);font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-6)}
  @media (max-width:640px){:root{--pad:20px} h1{font-size:33px} blockquote p{font-size:19px} .facts .v.gold{font-size:22px} p.body{font-size:17px}}
`;
const BRAND = `<svg viewBox="0 0 40 30" fill="none" aria-hidden="true"><path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="#CBA43C" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"></path><circle cx="33.5" cy="29" r="2.9" fill="#CBA43C"></circle></svg>`;
const RULE = `<b style="color:var(--ink)">The one rule.</b> Held if a weekly close on the target's side of it, at or above for a target above price, at or below for a target below, prints on or before the last weekly close inside the window. Wrong if the window closes without one. A range is graded on its nearer bound. Graded on the TVC weekly close, read off this desk's own chart, the same close every row on the record is graded on; where a close predates this desk's own reads the row says as reported, and a grade never turns on the decimals.`;

function page(r) {
  const [gw, gc] = GRADE[r.grade] || [r.grade, "notest"];
  const dec = r.level % 1 ? 2 : 0;
  const fri = gradingFriday(r.window);
  const when = r.grade === "pending"
    ? (fri ? `Grades on the ${fmtDate(fri).replace(/ \d{4}$/, "")} close` : `Grades on the last weekly close of 2026`)
    : `Graded`;
  const lc = lastClose(r.metal);
  let dist = "";
  if (r.grade === "pending" && lc) {
    const c = num(lc.value), gap = r.side === "above" ? r.level - c : c - r.level;
    const pct = Math.abs(gap) / c * 100;
    dist = gap > 0
      ? `<div><div class="t">Last close on file</div><div class="v">${esc(lc.value)}</div><div class="s">${fmtDate(lc.date).replace(/ \d{4}$/, "")} · ${fmtNum(Math.abs(gap), 2)} ${r.side === "above" ? "under" : "over"} the line, ${pct.toFixed(1)} percent</div></div>`
      : `<div><div class="t">Last close on file</div><div class="v">${esc(lc.value)}</div><div class="s">${fmtDate(lc.date).replace(/ \d{4}$/, "")} · already on the target's side; the row grades on the window's close</div></div>`;
  }
  const H = byHouse(r.house), hc = count(H);
  const left = LEFT.filter(l => l.house === r.house);
  const story = BACKSTORY[r.slug] || (r.note ? [r.note] : []);
  const url = `${SITE}${r.slug}.html`, card = `${SITE}${r.slug}.png`;
  const desc = `${r.house} said ${lvWin(fmtNum(r.level, dec), r.windowText)}, on ${fmtDate(r.published)}. Graded on the weekly close by one rule. ${r.grade === "pending" ? when + "." : gw + "."}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title(r))} · The Bank Board</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#141210">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title(r))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${card}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<!-- Written by make_bank_pages.js from record.json. Do not edit by hand. -->
<style>${CSS}</style>
</head>
<body data-grade="${esc(r.grade)}">
<div class="wrap">
  <header>
    <div class="brand">${BRAND}<span class="name">The Simplifier</span></div>
    <div class="desc"><a href="targets.html">The bank board</a> · ${esc(r.house)}</div>
  </header>

  <div class="kick">Published ${fmtDate(r.published)}</div>
  <h1>${esc(title(r))}</h1>
  <div class="status"><span class="g ${gc}"><i></i>${gw}</span><span class="when">${esc(when)}</span></div>

  <div class="facts">
    <div><div class="t">Target</div><div class="v gold">${fmtNum(r.level, dec)}</div><div class="s">${esc(r.metal.toLowerCase())} · from ${r.side === "above" ? "below" : "above"}</div></div>
    <div><div class="t">Window</div><div class="v">${esc(r.windowText)}</div><div class="s">${fri ? "last weekly close " + fmtDate(fri) : "last weekly close of 2026"}</div></div>
    <div><div class="t">Said by</div><div class="v">${esc(r.house)}</div><div class="s">${esc(r.source === r.house ? "primary" : r.source.replace(r.house, "").replace(/^[,\s]+/, ""))}</div></div>
    ${dist || `<div><div class="t">Result</div><div class="v">${gw}</div><div class="s">on the close</div></div>`}
  </div>

  <blockquote><p>“${esc(r.quote)}”</p><cite>${esc(r.source)} · ${fmtDate(r.published)} · <a href="${esc(r.link)}" rel="nofollow noopener">the source</a></cite></blockquote>

  <h2>The kill this desk assigned</h2>
  <div class="kill">${esc(r.kill)}</div>
  <p class="fine">The target was published without one. The same rule grades every row on the board, and this desk's own levels on the record.</p>
  ${r.result ? `<p class="result">${esc(r.result)}</p>` : ""}

  <h2>The backstory</h2>
  ${story.map(p => `<p class="body">${esc(p)}</p>`).join("\n  ")}

  <h2>${esc(r.house)} on the board</h2>
  <div class="tally"><span class="pass"><b>${hc.pass}</b>held</span><span class="miss"><b>${hc.miss}</b>wrong</span><span class="pending"><b>${hc.pending}</b>open</span></div>
  <ol class="house">
    ${H.map(x => { const [w, c] = GRADE[x.grade] || [x.grade, "notest"]; return `<li${x.slug === r.slug ? ' class="here"' : ""}><span class="l"><a href="${x.slug}.html">${esc(title(x).replace(x.house + " · ", ""))}</a></span><span class="d">published ${fmtDate(x.published)}</span><span class="g ${c}"><i></i>${w}</span></li>`; }).join("\n    ")}
  </ol>

  ${left.length ? `<h2>What ${esc(r.house)} said that the board leaves off</h2>
  <ul class="out">
    ${left.map(l => `<li><div class="q">“${esc(l.quote)}”</div><div class="m">${esc(l.date)} · ${esc(l.reason)}</div></li>`).join("\n    ")}
  </ul>` : ""}

  <h2>How every row is graded</h2>
  <div class="rule-box">${RULE}</div>

  <div class="links"><a href="targets.html">The full board</a><a href="./">The record</a><a href="misses.html">The wrong ones</a></div>
  <footer><span class="law">Named before · Graded after · Nothing deleted</span><span class="handle">@TheSimplifier7</span></footer>
</div>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- the card */
function cardHtml(r) {
  const [gw, gc] = GRADE[r.grade] || [r.grade, "notest"];
  const dec = r.level % 1 ? 2 : 0;
  const fri = gradingFriday(r.window);
  const lc = lastClose(r.metal);
  const H = byHouse(r.house), hc = count(H);
  let line = "";
  if (r.grade === "pending" && lc) {
    const c = num(lc.value), gap = r.side === "above" ? r.level - c : c - r.level;
    line = gap > 0 ? `close ${fmtDate(lc.date).replace(/ \d{4}$/, "")} · ${lc.value} · ${fmtNum(Math.abs(gap), 2)} ${r.side === "above" ? "under" : "over"} the line` : `close ${fmtDate(lc.date).replace(/ \d{4}$/, "")} · ${lc.value}`;
  } else line = CARD_LINE[r.slug] || "";
  const when = r.grade === "pending" ? (fri ? `grades on the ${fmtDate(fri).replace(/ \d{4}$/, "")} close` : "grades on the last close of 2026") : `graded ${gw.toLowerCase()} on the close`;
  const col = { pending: "#6BA3C7", pass: "#5FA57A", miss: "#D2764A", notest: "#9C9282" }[gc];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:radial-gradient(ellipse at 20% 0%,#201c17 0%,#141210 60%);color:#EFE8DC;font-family:'IBM Plex Mono',ui-monospace,monospace;padding:52px 60px;position:relative;overflow:hidden}
  .top{display:flex;justify-content:space-between;border-bottom:1.5px solid #EFE8DC;padding-bottom:18px;font-size:17px;font-weight:600;letter-spacing:.3em;text-transform:uppercase}
  .top span:last-child{color:#B8AE9E;font-weight:500;letter-spacing:.16em;font-size:15px}
  .kick{margin-top:30px;font-size:17px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#CBA43C}
  .house{font-family:'Newsreader',Georgia,serif;font-size:64px;font-weight:500;margin-top:14px;letter-spacing:-.01em}
  .lvl{display:flex;align-items:baseline;gap:22px;margin-top:4px}
  .lvl b{font-size:118px;font-weight:600;color:#CBA43C;letter-spacing:-.03em;line-height:1}
  .lvl span{font-size:24px;color:#CFC6B8}
  .g{position:absolute;right:60px;top:170px;display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${col};border:2px solid ${col};padding:10px 18px}
  .g i{width:12px;height:12px;border-radius:50%;background:${col}}
  .line{margin-top:14px;font-size:22px;color:#CFC6B8} .line em{font-style:normal;color:${col}}
  .foot{position:absolute;left:60px;right:60px;bottom:44px;border-top:1px solid #4A4238;padding-top:16px;display:flex;justify-content:space-between;font-size:17px;color:#B8AE9E}
  .foot b{font-weight:600} .p{color:#5FA57A} .m{color:#D2764A} .o{color:#6BA3C7}
  </style></head><body>
  <div class="top"><span>The Simplifier</span><span>The bank board · graded on the close</span></div>
  <div class="kick">Published ${fmtDate(r.published)}</div>
  <div class="house">${esc(r.house)}</div>
  <div class="lvl"><b>${fmtNum(r.level, dec)}</b><span>${esc(r.metal.toLowerCase())} · ${esc(r.windowText)}</span></div>
  <div class="g"><i></i>${gw}</div>
  <div class="line">${esc(line)}</div><div class="line"><em>${esc(when)}</em></div>
  <div class="foot"><span>${esc(r.house)} on the board: <b class="p">${hc.pass} held</b> · <b class="m">${hc.miss} wrong</b> · <b class="o">${hc.pending} open</b></span><span>thesimplifier7.github.io/record</span></div>
  </body></html>`;
}

/* ---------------------------------------------------------------- write */
let n = 0;
for (const r of ROWS) {
  fs.writeFileSync(path.join(OUT, r.slug + ".html"), page(r));
  n++;
}
console.log(`${n} bank pages written beside the record. Backstories written for ${Object.keys(BACKSTORY).length}; the rest carry their row's note.`);

/* ---------------------------------------------------------------- render
   24 Sep 2026, note 35. The link cards render here when playwright is
   installed, the way make_week_card.js renders the week card, so a graded
   bank row never ships a stale card. The cards read their faces from Google
   Fonts; in a sandbox that cannot reach them, set BANK_FONTS to a folder of
   the @fontsource woff2 files and they are injected. NO_RENDER=1 skips it.
   verify_record.js checks every card is there at 1200 x 630. */
(async () => {
  if (process.env.NO_RENDER) return;
  let chromium; try { ({ chromium } = require("playwright")); } catch (e) {
    const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "bank-cards-"));
    for (const r of ROWS) fs.writeFileSync(path.join(tmp, r.slug + ".html"), cardHtml(r));
    console.log(`playwright not installed; the card sources are in ${tmp}. Render each to <slug>.png at 1200 x 630 and put it beside the record.`);
    return;
  }
  const FD = process.env.BANK_FONTS || "";
  const face = (fam, file, w) => { const f = path.join(FD, file); return FD && fs.existsSync(f) ? `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format('woff2');font-weight:${w}}` : ""; };
  const faces = [face("IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", 500), face("IBM Plex Mono", "ibm-plex-mono-latin-600-normal.woff2", 600),
    face("Newsreader", "newsreader-latin-400-normal.woff2", 400), face("Newsreader", "newsreader-latin-500-normal.woff2", 500)].join("");
  const opts = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const b = await chromium.launch(opts);
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const r of ROWS) {
    await p.setContent(cardHtml(r), { waitUntil: "load" });
    if (faces) await p.addStyleTag({ content: faces });
    try { await p.evaluate(() => document.fonts.ready); } catch (e) {}
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, r.slug + ".png") });
  }
  await b.close();
  console.log(`${ROWS.length} cards rendered at 1200 x 630 beside the record` + (faces ? ", faces injected from " + FD : "") + ".");
})();
