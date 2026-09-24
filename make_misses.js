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
   This page is every one of them, with their kills, their closes and the
   corrections that followed, and nothing else on it. Every count on it is
   counted from CALLS, including the ones inside sentences.

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

/* 24 Sep 2026, note 35: link each row by its address, which does not move
   when new rows go on top. The same string index.html builds. */
const rowAnchor = c => "r-" + c.date + "-" + String(c.metal).toLowerCase() + "-" + String(c.level).replace(/,/g, "").replace(/[^0-9]+/g, "-").replace(/^-+|-+$/g, "");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* 24 Sep 2026, note 37: the page's own link card, drawn by make_link_cards.js, which runs after
   this file in the routine and sets the address again with the card's hash. */
const CARD = (() => { try { const c = JSON.parse(fs.readFileSync("link_cards.json", "utf8")).cards.find(x => x.name === "misses"); if (c && /^https:\/\//.test(c.image)) return c.image; } catch (e) {} return "https://thesimplifier7.github.io/record/link_misses.png"; })();
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

/* THE REPEAT SENTENCE, derived 13 September 2026, was hard coded until tonight.
   It read "Two of these four were the same idea" while the ledger above it
   showed six wrong rows, because the count moved on the 11 September grade and
   the sentence did not. A page whose whole claim is that it counts itself
   exactly cannot print a total its own table contradicts. Both numbers now
   come out of CALLS, and the repeat is found on the band rule the ladder
   already uses (note 23): two levels are the same line when they sit within
   0.1 percent of each other on the same metal. Today that is gold 4,098 from
   12 July and gold 4,098.275 from 7 August, which is the pair the sentence has
   always been about. If no pair repeats, the sentence about repeats is not
   printed at all rather than reworded into something the data does not say.
   See note 27. */
const numOf = s => parseFloat(String(s).replace(/,/g, ""));
const WORD = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
const word = n => (n < WORD.length ? WORD[n] : String(n));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const sameLine = (a, b) => {
  const x = numOf(a.level), y = numOf(b.level);
  return a.metal === b.metal && isFinite(x) && isFinite(y) && Math.abs(x - y) <= 0.001 * Math.max(x, y);
};
const repeats = misses.filter((a, i) => misses.some((b, j) => j !== i && sameLine(a, b))).length;
const afterText = repeats >= 2
  ? `${cap(word(repeats))} of these ${word(misses.length)} were the same idea, restated for weeks while it held, and then wrong. The record says so in <a href="index.html#note-13">note 13</a>, which counts the calls by level as well as by week because the weekly count flatters this desk and the level count does not. Read both before you decide what the green rows are worth.`
  : `The record counts these by level as well as by week in <a href="index.html#note-13">note 13</a>, because the weekly count flatters this desk and the level count does not. Read both before you decide what the green rows are worth.`;

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
    <p class="row-link"><a href="index.html#${rowAnchor(c)}">This row on the record</a>${p.commit ? ` · <a href="https://github.com/TheSimplifier7/record/commit/${esc(p.commit)}">the commit that graded it</a>` : ""}</p>
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
<!-- the link card, 24 Sep 2026, note 37 on the record -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://thesimplifier7.github.io/record/misses.html">
<meta property="og:image" content="${CARD}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<!-- GENERATED by make_misses.js from index.html. Do not edit by hand; edit the ledger. -->
<meta name="color-scheme" content="dark light">
<script>
/* Same ground as the record (note 20): dark, unless the reader pressed Paper
   on the record page, which is stored on this device. */
(function(){var t=null;try{t=localStorage.getItem("theme");}catch(e){}
if(t==="light")document.documentElement.setAttribute("data-theme","light");})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--bg:#141210;--panel:#1D1A16;--rule:#4A4238;--rule-soft:#3A342C;--ink:#EFE8DC;--ink-2:#E3DCCE;--ink-3:#CFC6B8;--ink-5:#B8AE9E;
    --miss:#D2764A;--gold:#CBA43C;--serif:'Newsreader',Georgia,serif;--mono:'IBM Plex Mono',ui-monospace,monospace;color-scheme:dark}
  :root[data-theme="light"]{--bg:#C2BAAE;--panel:#CBC4B9;--rule:#8B8071;--rule-soft:#A79C8C;--ink:#191510;--ink-2:#2A241C;--ink-3:#3E372C;--ink-5:#736A5C;
    --miss:#63220E;--gold:#8A6A1F;color-scheme:light}
  body{-webkit-font-smoothing:antialiased} :root[data-theme="light"] body{-webkit-font-smoothing:auto}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink-3);font-family:var(--serif);line-height:1.6;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
  .wrap{max-width:820px;margin:0 auto;padding:56px 28px 90px}
  .kicker{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-5);margin-bottom:16px}
  .nav{display:flex;gap:22px;flex-wrap:wrap;padding:0 0 26px;font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
  .nav a{color:var(--ink-5);border-bottom:1px solid transparent;padding-bottom:2px;text-decoration:none}
  .nav a:hover{color:var(--ink);border-bottom-color:var(--gold)}
  .nav a.here{color:var(--ink);border-bottom-color:var(--gold)}
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
  /* 24 Sep 2026, note 37 on the record: on a phone the nav is one row that
     scrolls, each place a thumb's height, the page you are on underlined. */
  @media(max-width:760px){
    .nav{position:relative;flex-wrap:nowrap;gap:0;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding-top:4px;font-size:11px;letter-spacing:.13em}
    .nav::-webkit-scrollbar{display:none}
    .nav a{flex:0 0 auto;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;white-space:nowrap;border-bottom:0}
    .nav a:first-child{padding-left:0}
    .nav a:last-child{padding-right:18px}
    .nav a.here{text-decoration-line:underline;text-decoration-color:var(--gold);text-decoration-thickness:1.5px;text-underline-offset:7px}
    .nav.nav-r{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 44px),transparent)}
    .nav.nav-l{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px);mask-image:linear-gradient(90deg,transparent,#000 36px)}
    .nav.nav-l.nav-r{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 44px),transparent);mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 44px),transparent)}
  }
  /* 24 Sep 2026, note 37 on the record: reading text 12px at least on a phone, labels 10.5px. */
  @media(max-width:760px){.tally,.row-link{font-size:12px}.row-link a{display:inline-block;padding:10px 0}.lab,.eyebrow,.grade,.kill b{font-size:10.5px}}
</style>
<!-- THE COUNTER, 24 Sep 2026, note 37 on the record. GoatCounter: no cookies, no personal data,
     and the page reads the same without it. -->
<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body>
<div class="wrap">
  <div class="kicker">The Simplifier · The record · the wrong ones</div>
  <nav class="nav" aria-label="Pages">
    <a href="./">The record</a>
    <a href="targets.html">The banks, graded</a>
    <a href="misses.html" class="here">The wrong ones</a>
    <a href="tick.html">The tick book</a>
    <a href="method.html">The Method</a>
    <a href="./#doors">The seat</a>
  </nav>
  <h1>The ones I got wrong.</h1>
  <p class="stand">You have followed a gold call that was wrong and watched it disappear. These did not. Every call on the record that the close proved wrong, in full: the level as named, the kill published with it before the week, the close that fired it, and everything written about it afterwards. They are here because a record that keeps only its wins is not a record.</p>
  <p class="tally"><b>${misses.length}</b> wrong · <b>${pass}</b> held · <b>${notest}</b> never reached${open ? ` · <b>${open}</b> open` : ""} · ${CALLS.length} rows on the record. The wrong ones are ${resolved ? Math.round(misses.length / resolved * 100) : 0} percent of the ${resolved} resolved, stated beside its base because a percentage on a base this size is a small sample and should be read as one.</p>
${misses.map(section).join("\n")}
  <p class="after">${afterText}</p>
  <p class="law"><a href="index.html">Every row, including these</a> · Named before · Graded after · Nothing deleted</p>
</div>
<script>
/* 24 Sep 2026, note 37 on the record: on a phone the nav is one row that
   scrolls; the page you are on is scrolled into it. */
(function(){try{var n=document.querySelector("nav.nav");if(!n)return;var h=n.querySelector(".here");
var e=function(){n.classList.toggle("nav-l",n.scrollLeft>4);n.classList.toggle("nav-r",n.scrollLeft+n.clientWidth<n.scrollWidth-4);};
var c=function(){if(h&&n.scrollWidth>n.clientWidth+4)n.scrollLeft=Math.max(0,h.offsetLeft-(n.clientWidth-h.offsetWidth)/2);e();};
n.addEventListener("scroll",e,{passive:true});window.addEventListener("resize",e);c();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(c);}catch(x){}})();
</script>
</body>
</html>
`;
fs.writeFileSync("misses.html", out);
console.log(`misses.html written: ${misses.length} wrong rows of ${CALLS.length}, ${pass} held, ${notest} never reached, ${open} open`);
