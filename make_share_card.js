#!/usr/bin/env node
/* make_share_card.js · the og:image, one graded row, dark ground
   Added 6 September 2026. Replaces card.html, verify_card.js, card.png and
   card_2026-08-16_gold_4281.png, which were paper and hand-typed.

   WHY ONE GRADED ROW AND NOT THE TALLY. A share image caches on every
   timeline that ever showed the link and cannot be corrected. A tally
   drifts the first Friday a call grades. A graded row never drifts:
   nothing on this record is deleted, so a row graded on a close is true
   permanently. The card carries one row, and every string on it is copied
   from that row in index.html and verified here before anything renders.

   USAGE
     node make_share_card.js                          latest graded row, gold
     node make_share_card.js 2026-08-23 Silver 66.66  a named row
   Writes share_card.html and share_<date>_<metal>_<level>.png (1200 x 630)
   and prints the og:image line to paste into index.html. The file is named
   by its row so that X and WhatsApp, which cache by URL, fetch the new card
   the first time the link is posted after a change.

   RENDER. This script renders the PNG itself when playwright is installed
   (npm i playwright). Without it, render as the tally cards are rendered:
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
       --screenshot="share_<name>.png" "share_card.html"

   BRAND LAW APPLIES. No em dashes, no hashtags, no exclamation marks, no
   emoji, no forecasting, no fabricated data. */
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const idx = fs.readFileSync(path.join(HERE, "index.html"), "utf8");
const CALLS = eval(idx.match(/const CALLS = (\[[\s\S]*?\n\]);/)[1]);

/* ---- pick the row ---------------------------------------------------- */
const [argDate, argMetal, argLevel] = process.argv.slice(2);
const graded = CALLS.filter(c => c.grade === "pass" || c.grade === "miss" || c.grade === "partial");
let row;
if (argDate) {
  row = graded.find(c => c.date === argDate && c.metal.toLowerCase() === String(argMetal).toLowerCase() && c.level === argLevel);
  if (!row) { console.error(`FAIL: no graded row ${argDate} ${argMetal} ${argLevel} in index.html`); process.exit(1); }
} else {
  row = graded.filter(c => c.metal === "Gold").sort((a, b) => a.date < b.date ? 1 : -1)[0];
}

/* ---- pull the strings from the row, never type them -------------------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const longDate = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${MONTHS[+m - 1]}`; };
/* The claim on the card is the row's first sentence, plus the naming sentence
   when the row carries it. A share card is read in two seconds; the full
   row, with its rulings, is one click away. Both are verbatim substrings. */
const fullClaim = row.call.split(/\s*Kill:\s*/i)[0].trim();
/* A sentence ends at a full stop followed by a space or the end, never at a
   decimal point: "labelled 4,350.628" must not be cut to "labelled 4,350." */
const firstSentence = (fullClaim.match(/^[\s\S]*?\.(?=\s|$)/) || [fullClaim])[0].trim();
const claim = firstSentence + (fullClaim.includes("Named before the week opened.") && !firstSentence.includes("Named before") ? " Named before the week opened." : "");
const kill  = (row.call.split(/\s*Kill:\s*/i)[1] || "").trim().replace(/\.$/, "");
if (!kill) { console.error("FAIL: the row carries no Kill: clause"); process.exit(1); }

/* The close, taken from the result sentence "The weekly close printed N". */
const closeM = row.result.match(/weekly close printed ([\d,]+\.?\d*)/i) || row.result.match(/closed the week at ([\d,]+\.?\d*)/i);
if (!closeM) { console.error("FAIL: no close figure found in the row result"); process.exit(1); }
const close = closeM[1];

/* The grade date: for an open-then-graded row, "Close and line read ... <d> <Month>"
   is the grading night; the close itself is the Friday. The row's own date is
   the naming date. The Friday is derived from the naming Sunday: five days on. */
const named = new Date(row.date + "T00:00:00Z");
const friday = new Date(named); friday.setUTCDate(named.getUTCDate() + 5);
const gradedISO = friday.toISOString().slice(0, 10);

const GRADE = { pass: ["Held", "pass"], miss: ["Wrong", "miss"], partial: ["Partial", "partial"] }[row.grade];
const said = row.grade === "miss"
  ? `The kill fired. ${row.metal} closed the week at ${close}.`
  : `The kill never fired. ${row.metal} closed the week at ${close}.`;
const kicker = `Named ${longDate(row.date)} · Graded at the ${longDate(gradedISO)} close`;
const meta = row.metal + "<br>" + (row.type === "Map" ? "Map" : row.type);

/* ---- verify before rendering ------------------------------------------- */
const text = [kicker, row.level, row.metal, claim, kill, GRADE[0], said].join(" ");
const rowText = row.call + " " + row.result + " " + row.level + " " + row.date;
const figures = [...new Set(text.match(/\d[\d,.]*\d|\d/g) || [])];
const unsourced = figures.filter(f => !rowText.includes(f) && f !== String(+row.date.slice(8, 10)) && f !== String(+gradedISO.slice(8, 10)));
const checks = [
  ["row is graded, not open",          ["pass","miss","partial"].includes(row.grade)],
  ["claim is verbatim from the row",   row.call.includes(firstSentence) && (claim === firstSentence || row.call.includes("Named before the week opened."))],
  ["kill is verbatim from the row",    row.call.includes(kill)],
  ["close figure is in the row result", row.result.includes(close)],
  ["grade word matches the grade",     (row.grade === "miss") === (GRADE[0] === "Wrong")],
  ["every figure traces to the row",   unsourced.length === 0],
  ["no em dash on the card",           !text.includes("—")],
  ["no exclamation mark on the card",  !text.includes("!")],
];
let bad = 0;
for (const [name, ok] of checks) { console.log((ok ? "  ok    " : "  FAIL  ") + name); if (!ok) bad++; }
if (unsourced.length) console.log("  unsourced figures: " + unsourced.join(", "));
if (bad) { console.log(`\n${bad} check(s) failed. Nothing written.`); process.exit(1); }

/* ---- the card, dark ground, the record's own palette --------------------- */
const P = { bg:"#141210", rule:"#4A4238", ink:"#EFE8DC", ink3:"#CFC6B8", ink5:"#B8AE9E", ink6:"#8E8474",
            gold:"#CBA43C", miss:"#D2764A", pass:"#5FA57A", partial:"#D9A05B", glow:"rgba(203,164,60,.10)" };
const gradeColor = { pass: P.pass, miss: P.miss, partial: P.partial }[row.grade];
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>The Simplifier · share card source</title>
<!-- GENERATED by make_share_card.js from one CALLS row in index.html:
     ${row.date} · ${row.metal} · ${row.level} · ${row.grade}. Do not edit by hand; edit the ledger. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..600;1,6..72,200..500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--bg:${P.bg};--rule:${P.rule};--ink:${P.ink};--ink-3:${P.ink3};--ink-5:${P.ink5};--ink-6:${P.ink6};--gold:${P.gold};--grade:${gradeColor};
    --serif:'Newsreader',Georgia,serif;--mono:'IBM Plex Mono',ui-monospace,monospace}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:var(--bg);color:var(--ink-3);font-family:var(--serif);font-variant-numeric:tabular-nums;
    -webkit-font-smoothing:antialiased;background-image:radial-gradient(880px 400px at 74% -14%,${P.glow},transparent 70%)}
  .card{width:1200px;height:630px;padding:44px 60px 40px;display:flex;flex-direction:column}
  .masthead{display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid var(--ink)}
  .brand{display:flex;align-items:center;gap:14px}
  .brand svg{width:38px;height:29px;display:block;overflow:visible}
  .brand .name{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--ink)}
  .masthead .desc{font-family:var(--mono);font-size:12px;font-weight:500;letter-spacing:.17em;text-transform:uppercase;color:var(--ink-5)}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:6px 0 0}
  .kicker{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold)}
  .row{display:grid;grid-template-columns:auto 1fr;gap:0 44px;align-items:start;margin-top:22px}
  .lv{font-family:var(--mono);font-size:74px;font-weight:600;line-height:1;letter-spacing:-.028em;color:var(--gold)}
  .lvmeta{font-family:var(--mono);font-size:12px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-5);margin-top:14px;line-height:1.9}
  .claim{font-size:23px;line-height:1.42;color:var(--ink);max-width:34ch}
  .kill{margin-top:14px;padding-left:15px;border-left:3px solid var(--rule);font-family:var(--mono);font-size:14px;line-height:1.6;color:var(--ink-5)}
  .kill b{font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${P.miss};display:block;margin-bottom:3px;font-size:12px}
  .verdict{display:flex;align-items:center;gap:16px;margin-top:22px}
  .grade{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--grade);border:1.5px solid var(--grade);padding:9px 16px;white-space:nowrap}
  .grade .dot{width:9px;height:9px;background:var(--grade);border-radius:50%}
  .verdict .said{font-family:var(--mono);font-size:14px;font-weight:500;color:var(--ink-5);letter-spacing:.04em}
  footer{display:flex;align-items:baseline;justify-content:space-between;padding-top:18px;border-top:1px solid var(--rule)}
  .law{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
  .handle{font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-6)}
</style></head><body>
<div class="card">
  <div class="masthead">
    <div class="brand">
      <svg viewBox="0 0 40 30" fill="none" aria-hidden="true">
        <path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="${P.gold}" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"></path>
        <circle cx="33.5" cy="29" r="2.9" fill="${P.gold}"></circle>
      </svg>
      <span class="name">The Simplifier</span>
    </div>
    <div class="desc">Metals · The record</div>
  </div>
  <div class="body">
    <div class="kicker">${esc(kicker)}</div>
    <div class="row">
      <div><div class="lv">${esc(row.level)}</div><div class="lvmeta">${meta}</div></div>
      <div>
        <p class="claim">${esc(claim)}</p>
        <div class="kill"><b>Kill</b>${esc(kill)}</div>
        <div class="verdict"><span class="grade"><span class="dot"></span>${GRADE[0]}</span><span class="said">${esc(said)}</span></div>
      </div>
    </div>
  </div>
  <footer><span class="law">Named before · Graded after · Nothing deleted</span><span class="handle">thesimplifier7.github.io/record</span></footer>
</div>
</body></html>`;

const pngName = `share_${row.date}_${row.metal.toLowerCase()}_${row.level.replace(/[^\d.]/g, "")}.png`;
fs.writeFileSync(path.join(HERE, "share_card.html"), html);
console.log(`\nshare_card.html written from row ${row.date} ${row.metal} ${row.level} (${row.grade}).`);
console.log(`og:image line for index.html:\n  <meta property="og:image" content="https://thesimplifier7.github.io/record/${pngName}">`);

(async () => {
  let chromium; try { ({ chromium } = require("playwright")); } catch (e) { console.log(`playwright not installed; render share_card.html to ${pngName} by hand.`); return; }
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(HERE, "share_card.html"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(HERE, pngName) });
  await b.close();
  console.log(`${pngName} rendered, 1200 x 630.`);
})();
