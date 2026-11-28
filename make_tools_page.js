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
/* 15 Nov 2026, HALLMARK: at 360 px the buttons' long names pushed the cards past the screen. */
.tool{min-width:0}
.tool .go{white-space:normal;max-width:100%;text-align:left;height:auto;padding-block:10px;min-height:44px}

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

/* 28 Nov 2026, his copy polish of 11:18: one line each, sharper. */
const BLURB = {
  week: "Maps last week's high, low and close with multi-year base rates on how often weekly edges break.",
  clockface: "Measures by the clock whether the session's high or low is statistically likely to be in.",
  atlas: "Shows historical touch probabilities for key daily levels before the session close.",
  ama: "A single clean readout of adaptive trend direction and structural position.",
  sessions: "Measures Asia, London and New York ranges against their historical norms so you spot stretched sessions early.",
  stopodds: "Shows how often a chosen stop distance actually got tagged at that hour on historical gold.",
  tether: "Marks the exact structural invalidation line where the current move is proven wrong.",
  assay: "Tests its own marks automatically on your chart, separating real structural holds from noise.",
  flow: "Reads whether 30-minute gold is pushing cleanly or pulling back, summarized in one calm word at the chart edge."
};
const names = live.map(t => t.name);
const list = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
const title = "Free tools for your TradingView chart · The Simplifier";
const description = "Separate free tools on TradingView. Each adds one view of price. They do not place trades or make decisions for you.";
const img = { url: require("./house_parts.js").OG_DESK(), w: 1200, h: 630 };   /* 28 Nov 2026: the site's card; it read the record's tally card at 1920 x 1080 */

const cards = live.map(t => `<article class="tool" id="${esc(t.key)}">
    <h2><span class="n">${esc(t.name)}</span>${esc(t.title)}</h2>
    <p>${esc(BLURB[t.key] || t.text || "")}</p>
    <a class="btn quiet go" href="${require("./house_parts.js").aff(esc(t.url))}" data-tv="tools-${esc(t.key)}">Read about ${esc(t.name)} on TradingView</a>
  </article>`).join("\n  ");

/* 15 Nov 2026, HALLMARK, his brief of 15 November: a route from the free tools to the paid set, and the partner block under the intro. */
const html = P.head({ title, description, canonical: SITE + "tools.html", image: img.url, imageW: img.w, imageH: img.h, extraCss: CSS }) + `
${P.band("tools-page", "tools")}
${P.hero({ eyebrow: "<span>Free and open source</span>", title: "Free tools for your TradingView chart", lede: `${["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"][live.length]} free, open-source TradingView scripts built from our Empirical Lab. Put them on your own 30-minute gold chart, verify the math yourself, and decide. Confirmed on bar close. Zero buy arrows.`, under: `<a class="hs-btn hs-ghost" href="${TV}" data-tv="tools-page">Join me on TradingView</a><span>Free. Not investment advice.</span>` })}
<main><div class="wrap">
  <p class="tools-set">These are free. The Desk Suite (six tools) goes further, on the same chart. <a href="method.html#plans" data-tv="tools-set">See the Desk Suite</a></p>
  ${require("./house_parts.js").partner("tools", "h2")}
  <section class="tools" aria-label="The tools">
  ${cards}
  </section>
  ${P.doors("tools-foot", { sell: true })}
</div></main>
${require("./house_parts.js").signup("tools", { last: true })}
${P.foot({ counsel: false, current: "tools" })}`;

fs.writeFileSync(path.join(HERE, "tools.html"), html);
console.log(`tools.html: ${live.length} tools live (${names.join(", ")})` + (live.some(t => !t.text) ? `; no paragraph yet for ${live.filter(t => !t.text).map(t => t.name).join(", ")}` : "") + `; waiting: ${T.tools.filter(t => t.live !== true).map(t => t.name).join(", ") || "none"}.`);
