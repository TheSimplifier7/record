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
const TITLE = "Gold and silver indicators for TradingView · The Simplifier";
const DESC = `${["No","One","Two","Three","Four","Five","Six","Seven"][H.SET_TOOLS.length]} invite-only TradingView indicators for gold and silver, built from an institutional metals desk. Read the structure before you trade it. 7 days free, then €99 a month, VAT included.`;
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
.hm-gets{display:grid;gap:32px}
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

const html = H.leanHead({ title: TITLE, description: DESC, canonical: "https://thesimplifier7.com/", image: CARD,
  alt: "The Simplifier. Gold, silver and platinum levels, every trading day before the London open, each one graded at the close.", css: CSS,
  pre: '<script>(function(){var h=location.hash;var keep={"#today":1,"#week":1,"#days":1,"#join":1,"#member":1,"#main":1,"#choose":1,"#offer":1,"#fan":1,"#faq":1,"#who":1,"#set":1,"#price":1,"#mentorship":1,"#trust":1,"#gets":1};if(h&&!keep[h])location.replace("record.html"+location.search+h);})();</script>' }) + `
${H.band(null, "home")}
<main id="main" class="hm" tabindex="-1">

<section class="hm-hero" aria-labelledby="hm-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="hm-h1">Read gold's structure before you trade it</h1>
      <p class="hm-say">${SETW} invite-only indicators for your TradingView chart, built by a trader who started on an institutional metals desk in 2003. They show which side of the mean price is on, which way the flow runs, how far a leg has stretched, whether the swing is confirmed and how much of the structure has turned. You still make every decision.</p>
      <div class="hm-by"><img src="avatar_square.jpg" width="64" height="64" alt="" decoding="async"><p><b>Bradley</b><span>Trading since 2003, from an institutional metals desk.</span></p></div>
      <p class="hm-acts"><a class="hs-btn hs-gold" href="${H.SET_CHECKOUT}" data-tv="home-hero">Start the 7-day trial</a><span class="hm-terms">7 days free, then €99 a month</span></p>${spaceLine}
      <p class="hm-links"><a href="#set">See the ${SETL}</a><a href="mentorship.html" data-tv="home-hero-mentorship">1-to-1 mentorship</a></p>
    </div>
    <figure class="hm-plate hm-shot">
      <a href="#set"><img src="${HERO.img}-1200.webp" srcset="${HERO.img}-640.webp 640w, ${HERO.img}-1200.webp 1200w" sizes="(min-width: 900px) 520px, calc(100vw - 40px)" width="1200" height="${HERO.h}" alt="${esc(HERO.alt)}" decoding="async" fetchpriority="high"></a>
      <figcaption>${esc(HERO.name)} on ${esc(HERO.cap.replace(/^Gold/, "gold"))}. Chart by TradingView. A past chart, not a live trade.</figcaption>
    </figure>
  </div>
</section>

<section class="hm-sec" id="gets" aria-labelledby="gets-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="gets-h">What it gives you</h2></div>
    <div class="hm-main">
      <div class="hm-gets">
        <div><h3>Structure, not noise</h3><p>${SETW} readings on one chart, each answering one question, so you know where price stands before you act.</p></div>
        <div><h3>Your exit before your entry</h3><p>The Keel names the exact close that would end the flow, and The Ratchet's trail flips only on a close back through it. You see what would prove you wrong before you are in.</p></div>
        <div><h3>A read you learn, not a signal you follow</h3><p>Each tool says what it will not do, and nothing on the chart tells you to buy or sell. You learn to judge the structure yourself, and the mentorship takes that further.</p></div>
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="set" aria-labelledby="set-h">
  <div class="hm-in"><div>
    <div class="hm-side">
      <h2 id="set-h">One question each</h2>
      <p>They are built to read together on one chart, and each one says what it will not do.</p>
    </div>
    <div class="hm-main">
      <div class="hm-set">
        ${SET.map(x => `<article class="hm-tool">
          <figure class="hm-plate"><img src="${x.img}-640.webp" srcset="${x.img}-640.webp 640w, ${x.img}-1200.webp 1200w" sizes="(min-width: 900px) 340px, calc(100vw - 40px)" width="1200" height="${x.h}" alt="${esc(x.alt)}" loading="lazy" decoding="async"><figcaption>${esc(x.cap)}. Chart by TradingView.</figcaption></figure>
          <h3>${esc(x.name)}</h3>
          <p>${esc(x.q)}</p>
          <p class="hm-not">${esc(x.not)}</p>
        </article>`).join("\n        ")}
      </div>
      <p class="hm-fine" style="margin-top:24px">Past charts, not live trades.</p>
      <p class="hm-links"><a href="method.html">What the counts say, and before you start</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="price" aria-labelledby="price-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="price-h">One plan, all ${SETL}</h2></div>
    <div class="hm-main">
      <p class="hm-big"><b>€99</b> a month for all ${SETL}, VAT included</p>
      <ol class="hm-steps">
        <li>Start the 7-day trial. Nothing is charged for 7 days.</li>
        <li>Give your TradingView username at checkout, never your password.</li>
        <li>The ${SETL} tools are added to it within the hour, or by 09:00 Madrid if you join overnight.</li>
      </ol>
      <p class="hm-acts"><a class="hs-btn hs-gold" href="${H.SET_CHECKOUT}" data-tv="home-price">Start the 7-day trial</a></p>
      <p class="hm-fine">${H.SET_TERMS} <a href="${H.BILLING}" rel="noopener">Manage or cancel your subscription</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-voice" id="member" aria-labelledby="member-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="member-h">From a member</h2></div>
    <div class="hm-main">
      <blockquote><p>Knowing what to look for relative to structure and trend, and waiting for the right combination to present itself, makes all the difference in the world.</p></blockquote>
      <p class="hm-who">Jim, US</p>
      <div class="hm-ba"><p><b>Before</b>Very inconsistent for lack of trading protocol and discipline.</p><p><b>Now</b>Still a bit gun-shy, but gaining confidence and comfort.</p></div>
      <p class="hm-fine">One person's experience, not a promise of your result.</p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="mentorship" aria-labelledby="mentor-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="mentor-h">1-to-1 mentorship</h2><p>Serious traders only.</p></div>
    <div class="hm-main">
      <p class="hm-big">A transfer of knowledge from someone who has been in the pit and has traded for over two decades. You learn to read the market and the conditions it sets up for selling and for buying, so you can judge them yourself.</p>
      <p>Twenty-four 60-minute sessions over twelve weeks, two a week, on your own TradingView chart. This is personal teaching, not the indicator subscription. The price is given on the call and put in writing before payment.</p>
      <p class="hm-acts"><a class="hs-btn hs-ghost" href="mentorship.html" data-tv="home-mentorship">See the mentorship</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="faq" aria-labelledby="faq-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="faq-h">Questions</h2></div>
    <div class="hm-main">
      <div class="hm-faq">
        ${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n        ")}
      </div>
    </div>
  </div></div>
</section>

</main>
${H.tail(null)}
</body>
</html>
`;

if (/—|<!--|!\s|–/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("homepage has an em dash, an en dash, an exclamation or an HTML comment"); process.exit(1); }
if (/monday/i.test(html)) { console.error("the front page still says Monday"); process.exit(1); }
fs.writeFileSync(path.join(HERE, "index.html"), html);
console.log("index.html written: the daily series since " + DAILY.start + ", " + M.days.length + " trading day(s) on file; the weekly series " + t.held + " held, " + t.wrong + " wrong.");
