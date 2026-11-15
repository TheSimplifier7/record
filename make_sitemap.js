#!/usr/bin/env node
/* =========================================================================
   make_sitemap.js  ·  21 October 2026

   sitemap.xml, the list of pages beside the record that search engines are
   asked to read. Submitted once in Google Search Console, under the address
   https://thesimplifier7.com/sitemap.xml.

   Every .html page in the folder is listed, except:
     a page that asks not to be indexed (meta robots noindex): the advisers,
       the embed, the guest page, the seal, the year;
     the templates the cards are drawn from, which are not pages to read;
     Google's verification file (google<token>.html), which must stay beside
       the record for Search Console and is not a page.
   index.html is listed as the site's own address. A week page carries the
   date it last changed: the close that graded it, or the day it was written
   while it is open, and never earlier than 21 October 2026, the day the
   week pages were first written.

   15 November 2026, his word: every other page carries the day it last
   changed, in Madrid, from its own history: the last commit that touched
   it, or today if it differs from that commit as this runs. The record
   and weeks.html never carry a day earlier than LAST_UPDATED. It read:
   the record, weeks.html and index.html carried LAST_UPDATED and the
   rest carried none. No page is listed that asks not to be indexed, so
   welcome.html, which carries noindex, stays off.

   Run last, after every page is written. Writes sitemap.xml and nothing else.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const SITE = "https://thesimplifier7.com/";
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const TEMPLATES = ["share_card.html", "week_card.html", "tally_card_landscape_dark.html", "tally_card_vertical_dark.html"];

const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const tradingMonday = iso => { const dow = new Date(iso + "T12:00:00Z").getUTCDay(); return dow === 0 ? addDays(iso, 1) : addDays(iso, -(dow - 1)); };
const PAGES_FROM = "2026-10-21";   /* the day the week pages were first written */
const weekMod = {};
for (const r of R.rows) {
  const m = tradingMonday(r.named), d = r.graded_on_close || r.written || r.named;
  if (!weekMod[m] || d > weekMod[m]) weekMod[m] = d;
}

const pages = fs.readdirSync(HERE).filter(f => /\.html$/.test(f) && TEMPLATES.indexOf(f) < 0 && !/^google[0-9a-f]+\.html$/.test(f)).filter(f => {
  const s = fs.readFileSync(path.join(HERE, f), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  return !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(s);
}).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

const { execFileSync } = require("child_process");
const madrid = ms => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
const git = args => { try { return execFileSync("git", args, { cwd: HERE, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch (e) { return null; } };
const changedDay = f => {
  const dirty = git(["status", "--porcelain", "--", f]);
  if (dirty) return madrid(Date.now());
  const ct = git(["log", "-1", "--format=%ct", "--", f]);
  return ct ? madrid(+ct * 1000) : null;
};
const entry = f => {
  const loc = f === "index.html" ? SITE : SITE + f;
  let mod = changedDay(f);
  if ((f === "record.html" || f === "weeks.html") && (!mod || R.last_updated > mod)) mod = R.last_updated;
  const wm = f.match(/^week-(\d{4}-\d{2}-\d{2})\.html$/);
  if (wm && weekMod[wm[1]]) mod = weekMod[wm[1]] > PAGES_FROM ? weekMod[wm[1]] : PAGES_FROM;
  return `  <url><loc>${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ""}</url>`;
};
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(entry).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(HERE, "sitemap.xml"), xml);
console.log(`sitemap.xml: ${pages.length} pages.`);
