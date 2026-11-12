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

const FONTS = '<link rel="preload" href="barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n' +
  '<link rel="preload" href="barlow-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>\n' +  /* 12 Nov 2026, note 70: titles are Barlow at 500. It read: barlow-condensed-latin-700-normal.woff2 */
  '<style id="fonts">' + fs.readFileSync(path.join(__dirname, "fonts.css"), "utf8").trim() + '</style>';
/* The reader's choice on the record, applied before first paint, so nothing flashes. */
/* 10 Nov 2026, note 68: the switch is off and every page names the dark ground on its html tag, so no script is needed before first paint. */
const THEME_JS = "";

/* The tags a page's head carries for the house: after its own styles, so the house's few rules come last. */
const ICONS = "<link rel=\"icon\" href=\"/favicon.ico?v=2\" sizes=\"16x16 32x32 48x48\">\n<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/icon-192.png?v=2\">\n<link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png?v=2\">";  /* 1 Nov 2026: the icons index.html carries, on every page that takes the house head */
function headTags({ fonts = true, lean = false } = {}) {
  /* 12 Nov 2026, note 70: lean is for a page drawn whole in the calm layer (the front page, the daily levels): brand.css carries the band, the buttons, the bar and the foot complete, so the four older layers are not asked for. */
  if (lean) return ICONS + "\n" + (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="brand.css?v=${vOf("brand.css")}">`;
  /* 29 Oct 2026, note 63: the page in ASSAY, as the record's own page is drawn. It read: return (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">`; */
  return ICONS + "\n" + (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">\n<link rel="stylesheet" href="assay-site.css?v=${vOf("assay-site.css")}">\n<link rel="stylesheet" href="floor.css?v=${vOf("floor.css")}">\n<link rel="stylesheet" href="sharp.css?v=${vOf("sharp.css")}">\n<link rel="stylesheet" href="brand.css?v=${vOf("brand.css")}">`; /* 31 Oct 2026, note 64: sharp.css; 7 Nov 2026: brand.css, the flow in ASSAY, loaded last */
}
/* 12 Nov 2026, note 70: the head of a page drawn whole in the calm layer. pre is a script that must run before anything is drawn. */
function leanHead({ title, description, canonical, image, alt, css = "", pre = "" }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Simplifier">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@TheSimplifier7">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="theme-color" content="#0B1A2E">
${earlyTags()}
${pre ? pre + "\n" : ""}${headTags({ lean: true })}
<style>${css}</style>
<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body class="cp hs-has-bot">
<a class="skip" href="#main">Skip to the page</a>`;
}
/* 12 Nov 2026, note 70: the record's seal, as ASSAY keys it on every card (assay-core.js) and as the lamp keyed it (lamp.js):
   every row, oldest first, number|named|metal|level|side|grade|close, through SHA-256. plate.js draws the rosette from it. */
function recordSeal(R) {
  const A = require("./assay-core.js");
  const rows = R.rows.map(r => Object.assign({}, r)).sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : 0) || (A.ORDER.indexOf(a.metal) - A.ORDER.indexOf(b.metal)));
  rows.forEach((r, i) => { r.no = i + 1; });
  return A.sha256(A.rowKey(rows));
}
const earlyTags = () => '<meta name="color-scheme" content="dark">';

/* The band's places, as on the record. */
/* 12 Nov 2026, notes 69 and 70: the daily series. It read: ["week", "./#week", "This week"], ["record", "record.html", "The record"], ["fan", "method.html", "The Fan"], ["email", "./#join", "Monday email"] */
const NAV = [
  ["today", "levels.html", "Daily levels"],
  ["record", "record.html", "The record"],
  ["fan", "method.html", "The Fan"],
  ["tools", "tools.html", "Free tools"]
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

/* 12 Nov 2026, note 70: the band in the calm layer. The name set as words, the four places, one quiet button to the trial.
   It read: the name beside the portrait, a hidden "Monday email" button and a gold "See The Fan". */
function band(current, where, { fixed = true } = {}) {
  return `<header class="hs-band${fixed ? "" : " hs-static"}">
  <div class="hs-wrap hs-band-in">
    <a class="hs-brand" href="./" aria-label="The Simplifier, home">THE SIMPLIFIER</a>
    <nav class="hs-nav" aria-label="The site">
      ${NAV.map(([k, href, label]) => `<a href="${href}"${cur(k, current)}>${label}</a>`).join("\n      ")}
    </nav>
    <div class="hs-tools">
      <a class="hs-btn hs-ghost" href="method.html#plans" data-tv="plans-${esc(where)}-band">Try The Fan free</a>
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

/* The bar at the foot of a phone. 12 Nov 2026, note 70: four places in words, no pictures. It read: This week, Record, The Fan, Email, each under a drawn icon. */
function bot(current) {
  const B = [["today", "levels.html", "Levels"], ["record", "record.html", "Record"], ["fan", "method.html", "The Fan"], ["tools", "tools.html", "Tools"]];
  return `<nav class="hs-bot" aria-label="The site, on a phone">
  ${B.map(([k, href, label]) => `<a href="${href}"${cur(k, current)}><span>${label}</span></a>`).join("\n  ")}
</nav>`;
}
/* The foot of every page. 12 Nov 2026, note 70: three short lists under the name. It read as one line of links joined by dots. */
const BILLING = "https://billing.stripe.com/p/login/4gMbJ3gw91552dx4cm5kk00";
const fanFoot = () => `<footer class="hs-foot"><div class="hs-wrap hs-foot-in">
  <div class="hs-foot-id">
    <a class="hs-brand" href="./" aria-label="The Simplifier, home">THE SIMPLIFIER</a>
    <p>Gold, silver and platinum levels on every trading day at 08:00 CET. Each one is graded at the close, and the wrong ones stay up.</p>
    <p>Education and training. Not investment advice. Trading involves risk, and you can lose money.</p>
  </div>
  <nav aria-label="The levels"><p class="hs-foot-h">The levels</p><a href="levels.html">Daily levels</a><a href="record.html">The weekly record</a><a href="misses.html">Every wrong weekly call</a><a href="record.html#rules">The rules</a></nav>
  <nav aria-label="The Fan"><p class="hs-foot-h">The Fan</p><a href="method.html">What it shows</a><a href="method.html#plans">Plans and the free trial</a><a href="tools.html">Free tools</a><a href="mentorship.html">1-to-1 mentorship</a></nav>
  <nav aria-label="The small print"><p class="hs-foot-h">The small print</p><a href="terms.html">Terms</a><a href="privacy.html">Privacy</a><a href="mailto:hello@thesimplifier7.com">Contact</a><a href="${BILLING}">Manage or cancel your subscription</a><a href="https://x.com/TheSimplifier7" rel="noopener">@TheSimplifier7 on X</a></nav>
</div></footer>`;
const tail = current => `${fanFoot()}\n${bot(current)}\n<script src="house.js?v=${vOf("house.js")}" defer></script>\n<script src="svgfloor.js?v=${vOf("svgfloor.js")}" defer></script>\n<script src="refcarry.js?v=${vOf("refcarry.js")}" defer></script>`;
/* Everything that opens the body: the strip and the band. */
const top = (current, where, o) => band(current, where, o);

/* THE OLD DARK LOOK, CARRIED ONTO THE RECORD'S GROUND. The pages written in it name their colours with the same
   tokens; these give each token its place on the record's ground. Held is gold, as on the record (note 47), where
   the old look drew it green; wrong is red; open is blue. On white: ink 18.9, ink-3 12.2, ink-5 7.2, ink-6 5.9,
   gold #7a5600 6.6, wrong 6.6, open and links 6.6, never reached 5.6; on the panel, #f5f7fa, none under 5.2.
   At night: ink 16.8, ink-3 12.8, ink-5 8.4, ink-6 6.5, gold 11.5, wrong 8.3, open 8.7; on its panel none under 6.0. */
const STONE_CSS = `
:root{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0B1A2E;--panel:#11233C;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
  --gold:#f2c45a;--miss:#ff8a80;--pass:#f2c45a;--notest:#a3aec0;--pending:#8db0f5;--hs-link:#8db0f5;--hs-link-rule:rgba(141,176,245,.35);--hs-here:rgba(242,196,90,.08);color-scheme:dark}}
:root[data-theme="light"]{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
:root[data-theme="dark"]{--bg:#0B1A2E;--panel:#11233C;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
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

module.exports = { recordSeal, leanHead, fanFoot, TV, esc, vOf, FONTS, THEME_JS, headTags, earlyTags, strip, band, hero, bot, tail, top, STONE_CSS, stoneStyle, NAV };
