/* =========================================================================
   make_chrome.js  ·  15 November 2026, HALLMARK

   Writes the parts every page shares from house_parts.js into the pages
   that are kept by hand, so the menu, the phone's bar, the foot, the plans
   on method.html, the proof line and the partner block have one source.
   It rewrites only those parts and the version tags of the shared files;
   every other byte of a page is left as it is. record.html keeps its own
   foot; no row, note or grade on it is touched.

     node make_chrome.js

   Run it after changing house_parts.js, brand.css, house.js or
   refcarry.js, and after turning SPACE_LIVE on. Then run the verifiers.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const R = require("./record.json");

const KEY = { "levels.html": "today", "record.html": "record", "method.html": "fan", "tools.html": "tools", "mentorship.html": "mentorship" };
const currentOf = block => { const m = block.match(/<a href="([^"]+)" aria-current="page">/); return m ? KEY[m[1]] || "" : ""; };
const NAV = H.band("", "x").match(/<nav class="hs-nav"[\s\S]*?<\/nav>/)[0];
const navFor = cur => NAV.replace(/<a href="([^"]+)">/g, (m, href) => KEY[href] === cur ? `<a href="${href}" aria-current="page">` : m);
const botLinks = cur => H.bot(cur).replace(/^<nav[^>]*>/, "").replace(/<\/nav>$/, "");
const SHARED = ["brand.css", "house.js", "refcarry.js", "plate.js"];
const SLOTS = {
  "welcome-space": () => H.SPACE_LIVE ? `<p class="as-both">If you already pay for the set on TradingView, do not also subscribe here. Email <a href="mailto:hello@thesimplifier7.com">hello@thesimplifier7.com</a> and I will sort it.</p>` : "",
  "faq-both": () => H.SPACE_LIVE ? `<p>${H.BOTH}</p>` : ""
};

const pages = fs.readdirSync(__dirname).filter(f => f.endsWith(".html") && f !== "index.html" && f !== "levels.html");
let changed = 0;
for (const f of pages) {
  const file = path.join(__dirname, f);
  const before = fs.readFileSync(file, "utf8");
  let t = before;
  t = t.replace(/<nav class="hs-nav" aria-label="The site">[\s\S]*?<\/nav>/, m => navFor(currentOf(m) || KEY[f] || "").replace(/^\s+/, ""));
  t = t.replace(/(<nav class="(?:hs-bot|botnav)" aria-label="The site, on a phone">)[\s\S]*?(<\/nav>)/, (m, a, b) => a + botLinks(currentOf(m) || KEY[f] || "") + b);
  if (f !== "record.html") t = t.replace(/<footer class="hs-foot">[\s\S]*?<\/footer>/, H.fanFoot());
  if (f === "method.html") t = t.replace(/<section id="plans"[\s\S]*?<\/section>/, H.plans(R));
  t = t.replace(/<p class="as-proof" data-proof>[\s\S]*?<\/p>/g, H.proof(R));
  t = t.replace(/<aside class="as-partner" data-partner="([^"]+)" aria-labelledby="pb-[^"]+">\s*<(h[23]|p) [\s\S]*?<\/aside>/g, (m, id, tag) => H.partner(id, tag));
  t = t.replace(/(<div data-slot="([a-z-]+)">)[\s\S]*?(<\/div>)/g, (m, a, k, b) => SLOTS[k] ? a + SLOTS[k]() + b : m);
  for (const s of SHARED) t = t.replace(new RegExp(s.replace(".", "\\.") + "\\?v=[0-9a-f]{10}", "g"), `${s}?v=${H.vOf(s)}`);
  if (t !== before) { fs.writeFileSync(file, t); changed++; }
}
console.log(`make_chrome: ${changed} of ${pages.length} pages written; the Paid Space is ${H.SPACE_LIVE ? "on" : "off"}.`);
