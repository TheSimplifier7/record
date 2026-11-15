/* =========================================================================
   distance_core.js  ·  15 November 2026, HALLMARK

   How far, and how likely. From record.json alone: every graded weekly
   level with a stated side (a floor or a ceiling) and a Friday close on
   file before it was named, set against that close; which way it asked
   price to go; and how often a level that far away held in any week on
   file, read from the week-on-week changes in record.json's own closes.
   No market data comes from anywhere else, and nothing here writes to
   the record. make_distance.js draws the page; verify_record.js works
   the same figures out again and checks the page carries them.
   ========================================================================= */
"use strict";
const N = s => Number(String(s).replace(/,/g, ""));
const METALS = ["Gold", "Silver", "Platinum"];

function distance(R) {
  const closes = R.closes.slice().sort((a, b) => a.date.localeCompare(b.date));
  const ret = {};
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1], b = closes[i];
    if ((Date.parse(b.date) - Date.parse(a.date)) / 864e5 !== 7) continue;
    for (const m of METALS) if (a[m] && b[m]) (ret[m] = ret[m] || []).push(N(b[m]) / N(a[m]) - 1);
  }
  const graded = R.rows.filter(r => r.grade === "pass" || r.grade === "miss");
  const rows = [];
  for (const r of graded) {
    if (r.side !== "slate" && r.side !== "copper") continue;
    const prev = closes.filter(c => c.date < r.named && c[r.metal]).pop();
    const rs = ret[r.metal] || [];
    if (!prev || !rs.length) continue;
    const floor = r.side === "slate";
    const q = N(r.level) / N(prev[r.metal]) - 1;
    const base = rs.filter(x => floor ? x >= q : x <= q).length / rs.length;
    rows.push({ named: r.named, metal: r.metal, side: floor ? "floor" : "ceiling", level: r.level, last: prev[r.metal], lastDate: prev.date,
      pct: q * 100, against: floor ? q > 0 : q < 0, base, held: r.grade === "pass", anchor: r.anchor });
  }
  const sum = list => ({ n: list.length, held: list.filter(x => x.held).length, expected: list.reduce((s, x) => s + x.base, 0) });
  return {
    rows,
    all: sum(rows),
    against: sum(rows.filter(x => x.against)),
    room: sum(rows.filter(x => !x.against)),
    weeks: Object.fromEntries(METALS.map(m => [m, (ret[m] || []).length])),
    left: graded.length - rows.length,
    graded: graded.length
  };
}
module.exports = { distance };
