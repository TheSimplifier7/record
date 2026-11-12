#!/usr/bin/env node
/* make_daily.js · writes levels.html, the page of the daily series, from daily.json
   12 November 2026, note 69: by the founder's ruling a level is named for gold, silver and platinum on every
   trading day, on X at 08:00 CET, and each is graded on that day's close. levels.html was the page that took
   an address for The Monday Level; that list is closed (note 70) and the address now carries the daily series,
   so every link that pointed at it still lands on the levels.

   Run after any change to daily.json, then node make_home.js:
     node make_daily.js && node make_home.js && node verify_daily.js

   It refuses to write if daily.json carries a problem daily.js can name. Every figure on the page is the one in
   daily.json; every grade is worked out by daily.js from the side, the level and the close.

   Drawn in the calm layer (brand.css, note 70), as the front page is.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const D = require("./daily.js");
const HERE = __dirname;
const esc = H.esc;
const SITE = "https://thesimplifier7.com/";

const data = JSON.parse(fs.readFileSync(path.join(HERE, "daily.json"), "utf8"));
const probs = D.problems(data);
if (probs.length) { console.error("daily.json cannot be drawn:\n  " + probs.join("\n  ") + "\nNothing written."); process.exit(1); }
const M = D.model(data);
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const t = R.tally;
const SEAL = H.recordSeal(R);   /* the record's seal, as ASSAY keys it: plate.js draws the rosette under the levels from it */

const title = "Daily gold, silver and platinum levels · The Simplifier";
const description = "A level for gold, silver and platinum on every trading day, posted at 08:00 CET. Each one is graded on that day's close, and the wrong ones stay up.";

const html = H.leanHead({ title, description, canonical: SITE + "levels.html", image: SITE + "card_daily.png?v=" + H.vOf("card_daily.png"),
  alt: "The Simplifier. Gold, silver and platinum levels, every trading day at 08:00 CET, each one graded at the close.", css: D.CSS }) + `
${H.band("today", "levels")}
<main id="main" class="hm" tabindex="-1">

<section class="hm-hero as-lit" aria-labelledby="hm-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="hm-h1">Daily levels</h1>
      <p class="hm-say">A level for gold, silver and platinum on every trading day, posted on X at 08:00 CET. Each one is graded on that day's close, and the wrong ones stay up.</p>
      <p class="hm-acts">${D.followBtn("levels-top")}<a href="method.html" data-tv="plans-levels-top">Try The Fan free for 7 days</a></p>
      <div class="hm-rec">
        <p data-daily="tally">${D.tally(M)}</p>
        <p class="as-hall"><span><b>${t.held}</b> held</span><span><b>${t.wrong}</b> wrong</span><span><b>0</b> deleted</span></p>
        <p><a href="record.html">The weekly series</a>, June to November 2026</p>
      </div>
    </div>
    <section class="hm-today" id="today" aria-labelledby="dy-t">
      <div data-plate data-seal="${SEAL}" data-daily="today" data-where="levels">${D.todayCard(M, null, "levels")}</div>
      <p class="hm-seal">The record's seal <b>${SEAL.slice(0, 6).toUpperCase()}</b>. The engraving under the glass is drawn from every row on the record. Change one figure on the record and it changes.</p>
    </section>
  </div>
</section>

<section class="hm-sec" id="rule" aria-labelledby="rule-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="rule-h">How a daily level is graded</h2></div>
    <div class="hm-main">
      <p class="hm-big">${esc(D.RULE)}</p>
      <p>Held means the day closed on the side I named. It is not a trade result.</p>
      <p>The 08:00 post on X is the original. This page copies it into <a href="daily.json">daily.json</a>, and <a href="https://github.com/TheSimplifier7/record/commits/main/daily.json" rel="noopener">every change to that file is a public commit</a>. If this page and the post ever differ, the post stands and the difference is logged here as a correction. A trading day with nothing on file is shown as not on file, never left out.</p>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-last" id="days" aria-labelledby="days-h">
  <div class="hm-in"><div>
    <div class="hm-side">
      <h2 id="days-h">Every day, graded</h2>
      <p>Newest first. A wrong level is set in the same line as one that held.</p>
    </div>
    <div class="hm-main">
      <div data-daily="table">${D.table(M)}</div>
      <p class="hm-fine" style="margin-top:40px">The weekly series ran from June to November 2026 and is kept whole on <a href="record.html">the record</a>: ${t.held} held, ${t.wrong} wrong, ${t.never_reached} never reached, nothing deleted.</p>
    </div>
  </div></div>
</section>
</main>
<script src="daily.js?v=${H.vOf("daily.js")}" defer></script>
<script src="plate.js?v=${H.vOf("plate.js")}" defer></script>
${H.tail("today")}
</body>
</html>
`;

if (/—|–|<!--|!\s/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("levels.html has an em dash, an en dash, an exclamation or an HTML comment. Nothing written."); process.exit(1); }
if (/monday/i.test(html)) { console.error("levels.html still says Monday. Nothing written."); process.exit(1); }
fs.writeFileSync(path.join(HERE, "levels.html"), html);
console.log(`levels.html written: ${M.days.length} trading day(s) since ${data.start}, ${M.tally.held} held, ${M.tally.wrong} wrong, ${M.tally.open} open, ${M.tally.none} none named, ${M.tally.gap} not on file.`);
