#!/usr/bin/env node
/* =========================================================================
   make_og_cards.js  ·  28 November 2026  ·  HALLMARK

   His word of 28 Nov 2026, 09:00: the card X and every messenger draw under
   a link to the site says who we are now, not GOLD, SILVER AND PLATINUM
   LEVELS. Two cards, 1200 x 630, under new names so X fetches them fresh:
     og-desk-v2.png   the site's card: Your chart. The desk's read.
     og-lab-v2.png    the lab's card: The Empirical Lab
   Navy, ivory and the line's gold; Barlow Condensed, Barlow, IBM Plex Mono;
   the record's rosette on the right under a pane of the house glass.
   No levels, no predictions, no em dashes, no exclamation marks.

   Pages point at them with ?v= and the first ten characters of the card's
   SHA-256 (house_parts vOf), so a changed card is a new address.
   Run it before make_home.js, make_lab.js and make_chrome.js when a card's
   words change. Renders with playwright and the site's own font files.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const H = require("./house_parts.js");

const SUITE_N = H.SET_TOOLS.length + 1;   /* the core tools plus The Gate, joining the suite (make_home.js JOINING) */
const NUMW = ["", "", "", "", "", "", "Six", "Seven", "Eight"];
const STRIP = `Open-source lab <i>&middot;</i> The Desk Suite, ${NUMW[SUITE_N] ? NUMW[SUITE_N].toLowerCase() : SUITE_N} tools <i>&middot;</i> 1:1 mentorship`;

const CARDS = [
  { file: "og-desk-v2.png",
    head: `Your chart.<span>The desk&rsquo;s read.</span>`,
    sub: "Empirical 30-minute gold research, institutional TradingView tools and 1:1 desk mentorship." },
  { file: "og-lab-v2.png",
    head: `The Empirical<span>Lab</span>`,
    sub: "Tested on 30-minute gold. Ideas that fail go in the bin." }
];

const font = (fam, w, f) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(file://${path.join(HERE, f)}) format("woff2")}`;
const page = c => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${font("Barlow Condensed", 700, "barlow-condensed-latin-700-normal.woff2")}
${font("Barlow", 400, "barlow-latin-400-normal.woff2")}
${font("Barlow", 500, "barlow-latin-500-normal.woff2")}
${font("IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal.woff2")}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0B1A2E}
.c{position:relative;width:1200px;height:630px;overflow:hidden;
  background:radial-gradient(60% 70% at 12% -10%,rgba(255,236,200,.07),transparent 60%),radial-gradient(120% 100% at 100% 115%,rgba(7,17,31,.9),transparent 60%),#0B1A2E}
.ros{position:absolute;left:520px;top:-150px;width:930px;height:930px;opacity:.62;
  -webkit-mask-image:radial-gradient(circle closest-side,#000 0%,#000 42%,rgba(0,0,0,.55) 66%,rgba(0,0,0,.16) 86%,transparent 99%)}
.top{position:absolute;left:64px;right:64px;top:44px;display:flex;align-items:center;justify-content:space-between;z-index:3}
.id{display:flex;align-items:center;gap:16px}
.id img{width:52px;height:52px;border-radius:50%;box-shadow:0 0 0 2px #E8B84F,0 0 0 6px #0B1A2E,0 0 0 7px #2A4468}
.id b{font:700 24px/1 "Barlow Condensed";letter-spacing:.24em;text-transform:uppercase;color:#F3EDE2}
.url{font:500 21px/1 "IBM Plex Mono";letter-spacing:.02em;color:#E8B84F}
.pane{position:absolute;z-index:2;left:44px;top:124px;width:760px;height:454px;box-sizing:border-box;border-radius:24px;padding:42px 44px 0;
  background-color:rgba(14,30,52,.42);background-image:linear-gradient(180deg,rgba(255,255,255,.085) 0%,rgba(255,255,255,.028) 42%,rgba(255,255,255,.01) 100%);
  -webkit-backdrop-filter:blur(9px) saturate(150%);backdrop-filter:blur(9px) saturate(150%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 1px 0 0 rgba(255,255,255,.06),inset 0 -1px 0 rgba(0,0,0,.32),0 2px 4px rgba(0,0,0,.35),0 20px 40px -16px rgba(0,0,0,.72),0 50px 90px -30px rgba(0,0,0,.9)}
.pane::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;
  background:linear-gradient(130deg,rgba(255,255,255,.46),rgba(255,255,255,.1) 24%,rgba(255,255,255,0) 50%,rgba(255,255,255,.1) 84%,rgba(255,255,255,.3));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
h1{margin:0;font:700 92px/.96 "Barlow Condensed";letter-spacing:.006em;text-transform:uppercase;color:#F3EDE2}
h1 span{display:block;color:#E8B84F}
p{margin:26px 0 0;max-width:640px;font:400 27px/1.38 "Barlow";color:#C9D1DC}
.strip{position:absolute;left:44px;right:44px;bottom:36px;padding-top:22px;border-top:1px solid rgba(243,237,226,.16);font:500 22px/1 "Barlow";letter-spacing:.01em;color:#C9D1DC;white-space:nowrap}
.strip i{font-style:normal;color:#E8B84F;margin:0 14px}
</style></head><body><div class="c">
<img class="ros" src="file://${path.join(HERE, "rosette.svg")}" alt="">
<div class="top"><div class="id"><img src="file://${path.join(HERE, "avatar_square.jpg")}" alt=""><b>The Simplifier</b></div><span class="url">thesimplifier7.com</span></div>
<div class="pane"><h1>${c.head}</h1><p>${c.sub}</p><div class="strip">${STRIP}</div></div>
</div></body></html>`;

for (const c of CARDS) {
  const text = (c.head + c.sub + STRIP).replace(/<[^>]+>/g, " ");
  if (/—|–|!|level/i.test(text)) { console.error(c.file + ": brand law or a level in the words. Nothing written."); process.exit(1); }
}

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) { console.error("make_og_cards: playwright is not installed. Nothing written."); process.exit(1); }
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ["--allow-file-access-from-files"] } : { args: ["--allow-file-access-from-files"] });
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of CARDS) {
    const tmp = path.join(require("os").tmpdir(), "og_" + c.file + ".html");
    fs.writeFileSync(tmp, page(c));
    await pg.goto("file://" + tmp);
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(HERE, c.file) });
  }
  await b.close();
  console.log(`make_og_cards: ${CARDS.map(c => c.file).join(" and ")} written at 1200 x 630.`);
})();
