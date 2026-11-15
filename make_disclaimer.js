/* =========================================================================
   make_disclaimer.js  ·  15 November 2026, HALLMARK

   Writes disclaimer.html, the page the site's own rules ask for: what the
   levels, the record, the tools and the partner links are, and what they
   are not. His words to approve before it ships. It says nothing about
   his old desk beyond what the site already says in public.

     node make_disclaimer.js

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");

const S = [
  ["Education, not advice", [
    "Everything I publish, on this site, on X and on TradingView as TheSimplifier7, is for education and information. That includes the daily levels, the weekly record, the free tools, the four paid tools and the mentorship.",
    "None of it is investment advice, a personal recommendation, or an offer to buy or sell anything. I do not know your circumstances, and nothing here is fitted to them."
  ]],
  ["Trading is risky", [
    "Trading gold, silver, platinum and the products built on them can lose you money, and with leverage it can lose it quickly. Only trade money you can afford to lose. Every decision stays with you."
  ]],
  ["What the record is", [
    "The record grades levels, not trades. Held means the close came on the side I named. It is not a trade result, a return or a promise, and past grades do not tell you what the next one will be.",
    "Every grade is read off my own TradingView chart at the close. Market data can be late or wrong."
  ]],
  ["What the tools do", [
    "The tools draw on your own TradingView chart. They describe where price stands. They do not tell you when to buy or sell, they place no trades, and they handle no money."
  ]],
  ["Partner links", [
    "Some TradingView links on this site are partner links. If you sign up through one and later buy a TradingView plan, TradingView pays me a commission. It costs you nothing extra."
  ]],
  ["Who sells what", [
    "A subscription bought on this site is sold under my <a href=\"terms.html\">Terms</a>. A subscription bought on TradingView (my Paid Space) is sold and billed by TradingView under its own terms.",
    "TradingView is a separate company. I am not TradingView, and TradingView does not endorse what I publish."
  ]],
  ["Questions", [
    "Write to <a href=\"mailto:hello@thesimplifier7.com\">hello@thesimplifier7.com</a>."
  ]]
];

const CSS = `
.dc{max-width:var(--c-frame,72rem);margin:0 auto;padding:96px var(--c-gutter,40px) 32px;box-sizing:border-box}
.dc-in{max-width:40rem}
html body .dc h1{margin:0;font:700 clamp(44px,6vw,72px)/.95 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;text-transform:uppercase!important;letter-spacing:.005em!important;color:var(--c-ink)}
.dc-date{margin:16px 0 0;font-size:15px;color:var(--c-mut)}
.dc section{margin-top:40px;padding-top:24px;border-top:1px solid var(--c-rule)}
html body .dc h2{margin:0 0 12px;font:500 20px/1.3 var(--c-ui)!important;color:var(--c-ink)}
.dc p{margin:0 0 12px;font-size:17px;line-height:1.65;color:var(--c-sec)}
.dc a{color:var(--c-ink);text-decoration:underline;text-decoration-color:var(--c-rule-2);text-underline-offset:4px}
@media (max-width:900px){.dc{padding-top:48px}}
`;

const html = H.leanHead({
  title: "Disclaimer · The Simplifier",
  description: "What the levels, the record, the tools and the partner links are, and what they are not. Education, not advice.",
  canonical: "https://thesimplifier7.com/disclaimer.html",
  image: "https://thesimplifier7.com/tally_card_landscape_dark.png",
  alt: "The Simplifier. Gold, silver and platinum levels, graded on the close.",
  css: CSS
}) + `
${H.band(null, "disclaimer")}
<main id="main" class="dc" tabindex="-1"><div class="dc-in">
  <h1>Disclaimer</h1>
  <p class="dc-date">Last updated 15 November 2026</p>
  ${S.map(([h, ps]) => `<section><h2>${h}</h2>${ps.map(p => `<p>${p}</p>`).join("")}</section>`).join("\n  ")}
</div></main>
${H.tail(null)}
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, "disclaimer.html"), html);
console.log("disclaimer.html written: " + S.length + " sections.");
