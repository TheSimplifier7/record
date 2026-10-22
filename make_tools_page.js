#!/usr/bin/env node
/* =========================================================================
   make_tools_page.js  ·  21 October 2026

   tools.html: the free tools on TradingView, one page beside the record.

   Reads tools.json only. A tool shows when its live flag is true, the day it
   is live on TradingView. Each shows its title as published and the first
   paragraph of its TradingView description as published, word for word, and
   a door to it on TradingView. A tool whose paragraph is not yet in hand
   shows its title and its door alone; nothing is written in its place.

   Every TradingView door is counted, by path alone: door-tradingview/tools-<key>
   (note 37, a door used).

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const P = require("./page_parts.js");
const { esc, SITE, TV } = P;

const HERE = __dirname;
const T = JSON.parse(fs.readFileSync(path.join(HERE, "tools.json"), "utf8"));
const live = T.tools.filter(t => t.live === true);
if (!live.length) throw new Error("tools.json: no tool is live. No page written.");
for (const t of live) {
  if (!/^https:\/\/www\.tradingview\.com\//.test(t.url)) throw new Error(t.key + ": its door is not on tradingview.com. No page written.");
  if (!t.title || !t.name) throw new Error(t.key + ": no title. No page written.");
}

const CSS = `
.cta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:22px 0 0}
.cta .fine{margin:0}
.tools{display:grid;gap:14px;margin:6px 0 0}
.tool{border:1px solid var(--rule);border-radius:14px;background:var(--raise);padding:20px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 24px;align-items:start}
.tool h2{margin:0;grid-column:1/2}
.tool p{margin:0;grid-column:1/2;font:400 1.04rem/1.55 var(--f-serif);color:var(--ink-2);max-width:42rem}
.tool .go{grid-column:2/3;grid-row:1/span 2;align-self:center}
.tool .n{font:600 .74rem/1 var(--f-cond);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);display:block;margin-bottom:6px}
@media (max-width:640px){.tool{grid-template-columns:1fr}.tool .go{grid-column:1;grid-row:auto;justify-self:start}}
`;

const names = live.map(t => t.name);
const list = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
const title = "The free tools on TradingView · The Simplifier";
const description = `${list}. Free and open source, on TradingView.`;
const img = { url: P.imageOf("tally_card_landscape_dark.png"), w: 1920, h: 1080 };

const cards = live.map(t => `<article class="tool" id="${esc(t.key)}">
    <h2><span class="n">${esc(t.name)}</span>${esc(t.title)}</h2>
    ${t.text ? `<p>${esc(t.text)}</p>` : ""}
    <a class="btn quiet go" href="${esc(t.url)}" data-tv="tools-${esc(t.key)}">${esc(t.name)} on TradingView</a>
  </article>`).join("\n  ");

const html = P.head({ title, description, canonical: SITE + "tools.html", image: img.url, imageW: img.w, imageH: img.h, extraCss: CSS }) + `
${P.band("tools-page", "tools")}
${P.hero({ eyebrow: "<span>Free and open source</span>", title: "The free tools", under: `<a class="hs-btn hs-gold" href="${TV}" data-tv="tools-page">Join me on TradingView</a><span>Free. Not investment advice.</span>` })}
<main><div class="wrap">
  <section class="tools" aria-label="The tools">
  ${cards}
  </section>
  ${P.doors("tools-foot", { tools: false })}
</div></main>
${P.foot({ counsel: false, current: "tools" })}`;

fs.writeFileSync(path.join(HERE, "tools.html"), html);
console.log(`tools.html: ${live.length} tools live (${names.join(", ")})` + (live.some(t => !t.text) ? `; no paragraph yet for ${live.filter(t => !t.text).map(t => t.name).join(", ")}` : "") + `; waiting: ${T.tools.filter(t => t.live !== true).map(t => t.name).join(", ") || "none"}.`);
