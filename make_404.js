/* =========================================================================
   make_404.js  ·  15 November 2026, HALLMARK

   Writes 404.html, the page GitHub Pages shows for an address that does
   not exist. A lost visitor is sent to the three places that matter: the
   daily levels, the record and the set. The page sets its base to the
   site's root, so it draws the same at any depth.

     node make_404.js

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const R = JSON.parse(fs.readFileSync(path.join(__dirname, "record.json"), "utf8"));

const CSS = `
.nf{max-width:var(--c-frame,72rem);margin:0 auto;padding:120px var(--c-gutter,40px) 48px;box-sizing:border-box}
.nf-in{max-width:40rem}
html body .nf h1{margin:0;font:700 clamp(44px,6vw,72px)/.95 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;text-transform:uppercase!important;letter-spacing:.005em!important;color:var(--c-ink)}
.nf p{margin:20px 0 0;font-size:18px;line-height:1.6;color:var(--c-sec)}
.nf-acts{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;margin-top:32px!important}
.nf-acts a:not(.hs-btn){color:var(--c-ink);text-decoration:underline;text-decoration-color:var(--c-rule-2);text-underline-offset:4px}
@media (max-width:900px){.nf{padding-top:56px}}
`;

const head = H.leanHead({
  title: "Not here · The Simplifier",
  description: "This address does not exist. The daily levels, the record and the set are one tap away.",
  canonical: "https://thesimplifier7.com/404.html",
  image: "https://thesimplifier7.com/tally_card_landscape_dark.png",
  alt: "The Simplifier. Gold, silver and platinum levels, graded on the close.",
  css: CSS
}).replace("<head>\n", '<head>\n<base href="/">\n<meta name="robots" content="noindex">\n');

const html = head + `
${H.band(null, "404")}
<main id="main" class="nf" tabindex="-1"><div class="nf-in">
  <h1>This page is not here</h1>
  <p>The address you followed does not exist. Nothing on the record is ever removed, so if a link to a level brought you here, the level is on the record.</p>
  <p class="nf-acts"><a class="hs-btn hs-gold" href="levels.html" data-tv="nf-levels">See today's levels</a><a href="record.html">Read the record</a><a href="method.html#plans" data-tv="nf-set">Try the set free for 7 days</a></p>
  ${H.proof(R)}
</div></main>
${H.tail(null)}
</body>
</html>
`;
if (!head.includes('<base href="/">')) throw new Error("the head did not take the base tag");
fs.writeFileSync(path.join(__dirname, "404.html"), html);
console.log("404.html written.");
