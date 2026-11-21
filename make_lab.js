#!/usr/bin/env node
/* =========================================================================
   make_lab.js  ·  THE LAB  ·  21 November 2026

   Writes lab.html: the indicator lab's cards. Every concept the trading crowd
   swears by, counted on his broker's one minute gold from 14 January 2013,
   against a baseline named before the run, on a stretch of years chosen and a
   stretch held back to check it. What holds becomes a tool; what does not is
   shown anyway. His word of 21 Nov 2026, 20:18: "we need to showcase that we
   are an indicator lab"; 20:52: The Flow free, The Gate the paid version.

   Every figure below is typed from a count's own output, kept in ALEMBIC
   Mark 2 (the lab's project) beside the script that printed it:
     pools     claude/counts/COUNT_POOLS_21NOV.py, OUT_COUNT_POOLS_21NOV.txt
               (the next 48 five minute candles, i.e. 4 hours)
     channel   claude/counts/COUNT_CHANNEL_BANDS_21NOV.py, OUT_ (method A)
     speeds    claude/counts/COUNT_FLOW_TIDE_21NOV.py, OUT_ (legs of 25 and
               10 mean bar moves)
     stack     claude/code/COUNT_GATE_LADDER5_19NOV.py, OUT_ (THE STACK,
               DAY WITH, DAY AGAINST, all)
   A figure is never worked out here. A new count is a new card, added to
   CARDS with its own source line.

   The desk's line on a card is his, written by him. Until he writes one the
   card carries none; nothing stands in for it.

   Drawn in the calm layer, as the front page is (brand.css alone): Barlow
   for words, IBM Plex Mono for figures, the title in Barlow Condensed at 700
   as on the front page, hairlines, sentence case. The charts are counts, not
   prices, drawn in ink and its two greys; gold is a level's line and is not
   used here.

   Run: node make_lab.js
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;
const esc = H.esc;

const TITLE = "The lab · The Simplifier";
const DESC = "Every concept the trading crowd swears by, counted on every minute of gold since January 2013. What holds becomes a tool on your chart. What does not, I show you anyway.";
const CARD = "https://thesimplifier7.com/card_daily.jpg?v=" + H.vOf("card_daily.jpg");
const BTN = where => `<a class="hs-btn hs-gold" href="${H.SET_CHECKOUT}" data-tv="lab-${where}">${H.BUY}</a>`;
const MICRO = "Nothing charged for 7 days. Cancel before day 8 and pay nothing.";

/* His lines from the desk, one a card. Empty until he writes them. */
/* 21 Nov 2026, 21:29, his word: "write the from the desk in my voice". Drafted by the lab in his voice; his merge is his approval. */
const DESK = {
  pools: "On a bank desk you see the orders, not the lines on a chart. The orders sit where people need to trade, and they move every day. A swing high is a line you drew. Gold has no idea it is there.",
  channel: "A channel is the last fifty closes drawn neatly. The wall promises one close in twenty beyond it and gold gives you one in three. Respect the close, not the line someone fitted to yesterday.",
  speeds: "The fast line keeps you busy. The slow line keeps you in the trade. Over a day the slow half was right more often and changed its mind less than half as often, and every change of mind costs you a spread and a decision.",
  stack: "The trades worth sizing up had the whole day behind them, not just the last hour. One clock saying go is an opinion. Every clock saying go is the market agreeing with you. It stays a lead until the sealed test is in, and the card says so."
};

/* ---- the charts: counts drawn in ink, secondary and muted; figures in Plex Mono ----
   The bars are HTML, so their words never scale with the chart (svgfloor.js sizes words inside an SVG up to
   12 px and hides any that then collide). The one line chart keeps only its marks and three short figures in SVG. */
const pct = (v, m) => (v / m * 100).toFixed(2) + "%";

/* Pools: reached within 4 hours, in 100, by distance in ATRs, earlier stretch (2 Jan 2020 to 30 Jun 2025). */
function poolsChart() {
  const X = [40, 120, 200, 280], y = v => 156 - v * 1.4;
  const pts = a => a.map((v, i) => `${X[i]},${y(v).toFixed(1)}`).join(" ");
  const hiS = [86.7, 71.6, 50.1, 19.5], hiB = [87.8, 72.3, 50.4, 20.5], loS = [87.5, 71.5, 49.9, 19.2], loB = [86.8, 70.7, 49.2, 19.8];
  return `<svg class="lb-svg" viewBox="0 0 320 164" role="img" aria-label="Reached within 4 hours, in 100: swing highs 86.7, 71.6, 50.1 and 19.5 by distance, against 87.8, 72.3, 50.4 and 20.5 for any level as far away; swing lows 87.5, 71.5, 49.9 and 19.2, against 86.8, 70.7, 49.2 and 19.8">
  <g class="lb-grid"><line x1="0" x2="320" y1="16" y2="16"/><line x1="0" x2="320" y1="86" y2="86"/><line x1="0" x2="320" y1="156" y2="156"/></g>
  <text class="lb-ax" x="0" y="12">100</text><text class="lb-ax" x="0" y="82">50</text><text class="lb-ax" x="0" y="152">0</text>
  <polyline class="lb-l1" points="${pts(hiS)}"/><polyline class="lb-l1 lb-dash" points="${pts(hiB)}"/>
  <polyline class="lb-l2" points="${pts(loS)}"/><polyline class="lb-l2 lb-dash" points="${pts(loB)}"/>
</svg>
            <div class="lb-cats lb-c4"><span>under 1</span><span>1 to 2</span><span>2 to 4</span><span>over 4</span></div>`;
}

/* Vertical bars from a common floor: [word, value, ink class], scaled to max. */
function vbars(B, max, label) {
  return `<div class="lb-vb lb-c${B.length}" role="img" aria-label="${esc(label)}">${B.map(([t, v, c]) =>
    `<div class="lb-col"><span class="lb-bar ${c}" style="height:${pct(v, max)}"></span><span class="lb-n" style="bottom:calc(${pct(v, max)} + 6px)">${v.toFixed(1)}</span></div>`).join("")}</div>
            <div class="lb-cats lb-c${B.length}">${B.map(([t]) => `<span>${esc(t)}</span>`).join("")}</div>`;
}

/* Channel: closes beyond a 2 deviation wall in the next 10 candles, in 100, earlier stretch. */
const channelChart = () => vbars([["promised", 4.6, "lb-b3"], ["beyond, all", 31.9, "lb-b1"], ["with the run", 9.3, "lb-b2"], ["against the run", 22.6, "lb-b2"]], 40,
  "Closes beyond a 2 deviation wall in the next 10 candles, in 100: promised 4.6, beyond in all 31.9, with the run 9.3, against the run 22.6");

/* The two speeds: day-long legs and small legs, read right in 100; colour changes a day. Chosen stretch. */
function speedsChart() {
  const R = [["Legs about a day long, read right, in 100", 69.9, 67.5, 100], ["Small legs, read right, in 100", 60.2, 68.0, 100], ["Colour changes a day", 4.3, 9.7, 12]];
  const row = (v, m, c, f) => `<div class="lb-hr"><span class="lb-hbar ${c}" style="width:calc((100% - 56px) * ${(v / m).toFixed(4)})"></span><span class="lb-hn${f}">${v.toFixed(1)}</span></div>`;
  return `<div class="lb-key"><span><i class="lb-b1"></i>slow half</span><span><i class="lb-b3"></i>fast half</span></div>
            <div class="lb-hb" role="img" aria-label="The slow half against the fast half. Legs about a day long: 69.9 against 67.5. Small legs: 60.2 against 68.0. Colour changes a day: 4.3 against 9.7">${R.map(([t, a, b, m]) =>
    `<div class="lb-hg"><p>${esc(t)}</p>${row(a, m, "lb-b1", "")}${row(b, m, "lb-b3", " lb-fm")}</div>`).join("")}</div>`;
}

/* The stack: average a turn in units of its risk, spread paid, 5 minute gold since July 2014. */
function stackChart() {
  const B = [["every clock behind", 0.140, "lb-b1"], ["the day's clock behind", 0.075, "lb-b2"], ["the day's clock against", -0.153, "lb-b3"]];
  const half = 0.2;
  return `<div class="lb-vb lb-zb lb-c3" role="img" aria-label="Average a turn in units of its risk: every clock behind plus 0.140, the day's clock behind plus 0.075, the day's clock against minus 0.153">${B.map(([t, v, c]) => {
    const h = (Math.abs(v) / half * 50).toFixed(2) + "%", lab = (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(3);
    return v >= 0
      ? `<div class="lb-col"><span class="lb-bar ${c}" style="bottom:50%;height:${h}"></span><span class="lb-n" style="bottom:calc(50% + ${h} + 6px)">${lab}</span></div>`
      : `<div class="lb-col"><span class="lb-bar ${c}" style="top:50%;bottom:auto;height:${h}"></span><span class="lb-n" style="top:calc(50% + ${h} + 6px);bottom:auto">${lab}</span></div>`;
  }).join("")}</div>
            <div class="lb-cats lb-c3">${B.map(([t]) => `<span>${esc(t)}</span>`).join("")}</div>`;
}

/* ---- the cards ---- */
const CARDS = [
  { id: "pools", verdict: "Does not hold", q: "Do swing highs and lows pull price to them?",
    a: "No. Price reached the nearest untouched swing high or low as often as any level the same distance away, and a swept one turned back no more often than any other high or low.",
    svg: poolsChart, cap: "Reached within 4 hours, in 100, by distance in ATRs. Solid: the nearest untouched swing high (ivory) or low (grey). Dashed: any level as far away. The lines lie on top of each other.",
    data: "5 minute gold, 2 Jan 2020 to 30 Jun 2025: 28,613 swing highs and 29,683 swing lows. The same answer from 1 Jul 2025 to 30 Oct 2026." },
  { id: "channel", verdict: "Does not hold", q: "Does a channel's 2 deviation wall hold?",
    a: "Not as promised. Carried ten candles on, one close in three went beyond it, against one in twenty promised, and more than twice as often against the run as with it.",
    svg: channelChart, cap: "Closes beyond a wall in the next 10 candles, in 100.",
    data: "5 minute gold, the line over 50 closes, 2 Jan 2020 to 30 Jun 2025: 8,081 channels. From 1 Jul 2025 to 30 Oct 2026: 33.2 beyond." },
  { id: "speeds", verdict: "Holds, on legs about a day long", q: "Does the slow half of a trend read the day better than the fast half?",
    a: "Yes, on legs about a day long: 69.9 in 100 against 67.5, and 69.3 against 66.7 on years the count never saw, changing colour less than half as often. On small legs the fast half reads better, so The Flow keeps both.",
    svg: speedsChart, cap: "The slow half: the 26 over or under the 60. The fast half: the 12 over or under the 26.",
    data: "5 minute gold, chosen on 1 Jul 2025 to 2 Nov 2026: 325 day-long legs. Checked on 2 Jan 2020 to 30 Jun 2025: 1,348.",
    shipped: "Shipped in The Flow: its tide takes its own side." },
  { id: "stack", verdict: "A lead, not yet a sealed test", q: "Does a turn pay more with every bigger clock behind it?",
    a: "On 5 minute gold since July 2014, 11,169 turns with the 23 hour, 8 hour, 2 hour and 40 minute clocks all behind them made 0.140 of their risk a turn, and were ahead in each of three stretches of years. Turns against the day's clock lost 0.153.",
    svg: stackChart, cap: "Average a turn, in units of its risk. Exits at the next 50 dollar levels, spread paid.",
    data: "The turn: the chart's own 40 candle average changing direction. 5 minute gold, July 2014 to 2 Nov 2026.",
    shipped: "Shipped in The Gate: it marks only the turns the whole stack backs." }
];

const cardHtml = c => `<article class="lb-card" id="${c.id}" aria-labelledby="${c.id}-h">
          <div class="lb-t">
            <p class="lb-v">${esc(c.verdict)}</p>
            <h3 id="${c.id}-h">${esc(c.q)}</h3>
            <p class="lb-a">${esc(c.a)}</p>
            <p class="lb-d">${esc(c.data)}</p>${c.shipped ? `\n            <p class="lb-s">${esc(c.shipped)}</p>` : ""}${DESK[c.id] ? `\n            <p class="lb-desk"><b>From the desk</b>${esc(DESK[c.id])}</p>` : ""}
          </div>
          <figure class="lb-fig">
            ${c.svg()}
            <figcaption>${esc(c.cap)}</figcaption></figure>
        </article>`;

const LEDGER = [["Swing highs and lows pull price", "Does not hold", "pools"], ["A channel's 2 deviation wall", "Does not hold", "channel"],
  ["The slow half reads the day", "Holds, day-long legs", "speeds"], ["Every clock behind a turn", "A lead", "stack"], ["Tight compression before a move", "On the bench", "bench"]];

const CSS = `
html body .lb .hm-hero h1.hm-h1{max-width:11em;font:700 clamp(48px,5.6vw,84px)/.92 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;letter-spacing:.005em!important;text-transform:uppercase!important;text-wrap:balance}
.lb .hm-hero{padding:72px 0 56px;overflow:hidden}
.lb .hm-say{margin-top:20px;max-width:34em}
.lb-led{margin:8px 0 0;padding:0;list-style:none;border-top:1px solid var(--c-rule)}
.lb-led li{border-bottom:1px solid var(--c-rule)}
.lb-led a{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:14px 0;font-size:15px;line-height:1.4;color:var(--c-ink);text-decoration:none!important}
.lb-led a span{color:var(--c-sec);text-align:right}
.lb-led a:hover span{color:var(--c-ink)}
.lb-led-h{margin:0;font-size:14px;color:var(--c-mut)}
.lb-cards{display:grid;gap:56px}
.lb-card{scroll-margin-top:72px;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);column-gap:32px;align-items:start;border-top:1px solid var(--c-rule);padding-top:24px}
.lb-cards .lb-card:first-child{border-top:0;padding-top:0}
.lb-v{margin:0 0 8px;font-size:14px;color:var(--c-sec)}
.lb-card h3{margin:0 0 8px;font:500 20px/1.3 var(--c-ui);color:var(--c-ink)}
.lb-a{margin:0;font-size:16px;line-height:1.55;color:var(--c-sec)}
.lb-fig{margin:0;padding:20px 20px 14px;border:1px solid var(--c-rule);border-radius:8px;background:var(--c-raise)}
.lb-fig figcaption{margin-top:10px;font-size:13px;line-height:1.5;color:var(--c-mut)}
.lb-d{margin:12px 0 0;font-size:13px;line-height:1.5;color:var(--c-mut)}
.lb-s{margin:12px 0 0;font-size:15px;line-height:1.5;color:var(--c-ink)}
.lb-desk{margin:16px 0 0;padding-top:12px;border-top:1px solid var(--c-rule);font-size:16px;line-height:1.55;color:var(--c-ink)}
.lb-desk b{display:block;margin-bottom:4px;font-weight:400;font-size:14px;color:var(--c-mut)}
.lb-svg{display:block;width:100%;height:auto;overflow:visible}
.lb-grid line{stroke:var(--c-rule);stroke-width:1;vector-effect:non-scaling-stroke}
.lb-ax{font:400 12px var(--c-fig);fill:var(--c-mut)}
.lb-l1,.lb-l2{fill:none;stroke-width:2;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.lb-l1{stroke:var(--c-ink)}
.lb-l2{stroke:var(--c-sec)}
.lb-dash{stroke-width:1.25;stroke-dasharray:3 3;opacity:.8}
.lb-b1{background:var(--c-ink)}
.lb-b2{background:var(--c-sec)}
.lb-b3{background:var(--c-mut)}
.lb-c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.lb-c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.lb-vb{display:grid;column-gap:12px;height:168px;padding-top:24px}
.lb-col{position:relative;height:100%}
.lb-bar{position:absolute;bottom:0;left:16%;right:16%;border-radius:3px}
.lb-n{position:absolute;left:0;right:0;text-align:center;font:400 13px/1 var(--c-fig);color:var(--c-ink)}
.lb-vb:not(.lb-zb){border-bottom:1px solid var(--c-rule-2)}
.lb-zb{position:relative;height:200px;padding:0}
.lb-zb::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--c-rule-2)}
.lb-cats{display:grid;column-gap:12px;margin-top:10px;font-size:13px;line-height:1.35;color:var(--c-sec);text-align:center}
.lb-key{display:flex;gap:20px;margin-bottom:12px;font-size:13px;color:var(--c-sec)}
.lb-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:-1px}
.lb-hb{display:grid;gap:16px}
.lb-hg p{margin:0 0 6px;font-size:13px;line-height:1.35;color:var(--c-sec)}
.lb-hr{display:flex;align-items:center;gap:8px;height:18px}
.lb-hbar{flex:none;height:12px;border-radius:2px}
.lb-hn{font:400 13px/1 var(--c-fig);color:var(--c-ink)}
.lb-fm{color:var(--c-sec)}
.lb-bench{display:grid;gap:32px}
.lb-bench h3,.lb-tools h3{margin:0 0 6px;font:500 18px/1.3 var(--c-ui);color:var(--c-ink)}
.lb-bench p,.lb-tools p{margin:0;font-size:16px;line-height:1.55;color:var(--c-sec);max-width:40rem}
.lb-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 40px}
.lb-tools .lb-tag{margin:0 0 8px;font-size:14px;color:var(--c-mut)}
.hm-micro{margin:12px 0 0;font-size:14px;line-height:1.5;color:var(--c-mut)}
.hm-final .hm-big{margin:0}
@media (max-width:900px){
  .lb .hm-hero{padding:24px 0 32px}
  html body .lb .hm-hero h1.hm-h1{font-size:clamp(36px,10.6vw,56px)!important}
  .lb .hm-say{margin-top:14px;font-size:17px;line-height:1.5}
  .lb-ledw{margin-top:32px}
  .lb-cards{gap:48px}
  .lb-tools{grid-template-columns:1fr;gap:32px}
  .lb-card{display:block}
  .lb-cards .lb-card:first-child{border-top:0}
  .lb-fig{margin-top:20px;padding:12px 10px 10px}
  .hm-final .hm-acts .hs-btn{width:100%}
}
`;

const MAIN = `<main id="main" class="hm lb" tabindex="-1">

<section class="hm-hero" aria-labelledby="lb-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="lb-h1">Every concept the crowd swears by, counted.</h1>
      <p class="hm-say">On every minute of gold since January 2013, against a fair baseline named before the run, then checked on years the count never saw. What holds becomes a tool on your chart. What does not, I show you anyway.</p>
      <p class="hm-micro">From a trader who started on a London bank metals desk in 2003.</p>
    </div>
    <div class="lb-ledw">
      <p class="lb-led-h">Counted so far</p>
      <ul class="lb-led">
        ${LEDGER.map(([t, v, id]) => `<li><a href="#${id}">${esc(t)}<span>${esc(v)}</span></a></li>`).join("\n        ")}
      </ul>
    </div>
  </div>
</section>

<section class="hm-sec" id="cards" aria-labelledby="cards-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="cards-h">The cards</h2><p>One concept a card: the question, what was counted, what came out.</p></div>
    <div class="hm-main">
      <div class="lb-cards">
        ${CARDS.map(cardHtml).join("\n        ")}
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="bench" aria-labelledby="bench-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="bench-h">On the bench</h2><p>What the lab is counting next.</p></div>
    <div class="hm-main">
      <div class="lb-bench">
        <div><h3>Does tight compression on gold come before a bigger move?</h3><p>Every squeeze since 2013 against quiet stretches of the same length at the same hour. If it holds, it becomes a tool.</p></div>
        <div><h3>Swear by a concept?</h3><p>Send it to the lab on <a href="${H.LESSONS}" rel="noopener" data-x="lab-bench">X</a>. If enough of you swear by it, it gets counted, and you see the card either way.</p></div>
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="shipped" aria-labelledby="shipped-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="shipped-h">Shipped from the lab</h2><p>Only what held. The question behind each tool is on its card.</p></div>
    <div class="hm-main">
      <div class="lb-tools">
        <div><h3>The Flow</h3><p class="lb-tag">Free. Coming to TradingView.</p><p>Which way gold is running, and how hard, as a river on your chart. <a href="#speeds">Its card</a></p></div>
        <div><h3>The Gate</h3><p class="lb-tag">Paid. Live on TradingView, and <a href="./#gate">joining the set</a>.</p><p>Every bigger clock over your chart in one strip, and the line they agree on. <a href="#stack">Its card</a></p></div>
      </div>
      <p class="hm-free" style="margin-top:28px">Not ready? Take the <a href="tools.html">free tools</a> and keep reading the <a href="${H.LESSONS}" rel="noopener" data-x="lab-free-lessons">lessons on X</a>.</p>
    </div>
  </div></div>
</section>

<section class="hm-sec hm-final" id="start" aria-labelledby="final-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="final-h">Your chart, the lab's tools.</h2></div>
    <div class="hm-main">
      <p class="hm-big">Gold, silver and platinum only. 7 days free, then €99 a month.</p>
      <p class="hm-acts">${BTN("final")}</p>
      <p class="hm-micro">${MICRO}</p>
      <p class="hm-fine" style="margin-top:24px">A count describes what gold did on these years. It does not say what gold will do.</p>
    </div>
  </div></div>
</section>
</main>`;

const html = H.leanHead({ title: TITLE, description: DESC, canonical: "https://thesimplifier7.com/lab.html", image: CARD,
  alt: "The Simplifier. The lab: concepts counted on gold.", css: CSS }) + `
${H.band("lab", "lab")}
${MAIN}
${H.tail("lab")}
</body>
</html>
`;

if (/—|<!--|!\s|–|#[A-Za-z]{2,}\b(?![^<]*>)/.test(html.replace(/<!DOCTYPE html>/, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/href="[^"]*"/g, ""))) {
  console.error("lab.html has an em dash, an en dash, an exclamation, a hashtag or an HTML comment"); process.exit(1);
}
fs.writeFileSync(path.join(HERE, "lab.html"), html);
console.log("lab.html written: " + CARDS.length + " cards, " + Object.values(DESK).filter(Boolean).length + " lines from the desk.");
