/* =========================================================================
   THE TICK BOOK  ·  grade a day's rows from the exported bars
   opened 10 September 2026

   Usage
     node grade_tick.js ticks/2026-09-10_gold_5m.csv            propose grades, write nothing
     node grade_tick.js ticks/2026-09-10_gold_5m.csv --write    write grade and result into ticks.js

   The CSV is TradingView's "Export chart data" of the five-minute chart for
   the metal and the day (TVC:GOLD, TVC:SILVER or TVC:PLATINUM), saved under
   ticks/ as  YYYY-MM-DD_<gold|silver|platinum>_5m.csv. Time column may be
   ISO 8601 or a UNIX timestamp; both are read. Export with the chart on
   Europe/Madrid or on UTC, it makes no difference here: every time is
   converted to Madrid before it is compared with anything.

   The rule, applied mechanically and only ever from the bars on file:
     never reached  no five-minute bar from the named minute to the grading
                    bar traded to the level (long: low <= level;
                    short: high >= level)
     wrong          the level was reached and either a five-minute close
                    printed through the kill (long: close < kill;
                    short: close > kill) before the grading bar closed, or
                    the grading close is not on the row's side of the level
     held           the level was reached, no close printed through the
                    kill, and the grading close is on the row's side
                    (long: close > level; short: close < level)
   The grading bar is the last five-minute bar that opens before 23:00
   Madrid on the day the row names; its close is the grading close.

   The result sentence names the times and prints as they stand in the CSV,
   so a reader can open the file and find every figure. The row's level,
   kill, side and named minute are never touched by this script.
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const args = process.argv.slice(2);
const csvPath = args.find(a => !a.startsWith("--"));
const WRITE = args.includes("--write");
if (!csvPath) { console.error("usage: node grade_tick.js ticks/YYYY-MM-DD_<metal>_5m.csv [--write]"); process.exit(2); }

const fname = path.basename(csvPath);
const fm = /^(\d{4}-\d{2}-\d{2})_(gold|silver|platinum)_5m\.csv$/i.exec(fname);
if (!fm) { console.error("file must be named YYYY-MM-DD_<gold|silver|platinum>_5m.csv"); process.exit(2); }
const DAY = fm[1], METAL = fm[2][0].toUpperCase() + fm[2].slice(1).toLowerCase();

/* ---- Madrid time, without a library ---- */
function madridParts(d) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return { day: `${o.year}-${o.month}-${o.day}`, hm: `${o.hour === "24" ? "00" : o.hour}:${o.minute}` };
}
const madridOffsetMin = d => {
  const p = madridParts(d);
  const asUtc = Date.UTC(+p.day.slice(0, 4), +p.day.slice(5, 7) - 1, +p.day.slice(8, 10), +p.hm.slice(0, 2), +p.hm.slice(3, 5));
  return Math.round((asUtc - d.getTime()) / 60000);
};
const zone = d => madridOffsetMin(d) === 60 ? "CET" : "CEST";

/* ---- bars ---- */
const text = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const lines = text.split(/\r?\n/).filter(l => l.trim());
const head = lines[0].split(",").map(s => s.trim().toLowerCase());
const col = n => head.indexOf(n);
const iT = col("time"), iO = col("open"), iH = col("high"), iL = col("low"), iC = col("close");
if ([iT, iO, iH, iL, iC].some(i => i < 0)) { console.error("CSV needs time, open, high, low, close columns; got " + head.join(", ")); process.exit(2); }
const bars = lines.slice(1).map(l => {
  const c = l.split(",");
  const raw = c[iT].trim();
  const t = /^\d{9,13}$/.test(raw) ? new Date(raw.length > 10 ? +raw : +raw * 1000) : new Date(raw);
  return { t, open: c[iO].trim(), high: c[iH].trim(), low: c[iL].trim(), close: c[iC].trim(), o: +c[iO], h: +c[iH], lo: +c[iL], cl: +c[iC] };
}).filter(b => !isNaN(b.t) && isFinite(b.cl)).sort((a, b) => a.t - b.t);
if (!bars.length) { console.error("no bars read"); process.exit(2); }

/* the grading bar: last bar opening before 23:00 Madrid on DAY */
const dayBars = bars.filter(b => madridParts(b.t).day === DAY);
if (!dayBars.length) { console.error("no bars on " + DAY + " in Madrid time; the export covers " + madridParts(bars[0].t).day + " to " + madridParts(bars[bars.length - 1].t).day); process.exit(2); }
const before23 = dayBars.filter(b => madridParts(b.t).hm < "23:00");
if (!before23.length) { console.error("no bar before 23:00 Madrid on " + DAY); process.exit(2); }
const gradeBar = before23[before23.length - 1];
const gradeBarHm = madridParts(gradeBar.t).hm;
const CLOSE_LABEL = gradeBarHm >= "22:55" ? "23:00" : gradeBarHm + " (last bar of the day)";

/* ---- rows ---- */
const tj = fs.readFileSync("ticks.js", "utf8");
const o = tj.indexOf("const TICKS = ") + "const TICKS = ".length;
const e = tj.indexOf("\n];", o) + 2;
const TICKS = vm.runInNewContext("(" + tj.slice(o, e) + ")", {});
const num = s => parseFloat(String(s).replace(/,/g, ""));
const rows = TICKS.filter(r => r.grades === DAY && r.metal === METAL);
if (!rows.length) { console.log("no rows in ticks.js for " + METAL + " on " + DAY); process.exit(0); }

const fmtHm = d => { const p = madridParts(d); return p.hm + " " + zone(d); };
let updated = tj, changed = 0;

rows.forEach(r => {
  const named = new Date(r.named);
  if (isNaN(named)) { console.log("SKIP " + r.level + ": named is not a parseable time: " + r.named); return; }
  if (madridParts(named).day !== DAY) console.log("WARN " + r.level + ": named on " + madridParts(named).day + " Madrid, grades on " + DAY);
  const level = num(r.level), kill = num(r.kill), long = r.side === "long";
  const window = bars.filter(b => b.t >= named && b.t <= gradeBar.t);
  if (!window.length) { console.log("SKIP " + r.level + ": no bars between the named minute and the grading bar"); return; }
  const reachedAt = window.find(b => long ? b.lo <= level : b.h >= level);
  const killBar = window.find(b => long ? b.cl < kill : b.cl > kill);
  const onSide = long ? gradeBar.cl > level : gradeBar.cl < level;
  let grade, result;
  const sideWord = long ? "under" : "over";
  if (!reachedAt) {
    const ext = long ? Math.min(...window.map(b => b.lo)) : Math.max(...window.map(b => b.h));
    grade = "notest";
    result = `Never reached. Named ${fmtHm(named)}; price never traded to ${r.level} before the ${CLOSE_LABEL} close, the ${long ? "low" : "high"} after naming was ${ext}. Counts for neither side.`;
  } else if (killBar) {
    grade = "miss";
    result = `Wrong. Named ${fmtHm(named)}, the level traded at ${fmtHm(reachedAt.t)}, and a five-minute close printed ${killBar.close} at ${fmtHm(new Date(killBar.t.getTime() + 5 * 60000))}, ${sideWord} the kill at ${r.kill}. The row stays.`;
  } else if (!onSide) {
    grade = "miss";
    result = `Wrong. Named ${fmtHm(named)}, the level traded at ${fmtHm(reachedAt.t)}, no five-minute close printed ${sideWord} the kill at ${r.kill}, and the ${CLOSE_LABEL} close printed ${gradeBar.close}, ${long ? "under" : "over"} the level. The row stays.`;
  } else {
    grade = "pass";
    const d = Math.abs(gradeBar.cl - level).toFixed(2);
    result = `Held. Named ${fmtHm(named)}, the level traded at ${fmtHm(reachedAt.t)}, no five-minute close printed ${sideWord} the kill at ${r.kill}, and the ${CLOSE_LABEL} close printed ${gradeBar.close}, ${d} ${long ? "above" : "below"} the level.`;
  }
  const late = r.grade === "pending" && (Date.now() - new Date(DAY + "T23:00:00+02:00").getTime()) > 12 * 3600000;
  if (late) result += " Graded late.";
  console.log(`${METAL} ${r.side} ${r.level} kill ${r.kill} named ${r.named}`);
  console.log(`  ${grade.toUpperCase()}  ${result}`);
  if (r.grade !== "pending" && r.grade !== grade) console.log(`  !! ticks.js says ${r.grade}; the bars say ${grade}`);
  if (WRITE && r.grade === "pending") {
    const key = `named:"${r.named}"`;
    const at = updated.indexOf(key);
    if (at < 0) { console.log("  could not find the row in ticks.js to write"); return; }
    const end = updated.indexOf("}", at);
    const seg = updated.slice(at, end);
    const seg2 = seg.replace(/grade:"pending"/, `grade:"${grade}"`).replace(/result:""/, `result:${JSON.stringify(result)}`);
    if (seg2 === seg) { console.log("  row is not pending with an empty result; nothing written"); return; }
    updated = updated.slice(0, at) + seg2 + updated.slice(end); changed++;
  }
});
if (WRITE && changed) { fs.writeFileSync("ticks.js", updated); console.log(changed + " row(s) written to ticks.js. Run node verify_ticks.js, then node make_record_json.js."); }
else if (WRITE) console.log("nothing written");
else console.log("proposals only; add --write to write them");
