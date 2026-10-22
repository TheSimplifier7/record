/* =========================================================================
   house_parts.js  ·  THE HOUSE  ·  22 October 2026  ·  note 53 on the record

   The head of the record (note 52), as parts every page beside it shares:
   the tags for the head of the file, the strip and the band, the navy head
   with the page's title, the bar at the foot of a phone, and the inks that
   carry a page written in the old dark look (the look The Path retired on
   10 October 2026) onto the record's ground: white by day, navy at night.
   The look itself is house.css and what it does is house.js, both beside
   the record; each page names them with the first ten characters of their
   SHA-256, so a changed file is a new address.

   Used by page_parts.js (tools.html, weeks.html and every week page),
   make_bank_pages.js, make_misses.js and make_house.js (the pages written
   by hand). Writes nothing itself.

   The words are the record's own: its band, its bar, its key line.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const TV = "https://www.tradingview.com/u/TheSimplifier7/#published-scripts";
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const vOf = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname, file))).digest("hex").slice(0, 10);

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">';
/* The reader's choice on the record, applied before first paint, so nothing flashes. */
const THEME_JS = '<script>(function(){var t=null;try{t=localStorage.getItem("theme")}catch(e){}if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)})();</script>';

/* The tags a page's head carries for the house: after its own styles, so the house's few rules come last. */
function headTags({ fonts = true } = {}) {
  return (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">`;
}
const earlyTags = () => '<meta name="color-scheme" content="light dark">\n' + THEME_JS;

/* The band's places, as on the record. */
const NAV = [
  ["week", "./", "This week"],
  ["results", "./#results", "Results"],
  ["fan", "method.html", "The Fan"],
  ["tools", "tools.html", "Free tools", "hs-opt"],
  ["banks", "./#banks", "Banks"],
  ["rules", "./#rules", "Rules"],
  ["join", "./#join", "Join"]
];
const cur = (k, current) => k === current ? ' aria-current="page"' : "";

function strip() {
  return `<div class="hs-strip" id="hs-strip" role="region" aria-label="The record, counted">
  <div class="hs-wrap hs-strip-in">
    <a class="hs-k" href="./">The record</a>
    <span>Graded <b id="hs-graded"></b></span>
    <span class="k-h">Held <b id="hs-held"></b></span>
    <span class="k-w">Wrong, kept <b id="hs-wrong"></b></span>
    <span>Never reached <b id="hs-nr"></b></span>
    <span class="k-o">Open <b id="hs-open"></b></span>
    <span>Deleted <b>0</b></span>
    <span class="hs-next" id="hs-next" hidden><i class="hs-dot" aria-hidden="true"></i><span>Next grade <b id="hs-when"></b> <span id="hs-cd"></span></span></span>
  </div>
</div>`;
}

function band(current, where, { fixed = true } = {}) {
  return `<header class="hs-band${fixed ? "" : " hs-static"}">
  <div class="hs-wrap hs-band-in">
    <a class="hs-brand" href="./" aria-label="The Simplifier, the record">THE SIMPLIFIER</a>
    <nav class="hs-nav" aria-label="The site">
      ${NAV.map(([k, href, label, cls]) => `<a${cls ? ` class="${cls}"` : ""} href="${href}"${cur(k, current)}>${label}</a>`).join("\n      ")}
    </nav>
    <div class="hs-tools">
      <button class="hs-theme" id="hs-theme" type="button" aria-label="Switch between the light and the dark ground"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor"/></svg><span id="hs-theme-word">Dark</span></button>
      <a class="hs-btn hs-ghost hs-getlines" href="./#join">Get the lines</a>
      <a class="hs-btn hs-gold" href="${TV}" data-tv="${esc(where)}-band"><span><span class="hs-long">Join me on </span>TradingView</span></a>
    </div>
  </div>
</header>`;
}

/* The head of the page: the eyebrow, the title and the line under it, on the navy. col and pad line it up with the page's own column. */
function hero({ eyebrow = "", title, lede = "", under = "", key = false, col, pad, id }) {
  const style = [col ? `--hs-col:${col}` : "", pad ? `--hs-pad:${pad}` : ""].filter(Boolean).join(";");
  return `<div class="hs-hero"${id ? ` id="${id}"` : ""}><div class="hs-hero-in"${style ? ` style="${style}"` : ""}>
  ${eyebrow ? `<p class="hs-eyebrow">${eyebrow}</p>` : ""}
  <h1 class="hs-h1">${title}</h1>
  ${lede ? `<p class="hs-lede">${lede}</p>` : ""}
  ${key ? `<p class="hs-key"><span><b>Floor:</b> the week must close above it.</span><span><b>Ceiling:</b> the week must close under it.</span><span>Only Friday's close counts.</span></p>` : ""}
  ${under ? `<div class="hs-under">${under}</div>` : ""}
</div></div>`;
}

/* The bar at the foot of a phone, the record's own five places. */
function bot(current) {
  const I = {
    week: '<rect x="3" y="4.5" width="14" height="12" rx="1.5"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/>',
    results: '<path d="M3 5h1M3 10h1M3 15h1M7 5h10M7 10h10M7 15h10"/>',
    fan: '<path d="M3 16.5 7.8 3.3M3 16.5 12.9 6.6M3 16.5 16.2 11.7"/><path d="M7.8 3.3A14 14 0 0 1 16.2 11.7"/>',
    banks: '<path d="M3 8l7-4 7 4M4.5 8v7M8.5 8v7M11.5 8v7M15.5 8v7M3 16.5h14"/>',
    join: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/>'
  };
  const B = [["week", "./", "This week"], ["results", "./#results", "Results"], ["fan", "method.html", "The Fan"], ["banks", "./#banks", "Banks"], ["join", "./#join", "Join"]];
  return `<nav class="hs-bot" aria-label="The record">
  ${B.map(([k, href, label]) => `<a href="${href}"${cur(k, current)}><svg viewBox="0 0 20 20" aria-hidden="true">${I[k]}</svg><span>${label}</span></a>`).join("\n  ")}
</nav>`;
}
const tail = current => `${bot(current)}\n<script src="house.js?v=${vOf("house.js")}" defer></script>`;
/* Everything that opens the body: the strip and the band. */
const top = (current, where, o) => strip() + "\n" + band(current, where, o);

/* THE OLD DARK LOOK, CARRIED ONTO THE RECORD'S GROUND. The pages written in it name their colours with the same
   tokens; these give each token its place on the record's ground. Held is gold, as on the record (note 47), where
   the old look drew it green; wrong is red; open is blue. On white: ink 18.9, ink-3 12.2, ink-5 7.2, ink-6 5.9,
   gold #7a5600 6.6, wrong 6.6, open and links 6.6, never reached 5.6; on the panel, #f5f7fa, none under 5.2.
   At night: ink 16.8, ink-3 12.8, ink-5 8.4, ink-6 6.5, gold 11.5, wrong 8.3, open 8.7; on its panel none under 6.0. */
const STONE_CSS = `
:root{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0b111d;--panel:#111a29;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
  --gold:#f2c45a;--miss:#ff8a80;--pass:#f2c45a;--notest:#a3aec0;--pending:#8db0f5;--hs-link:#8db0f5;--hs-link-rule:rgba(141,176,245,.35);--hs-here:rgba(242,196,90,.08);color-scheme:dark}}
:root[data-theme="light"]{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
:root[data-theme="dark"]{--bg:#0b111d;--panel:#111a29;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
  --gold:#f2c45a;--miss:#ff8a80;--pass:#f2c45a;--notest:#a3aec0;--pending:#8db0f5;--hs-link:#8db0f5;--hs-link-rule:rgba(141,176,245,.35);--hs-here:rgba(242,196,90,.08);color-scheme:dark}
body{background:var(--bg)}
a{color:var(--hs-link);border-bottom-color:var(--hs-link-rule)}
a:hover{color:var(--ink)}
.facts{border-top:0;gap:12px}
.facts>div{background:var(--panel);border:1px solid var(--rule-soft);border-radius:12px;padding:14px 16px}
.facts>div>div{padding:0;border:0}
.kill,.wrap .tally{border-radius:12px}
.wrap .g,.wrap .grade{border-radius:999px}
blockquote{border-left-color:var(--gold)}
ol.house li.here{background:linear-gradient(90deg,var(--hs-here),transparent)}
.hs-hero .status{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:20px 0 0}
.hs-hero .g{display:inline-flex;align-items:center;gap:8px;font-family:var(--hs-fig);font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:6px 11px;border:1.5px solid currentColor;border-radius:999px}
.hs-hero .g i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.hs-hero .g.pending{color:#8db0f5}.hs-hero .g.pass{color:#f2c45a}.hs-hero .g.miss{color:#ff8a80}.hs-hero .g.notest{color:#c9d3e6}
.hs-hero .status .when{font-family:var(--hs-fig);font-size:13px;color:#c9d3e6}
`;
const stoneStyle = () => `<style id="hs-stone">${STONE_CSS}</style>`;

module.exports = { TV, esc, vOf, FONTS, THEME_JS, headTags, earlyTags, strip, band, hero, bot, tail, top, STONE_CSS, stoneStyle, NAV };
