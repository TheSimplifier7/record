#!/usr/bin/env node
/* Writes index.html from record.json, daily.json and daily.js. The numbers are not typed by hand.
   Run after the record or daily.json changes: node make_home.js
   It does not edit record.json, daily.json or any historical row.

   12 November 2026, notes 69 and 70. The daily series: a level for gold, silver and platinum on every trading
   day, on X at 08:00 CET, each graded on that day's close; the weekly series ended on the close of Friday
   6 November and is kept whole on record.html. The page runs: the promise and the one thing to press, the
   count, today's levels, the last days graded, the standing offer, The Fan, a member, who I am, five questions.
   The email form is gone with The Monday Level. 16 Nov 2026, his word: the list stays open, and its box is back at
   the foot of the page, above the footer (H.signup in house_parts.js). 18 Nov 2026, his word: no levels to lead
   with anywhere on the front page, so the box (it sends the week graded) stays on levels.html only.

   Drawn in the calm layer (brand.css, note 70): Barlow at 400 and 500 for words, IBM Plex Mono for figures,
   hairlines and no shadow, sentence case, spacing on 4, 8, 12, 16, 24, 32, 48, 64, 96. Gold is a level's line
   and nothing else. The page asks for brand.css alone.

   It read, until 12 November 2026: titles in Barlow Condensed at 700, a raised card under a shadow, the portrait
   in the band, and The Fan's line on gold drawn across the first screen. The line is on the card under a link
   to this page now, and not here. */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const D = require("./daily.js");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const DAILY = JSON.parse(fs.readFileSync(path.join(HERE, "daily.json"), "utf8"));
const esc = H.esc;
const t = R.tally;

const dprobs = D.problems(DAILY);
if (dprobs.length) { console.error("daily.json cannot be drawn:\n  " + dprobs.join("\n  ") + "\nindex.html not written."); process.exit(1); }
const M = D.model(DAILY);

const X = D.X;
const CARD = "https://thesimplifier7.com/card_daily.jpg?v=" + H.vOf("card_daily.jpg");
const TITLE = "Your chart, the desk\u2019s read · Gold, silver and platinum · The Simplifier";
const DESC = `Gold, silver and platinum from a former London metals derivatives desk: free research in the lab, ${["no","one","two","three","four","five","six","seven"][H.SET_TOOLS.length]} structural tools for your TradingView chart, 7 days free then €99 a month, and 1:1 desk mentorship by application.`;
const CW = "Why a card? So the licence carries on after day 7 without you coming back. Nothing is charged for 7 days. Cancel before day 8 from your billing page, or send me one message on X, and you pay nothing.";
/* 15 Nov 2026, HALLMARK, his brief of 15 November (R2 reopened): the gold buttons sell the trial, and Follow on TradingView
   lives in the foot. It read: Follow on TradingView, and before that, Follow on X for the morning levels. The Paid Space line
   under the hero's button shows only once TradingView has approved the Space (SPACE_LIVE in house_parts.js).
   15 Nov 2026, his word, late: the hero's button goes straight to the Stripe checkout with the terms beside it, and the
   hallmark under it links to the record. It read: Try the set free for 7 days, to method.html#plans, then Read the record. */
const trial = where => `<a class="hs-btn hs-gold" href="method.html#plans" data-tv="${where}">Try the set free for 7 days</a>`;
const spaceLine = H.SPACE_LIVE ? `\n      <p class="hm-or"><a href="${H.SPACE}" ${H.OUT} data-tv="home-hero-tv">Or subscribe on TradingView</a></p>` : "";

const NUMW = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const SET = H.SET_TOOLS, SETL = NUMW[SET.length], SETW = SETL.replace(/^./, c => c.toUpperCase());
const HERO = SET.find(x => x.name === "The Ratchet") || SET[0];
/* 15 Nov 2026, HALLMARK quick fixes. The FAQ read "Seven open-source TradingView
   tools" as typed; it now counts the live tools in tools.json, as tools.html does. */
const TOOLS_LIVE = JSON.parse(fs.readFileSync(path.join(HERE, "tools.json"), "utf8")).tools.filter(x => x.live === true).length;
const toolsWord = (NUMW[TOOLS_LIVE] || String(TOOLS_LIVE)).replace(/^./, c => c.toUpperCase());
const FAQ = [
  ["What is the set?", `${SETW} TradingView indicators, ${SET.map(x => x.name).join(", ").replace(/, ([^,]*)$/, " and $1")}, at €99 a month, VAT included. They draw on your own chart and leave every decision with you.${H.SPACE_LIVE ? " " + H.BOTH : ""} <a href="method.html">See what they show</a>`],
  ["Do I need TradingView?", `Yes, for the ${SETL} tools. You need your own TradingView account. The free plan can run them, subject to its limit on indicators per chart. You give your TradingView username at checkout, never your password.`],
  ["How do I cancel the trial?", "From the billing page linked at the foot of every page, or with one message to me on X. Cancel before day 8 and you pay nothing."],
  ["Is the mentorship part of the subscription?", `No. It is personal teaching over twelve weeks, priced on the call and put in writing before payment. <a href="mentorship.html">Read about the mentorship</a>`],
  ["What do I get free?", `${toolsWord} open-source TradingView tools, free to add to your own chart. <a href="tools.html">See the free tools</a>`],
  ["Do you publish your own levels?", `Yes. Three levels every trading day, posted on X before the London open, each graded on that day's close with the wrong ones kept. ${H.proof(R).replace(/^<p class="as-proof" data-proof>|<\/p>$/g, "")} Held means the close stayed on the side I named. It is not a trade result. This is structural analysis. It is not a recommendation to buy or sell. I develop and sell The Fan, the indicator these levels are read from.`]
];

/* Until the first day of the daily series is graded, the proof on this page is the weekly series: its last five
   weeks, every level and its grade, read from record.json. Once a day is on file the daily table takes its place. */
const WORD = { pass: ["held", "Held"], miss: ["wrong", "Wrong"], pending: ["open", "Open"] };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function weeklyLast(n) {
  const dates = [...new Set(R.rows.map(r => r.named))].sort().reverse().slice(0, n);
  const cell = r => !r ? '<span class="dy-mut">No level</span>'
    : `<span class="dy-cell"><span class="dy-fig">${esc(r.level)}</span>${WORD[r.grade] ? `<span class="dy-g dy-${WORD[r.grade][0]}">${WORD[r.grade][1]}</span>` : '<span class="dy-mut">Never reached</span>'}</span>`;
  return `<div class="dy dy-last"><table><thead><tr><th scope="col">Week of</th>${D.ORDER.map(m => `<th scope="col">${m}</th>`).join("")}</tr></thead><tbody>${dates.map(d => {
    const by = {}; R.rows.filter(r => r.named === d).forEach(r => { if (!by[r.metal]) by[r.metal] = r; });
    const dt = new Date(d + "T12:00:00Z"), label = dt.getUTCDate() + " " + MON[dt.getUTCMonth()];
    const page = "week-" + d + ".html";
    return `<tr><th scope="row">${fs.existsSync(path.join(HERE, page)) ? `<a href="${page}">${label}</a>` : label}</th>${D.ORDER.map(m => `<td>${cell(by[m])}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table></div>`;
}
const hasDays = M.days.length > 0;
/* 15 Nov 2026, HALLMARK quick fixes. The heading read "The last five days" while
   the daily series had two days on file. It now counts what it shows: the first
   days of the series until there are five, then the last five. */
const daysShown = Math.min(5, M.days.length);
const daysHead = daysShown >= 5 ? "The last five days" : daysShown === 1 ? "The first day" : `The first ${NUMW[daysShown]} days`;
const SEAL = H.recordSeal(R);   /* the record's seal, as ASSAY keys it: plate.js draws the rosette under the levels from it */

/* The calm page itself (the grid, the titles, the first screen) is brand.css; this is only what the front page alone carries. */
const CSS = `
.hm-shot img{border-radius:8px}
.hm-hero .hm-in{align-items:center}
.hm-set{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:48px 32px}
.hm-tool .hm-plate{margin:0 0 16px}
.hm-tool h3{margin:0 0 8px;font:500 20px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-tool p{margin:0 0 8px;font-size:16px;line-height:1.55;color:var(--c-ink)}
.hm-tool p.hm-not{color:var(--c-mut);font-size:15px}
.hm-set+.hm-links{margin-top:32px}
.hm-tool:last-child:nth-child(odd){grid-column:1/-1}
.hm-tool figcaption{margin-top:8px;font-size:12px;color:var(--c-mut)}
.hm-gets{display:grid;gap:32px;margin-top:40px}
.hm-tool p.hm-win{font-weight:500;font-size:17px}
.hm-fit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}
.hm-fit h3{margin:0 0 8px;font:500 20px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-fit p{margin:0;font-size:17px;line-height:1.6;color:var(--c-sec)}
@media (max-width:900px){.hm-fit{grid-template-columns:1fr}}
.hm-gets h3{margin:0 0 8px;font:500 20px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-gets p{margin:0;max-width:40rem;font-size:17px;line-height:1.6;color:var(--c-sec)}
.hm-steps{margin:16px 0 0;padding-left:1.2em;max-width:40rem;font-size:17px;line-height:1.6;color:var(--c-sec)}
.hm-steps li+li{margin-top:6px}
#price .hm-big b{font:700 1.4em/1 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif;color:var(--c-ink)}
@media (max-width:900px){.hm-set{grid-template-columns:1fr;gap:40px}}

/* The Fan */
.hm-fan .hm-in>div{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:start}
.hm-fan .hm-side p{max-width:26rem;font-size:17px}
.hm-plans{list-style:none;margin:32px 0 0;padding:0;border-top:1px solid var(--c-rule)}
.hm-plans li{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--c-rule)}
.hm-plans .p{font:500 16px/1.4 var(--c-fig);color:var(--c-ink);text-align:right;white-space:nowrap}
.hm-plans .p span{font:400 14px/1.4 var(--c-ui);color:var(--c-mut);margin-left:8px}
.hm-plans p{grid-column:1/-1;margin:0;font-size:15px;line-height:1.5;max-width:none}
.hm-fan .hm-acts{margin-top:16px}
.hm-trial{margin-top:32px!important;font-size:17px;line-height:1.5;color:var(--c-ink)}
.hm-fan .hm-fine{margin-top:20px}
.hm-plate{margin:0}
.hm-plate a{display:block}
.hm-plate img{display:block;width:100%;height:auto;border-radius:8px;border:1px solid var(--c-rule)}
.hm-plate figcaption{margin-top:12px;font-size:13px;line-height:1.5;color:var(--c-mut)}

/* a member */
.hm-voice blockquote{margin:0}
.hm-voice blockquote p{font:400 clamp(1.375rem,2.2vw,1.625rem)/1.42 var(--c-ui);color:var(--c-ink);max-width:28em;text-wrap:pretty}
.hm-who{margin-top:24px;font-size:15px}
.hm-ba{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px;margin-top:40px;padding-top:24px;border-top:1px solid var(--c-rule);max-width:40rem}
.hm-ba p{font-size:15px;line-height:1.55}
.hm-ba b{display:block;margin-bottom:4px;font-weight:400;color:var(--c-mut);font-size:14px}
.hm-voice .hm-fine{margin-top:24px}

/* five questions */
.hm-faq{border-top:1px solid var(--c-rule)}
.hm-faq details{border-bottom:1px solid var(--c-rule)}
.hm-faq summary{cursor:pointer;list-style:none;position:relative;padding:20px 40px 20px 0;font:500 17px/1.4 var(--c-ui);color:var(--c-ink)}
.hm-faq summary::-webkit-details-marker{display:none}
.hm-faq summary::before,.hm-faq summary::after{content:"";position:absolute;right:4px;top:50%;width:13px;height:1px;background:var(--c-sec);transition:transform .15s ease}
.hm-faq summary::after{transform:rotate(90deg)}
.hm-faq details[open] summary::after{transform:rotate(0)}
.hm-faq details p{padding:0 40px 24px 0;font-size:16px;line-height:1.6;max-width:40rem}

.hm-close .hm-acts{margin-top:32px}
.hm-or{margin:12px 0 0;font-size:15px}
.hm-or a{color:var(--c-sec)}
#who .hm-acts{margin-top:24px}

/* 15 Nov 2026, HALLMARK: the head set as a poster in the brand's own face, as on the set page; the byline under his face */
html body .hm-hero h1.hm-h1{max-width:9.6em;font:700 clamp(48px,6.4vw,92px)/.92 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;letter-spacing:.005em!important;text-transform:uppercase!important;text-wrap:balance}
.hm-hero{overflow:hidden}
.hm-hero .hm-say{max-width:30em}
.hm-by{display:flex;align-items:center;gap:16px;margin-top:32px;max-width:34em}
.hm-by img{flex:none;width:64px;height:64px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1.5px var(--c-gold-lo),0 0 0 4px var(--c-bg)}
.hm-by p{margin:0;font-size:15px;line-height:1.5;color:var(--c-sec)}
.hm-by b{display:block;font:500 17px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-hero .hm-acts{margin-top:32px}
.hm-terms{font-size:15px;line-height:1.5;color:var(--c-sec)}
.hm-rec a.as-hall{text-decoration:none;transition:border-color .2s}
.hm-rec a.as-hall:hover,.hm-rec a.as-hall:focus-visible{border-color:var(--c-gold)}

@media (max-width:900px){
  html body .hm-hero h1.hm-h1{font-size:clamp(40px,11.4vw,64px)!important}
  .hm-by{margin-top:24px}
  .hm-fan .hm-in>div{display:block}
  .hm-plate{margin-top:40px}
  .hm-ba{gap:20px;margin-top:32px}
}
` + D.CSS;
const CSS10 = `
.hm10 .hm-hero{padding:72px 0 56px}
.hm10 .hm-hero h1.hm-h1{max-width:11em}
.hm10 .hm-say{margin-top:20px;max-width:34em}
.hm10 .hm-acts{margin-top:24px}
.hm-micro{margin:12px 0 0;font-size:14px;line-height:1.5;color:var(--c-mut)}
.hm-fromx{display:none;align-items:center;gap:10px;margin:16px 0 0;font-size:15px;color:var(--c-sec)}
.hm-fromx img{width:28px;height:28px;border-radius:50%;border:1px solid var(--c-rule-2)}
html.from-x .hm-fromx{display:flex}
.hm-shot{margin:0}
.hm-shot img{display:block;width:100%;height:auto;border-radius:8px;border:1px solid var(--c-rule)}
.hm-shot figcaption,.hm-card figcaption{margin-top:10px;font-size:13px;line-height:1.5;color:var(--c-mut)}
.hm-strip ul{list-style:none;margin:0;padding:20px 0;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;border-top:1px solid var(--c-rule);border-bottom:1px solid var(--c-rule);font-size:15px;color:var(--c-ink)}
.hm-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px 20px}
.hm-card figure{margin:0 0 12px}
.hm-card img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;object-position:72% 50%;border-radius:8px;border:1px solid var(--c-rule)}
.hm-card h3{margin:0 0 6px;font:500 18px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-card p{margin:0;font-size:15px;line-height:1.5;color:var(--c-sec)}
.hm-row+.hm-fine{margin-top:20px}
.hm-card .hm-join{margin:0 0 6px;font-size:13px;line-height:1.4;color:var(--c-mut)}
.hm-steps{margin:0;padding-left:1.2em;font-size:18px;line-height:1.6;color:var(--c-ink)}
.hm-steps li+li{margin-top:8px}
.hm-story p{margin:0 0 12px;max-width:40rem;font-size:19px;line-height:1.55;color:var(--c-ink)}
.hm-card-price{max-width:30rem;padding:28px;border:1px solid var(--c-rule-2);border-radius:12px;background:var(--c-raise)}
.hm-card-price h3{margin:0;font:500 18px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-card-price .hm-p{margin:12px 0 16px;font-size:17px;color:var(--c-sec)}
.hm-card-price .hm-p b{font:700 44px/1 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif;color:var(--c-ink);margin-right:6px}
.hm-card-price ul{margin:0;padding-left:1.1em;font-size:16px;line-height:1.6;color:var(--c-ink)}
.hm-card-price ul li+li{margin-top:4px}
.hm-free{margin-top:20px;font-size:16px;color:var(--c-sec)}
.hm-final .hm-big{margin:0}
/* 25 Nov 2026, his word of 00:55: glass on every thing. The chart, the cards, the price and the last block are panes of the
   levels card's glass (brand.css .gl), each over the record's rosette (plate.js), lit where the reader points or scrolls. */
.hm-shot.gl{padding:12px 12px 14px}
.hm-shot.gl img{border:0;box-shadow:0 0 0 1px rgba(255,255,255,.06)}
.hm-shot.gl figcaption{margin-top:10px;padding:0 4px}
.hm-row{gap:20px}
.hm-card.gl{padding:10px 10px 18px;border-radius:14px}
.hm-card.gl figure{margin:0 0 14px}
.hm-card.gl img{border:0;box-shadow:0 0 0 1px rgba(255,255,255,.06)}
.hm-card.gl :is(h3,p){padding:0 6px}
.hm-card-price.gl{max-width:32rem;padding:32px;border:0;border-radius:16px;background-color:var(--c-glass);background-image:var(--c-glass-sheen)}
.hm-pane.gl{max-width:36rem;padding:32px}
.hm-strip{position:relative;z-index:1}
/* 27 Nov 2026: the three-tier funnel. The headline's second line in the line's gold; the Remora pane; three tiers on glass, the
   Desk Suite's the one bright button; Jim's words on glass inside the mentorship section. */
.hm11 .hm-hero h1.hm-h1{max-width:12em}
.hm-gold{color:var(--c-gold)}
.hm11 .hm-h1 .hm-gold,.hm-remora .hm-shark .hm-gold{display:block}
.hm-alt{display:inline-block;margin-left:20px;font-size:16px;color:var(--c-ink);text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(243,237,226,.35)}
.hm-remora{max-width:40rem}
.hm-remora p{margin:0 0 14px;font-size:19px;line-height:1.55;color:var(--c-ink)}
.hm-remora p:last-child{margin-bottom:0}
.hm-remora .hm-shark{margin:0 0 20px;font:700 clamp(32px,3.4vw,44px)/1.02 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif;letter-spacing:.005em;text-transform:uppercase;color:var(--c-ink)}
.hm11 .hm-wide .hm-in>div{display:block}
.hm11 .hm-wide .hm-side{margin-bottom:32px}
.hm-tiers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.hm-tier{display:flex;flex-direction:column;padding:30px 28px 26px}
.hm-tier h3{margin:0;font:500 19px/1.3 var(--c-ui);color:var(--c-ink)}
.hm-tier .hm-tp{margin:10px 0 14px;font-size:15px;color:var(--c-sec)}
.hm-tier .hm-tp b{display:block;margin-bottom:4px;font:700 44px/1 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif;color:var(--c-ink)}
.hm-tier .hm-tw{margin:0 0 10px;font-size:16px;line-height:1.5;color:var(--c-ink)}
.hm-tier .hm-tf{margin:0 0 18px;font-size:14px;line-height:1.5;color:var(--c-sec)}
.hm-tier .hm-tc{margin:auto 0 0}
.hm-tier .hm-tc .hs-btn{width:100%;justify-content:center}
.hm-tier .hm-micro{margin-top:10px;font-size:13px;min-height:2.9em}
.hm-tier-main::after{content:"";position:absolute;left:24px;right:24px;top:0;height:2px;background:var(--c-gold);border-radius:0 0 2px 2px}
.hm-jim{margin:0;padding:32px 32px 26px;max-width:44rem}
.hm-jim blockquote{margin:0}
.hm-jim p{margin:0 0 14px;font-size:17px;line-height:1.6;color:var(--c-ink)}
.hm-jim .hm-vq{margin:0 0 18px;font:500 24px/1.35 var(--c-ui);color:var(--c-ink)}
.hm-jim figcaption{margin-top:6px;font-size:15px;color:var(--c-gold)}
.hm-jim+.hm-fine{max-width:44rem}
.hm-mentor{margin-top:28px;max-width:40rem}
.hm-mentor p{margin:0 0 12px;font-size:18px;line-height:1.55;color:var(--c-ink)}
.hm-mentor .hm-acts{margin-top:20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px}
.hm-or2{font-size:15px;color:var(--c-sec)}
.hm-final .hm-acts{display:flex;flex-wrap:wrap;align-items:center;gap:12px 0}
@media (max-width:900px){
  .hm10 .hm-hero{padding:24px 0 32px}
  .hm-alt{display:block;margin:14px 0 0;text-align:center}
  .hm-tiers{grid-template-columns:none;gap:16px}
  .hm-tier{padding:22px 20px 20px}
  .hm-remora p{font-size:17px}
  .hm-jim{padding:24px 20px 20px}
  .hm-jim .hm-vq{font-size:21px}
  .hm-jim p{font-size:16px}
  .hm-mentor p{font-size:17px}
  .hm-mentor .hm-acts .hs-btn{width:100%;justify-content:center}
  .hm10 .hm-hero h1.hm-h1{font-size:clamp(36px,10.6vw,56px)!important}
  .hm10 .hm-say{margin-top:14px;font-size:17px;line-height:1.5}
  .hm10 .hm-acts .hs-btn{width:100%}
  .hm-shot{margin:32px calc(-1 * var(--c-gutter)) 0}
  .hm-shot img{aspect-ratio:4/5;object-fit:cover;object-position:75% 50%;border-radius:0;border-left:0;border-right:0}
  .hm-shot figcaption{padding:0 var(--c-gutter)}
  .hm-strip ul{display:grid;grid-template-columns:1fr 1fr;font-size:14px}
  .hm-row{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:78%;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 calc(-1 * var(--c-gutter));padding:0 var(--c-gutter) 8px;scroll-padding:0 var(--c-gutter)}
  .hm-card{scroll-snap-align:start}
  .hm-card img{aspect-ratio:4/5}
  .hm-story p{font-size:17px}
  .hm-shot.gl{margin:28px 0 0;padding:8px 8px 12px}
  .hm-shot.gl img{aspect-ratio:4/5;object-fit:cover;object-position:75% 50%;border-radius:8px}
  .hm-shot.gl figcaption{padding:0 4px}
  .hm-row{padding:4px var(--c-gutter) 24px}
  .hm-card-price.gl,.hm-pane.gl{padding:24px}
}
`;


/* 18 Nov 2026, the team's report (to-10-report.md) and design brief, by his word: the front page does one job, start
   7-day trials of the set. Its copy is the report's, word for word, except where a figure did not check out (see the
   pull request): the 2011 margin hikes were five in eight trading days, TradingView's free plan runs two indicators a
   chart, and he was on the desk from 2003, not since. One button wording, every button a plain Stripe link with its
   own click name. Mentorship, the record and the levels sit in the foot (and one line under the desk story). */
/* 21 Nov 2026, his word of 21:59: "sounds great to add a joining the set tab on the site". A tool that is live on TradingView and
   on its way into the set shows here, after the set's own cards, marked Joining the set, and is not counted in the set's
   number until it moves into H.SET_TOOLS with its page on method.html. The Gate went live, invite-only, at 22:04 Madrid. Its
   chart is his own publication chart, gold 10 minute on TradingView, 19 and 20 November 2026; its question is the one on its
   TradingView page. It read, until then, the five cards and the line: Gold, 15 November 2026 and 18 November 2026. */
const JOINING = [
  { id: "gate", name: "The Gate", img: "set_gate_gold_10m_2026-11-20", h: 503, when: "10 minute, 19 and 20 November 2026",
    alt: "The Gate on Bradley's gold 10 minute chart on TradingView, 19 and 20 November 2026",
    q: "Do the bigger clocks agree with the turn on your chart, and where is the line that proves the trade wrong?" }
];
const BTN = where => `<a class="hs-btn hs-gold" href="${H.SET_CHECKOUT}" data-tv="home-${where}">${H.BUY}</a>`;
const MICRO = "Nothing charged for 7 days. Cancel before day 8 and pay nothing.";
/* Jim, a mentorship client, from the US: his answers as Bradley gave them on 27 Nov 2026, edited for length; brand law
   puts commas where the brief had dashes. The lines that ran on the record page until 18 Nov ("Remoras follow sharks...",
   "Very inconsistent for lack of trading protocol and discipline", "From the first post I saw...") are the same answers. */
const JIM = {
  lead: "It\u2019s about gaining understanding and clarity that go beyond the charts.",
  body: [
    "Before working with Bradley, my trading was inconsistent. I lacked a real protocol and discipline. From the first post I saw from The Simplifier on X, it was clear the approach and philosophy were set apart from the herd.",
    "Learning the Remora philosophy, understanding that remoras follow sharks, knowing what to look for relative to structure and trend, and waiting for the right combination to present itself, made all the difference in the world. The turning point was placing five out of six successful day trades.",
    "If you\u2019re already losing trades, what else do you have to lose, and where else are you going to find this approach?"
  ],
  who: "Jim, from the US",
  note: "Jim is a mentorship client. His own words, edited for length. One trader's experience, not a promise of your result. Trading involves risk and you can lose money."
};
const SUITE = (function () {
  const n = SET.map(x => x.name);
  const list = n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
  return JOINING.length ? list + ", with " + JOINING.map(x => x.name).join(" and ") + " joining the suite" : list;
})();
const TESTIMONIALS = [];   /* real ones only, with their permission; the block shows once one is here */
const FAQ10 = [
  ["Do I need TradingView?", "Yes, your own TradingView account. The tools go on your username within the hour. TradingView's free plan shows two indicators on a chart at a time; its paid plans show more."],
  ["Why a card for a free trial?", "So your tools keep running on day 8 if you stay. Cancel before then and nothing is charged."],
  ["How fast do I get access?", "Added within the hour, or by 09:00 Madrid if you join overnight."],
  ["How do I cancel?", `Cancel from the billing link at the foot of every page, or with one message to me on X.`],
  ["Does it make the decisions for me?", "No. Nothing on the chart says buy or sell. You read it, you decide."],
  ["Which metals?", "Gold, silver and platinum."],
  ["What is the difference between the Desk Suite and mentorship?", "The Desk Suite puts the tools on your own chart for €99 a month. Mentorship is me teaching you to read the market one to one: twelve weeks, two sessions a week, by application. Its price is given on the call and put in writing before you pay."]
];
/* 21 Nov 2026, his word of 19:57 ("i don't use the record anymore") and 20:18 (showcase the lab): the line under the desk story points
   to the lab. It read: Every level I name is graded in public on the close: <a href="record.html">the record</a>. */
/* 27 Nov 2026, his brief of 02:17 (Website Overhaul, the 3-Tier Institutional Funnel): the front page matches the X banner,
   YOUR CHART. THE DESK'S READ., puts the Remora philosophy under the hero, sets out three ways in (the Empirical Lab, free;
   the Desk Suite, €99 a month; 1:1 Desk Mentorship, by application), and puts Jim's words inside the mentorship section.
   This reopens the 18 Nov ruling that kept mentorship in the foot. Figures held to his public word: the London desk ran
   2003 to 2013 (his X bio of 24 Nov) and he has traded for over two decades (mentorship.html), so the brief's "23 years of
   London metals derivatives plumbing" reads as ten years on the desk and two decades of trading. No em dashes (brand law).
   The page it replaced opened: Read gold, silver and platinum the way a desk does. */
const MAIN = `<main id="main" class="hm hm10 hm11" tabindex="-1">

<section class="hm-hero gl-stage" aria-labelledby="hm-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="hm-h1">Your chart. <span class="hm-gold">The desk&rsquo;s read.</span></h1>
      <p class="hm-fromx"><img src="avatar_square.jpg" width="28" height="28" alt="" decoding="async">From @TheSimplifier7 on X</p>
      <p class="hm-say">Ten years on a London metals derivatives desk and two decades of trading, distilled into empirical research, structural TradingView tools and 1:1 desk mentorship. No buy or sell arrows. No macro fairy tales.</p>
      <p class="hm-acts">${BTN("hero")}<a class="hm-alt" href="#mentorship" data-x="home-hero-mentorship">Apply for 1:1 mentorship</a></p>
      <p class="hm-micro">The Desk Suite: 7 days free, then €99 a month. ${MICRO.replace("Nothing charged for 7 days. ", "")}</p>
    </div>
    <figure class="hm-shot gl" data-plate data-seal="${SEAL}">
      <img src="${HERO.img}-1200.webp" srcset="${HERO.img}-640.webp 640w, ${HERO.img}-1200.webp 1200w" sizes="(min-width: 900px) 520px, 100vw" width="1200" height="${HERO.h}" alt="Bradley's gold chart on TradingView, ${esc(HERO.cap.replace(/^Gold, /, ""))}" decoding="async" fetchpriority="high">
      <figcaption>${esc(HERO.cap.replace(/^Gold, [^,]*, /, ""))}. Past chart, not a live trade. Chart by TradingView.</figcaption>
    </figure>
  </div>
</section>

<section class="hm-strip" aria-label="Who and how">
  <div class="hm-in"><ul>
    <li>Since 2003</li><li>London metals derivatives desk</li><li>On your chart within the hour</li><li>Cancel before day 8</li>
  </ul></div>
</section>

<section class="hm-sec gl-stage" id="remora" aria-labelledby="remora-h">
  <div class="hm-in"><div>
    <div class="hm-side" data-plate-copy><h2 id="remora-h">The Remora philosophy</h2></div>
    <div class="hm-main"><div class="hm-pane hm-remora gl" data-plate data-seal="${SEAL}">
      <p class="hm-shark">Sharks move the market. <span class="hm-gold">Remoras get paid.</span></p>
      <p>Most traders lose trying to call the top, the bottom and the next macro story.</p>
      <p>Desks don&rsquo;t trade stories. They move size on collateral, margin and liquidity, and that size leaves its mark in structure and trend.</p>
      <p>You don&rsquo;t need to be the shark. Read the structure and the trend, wait for the sharks to show their hand, and swim alongside them.</p>
    </div></div>
  </div></div>
</section>

<section class="hm-sec hm-wide gl-stage" id="pricing" aria-labelledby="pricing-h">
  <div class="hm-in"><div>
    <div class="hm-side" data-plate-copy><h2 id="pricing-h">Three ways in</h2></div>
    <div class="hm-main">
      <div class="hm-tiers" data-plate data-seal="${SEAL}">
        <article class="hm-tier gl">
          <h3>The Empirical Lab</h3>
          <p class="hm-tp"><b>Free</b></p>
          <p class="hm-tw">Research and TradingView scripts that put what the crowd believes about gold to the test, counted on gold back to 2013.</p>
          <p class="hm-tf">For traders who want proof before they spend a euro.</p>
          <p class="hm-tc"><a class="hs-btn hs-ghost" href="lab.html" data-tv="home-tier-lab">Explore the lab</a></p>
          <p class="hm-micro">No card, no sign-up.</p>
        </article>
        <article class="hm-tier hm-tier-main gl">
          <h3>The Desk Suite</h3>
          <p class="hm-tp"><b>€99</b> a month, VAT included</p>
          <p class="hm-tw">All ${SETL} structural tools on your own TradingView chart: ${SUITE}.</p>
          <p class="hm-tf">For active traders who want institutional structure on their charts.</p>
          <p class="hm-tc">${BTN("tier")}</p>
          <p class="hm-micro">7 days free. Cancel before day 8 and pay nothing. 14-day withdrawal right.</p>
        </article>
        <article class="hm-tier gl">
          <h3>1:1 Desk Mentorship</h3>
          <p class="hm-tp"><b>By application</b></p>
          <p class="hm-tw">Private, one to one, with me: protocol, discipline, structure and the Remora framework. Seats are capped.</p>
          <p class="hm-tf">For serious traders tired of inconsistency who want a real desk protocol.</p>
          <p class="hm-tc"><a class="hs-btn hs-ghost" href="mentorship.html" data-tv="home-tier-mentorship">Apply</a></p>
          <p class="hm-micro">Or send DESK to me <a href="${H.LESSONS}" rel="noopener" data-x="home-tier-dm">on X</a>.</p>
        </article>
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec gl-stage" id="set" aria-labelledby="set-h">
  <div class="hm-in"><div>
    <div class="hm-side" data-plate-copy><h2 id="set-h">The Desk Suite</h2></div>
    <div class="hm-main">
      <div class="hm-row" data-plate data-seal="${SEAL}">
        ${SET.map(x => `<article class="hm-card gl">
          <figure><img src="${x.img}-640.webp" srcset="${x.img}-640.webp 640w, ${x.img}-1200.webp 1200w" sizes="(min-width: 900px) 220px, 78vw" width="1200" height="${x.h}" alt="${esc(x.name)} on Bradley's gold chart on TradingView" loading="lazy" decoding="async"></figure>
          <h3>${esc(x.name)}</h3>
          <p>${esc(x.q)}</p>
        </article>`).join("\n        ")}
        ${JOINING.map(x => `<article class="hm-card gl hm-joining" id="${x.id}">
          <figure><img src="${x.img}-640.webp" srcset="${x.img}-640.webp 640w, ${x.img}-1200.webp 1200w" sizes="(min-width: 900px) 220px, 78vw" width="1200" height="${x.h}" alt="${esc(x.alt)}" loading="lazy" decoding="async"></figure>
          <p class="hm-join">Joining the suite</p>
          <h3>${esc(x.name)}</h3>
          <p>${esc(x.q)}</p>
        </article>`).join("\n        ")}
      </div>
      <p class="hm-fine">${JOINING.length ? "Gold, 15 and 18 November 2026; " + JOINING.map(x => x.name + ", " + x.when).join("; ") : "Gold, 15 November 2026 and 18 November 2026"}. Past charts, not live trades. Charts by TradingView.</p>
      <p class="hm-acts">${BTN("set")}</p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="how" aria-labelledby="how-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="how-h">How the trial works</h2></div>
    <div class="hm-main">
      <ol class="hm-steps">
        <li>Start the trial with your TradingView username.</li>
        <li>The tools land on your chart within the hour.</li>
        <li>Keep them, or cancel before day 8.</li>
      </ol>
      <p class="hm-acts">${BTN("how")}</p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="desk" aria-labelledby="desk-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="desk-h">From the desk</h2></div>
    <div class="hm-main">
      <div class="hm-story">
        <p>May 2011, silver. We sat through five CME margin hikes in eight trading days, and the room sounded like a slaughterhouse with the doors welded shut.</p>
        <p>The ones who lasted were not the ones with the best story. They knew the exit before they were in, and took it without praying.</p>
        <p>That is the habit these tools put on your chart.</p>
      </div>
      <p class="hm-links"><a href="${H.LESSONS}" rel="noopener" data-x="home-desk-lesson">Today's lesson is on X</a></p>
      <p class="hm-fine">Every concept the crowd swears by, counted on gold since 2013: <a href="lab.html">the lab</a>.</p>
    </div>
  </div></div>
</section>

<section class="hm-sec gl-stage" id="mentorship" aria-labelledby="mentorship-h">
  <div class="hm-in"><div>
    <div class="hm-side" data-plate-copy><h2 id="mentorship-h">1:1 Desk Mentorship</h2></div>
    <div class="hm-main">
      <figure class="hm-jim gl" data-plate data-seal="${SEAL}">
        <blockquote>
          <p class="hm-vq">&ldquo;${esc(JIM.lead)}&rdquo;</p>
          ${JIM.body.map(p => `<p>${esc(p)}</p>`).join("\n          ")}
        </blockquote>
        <figcaption><span class="hm-who">${esc(JIM.who)}</span></figcaption>
      </figure>
      <p class="hm-fine">${esc(JIM.note)}</p>
      <div class="hm-mentor">
        <p>Twelve weeks, two sessions a week, on your own TradingView chart. I take you back through past scenarios until you can spot them yourself. I don&rsquo;t tell you when to trade, and no one handles your money.</p>
        <p>The price is given on the call and put in writing before you pay.</p>
        <p class="hm-acts"><a class="hs-btn hs-ghost" href="mentorship.html" data-tv="home-mentorship-apply">Apply for 1:1 mentorship</a><span class="hm-or2">or send DESK to me <a href="${H.LESSONS}" rel="noopener" data-x="home-mentorship-dm">on X</a></span></p>
      </div>
    </div>
  </div></div>
</section>
${TESTIMONIALS.length ? `
<section class="hm-sec" id="voices" aria-labelledby="voices-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="voices-h">From traders using it</h2></div>
    <div class="hm-main">${TESTIMONIALS.map(([q, who]) => `<blockquote><p>${esc(q)}</p><footer>${esc(who)}</footer></blockquote>`).join("")}<p class="hm-fine">Their experience, not a promise of your result.</p></div>
  </div></div>
</section>` : ""}

<section class="hm-sec" id="faq" aria-labelledby="faq-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="faq-h">Questions</h2></div>
    <div class="hm-main">
      <div class="hm-faq">
        ${FAQ10.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n        ")}
      </div>
      <p class="hm-fine">Questions come to me, not a help desk. <a href="mailto:hello@thesimplifier7.com">hello@thesimplifier7.com</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-final gl-stage" id="start" aria-labelledby="final-h">
  <div class="hm-in"><div>
    <div class="hm-side" data-plate-copy><h2 id="final-h">Your chart, the desk's read.</h2></div>
    <div class="hm-main"><div class="hm-pane gl" data-plate data-seal="${SEAL}">
      <p class="hm-big">Gold, silver and platinum only. The Desk Suite, 7 days free, then €99 a month.</p>
      <p class="hm-acts">${BTN("final")}<a class="hm-alt" href="#mentorship" data-x="home-final-mentorship">Or apply for 1:1 mentorship</a></p>
      <p class="hm-micro">${MICRO}</p>
    </div></div>
  </div></div>
</section>

<script src="plate.js?v=${H.vOf("plate.js")}" defer></script>
<script>(function(){try{var m=/[?&]ref=(x-bio|x-pin|x-post|x-reply|x-0800)(?:&|$)/.exec(location.search);if(m)document.documentElement.classList.add("from-x")}catch(e){}})();</script>
</main>`;

/* Any #anchor that is not on this page goes to the record, where the old front page's anchors now live. The page's
   own ids are read from the page itself, so a new section never bounces there. */
const IDS = Array.from(new Set(["main"].concat((MAIN.match(/\sid="([^"]+)"/g) || []).map(x => x.slice(5, -1)))));
const KEEP = "{" + IDS.map(id => JSON.stringify("#" + id) + ":1").join(",") + "}";

const html = H.leanHead({ title: TITLE, description: DESC, canonical: "https://thesimplifier7.com/", image: CARD,
  alt: "The Simplifier. Five TradingView tools for gold, silver and platinum.", css: CSS + CSS10,
  pre: '<script>(function(){var h=location.hash;var keep=' + KEEP + ';if(h&&!keep[h])location.replace("record.html"+location.search+h);})();</script>' }) + `
${H.band(null, "home")}
${MAIN}
${H.tail("home")}
</body>
</html>
`;

if (/—|<!--|!\s|–/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("homepage has an em dash, an en dash, an exclamation or an HTML comment"); process.exit(1); }
if (/monday/i.test(html)) { console.error("the front page still says Monday"); process.exit(1); }
fs.writeFileSync(path.join(HERE, "index.html"), html);
console.log("index.html written: the daily series since " + DAILY.start + ", " + M.days.length + " trading day(s) on file; the weekly series " + t.held + " held, " + t.wrong + " wrong.");
