#!/usr/bin/env node
/* make_tally_card.js · the four numbers, as the first frame of every video
   Added 5 September 2026.

   Reads record.json (never index.html directly, never a typed number) and
   writes two HTML files beside it, dark ground, the record's own palette:
     tally_card_vertical_dark.html    1080 x 1920, the first frame of a phone video
     tally_card_landscape_dark.html   1920 x 1080, the first frame of a desktop cut
   Every figure on the card comes from record.json, so a card can never claim
   a count the ledger does not hold. Run it after make_record_json.js, every
   Friday, before the video is cut.

   Render to PNG on the Mac exactly as card.html documents:
     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
       --headless --disable-gpu --hide-scrollbars \
       --window-size=1080,1920 \
       --screenshot="tally_card_vertical_dark.png" "tally_card_vertical_dark.html"
   and the same with 1920,1080 for the landscape file.

   BRAND LAW APPLIES. No em dashes, no hashtags, no exclamation marks, no
   emoji, no forecasting, no fabricated data. The card says what the ledger
   says and nothing else. */
const fs = require("fs");
const rec = JSON.parse(fs.readFileSync("record.json", "utf8"));
const t = rec.tally;
const stamp = rec.last_updated;
const fmt = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${y}`; };

/* The graded-on date is the latest graded_on_close in the rows, not the stamp,
   because the stamp is when the file changed and the card is about the close. */
const gradedOn = rec.rows.map(r => r.graded_on_close).filter(Boolean).sort().pop();

/* Two palettes. PAPER is the record page's own. DARK was added 6 September for
   the video: the founder's chart went to a dark background for contrast, and
   frame one must not flash from paper to black. Same hues as record-embed.js
   dark theme, so card, embed and chart agree. */
const PALETTE = {
  paper: { bg:"#C2BAAE", rule:"#7D7263", ink:"#14110C", ink3:"#332F26", ink5:"#403A2C", ink6:"#6B6155",
           gold:"#4A360C", miss:"#63220E", pass:"#163821", open:"#1B3646", glow:"rgba(255,251,242,.42)" },
  dark:  { bg:"#141210", rule:"#4A4238", ink:"#EFE8DC", ink3:"#CFC6B8", ink5:"#B8AE9E", ink6:"#8E8474",
           gold:"#CBA43C", miss:"#D2764A", pass:"#5FA57A", open:"#6BA3C7", glow:"rgba(203,164,60,.10)" },
};

const css = (w, h, p) => `
  :root{
    --bg:${p.bg}; --rule:${p.rule}; --ink:${p.ink}; --ink-3:${p.ink3}; --ink-5:${p.ink5}; --ink-6:${p.ink6};
    --gold:${p.gold}; --miss:${p.miss}; --pass:${p.pass}; --open:${p.open};
    --serif:'Newsreader',Georgia,serif; --mono:'IBM Plex Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{background:var(--bg);color:var(--ink-3);font-family:var(--serif);font-variant-numeric:tabular-nums;
    background-image:radial-gradient(${Math.round(w*.8)}px ${Math.round(h*.35)}px at 74% -10%,${p.glow},transparent 70%)}
  .card{width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:${Math.round(h*.045)}px ${Math.round(w*.07)}px}
  .mast{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:${Math.round(h*.012)}px;border-bottom:2px solid var(--ink)}
  .mast .name{font-family:var(--mono);font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--ink)}
  .mast .desc{font-family:var(--mono);font-weight:500;letter-spacing:.17em;text-transform:uppercase;color:var(--ink-5)}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center}
  .grid{display:grid;gap:0}
  .stat{display:flex;align-items:baseline;gap:${Math.round(w*.03)}px;padding:${Math.round(h*.018)}px 0;border-bottom:1px solid var(--rule)}
  .stat:last-child{border-bottom:0}
  .num{font-family:var(--mono);font-weight:600;line-height:.95;letter-spacing:-.03em;min-width:${Math.round(w*.28)}px;text-align:right}
  .lab{font-family:var(--mono);font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-5)}
  .pass{color:var(--pass)} .miss{color:var(--miss)} .nr{color:var(--ink-6)} .open{color:var(--open)}
  .foot.stack{flex-direction:column;align-items:flex-start;gap:${Math.round(h*.008)}px}
  .kicker{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .kicker{font-family:var(--mono);font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:${Math.round(h*.02)}px}
  .foot{display:flex;justify-content:space-between;align-items:baseline;padding-top:${Math.round(h*.014)}px;border-top:1px solid var(--rule)}
  .law{font-family:var(--mono);font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
  .handle{font-family:var(--mono);font-weight:500;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-6)}
`;

const build = (w, h, v, p) => {
  const big = v ? Math.round(w * 0.30) : Math.round(h * 0.30);
  const lab = v ? Math.round(w * 0.028) : Math.round(h * 0.03);
  const sm  = v ? Math.round(w * 0.022) : Math.round(h * 0.024);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>The Simplifier · the tally, first frame</title>
<!-- GENERATED by make_tally_card.js from record.json. Do not edit by hand; edit the ledger. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css(w, h, p)}
  .mast .name{font-size:${sm}px} .mast .desc{font-size:${Math.round(sm*.85)}px}
  .num{font-size:${big}px} .lab{font-size:${lab}px} .kicker{font-size:${Math.round(sm*.95)}px}
  .law{font-size:${Math.round(sm*.95)}px} .handle{font-size:${Math.round(sm*.9)}px}
  ${v ? "" : ".grid{grid-template-columns:1fr 1fr;gap:0 " + Math.round(w*.06) + "px} .stat:nth-child(-n+2){border-bottom:1px solid var(--rule)} .stat:nth-last-child(-n+2){border-bottom:0}"}
</style></head><body>
<div class="card">
  <div class="mast"><span class="name">The Simplifier</span><span class="desc">Metals · The record</span></div>
  <div class="body">
    <div class="kicker">The record · graded on the ${fmt(gradedOn)} close</div>
    <div class="grid">
      <div class="stat"><span class="num pass">${t.held}</span><span class="lab">held</span></div>
      <div class="stat"><span class="num miss">${t.wrong}</span><span class="lab">wrong, still on the page</span></div>
      <div class="stat"><span class="num nr">${t.never_reached}</span><span class="lab">never reached</span></div>
      ${t.open ? `<div class="stat"><span class="num open">${t.open}</span><span class="lab">open, clock running</span></div>` : ""}
    </div>
  </div>
  <div class="foot${v ? " stack" : ""}"><span class="law">Named before · Graded after · Nothing deleted</span><span class="handle">@TheSimplifier7</span></div>
</div>
</body></html>`;
};

/* DARK IS THE ONLY CARD SHIPPED since 6 September 2026 (note 20: dark is the
   ground for everyone). Paper is kept behind a flag for the one day it is
   asked for, and its files are never in the upload:
     node make_tally_card.js          dark only
     node make_tally_card.js --paper  dark, and the paper pair beside it */
fs.writeFileSync("tally_card_vertical_dark.html", build(1080, 1920, true, PALETTE.dark));
fs.writeFileSync("tally_card_landscape_dark.html", build(1920, 1080, false, PALETTE.dark));
const paper = process.argv.includes("--paper");
if (paper) {
  fs.writeFileSync("tally_card_vertical.html", build(1080, 1920, true, PALETTE.paper));
  fs.writeFileSync("tally_card_landscape.html", build(1920, 1080, false, PALETTE.paper));
}
console.log(`tally cards written from record.json (dark${paper ? " and paper" : ""}): ${t.held} held, ${t.wrong} wrong, ${t.never_reached} never reached, ${t.open} open, graded on ${gradedOn}`);

/* Render the PNGs here when playwright is present; otherwise render by hand
   as the header documents. */
(async () => {
  let chromium; try { ({ chromium } = require("playwright")); } catch (e) { return; }
  const path = require("path");
  const b = await chromium.launch();
  const jobs = [["tally_card_vertical_dark", 1080, 1920], ["tally_card_landscape_dark", 1920, 1080]];
  if (paper) jobs.push(["tally_card_vertical", 1080, 1920], ["tally_card_landscape", 1920, 1080]);
  for (const [name, w, h] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto("file://" + path.resolve(name + ".html"), { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: name + ".png" }); await p.close();
  }
  await b.close();
  console.log(`rendered: ${jobs.map(j => j[0] + ".png").join(", ")}`);
})();
