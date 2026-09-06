#!/usr/bin/env node
/* verify_record.js · the pre-upload gate for the record
   Added 6 September 2026. Replaces verify_page.js, verify_card.js and
   verify_ledger.js, all three of which had stopped matching the page they
   were written for (verify_page.js was reading the theme script as the
   page script and crashing; nobody noticed because nobody ran it).

   Run before every upload, from the repo folder:
     node verify_record.js
   Exits non-zero on the first thing that would ship wrong. Nothing here
   edits a file; it only reads.

   What it checks, and why each one exists:
     1. Every row carries a grade this page can draw.
     2. The tally typed into the HTML placeholders equals the tally the
        script computes, so a reader with scripts off sees the same count.
     3. Every row date has a provenance line; open rows are marked open;
        graded rows carry the date they were graded.
     4. LAST_UPDATED is not behind the newest provenance date.
     5. The standing board's arithmetic holds (the same gate the page runs).
     6. The og:image named in the head exists in this folder, 1200 x 630.
     7. The meta description carries no figure (it cached stale once).
     8. No em dash and no exclamation mark in any published string.
     9. Note numbers are unique (they are never renumbered).
    10. record.json agrees with the page on the tally and the stamp.
    11. misses.html carries the same count of wrong rows.
    12. No paper tally card, no card.png, no desk-01.html, no xdesk.py and
        no __pycache__ sits beside the page (the 6 September review). */
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const rd = f => fs.readFileSync(path.join(HERE, f), "utf8");
const idx = rd("index.html");
/* Head tags are matched on the page with its HTML comments removed, because
   replaced lines are kept in comments beside the line that replaced them. */
const head = idx.split("<style>")[0].replace(/<!--[\s\S]*?-->/g, "");

const grab = (name, open, close) => {
  const m = idx.match(new RegExp("const " + name + " = (" + open + "[\\s\\S]*?\\n" + close + ");"));
  if (!m) throw new Error(name + " not found in index.html");
  return eval("(" + m[1] + ")");
};
const CALLS = grab("CALLS", "\\[", "\\]");
const NOTES = grab("NOTES", "\\[", "\\]");
const STANDING = grab("STANDING", "\\[", "\\]");
const PROVENANCE = grab("PROVENANCE", "\\{", "\\}");
const LAST_UPDATED = (idx.match(/const LAST_UPDATED\s*=\s*"([\d-]+)"/) || [])[1];

const fails = [];
const check = (ok, msg) => { console.log((ok ? "  ok    " : "  FAIL  ") + msg); if (!ok) fails.push(msg); };

/* 1. grades */
const GRADES = ["pass", "miss", "partial", "notest", "pending", "nokill"];
check(CALLS.every(c => GRADES.includes(c.grade)), "every row carries a grade the page can draw (" + CALLS.length + " rows)");

/* 2. tally in the static placeholders */
const n = g => CALLS.filter(c => c.grade === g).length;
const tally = { pass: n("pass"), miss: n("miss"), partial: n("partial"), notest: n("notest"), open: n("pending") };
tally.resolved = tally.pass + tally.miss + tally.partial;
const ph = id => +((idx.match(new RegExp('id="' + id + '">\\s*(\\d+)\\s*<')) || [])[1]);
check(ph("t-resolved") === tally.resolved && ph("t-pass") === tally.pass && ph("t-miss") === tally.miss && ph("t-open") === tally.open,
  `static tally placeholders read ${ph("t-resolved")}/${ph("t-pass")}/${ph("t-miss")}/${ph("t-open")}, computed ${tally.resolved}/${tally.pass}/${tally.miss}/${tally.open}`);

/* 3. provenance */
const dates = [...new Set(CALLS.map(c => c.date))];
const noProv = dates.filter(d => !PROVENANCE[d]);
check(noProv.length === 0, "every row date has a provenance line" + (noProv.length ? " (missing: " + noProv.join(", ") + ")" : ""));
const openDates = [...new Set(CALLS.filter(c => c.grade === "pending").map(c => c.date))];
check(openDates.every(d => PROVENANCE[d] && PROVENANCE[d].open === true), "open rows are marked open in provenance (" + openDates.join(", ") + ")");
const gradedDates = dates.filter(d => !openDates.includes(d) && PROVENANCE[d] && !PROVENANCE[d].first);
check(gradedDates.every(d => PROVENANCE[d].graded), "graded rows carry the date they were graded");

/* 4. stamp */
const provDates = Object.values(PROVENANCE).flatMap(p => [p.written, p.graded, p.first]).filter(Boolean).sort();
check(LAST_UPDATED && LAST_UPDATED >= provDates[provDates.length - 1], `LAST_UPDATED ${LAST_UPDATED} is not behind the newest provenance date ${provDates[provDates.length - 1]}`);

/* 5. the standing board, same arithmetic as boardFault */
const num = s => Number(String(s).replace(/[,%+\s]/g, ""));
const boardRows = STANDING.flatMap(s => (s.board && s.board.rows) || []);
check(boardRows.length > 0, "the standing board carries rows (" + boardRows.length + ")");
for (const r of boardRows) {
  const dist = num(r.close) - num(r.line), pct = dist / num(r.line) * 100;
  check(Math.abs(dist - num(r.dist)) <= 0.0015 && Math.abs(pct - num(r.pct)) <= 0.01,
    `standing board ${r.name}: ${r.close} against ${r.line} is ${r.dist}, ${r.pct}`);
}

/* 6. og:image */
const og = (head.match(/<meta property="og:image" content="[^"]*\/([^"\/]+)">/) || [])[1];
const ogPath = og && path.join(HERE, og);
let ogOk = false, ogDims = "missing";
if (og && fs.existsSync(ogPath)) {
  const b = fs.readFileSync(ogPath);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  ogDims = w + " x " + h; ogOk = w === 1200 && h === 630;
}
check(ogOk, `og:image ${og} is in this folder at 1200 x 630 (${ogDims})`);

/* 7. meta description carries no figure */
const desc = (head.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
check(desc && !/\d/.test(desc), "meta description is figure-free");

/* 8. brand law in published strings */
const strings = [];
const walk = v => { if (typeof v === "string") strings.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
walk(CALLS); walk(NOTES); walk(STANDING);
const emd = strings.filter(s => s.includes("—")), bang = strings.filter(s => s.includes("!"));
check(emd.length === 0, "no em dash in any ledger, note or standing string" + (emd.length ? " (" + emd.length + " found)" : ""));
check(bang.length === 0, "no exclamation mark in any ledger, note or standing string" + (bang.length ? " (" + bang.length + " found)" : ""));

/* 9. notes */
const nums = NOTES.map(x => x.n);
check(new Set(nums).size === nums.length, "note numbers are unique (" + NOTES.length + " notes)");

/* 10. record.json */
let rec = null; try { rec = JSON.parse(rd("record.json")); } catch (e) {}
check(rec && rec.tally && rec.tally.held === tally.pass && rec.tally.wrong === tally.miss && rec.tally.open === tally.open && rec.last_updated === LAST_UPDATED,
  "record.json agrees with the page (run node make_record_json.js after any edit)");

/* 11. misses.html */
let missCount = null; try { missCount = (rd("misses.html").match(/class="miss-row"|class="mrow"/g) || []).length || null; } catch (e) {}
const missesText = fs.existsSync(path.join(HERE, "misses.html")) ? rd("misses.html") : "";
check(missesText.includes(`${tally.miss} calls, named before the move, graded wrong`) || missesText.includes(`content="${tally.miss} `),
  `misses.html states ${tally.miss} wrong rows (run node make_misses.js after any grade)`);

/* 12. nothing stale beside the page */
const STALE = ["card.png", "card.html", "card_2026-08-16_gold_4281.png", "desk-01.html", "verify_page.js", "verify_card.js", "verify_ledger.js",
  "xdesk.py", "last_post.json", "__pycache__", "tally_card_vertical.png", "tally_card_vertical.html", "tally_card_landscape.png", "tally_card_landscape.html"];
const present = STALE.filter(f => fs.existsSync(path.join(HERE, f)));
check(present.length === 0, "no superseded file beside the page" + (present.length ? " (still here: " + present.join(", ") + ")" : ""));

console.log(fails.length ? `\n${fails.length} CHECK(S) FAILED. Do not upload.` : "\nThe record verifies. Safe to upload.");
process.exit(fails.length ? 1 : 0);
