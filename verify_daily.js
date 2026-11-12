#!/usr/bin/env node
/* verify_daily.js · the gate for the daily series · 12 November 2026 · note 69 on the record

   Run before any upload that touches daily.json, daily.js, levels.html or index.html:
     node make_daily.js && node make_home.js && node verify_daily.js
   It writes nothing. It says "The daily series verifies." or names what does not hold.

   What it holds the series to:
     1. daily.json can be drawn: every day a trading day on or after the start, a level only for gold, silver or
        platinum, each with a side and a figure, nothing else on a row (no odds, no target, no free text).
     2. No day on file is later than today in Madrid, and a close is on file only for a day that has ended there.
     3. The grade of every row is the one arithmetic gives: a floor exits on a close below its level, a ceiling on
        a close above it, and a close on the level counts as held (note 71).
     4. The count the pages print is the count of those rows.
     5. levels.html and index.html are the ones this daily.json draws: each is written again in memory and
        compared, so a page left behind after an edit to daily.json fails here.
     6. Counsel's two lines stand word for word on both pages, with the line that held is not a trade result.
        The seal each page carries for the plate is the record's seal, as record.json gives it.
     7. Neither page offers a Monday email, says how The Fan's line is worked out, or carries an em dash,
        an exclamation mark or an HTML comment.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const os = require("os");
const HERE = __dirname;
const D = require("./daily.js");
const rd = f => fs.readFileSync(path.join(HERE, f), "utf8");
const fails = [];
const check = (ok, msg) => { console.log((ok ? "  ok    " : "  FAIL  ") + msg); if (!ok) fails.push(msg); };

let data = null;
try { data = JSON.parse(rd("daily.json")); } catch (e) { check(false, "daily.json reads as JSON (" + e.message + ")"); }
if (data) {
  /* 1 */
  const probs = D.problems(data);
  check(probs.length === 0, "daily.json can be drawn" + (probs.length ? "\n          " + probs.join("\n          ") : " (" + data.days.length + " day" + (data.days.length === 1 ? "" : "s") + " on file, from " + data.start + ")"));
  check(data.start === "2026-11-12", "the series begins on 12 November 2026, as note 69 says");
  if (!probs.length) {
    /* 2 */
    const madrid = (() => { const o = {}; new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).forEach(x => { o[x.type] = x.value; }); return { day: o.year + "-" + o.month + "-" + o.day, hour: +o.hour }; })();
    const late = data.days.filter(d => d.date > madrid.day).map(d => d.date);
    check(late.length === 0, "no day on file is later than today in Madrid, " + madrid.day + (late.length ? " (" + late.join(", ") + ")" : ""));
    const early = data.days.filter(d => d.closes && Object.keys(d.closes).length && (d.date > madrid.day || (d.date === madrid.day && madrid.hour < 23))).map(d => d.date);
    check(early.length === 0, "a close is on file only for a day whose close has printed" + (early.length ? " (" + early.join(", ") + " carries a close before 23:00 in Madrid)" : ""));
    /* 3 and 4 */
    const M = D.model(data);
    const num = s => Number(String(s).replace(/,/g, ""));
    let held = 0, wrong = 0, open = 0; const bad = [];
    M.days.filter(d => d.state === "named").forEach(d => d.rows.forEach(r => {
      const want = r.close == null ? "open" : r.side === "floor" ? (num(r.close) < num(r.level) ? "wrong" : "held") : (num(r.close) > num(r.level) ? "wrong" : "held");
      if (want !== r.grade) bad.push(d.date + " " + r.metal);
      if (want === "held") held++; else if (want === "wrong") wrong++; else open++;
    }));
    check(bad.length === 0, "every grade is the one arithmetic gives" + (bad.length ? " (not: " + bad.join(", ") + ")" : " (" + (held + wrong + open) + " rows)"));
    check(M.tally.held === held && M.tally.wrong === wrong && M.tally.open === open, `the count is the count of the rows: ${held} held, ${wrong} wrong, ${open} open, ${M.tally.none} none named, ${M.tally.gap} not on file`);
    /* 5: write each page again in a copy and compare */
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "daily-"));
    try {
      for (const f of ["daily.js", "daily.json", "record.json", "house_parts.js", "assay-core.js", "plate.js", "make_daily.js", "make_home.js", "fonts.css", "brand.css", "house.js", "svgfloor.js", "refcarry.js", "card_daily.jpg"]) fs.copyFileSync(path.join(HERE, f), path.join(tmp, f));
      for (const f of fs.readdirSync(HERE).filter(f => /^week-\d{4}-\d{2}-\d{2}\.html$/.test(f))) fs.writeFileSync(path.join(tmp, f), "");
      for (const [script, page] of [["make_daily.js", "levels.html"], ["make_home.js", "index.html"]]) {
        let out = null;
        try { cp.execFileSync(process.execPath, [path.join(tmp, script)], { stdio: "pipe" }); out = fs.readFileSync(path.join(tmp, page), "utf8"); } catch (e) { out = null; }
        check(out !== null && out === rd(page), page + " is the page this daily.json draws (run node " + script + " if not)");
      }
    } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
  }
}
/* 6 and 7 */
const C1 = "This is structural analysis. It is not a recommendation to buy or sell.", C2 = "I develop and sell The Fan, the indicator these levels are read from.";
for (const page of ["levels.html", "index.html"]) {
  let s = ""; try { s = rd(page); } catch (e) {}
  const text = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  check(text.includes(C1 + " " + C2), page + " carries counsel's two lines word for word (note 51)");
  check(/it is not a trade result\./i.test(text), page + " says that held is not a trade result");
  check(!/monday/i.test(s), page + " does not say Monday");
  check(!new RegExp(["close", "earns", "it"].join(" "), "i").test(s), page + " does not say how The Fan's line is worked out");
  check(!/—|–|<!--/.test(s) && !/![\s"<]/.test(text), page + " carries no em dash, exclamation mark or HTML comment");
  check(/data-goatcounter="https:\/\/thesimplifier\.goatcounter\.com\/count"/.test(s), page + " carries the counter (note 37)");
  { let seal = ""; try { seal = require("./house_parts.js").recordSeal(JSON.parse(rd("record.json"))); } catch (e) {}
    const on = (s.match(/data-seal="([0-9a-f]{64})"/) || [])[1];
    check(!!seal && on === seal, page + " carries the record's seal for the plate (" + (on ? on.slice(0, 6).toUpperCase() : "none") + ")"); }
  check(!/buy\.stripe\.com/.test(s), page + " carries no checkout; the plans are on method.html alone");
}
if (fails.length) { console.log("\n" + fails.length + " thing" + (fails.length === 1 ? "" : "s") + " did not hold. Do not upload."); process.exit(1); }
console.log("\nThe daily series verifies.");
