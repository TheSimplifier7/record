/* =========================================================================
   make_distance.js  ·  15 November 2026, HALLMARK

   Writes distance.html: how far each weekly level sat from the last close
   before it was named, and how likely a level that far away was to hold.
   Every figure comes from record.json through distance_core.js, so the
   page is written again, never typed, whenever the record changes.

     node make_distance.js

   verify_record.js requires this file and compares its output with the
   page on disk. BRAND LAW. No em dashes, hashtags, exclamation marks,
   emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const { distance } = require("./distance_core.js");

const pct = x => (x > 0 ? "+" : x < 0 ? "-" : "") + Math.abs(x).toFixed(2) + "%";
const whole = x => Math.round(x * 100) + "%";
const about = x => "about " + Math.round(x);
const day = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const CSS = `
.ds{max-width:var(--c-frame,72rem);margin:0 auto;padding:96px var(--c-gutter,40px) 32px;box-sizing:border-box}
.ds-ey{margin:0;font-size:15px;color:var(--c-mut)}
.ds-ey a{color:var(--c-sec)}
html body .ds h1{margin:12px 0 0;max-width:14em;font:700 clamp(44px,6vw,80px)/.92 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;text-transform:uppercase!important;letter-spacing:.005em!important;color:var(--c-ink)}
.ds-lede{max-width:44rem;margin:20px 0 0;font-size:19px;line-height:1.6;color:var(--c-sec)}
.ds-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:40px 0 0}
.ds-card{background:var(--c-raise);border:1px solid var(--c-rule);border-radius:12px;padding:20px}
.ds-card p{margin:0;font-size:14px;line-height:1.5;color:var(--c-mut)}
.ds-card b{display:block;margin:8px 0 4px;font:500 34px/1.1 "IBM Plex Mono",ui-monospace,monospace;color:var(--c-ink);font-variant-numeric:tabular-nums}
.ds-card span{font-size:15px;color:var(--c-sec)}
html body .ds h2{margin:48px 0 12px;font:500 22px/1.3 var(--c-ui)!important;color:var(--c-ink)}
.ds-t{overflow-x:auto;border:1px solid var(--c-rule);border-radius:12px}
.ds table{width:100%;border-collapse:collapse;font-size:14px;min-width:820px}
.ds th,.ds td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--c-rule);white-space:nowrap}
.ds tr:last-child td{border-bottom:0}
.ds th{font-weight:500;color:var(--c-mut);background:var(--c-raise)}
.ds td.n{font:400 14px "IBM Plex Mono",ui-monospace,monospace;text-align:right;color:var(--c-ink);font-variant-numeric:tabular-nums}
.ds td.gw{color:var(--c-red)}
.ds td a{color:var(--c-ink)}
.ds-m p{max-width:44rem;margin:0 0 12px;font-size:17px;line-height:1.65;color:var(--c-sec)}
.ds-lede a,.ds-m a{color:var(--c-ink);text-decoration:underline;text-decoration-color:var(--c-rule-2);text-underline-offset:4px}
@media (max-width:900px){.ds{padding-top:48px}.ds-cards{grid-template-columns:minmax(0,1fr)}}
`;

function render() {
  const R = JSON.parse(fs.readFileSync(path.join(__dirname, "record.json"), "utf8"));
  const d = distance(R);
  const card = (label, s) => `<div class="ds-card"><p>${label}</p><b>${s.held} held</b><span>${about(s.expected)} from a random week on file</span></div>`;
  const rows = d.rows.map(r => `<tr><td><a href="record.html#${H.esc(r.anchor)}">${day(r.named)}</a></td><td>${r.metal}</td><td>${r.side}</td><td class="n">${H.esc(r.level)}</td><td class="n">${H.esc(r.last)}</td><td class="n">${pct(r.pct)}</td><td>${r.against ? "Asked price to move" : "Gave price room"}</td><td class="n">${whole(r.base)}</td><td class="${r.held ? "gh" : "gw"}">${r.held ? "Held" : "Wrong"}</td></tr>`).join("\n      ");
  return H.leanHead({
    title: "How far, and how likely · The Simplifier",
    description: "Every weekly level set against the last close before it was named, and how often a level that far away held in any week on file. Worked out from the record alone.",
    canonical: "https://thesimplifier7.com/distance.html",
    image: "https://thesimplifier7.com/tally_card_landscape_dark.png",
    alt: "The Simplifier. Gold, silver and platinum levels, graded on the close.",
    css: CSS
  }) + `
${H.band("record", "distance")}
<main id="main" class="ds" tabindex="-1">
  <p class="ds-ey"><a href="record.html">The record</a> / How far, and how likely</p>
  <h1>How far, and how likely</h1>
  <p class="ds-lede">Each weekly level against the last Friday close before it was named, and how often a level that far away held in any week on file. Everything here is worked out from <a href="record.json">record.json</a> alone: the rows, their grades and the closes the record already carries.</p>
  <div class="ds-cards" data-distance="${d.all.held}/${d.all.n}">
    ${card(`All ${d.all.n} levels`, d.all)}
    ${card(`${d.against.n} that asked price to move`, d.against)}
    ${card(`${d.room.n} that gave price room`, d.room)}
  </div>
  <h2>The levels</h2>
  <div class="ds-t"><table>
    <thead><tr><th>Named</th><th>Metal</th><th>Side</th><th>Level</th><th>Last close</th><th>From the close</th><th>What it asked</th><th>Random week held</th><th>Graded</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table></div>
  <div class="ds-m">
    <h2>How it is worked out</h2>
    <p>Last close is the last Friday close in record.json before the level was named. A floor holds when the week closes at or above it; a ceiling holds when the week closes at or under it. A floor above the last close, or a ceiling under it, asked price to move. The others gave price room.</p>
    <p>Random week held is the share of week-on-week changes in record.json's closes, for the same metal, that would have left the week on the level's side if it had been named that far from the close: ${d.weeks.Gold} weeks for gold, ${d.weeks.Silver} for silver and ${d.weeks.Platinum} for platinum. The figure from a random week is the sum of those shares.</p>
    <h2>Check it yourself</h2>
    <p>The inputs are public: <a href="record.json">record.json</a> holds every row, its grade and the closes. The closes are the ones the record grades by, TVC's weekly closes on TradingView, so any of them can be set against TradingView's own chart. Each date in the table opens its row on the record.</p>
    <p>The code that does the counting is public too: <a href="https://github.com/TheSimplifier7/record/blob/main/distance_core.js" rel="noopener">distance_core.js</a>. Run it on record.json and you get the figures on this page. Every change to it, and to this page, is in the <a href="https://github.com/TheSimplifier7/record/commits/main" rel="noopener">public history</a>.</p>
    <h2>What it does not show</h2>
    <p>${d.all.n} levels is too few to prove an edge either way. The weeks used for the base rate are the same weeks the levels were graded in, so a falling market makes ceilings look easy for everyone; platinum's high shares are that. ${d.left} of the ${d.graded} graded rows are left out, because they carry no stated side or were named before the first close on file, and giving them a side now would be a change to the record.</p>
    <p>Nothing on this page changes a row, a grade or a note. <a href="record.html">Read the record</a></p>
  </div>
</main>
${H.tail("record")}
</body>
</html>
`;
}
module.exports = { render };
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, "distance.html"), render());
  const d = distance(JSON.parse(fs.readFileSync(path.join(__dirname, "record.json"), "utf8")));
  console.log(`distance.html written: ${d.all.n} levels, ${d.all.held} held, ${d.all.expected.toFixed(1)} from a random week.`);
}
