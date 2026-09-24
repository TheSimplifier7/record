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
/* 5 Sep 2026: the crowd and guest arrays. Both may be empty. Neither is in the tally. */
let CROWD = [], GUEST = [], TARGETS = [], OUT = [];
try { CROWD = literal("CROWD"); } catch (e) {}
/* 8 Sep 2026: the bank board and the claims left off it, note 22. */
try { TARGETS = literal("TARGETS"); } catch (e) {}
try { OUT = literal("OUT"); } catch (e) {}
try { GUEST = literal("GUEST"); } catch (e) {}
/* 22 Sep 2026, note 32: the Friday closes the page grades on, the ladder's and This Week's anchor. */
let CLOSES = [];
try { CLOSES = literal("CLOSES"); } catch (e) {}
/* THE TICK BOOK, 9 Sep 2026: rows live in ticks.js beside the page. */
let TICKS = [];
try {
  const tj = fs.readFileSync("ticks.js", "utf8");
  const o = tj.indexOf("const TICKS = ") + "const TICKS = ".length;
  const e = tj.indexOf("\n];", o) + 2;
  TICKS = vm.runInNewContext("(" + tj.slice(o, e) + ")", {});
} catch (e) {}
const LAST_UPDATED = scalar("LAST_UPDATED");
const STANDARD_FROM = scalar("STANDARD_FROM");

/* 24 Sep 2026, note 35: the row's address and the bank row's page, the same
   strings index.html builds with rowAnchor and bankSlug. verify_record.js
   checks the three files agree. */
const rowAnchor = c => "r-" + c.date + "-" + String(c.metal).toLowerCase() + "-" + String(c.level).replace(/,/g, "").replace(/[^0-9]+/g, "-").replace(/^-+|-+$/g, "");
const bankSlug = t => { const h = String(t.source).split(/,\s*(?:as reported|via)\b/i)[0].trim(); const H = ({ "Citi Research": "Citi", "Goldman Sachs Research": "Goldman Sachs", "J.P. Morgan Global Research": "J.P. Morgan" })[h] || h; const s = x => String(x).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); return [s(H), s(t.metal || "Gold"), String(t.level), t.window].join("-"); };

const grades = { pass: "held", miss: "wrong", partial: "partial, counted as wrong", notest: "never reached", pending: "open", nokill: "no kill possible" };
const rows = CALLS.map((c, i) => {
  const parts = String(c.call).split(/\s*Kill:\s*/i);
  const p = PROVENANCE[c.date] || {};
  return {
    /* id is the row's position in the array today and moves when rows go on
       top; anchor is the row's address and does not. Note 35. */
    id: "lrow-" + i,
    anchor: rowAnchor(c),
    url: "https://thesimplifier7.github.io/record/#" + rowAnchor(c),
    named: c.date,
    type: c.type,
    metal: c.metal,
    level: c.level,
    book: c.book || null,
    call: parts[0].trim(),
    kill: parts.length > 1 ? parts.slice(1).join(" ").trim() : null,
    result: c.result || null,
    grade: c.grade,
    /* 24 Sep 2026, note 34: a hit is a held row, marked */
    grade_word: c.hit ? "held, hit the room" : (grades[c.grade] || c.grade),
    ...(c.grammar ? { grammar: 1, side: c.side, line: c.level, room: c.room, odds: c.odds, odds_from: c.oddsFrom || null,
      line_from: c.lineFrom || null, box: c.box || null, last_range: c.lastRange || null, read_at: c.readAt || null,
      close: c.close || null, hit: !!c.hit } : {}),
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
    hit: CALLS.filter(c => c.grade === "pass" && c.hit).length,
    note: "Never reached counts for neither side. A hit is a held row that also went through its room, counted once, as held. Standing calls are not in these figures."
  },
  /* 24 Sep 2026, note 34: the odds board's figures. */
  grammar: (() => {
    const G = CALLS.filter(c => c.grammar), GG = G.filter(c => c.grade === "pass" || c.grade === "miss");
    return { from: scalar("GRAMMAR_FROM"), named: G.length, slate: G.filter(c => c.side === "slate").length, copper: G.filter(c => c.side === "copper").length,
      graded: GG.length, held: GG.filter(c => c.grade === "pass").length, hit: GG.filter(c => c.hit).length, wrong: GG.filter(c => c.grade === "miss").length,
      expected: +GG.reduce((s, c) => s + (+c.odds || 0) / 100, 0).toFixed(2),
      note: "Expected is the sum of the odds each graded row was printed with on the day it was named: what the rows would have held if the read added nothing. See note 34." };
  })(),
  rows,
  standing: STANDING.map(s => ({
    clock: s.clock, position: s.position, stated: s.stated, restated: s.restated || null,
    as_of: s.asOf, read: s.read, status: s.status, kill: s.kill,
    board: s.board && s.board.rows ? s.board.rows.map(r => ({ metal: r.name, line: r.line, close: r.close, distance: r.dist, pct: r.pct, since: r.since, state: r.state })) : null,
    marks: s.marks || null
  })),
  notes: NOTES.slice().sort((a, b) => a.n.localeCompare(b.n)).map(n => ({ n: n.n, kind: n.kind, title: n.title, body: n.body })),
  targets: TARGETS.map(t => ({ ...t, page: bankSlug(t) + ".html" })),   /* note 35: each row's own page; beside the record from note 36 */
  targets_left_off: OUT,
  closes: CLOSES,
  crowd: {
    note: "Claims made in public by others, quoted exactly, given the kill they were published without, graded on the same close. Not this desk's calls. Not in the tally. See note 18.",
    rows: CROWD.map((c, i) => ({ id: "crow-" + i, published: c.date, source: c.source, quote: c.quote, link: c.link, metal: c.metal, kill_assigned: c.kill, graded_on_close: c.gradeDate || null, result: c.result || null, grade: c.grade, grade_word: grades[c.grade] || c.grade }))
  },
  guest: {
    note: "Levels submitted by others, graded by this desk's standard on the same close. Eight per week. Not in the tally. See note 18.",
    rows: GUEST.map((g, i) => ({ id: "grow-" + i, named: g.date, handle: g.handle, metal: g.metal, level: g.level, kill: g.kill, named_at_close: g.namedAt || null, result: g.result || null, grade: g.grade, grade_word: grades[g.grade] || g.grade }))
  },
  tick_book: {
    note: "Intraday calls on the five-minute clock, named and posted before the trade, graded on the 23:00 Madrid close of the day named. Never in the weekly tally. See tick.html.",
    tally: { held: TICKS.filter(t => t.grade === "pass").length, wrong: TICKS.filter(t => t.grade === "miss").length, never_reached: TICKS.filter(t => t.grade === "notest").length, open: TICKS.filter(t => t.grade === "pending").length },
    rows: TICKS.map(t => ({ named: t.named, post: t.post || null, metal: t.metal, side: t.side, level: t.level, kill: t.kill, grades_on: t.grades, result: t.result || null, grade: t.grade, grade_word: grades[t.grade] || t.grade }))
  }
};
fs.writeFileSync("record.json", JSON.stringify(out, null, 2) + "\n");
console.log("record.json written: " + rows.length + " rows, tally " + JSON.stringify(out.tally) + ", crowd " + CROWD.length + ", targets " + TARGETS.length + ", guest " + GUEST.length + ", ticks " + TICKS.length);
