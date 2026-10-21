#!/usr/bin/env node
/* =========================================================================
   make_week_pages.js  ·  21 October 2026

   One page per week of the record, so a search for a week's gold, silver or
   platinum lines finds that week, and an index of them, weeks.html.

   Reads record.json only (rows, closes). Never typed by hand. Writes, beside
   the record and in no folder (note 36):
     week-<Monday>.html   one per week, the Monday its trading week opens
     weeks.html           every week, newest first

   FROM the week of 31 August 2026, the first week whose lines were each
   written with one fixed weekly close as the line that proves them wrong.
   Rows written before that are on the record in the words they were graded
   in, and weeks.html says so. A week with no line says so too.

   EACH LINE IS SHOWN BY THE ONE RULE (the Path, 10 October 2026):
     a floor: the week must close above it; a ceiling: under it.
   Floor or ceiling is read from the row's side (holds above is a floor,
   stays below is a ceiling) or, on rows written before the call grammar,
   from the weekly close its row says would prove it wrong. Friday's close is
   the row's graded close, taken from record.json's closes. The word is the
   row's own grade: held (a hit is counted once, as held), wrong, never
   reached, open. The script refuses to write a page if any of these
   disagree: a close through the line on a row graded held, a close that is
   not the one in closes, a line whose figure is not the row's level.

   No result prose from the row is copied: the page carries figures and the
   founder's key line, and links each line to its row on the record.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const P = require("./page_parts.js");
const { esc, longDate, weekday, addDays, SITE } = P;

const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const FROM = "2026-08-31";   /* the trading Monday of the first week shown */
const ORDER = { Gold: 0, Silver: 1, Platinum: 2 };

/* ---------------------------------------------------------------- figures */
const decOf = s => { const m = String(s).match(/\.(\d+)$/); return m ? m[1].length : 0; };
const toInt = (s, d) => { const [a, b = ""] = String(s).replace(/,/g, "").split("."); return BigInt(a + (b + "0".repeat(d)).slice(0, d)); };
const groupK = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/* The distance between two printed figures, exact: as many decimals as the finer of the two, trailing zeros past the second dropped. */
function dist(a, b) {
  const d = Math.max(decOf(a), decOf(b));
  let n = toInt(a, d) - toInt(b, d); if (n < 0n) n = -n;
  let s = n.toString().padStart(d + 1, "0");
  let ip = d ? s.slice(0, -d) : s, fp = d ? s.slice(-d) : "";
  while (fp.length > 2 && fp.endsWith("0")) fp = fp.slice(0, -1);
  return groupK(ip) + (fp ? "." + fp : "");
}
const cmp = (a, b) => { const d = Math.max(decOf(a), decOf(b)); const x = toInt(a, d), y = toInt(b, d); return x < y ? -1 : x > y ? 1 : 0; };

/* The Monday a row's trading week opens: a row written on a Sunday is for the week that opens that evening. */
function tradingMonday(iso) {
  const dow = new Date(iso + "T12:00:00Z").getUTCDay();
  return dow === 0 ? addDays(iso, 1) : addDays(iso, -(dow - 1));
}

function lineOf(r) {
  const fail = why => { throw new Error(`${r.anchor}: ${why}. No page written.`); };
  let kind = null;
  if (r.side === "slate") kind = "floor";
  else if (r.side === "copper") kind = "ceiling";
  const km = String(r.kill || "").match(/^a weekly close (back )?(below|beneath|under|above) ([\d,]+(?:\.\d+)?)\.?$/);
  if (!km) fail("its wrong-if line is not one fixed weekly close (" + r.kill + ")");
  const kk = km[2] === "above" ? "ceiling" : "floor";
  if (kind && kind !== kk) fail("its side says " + kind + " and its wrong-if line says " + kk);
  kind = kind || kk;
  if (km[3] !== r.level) fail("its wrong-if figure " + km[3] + " is not its level " + r.level);
  let close = null;
  if (r.graded_on_close) {
    const c = (R.closes || []).find(x => x.date === r.graded_on_close);
    close = c && c[r.metal];
    if (!close) fail("no close for " + r.metal + " on " + r.graded_on_close + " in closes");
    if (r.close && r.close !== close) fail("its close " + r.close + " is not the close in closes, " + close);
  }
  const W = { pass: "held", miss: "wrong", partial: "wrong", notest: "never reached", pending: "open" };
  const word = W[r.grade]; if (!word) fail("grade " + r.grade + " is not one the record uses");
  if (word === "open" && close) fail("graded close on an open row");
  if (word !== "open" && !close) fail("a graded row with no close");
  if (close && (word === "held" || word === "wrong")) {
    const through = kind === "floor" ? cmp(close, r.level) < 0 : cmp(close, r.level) > 0;
    if (through !== (word === "wrong")) fail(`the close ${close} against the ${kind} ${r.level} does not give ${word}`);
  }
  const side = close ? (cmp(close, r.level) < 0 ? "under" : cmp(close, r.level) > 0 ? "above" : "on") : null;
  return { r, kind, level: r.level, close, word, side, gap: close && side !== "on" ? dist(close, r.level) : close ? "0" : null };
}

/* ---------------------------------------------------------------- weeks */
const rows = R.rows.filter(r => r.type === "Map" && tradingMonday(r.named) >= FROM);
const weeks = {};
for (const r of rows) { const m = tradingMonday(r.named); (weeks[m] = weeks[m] || []).push(lineOf(r)); }
const mondays = Object.keys(weeks).sort();
for (const m of mondays) weeks[m].sort((a, b) => ORDER[a.r.metal] - ORDER[b.r.metal]);
/* every Monday from the first to the last, so a week with no line is shown as one */
const allMondays = []; for (let m = mondays[0]; m <= mondays[mondays.length - 1]; m = addDays(m, 7)) allMondays.push(m);

const fileOf = m => `week-${m}.html`;
const fridayOf = m => addDays(m, 4);
const metalsText = ls => { const ms = [...new Set(ls.map(l => l.r.metal.toLowerCase()))]; return ms.length === 1 ? ms[0] : ms.slice(0, -1).join(", ") + " and " + ms[ms.length - 1]; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
function countText(ls) {
  const n = w => ls.filter(l => l.word === w).length;
  const parts = [], held = n("held"), wrong = n("wrong"), nr = n("never reached"), open = n("open");
  if (held) parts.push(held + " held"); if (wrong) parts.push(wrong + " wrong"); if (nr) parts.push(nr + " never reached"); if (open) parts.push(open + " open");
  return `${ls.length} ${ls.length === 1 ? "line" : "lines"}, ${parts.join(", ")}`;
}
const MARK = { held: "held", wrong: "wrong", "never reached": "nr", open: "open" };

/* The week's own card where the record drew one; the tally card where it did not. */
function imageFor(m, ls) {
  const named = ls[0].r.named, graded = ls.every(l => l.word !== "open");
  for (const f of [`card_${named}_${graded ? "graded" : "open"}.png`]) if (fs.existsSync(path.join(HERE, f))) return { url: P.imageOf(f), w: 1200, h: 630 };
  return { url: P.imageOf("tally_card_landscape_dark.png"), w: 1920, h: 1080 };
}

const CSS = `
.status{font:500 1.02rem/1.5 var(--f-ui);color:var(--ink-2);margin:6px 0 0}
.lines{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr));gap:14px}
.line{border:1px solid var(--rule);border-radius:8px;background:var(--raise);padding:18px 18px 16px;display:flex;flex-direction:column;gap:12px;min-width:0}
.line .hd{display:flex;align-items:center;justify-content:space-between;gap:10px}
.metal{font:700 1.2rem/1 var(--f-cond);letter-spacing:.08em;text-transform:uppercase}
.kind{font:700 .74rem/1 var(--f-cond);letter-spacing:.14em;text-transform:uppercase;padding:5px 8px 4px;border-radius:3px;box-shadow:inset 0 0 0 1.5px var(--rule-2);color:var(--ink-2)}
.lv{font:600 clamp(1.7rem,4.6vw,2.1rem)/1 var(--f-fig);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.rule{margin:0;color:var(--ink-2);font-size:.95rem}
.dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0;font-size:.92rem;border-top:1px solid var(--rule);padding-top:12px}
.dl dt{color:var(--ink-3)}
.dl dd{margin:0;text-align:right;font-family:var(--f-fig);font-variant-numeric:tabular-nums}
.grade{display:inline-flex;align-items:center;gap:8px;font:700 .95rem/1 var(--f-ui);letter-spacing:.08em;text-transform:uppercase}
.grade i{width:12px;height:12px;display:inline-block;flex:none}
.grade.held{color:var(--held)} .grade.held i{border-radius:50%;background:var(--mk-held)}
.grade.wrong{color:var(--wrong)} .grade.wrong i{border-radius:2px;background:var(--wrong-chip)}
.grade.nr{color:var(--nr)} .grade.nr i{border-radius:50%;box-shadow:inset 0 0 0 2px var(--nr)}
.grade.open{color:var(--open)} .grade.open i{border-radius:50%;box-shadow:inset 0 0 0 2px var(--open);background:radial-gradient(circle,var(--open) 0 2px,transparent 2.5px)}
.line .ft{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;font-size:.85rem;color:var(--ink-3)}
.wnav{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:34px 0 0;padding-top:16px;border-top:1px solid var(--rule);font-size:.92rem}
.wnav span{color:var(--ink-3)}
.weeks{list-style:none;margin:8px 0 0;padding:0;border-top:1px solid var(--rule)}
.weeks li{border-bottom:1px solid var(--rule);padding:16px 0;display:grid;grid-template-columns:minmax(0,15rem) minmax(0,1fr);gap:8px 24px;align-items:baseline}
.weeks .wk a{font:700 1.15rem/1.2 var(--f-cond);letter-spacing:.02em;text-decoration:none}
.weeks .wk a:hover{text-decoration:underline}
.weeks .wk small{display:block;color:var(--ink-3);font:400 .85rem/1.4 var(--f-ui);margin-top:3px}
.weeks .ls{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.92rem}
.weeks .ls span{white-space:nowrap}
.weeks .ls .grade{font-size:.78rem;margin-left:6px}
.weeks .ls.none{display:block;color:var(--ink-3)}
@media (max-width:640px){.weeks li{grid-template-columns:1fr}}
`;

function lineCard(l) {
  /* The row's own date, the day it went up (named). Not written: on a graded row that is the day the grade was written. */
  const r = l.r, wd = weekday(r.named);
  return `<article class="line" id="${esc(r.anchor)}">
    <div class="hd"><span class="metal">${esc(r.metal)}</span><span class="kind">${l.kind === "floor" ? "Floor" : "Ceiling"}</span></div>
    <div class="lv">${esc(l.level)}</div>
    <p class="rule">${l.kind === "floor" ? "The week must close above it." : "The week must close under it."}</p>
    <dl class="dl">
      <dt>Friday's close</dt><dd>${l.close ? esc(l.close) : "Not yet"}</dd>
      ${l.close ? `<dt>From the line</dt><dd>${l.side === "on" ? "on it" : esc(l.gap) + " " + l.side}</dd>` : ""}
    </dl>
    <span class="grade ${MARK[l.word]}"><i aria-hidden="true"></i>${esc(l.word)}</span>
    <div class="ft"><span>Written ${esc(wd)} ${esc(longDate(r.named))}</span><a href="${esc(r.url)}">This line on the record</a></div>
  </article>`;
}

function weekPage(m, i) {
  const ls = weeks[m], fri = fridayOf(m), graded = ls.every(l => l.word !== "open");
  const closeDay = (ls.find(l => l.r.graded_on_close) || {}).r;
  const friDate = closeDay ? closeDay.graded_on_close : fri;
  const title = `${cap(metalsText(ls))}: the week of ${longDate(m)} · The Simplifier`;
  const description = `The week of ${longDate(m)} on The Simplifier's record. ${P.KEY.join(" ")}`;
  const img = imageFor(m, ls);
  const prev = mondays[mondays.indexOf(m) - 1], next = mondays[mondays.indexOf(m) + 1];
  const status = graded ? `Graded on Friday's close, ${longDate(friDate)}. ${countText(ls)}.` : `Open until Friday's close, ${longDate(fri)}. ${countText(ls)}.`;
  return P.head({ title, description, canonical: SITE + fileOf(m), image: img.url, imageW: img.w, imageH: img.h, extraCss: CSS }) + `
${P.band("week-page")}
<main><div class="wrap">
  <p class="eyebrow">${esc(ls.map(l => l.r.metal).join(" · "))}</p>
  <h1>The week of ${esc(longDate(m))}</h1>
  <p class="status">${esc(status)}</p>
  ${P.keyLine()}
  <section class="lines" aria-label="The lines">
  ${ls.map(lineCard).join("\n  ")}
  </section>
  <nav class="wnav" aria-label="The weeks">
    ${prev ? `<a href="${fileOf(prev)}">Earlier: the week of ${esc(longDate(prev))}</a>` : `<span></span>`}
    <a href="weeks.html">Week by week</a>
    ${next ? `<a href="${fileOf(next)}">Later: the week of ${esc(longDate(next))}</a>` : `<span></span>`}
  </nav>
  ${P.doors("week-page")}
</div></main>
${P.foot()}`;
}

function weeksPage() {
  const title = "Gold, silver and platinum, week by week · The Simplifier";
  const description = "Every week of The Simplifier's record on its own page. " + P.KEY.join(" ");
  const img = { url: P.imageOf("tally_card_landscape_dark.png"), w: 1920, h: 1080 };
  const items = allMondays.slice().reverse().map(m => {
    const ls = weeks[m];
    if (!ls) {
      return `<li><div class="wk"><span class="metal">The week of ${esc(longDate(m))}</span></div><div class="ls none">No line that week. <a href="./#note-28">Note 28</a> says why.</div></li>`;
    }
    const graded = ls.every(l => l.word !== "open");
    return `<li><div class="wk"><a href="${fileOf(m)}">The week of ${esc(longDate(m))}</a><small>${esc(graded ? countText(ls) : "Open until Friday's close")}</small></div>
      <div class="ls">${ls.map(l => `<span>${esc(l.r.metal)} <span class="fig">${esc(l.level)}</span> ${l.kind}<span class="grade ${MARK[l.word]}"><i aria-hidden="true"></i>${esc(l.word)}</span></span>`).join("")}</div></li>`;
  }).join("\n    ");
  return P.head({ title, description, canonical: SITE + "weeks.html", image: img.url, imageW: img.w, imageH: img.h, extraCss: CSS + `.weeks .wk .metal{font:700 1.15rem/1.2 var(--f-cond);letter-spacing:.02em;text-transform:none}` }) + `
${P.band("weeks-page")}
<main><div class="wrap">
  <p class="eyebrow">Gold · Silver · Platinum</p>
  <h1>Week by week</h1>
  ${P.keyLine()}
  <ol class="weeks" reversed>
    ${items}
  </ol>
  <p class="fine" style="margin-top:18px">Lines written before 31 August 2026 are on <a href="./#results">the record</a>, in the words they were graded in.</p>
  ${P.doors("weeks-page")}
</div></main>
${P.foot()}`;
}

/* ---------------------------------------------------------------- write */
const written = [];
for (const m of mondays) { fs.writeFileSync(path.join(HERE, fileOf(m)), weekPage(m)); written.push(fileOf(m)); }
fs.writeFileSync(path.join(HERE, "weeks.html"), weeksPage()); written.push("weeks.html");
const stale = fs.readdirSync(HERE).filter(f => /^week-\d{4}-\d{2}-\d{2}\.html$/.test(f) && written.indexOf(f) < 0);
console.log(`Week pages: ${mondays.length} weeks from ${longDate(mondays[0])} to ${longDate(mondays[mondays.length - 1])}, ${rows.length} lines, and weeks.html.`);
if (stale.length) console.log("Beside the record but no longer written (left in place, never deleted): " + stale.join(", "));
