#!/usr/bin/env node
/* make_band.js · the band, the bar and the foot on the pages no other script writes
   12 November 2026, note 70. The band's four places changed with the daily series (Daily levels, The record,
   The Fan, Free tools), and eight pages written by hand carried a copy of the old band that no script renewed,
   so they still offered a Monday email that had closed. This renews, on each of them, only what the house owns:

     the band            between <header class="hs-band and </header>, from house_parts.js
     the bar on a phone  <nav class="hs-bot" or <nav class="botnav", the same four places
     the foot            the house foot, three short lists, in place of the foot the page carried

   It writes no word of a page's own text, and it touches no legal text on terms.html or privacy.html.
   method.html's band is make_house.js's; its bar and its foot are renewed here.
   Run after house_parts.js changes:  node make_house.js && node make_band.js
   Run it again and nothing changes.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;

const PAGES = [
  { file: "terms.html", where: "terms" },
  { file: "privacy.html", where: "privacy" },
  { file: "welcome.html", where: "welcome" },
  { file: "mentorship.html", where: "mentorship" },
  { file: "check-email.html", where: "check-email" },
  { file: "confirmed.html", where: "confirmed" },
  { file: "unsubscribed.html", where: "unsubscribed" },
  { file: "method.html", where: "method", current: "fan", band: false }
];
const fail = (f, why) => { throw new Error(`${f}: ${why}. Nothing written.`); };
const span = (s, open, close, from = 0) => { const i = s.indexOf(open, from); if (i < 0) return null; const j = s.indexOf(close, i); return j < 0 ? null : [i, j + close.length]; };
const put = (s, r, block) => s.slice(0, r[0]) + block + s.slice(r[1]);

/* The foot a page carried, in each form the pages had it, gives way to the house foot. */
function foot(s, file) {
  const F = H.fanFoot();
  let r = span(s, '<footer class="hs-foot">', "</footer>");
  if (r) return put(s, r, F);
  r = span(s, '<footer>\n  <div class="hs-fanfoot">', "</footer>");                 /* a footer that held only the old line of links */
  if (r) return put(s, r, F);
  r = span(s, '<footer>\n  <div class="wrap foot">', "</footer>");                   /* the plans template's foot */
  if (r) return put(s, r, F);
  r = span(s, '<div class="hs-fanfoot">', "</div></div>");                           /* the old line of links, standing alone */
  if (r) {
    s = put(s, r, F);
    const m = span(s, '  <div class="meta">', "</div>\n");                            /* the page's own row of links above it says the same */
    if (m && s.slice(0, m[0]).lastIndexOf("<footer") > s.slice(0, m[0]).lastIndexOf("</footer>")) s = put(s, m, "");
    return s;
  }
  fail(file, "no foot this script knows");
}

let n = 0;
for (const p of PAGES) {
  const fp = path.join(HERE, p.file);
  let s = fs.readFileSync(fp, "utf8");
  const cur = p.current || null;

  if (p.band !== false) {
    const r = span(s, '<header class="hs-band', "</header>");
    if (!r) fail(p.file, "no band");
    s = put(s, r, H.band(cur, p.where));
  }
  let r = span(s, '<nav class="hs-bot"', "</nav>");
  if (r) s = put(s, r, H.bot(cur));
  r = span(s, '<nav class="botnav"', "</nav>");
  if (r) s = put(s, r, H.bot(cur).replace('<nav class="hs-bot"', '<nav class="botnav"'));
  s = foot(s, p.file);
  s = s.split('href="./#rules"').join('href="record.html#rules"');
  if (/<!--/.test(s)) fail(p.file, "an HTML comment");
  if ((s.match(/<footer class="hs-foot">/g) || []).length !== 1) fail(p.file, "not one house foot");
  fs.writeFileSync(fp, s); n++;
}
console.log(`make_band.js: the band, the bar and the foot on ${n} pages written by hand (${PAGES.map(p => p.file).join(", ")}).`);
