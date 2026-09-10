/* =========================================================================
   THE TICK BOOK  ·  verifier  ·  10 September 2026
   Run before every upload that touches ticks.js:  node verify_ticks.js

   Every graded row must have the bars that graded it on file, and those
   bars must give the same grade under the rule. A row that fails here does
   not ship. The checks:
     1. every row has the required fields and a parseable named minute
     2. a graded row has ticks/<grades>_<metal>_5m.csv beside the page
     3. re-grading from that file gives the grade the row carries
     4. the result names the grading close printed in the file
     5. a pending row whose grading day is more than a day old is flagged
     6. no em dash or exclamation mark in any result
   ========================================================================= */
const fs = require("fs");
const vm = require("vm");
const { execFileSync } = require("child_process");

let fails = 0;
const ok = (c, m) => { console.log((c ? "  ok    " : "  FAIL  ") + m); if (!c) fails++; };

const tj = fs.readFileSync("ticks.js", "utf8");
const o = tj.indexOf("const TICKS = ") + "const TICKS = ".length;
const e = tj.indexOf("\n];", o) + 2;
const TICKS = vm.runInNewContext("(" + tj.slice(o, e) + ")", {});
console.log("tick book: " + TICKS.length + " row(s)");

const need = ["named", "metal", "side", "level", "kill", "grades", "grade"];
TICKS.forEach((r, i) => {
  const tag = `row ${i + 1} ${r.metal || "?"} ${r.level || "?"} (${r.grades || "?"})`;
  ok(need.every(k => r[k] !== undefined && r[k] !== ""), tag + ": required fields present");
  ok(!isNaN(new Date(r.named)) && /[+-]\d{2}:\d{2}$|Z$/.test(String(r.named)), tag + ": named is an ISO minute with an offset");
  ok(/^(long|short)$/.test(r.side), tag + ": side is long or short");
  ok(/^(pending|pass|miss|notest)$/.test(r.grade), tag + ": grade is a known word");
  const res = String(r.result || "");
  ok(!/[—!]/.test(res), tag + ": result carries no em dash or exclamation mark");
  if (r.grade === "pending") {
    const age = Date.now() - new Date(r.grades + "T23:00:00+02:00").getTime();
    ok(age < 24 * 3600000, tag + ": open row is not more than a day past its grading close" + (age >= 24 * 3600000 ? " (grade it, and say graded late)" : ""));
    return;
  }
  const csv = `ticks/${r.grades}_${String(r.metal).toLowerCase()}_5m.csv`;
  const have = fs.existsSync(csv);
  ok(have, tag + ": bars on file at " + csv);
  ok(res.length > 20, tag + ": result written");
  if (!have) return;
  let out = "";
  try { out = execFileSync("node", ["grade_tick.js", csv], { encoding: "utf8" }); } catch (err) { out = String(err.stdout || err.message); }
  const line = out.split("\n").find(l => l.includes(`named ${r.named}`));
  const next = line ? out.split("\n")[out.split("\n").indexOf(line) + 1] || "" : "";
  const word = { pass: "PASS", miss: "MISS", notest: "NOTEST" }[r.grade];
  ok(next.trim().startsWith(word), tag + ": the bars on file give " + (next.trim().split(/\s+/)[0] || "nothing") + ", the row says " + word);
  const closeM = /close printed ([\d.]+)/.exec(next);
  if (closeM) ok(res.includes(closeM[1]), tag + ": result names the grading close " + closeM[1]);
});

console.log(fails ? `\n${fails} check(s) failed. Do not upload ticks.js.` : "\nThe tick book verifies.");
process.exit(fails ? 1 : 0);
