#!/usr/bin/env node
/* Writes index.html from record.json. The numbers are not typed by hand.
   Run after the record changes: node make_home.js
   It does not edit record.json or any historical row. */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const vOf = f => crypto.createHash("sha256").update(fs.readFileSync(path.join(HERE, f))).digest("hex").slice(0, 10);
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const d0 = iso => new Date(iso + "T12:00:00Z");
const addDays = (iso, n) => { const d = d0(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const long = iso => { const d = d0(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const fridayOf = iso => { const d = d0(iso); const add = (5 - d.getUTCDay() + 7) % 7; return addDays(iso, add); };

const dates = [...new Set(R.rows.map(r => r.named))].sort();
const week = dates[dates.length - 1];
const rows = R.rows.filter(r => r.named === week);
const order = { Gold: 0, Silver: 1, Platinum: 2 };
rows.sort((a, b) => (order[a.metal] ?? 9) - (order[b.metal] ?? 9));
const t = R.tally;
const open = rows.some(r => r.grade === "pending");
const friday = fridayOf(week);
const gradeLine = open
  ? `Friday ${long(friday)}'s close at 23:00 Europe/Madrid will grade them.`
  : `Friday ${long(friday)}'s close graded them.`;

function need(r) {
  if (r.grade === "pending") return r.side === "slate"
    ? "The weekly call needs Friday to close above this level."
    : "The weekly call needs Friday to close below this level.";
  if (r.grade === "pass") return "Held. Friday closed on the side named in the call.";
  if (r.grade === "miss" || r.grade === "partial") return "Wrong. Friday did not close on the side named in the call.";
  if (r.grade === "notest") return "Never reached. It is not counted as right or wrong.";
  return esc(r.grade_word || "");
}

const weekRows = rows.map(r => `<tr><th scope="row">${esc(r.metal)}</th><td class="num">${esc(r.level)}</td><td>${need(r)}</td></tr>`).join("\n          ");
const weekFile = `week-${week}.html`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Simplifier: Monday levels for gold, silver and platinum</title>
<meta name="description" content="One price level for gold, silver and platinum each Monday. Friday's close grades them, and the wrong calls stay on the record. Free Monday email, or The Fan and The Method on TradingView.">
<link rel="canonical" href="https://thesimplifier7.com/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://thesimplifier7.com/">
<meta property="og:title" content="The Simplifier: Monday levels for gold, silver and platinum">
<meta property="og:description" content="One price level for gold, silver and platinum each Monday. Friday's close grades them, and the wrong calls stay on the record.">
<meta property="og:image" content="https://thesimplifier7.com/link_method.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f1e3a">
<script>(function(){var t=null;try{t=localStorage.getItem("theme")}catch(e){}document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");var h=location.hash;var keep={"#week":1,"#join":1,"#member":1,"#main":1,"#choose":1};if(h&&!keep[h])location.replace("record.html"+location.search+h);})();</script>
<link rel="icon" href="/favicon.ico?v=2" sizes="16x16 32x32 48x48">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">
<style>
:root{color-scheme:light}
body{margin:0;background:var(--hs-bg,#0b111d);color:var(--hs-ink,#eef2f8);font:400 1.05rem/1.6 "Barlow",sans-serif}
a{color:inherit}
.skip{position:absolute;left:-999px;top:0;background:#e0a93b;color:#0f1e3a;padding:8px 12px}
.skip:focus{left:8px;top:8px}
.wrap{max-width:46rem;margin:0 auto;padding:0 clamp(16px,4vw,28px)}
.home-nav{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.home-nav a{min-height:44px;display:inline-flex;align-items:center;text-decoration:none;font-weight:600}
.menu{display:none}
h1{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:clamp(2.4rem,7vw,3.6rem);line-height:.95;margin:.2rem 0 .6rem}
h2{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:clamp(1.6rem,4vw,2rem);line-height:1.1;margin:1.6rem 0 .4rem}
p{margin:.5rem 0}
.acts{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;margin:.8rem 0}
.quiet{font-weight:600}
table{width:100%;border-collapse:collapse;margin:.6rem 0 1rem}
th,td{text-align:left;vertical-align:top;padding:10px 8px;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent)}
.num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
figure{margin:1rem 0}
img{max-width:100%;height:auto;border-radius:8px}
figcaption,.note{font-size:.95rem;line-height:1.5}
blockquote{margin:.4rem 0;font-family:"Newsreader",Georgia,serif;font-size:1.35rem;line-height:1.35}
.ba{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ba p{margin:0}
footer{margin-top:2rem;padding:1.2rem 0 2.5rem;border-top:1px solid color-mix(in srgb,currentColor 18%,transparent);font-size:.95rem}
footer a{display:inline-flex;min-height:44px;align-items:center;margin-right:10px}
@media (max-width:760px){
  .home-nav{display:none}
  .hs-tools .hs-gold{display:none}
  .menu{display:block;margin:8px 0}
  .menu summary{min-height:44px;display:flex;align-items:center;font-weight:700;cursor:pointer}
  .menu a{display:flex;min-height:44px;align-items:center}
  .ba{grid-template-columns:1fr}
}
</style>
<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
<header class="hs-band">
  <div class="hs-wrap hs-band-in">
    <a class="hs-brand" href="./" aria-label="The Simplifier">THE SIMPLIFIER</a>
    <nav class="home-nav" aria-label="The site">
      <a href="#week" aria-current="page">This week's levels</a>
      <a href="record.html">Full record</a>
      <a href="method.html">The Fan</a>
      <a href="levels.html">Free weekly email</a>
    </nav>
    <div class="hs-tools">
      <button class="hs-theme" id="hs-theme" type="button" aria-label="Switch between the light and the dark ground"><span id="hs-theme-word">Dark</span></button>
      <a class="hs-btn hs-ghost" href="levels.html">Monday email</a>
      <a class="hs-btn hs-gold" href="method.html">See The Fan</a>
    </div>
  </div>
</header>
<details class="menu wrap"><summary>Menu</summary>
  <a href="#week">This week's levels</a>
  <a href="record.html">Full record</a>
  <a href="method.html">The Fan</a>
  <a href="levels.html">Free weekly email</a>
</details>
<main id="main" tabindex="-1">
<div class="wrap">
  <h1>Gold, silver and platinum levels you can check for yourself.</h1>
  <p>I publish one price level for each metal on Monday. Friday's closing price decides whether it held or was wrong. The wrong calls stay on the record.</p>
  <p class="note">I read these levels from The Fan, the indicator I built and sell on TradingView.</p>
  <p class="acts"><a class="hs-btn hs-gold" href="levels.html">Get Monday's levels free</a> <a class="quiet" href="method.html">See The Fan</a></p>

  <section id="week" aria-labelledby="week-h">
    <h2 id="week-h">This week's levels.</h2>
    <p>Week of ${esc(long(week))}. These are the levels published for this week, not live prices. <span id="grade-line">${esc(gradeLine)}</span></p>
    <table>
      <caption>Levels published for the week of ${esc(long(week))}</caption>
      <thead><tr><th scope="col">Metal</th><th scope="col">Level</th><th scope="col">What Friday has to do</th></tr></thead>
      <tbody id="week-body">
          ${weekRows}
      </tbody>
    </table>
    <p class="note">A move through a level during the week does not settle the result. Only Friday's close does.</p>
    <p><a href="${esc(weekFile)}">Read this week's full explanation</a></p>
  </section>

  <section id="proof" aria-labelledby="proof-h">
    <h2 id="proof-h">You can read the wrong calls too.</h2>
    <p>The record currently has <b id="n-graded">${t.resolved}</b> graded weekly levels: <b id="n-held">${t.held}</b> held and <b id="n-wrong">${t.wrong}</b> wrong. Another <b id="n-nr">${t.never_reached}</b> were never reached and <b id="n-open">${t.open}</b> are still open. Those <b id="n-aside">${t.never_reached + t.open}</b> are not counted as right or wrong.</p>
    <p>Held means Friday closed on the side named in the call. It does not mean a trade made money. A level repeated in several weeks can count several times. The full record explains both the weekly count and the separate count by level.</p>
    <p>These are published price calls, not customer returns or a promise of what happens next.</p>
    <p><a href="record.html">Read the full record</a></p>
    <p><a href="misses.html">Read every wrong call</a></p>
  </section>

  <section id="join" aria-labelledby="join-h">
    <h2 id="join-h">Get The Monday Level by email.</h2>
    <p>One email each Monday evening with that week's levels for gold, silver and platinum, plus last week's Friday grades. The wrong ones are included. It is free, and you can unsubscribe from any email.</p>
    <p>I send a confirmation email first. You will not receive the weekly email until you confirm.</p>
    <p><a class="hs-btn hs-gold" href="levels.html">Get Monday's levels free</a></p>
  </section>

  <section id="tool" aria-labelledby="tool-h">
    <h2 id="tool-h">See the same tools on your own chart.</h2>
    <p>The weekly email gives you my three published levels. The Fan puts the wider price picture on your own TradingView chart while you look at shorter moves.</p>
    <p>It includes everything in The Method, plus the wider view. You still decide whether to trade. It is not a service that tells you what to buy or sell.</p>
    <figure>
      <img src="fan_gold_30m_2026-11-01-blurred-1200.webp" width="1200" height="713" alt="Gold on a TradingView chart dated 1 November 2026, with labels blurred. A historical example, not a live trade.">
      <figcaption>A dated chart example, including the unclear part. Gold, 30 minute, 1 November 2026. Chart by TradingView. Labels blurred. Not a live trade or a promise of a result.</figcaption>
    </figure>
    <p id="home-video" class="note">A 60 to 90 second demonstration of this chart will be added here once it is recorded.</p>
    <p><a href="method.html">See The Fan and compare the plans</a></p>
  </section>

  <section id="member" aria-labelledby="member-h">
    <h2 id="member-h">From a member.</h2>
    <blockquote>
      <p>Remoras follow sharks. Knowing what to look for relative to structure and trend, and waiting for the right combination to present itself, makes all the difference in the world.</p>
    </blockquote>
    <p>Jim, US.</p>
    <div class="ba">
      <p><b>Before:</b> Very inconsistent for lack of trading protocol and discipline.</p>
      <p><b>Now:</b> Still a bit gun-shy, but gaining confidence and comfort.</p>
    </div>
    <p class="note">One person's experience, not a promise of your result.</p>
  </section>

  <section id="who" aria-labelledby="who-h">
    <h2 id="who-h">I am Bradley, the person behind The Simplifier.</h2>
    <p>I build and sell The Method and The Fan. I publish my weekly levels so you can check what I said against what happened.</p>
    <p>The full record keeps the calls, the grades and the correction notes. There is also a standing $1,000 offer for a qualifying change to a published call or grade. Read the exact conditions before making a claim.</p>
    <p><a href="record.html#rules">How the record is kept</a></p>
    <p><a href="record.html#bounty">The $1,000 offer and its terms</a></p>
    <p><a href="record.html#doors">1-to-1 mentorship</a></p>
  </section>

  <section id="choose" aria-labelledby="choose-h">
    <h2 id="choose-h">Choose the next step that suits you.</h2>
    <p>If you want to follow the weekly levels first, take the free email. If you already use TradingView and want the wider view on your own chart, look at The Fan.</p>
    <p>Education and training. Not investment advice. Trading involves risk, and you can lose money. No result is promised.</p>
    <p class="acts"><a class="hs-btn hs-gold" href="method.html">See The Fan</a> <a class="hs-btn hs-ghost" href="levels.html">Get Monday's levels free</a></p>
  </section>
</div>
</main>
<footer>
  <div class="wrap">
    <p><a href="record.html">Full record</a> <a href="misses.html">Every wrong call</a> <a href="tools.html">Free tools</a> <a href="record.html#doors">1-to-1 mentorship</a> <a href="terms.html">Terms</a> <a href="privacy.html">Privacy</a> <a href="mailto:hello@thesimplifier7.com">Contact</a> <a href="https://billing.stripe.com/p/login/4gMbJ3gw91552dx4cm5kk00">Manage or cancel your subscription</a></p>
    <p class="note">Education and training. Not investment advice. No funds are handled. No result is promised.</p>
    <noscript><p><a href="record.html">Full record</a></p></noscript>
  </div>
</footer>
<script src="house.js?v=${vOf("house.js")}" defer></script>
<script src="refcarry.js?v=${vOf("refcarry.js")}" defer></script>
<script>
(function(){
  function paint(j){
    var t=j.tally||{};
    var set=function(id,v){var n=document.getElementById(id);if(n&&v!=null)n.textContent=v;};
    set("n-graded", t.resolved); set("n-held", t.held); set("n-wrong", t.wrong); set("n-nr", t.never_reached); set("n-open", t.open);
    if (t.never_reached != null && t.open != null) set("n-aside", Number(t.never_reached) + Number(t.open));
  }
  fetch("record.json",{cache:"no-store"}).then(function(r){return r.json()}).then(paint).catch(function(){});
})();
</script>
</body>
</html>
`;

if (/\u2014|<!--/.test(html)) { console.error("homepage has an em dash or an HTML comment"); process.exit(1); }
fs.writeFileSync(path.join(HERE, "index.html"), html);
console.log("index.html written for the week of " + week + ", " + t.resolved + " graded.");
