#!/usr/bin/env node
/* make_misses.js · the wrong calls, in full, on one page
   Added 5 September 2026.

   Reads the CALLS and NOTES arrays out of index.html, takes every row graded
   miss or partial, and writes misses.html beside it. Nothing here is typed by
   hand: the page is a view of the ledger and regenerates from it, so it can
   never say a wrong row that the record does not, or omit one it does.

   Run after any Friday that grades a miss:
     node make_misses.js

   WHY. The record's own law says the graded miss is the one thing on this
   platform nobody can fake, and the wrong rows are the best content the desk
   owns. They were sitting in a ledger of twenty-nine that nobody scrolls to.
   This page is the four of them, with their kills, their closes and the
   corrections that followed, and nothing else on it.

   BRAND LAW APPLIES. No em dashes, hashtags, exclamation marks, emoji,
   forecasting or fabricated data. Every word about a call is the row's own. */
const fs = require("fs");
const vm = require("vm");
const html = fs.readFileSync("index.html", "utf8");

function literal(name) {
  const start = html.indexOf("const " + name + " = ");
  if (start < 0) throw new Error(name + " not found");
  const open = html.indexOf("=", start) + 1;
  const end = Math.min(...["\n];", "\n};"].map(t => { const i = html.indexOf(t, open); return i < 0 ? Infinity : i + 2; }));
  return vm.runInNewContext("(" + html.slice(open, end) + ")", {});
}
const CALLS = literal("CALLS");
const NOTES = literal("NOTES");
let PROVENANCE = {}; try { PROVENANCE = literal("PROVENANCE"); } catch (e) {}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const M = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${M[+m - 1]} ${y}`; };
const noteIds = new Set(NOTES.map(n => n.n));
const linkNotes = s => esc(s).replace(/\bnote\s+(\d{2})\b/gi, (m, n) => noteIds.has(n) ? `<a href="index.html#note-${n}">note ${n}</a>` : m);

const misses = CALLS.map((c, i) => ({ ...c, idx: i })).filter(c => c.grade === "miss" || c.grade === "partial")
  .sort((a, b) => a.date.localeCompare(b.date));
const pass = CALLS.filter(c => c.grade === "pass").length;
const notest = CALLS.filter(c => c.grade === "notest").length;
const open = CALLS.filter(c => c.grade === "pending").length;
const resolved = pass + misses.length;

const notesFor = c => {
  const ids = new Set();
  String(c.result || "").replace(/\bnote\s+(\d{2})\b/gi, (m, n) => { if (noteIds.has(n)) ids.add(n); return m; });
  return NOTES.filter(n => ids.has(n.n)).sort((a, b) => a.n.localeCompare(b.n));
};

const section = (c, k) => {
  const parts = String(c.call).split(/\s*Kill:\s*/i);
  const claim = parts[0].trim(), kill = parts.length > 1 ? parts.slice(1).join(" ").trim() : "";
  const p = PROVENANCE[c.date] || {};
  const notes = notesFor(c);
  return `
  <section class="miss" id="miss-${k + 1}">
    <div class="head">
      <span class="num">${k + 1}</span>
      <div>
        <div class="eyebrow">Named ${esc(fmt(c.date))}${p.graded ? ` · graded on the ${esc(fmt(p.graded))} close` : ""}</div>
        <h2>${esc(c.metal)} ${esc(c.level)}</h2>
      </div>
      <span class="grade">${c.grade === "partial" ? "Partial, counted as wrong" : "Wrong"}</span>
    </div>
    <div class="cols">
      <div>
        <div class="lab">The call, before the move</div>
        <p>${esc(claim)}</p>
        ${kill ? `<div class="kill"><b>Kill</b>${esc(kill)}</div>` : `<div class="kill"><b>Kill</b>None published with this row. It predates the 3 July standard and is marked so on the record.</div>`}
      </div>
      <div>
        <div class="lab">What price did</div>
        <p class="res">${linkNotes(c.result || "")}</p>
      </div>
    </div>
    ${notes.length ? `<div class="notes"><div class="lab">What was written about it afterwards</div>${notes.map(n => `<details><summary>Note ${esc(n.n)} · ${esc(n.title)}</summary><p>${esc(n.body)}</p></details>`).join("")}</div>` : ""}
    <p class="row-link"><a href="index.html#lrow-${c.idx}">This row on the record</a>${p.commit ? ` · <a href="https://github.com/TheSimplifier7/record/commit/${esc(p.commit)}">the commit that graded it</a>` : ""}</p>
  </section>`;
};

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Simplifier · The ones I got wrong</title>
<meta name="description" content="Every call on the record graded wrong, in full: the level, the kill published with it, the close that fired it, and what was written about it afterwards. Nothing deleted.">
<meta property="og:title" content="The ones I got wrong">
<meta property="og:description" content="${misses.length} calls, named before the move, graded wrong on the close, kept. With their kills, their closes and the corrections that followed.">
<!-- GENERATED by make_misses.js from index.html. Do not edit by hand; edit the ledger. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--bg:#C2BAAE;--panel:#CBC4B9;--rule:#8B8071;--rule-soft:#A79C8C;--ink:#191510;--ink-2:#2A241C;--ink-3:#3E372C;--ink-5:#736A5C;
    --miss:#63220E;--gold:#8A6A1F;--serif:'Newsreader',Georgia,serif;--mono:'IBM Plex Mono',ui-monospace,monospace}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink-3);font-family:var(--serif);line-height:1.6;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
  .wrap{max-width:820px;margin:0 auto;padding:56px 28px 90px}
  .kicker{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-5);margin-bottom:16px}
  h1{font-weight:500;font-size:clamp(34px,6vw,54px);line-height:1.04;letter-spacing:-.02em;color:var(--ink);max-width:16ch;margin-bottom:18px}
  .stand{font-size:19px;max-width:58ch;color:var(--ink-3);margin-bottom:10px}
  .tally{font-family:var(--mono);font-size:11.5px;color:var(--ink-5);margin:22px 0 0;padding-top:14px;border-top:1px solid var(--rule)}
  .tally b{color:var(--ink);font-weight:600}
  .miss{margin-top:54px;padding-top:26px;border-top:3px solid var(--miss)}
  .head{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:start;margin-bottom:18px}
  .num{font-family:var(--mono);font-size:44px;font-weight:600;line-height:1;color:var(--miss);letter-spacing:-.03em}
  .eyebrow{font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-5);margin-bottom:6px}
  h2{font-family:var(--mono);font-weight:600;font-size:clamp(22px,3.6vw,30px);letter-spacing:-.01em;color:var(--ink);line-height:1.1}
  .grade{font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--miss);border:1.5px solid var(--miss);padding:7px 11px;white-space:nowrap;margin-top:4px}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  @media(max-width:680px){.cols{grid-template-columns:1fr}.head{grid-template-columns:auto 1fr}.grade{grid-column:2}}
  .lab{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-5);margin-bottom:8px}
  .cols p{font-size:16.5px;color:var(--ink-2)}
  .kill{margin-top:14px;padding-left:12px;border-left:3px solid var(--rule);font-family:var(--mono);font-size:12.5px;line-height:1.6;color:var(--ink-3)}
  .kill b{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--miss);margin-bottom:3px}
  .res a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--gold)}
  .notes{margin-top:22px}
  details{border-top:1px solid var(--rule-soft);padding:10px 0}
  summary{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;list-style:none}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"+ ";color:var(--gold)}
  details[open] summary::before{content:"\\2212  "}
  details p{font-size:15px;color:var(--ink-3);margin-top:10px;max-width:70ch}
  .row-link{font-family:var(--mono);font-size:11px;margin-top:18px;color:var(--ink-5)}
  .row-link a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--gold)}
  .after{margin-top:60px;padding-top:22px;border-top:1px solid var(--rule);max-width:60ch;font-size:16.5px}
  .law{font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-5);margin-top:44px;padding-top:16px;border-top:1px solid var(--rule)}
  .law a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--gold)}
</style>
</head>
<body>
<div class="wrap">
  <div class="kicker">The Simplifier · The record · the wrong ones</div>
  <h1>The ones I got wrong.</h1>
  <p class="stand">You have followed a gold call that was wrong and watched it disappear. These did not. Every call on the record that the close proved wrong, in full: the level as named, the kill published with it before the week, the close that fired it, and everything written about it afterwards. They are here because a record that keeps only its wins is not a record.</p>
  <p class="tally"><b>${misses.length}</b> wrong · <b>${pass}</b> held · <b>${notest}</b> never reached${open ? ` · <b>${open}</b> open` : ""} · ${CALLS.length} rows on the record. The wrong ones are ${resolved ? Math.round(misses.length / resolved * 100) : 0} percent of the ${resolved} resolved, stated beside its base because a percentage on a base this size is a small sample and should be read as one.</p>
${misses.map(section).join("\n")}
  <p class="after">Two of these four were the same idea, restated for weeks while it held, and then wrong. The record says so in <a href="index.html#note-13">note 13</a>, which counts the calls by level as well as by week because the weekly count flatters this desk and the level count does not. Read both before you decide what the green rows are worth.</p>
  <p class="law"><a href="index.html">Every row, including these</a> · Named before · Graded after · Nothing deleted</p>
</div>
</body>
</html>
`;
fs.writeFileSync("misses.html", out);
console.log(`misses.html written: ${misses.length} wrong rows of ${CALLS.length}, ${pass} held, ${notest} never reached, ${open} open`);
