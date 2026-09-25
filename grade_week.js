/* =========================================================================
   THE TICK BOOK  ·  grade a week of rows from one export per metal
   24 September 2026, the book v2, by the founder's ruling of that day

   Usage
     node grade_week.js <export.csv>            split and propose, write no grade
     node grade_week.js <export.csv> --write    split, then write the grades

   The export is TradingView's "Export chart data" of the five-minute chart
   of one metal (TVC:GOLD, TVC:SILVER or TVC:PLATINUM), taken after the
   Friday close and covering the week. Its file name must carry the metal:
   gold, silver or platinum. The seals of the week are already in ticks.js,
   opened, from the block seal.html builds.

   For each day ticks.js has a row on for that metal, the export's bars of
   that day in Madrid time are written, every line exactly as exported, to
       tick_YYYY-MM-DD_<metal>_5m.csv
   beside the page, with no folder, because a plain web upload flattens
   folders (note 36). It is the file grade_tick.js grades from, the file
   verify_ticks.js checks against and the file tick.html links as the bars
   that graded the row. Then grade_tick.js runs on each of those files.

   Two refusals, so no row is graded on bars that could not grade it:
     a day the export does not finish (no bar at or after 22:55 Madrid that
       day and no bar on a later day) is not written and not graded;
     a day file already on file is never overwritten. If this export gives
       that day different bars, the script stops and says so.

   After it: node verify_ticks.js, then the record routine.
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const src = args.find(a => !a.startsWith("--"));
const WRITE = args.includes("--write");
if (!src) { console.error("usage: node grade_week.js <five-minute export of the week>.csv [--write]"); process.exit(2); }
const mm = /(gold|silver|platinum)/i.exec(path.basename(src));
if (!mm) { console.error("the export's file name must carry the metal: gold, silver or platinum"); process.exit(2); }
const METAL = mm[1][0].toUpperCase() + mm[1].slice(1).toLowerCase();

/* Madrid time, the same reading as grade_tick.js */
function madridParts(d) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return { day: `${o.year}-${o.month}-${o.day}`, hm: `${o.hour === "24" ? "00" : o.hour}:${o.minute}` };
}

/* the bars, read the way grade_tick.js reads them, each keeping its own line */
const text = fs.readFileSync(src, "utf8").replace(/^﻿/, "");
const lines = text.split(/\r?\n/).filter(l => l.trim());
const headLine = lines[0];
const head = headLine.split(",").map(s => s.trim().toLowerCase());
const iT = head.indexOf("time");
if (iT < 0 || ["open", "high", "low", "close"].some(k => head.indexOf(k) < 0)) { console.error("the export needs time, open, high, low and close columns; it has " + head.join(", ")); process.exit(2); }
const bars = lines.slice(1).map(l => {
  const raw = l.split(",")[iT].trim();
  const t = /^\d{9,13}$/.test(raw) ? new Date(raw.length > 10 ? +raw : +raw * 1000) : new Date(raw);
  return { t, line: l };
}).filter(b => !isNaN(b.t)).sort((a, b) => a.t - b.t);
if (!bars.length) { console.error("no bars read from " + src); process.exit(2); }
bars.forEach(b => { const p = madridParts(b.t); b.day = p.day; b.hm = p.hm; });
const firstDay = bars[0].day, lastDay = bars[bars.length - 1].day;

/* the rows */
const tj = fs.readFileSync("ticks.js", "utf8");
const o = tj.indexOf("const TICKS = ") + "const TICKS = ".length;
const e = tj.indexOf("\n];", o) + 2;
const TICKS = vm.runInNewContext("(" + tj.slice(o, e) + ")", {});
const rows = TICKS.filter(r => r.metal === METAL);
const days = [...new Set(rows.map(r => r.grades))].sort();
console.log(`${METAL}: the export runs ${firstDay} to ${lastDay} (Madrid), ${bars.length} bars; ticks.js has ${rows.length} ${METAL.toLowerCase()} row(s) on ${days.length} day(s).`);
if (!days.length) { console.log("nothing to grade"); process.exit(0); }

const ready = [];
for (const day of days) {
  const own = bars.filter(b => b.day === day);
  if (!own.length) { if (day >= firstDay && day <= lastDay) console.log(`  ${day}: no bars that day in the export, so nothing written`); else console.log(`  ${day}: outside this export`); continue; }
  const finished = own.some(b => b.hm >= "22:55") || bars.some(b => b.day > day);
  if (!finished) { console.log(`  ${day}: the export ends at ${own[own.length - 1].hm} Madrid that day, before the 23:00 close. Not written, not graded: export again after the close.`); continue; }
  const file = `tick_${day}_${METAL.toLowerCase()}_5m.csv`;
  const body = [headLine, ...own.map(b => b.line)].join("\n") + "\n";
  if (fs.existsSync(file)) {
    const have = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
    if (have !== body) { console.error(`  ${day}: ${file} is already on file with other bars. Nothing on file is overwritten; the desk compares the two exports by hand.`); process.exit(1); }
    console.log(`  ${day}: ${file} already on file, identical`);
  } else {
    fs.writeFileSync(file, body);
    console.log(`  ${day}: ${own.length} bars written to ${file}`);
  }
  ready.push(file);
}

for (const file of ready) {
  console.log("\n--- " + file);
  try { process.stdout.write(execFileSync("node", ["grade_tick.js", file].concat(WRITE ? ["--write"] : []), { encoding: "utf8" })); }
  catch (err) { process.stdout.write(String(err.stdout || "")); console.error(String(err.stderr || err.message)); process.exit(1); }
}
console.log(WRITE ? "\nNext: node verify_ticks.js, then the record routine." : "\nProposals only. Add --write to write the grades, then node verify_ticks.js.");
