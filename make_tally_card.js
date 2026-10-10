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
  /* 10 Oct 2026, note 48, the founder's ruling of 10 October: the dark card is drawn on the record's navy, in
     Barlow, held in gold and wrong in red as on the page, and its foot carries the address in place of the old
     sign-off. It read:
     dark:  { bg:"#141210", rule:"#4A4238", ink:"#EFE8DC", ink3:"#CFC6B8", ink5:"#B8AE9E", ink6:"#8E8474",
              gold:"#CBA43C", miss:"#D2764A", pass:"#5FA57A", open:"#6BA3C7", glow:"rgba(203,164,60,.10)" }, */
  dark:  { bg:"#0F1E3A", rule:"rgba(243,239,230,.16)", ink:"#F3EFE6", ink3:"rgba(243,239,230,.80)", ink5:"rgba(243,239,230,.60)", ink6:"#9AA4B5",
           gold:"#E0A93B", miss:"#E2574C", pass:"#E0A93B", open:"#8DB3EA", glow:"rgba(224,169,59,.0)",
           ground:"radial-gradient(120% 140% at 88% 8%,#1b3263 0%,#13264c 38%,#0f1e3a 70%,#0b1730 100%)", face:"'Barlow','Helvetica Neue',Arial,sans-serif", cond:"'Barlow Condensed','Arial Narrow',sans-serif" },
};

const css = (w, h, p) => `
  :root{
    --bg:${p.bg}; --rule:${p.rule}; --ink:${p.ink}; --ink-3:${p.ink3}; --ink-5:${p.ink5}; --ink-6:${p.ink6};
    --gold:${p.gold}; --miss:${p.miss}; --pass:${p.pass}; --open:${p.open};
    --serif:${p.face || "'Newsreader',Georgia,serif"}; --mono:${p.face || "'IBM Plex Mono',ui-monospace,monospace"}; --cond:${p.cond || "'IBM Plex Mono',ui-monospace,monospace"};
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{position:relative;background:var(--bg);color:var(--ink-3);font-family:var(--serif);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;
    background-image:${p.ground || `radial-gradient(${Math.round(w*.8)}px ${Math.round(h*.35)}px at 74% -10%,${p.glow},transparent 70%)`}}
  ${p.ground ? "body::before{content:\"\";position:absolute;inset:0;opacity:.06;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 1px,transparent 1px 3px)}" : ""}
  .card{position:relative}
  .card{width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:${Math.round(h*.045)}px ${Math.round(w*.07)}px}
  .mast{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:${Math.round(h*.012)}px;border-bottom:${p.ground ? "1px solid var(--rule)" : "2px solid var(--ink)"}}
  .mast .name{font-family:var(--mono);font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--ink)}
  .mast .desc{font-family:var(--mono);font-weight:500;letter-spacing:.17em;text-transform:uppercase;color:var(--ink-5)}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center}
  .grid{display:grid;gap:0}
  .stat{display:flex;align-items:baseline;gap:${Math.round(w*.03)}px;padding:${Math.round(h*.018)}px 0;border-bottom:1px solid var(--rule)}
  .stat:last-child{border-bottom:0}
  .num{font-family:${p.cond ? "var(--cond)" : "var(--mono)"};font-weight:${p.cond ? 800 : 600};line-height:.95;letter-spacing:${p.cond ? "0" : "-.03em"};min-width:${Math.round(w*.28)}px;text-align:right}
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
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600&family=Barlow+Condensed:wght@800&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css(w, h, p)}
  .mast .name{font-size:${sm}px} .mast .desc{font-size:${Math.round(sm*.85)}px}
  .num{font-size:${big}px} .lab{font-size:${lab}px} .kicker{font-size:${Math.round(sm*.95)}px}
  .law{font-size:${Math.round(sm*.95)}px} .handle{font-size:${Math.round(sm*.9)}px}
  ${v ? "" : ".grid{grid-template-columns:1fr 1fr;gap:0 " + Math.round(w*.06) + "px} .stat:nth-child(-n+2){border-bottom:1px solid var(--rule)} .stat:nth-last-child(-n+2){border-bottom:0}"}
</style></head><body>
<div class="card">
  <div class="mast"><span class="name">The Simplifier</span><span class="desc">Metals · The record</span></div>
  <div class="body">
    <!-- 2 Oct 2026: "decided" for "graded", the founder's ruling of 28 September (no house words on anything a stranger reads; this card is the media of the grade post).
         WAS: The record · graded on the ${fmt(gradedOn)} close -->
    <div class="kicker">The record · decided on the ${fmt(gradedOn)} close</div>
    <div class="grid">
      <div class="stat"><span class="num pass">${t.held}</span><span class="lab">held</span></div>
      <div class="stat"><span class="num miss">${t.wrong}</span><span class="lab">wrong, still on the page</span></div>
      <div class="stat"><span class="num nr">${t.never_reached}</span><span class="lab">never reached</span></div>
      ${t.open ? `<div class="stat"><span class="num open">${t.open}</span><span class="lab">open, clock running</span></div>` : ""}
    </div>
  </div>
  <!-- 10 Oct 2026, note 48: the address in the foot. It read: <span class="law">Named before · Graded after · Nothing deleted</span> -->
  <div class="foot${v ? " stack" : ""}"><span class="law" style="text-transform:none;letter-spacing:.04em">thesimplifier7.github.io/record</span><span class="handle">@TheSimplifier7</span></div>
</div>
</body></html>`;
};


/* 10 Oct 2026, note 48: the navy card, drawn as the account's X header of 10 October is drawn: the count on one
   line, held in gold and wrong in red, the line under it, and gold's Friday closes since 26 June as a line, read
   off the founder's chart and carried in record.json's closes. Every figure on it is record.json's. The paper
   pair keeps the card above, behind its flag. */
const LONGM = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dayMonth = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${LONGM[+m - 1]}`; };
const sparkSvg = (W, H, col) => {
  const G = (rec.closes || []).filter(c => c.Gold).map(c => ({ d: c.date, v: parseFloat(String(c.Gold).replace(/,/g, "")) }));
  if (G.length < 4) return { svg: "", first: "" };
  const lo = Math.min(...G.map(g => g.v)), hi = Math.max(...G.map(g => g.v));
  const X = i => 6 + (W - 12) * i / (G.length - 1), Y = v => 8 + (H - 16) * (1 - (v - lo) / ((hi - lo) || 1));
  const d = G.map((g, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(g.v).toFixed(1)).join(" ");
  const sw = Math.max(2.6, W / 200).toFixed(1), r = Math.max(3.2, W / 140).toFixed(1);
  return { first: G[0].d, svg: `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true"><path d="${d}" stroke="${col}" stroke-opacity=".8" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"></path>${G.map((g, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(g.v).toFixed(1)}" r="${r}" fill="${col}" fill-opacity=".65"></circle>`).join("")}</svg>` };
};
const MARKN = c => `<svg viewBox="0 0 40 30" fill="none" aria-hidden="true"><path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="${c}" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"></path><circle cx="33.5" cy="29" r="2.9" fill="${c}"></circle></svg>`;
const buildNavy = (w, h, v, p) => {
  const u = v ? w / 1080 : h / 1080;                       /* one unit: the short side over 1080 */
  const px = n => Math.round(n * u) + "px";
  const sp = v ? sparkSvg(Math.round(w - 2 * 76 * u), Math.round(230 * u), p.gold) : sparkSvg(Math.round(620 * u), Math.round(170 * u), p.gold);
  const big = v
    ? `<div class="big"><div class="h">${t.held} held</div><div class="w">${t.wrong} wrong</div>${t.open ? `<div class="o">${t.open} open</div>` : ""}</div>`
    : `<div class="big"><span class="h">${t.held} held</span><span class="dot">·</span><span class="w">${t.wrong} wrong</span>${t.open ? `<span class="dot">·</span><span class="o">${t.open} open</span>` : ""}</div>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>The Simplifier · the tally, first frame</title>
<!-- GENERATED by make_tally_card.js from record.json. Do not edit by hand; edit the ledger. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600&family=Barlow+Condensed:wght@800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{position:relative;background:${p.bg};background-image:${p.ground};color:${p.ink3};font-family:${p.face};font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
  body::before{content:"";position:absolute;inset:0;opacity:.06;pointer-events:none;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 1px,transparent 1px 3px)}
  .card{position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:${v ? px(86) + " " + px(76) : px(72) + " " + px(134)}}
  .mast{display:flex;justify-content:space-between;align-items:center;padding-bottom:${px(22)};border-bottom:1px solid ${p.rule}}
  .mast .name{display:flex;align-items:center;gap:${px(18)};font-size:${px(v ? 26 : 26)};font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:${p.ink}}
  .mast svg{width:${px(44)};height:${px(33)};display:block;overflow:visible}
  .mast .desc{font-size:${px(20)};font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${p.ink5}}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center}
  .kicker{font-size:${px(v ? 24 : 26)};font-weight:600;letter-spacing:${v ? ".22em" : ".3em"};text-transform:uppercase;color:${p.gold}}
  .big{font-family:${p.cond};font-weight:800;text-transform:uppercase;line-height:.9;margin-top:${px(v ? 40 : 34)};font-size:${px(v ? 228 : 236)};letter-spacing:.005em}
  .big .h{color:${p.pass}} .big .w{color:${p.miss}} .big .o{color:${p.open}}
  .big .dot{color:rgba(243,239,230,.3);font-size:.55em;vertical-align:.2em;padding:0 .2em}
  .say{font-size:${px(v ? 46 : 44)};font-weight:500;line-height:1.3;color:rgba(243,239,230,.92);margin-top:${px(v ? 48 : 40)};max-width:${v ? "none" : px(1500)}}
  .nr{font-size:${px(v ? 24 : 24)};font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${p.ink5};margin-top:${px(26)}}
  .nr b{color:${p.ink6};font-weight:600}
  .low{display:flex;${v ? "flex-direction:column;align-items:flex-start;gap:" + px(16) : "justify-content:flex-end;align-items:flex-end"};margin-top:${px(v ? 64 : 0)}}
  .spark .cap{font-size:${px(18)};font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:rgba(224,169,59,.72);margin-top:${px(12)};${v ? "" : "text-align:right"}}
  .foot{display:flex;justify-content:space-between;align-items:baseline;padding-top:${px(22)};border-top:1px solid ${p.rule}}
  .addr{font-size:${px(28)};font-weight:600;letter-spacing:.02em;color:${p.ink}}
  .handle{font-size:${px(22)};font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${p.ink5}}
</style></head><body>
<div class="card">
  <div class="mast"><span class="name">${MARKN(p.gold)}The Simplifier</span><span class="desc">Metals · The record</span></div>
  <div class="body">
    <div class="kicker">The record · decided on the ${fmt(gradedOn)} close</div>
    ${big}
    <div class="say">Every line named in advance, graded on Friday’s close. The wrong ones stay.</div>
    <div class="nr"><b>${t.never_reached}</b> never reached · counted for neither side</div>
    ${sp.svg ? `<div class="low"><div class="spark">${sp.svg}<div class="cap">Gold · Friday closes since ${dayMonth(sp.first)}</div></div></div>` : ""}
  </div>
  <div class="foot"><span class="addr">thesimplifier7.github.io/record</span><span class="handle">@TheSimplifier7</span></div>
</div>
</body></html>`;
};

/* DARK IS THE ONLY CARD SHIPPED since 6 September 2026 (note 20: dark is the
   ground for everyone). Paper is kept behind a flag for the one day it is
   asked for, and its files are never in the upload:
     node make_tally_card.js          dark only
     node make_tally_card.js --paper  dark, and the paper pair beside it */
/* 10 Oct 2026, note 48: the dark pair is drawn by buildNavy. It read:
   fs.writeFileSync("tally_card_vertical_dark.html", build(1080, 1920, true, PALETTE.dark));
   fs.writeFileSync("tally_card_landscape_dark.html", build(1920, 1080, false, PALETTE.dark)); */
fs.writeFileSync("tally_card_vertical_dark.html", buildNavy(1080, 1920, true, PALETTE.dark));
fs.writeFileSync("tally_card_landscape_dark.html", buildNavy(1920, 1080, false, PALETTE.dark));
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
  /* 24 Sep 2026, note 37: the faces, injected from CARD_FONTS or BANK_FONTS (a folder of the
     @fontsource woff2 files) on a machine that cannot reach Google Fonts. The cards of 6, 12 and
     21 September were drawn in a stand-in face for want of it. */
  const FD = process.env.CARD_FONTS || process.env.BANK_FONTS || "";
  const face = (fam, file, w) => { const f = path.join(FD, file); return FD && fs.existsSync(f) ? `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format('woff2')}` : ""; };
  const faces = [face("IBM Plex Mono", "ibm-plex-mono-latin-400-normal.woff2", 400), face("IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", 500),
    face("IBM Plex Mono", "ibm-plex-mono-latin-600-normal.woff2", 600), face("Newsreader", "newsreader-latin-400-normal.woff2", 400),
    face("Newsreader", "newsreader-latin-500-normal.woff2", 500),
    /* 10 Oct 2026, note 48: the navy card's faces. */
    face("Barlow", "barlow-latin-500-normal.woff2", 500), face("Barlow", "barlow-latin-600-normal.woff2", 600),
    face("Barlow Condensed", "barlow-condensed-latin-800-normal.woff2", 800)].join("");
  const b = await chromium.launch();
  const jobs = [["tally_card_vertical_dark", 1080, 1920], ["tally_card_landscape_dark", 1920, 1080]];
  if (paper) jobs.push(["tally_card_vertical", 1080, 1920], ["tally_card_landscape", 1920, 1080]);
  for (const [name, w, h] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto("file://" + path.resolve(name + ".html"), { waitUntil: "networkidle" });
    if (faces) await p.addStyleTag({ content: faces });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: name + ".png" }); await p.close();
  }
  await b.close();
  console.log(`rendered: ${jobs.map(j => j[0] + ".png").join(", ")}`);
})();
