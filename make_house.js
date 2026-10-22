#!/usr/bin/env node
/* =========================================================================
   make_house.js  ·  THE HOUSE  ·  22 October 2026  ·  note 53 on the record

   Puts the head of the record (note 52) on the pages written by hand: the
   strip, the band and the bar at the foot of a phone on every one; the navy
   head with the page's own title and its own first line on the pages
   written in the old dark look, whose inks move onto the record's ground.
   The pages the scripts write (tools.html, weeks.html, the week pages, the
   bank pages and misses.html) carry the house from their own scripts.

     targets.html, tick.html          the old look: head, inks, the whole house
     guest.html, advisers.html,       the same; kept out of search as before
     year.html
     method.html                      its band becomes the house band; its own
                                      head and its own bar stay, in the house's type
     the-5800-call.html               the strip and the band above the story;
                                      the band does not follow the reader down,
                                      because the story's stage does

   It moves words, it never writes one: each page's title and first line go
   into the navy head as they stand. What it takes out of a page (the old
   header, its mark and the row of links under it) is kept in a comment in
   that page, word for word. Run it again and it renews only what sits
   between its own markers, so it can run after house.css or house.js
   changes, to give the pages their new addresses.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;
const SITE = "https://thesimplifier7.com/";

const PAGES = [
  { file: "targets.html", kind: "stone", current: "banks", where: "targets", eyebrow: '<a href="./">The record</a><span>The bank board</span>', canonical: true },
  { file: "tick.html", kind: "stone", current: null, where: "tick", eyebrow: '<a href="./">The record</a><span>The tick book</span>', canonical: true },
  { file: "guest.html", kind: "stone", current: null, where: "guest", eyebrow: "<span>For producers and hosts</span>" },
  { file: "advisers.html", kind: "stone", current: null, where: "advisers", eyebrow: "<span>For advisers</span>" },
  { file: "year.html", kind: "stone", current: null, where: "year", eyebrow: "<span>By introduction</span>" },
  { file: "method.html", kind: "method", current: "fan", where: "method" },
  { file: "the-5800-call.html", kind: "story", current: null, where: "the-5800-call" }
];

const fail = (f, why) => { throw new Error(`${f}: ${why}. Nothing written.`); };
/* A block kept inside one comment: its own comment markers written <!~~ and ~~>, and any double hyphen opened up, as the record keeps its old page. */
const keep = s => s.replace(/<!--/g, "<!~~").replace(/-->/g, "~~>").replace(/--/g, "- -");
const between = (s, name, inner) => {
  const a = `<!-- HOUSE ${name} START (make_house.js, note 53) -->`, b = `<!-- HOUSE ${name} END -->`;
  const i = s.indexOf(a), j = s.indexOf(b);
  return { has: i >= 0 && j > i, put: i >= 0 && j > i ? s.slice(0, i) + a + "\n" + inner + "\n" + b + s.slice(j + b.length) : null, block: a + "\n" + inner + "\n" + b };
};
const once = (s, f, re, what) => { const m = s.match(re); if (!m) fail(f, "no " + what); return m; };

function headBlock(p, s) {
  let inner = (p.kind === "stone" ? H.FONTS + "\n" + H.stoneStyle() + "\n" : H.FONTS + "\n") + H.headTags({ fonts: false });
  if (p.kind === "method") inner += "\n" + METHOD_STYLE;
  /* the page's own canonical, if it has one, outside this script's block; else the block carries it */
  const own = s.replace(/<!-- HOUSE HEAD START[\s\S]*?<!-- HOUSE HEAD END -->/, "").replace(/<!--[\s\S]*?-->/g, "");
  if (p.canonical && !/<link rel="canonical"/.test(own)) inner += `\n<link rel="canonical" href="${SITE}${p.file}">`;
  return inner;
}

/* method.html keeps its own head of the page; these rules give it the house's light and type. */
const METHOD_STYLE = `<style id="hs-method">
.fan-head{position:relative;overflow:hidden;isolation:isolate}
.fan-head::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(900px 420px at 18% -20%,rgba(224,169,59,.14),transparent 62%),radial-gradient(800px 520px at 85% 110%,rgba(141,176,245,.09),transparent 66%)}
.fan-head .wrap{padding-block:clamp(26px,4.5vw,52px) clamp(30px,4.5vw,48px)}
.fan-head h1{font-size:clamp(3rem,8vw,5.75rem);line-height:.9;letter-spacing:-.005em;text-transform:none}
.fan-head .tagline{font-family:var(--f-cond);font-weight:700;font-size:clamp(1.375rem,2.6vw,1.875rem);line-height:1.1;color:#f2c45a}
.fan-head .lede{color:#c9d3e6}
</style>`;

let n = 0;
for (const p of PAGES) {
  const fp = path.join(HERE, p.file);
  let s = fs.readFileSync(fp, "utf8");
  const first = !s.includes("<!-- HOUSE TOP START");

  /* the head of the file */
  const hb = between(s, "HEAD", headBlock(p, s));
  if (hb.has) s = hb.put;
  else {
    const i = s.indexOf("</head>"); if (i < 0) fail(p.file, "no </head>");
    s = s.slice(0, i) + hb.block + "\n" + s.slice(i);
  }
  if (first) {
    once(s, p.file, /<meta name="viewport"[^>]*>/, "viewport");
    s = s.replace(/(<meta name="viewport"[^>]*>)/, `$1\n<!-- HOUSE EARLY (make_house.js, note 53): the record's ground and the reader's choice, before first paint. -->\n${H.earlyTags()}`);
    if (/<meta name="theme-color" content="[^"]*"/.test(s)) s = s.replace(/<meta name="theme-color" content="[^"]*"/, '<meta name="theme-color" content="#0f1e3a"');
    else s = s.replace(/(<meta name="viewport"[^>]*>)/, '$1\n<meta name="theme-color" content="#0f1e3a">');
  }

  /* the top of the body */
  const top = H.top(p.current, p.where, { fixed: p.kind !== "story" });
  const tb = between(s, "TOP", top);
  if (tb.has) s = tb.put;
  else if (p.kind === "stone") {
    const b = s.indexOf("<body"), w = s.indexOf('<div class="wrap">', b);
    if (b < 0 || w < 0) fail(p.file, "no wrap after the body");
    const h1a = s.indexOf("<h1", w), h1b = s.indexOf("</h1>", h1a);
    if (h1a < 0 || h1b < 0) fail(p.file, "no title");
    const old = s.slice(w + '<div class="wrap">'.length, h1a);
    if (!/<header>[\s\S]*<\/header>/.test(old)) fail(p.file, "the old header is not where it was");
    const title = s.slice(s.indexOf(">", h1a) + 1, h1b);
    const after = s.slice(h1b + 5);
    const lm = after.match(/^((?:\s*<!--[\s\S]*?-->)*)\s*<p class="lede">([\s\S]*?)<\/p>/);
    if (!lm) fail(p.file, "no first line under the title");
    const notes = lm[1].trim();
    const hero = H.hero({ eyebrow: p.eyebrow, title, lede: lm[2], col: (s.match(/\.wrap\{max-width:(\d+px)/) || [])[1], pad: "var(--pad)" });
    const kept = `<!-- THE HEAD BEFORE 22 OCTOBER 2026, kept word for word (note 53 on the record): the mark, the row of links, the title
     and the first line, which now stand in the navy head above. Its own comment markers are written <!~~ and ~~>.
${keep(s.slice(w + '<div class="wrap">'.length, h1b + 5 + lm[0].length).trim())}
-->`;
    s = s.slice(0, w) + tb.block + "\n" + `<!-- HOUSE HERO (make_house.js, note 53) -->\n` + hero.replace("<p class=\"hs-lede\">", (notes ? notes + "\n  " : "") + "<p class=\"hs-lede\">") + "\n" +
      '<div class="wrap">\n' + kept + s.slice(h1b + 5 + lm[0].length);
  } else if (p.kind === "method") {
    const a = s.indexOf('<header class="band">'), z = s.indexOf("</header>", a);
    if (a < 0 || z < 0) fail(p.file, "no band");
    const old = s.slice(a, z + 9);
    s = s.slice(0, a) + tb.block + `\n<!-- THE BAND BEFORE 22 OCTOBER 2026, kept word for word (note 53 on the record). Its own comment markers are written <!~~ and ~~>.\n${keep(old)}\n-->` + s.slice(z + 9);
  } else {
    const b = s.indexOf("<body>"); if (b < 0) fail(p.file, "no <body>");
    s = s.slice(0, b + 6) + "\n" + tb.block + s.slice(b + 6);
  }

  /* the end of the body: the bar at the foot of a phone, unless the page has its own, and house.js */
  const tail = p.kind === "method" ? `<script src="house.js?v=${H.vOf("house.js")}" defer></script>` : H.tail(p.current);
  const eb = between(s, "TAIL", tail);
  if (eb.has) s = eb.put;
  else { const i = s.lastIndexOf("</body>"); if (i < 0) fail(p.file, "no </body>"); s = s.slice(0, i) + eb.block + "\n" + s.slice(i); }

  fs.writeFileSync(fp, s); n++;
}
console.log(`make_house.js: the house on ${n} pages written by hand (${PAGES.map(p => p.file).join(", ")}).`);
