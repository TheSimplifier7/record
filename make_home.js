#!/usr/bin/env node
/* Writes index.html from record.json and tools.json. The numbers are not typed by hand.
   Run after the record changes: node make_home.js
   It does not edit record.json or any historical row.

   7 November 2026, in ASSAY (assay-site.css, note 63): Barlow for words, IBM Plex Mono for figures, Barlow
   Condensed for titles, gold only for a line, red only for a line that broke, ivory for the one thing to press,
   spacing on 8, 12, 16, 24, 32, 48, 72. The name over The Fan's line, this week's three lines beside it, then the record, the Monday email, the free tools and The Fan, in that order, so a
   visitor can sign up or open a tool without leaving the page. Each caution is said once.

   The line under the name is The Fan's line on gold, January to November 2026, traced from the founder's
   own TradingView snapshot of gold 4 hour, TVC, 5 November 2026, 00:18 Madrid: flats and vertical steps,
   no candles, no axis, no figure. The same line is on the X header. */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const TOOLS = JSON.parse(fs.readFileSync(path.join(HERE, "tools.json"), "utf8")).tools.filter(t => t.live === true);
const esc = H.esc;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const d0 = iso => new Date(iso + "T12:00:00Z");
const addDays = (iso, n) => { const d = d0(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const long = iso => { const d = d0(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const fridayOf = iso => { const d = d0(iso); const add = (5 - d.getUTCDay() + 7) % 7; return addDays(iso, add); };
const num = s => Number(String(s).replace(/,/g, ""));
const decs = s => (String(s).split(".")[1] || "").length;
const fmt = (v, d) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---- this week */
const dates = [...new Set(R.rows.map(r => r.named))].sort();
const week = dates[dates.length - 1];
const order = { Gold: 0, Silver: 1, Platinum: 2 };
const rows = R.rows.filter(r => r.named === week).sort((a, b) => (order[a.metal] ?? 9) - (order[b.metal] ?? 9));
const friday = fridayOf(week);
const open = rows.some(r => r.grade === "pending");
const t = R.tally;
const lastClose = metal => { const c = R.closes.filter(c => c.date < friday && c[metal]).pop(); return c ? c[metal] : null; };

function rowHtml(r) {
  const floor = r.side === "slate";
  const kind = floor ? "Floor" : "Ceiling";
  const must = floor ? "The week must close above it." : "The week must close under it.";
  let state;
  if (r.grade === "pending") {
    const lc = lastClose(r.metal);
    state = lc ? `Last close ${esc(lc)}.` : "";
  } else {
    const c = r.close, gap = c ? fmt(Math.abs(num(c) - num(r.level)), Math.max(2, decs(r.level))) : "";
    const side = c ? (num(c) > num(r.level) ? "above" : "under") : "";
    if (r.grade === "pass") state = `<b class="hm-held">Held.</b> Closed ${esc(c)}, ${gap} ${side}.`;
    else if (r.grade === "miss" || r.grade === "partial") state = `<b class="hm-wrong">Wrong, kept.</b> Closed ${esc(c)}, ${gap} ${side}.`;
    else if (r.grade === "notest") state = `<b>Never reached.</b> Counted on neither side.`;
    else state = esc(r.grade_word || "");
  }
  return `<li class="hm-row"><span class="hm-metal">${esc(r.metal)}</span><span class="hm-lv">${esc(r.level)}</span><span class="hm-k"><b>${kind}.</b> ${must} ${state}</span></li>`;
}
const weekHead = `Graded on the close of Fri ${long(friday)}`;

/* ---- the record, every weekly row as a mark, oldest first */
const marks = R.rows.filter(r => ["pass", "miss", "partial", "notest", "pending"].includes(r.grade))
  .sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : (order[a.metal] ?? 9) - (order[b.metal] ?? 9)));
const MW = 14, GAP = 5, MH = 22;
const strip = marks.map((r, i) => {
  const x = i * (MW + GAP), y = MH / 2;
  if (r.grade === "pass") return `<line x1="${x}" y1="${y}" x2="${x + MW}" y2="${y}" stroke="var(--hm-gold)" stroke-width="4"/>`;
  if (r.grade === "miss" || r.grade === "partial") return `<line x1="${x}" y1="${y + 3}" x2="${x + 5}" y2="${y + 3}" stroke="var(--hm-red)" stroke-width="4"/><line x1="${x + 9}" y1="${y + 3}" x2="${x + MW}" y2="${y + 3}" stroke="var(--hm-red)" stroke-width="4"/>`;
  if (r.grade === "notest") return `<line x1="${x}" y1="${y}" x2="${x + MW}" y2="${y}" stroke="var(--hm-ink)" stroke-opacity=".22" stroke-width="4"/>`;
  return `<rect x="${x + .75}" y="${y - 2.25}" width="${MW - 1.5}" height="4.5" fill="none" stroke="var(--hm-ink)" stroke-width="1.5"/>`;
}).join("");
const SW = marks.length * (MW + GAP) - GAP;
const stripSvg = `<svg class="hm-strip" viewBox="0 0 ${SW} ${MH}" preserveAspectRatio="none" role="img" aria-label="Every weekly line on the record, oldest first: ${t.held} held, ${t.wrong} wrong, ${t.never_reached} never reached, ${t.open} open.">${strip}</svg>`;

/* ---- the free tools, as tools.html shows them */
const BLURB = { /* the same lines as make_tools_page.js */
  week: "Last week's high, low and closing price on your chart.",
  clockface: "A view of whether the day's high or low may already have formed.",
  atlas: "A view of which daily levels price may still reach before the close.",
  ama: "A summary of direction and where price stands.",
  sessions: "Compare gold's market sessions with their usual range.",
  stopodds: "Explore how often prices moved a chosen distance in the tool's sample.",
  tether: "A reference line for checking the current move."
};
const toolCards = TOOLS.map(x => `<li class="hm-tool"><h3>${esc(x.name)}</h3><p>${esc(BLURB[x.key] || "")}</p><a href="${esc(x.url)}" data-tv="tools-home-${esc(x.key)}">Open it on TradingView</a></li>`).join("\n      ");

/* ---- The Fan's line, 0 to 1000 each way */
const FANLINE = "M0.0,811.9 L12.9,811.9 L18.8,811.9 L18.8,701.9 L25.4,701.9 L29.7,701.9 L29.7,673.2 L69.4,673.2 L74.0,673.2 L74.0,619.0 L76.0,619.0 L77.7,619.0 L77.7,603.9 L80.0,603.9 L80.3,603.9 L80.3,600.4 L91.5,600.4 L93.9,600.4 L93.9,571.5 L96.5,571.5 L103.4,571.5 L103.4,442.8 L107.7,442.8 L116.7,442.8 L116.7,288.1 L121.6,288.1 L129.2,288.1 L129.2,0.0 L131.2,0.0 L137.8,0.0 L137.8,533.4 L140.8,533.4 L146.7,533.4 L146.7,320.1 L167.9,320.1 L169.5,320.1 L169.5,314.1 L200.9,314.1 L206.9,314.1 L206.9,231.2 L222.1,231.2 L226.0,231.2 L226.0,127.8 L269.3,127.8 L271.0,127.8 L271.0,193.9 L278.9,193.9 L284.9,193.9 L284.9,428.3 L288.5,428.3 L295.1,428.3 L295.1,683.3 L320.6,683.3 L325.2,683.3 L325.2,555.5 L338.4,555.5 L340.7,555.5 L340.7,520.7 L358.9,520.7 L361.2,520.7 L361.2,504.7 L371.4,504.7 L373.1,504.7 L373.1,480.1 L494.7,480.1 L499.3,480.1 L499.3,587.6 L525.8,587.6 L530.4,587.6 L530.4,657.9 L535.4,657.9 L542.0,657.9 L542.0,823.8 L582.3,823.8 L584.6,823.8 L584.6,900.2 L598.8,900.2 L599.1,900.2 L599.1,903.4 L728.4,903.4 L731.0,903.4 L731.0,793.4 L757.8,793.4 L761.1,793.4 L761.1,721.8 L764.4,721.8 L772.6,721.8 L772.6,616.4 L837.1,616.4 L838.7,616.4 L838.7,681.2 L842.0,681.2 L842.4,681.2 L842.4,684.3 L848.3,684.3 L848.6,684.3 L848.6,688.4 L871.8,688.4 L873.4,688.4 L873.4,695.2 L879.0,695.2 L884.3,695.2 L884.3,801.0 L912.1,801.0 L913.7,801.0 L913.7,816.3 L934.2,816.3 L935.9,816.3 L935.9,829.8 L960.7,829.8 L964.6,829.8 L964.6,905.6 L968.6,905.6 L968.9,905.6 L968.9,907.7 L987.1,907.7 L990.1,907.7 L990.1,1000.0 L1000.0,1000.0";

const CW = "<b>Why a card?</b> So the licence carries on after day 7 without you coming back. Nothing is charged for 7 days. Cancel before day 8 from your billing page, or send me one message on X, and you pay nothing.";
const FORM_ACTION = "https://script.google.com/macros/s/AKfycbzBzhbQC6s4R06NSsNWj75AaSExhEO9JtZkk9KUBLyu_cusOmqfNThSORKoNNYjduOr/exec";
const weekFile = `week-${week}.html`;

const CSS = `
:root{--hm-bg:#0B1A2E;--hm-bg2:#0D1F37;--hm-raise:#11233C;--hm-ink:#F3EDE2;--hm-sec:#A8B3C4;--hm-mut:#7D8CA3;--hm-gold:#E8B84F;--hm-goldhi:#F7D88E;--hm-red:#F0604A;--hm-rule:rgba(201,211,230,.12);--hm-wide:1072px}
:root[data-theme="light"]{--hm-bg:#ffffff;--hm-bg2:#f7f4ee;--hm-raise:#f5f7fa;--hm-ink:#0e1116;--hm-sec:#3d4757;--hm-mut:#5b6576;--hm-gold:#b98a2c;--hm-goldhi:#d9b25a;--hm-red:#b42323;--hm-rule:rgba(14,17,22,.12)}
html,body{background:var(--hm-bg);margin:0}
.skip{position:absolute;left:-999px;top:0;z-index:99;background:#fffbf2;color:#0b1a2e;padding:10px 14px;border-radius:0 0 10px 0}
.skip:focus{left:0}
body{color:var(--hm-ink)}
.hm{font:400 18px/1.6 "Barlow",sans-serif;color:var(--hm-ink);overflow-x:clip}
.hm *,.hm *::before,.hm *::after{box-sizing:border-box}
.hm .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.hm a{color:inherit}
.hm-in{max-width:var(--hm-wide);margin:0 auto;padding:0 24px}
.hm h2{font:700 clamp(2.25rem,4.6vw,3.25rem)/1 var(--f-cond,"Barlow Condensed",sans-serif);letter-spacing:-.005em;margin:0 0 16px;text-wrap:balance}
.hm h3{font:700 1.5rem/1.1 var(--f-cond,"Barlow Condensed",sans-serif);margin:0}
:where(.hm) p{margin:0}
.hm-lede{color:var(--hm-sec);max-width:36rem;text-wrap:pretty}
.hm-fine{font-size:14.5px;line-height:1.55;color:var(--hm-mut);max-width:44rem}
.hm-fine b{color:var(--hm-sec);font-weight:600}
.hm-acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.hm-acts .hs-btn{min-height:48px;padding:0 24px;font-size:16px}
:root[data-theme="light"] .hm .hs-btn.hs-ghost{color:var(--hm-ink)!important;border-color:rgba(14,17,22,.28)!important;background:transparent!important}
.hm-links{display:flex;flex-wrap:wrap;gap:8px 24px;margin-top:24px;font-weight:600}
.hm-links a{text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--hm-rule)}
.hm-sec{padding:72px 0 0}
.hm-sec+.hm-sec{border-top:1px solid var(--hm-rule);margin-top:72px}

/* the first screen */
.hm-hero{position:relative;background:linear-gradient(180deg,var(--hm-bg) 0%,var(--hm-bg) 50%,var(--hm-bg2) 100%)}
.hm-hero .hm-in{display:grid;grid-template-columns:minmax(0,1fr) 440px;column-gap:72px;padding-top:48px}
.hm-copy{grid-column:1;grid-row:1}
.hm-name{font:700 clamp(4rem,8.6vw,6.5rem)/.9 var(--f-cond,"Barlow Condensed",sans-serif);letter-spacing:-.01em;margin:0;white-space:nowrap}
.hm-met{font:500 clamp(1.25rem,2vw,1.5rem)/1.3 "Barlow",sans-serif;color:var(--hm-ink);margin-top:16px}
.hm-met .s{color:var(--hm-mut)}
.hm-say{margin-top:16px;color:var(--hm-sec);font-size:19px;max-width:30em}
.hm-week{grid-column:2;grid-row:1 / span 2;align-self:start;margin-top:8px;position:relative;z-index:2;background:var(--hm-raise);border-radius:24px;box-shadow:inset 0 0 0 1px var(--hm-rule),0 32px 72px -32px rgba(0,0,0,.75);padding:24px 24px 16px}
.hm-wh{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px 12px;font:500 15px/1.3 "Barlow",sans-serif}
.hm-wh span{color:var(--hm-mut);font-weight:400;font-size:14px;text-align:right}
.hm-rows{list-style:none;margin:6px 0 0;padding:0}
.hm-row{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--hm-rule)}
.hm-metal{font:700 26px/1 var(--f-cond,"Barlow Condensed",sans-serif);color:var(--hm-ink)}
.hm-lv{font:500 29px/1 "IBM Plex Mono",ui-monospace,monospace;text-align:right;font-variant-numeric:tabular-nums}
.hm-k{grid-column:1/-1;font-size:14.5px;line-height:1.45;color:var(--hm-sec)}
.hm-k b{color:var(--hm-ink);font-weight:600}
.hm-k .hm-held{color:var(--hm-gold)}.hm-k .hm-wrong{color:var(--hm-red)}
.hm-wf{display:flex;justify-content:space-between;gap:12px;padding-top:14px;font-size:14px;color:var(--hm-mut)}
.hm-wf b{font:500 14px "IBM Plex Mono",monospace;color:var(--hm-ink)}
.hm-wf a{font-weight:600;color:var(--hm-ink);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--hm-rule)}
.hm-line{grid-column:1/-1;grid-row:2;position:relative;height:248px;margin:72px calc(50% - 50vw) 0}
.hm-line svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.hm-line figcaption{position:absolute;right:max(24px,calc(50vw - var(--hm-wide) / 2 + 24px));bottom:-30px;font-size:13px;color:var(--hm-mut)}
.hm-hero{padding-bottom:44px}

/* the record */
.hm-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;margin-top:48px}
.hm-step h3{margin-bottom:8px}
.hm-step p{color:var(--hm-sec)}
.hm-strip{display:block;width:100%;height:22px;margin-top:48px}
.hm-tally{display:flex;flex-wrap:wrap;gap:8px 24px;margin-top:16px;font-size:16px;color:var(--hm-sec)}
.hm .hm-tally b{font:500 22px/1 "IBM Plex Mono",monospace;color:var(--hm-ink);margin-right:6px}
.hm .hm-tally .w b{color:var(--hm-red)}.hm .hm-tally .h b{color:var(--hm-gold)}

/* the Monday email */
.hm-join .hm-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,460px);gap:72px;align-items:start}
.hm-form{background:var(--hm-raise);border-radius:24px;box-shadow:inset 0 0 0 1px var(--hm-rule);padding:24px;display:grid;gap:16px}
.hm-form label.l{font-weight:600;font-size:15px}
.hm-form input[type="email"]{width:100%;min-height:52px;padding:0 16px;border:1px solid var(--hm-rule);border-radius:12px;background:var(--hm-bg);color:var(--hm-ink);font:inherit;font-size:17px}
.hm-form input[type="email"]:focus{outline:2px solid var(--hm-gold);outline-offset:1px}
.hm-trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.hm-consent{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.5;color:var(--hm-sec)}
.hm-consent input{margin-top:3px;width:20px;height:20px;flex:none;accent-color:var(--hm-gold)}
.hm-consent a{text-decoration:underline}
.hm-form button{width:100%}

/* the tools */
.hm-tools{list-style:none;margin:48px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.hm-tool{background:var(--hm-raise);border-radius:16px;box-shadow:inset 0 0 0 1px var(--hm-rule);padding:24px;display:flex;flex-direction:column;gap:12px}
.hm-tool p{color:var(--hm-sec);font-size:16px;line-height:1.5;flex:1}
.hm-tool a{font-weight:600;font-size:15px;text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--hm-rule)}

/* The Fan */
.hm-fan .hm-in{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:48px;align-items:center}
.hm-plate{margin:0}
.hm-plate img{display:block;width:100%;height:auto;border-radius:16px;box-shadow:inset 0 0 0 1px var(--hm-rule),0 30px 60px -32px rgba(0,0,0,.8)}
.hm-plate figcaption{margin-top:12px;font-size:13.5px;color:var(--hm-mut)}
.hm-plans{list-style:none;margin:24px 0 0;padding:0;border-top:1px solid var(--hm-rule)}
.hm-plans li{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--hm-rule)}
.hm-plans h3{font-size:1.5rem}
.hm-plans .p{font:500 18px "IBM Plex Mono",monospace;text-align:right;white-space:nowrap}
.hm-plans .p span{font:400 14px "Barlow",sans-serif;color:var(--hm-mut);margin-left:6px}
.hm-plans p{grid-column:1/-1;color:var(--hm-sec);font-size:16px;line-height:1.5}
.hm-fan .hm-fine{margin-top:14px}

/* a member */
.hm-voice blockquote{margin:0;max-width:44rem}
.hm-voice .lead{display:block;font:700 clamp(2.4rem,4.4vw,3.75rem)/.95 var(--f-cond,"Barlow Condensed",sans-serif);letter-spacing:-.005em;color:var(--hm-ink);text-wrap:balance}
.hm-voice .rest{display:block;margin-top:16px;font:400 clamp(1.125rem,1.6vw,1.3rem)/1.5 "Barlow",sans-serif;color:var(--hm-sec)}
.hm-who{margin-top:24px;color:var(--hm-sec)}
.hm-who b{color:var(--hm-ink);font-weight:600}
.hm-ba{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;max-width:44rem}
.hm-ba p{color:var(--hm-sec);font-size:16px}
.hm-ba b{display:block;color:var(--hm-ink);font-weight:600;margin-bottom:4px}

/* who, and the close */
.hm-me{display:flex;gap:24px;align-items:flex-start}
.hm-me i{flex:none;width:64px;height:64px;border-radius:50%;background:#0b1a2e url(avatar_square.jpg) center/cover;box-shadow:0 0 0 1.5px var(--hm-gold),0 0 0 5px var(--hm-bg),0 0 0 6px var(--hm-rule)}
.hm-close{text-align:left;padding-bottom:72px}
.hm-close h2{font-size:clamp(2.75rem,5.6vw,4.25rem)}

@media (max-width:900px){
  .hm{font-size:17px}
  .hm-in{padding:0 16px}
  .hm-hero .hm-in{display:block;padding-top:32px}
  .hm-name{font-size:clamp(3.6rem,16.5vw,5.2rem)}
  .hm-met{font-size:1.125rem;margin-top:12px}
  .hm-say{font-size:16.5px;margin-top:12px}
  .hm-acts{margin-top:24px}
  .hm-line{height:120px;margin:24px -16px 0}
  .hm-line figcaption{display:none}
  .hm-week{margin-top:-32px;padding:16px 16px 12px;border-radius:16px}
  .hm-row{padding:12px 0}.hm-metal{font-size:22px}.hm-lv{font-size:23px}.hm-k{font-size:13.5px}
  .hm-sec{padding-top:48px}.hm-sec+.hm-sec{margin-top:48px}
  .hm-steps,.hm-join .hm-in,.hm-fan .hm-in,.hm-ba{grid-template-columns:1fr;gap:32px}
  .hm-tools{grid-template-columns:1fr}
  .hm-close{padding-bottom:48px}
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Simplifier: Monday levels for gold, silver and platinum</title>
<meta name="description" content="One price level for gold, silver and platinum each Monday. Friday's close grades them, and the wrong calls stay on the record. Free Monday email, free TradingView tools, and The Fan.">
<link rel="canonical" href="https://thesimplifier7.com/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://thesimplifier7.com/">
<meta property="og:title" content="The Simplifier: Monday levels for gold, silver and platinum">
<meta property="og:description" content="One price level for gold, silver and platinum each Monday. Friday's close grades them, and the wrong calls stay on the record.">
<meta property="og:image" content="https://thesimplifier7.com/link_method.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B1A2E">
${H.earlyTags()}
<script>(function(){var h=location.hash;var keep={"#week":1,"#join":1,"#member":1,"#main":1,"#choose":1,"#proof":1,"#tools":1,"#fan":1};if(h&&!keep[h])location.replace("record.html"+location.search+h);})();</script>
${H.headTags()}
<style>${CSS}</style>
<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
${H.band("week", "home")}
<main id="main" class="hm" tabindex="-1">

<section class="hm-hero" aria-labelledby="hm-name">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-name" id="hm-name">The Simplifier</h1>
      <p class="hm-met">Gold, silver and platinum</p>
      <p class="hm-say">One level for each metal every Monday, named before the move. Friday's close grades it, and the wrong ones stay on the record.</p>
      <p class="hm-acts"><a class="hs-btn hs-gold" href="#join">Get Monday's levels free</a><a class="hs-btn hs-ghost" href="#tools">Free tools for your chart</a></p>
    </div>
    <figure class="hm-line" aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><linearGradient id="hm-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--hm-ink)" stop-opacity=".05"/><stop offset=".8" stop-color="var(--hm-ink)" stop-opacity="0"/></linearGradient></defs>
        <path d="${FANLINE} L1000,1400 L0,1400 Z" fill="url(#hm-lit)"/>
        <path d="${FANLINE}" fill="none" stroke="var(--hm-goldhi)" stroke-opacity=".1" stroke-width="9" vector-effect="non-scaling-stroke"/>
        <path d="${FANLINE}" fill="none" stroke="var(--hm-gold)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>
      <figcaption>The Fan's line on gold, January to November 2026</figcaption>
    </figure>
    <section class="hm-week" id="week" aria-labelledby="hm-wt">
      <p class="hm-wh"><span id="hm-wt" style="color:var(--hm-ink);font-size:15px;font-weight:500;text-align:left">This week's lines</span><span>${esc(weekHead)}</span></p>
      <ol class="hm-rows">
        ${rows.map(rowHtml).join("\n        ")}
      </ol>
      <p class="hm-wf"><span>The record: <b>${t.held}</b> held, <b>${t.wrong}</b> wrong, <b>0</b> deleted</span><a href="${esc(weekFile)}">The week in full</a></p>
    </section>
  </div>
</section>

<section class="hm-sec" id="proof" aria-labelledby="proof-h">
  <div class="hm-in">
    <h2 id="proof-h">Named before the move. Graded after the close.</h2>
    <p class="hm-lede">Every call carries the close that would prove it wrong, and every wrong one stays where you can read it.</p>
    <div class="hm-steps">
      <div class="hm-step"><h3>Monday</h3><p>One level each for gold, silver and platinum, posted on X and here before the week trades.</p></div>
      <div class="hm-step"><h3>Friday</h3><p>The 23:00 Madrid close grades each one. Held if it closed on the named side, wrong if it did not.</p></div>
      <div class="hm-step"><h3>Always</h3><p>Nothing on the record has been deleted. The wrong calls stay beside the ones that held.</p></div>
    </div>
    ${stripSvg}
    <p class="hm-tally"><span class="h"><b>${t.held}</b>held</span><span class="w"><b>${t.wrong}</b>wrong, kept</span><span><b>${t.never_reached}</b>never reached</span><span><b>${t.open}</b>open</span><span><b>0</b>deleted</span></p>
    <p class="hm-fine" style="margin-top:14px">Every weekly line, oldest first. Held means Friday closed on the side named in the call. It is not a trade result, and a level named in several weeks counts in each.</p>
    <p class="hm-links"><a href="record.html">The full record</a><a href="misses.html">Every wrong call</a></p>
  </div>
</section>

<section class="hm-sec hm-join" id="join" aria-labelledby="join-h">
  <div class="hm-in">
    <div>
      <h2 id="join-h">The Monday Level, free</h2>
      <p class="hm-lede">One email each Monday evening with the week's three levels, and last week's grades after Friday's close. The wrong ones arrive in your inbox too.</p>
      <p class="hm-fine" style="margin-top:18px">No card. A confirmation email comes first, and nothing else is sent until you confirm. Unsubscribe from any email.</p>
    </div>
    <form class="hm-form" method="POST" action="${FORM_ACTION}" accept-charset="UTF-8">
      <input type="hidden" name="action" value="signup">
      <input type="hidden" name="source_ref" id="hm-ref" value="home">
      <label class="l" for="hm-email">Your email address</label>
      <input id="hm-email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="you@email.com">
      <div class="hm-trap" aria-hidden="true"><label for="hm-co">Leave this empty</label><input id="hm-co" name="company" type="text" tabindex="-1" autocomplete="off"></div>
      <label class="hm-consent"><input type="checkbox" name="consent" value="yes" required><span>I agree to receive The Monday Level once a week and have read the <a href="privacy.html">Privacy policy</a>. I can unsubscribe at any time.</span></label>
      <button class="br-btn" type="submit">Send me Monday's levels</button>
    </form>
  </div>
</section>

<section class="hm-sec" id="tools" aria-labelledby="tools-h">
  <div class="hm-in">
    <h2 id="tools-h">Free tools for your own chart</h2>
    <p class="hm-lede">${TOOLS.length} open-source indicators I published on TradingView. Add them free and read the same structure on your own chart. They do not place trades or decide for you.</p>
    <ul class="hm-tools">
      ${toolCards}
    </ul>
    <p class="hm-acts"><a class="hs-btn hs-ghost" href="${esc(H.TV)}" data-tv="tools-home-follow">Follow me on TradingView</a></p>
  </div>
</section>

<section class="hm-sec hm-fan" id="fan" aria-labelledby="fan-h">
  <div class="hm-in">
    <figure class="hm-plate">
      <a href="method.html"><img src="fan_gold_30m_2026-11-01-blurred-1200.webp" srcset="fan_gold_30m_2026-11-01-blurred-640.webp 640w, fan_gold_30m_2026-11-01-blurred-1200.webp 1200w" sizes="(min-width: 900px) 560px, calc(100vw - 32px)" width="1200" height="713" loading="lazy" decoding="async" alt="The Fan on gold, 30 minute, a TradingView snapshot of 1 November 2026 with its labels blurred."></a>
      <figcaption>The Fan on gold, 30 minute, 1 November 2026. Chart by TradingView. Labels blurred.</figcaption>
    </figure>
    <div>
      <h2 id="fan-h">The Fan, on your chart</h2>
      <p class="hm-lede">The indicator these levels are read from. It adds the wider 2-hour view to your shorter chart. You still make every decision.</p>
      <ul class="hm-plans">
        <li><h3>The Fan</h3><span class="p">€149.99<span>a month</span></span><p>Everything in The Method, plus the wider 2-hour view on your shorter chart.</p></li>
        <li><h3>The Method</h3><span class="p">€59<span>a month</span></span><p>The simpler line-based view, for traders who do not need the extra context.</p></li>
      </ul>
      <p class="hm-acts"><a class="hs-btn hs-gold" href="method.html#plans" data-tv="plans-home-fan">Start your 7-day trial</a><a class="hs-btn hs-ghost" href="method.html">Compare the two</a></p>
      <p class="hm-fine">7 days free on either plan, VAT included. Card at checkout, nothing charged for 7 days.</p>
      <p class="hm-fine" style="margin-top:8px">${CW}</p>
    </div>
  </div>
</section>

<section class="hm-sec hm-voice" id="member" aria-labelledby="member-h">
  <div class="hm-in">
    <h2 id="member-h" class="sr-only">From a member</h2>
    <blockquote><p><span class="lead">Remoras follow sharks.</span><span class="rest">Knowing what to look for relative to structure and trend, and waiting for the right combination to present itself, makes all the difference in the world.</span></p></blockquote>
    <p class="hm-who"><b>Jim</b>, US</p>
    <div class="hm-ba"><p><b>Before</b>Very inconsistent for lack of trading protocol and discipline.</p><p><b>Now</b>Still a bit gun-shy, but gaining confidence and comfort.</p></div>
    <p class="hm-fine" style="margin-top:18px">One person's experience, not a promise of your result.</p>
  </div>
</section>

<section class="hm-sec" id="who" aria-labelledby="who-h">
  <div class="hm-in">
    <div class="hm-me"><i aria-hidden="true"></i><div>
      <h2 id="who-h">I'm Bradley</h2>
      <p class="hm-lede">Ex-institutional desk, trading since 2003. I build The Fan and The Method, and I publish my weekly levels so you can check what I said against what happened.</p>
      <p class="hm-links"><a href="record.html#rules">How the record is kept</a><a href="record.html#bounty">The $1,000 offer</a><a href="mentorship.html">1-to-1 mentorship</a></p>
    </div></div>
  </div>
</section>

<section class="hm-sec hm-close" id="choose" aria-labelledby="choose-h">
  <div class="hm-in">
    <h2 id="choose-h">Start with Monday's levels</h2>
    <p class="hm-lede">Read three lines a week and check every grade yourself. Add the free tools when you want them on your chart.</p>
    <p class="hm-acts"><a class="hs-btn hs-gold" href="#join">Get Monday's levels free</a><a class="hs-btn hs-ghost" href="method.html">See The Fan</a></p>
    <p class="hm-fine" style="margin-top:28px">Education and training. Not investment advice. Trading involves risk, and you can lose money. No result is promised.</p>
  </div>
</section>
</main>
${H.tail("week")}
<script>
(function(){var i=document.getElementById("hm-ref");if(!i)return;try{var q=new URLSearchParams(location.search),r=q.get("ref")||q.get("utm_source")||"";if(/^[A-Za-z0-9_-]{1,40}$/.test(r))i.value="home-"+r;}catch(e){}})();
</script>
</body>
</html>
`;

if (/\u2014|<!--|!\s|\u2013/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("homepage has an em dash, an en dash, an exclamation or an HTML comment"); process.exit(1); }
fs.writeFileSync(path.join(HERE, "index.html"), html);
console.log("index.html written for the week of " + week + ", " + t.resolved + " graded, " + TOOLS.length + " tools.");
