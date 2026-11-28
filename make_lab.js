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
   22 Nov 2026, 13:21, his yes to the one-source PR: every chart now draws
   from lab.json, which the lab writes from its FINDINGS.json (his yes of
   22 Nov, 02:59) with claude/code/MAKE_LAB_JSON_22NOV.py, and this script
   refuses to write the page if a card's words print a figure lab.json does
   not hold for that card. The tone of each card comes from its verdict word
   as filed. The counts above stay the cards' sources.

   The desk's line on a card is his, written by him. Until he writes one the
   card carries none; nothing stands in for it.

   Drawn in the calm layer, as the front page is (brand.css alone): Barlow
   for words, IBM Plex Mono for figures, the title in Barlow Condensed at 700
   as on the front page, hairlines, sentence case. The charts are counts, not
   prices, drawn in ink and its two greys; gold is a level's line and is not
   used here.
   22 Nov 2026, 00:32, his word, superseding the line above: "use some of our
   brighter house colors because the page is fucking born, especially the
   charts". The page now speaks the record's own colours plus house blue:
   gold where a concept held, red where it broke, ivory while it is a lead,
   grey while it is on the bench, and blue (light blue, light red beside
   them) for what it was measured against. A faint glow of each mark's own
   colour, as his ruling of 15 Nov allows.

   Run: node make_lab.js
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;
/* 25 Nov 2026, HALLMARK, his word of 00:55: glass on every thing. The counted list sits on glass over the record's rosette (plate.js),
   cut from the record's seal; every chart sits on glass over the same rosette, drawn still (rosette.svg, make_rosette.js). */
const SEAL = H.recordSeal(JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8")));
const esc = H.esc;

/* THE ONE SOURCE: lab.json, written by the lab from FINDINGS.json. */
const LAB = JSON.parse(fs.readFileSync(path.join(HERE, "lab.json"), "utf8")).cards;
const F = id => { if (!LAB[id]) throw new Error("lab.json has no card " + id); return LAB[id]; };

/* 25 Nov 2026, his word of 00:43 ("let people know what is the method to the madness...write like a human") and 01:00
   ("make it fucking intriguing. make people interested in coming back"). The page now leads with the method: how a tool
   gets made, the six checks, what is on the bench and which checks each has passed, the bin, and a dated log. Those come
   from lab_desk.json, which the lab writes from its own records (each entry names its source) and only ever adds to.
   Every figure an entry prints must be in that entry's own figures list, or the build stops. */
/* 25 Nov 2026, his word of 01:21: "remove the cards, they take up a lot of real estate". The five cards are off the page.
   Their verdicts stay in the hero's counted list; every card's words, figures and charts stay in CARDS below and in
   lab.json, still checked on every build, so a card can come back with one line. Nothing is deleted. */
const DESKF = JSON.parse(fs.readFileSync(path.join(HERE, "lab_desk.json"), "utf8"));
/* 27 Nov 2026, 10:18, his word: a shipped tool's TradingView link goes in lab_desk.json ("url"); with it, the tool reads
   Live on TradingView, linked, everywhere on the page. Without it, it reads as the desk file says. */
for (const x of DESKF.shipped) if (x.url) x.state = "Live on TradingView";
const FLOW = DESKF.shipped.find(x => x.name === "The Flow") || {};
const FLOW_TAG = FLOW.url ? `Free. <a href="${H.aff(FLOW.url)}" ${H.OUT} data-tv="lab-flow-tv">Live on TradingView</a>.` : "Free. " + esc(FLOW.state || "Coming to TradingView") + ".";
for (const [part, list] of [["bench", DESKF.bench], ["bin", DESKF.bin], ["log", DESKF.log]]) {
  for (const e of list) {
    const words = [e.text, e.what, e.why].filter(Boolean).join(" ");
    for (const tok of words.match(/\d{1,3}(?:,\d{3})+|\d+/g) || []) {
      const n = +tok.replace(/,/g, "");
      if (!(e.figures || []).includes(n)) throw new Error("lab_desk.json " + part + ": " + tok + " is not in its figures: " + words);
    }
    if (!e.src) throw new Error("lab_desk.json " + part + ": an entry names no source: " + words);
  }
}
const STOPS = ["Idea", ...DESKF.checks, "Your chart"];
const reach = t => { let k = 0; while (k < 6 && t.passed[k]) k++; return k; };
const BIN_C = DESKF.bin.filter(e => e.kind === "concept").length;
const BIN_D = DESKF.bin.filter(e => e.kind === "draft").reduce((a, e) => a + (/drafts (\d+) to (\d+)/.test(e.what) ? (+RegExp.$2 - +RegExp.$1 + 1) : 1), 0);
const TRACK_ALT = "The six checks as a track. " + DESKF.bench.map(t => t.name + ": " + reach(t) + " of 6 checks passed, " + t.state).join(". ") + ". In the bin: " + BIN_C + " concepts and " + BIN_D + " tool drafts.";
for (const b of DESKF.bench) if (b.passed.length !== DESKF.checks.length) throw new Error("lab_desk.json: " + b.name + " does not mark all six checks");

const TITLE = "The lab · The Simplifier";
const DESC = "How THE SIMPLIFIER's gold indicators get made: six checks and a desk that throws most of it out. What survives goes on your chart. What dies stays on the page.";
const CARD = H.OG_LAB();   /* 28 Nov 2026: the lab's own card (make_og_cards.js); it read card_daily.jpg, the levels card */
const BTN = where => `<a class="hs-btn hs-gold" href="${H.SET_CHECKOUT}" data-tv="lab-${where}">${H.BUY}</a>`;
const MICRO = "Nothing charged for 7 days. Cancel before day 8 and pay nothing.";

/* His lines from the desk, one a card. Empty until he writes them. */
/* 23 Nov 2026, 05:5x: the two speeds' desk line redrafted in his voice after F-003 (DOES NOT HOLD against shuffled candles); the line it replaces is in git. 08:0x: one clause narrowed on R&D's FIGURES FIX of 07:52. */
/* 22 Nov 2026, 02:4x: the coil's ATR words as R&D confirmed them (RD_FINDINGS 02:3x; F-001a, P-001), replacing "it would have passed".
   22 Nov 2026, 00:21: the coil's card from F-001; its desk line drafted in his voice by his standing word.
   21 Nov 2026, 21:29, his word: "write the from the desk in my voice". Drafted by the lab in his voice; his merge is his approval. */
const DESK = {
  coil: "Every desk has someone sitting on a quiet market, waiting for it to explode. Most days it stays quiet and he pays for the wait. On gold, quiet came before quiet.",
  pools: "On a bank desk you see the orders, not the lines on a chart. The orders sit where people need to trade, and they move every day. A swing high is a line you drew. Gold has no idea it is there.",
  channel: "A channel is the last fifty closes drawn neatly. The wall promises one close in twenty beyond it and gold gives you one in three. Respect the close, not the line someone fitted to yesterday.",
  speeds: "I built the slow line, then had my own count of it run against gold's candles shuffled. The shuffled candles scored higher, so it reads the day's legs no better than shuffled candles do. What it does do is change its mind less than half as often as the fast line, and every change of mind costs you a spread and a decision.",
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
  const P = F("pools").figures.lab_chart_by_distance_in_100;
  const hiS = P.swing_highs, hiB = P.any_level_highs, loS = P.swing_lows, loB = P.any_level_lows;
  return `<div class="lb-key"><span><i class="lb-red"></i>swing high</span><span><i class="lb-rose"></i>swing low</span><span><i class="lb-dsh lb-blue"></i>any level as far away</span></div>
            <svg class="lb-svg" viewBox="0 0 320 164" role="img" aria-label="Reached within 4 hours, in 100: swing highs ${hiS.join(", ")} by distance, against ${hiB.join(", ")} for any level as far away; swing lows ${loS.join(", ")}, against ${loB.join(", ")}">
  <g class="lb-grid"><line x1="0" x2="320" y1="16" y2="16"/><line x1="0" x2="320" y1="86" y2="86"/><line x1="0" x2="320" y1="156" y2="156"/></g>
  <text class="lb-ax" x="0" y="12">100</text><text class="lb-ax" x="0" y="82">50</text><text class="lb-ax" x="0" y="152">0</text>
  <defs><linearGradient id="lb-pool-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0604A" stop-opacity=".32"/><stop offset="1" stop-color="#F0604A" stop-opacity="0"/></linearGradient></defs>
  <polygon class="lb-area" fill="url(#lb-pool-fill)" points="${X[0]},156 ${pts(hiS)} ${X[3]},156"/>
  <polyline class="lb-ln lb-red" points="${pts(hiS)}"/><polyline class="lb-ln lb-rose" points="${pts(loS)}"/>
  <polyline class="lb-ln lb-dash lb-blue" points="${pts(hiB)}"/><polyline class="lb-ln lb-dash lb-ice" points="${pts(loB)}"/>
</svg>
            <div class="lb-cats lb-c4">${P.distance_atr_buckets.map(t => `<span>${esc(t)}</span>`).join("")}</div>`;
}

/* Vertical bars from a common floor: [word, value, ink class], scaled to max. */
function vbars(B, max, label) {
  return `<div class="lb-vb lb-c${B.length}" role="img" aria-label="${esc(label)}">${B.map(([t, v, c]) =>
    `<div class="lb-col"><span class="lb-bar ${c}" style="height:${pct(v, max)}"></span><span class="lb-n ${c}" style="bottom:calc(${pct(v, max)} + 6px)">${v.toFixed(1)}</span></div>`).join("")}</div>
            <div class="lb-cats lb-c${B.length}">${B.map(([t]) => `<span>${esc(t)}</span>`).join("")}</div>`;
}

/* Channel: closes beyond a 2 deviation wall in the next 10 candles, in 100, earlier stretch. */
const channelChart = () => { const C = F("channel").figures.closes_beyond_in_next_10_in_100;
  return vbars([["promised", C.promised, "lb-blue"], ["beyond, all", C.beyond_all, "lb-red"], ["with the run", C.with_the_run, "lb-rose"], ["against the run", C.against_the_run, "lb-red"]], 40,
  `Closes beyond a 2 deviation wall in the next 10 candles, in 100: promised ${C.promised}, beyond in all ${C.beyond_all}, with the run ${C.with_the_run}, against the run ${C.against_the_run}`); };

/* The two speeds, F-003: day-long legs the slow half matched, in 100, on gold in order against the same candles shuffled inside each day. */
function speedsChart() {
  const T = F("speeds").figures.tide_matched_day_legs_in_100;
  const R = [["Jul 2025 to Nov 2026", T.gold_chosen, T.shuffled_chosen], ["2020 to mid 2025", T.gold_checked, T.shuffled_checked]];
  const row = (v, c) => `<div class="lb-hr"><span class="lb-hbar ${c}" style="width:calc((100% - 56px) * ${(v / 100).toFixed(4)})"></span><span class="lb-hn ${c}">${v.toFixed(1)}</span></div>`;
  return `<div class="lb-key"><span><i class="lb-red"></i>gold, in order</span><span><i class="lb-grey"></i>the same candles, shuffled</span></div>
            <div class="lb-hb" role="img" aria-label="Day-long legs the slow half matched, in 100. ${R.map(([t, a, b]) => `${t}: gold ${a.toFixed(1)}, shuffled ${b.toFixed(1)}`).join(". ")}">${R.map(([t, a, b]) =>
    `<div class="lb-hg"><p>${esc(t)}</p>${row(a, "lb-red")}${row(b, "lb-grey")}</div>`).join("")}</div>`;
}

/* The stack: average a turn in units of its risk, spread paid, 5 minute gold since July 2014. */
function stackChart() {
  const T = F("stack").figures.R_per_turn;
  const B = [["every clock behind", T.every_clock_behind, "lb-ivory"], ["the day's clock behind", T.day_clock_behind, "lb-blue"], ["the day's clock against", T.day_clock_against, "lb-red"]];
  const half = 0.2;
  return `<div class="lb-vb lb-zb lb-c3" role="img" aria-label="Average a turn in units of its risk: ${B.map(([t, v]) => `${t} ${v >= 0 ? "plus" : "minus"} ${Math.abs(v).toFixed(3)}`).join(", ")}">${B.map(([t, v, c]) => {
    const h = (Math.abs(v) / half * 50).toFixed(2) + "%", lab = (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(3);
    return v >= 0
      ? `<div class="lb-col"><span class="lb-bar ${c}" style="bottom:50%;height:${h}"></span><span class="lb-n ${c}" style="bottom:calc(50% + ${h} + 6px)">${lab}</span></div>`
      : `<div class="lb-col"><span class="lb-bar lb-neg ${c}" style="top:50%;bottom:auto;height:${h}"></span><span class="lb-n ${c}" style="top:calc(50% + ${h} + 6px);bottom:auto">${lab}</span></div>`;
  }).join("")}</div>
            <div class="lb-cats lb-c3">${B.map(([t]) => `<span>${esc(t)}</span>`).join("")}</div>`;
}

/* The coil, F-001 (ALEMBIC R&D, 22 Nov 2026, RD_FINDINGS): the median range of the next 12 candles against the usual range for
   that slot of the day over the trailing 365 days; after a squeeze against after an ordinary candle at the same slot. Typed from
   the finding as filed: 5 minutes 0.80 and 1.38 (chosen), 0.80 and 1.17 (checked); 40 minutes 0.89 and 1.30, 0.85 and 1.16. */
function coilChart() {
  const cell = (k, w) => { const c = F("coil").cells.find(x => x.clock === k && x.window === w); if (!c) throw new Error("coil cell " + k + " " + w); return c; };
  const R = [["5m", "chosen"], ["5m", "checked"], ["40m", "chosen"], ["40m", "checked"]].map(([k, w]) => { const c = cell(k, w);
    return [k === "5m" ? "5 min" : "40 min", w === "chosen" ? "2025 to 2026" : "2020 to 2025", c.coil_read, c.baseline_read]; });
  const max = 1.6;
  return `<div class="lb-key"><span><i class="lb-red"></i>after a squeeze</span><span><i class="lb-blue"></i>after an ordinary stretch</span><span><i class="lb-dsh"></i>the usual range for that hour</span></div>
            <div class="lb-vb lb-c4" role="img" aria-label="The range of the next 12 candles against the usual range for that hour, after a squeeze and after an ordinary stretch. ${R.map(([c, w, a, b]) => `${c.replace("min", "minutes")}, ${w}: ${a.toFixed(2)} and ${b.toFixed(2)}`).join(". ")}">${R.map(([c, w, a, b]) =>
    `<div class="lb-col"><span class="lb-one" style="bottom:${pct(1, max)}"></span><span class="lb-bar lb-red lb-pl" style="height:${pct(a, max)}"></span><span class="lb-n lb-nl lb-red" style="bottom:calc(${pct(a, max)} + 5px)"><b class="lb-nb">${a.toFixed(2)}</b></span><span class="lb-bar lb-blue lb-pr" style="height:${pct(b, max)}"></span><span class="lb-n lb-nr lb-blue" style="bottom:calc(${pct(b, max)} + 5px)"><b class="lb-nb">${b.toFixed(2)}</b></span></div>`).join("")}</div>
            <div class="lb-cats lb-c4">${R.map(([c, w]) => `<span>${c}<br>${w}</span>`).join("")}</div>`;
}

/* ---- the cards ---- */
const CARDS = [
  { id: "coil", led: "A squeeze comes before a bigger move", ledv: "Does not hold", tone: "lb-red", verdict: "Does not hold", q: "Does a squeeze on gold come before a bigger move?",
    a: "No. After a squeeze, the next 12 candles moved less than they do after an ordinary stretch at the same hour of the day, on both clocks and on both stretches of years. Measured in ATRs, every clock reads the move after a squeeze bigger, 1.05 to 1.14 times an ordinary stretch: the ATR shrinks while price is quiet, so any move after it looks big.",
    svg: coilChart, cap: "The range of the next 12 candles against the usual range for that hour of the day, the median of each.",
    data: "A squeeze: the last 12 candles' range in the lowest tenth of the past year's on that clock. 5 minute gold: 486 squeezes from 1 Jul 2025 to 2 Nov 2026, 3,210 from 2 Jan 2020 to 30 Jun 2025. 40 minute gold: 76 and 559. Squeeze against ordinary stretch: 0.58 to 0.73 on the hour's usual range, 1.05 to 1.14 in ATRs. On the lab's standing protocol three cells fail and 40 minutes since July 2025 is too few to say (76)." },
  { id: "pools", led: "Swing highs and lows pull price", ledv: "Does not hold", tone: "lb-red", verdict: "Does not hold", q: "Do swing highs and lows pull price to them?",
    a: "No. Price reached the nearest untouched swing high or low as often as any level the same distance away, and a swept one turned back no more often than any other high or low.",
    svg: poolsChart, cap: "Reached within 4 hours, in 100, by distance in ATRs: the nearest untouched swing high or low, against any level as far away (dashed). The lines lie on top of each other.",
    data: "5 minute gold, 2 Jan 2020 to 30 Jun 2025: 28,613 swing highs and 29,683 swing lows. The same answer from 1 Jul 2025 to 30 Oct 2026." },
  { id: "channel", led: "A channel's 2 deviation wall", ledv: "Does not hold", tone: "lb-red", verdict: "Does not hold", q: "Does a channel's 2 deviation wall hold?",
    a: "Not as promised. Carried ten candles on, one close in three went beyond it, against one in twenty promised, and more than twice as often against the run as with it.",
    svg: channelChart, cap: "Closes beyond a wall in the next 10 candles, in 100.",
    data: "5 minute gold, the line over 50 closes, 2 Jan 2020 to 30 Jun 2025: 8,081 channels. From 1 Jul 2025 to 30 Oct 2026: 33.2 beyond." },
  { id: "speeds", led: "The slow half reads the day", ledv: "Does not hold", tone: "lb-red", verdict: "Does not hold, against gold's own candles shuffled", q: "Does the slow half of a trend read the day better than the fast half?",
    a: "No. It matched legs about a day long 69.9 and 69.3 times in 100, but on the same candles shuffled inside each day it matched them 72.8 and 72.2 times on average over 200 shuffles: inside the day, gold's candle order gave it nothing over random order. Read forward, its side matched the next 276 candles' move 50.2 and 50.1 times in 100; saying up every time matched 52.7 and 53.7.",
    svg: speedsChart, cap: "Legs about a day long the slow half matched, in 100: gold in order against the same candles shuffled.",
    data: "5 minute gold, chosen on 1 Jul 2025 to 2 Nov 2026: 325 day-long legs. Checked on 2 Jan 2020 to 30 Jun 2025: 1,348. 200 shuffled copies of each. As I first filed it, the slow half beat the fast half 69.9 to 67.5 and 69.3 to 66.7; the shuffled candles show a gap as big.",
    shipped: "The Flow keeps the slow half for what it does: it changes colour 4.3 times a day against the fast half's 9.7 to 9.8. That describes, it does not predict." },
  { id: "stack", led: "Every clock behind a turn", ledv: "A lead", tone: "lb-ivory", verdict: "A lead, not yet a sealed test", q: "Does a turn pay more with every bigger clock behind it?",
    a: "On 5 minute gold since July 2014, 11,169 turns with the 23 hour, 8 hour, 2 hour and 40 minute clocks all behind them made 0.140 of their risk a turn, and were ahead in each of three stretches of years. Turns against the day's clock lost 0.153.",
    svg: stackChart, cap: "Average a turn, in units of its risk. Exits at the next 50 dollar levels, spread paid.",
    data: "The turn: the chart's own 40 candle average changing direction. 5 minute gold, July 2014 to 2 Nov 2026.",
    shipped: "Shipped in The Gate: it marks only the turns the whole stack backs." }
];

/* The tone of a card is its verdict word as filed; the card's own words must say the same. */
const TONE = [[/^HOLDS/, "lb-gold", /^Holds/], [/^DOES NOT HOLD/, "lb-red", /^Does not hold/], [/^A LEAD/, "lb-ivory", /^A lead/]];
for (const c of CARDS) {
  const v = F(c.id).verdict, t = TONE.find(([re]) => re.test(v));
  if (!t) throw new Error(c.id + ": verdict word not known: " + v);
  if (!t[2].test(c.verdict)) throw new Error(c.id + ": the card says \"" + c.verdict + "\" but lab.json files " + v);
  c.tone = t[1];
}

/* THE FIGURE CHECK. Every figure a card's words print must be one lab.json holds for that card (any value, key or
   filed sentence of it), at the precision printed. A figure the source does not hold stops the build. */
const NUM = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;
const numbersOf = v => typeof v === "number" ? [v] : typeof v === "string" ? (v.match(NUM) || []).map(x => +x.replace(/,/g, ""))
  : Array.isArray(v) ? v.flatMap(numbersOf) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [...numbersOf(k), ...numbersOf(x)]) : [];
for (const c of CARDS) {
  const hay = numbersOf(F(c.id)).map(Math.abs);
  for (const field of ["q", "a", "data", "cap", "shipped"]) {
    for (const tok of (c[field] || "").match(NUM) || []) {
      const p = +tok.replace(/,/g, ""), d = (tok.split(".")[1] || "").length;
      if (!hay.some(h => Math.abs(+h.toFixed(d) - p) < 1e-9)) throw new Error(c.id + "." + field + ": " + tok + " is not in lab.json");
    }
  }
}
const SCORE = ["lb-gold", "lb-red", "lb-ivory"].map(k => CARDS.filter(c => c.tone === k).length);

const cardHtml = c => `<article class="lb-card" id="${c.id}" aria-labelledby="${c.id}-h">
          <div class="lb-t">
            <p class="lb-v ${c.tone}">${esc(c.verdict)}</p>
            <h3 id="${c.id}-h">${esc(c.q)}</h3>
            <p class="lb-a">${esc(c.a)}</p>
            <p class="lb-d">${esc(c.data)}</p>${c.shipped ? `\n            <p class="lb-s">${esc(c.shipped)}</p>` : ""}${c.owed ? `\n            <p class="lb-d">${esc(c.owed)}</p>` : ""}${DESK[c.id] ? `\n            <p class="lb-desk"><b>From the desk</b>${esc(DESK[c.id])}</p>` : ""}
            <p class="lb-rule">Trade it differently? <a href="${H.LESSONS}" rel="noopener" data-x="lab-rule-${c.id}">Send me your exact rule on X</a>. Each month I count the rule asked for most.</p>
          </div>
          <figure class="lb-fig gl">
            ${c.svg()}
            <figcaption>${esc(c.cap)}</figcaption></figure>
        </article>`;

const LEDGER = [...CARDS.map(c => [c.led, c.ledv, c.id, c.tone]), ["Gold turns at round numbers", "On the bench", "bench", "lb-grey"]];

const CSS = `
html body .lb .hm-hero h1.hm-h1{max-width:11em;font:700 clamp(48px,5.6vw,84px)/.92 "Barlow Condensed","Barlow Condensed Fallback","Arial Narrow",sans-serif!important;letter-spacing:.005em!important;text-transform:uppercase!important;text-wrap:balance}
.lb .hm-hero{padding:72px 0 56px;overflow:hidden}
.lb .hm-say{margin-top:20px;max-width:34em}
.lb-led{margin:8px 0 0;padding:0;list-style:none;border-top:1px solid var(--c-rule)}
.lb-led li{border-bottom:1px solid var(--c-rule)}
.lb-led a,.lb-led .lb-lr{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:14px 0;font-size:15px;line-height:1.4;color:var(--c-ink);text-decoration:none!important}
.lb-led a span,.lb-led .lb-lr span{color:var(--c-sec);text-align:right}
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
.lb-rule{margin:12px 0 0;font-size:14px;line-height:1.5;color:var(--c-mut)}
.lb-rule a{color:var(--c-sec)}
.lb-desk{margin:16px 0 0;padding-top:12px;border-top:1px solid var(--c-rule);font-size:16px;line-height:1.55;color:var(--c-ink)}
.lb-desk b{display:block;margin-bottom:4px;font-weight:400;font-size:14px;color:var(--c-mut)}
.lb-svg{display:block;width:100%;height:auto;overflow:visible}
.lb-grid line{stroke:var(--c-rule);stroke-width:1;vector-effect:non-scaling-stroke}
.lb-ax{font:400 12px var(--c-fig);fill:var(--c-mut)}
.lb-red{--k:var(--c-red);--kt:#EE7B70}
.lb-rose{--k:#F6C9C4;--kt:#F6C9C4}
.lb-gold{--k:var(--c-gold);--kt:var(--c-gold)}
.lb-blue{--k:#8DB0F5;--kt:#8DB0F5}
.lb-ice{--k:#DCE6FA;--kt:#DCE6FA}
.lb-ivory{--k:var(--c-ink);--kt:var(--c-ink)}
.lb-grey{--k:var(--c-sec);--kt:var(--c-sec)}
.lb-ln{fill:none;stroke:var(--k);stroke-width:2.75;stroke-linejoin:round;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--k) 55%,transparent))}
.lb-dash{stroke-width:1.75;stroke-dasharray:4 4;filter:none}
.lb-bar,.lb-hbar{background:var(--k);background:linear-gradient(to top,color-mix(in srgb,var(--k) 55%,transparent),var(--k));box-shadow:0 0 18px color-mix(in srgb,var(--k) 30%,transparent)}
.lb-hbar{background:linear-gradient(to right,color-mix(in srgb,var(--k) 55%,transparent),var(--k))}
.lb-bar.lb-neg{background:linear-gradient(to bottom,color-mix(in srgb,var(--k) 55%,transparent),var(--k))}
.lb-n.lb-red,.lb-n.lb-rose,.lb-n.lb-gold,.lb-n.lb-blue,.lb-n.lb-ivory,.lb-hn{color:var(--kt,var(--c-ink))}
.lb-key i{background:var(--k)}
.lb-key i:not(.lb-dsh){box-shadow:0 0 8px color-mix(in srgb,var(--k) 45%,transparent)}
.lb-v{display:flex;align-items:center;gap:10px;font-weight:500;color:var(--kt)!important}
.lb-v::before,.lb-lv::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--k);box-shadow:0 0 10px var(--k)}
.lb-led a span.lb-lv,.lb-led .lb-lr span.lb-lv{display:inline-flex;align-items:center;justify-content:flex-end;gap:8px;color:var(--kt)}
.lb-led a:hover span.lb-lv{color:var(--kt);filter:brightness(1.15)}
.lb-tally{display:grid;grid-template-columns:repeat(${LEDGER.length},minmax(0,1fr));gap:4px;margin:12px 0 4px}
.lb-tally i{height:6px;border-radius:3px;background:var(--k);box-shadow:0 0 12px color-mix(in srgb,var(--k) 50%,transparent)}
.lb-tools>div{padding-top:16px;border-top:2px solid var(--k)}
.lb-tools>div .lb-tag{color:var(--kt)}
.lb-c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.lb-c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.lb-vb{display:grid;column-gap:12px;height:168px;padding-top:24px}
.lb-col{position:relative;height:100%}
.lb-bar{position:absolute;bottom:0;left:16%;right:16%;border-radius:3px}
.lb-n{position:absolute;left:0;right:0;text-align:center;font:400 13px/1 var(--c-fig);color:var(--c-ink)}
.lb-vb:not(.lb-zb){border-bottom:1px solid var(--c-rule-2)}
.lb-zb{position:relative;height:200px;padding:0}
.lb-pl{left:6%;right:52%}
.lb-pr{left:52%;right:6%}
.lb-nl{left:0;right:50%}
.lb-nr{left:50%;right:0}
.lb-one{position:absolute;left:0;right:0;height:0;border-top:1.5px dashed var(--c-ink);z-index:1;opacity:.85}
.lb-key{flex-wrap:wrap;row-gap:6px}
.lb-key span{white-space:nowrap}
.lb-nl,.lb-nr{z-index:2}
.lb-nb{font-weight:400;background:var(--c-raise);padding:0 2px}
.lb-key .lb-dsh{display:inline-block;width:16px;height:0;background:none;border-top:2px dashed var(--k,var(--c-ink));border-radius:0;vertical-align:3px}
.lb-zb::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--c-rule-2)}
.lb-cats{display:grid;column-gap:12px;margin-top:10px;font-size:13px;line-height:1.35;color:var(--c-sec);text-align:center}
.lb-key{display:flex;gap:20px;margin-bottom:12px;font-size:13px;color:var(--c-sec)}
.lb-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:-1px}
.lb-hb{display:grid;gap:16px}
.lb-hg p{margin:0 0 6px;font-size:13px;line-height:1.35;color:var(--c-sec)}
.lb-hr{display:flex;align-items:center;gap:8px;height:18px}
.lb-hbar{flex:none;height:12px;border-radius:2px}
.lb-hn{font:400 13px/1 var(--c-fig)}
.lb-fm{color:var(--c-sec)}
.lb-bench{display:grid;gap:32px}
.lb-bench h3,.lb-tools h3{margin:0 0 6px;font:500 18px/1.3 var(--c-ui);color:var(--c-ink)}
.lb-bench p,.lb-tools p{margin:0;font-size:16px;line-height:1.55;color:var(--c-sec);max-width:40rem}
.lb-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 40px}
.lb-tools .lb-tag{margin:0 0 8px;font-size:14px;color:var(--c-mut)}
.hm-micro{margin:12px 0 0;font-size:14px;line-height:1.5;color:var(--c-mut)}
.hm-final .hm-big{margin:0}
.lb-ledw.gl{padding:24px 24px 8px}
.lb-ledw.gl .lb-led li:last-child{border-bottom:0}
.lb-card{position:relative}
.lb-card::before{content:"";position:absolute;z-index:0;right:-140px;top:-60px;width:720px;height:720px;pointer-events:none;background:url(rosette.svg) center/contain no-repeat;opacity:.34;
  -webkit-mask-image:radial-gradient(closest-side,#000 40%,transparent);mask-image:radial-gradient(closest-side,#000 40%,transparent)}
.lb-card > *{position:relative;z-index:1}
.lb-fig.gl{border:0;border-radius:14px;background-color:var(--c-glass);background-image:var(--c-glass-sheen)}
@media (max-width:900px){
  .lb .hm-hero{padding:24px 0 32px}
  .lb-ledw.gl{padding:18px 18px 4px}
  .lb-card::before{right:-180px;top:auto;bottom:-120px;width:560px;height:560px}
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
.lb .hm-hero .hm-in.lb-trkw{display:block;margin-top:40px}
.lb-trk{padding:24px 28px 18px;border-radius:16px}
.lb-tr{display:grid;grid-template-columns:200px 1fr;align-items:center;gap:16px;padding:10px 0}
.lb-th{padding:0 0 6px}
.lb-th{grid-template-columns:200px repeat(8,minmax(0,1fr));gap:0 0}
.lb-th b{font:400 12px/1.3 var(--c-fig);color:var(--c-mut);text-align:center;text-transform:uppercase;letter-spacing:.03em}
.lb-th b i{display:block;font-style:normal;color:var(--c-gold)}
.lb-tr > span{font:500 16px/1.25 var(--c-ui);color:var(--c-ink)}
.lb-tr > span em{display:block;font:400 13px/1.35 var(--c-ui);font-style:normal;color:var(--c-mut);margin-top:2px}
.lb-lane{position:relative;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));height:24px;margin-left:-16px}
.lb-lane::before{content:"";position:absolute;left:0;right:0;top:11px;height:2px;background:var(--c-rule)}
.lb-lane u{position:relative;display:block;text-decoration:none}
.lb-lane u::after{content:"";position:absolute;left:50%;top:5px;width:2px;height:14px;margin-left:-1px;background:var(--c-rule-2)}
.lb-lane u.on::after{background:var(--c-gold);box-shadow:0 0 8px var(--c-gold)}
.lb-tk{position:absolute;left:0;top:9px;height:6px;border-radius:3px;background:#8DB0F5;box-shadow:0 0 14px color-mix(in srgb,#8DB0F5 60%,transparent)}
.lb-tk::after{content:"";position:absolute;right:-8px;top:-5px;width:16px;height:16px;border-radius:50%;background:inherit;box-shadow:inherit}
.lb-tk.lb-done{background:var(--c-gold);box-shadow:0 0 16px color-mix(in srgb,var(--c-gold) 65%,transparent)}
.lb-trbin{margin:14px 0 0;padding-top:14px;border-top:2px solid color-mix(in srgb,#F0604A 70%,transparent);font-size:15px;color:var(--c-sec)}
.lb-trbin b{margin-right:14px;font-weight:500;color:#EE7B70;text-transform:uppercase;letter-spacing:.04em;font-size:13px}
.lb-kill{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
.lb-kill > div{padding:20px 22px;border-radius:16px}
.lb-kt{margin:0;font:400 12px/1 var(--c-fig);text-transform:uppercase;letter-spacing:.06em;color:var(--c-mut)}
.lb-kn{margin:10px 0 6px;font:700 72px/1 "Barlow Condensed","Arial Narrow",sans-serif;color:var(--kt);text-shadow:0 0 22px color-mix(in srgb,var(--k) 45%,transparent)}
.lb-kn small{font-size:30px;color:var(--c-mut);text-shadow:none}
.lb-kp{margin:0;font-size:15px;line-height:1.5;color:var(--c-sec)}
@media (max-width:900px){
  .lb .hm-hero .hm-in.lb-trkw{margin-top:28px}
  .lb-trk{padding:18px 16px 14px}
  .lb-tr.lb-th{grid-template-columns:repeat(8,minmax(0,1fr));gap:0}
  .lb-th > span{display:none}
  .lb-th b{font-size:0}
  .lb-th b i{font-size:12px}
  .lb-th b:first-of-type,.lb-th b:last-of-type{font-size:0}
  .lb-tr{grid-template-columns:1fr;gap:6px}
  .lb-lane{margin-left:0}
  .lb-kill{grid-template-columns:1fr}
  .lb-kn{font-size:60px}
}
.lb-steps,.lb-checks,.lb-log,.lb-binl{margin:0;padding:0;list-style:none}
.lb-steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 40px;counter-reset:st}
.lb-steps li,.lb-checks li{counter-increment:st;position:relative;padding-top:16px;border-top:2px solid var(--c-rule-2)}
.lb-steps li::before,.lb-checks li::before{content:counter(st,decimal-leading-zero);display:block;margin-bottom:6px;font:400 13px/1 var(--c-fig);color:var(--c-gold)}
.lb-steps h3,.lb-checks h3,.lb-now h3{margin:0 0 6px;font:500 18px/1.3 var(--c-ui);color:var(--c-ink)}
.lb-steps p,.lb-checks p,.lb-now p,.lb-binl p,.lb-log p{margin:0;font-size:16px;line-height:1.55;color:var(--c-sec)}
.lb-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px 32px;counter-reset:st}
.lb-rules{grid-template-columns:repeat(2,minmax(0,1fr))}
.lb-now{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.lb-nw{padding:20px;border-radius:14px;background-color:var(--c-glass);background-image:var(--c-glass-sheen)}
.lb-nwh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.lb-st{font-size:14px!important;color:var(--c-mut)!important}
.lb-pips{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin:12px 0 14px}
.lb-pips span{display:block;text-align:center}
.lb-pips i{display:block;height:6px;border-radius:3px;background:var(--c-rule-2)}
.lb-pips b{display:block;margin-top:5px;font:400 12px/1 var(--c-fig);color:var(--c-mut)}
.lb-pips .on i{background:var(--c-gold);box-shadow:0 0 12px color-mix(in srgb,var(--c-gold) 55%,transparent)}
.lb-pips .on b{color:var(--c-gold)}
.lb-binn{display:flex;flex-wrap:wrap;gap:12px 32px;margin:0 0 20px;font-size:15px;color:var(--c-sec)}
.lb-binn b{display:block;font:700 44px/1 "Barlow Condensed","Arial Narrow",sans-serif;color:#EE7B70;text-shadow:0 0 18px color-mix(in srgb,#F0604A 40%,transparent)}
.lb-binl{border-top:1px solid var(--c-rule)}
.lb-binl li{padding:12px 0;border-bottom:1px solid var(--c-rule)}
.lb-bw{display:flex;justify-content:space-between;gap:16px;color:var(--c-ink)!important}
.lb-bw s{text-decoration:line-through;text-decoration-color:color-mix(in srgb,#F0604A 70%,transparent);text-decoration-thickness:1.5px}
.lb-bw span{flex:none;font:400 13px/1.6 var(--c-fig);color:var(--c-mut)}
.lb-log{border-left:1px solid var(--c-rule-2);padding-left:20px}
.lb-log li{position:relative;display:grid;grid-template-columns:64px 1fr;gap:12px;padding:8px 0}
.lb-log li::before{content:"";position:absolute;left:-24.5px;top:15px;width:8px;height:8px;border-radius:50%;background:var(--c-gold)}
.lb-log time{font:400 13px/1.9 var(--c-fig);color:var(--c-mut)}
@media (max-width:900px){
  .lb-steps,.lb-checks,.lb-rules,.lb-now{grid-template-columns:1fr;gap:24px}
  .lb-log li{grid-template-columns:56px 1fr}
}
`;

const MAIN = `<main id="main" class="hm lb" tabindex="-1">

<section class="hm-hero gl-stage" aria-labelledby="lb-h1">
  <div class="hm-in">
    <div class="hm-copy">
      <h1 class="hm-h1" id="lb-h1">The method to the madness.</h1>
      <p class="hm-say">Plenty of indicators get built in an afternoon and sold by evening. Mine go through a loop built to kill them. What survives goes on your chart. What dies stays on this page, with the reason it died.</p>
      <p class="hm-micro">From a trader who started on a London bank metals desk in 2003.</p>
    </div>
  </div>
  <div class="hm-in lb-trkw">
    <div class="lb-trk gl" data-plate data-seal="${SEAL}" role="img" aria-label="${esc(TRACK_ALT)}">
      <div class="lb-tr lb-th" aria-hidden="true"><span></span>${STOPS.map((t, i) => `<b><i>${i > 0 && i < 7 ? i : ""}</i>${esc(t)}</b>`).join("")}</div>
      ${DESKF.bench.map(t => { const k = reach(t); return `<div class="lb-tr" aria-hidden="true"><span>${esc(t.name)}<em>${esc(t.state)}</em></span><div class="lb-lane"><i class="lb-tk${k === 6 ? " lb-done" : ""}" style="width:calc(${((k + 0.5) / 8 * 100).toFixed(3)}% + 0px)"></i>${STOPS.map((_, i) => `<u class="${i >= 1 && i <= 6 && t.passed[i - 1] ? "on" : ""}"></u>`).join("")}</div></div>`; }).join("\n      ")}
      <p class="lb-trbin"><b>The bin</b>${BIN_C} concepts, ${BIN_D} tool drafts. Everything that falls off the track lands there, in plain view.</p>
    </div>
    <div class="lb-kill">
      <div class="gl"><p class="lb-kt">Concepts that held</p><p class="lb-kn lb-red">${SCORE[0]}<small> / ${CARDS.length}</small></p><p class="lb-kp">${SCORE[1]} dead, ${SCORE[2]} still a lead. Counted on gold and buried in plain view.</p></div>
      <div class="gl"><p class="lb-kt">Tool drafts binned</p><p class="lb-kn lb-red">${BIN_D}</p><p class="lb-kp">Built, tested, and thrown out. They stay in the bin, in plain view.</p></div>
      <div class="gl"><p class="lb-kt">Made it through</p><p class="lb-kn lb-gold">${DESKF.shipped.length}</p><p class="lb-kp">${DESKF.shipped.map(x => esc(x.name + ": " + x.state)).join(". ")}.</p></div>
    </div>
  </div>
</section>

<section class="hm-sec gl-stage" id="method" aria-labelledby="method-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="method-h">How a tool gets made</h2><p>One rule: nothing reaches my desk until it has earned it.</p></div>
    <div class="hm-main">
      <ol class="lb-steps">
        <li><h3>The idea</h3><p>It starts with what traders actually use and argue about. If it has been done well already, I am not making another copy. If it has been done badly, that is the opening.</p></li>
        <li><h3>The build</h3><p>Before a line of code, the idea gets written up properly, with its sources. No write-up, no code.</p></li>
        <li><h3>The beating</h3><p>Every build runs the six checks below. Fail one and it goes back. No exceptions for ideas I happen to like.</p></li>
        <li><h3>My desk</h3><p>If it survives all that, it goes on my own gold charts and I read the market with it the way I do every day. Plenty die here too.</p></li>
      </ol>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="checks" aria-labelledby="checks-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="checks-h">The six checks</h2><p>All six, every time. Fixes to a tool already on your chart run checks 2 to 4 again.</p></div>
    <div class="hm-main">
      <ol class="lb-checks">
        <li><h3>Sourced</h3><p>Every idea has to stand on something real.</p></li>
        <li><h3>Clean</h3><p>It loads fast and does not choke your chart.</p></li>
        <li><h3>No repaint</h3><p>If it rewrites history after the fact, it is lying to you, and it is out.</p></li>
        <li><h3>Chart-friendly</h3><p>Your candles stay the star. Nothing on it gets in the way of reading price.</p></li>
        <li><h3>Proven on gold</h3><p>It has to earn its place on my own gold charts.</p></li>
        <li><h3>The bar</h3><p>It has to stand next to the best of what I already have. Fine is not finished.</p></li>
      </ol>
    </div>
  </div></div>
</section>

<section class="hm-sec gl-stage" id="now" aria-labelledby="now-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="now-h">In the lab right now</h2><p>What is on the bench and how far each one has got. No dates promised. A lit mark is a check passed. As of ${esc(DESKF.as_of)}.</p></div>
    <div class="hm-main">
      <div class="lb-now">
        ${DESKF.bench.map(b => { const n = b.passed.filter(Boolean).length; return `<div class="lb-nw gl"><div class="lb-nwh"><h3>${esc(b.name)}</h3><p class="lb-st">${esc(b.state)}</p></div>
          <div class="lb-pips" role="img" aria-label="${esc(b.name)}: ${n} of ${DESKF.checks.length} checks passed">${b.passed.map((p, i) => `<span class="${p ? "on" : ""}" title="${esc(DESKF.checks[i])}"><i></i><b>${i + 1}</b></span>`).join("")}</div>
          <p>${esc(b.text)}</p></div>`; }).join("\n        ")}
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="bin" aria-labelledby="bin-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="bin-h">The bin</h2><p>Most labs hide this part. Nothing that fails here gets quietly deleted.</p></div>
    <div class="hm-main">
      <p class="lb-binn"><span><b>${DESKF.bin.filter(e => e.kind === "concept").length}</b> concepts that did not hold</span><span><b>${BIN_D}</b> tool drafts thrown out</span><span><b>${DESKF.bin.filter(e => e.kind === "call").length}</b> call of my own, wrong and corrected</span></p>
      <ul class="lb-binl">
        ${DESKF.bin.map(e => `<li><p class="lb-bw"><s>${esc(e.what)}</s><span>${esc(e.date)}</span></p><p>${esc(e.why)}</p></li>`).join("\n        ")}
      </ul>
      <p class="lb-s" style="margin-top:20px">Drafts are cheap, so I burn them. The Gate shipped on its 27th. The ones that never make it stay right here, in plain view.</p>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="log" aria-labelledby="log-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="log-h">The lab log</h2><p>What moved, and when. Newest first. Come back and it will be longer.</p></div>
    <div class="hm-main">
      <ol class="lb-log">
        ${DESKF.log.map(e => `<li><time>${esc(e.date)}</time><p>${esc(e.text)}</p></li>`).join("\n        ")}
      </ol>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="counted" aria-labelledby="counted-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="counted-h">How a concept gets counted</h2><p>The tools are half the lab. The other half is testing what the crowd swears by. Same discipline, written down before anyone looks at the data.</p></div>
    <div class="hm-main">
      <ol class="lb-checks lb-rules">
        <li><h3>The rules come first</h3><p>The test is written down before anyone looks at the data. One run, no second tries.</p></li>
        <li><h3>A fair fight</h3><p>Every concept goes up against something dumb. If it cannot beat that, it has nothing.</p></li>
        <li><h3>A bar to clear</h3><p>Close is not enough. The bar is set before the run, costs paid. Miss it and it does not hold.</p></li>
        <li><h3>Years it never saw</h3><p>Some of gold's history is locked away. Nothing becomes a tool until it holds there too.</p></li>
        <li><h3>Checked again every month</h3><p>Anything that held runs again on new data. If it flips, you see the flip.</p></li>
      </ol>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="bench" aria-labelledby="bench-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="bench-h">Counting next</h2><p>The next concepts going on trial.</p></div>
    <div class="hm-main">
      <div class="lb-bench">
        <div><h3>Does gold turn at round numbers?</h3><p>Every touch of a $20, $50 and $100 level against the same grids moved to prices nobody draws. One author has published a number for it, so the lab reproduces his first. My own tools take profit at $50 levels, so this one matters twice.</p></div>
        <div><h3>The squeeze most traders run</h3><p>My squeeze did not hold. John Carter's, Bollinger Bands inside Keltner Channels, gets its own count, direction and all.</p></div>
        <div><h3>Swear by a concept?</h3><p>Send it to the lab on <a href="${H.LESSONS}" rel="noopener" data-x="lab-bench">X</a>. If enough of you swear by it, it gets counted, and you see the verdict either way.</p></div>
      </div>
    </div>
  </div></div>
</section>

<section class="hm-sec" id="shipped" aria-labelledby="shipped-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="shipped-h">Shipped from the lab</h2><p>What made it through.</p></div>
    <div class="hm-main">
      <div class="lb-tools">
        <div class="lb-red"><h3>The Flow</h3><p class="lb-tag">${FLOW_TAG}</p><p>Which way gold has been running, and how hard, as a river on your chart. It describes; it does not predict.</p></div>
        <div class="lb-ivory"><h3>The Gate</h3><p class="lb-tag">Paid. Live on TradingView, and <a href="./#gate">joining the Desk Suite</a>.</p><p>Every bigger clock over your chart in one strip, and the line they agree on.</p></div>
      </div>
      <p class="hm-free" style="margin-top:28px">Not ready? Take the <a href="tools.html">free tools</a> and keep reading the <a href="${H.LESSONS}" rel="noopener" data-x="lab-free-lessons">lessons on X</a>.</p>
    </div>
  </div></div>
</section>

${H.signup("lab", { last: false })}

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
<script src="plate.js?v=${H.vOf("plate.js")}" defer></script>
</body>
</html>
`;

if (/—|<!--|!\s|–|#[A-Za-z]{2,}\b(?![^<]*>)/.test(html.replace(/<!DOCTYPE html>/, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/href="[^"]*"/g, ""))) {
  console.error("lab.html has an em dash, an en dash, an exclamation, a hashtag or an HTML comment"); process.exit(1);
}
fs.writeFileSync(path.join(HERE, "lab.html"), html);
console.log("lab.html written: " + CARDS.length + " cards checked and kept off the page, " + Object.values(DESK).filter(Boolean).length + " lines from the desk.");
