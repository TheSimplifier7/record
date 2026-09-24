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
        no __pycache__ sits beside the page (the 6 September review).
    13. The call grammar, 24 September 2026, note 34: every row named from
        GRAMMAR_FROM carries side, line, room and odds, the room on the
        called side, the line a box edge as read or an own level inside
        last week's range, a kill that matches both, and once graded a close
        that agrees with CLOSES and a grade word the arithmetic gives.
    14. The address of a row, 24 September 2026, note 35: no two rows share
        one, record.json and misses.html carry the address the page builds.
    15. A page for every bank row, 24 September 2026, note 35: record.json
        names the same page the record builds for every target, the page
        and its 1200 x 630 card are in banks/, and the page was written
        with the row's current grade. */
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

/* 5b. THE CLOSES, added 22 September 2026, note 32. The ladder and This Week
   anchor on the last entry of CLOSES, so a Friday grade written without its
   closes would ship a first screen measured from last week. */
let CLOSES = [];
try { CLOSES = grab("CLOSES", "\\[", "\\]"); } catch (e) {}
let recRows = [];
try { recRows = JSON.parse(rd("record.json")).rows || []; } catch (e) {}
const lastGraded = recRows.map(r => r.graded_on_close).filter(Boolean).sort().pop() || "";
const lastClose = CLOSES.length ? CLOSES[CLOSES.length - 1].date : "";
check(CLOSES.length > 0 && lastClose >= lastGraded, `CLOSES ends on ${lastClose || "nothing"}, not behind the newest graded close ${lastGraded}`);
check(CLOSES.every((c, i) => /^\d{4}-\d{2}-\d{2}$/.test(c.date) && new Date(c.date + "T12:00:00Z").getUTCDay() === 5 && (i === 0 || c.date > CLOSES[i - 1].date)),
  "every CLOSES entry is a Friday, in date order");

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

/* 11b. THE COUNT INSIDE A SENTENCE, added 13 September 2026, note 27.
   The closing paragraph of misses.html said "Two of these four" for a day
   while the table above it listed six, because that number was typed once and
   the ledger moved. Any prose count of the wrong rows on that page is checked
   against the ledger here, so the same defect cannot ship twice. */
const WORDN = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };
const afterM = missesText.match(/<p class="after">([\s\S]*?)<\/p>/);
const ofThese = afterM && afterM[1].match(/of these ([a-z]+)/i);
check(!ofThese || WORDN[ofThese[1].toLowerCase()] === tally.miss,
  `misses.html prose count agrees with the ledger` + (ofThese ? ` ("of these ${ofThese[1]}" against ${tally.miss} wrong)` : " (no prose count on the page)"));

/* 12. nothing stale beside the page */
const STALE = ["card.png", "card.html", "card_2026-08-16_gold_4281.png", "desk-01.html", "verify_page.js", "verify_card.js", "verify_ledger.js",
  "xdesk.py", "last_post.json", "__pycache__", "tally_card_vertical.png", "tally_card_vertical.html", "tally_card_landscape.png", "tally_card_landscape.html"];
const present = STALE.filter(f => fs.existsSync(path.join(HERE, f)));
check(present.length === 0, "no superseded file beside the page" + (present.length ? " (still here: " + present.join(", ") + ")" : ""));

/* 13. THE CALL GRAMMAR, added 24 September 2026, note 34. */
const GRAMMAR_FROM = (idx.match(/const GRAMMAR_FROM\s*=\s*"([\d-]+)"/) || [])[1] || "";
check(!!GRAMMAR_FROM, "GRAMMAR_FROM is set (" + (GRAMMAR_FROM || "missing") + ")");
const GR = CALLS.filter(c => c.grammar);
const late = CALLS.filter(c => GRAMMAR_FROM && c.date >= GRAMMAR_FROM && !c.grammar);
check(late.length === 0, "every row named from " + GRAMMAR_FROM + " is named under the grammar" + (late.length ? " (not: " + late.map(c => c.date + " " + c.metal).join(", ") + ")" : ""));
check(GR.every(c => c.date >= GRAMMAR_FROM), "no grammar row is dated before " + GRAMMAR_FROM);
check(CALLS.every(c => !c.hit || (c.grammar && c.grade === "pass")), "a hit is marked only on a held grammar row");
const PN = s => Number(String(s).replace(/,/g, ""));
const fridayOf = iso => { const d = new Date(iso + "T12:00:00Z"); let a = (5 - d.getUTCDay() + 7) % 7; if (a === 0) a = 7; d.setUTCDate(d.getUTCDate() + a); return d.toISOString().slice(0, 10); };
const gprob = [];
for (const c of GR) {
  const lv = PN(c.level), rm = PN(c.room), sl = c.side === "slate", e = [];
  if (!["slate", "copper"].includes(c.side)) e.push("side is not slate or copper");
  if (!isFinite(lv) || !isFinite(rm)) e.push("line or room is not a number");
  else if (sl ? !(rm > lv) : !(rm < lv)) e.push("the room is not on the called side of the line");
  if (!(Number.isInteger(c.odds) && c.odds >= 1 && c.odds <= 99)) e.push("odds are not a whole number from 1 to 99");
  if (!["data window", "formula"].includes(c.oddsFrom)) e.push("oddsFrom is not data window or formula");
  if (c.lineFrom === "box high" || c.lineFrom === "box low") {
    const b = (c.box || []).map(PN), edge = c.lineFrom === "box high" ? b[1] : b[0];
    if (b.length !== 2 || !(b[0] < b[1])) e.push("box is not a low and a high");
    else if (Math.abs(lv - edge) > edge * 0.0003) e.push("the line is not the " + c.lineFrom + " as read");
  } else if (c.lineFrom === "own level") {
    const r = (c.lastRange || []).map(PN);
    if (r.length !== 2 || !(r[0] < r[1])) e.push("lastRange is not a low and a high");
    else if (lv < r[0] || lv > r[1]) e.push("an own level outside last week's range");
    if (c.oddsFrom !== "formula") e.push("an own level's odds come from the formula");
  } else e.push("lineFrom is not box high, box low or own level");
  const k = /Kill:\s*a weekly close (below|above) ([\d,.]+?)\.?\s*$/.exec(c.call || "");
  if (!k) e.push("the call does not end with the kill sentence");
  else if ((k[1] === "below") !== sl || PN(k[2]) !== lv) e.push("the kill does not match the side and the line");
  if (!["pending", "pass", "miss"].includes(c.grade)) e.push("grade " + c.grade + " does not exist under the grammar");
  if (c.grade === "pass" || c.grade === "miss") {
    const cl = PN(c.close);
    if (!c.close || !isFinite(cl)) e.push("graded without its close");
    else {
      const want = sl ? (cl < lv ? "wrong" : cl >= rm ? "hit" : "held") : (cl > lv ? "wrong" : cl <= rm ? "hit" : "held");
      const got = c.grade === "miss" ? "wrong" : c.hit ? "hit" : "held";
      if (want !== got) e.push("graded " + got + ", the close says " + want);
      if (!new RegExp("\\b" + got.toUpperCase() + "\\b").test(c.result || "")) e.push("the result does not carry " + got.toUpperCase());
      const fr = CLOSES.find(x => x.date === fridayOf(c.date));
      if (!fr || PN(fr[c.metal]) !== cl) e.push("the close does not match CLOSES for " + fridayOf(c.date));
    }
  }
  if (e.length) gprob.push(c.date + " " + c.metal + ": " + e.join("; "));
}
check(gprob.length === 0, "the call grammar holds on every grammar row (" + GR.length + ")" + (gprob.length ? "\n          " + gprob.join("\n          ") : ""));
const GG = GR.filter(c => c.grade === "pass" || c.grade === "miss");
const expd = +GG.reduce((s, c) => s + c.odds / 100, 0).toFixed(2);
check(!!(rec && rec.grammar && rec.grammar.named === GR.length && rec.grammar.graded === GG.length && rec.grammar.held === GG.filter(c => c.grade === "pass").length
  && rec.grammar.hit === GG.filter(c => c.hit).length && Math.abs(rec.grammar.expected - expd) < 0.005),
  "record.json carries the odds board's figures (" + GR.length + " named, " + GG.length + " graded, expected " + expd + ")");

/* 14. THE ADDRESS OF A ROW, added 24 September 2026, note 35. */
const fnFrom = (name) => { const m = idx.match(new RegExp("const " + name + " = ([^\\n]+);\\n")); return m ? eval("(" + m[1] + ")") : null; };
const rowAnchor = fnFrom("rowAnchor");
check(typeof rowAnchor === "function", "the page builds a row address (rowAnchor)");
if (typeof rowAnchor === "function") {
  const A = CALLS.map(rowAnchor);
  const dup = A.filter((a, i) => A.indexOf(a) !== i);
  check(dup.length === 0 && A.every(a => /^r-\d{4}-\d{2}-\d{2}-[a-z]+-[0-9]+(-[0-9]+)*$/.test(a)), "every row has an address of its own (" + A.length + ")" + (dup.length ? " (shared: " + dup.join(", ") + ")" : ""));
  const rr = (rec && rec.rows) || [];
  check(rr.length === CALLS.length && rr.every((r, i) => r.anchor === A[i]), "record.json carries the address the page builds on every row");
  const ml = [...missesText.matchAll(/href="index\.html#([^"]+)"/g)].map(m => m[1]).filter(h => /^(r-|lrow-)/.test(h));
  check(ml.length > 0 && ml.every(h => A.includes(h)), "misses.html links every row by its address (" + ml.length + ")");
}

/* 15. A PAGE FOR EVERY BANK ROW, added 24 September 2026, note 35. */
const bankSlug = fnFrom("bankSlug");
let TG = []; try { TG = grab("TARGETS", "\\[", "\\]"); } catch (e) {}
const rt = (rec && rec.targets) || [];
check(typeof bankSlug === "function" && rt.length === TG.length && TG.every((t, i) => rt[i].page === "banks/" + bankSlug(t) + ".html"),
  "record.json names the page the record builds for every bank row (" + TG.length + ")");
const pngWH = f => { try { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; } catch (e) { return [0, 0]; } };
const noPage = rt.filter(t => { const slug = String(t.page || "").replace(/^banks\//, "").replace(/\.html$/, ""); const wh = pngWH(path.join(HERE, "banks", "cards", slug + ".png"));
  return !slug || !fs.existsSync(path.join(HERE, "banks", slug + ".html")) || wh[0] !== 1200 || wh[1] !== 630; });
check(rt.length > 0 && noPage.length === 0, "every bank row has its page and its 1200 x 630 card in banks/" + (noPage.length ? " (missing: " + noPage.map(t => t.page).join(", ") + ")" : ""));
const stalePg = rt.filter(t => { try { return !rd(t.page).includes('<body data-grade="' + t.grade + '">'); } catch (e) { return true; } });
check(stalePg.length === 0, "every bank page carries its row's grade (run node make_bank_pages.js after any bank grade)" + (stalePg.length ? " (stale: " + stalePg.map(t => t.page).join(", ") + ")" : ""));

console.log(fails.length ? `\n${fails.length} CHECK(S) FAILED. Do not upload.` : "\nThe record verifies. Safe to upload.");
process.exit(fails.length ? 1 : 0);
