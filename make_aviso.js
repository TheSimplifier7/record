/* =========================================================================
   make_aviso.js  ·  16 November 2026, HALLMARK, his word

   Writes aviso-legal.html, the legal notice Spanish law asks of a site that
   earns money (article 10 of Ley 34/2002, LSSI-CE): who runs it, the tax
   number, the address and how to reach him. It is linked from the small
   print in every foot, at the size of its neighbours, so it is one tap from
   every page, and it asks search engines not to index it. The tax number
   and the address are on no other page of the site except the model
   withdrawal form in the Terms, whose wording the consumer law sets.

     node make_aviso.js

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");

const ID = [
  ["Owner (titular)", "Bradley Van Eden, a sole trader (autónomo) trading as The Simplifier"],
  ["Tax number (NIF)", "Y7256974M"],
  ["Address (domicilio)", "Calle Río Guadiana 1, 41807 Espartinas, Sevilla, Spain"],
  ["Email", '<a href="mailto:hello@thesimplifier7.com">hello@thesimplifier7.com</a>'],
  ["On X", '<a href="https://x.com/TheSimplifier7" rel="noopener">@TheSimplifier7</a>'],
  ["Website", "thesimplifier7.com"]
];

const CSS = `
.dc{max-width:var(--c-frame,72rem);margin:0 auto;padding:96px var(--c-gutter,40px) 32px;box-sizing:border-box}
.dc-in{max-width:40rem}
html body .dc h1{margin:0;font:700 clamp(44px,6vw,72px)/.95 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;text-transform:uppercase!important;letter-spacing:.005em!important;color:var(--c-ink)}
.dc-date{margin:16px 0 0;font-size:15px;color:var(--c-mut)}
.dc section{margin-top:40px;padding-top:24px;border-top:1px solid var(--c-rule)}
html body .dc h2{margin:0 0 12px;font:500 20px/1.3 var(--c-ui)!important;color:var(--c-ink)}
.dc p{margin:0 0 12px;font-size:17px;line-height:1.65;color:var(--c-sec)}
.dc dl{margin:0;display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 24px;font-size:17px;line-height:1.55}
.dc dt{color:var(--c-mut)}
.dc dd{margin:0;color:var(--c-ink)}
.dc a{color:var(--c-ink);text-decoration:underline;text-decoration-color:var(--c-rule-2);text-underline-offset:4px}
@media (max-width:600px){.dc dl{grid-template-columns:1fr;gap:2px}.dc dd{margin-bottom:12px}}
@media (max-width:900px){.dc{padding-top:48px}}
`;

const html = H.leanHead({
  title: "Aviso legal · The Simplifier",
  description: "Who runs thesimplifier7.com, as Spanish law asks.",
  canonical: "https://thesimplifier7.com/aviso-legal.html",
  image: H.OG_DESK(),   /* 28 Nov 2026: the site's card; it read the record's tally card */
  alt: "The Simplifier. Gold, silver and platinum levels, graded on the close.",
  css: CSS,
  noindex: true
}) + `
${H.band(null, "aviso-legal")}
<main id="main" class="dc" tabindex="-1"><div class="dc-in">
  <h1>Aviso legal</h1>
  <p class="dc-date">Last updated 16 November 2026</p>
  <section><h2>Who runs this site</h2>
    <dl>${ID.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <p style="margin-top:20px">Given under article 10 of Spain's Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE).</p>
  </section>
  <section><h2>Using this site</h2>
    <p>Use of the site and anything bought on it is governed by the <a href="terms.html">Terms</a>, the <a href="privacy.html">Privacy policy</a> and the <a href="disclaimer.html">Disclaimer</a>.</p>
  </section>
</div></main>
${H.tail(null)}
</body>
</html>
`;
if (/—|–|<!--|!\s/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("aviso-legal.html carries an em dash, an en dash, an exclamation mark or an HTML comment. Nothing written."); process.exit(1); }
fs.writeFileSync(path.join(__dirname, "aviso-legal.html"), html);
console.log("aviso-legal.html written, noindex.");
