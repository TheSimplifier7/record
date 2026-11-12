#!/usr/bin/env node
/* Writes index.html from record.json, daily.json and daily.js. The numbers are not typed by hand.
   Run after the record or daily.json changes: node make_home.js
   It does not edit record.json, daily.json or any historical row.

   12 November 2026, notes 69 and 70. The daily series: a level for gold, silver and platinum on every trading
   day, on X at 08:00 CET, each graded on that day's close; the weekly series ended on the close of Friday
   6 November and is kept whole on record.html. The page runs: the promise and the one thing to press, the
   count, today's levels, the last days graded, the standing offer, The Fan, a member, who I am, five questions.
   The email form is gone with The Monday Level.

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
const TITLE = "Daily gold, silver and platinum levels · The Simplifier";
const DESC = "A level for gold, silver and platinum on every trading day, posted at 08:00 CET. Each one is graded on that day's close, and the wrong ones stay up.";
const CW = "Why a card? So the licence carries on after day 7 without you coming back. Nothing is charged for 7 days. Cancel before day 8 from your billing page, or send me one message on X, and you pay nothing.";
const follow = where => `<a class="hs-btn hs-gold" href="${X}" rel="noopener" data-x="${where}">Follow on X for the 08:00 levels</a>`;

const FAQ = [
  ["What do I get free?", `Three levels every trading day, one each for gold, silver and platinum, posted on X at 08:00 CET, and the close that graded each one. <a href="tools.html">Seven open-source TradingView tools</a> are free too.`],
  ["When are the levels posted?", "At 08:00 CET on every trading day. In most weeks that is 02:00 in New York and 07:00 in London."],
  ["How is a level graded?", `${esc(D.RULE)} The wrong ones stay on the page. <a href="levels.html#rule">The rule in full</a>`],
  ["What is The Fan?", `A TradingView indicator, the one my levels are read from. It draws on your own chart and leaves every decision with you. <a href="method.html">See what it shows</a>`],
  ["How do I cancel the trial?", "From the billing page linked at the foot of every page, or with one message to me on X. Cancel before day 8 and you pay nothing."]
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
const SEAL = H.recordSeal(R);   /* the record's seal, as ASSAY keys it: plate.js draws the rosette under the levels from it */

/* The calm page itself (the grid, the titles, the first screen) is brand.css; this is only what the front page alone carries. */
const CSS = `
/* The Fan */
.hm-fan .hm-in>div{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:start}
.hm-fan .hm-side p{max-width:26rem;font-size:17px}
.hm-plans{list-style:none;margin:32px 0 0;padding:0;border-top:1px solid var(--c-rule)}
.hm-plans li{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:16px 0;border-bottom:1px solid var(--c-rule)}
.hm-plans .p{font:500 16px/1.4 var(--c-fig);color:var(--c-ink);text-align:right;white-space:nowrap}
.hm-plans .p span{font:400 14px/1.4 var(--c-ui);color:var(--c-mut);margin-left:8px}
.hm-plans p{grid-column:1/-1;margin:0;font-size:15px;line-height:1.5;max-width:none}
.hm-fan .hm-acts{margin-top:32px}
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

@media (max-width:900px){
  .hm-fan .hm-in>div{display:block}
  .hm-plate{margin-top:40px}
  .hm-ba{gap:20px;margin-top:32px}
}
` + D.CSS;

const html = H.leanHead({ title: TITLE, description: DESC, canonical: "https://thesimplifier7.com/", image: CARD,
  alt: "The Simplifier. Gold, silver and platinum levels, every trading day at 08:00 CET, each one graded at the close.", css: CSS,
  pre: '<script>(function(){var h=location.hash;var keep={"#today":1,"#week":1,"#days":1,"#join":1,"#member":1,"#main":1,"#choose":1,"#offer":1,"#fan":1,"#faq":1,"#who":1};if(h&&!keep[h])location.replace("record.html"+location.search+h);})();</script>' }) + `
${H.band(null, "home")}
<main id="main" class="hm" tabindex="-1">

<section class="hm-hero as-lit" aria-labelledby="hm-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="hm-h1">Gold, silver and platinum levels, every trading day at 08:00 CET.</h1>
      <p class="hm-say">Each one is graded at the close. The wrong ones stay up.</p>
      <p class="hm-acts">${follow("home-hero")}<a href="method.html#plans" data-tv="plans-home-hero">Try The Fan free for 7 days</a></p>
      <div class="hm-rec">
        <p class="as-hall"><span><b>${t.held}</b> held</span><span><b>${t.wrong}</b> wrong</span><span><b>0</b> deleted</span></p>
        <p><a href="record.html">The weekly series</a>, June to November 2026</p>
        <p data-daily="tally">${D.tally(M)}</p>
      </div>
    </div>
    <section class="hm-today" id="today" aria-labelledby="dy-t"><span id="week"></span>
      <div data-plate data-seal="${SEAL}" data-daily="today" data-where="home">${D.todayCard(M, null, "home")}</div>
      <p class="hm-seal">The record's seal <b>${SEAL.slice(0, 6).toUpperCase()}</b>. The engraving under the glass is drawn from every row on the record. Change one figure on the record and it changes.</p>
    </section>
  </div>
</section>

<section class="hm-sec" id="days" aria-labelledby="days-h">
  <div class="hm-in"><div>
    <div class="hm-side">
      <h2 id="days-h">Named before the move. Graded after the close.</h2>
      <p>Every level names its Exit before the move, and every exit stays where you can read it.</p>
    </div>
    <div class="hm-main">
      ${hasDays ? `<h3>The last five days</h3>
      <div data-daily="last">${D.lastDays(M, 5)}</div>` : `<h3>The weekly series, its last five weeks</h3>
      <div data-daily="last">${weeklyLast(5)}</div>`}
      <p class="hm-fine" style="margin-top:16px">Held means the close stayed on the side I named. It is not a trade result.${hasDays ? "" : " The first day of the daily series appears here after its close."}</p>
      <p class="hm-links"><a href="levels.html#days">Every day, in full</a><a href="record.html">The weekly record</a><a href="misses.html">Every wrong weekly call</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="offer" aria-labelledby="offer-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="offer-h">The standing $1,000 offer</h2></div>
    <div class="hm-main">
      <p class="hm-big">Find a call on the weekly record that was changed, backdated or removed after it was published, or a grade that was changed after it was given, and I pay you $1,000 and log the finding on the record.</p>
      <p class="hm-links"><a href="record.html#bounty">Read the offer</a><a href="record.html#rules">How the record is kept</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-fan" id="fan" aria-labelledby="fan-h">
  <div class="hm-in"><div>
    <div class="hm-side">
      <h2 id="fan-h">The Fan, on your chart</h2>
      <p>The indicator my levels are read from. It draws on your own TradingView chart, and you still make every decision.</p>
      <ul class="hm-plans">
        <li><h3>The Fan</h3><span class="p">€149.99<span>a month</span></span><p>Everything in The Method, plus the wider 2-hour view on your shorter chart.</p></li>
        <li><h3>The Method</h3><span class="p">€59<span>a month</span></span><p>The simpler line-based view, for traders who do not need the extra context.</p></li>
      </ul>
      <p class="hm-acts"><a class="hs-btn hs-gold" href="method.html#plans" data-tv="plans-home-fan">Start the 7-day free trial</a><a href="method.html">See what it shows</a></p>
      <p class="hm-fine">7 days free on either plan, VAT included. Card at checkout. ${CW}</p>
    </div>
    <figure class="hm-plate">
      <a href="method.html"><img src="fan_gold_30m_2026-11-01-blurred-1200.webp" srcset="fan_gold_30m_2026-11-01-blurred-640.webp 640w, fan_gold_30m_2026-11-01-blurred-1200.webp 1200w" sizes="(min-width: 900px) 620px, calc(100vw - 40px)" width="1200" height="713" loading="lazy" decoding="async" alt="The Fan on gold, 30 minute, a TradingView snapshot of 1 November 2026 with its labels blurred."></a>
      <figcaption>The Fan on gold, 30 minute, 1 November 2026. Chart by TradingView. Labels blurred.</figcaption>
    </figure>
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

<section class="hm-sec" id="who" aria-labelledby="who-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="who-h">I'm Bradley</h2></div>
    <div class="hm-main">
      <p class="hm-big">Ex-institutional desk, trading since 2003. I build The Fan and The Method, and I publish my levels so you can check what I said against what happened.</p>
      <p class="hm-links"><a href="record.html#rules">How the record is kept</a><a href="tools.html">The free tools</a><a href="mentorship.html">1-to-1 mentorship</a></p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="faq" aria-labelledby="faq-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="faq-h">Five questions</h2></div>
    <div class="hm-main">
      <div class="hm-faq">
        ${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n        ")}
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-close hm-last" id="join" aria-labelledby="choose-h"><span id="choose"></span>
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="choose-h">Start with tomorrow's levels</h2></div>
    <div class="hm-main">
      <p class="hm-big">Three levels at 08:00 CET, and the close that grades each one. Check every grade yourself.</p>
      <p class="hm-acts">${follow("home-close")}<a href="method.html#plans" data-tv="plans-home-close">Try The Fan free for 7 days</a></p>
    </div>
  </div></div>
</section>
</main>
<script src="daily.js?v=${H.vOf("daily.js")}" defer></script>
<script src="plate.js?v=${H.vOf("plate.js")}" defer></script>
${H.tail(null)}
</body>
</html>
`;

if (/—|<!--|!\s|–/.test(html.replace(/<!DOCTYPE html>/, ""))) { console.error("homepage has an em dash, an en dash, an exclamation or an HTML comment"); process.exit(1); }
if (/monday/i.test(html)) { console.error("the front page still says Monday"); process.exit(1); }
fs.writeFileSync(path.join(HERE, "index.html"), html);
console.log("index.html written: the daily series since " + DAILY.start + ", " + M.days.length + " trading day(s) on file; the weekly series " + t.held + " held, " + t.wrong + " wrong.");
