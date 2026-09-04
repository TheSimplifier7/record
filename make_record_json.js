#!/usr/bin/env node
/* make_record_json.js · writes record.json from index.html
   Run from the repository root, after editing index.html and before committing:
     node make_record_json.js
   Reads the CALLS, STANDING, NOTES and PROVENANCE arrays out of index.html
   with a plain JavaScript evaluation of those literals, nothing else, and
   writes record.json beside it. No network, no dependencies. */
const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");

function literal(name) {
  const start = html.indexOf("const " + name + " = ");
  if (start < 0) throw new Error(name + " not found");
  const open = html.indexOf("=", start) + 1;
  const end = html.indexOf("\n};", open) > 0 && html.indexOf("\n];", open) < 0
    ? html.indexOf("\n};", open) + 2
    : Math.min(...["\n];", "\n};"].map(t => { const i = html.indexOf(t, open); return i < 0 ? Infinity : i + 2; }));
  return vm.runInNewContext("(" + html.slice(open, end) + ")", {});
}
const scalar = name => {
  const m = html.match(new RegExp("const " + name + "\\s*=\\s*\"([^\"]+)\""));
  return m ? m[1] : null;
};

const CALLS = literal("CALLS");
const STANDING = literal("STANDING");
const NOTES = literal("NOTES");
let PROVENANCE = {};
try { PROVENANCE = literal("PROVENANCE"); } catch (e) {}
const LAST_UPDATED = scalar("LAST_UPDATED");
const STANDARD_FROM = scalar("STANDARD_FROM");

const grades = { pass: "held", miss: "wrong", partial: "partial, counted as wrong", notest: "never reached", pending: "open" };
const rows = CALLS.map((c, i) => {
  const parts = String(c.call).split(/\s*Kill:\s*/i);
  const p = PROVENANCE[c.date] || {};
  return {
    id: "lrow-" + i,
    named: c.date,
    type: c.type,
    metal: c.metal,
    level: c.level,
    book: c.book || null,
    call: parts[0].trim(),
    kill: parts.length > 1 ? parts.slice(1).join(" ").trim() : null,
    result: c.result || null,
    grade: c.grade,
    grade_word: grades[c.grade] || c.grade,
    pre_standard: STANDARD_FROM ? c.date < STANDARD_FROM : null,
    graded_on_close: p.graded || null,
    graded_at: p.graded ? p.graded + "T23:00:00+02:00" : null,
    written: p.written || p.first || null,
    commit: p.commit ? "https://github.com/TheSimplifier7/record/commit/" + p.commit : null
  };
});
const count = g => CALLS.filter(c => c.grade === g).length;
const out = {
  title: "The Simplifier · The Record",
  url: "https://thesimplifier7.github.io/record/",
  source: "https://github.com/TheSimplifier7/record/blob/main/index.html",
  history: "https://github.com/TheSimplifier7/record/commits/main",
  standard_from: STANDARD_FROM,
  last_updated: LAST_UPDATED,
  generated: new Date().toISOString(),
  tally: {
    resolved: count("pass") + count("miss") + count("partial"),
    held: count("pass"),
    wrong: count("miss") + count("partial"),
    never_reached: count("notest"),
    open: count("pending"),
    note: "Never reached counts for neither side. Standing calls are not in these figures."
  },
  rows,
  standing: STANDING.map(s => ({
    clock: s.clock, position: s.position, stated: s.stated, restated: s.restated || null,
    as_of: s.asOf, read: s.read, status: s.status, kill: s.kill,
    board: s.board && s.board.rows ? s.board.rows.map(r => ({ metal: r.name, line: r.line, close: r.close, distance: r.dist, pct: r.pct, since: r.since, state: r.state })) : null,
    marks: s.marks || null
  })),
  notes: NOTES.slice().sort((a, b) => a.n.localeCompare(b.n)).map(n => ({ n: n.n, kind: n.kind, title: n.title, body: n.body }))
};
fs.writeFileSync("record.json", JSON.stringify(out, null, 2) + "\n");
console.log("record.json written: " + rows.length + " rows, tally " + JSON.stringify(out.tally));
