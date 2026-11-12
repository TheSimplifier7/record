#!/usr/bin/env node
/* make_daily_card.js · the card under a link to the front page, the record, the daily levels and the mentorship page
   12 November 2026, note 70. Drawn in ASSAY, as the week card is (assay.css, assay-core.js): the key light on the navy,
   the mark, the record's rosette behind the record's seal struck as a coin, the count as a hallmark, counsel's two lines.
   The seal and the count are worked out from record.json; nothing is typed. The card carries no price, no level and no
   date, so it does not go stale: it changes only if a row on the record changes.

     node make_daily_card.js          draws card_daily.png (1200 x 630) with Playwright; the page it is drawn from is removed after
     node make_daily_card.js --keep   keeps that page, card_daily.html, to look at

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
"use strict";
const fs = require("fs");
const path = require("path");
const A = require("./assay-core.js");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const rows = R.rows.map(r => Object.assign({}, r)).sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : 0) || (A.ORDER.indexOf(a.metal) - A.ORDER.indexOf(b.metal)));
rows.forEach((r, i) => { r.no = i + 1; });
const t = R.tally, W = 1200, Hh = 630;
const seal = A.seal(rows, { d: 300, legend: ["The Simplifier", "No. 1 to " + rows.length, "The record"], center: "Seal" });
const D = 760, cx = 930, cy = 330;
const CSS = fs.readFileSync(path.join(HERE, "assay.css"), "utf8");

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>The Simplifier · the card for the daily series</title>
<link rel="stylesheet" href="fonts.css">
<style>${CSS}
html,body{width:${W}px;height:${Hh}px;background:#0B1A2E}
.card{width:${W}px;height:${Hh}px;padding:48px 64px 44px;display:flex;flex-direction:column}
.card>*:not(.atmos){position:relative;z-index:1}
.mark img{width:56px;height:56px;box-shadow:0 0 0 1.5px var(--gold),0 0 0 5px var(--ground),0 0 0 6px var(--rule)}
.word{font-size:26px}
.url{font-size:30px;filter:none}
.url u{box-shadow:inset 0 -2px 0 var(--gold)}
.say{margin-top:52px;max-width:660px}
.h1{font-weight:700;font-size:86px;line-height:.94}
.dek{margin-top:20px;font-size:28px;font-weight:400;line-height:1.35}
.dek b{font-weight:500;color:var(--ink)}
.foot{margin-top:auto;display:flex;align-items:flex-end;gap:32px}
.hallmark{font-family:var(--f-text);font-size:19px;letter-spacing:0;text-transform:none;color:var(--ink-2)}
.hallmark span{padding:11px 18px}
.hallmark b{font:500 21px/1 var(--f-figure);color:var(--ink);margin-right:10px}
.counsel{font-size:15px;max-width:21em}
.coin{position:absolute!important;left:${cx - 150}px;top:${cy - 150}px;width:300px;height:300px}
.atmos .ros{opacity:.2}
</style></head>
<body><div class="card">
  <div class="atmos" style="-webkit-mask-image:linear-gradient(180deg,transparent 4%,#000 16%,#000 74%,transparent 90%);mask-image:linear-gradient(180deg,transparent 4%,#000 16%,#000 74%,transparent 90%)"><div class="ros" style="width:${D}px;height:${D}px;left:${cx - D / 2}px;top:${cy - D / 2}px">${A.rosette(rows, D)}</div></div>
  <div class="mast"><div class="mark"><img src="avatar_square.jpg" alt=""><span class="word">The Simplifier</span></div><div class="url"><u>thesimplifier7.com</u></div></div>
  <div class="say">
    <h1 class="h1">Gold, silver and platinum levels</h1>
    <p class="dek"><b>Every trading day at 08:00 CET.</b> Each one graded at the close. The wrong ones stay up.</p>
  </div>
  <div class="coin">${seal.svg}</div>
  <div class="foot">
    <div class="hallmark"><span><b>${t.held}</b>held</span><span><b>${t.wrong}</b>wrong</span><span><b>0</b>deleted</span></div>
    <div class="counsel">${A.COUNSEL.join("<br>")}</div>
  </div>
</div></body></html>
`;
if (/—|–|<!--/.test(html)) { console.error("the card has an em dash, an en dash or an HTML comment. Nothing written."); process.exit(1); }
fs.writeFileSync(path.join(HERE, "card_daily.html"), html);
console.log("card_daily.html written: the record's seal " + seal.hash.slice(0, 6).toUpperCase() + ", " + rows.length + " rows, " + t.held + " held, " + t.wrong + " wrong.");

(async () => {
  let chromium; try { ({ chromium } = require("playwright")); } catch (e) { console.log("Playwright is not installed here: open card_daily.html at 1200 by 630 and save it as card_daily.png."); return; }
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(HERE, "card_daily.html"), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(HERE, "card_daily.png"), clip: { x: 0, y: 0, width: W, height: Hh } });   /* a full-colour PNG, as the week cards are */
  await b.close();
  if (!process.argv.includes("--keep")) fs.unlinkSync(path.join(HERE, "card_daily.html"));
  console.log("card_daily.png drawn at " + W + " x " + Hh + ", " + Math.round(fs.statSync(path.join(HERE, "card_daily.png")).size / 1024) + " KB.");
})();
