/* =========================================================================
   page_parts.js  ·  21 October 2026

   The parts the pages beside the record share: the head, the band at the
   top, the doors at the foot, counsel's two lines and the counter. Used by
   make_week_pages.js and make_tools_page.js. Writes nothing itself.

   The look is the record's own (note 47): white by day, navy when the
   device is set dark, the reader's switch on the record honoured here, the
   same tokens, the same four faces. The words a page carries that are not
   in record.json or tools.json are the founder's, copied as they stand on
   the record: the key line, counsel's two lines, "Join me on TradingView",
   "Get the lines", "Free. Not investment advice.", "Posted first on X",
   "One email Monday, one email Friday, nothing else.", "Nothing removed.",
   "The Fan · what it is, and the terms".

   The counter (note 37): the page view, and one event when a TradingView
   door is used, by path alone: door-tradingview/<where>. Nothing else.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SITE = "https://thesimplifier7.com/";
const TV = "https://www.tradingview.com/u/TheSimplifier7/#published-scripts";
const X = "https://x.com/TheSimplifier7";
const GC_TAG = '<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>';
const KEY = ["Floor: the week must close above it.", "Ceiling: the week must close under it.", "Only Friday's close counts."];
const COUNSEL = ["This is structural analysis. It is not a recommendation to buy or sell.", "I develop and sell The Fan, the indicator these levels are read from."];

const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const d0 = iso => new Date(iso + "T12:00:00Z");
const longDate = iso => { const d = d0(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const weekday = iso => DAYS[d0(iso).getUTCDay()];
const addDays = (iso, n) => { const d = d0(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ?v= and the first ten characters of the file's SHA-256, as the link cards do, so a changed image is a new address. */
const vOf = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname, file))).digest("hex").slice(0, 10);
const imageOf = file => SITE + file + "?v=" + vOf(file);

const CSS = `
:root{--bg:#ffffff;--bar:#f2f4f7;--raise:#ffffff;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#4e5869;--ink-4:#646e7f;--rule:#e1e5eb;--rule-2:#c9d0da;
--navy:#0f1e3a;--navy-ink:#ffffff;--navy-ink-2:#c9d3e6;--btn:#e0a93b;--btn-ink:#0f1e3a;--btn-hover:#eab955;
--held:#6b4d00;--held-bg:#f6e7c1;--mk-held:#c8962e;--wrong:#b42323;--wrong-chip:#c62f2f;--wrong-bg:#fbe9e7;--open:#2b5ba8;--open-bg:#e8eef9;--nr:#5f6979;--focus:#2b5ba8;
--f-ui:"Barlow","Helvetica Neue",Helvetica,Arial,sans-serif;--f-cond:"Barlow Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif;
--f-serif:"Newsreader","Iowan Old Style","Palatino Linotype",Georgia,serif;--f-fig:"IBM Plex Mono","SFMono-Regular",Menlo,Consolas,monospace;
--gutter:clamp(16px,4vw,40px);color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0b111d;--bar:#131c2c;--raise:#111a29;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#a3aec0;--ink-4:#8d98ab;--rule:#222e42;--rule-2:#33415a;
--navy:#14244a;--held:#f2c45a;--held-bg:#3b2f0f;--mk-held:#d9a63a;--wrong:#ff8a80;--wrong-bg:#3a1714;--open:#8db0f5;--open-bg:#16264a;--nr:#a3aec0;--focus:#8db0f5;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0b111d;--bar:#131c2c;--raise:#111a29;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#a3aec0;--ink-4:#8d98ab;--rule:#222e42;--rule-2:#33415a;
--navy:#14244a;--held:#f2c45a;--held-bg:#3b2f0f;--mk-held:#d9a63a;--wrong:#ff8a80;--wrong-bg:#3a1714;--open:#8db0f5;--open-bg:#16264a;--nr:#a3aec0;--focus:#8db0f5;color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1rem/1.55 var(--f-ui)}
a{color:inherit;text-decoration-color:var(--rule-2);text-underline-offset:3px}
a:hover{text-decoration-color:currentColor}
a:focus-visible,.btn:focus-visible{outline:2px solid var(--focus);outline-offset:3px}
.wrap{max-width:60rem;margin:0 auto;padding-inline:var(--gutter)}
.band{background:var(--navy);color:var(--navy-ink)}
.band .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:56px;flex-wrap:wrap;padding-block:8px}
.mark{font:700 1.15rem/1 var(--f-cond);letter-spacing:.14em;text-decoration:none;color:var(--navy-ink)}
.band nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap;font:600 .82rem/1 var(--f-ui);letter-spacing:.06em;text-transform:uppercase}
.band nav a{color:var(--navy-ink-2);text-decoration:none}
.band nav a:hover{color:var(--navy-ink)}
.band nav a.btn,.band nav a.btn:hover{color:var(--btn-ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:6px;background:var(--btn);color:var(--btn-ink);
font:700 .95rem/1 var(--f-ui);letter-spacing:.02em;text-decoration:none;border:0}
.btn:hover{background:var(--btn-hover)}
.btn.quiet{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--rule-2)}
.btn.quiet:hover{box-shadow:inset 0 0 0 1.5px var(--ink-3);background:transparent}
.band .btn{min-height:36px;padding:0 14px;font-size:.85rem}
main{padding-block:clamp(28px,5vw,56px) 40px}
.eyebrow{font:600 .8rem/1.2 var(--f-cond);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
h1{font:700 clamp(2rem,5.4vw,3.1rem)/1.04 var(--f-cond);letter-spacing:.01em;margin:0 0 12px;text-wrap:balance}
h2{font:700 1.35rem/1.15 var(--f-cond);letter-spacing:.02em;margin:0 0 14px;text-wrap:balance}
.lede{font:400 1.12rem/1.5 var(--f-serif);color:var(--ink-2);margin:0;max-width:40rem}
.key{margin:26px 0 30px;padding:14px 18px;background:var(--bar);border-left:3px solid var(--mk-held);border-radius:2px;display:flex;flex-wrap:wrap;gap:4px 18px;font:500 .98rem/1.45 var(--f-ui);color:var(--ink-2)}
.key b{color:var(--ink);font-weight:700}
.fine{font-size:.84rem;color:var(--ink-3);margin:8px 0 0;line-height:1.45}
.doors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:14px;margin:36px 0 0}
.door{border:1px solid var(--rule);border-radius:8px;padding:18px;background:var(--raise);display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.door p{margin:0}
.door .t{font:700 1.05rem/1.2 var(--f-cond);letter-spacing:.04em;text-transform:uppercase}
footer{border-top:1px solid var(--rule);margin-top:44px;padding-block:24px 40px;color:var(--ink-3);font-size:.88rem}
footer .counsel{font:400 1rem/1.5 var(--f-serif);color:var(--ink-2);margin:0 0 16px;max-width:42rem}
footer .meta{display:flex;flex-wrap:wrap;gap:6px 22px}
.fig{font-family:var(--f-fig);font-variant-numeric:tabular-nums}
@media (max-width:560px){.band nav .hide-phone{display:none}}
`;

/* The reader's switch on the record, honoured before first paint. */
const THEME_JS = `<script>(function(){var t=null;try{t=localStorage.getItem("theme")}catch(e){}if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)})();</script>`;

/* Note 37's third event, a door used, by path alone. */
const EVENTS_JS = `<script>(function(){try{
var ev=function(p,t){var go=function(){try{window.goatcounter.count({path:p,title:t,event:true})}catch(e){}};
if(window.goatcounter&&typeof window.goatcounter.count==="function"){go();return}
var s=document.querySelector("script[data-goatcounter]");if(s)s.addEventListener("load",function(){if(window.goatcounter&&typeof window.goatcounter.count==="function")go()},{once:true})};
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest("a[data-tv]"):null;if(a)ev("door-tradingview/"+(a.getAttribute("data-tv")||""),"A door used: TradingView")},true);
}catch(e){}})();</script>`;

function head({ title, description, canonical, image, imageW, imageH, extraCss }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#0f1e3a">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Simplifier">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="${imageW}">
<meta property="og:image:height" content="${imageH}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@TheSimplifier7">
${THEME_JS}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>${CSS}${extraCss || ""}</style>
${GC_TAG}
</head>
<body>`;
}

function band(where) {
  return `<header class="band"><div class="wrap">
  <a class="mark" href="./">THE SIMPLIFIER</a>
  <nav aria-label="The site"><a href="./">The record</a><a class="hide-phone" href="weeks.html">Week by week</a><a class="hide-phone" href="tools.html">The free tools</a><a class="btn" href="${TV}" data-tv="${esc(where)}-band">Join me on TradingView</a></nav>
</div></header>`;
}

const keyLine = () => `<p class="key"><span><b>Floor:</b> the week must close above it.</span><span><b>Ceiling:</b> the week must close under it.</span><span>Only Friday's close counts.</span></p>`;

function doors(where, { tools = true } = {}) {
  return `<div class="doors">
  ${tools ? `<div class="door"><p class="t">The free tools</p><p><a class="btn" href="${TV}" data-tv="${esc(where)}">Join me on TradingView</a></p><p class="fine">Free.<br>Not investment advice.</p></div>` : `<div class="door"><p class="t">The record</p><p><a class="btn quiet" href="./">Every line, graded</a></p><p class="fine">Nothing removed.</p></div>`}
  <div class="door"><p class="t">The Monday Level</p><p><a class="btn quiet" href="./#join">Get the lines</a></p><p class="fine">One email Monday, one email Friday, nothing else.</p></div>
</div>`;
}

function foot({ counsel = true } = {}) {
  return `<footer><div class="wrap">
  ${counsel ? `<p class="counsel">${esc(COUNSEL[0])} ${esc(COUNSEL[1])}</p>` : ""}
  <div class="meta">
    <span>Posted first on X · <a href="${X}">@TheSimplifier7</a></span>
    <span>The record · <a href="./">every line, graded</a></span>
    <span>The record as data · <a href="record.json">record.json</a></span>
    <span>The Fan · <a href="method.html">what it is, and the terms</a></span>
  </div>
</div></footer>
${EVENTS_JS}
</body>
</html>
`;
}

module.exports = { SITE, TV, X, GC_TAG, KEY, COUNSEL, esc, MONTHS, longDate, weekday, addDays, vOf, imageOf, head, band, keyLine, doors, foot };
