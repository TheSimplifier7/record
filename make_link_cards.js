#!/usr/bin/env node
/* =========================================================================
   make_link_cards.js  ·  24 September 2026  ·  record note 37

   The card X, WhatsApp and every messenger draw under a link, for each page
   of the site that had none of its own or borrowed another page's:
     misses.html     had no card, so a link to it showed bare text
     targets.html    borrowed the record's week card
     method.html     showed the 9 September chart
     tick.html       showed a held row from 30 August
     year.html, guest.html, advisers.html, embed.html   had none
   The record keeps its week card (make_week_card.js) and every bank row
   keeps its own (make_bank_pages.js).

   Reads record.json, and each page's own words, copied below as they stand
   on the page. A card never carries a figure that is not in record.json.
   Writes, beside the record and in no folder (a plain upload flattens one):
     link_<name>.png   1200 x 630
     link_cards.json   what each card was drawn from, read by verify_record.js
   and points each page's og:image line at its card with ?v= and the first
   ten characters of the card's SHA-256, so a changed card is a new address
   and a messenger fetches it again instead of showing the old one.

   verify_record.js, check 16, fails when a card was drawn from figures
   record.json no longer holds, so a grade that moves a count cannot ship
   beside a stale card.

   In the routine, after make_misses.js:
     node make_record_json.js && node make_bank_pages.js && node make_tally_card.js
       && node make_misses.js && node make_link_cards.js && node verify_record.js
   Renders with playwright. The faces come from Google Fonts; in a sandbox
   that cannot reach them, set CARD_FONTS (or BANK_FONTS) to a folder of the
   @fontsource woff2 files and they are injected. Without playwright the
   card sources go to the system's temporary folder and no page is changed.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const HERE = __dirname;
const SITE = "https://thesimplifier7.github.io/record/";
const METHOD_CHART = "method_gold_8h_2026-09-24.jpg";

/* ---------------------------------------------------------------- helpers */
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const short = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${MON[+m - 1]}`; };
const long = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
const num = s => Number(String(s).replace(/,/g, ""));
const fmt = (v, dec) => Number(v).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const decOf = metal => metal === "Silver" ? 3 : 2;
/* The house, not the channel it was reported through: make_bank_pages.js's rule. */
const house = src => { const b = String(src).split(/,\s*(as reported|via)\b/i)[0].trim();
  return ({ "Citi Research": "Citi", "Goldman Sachs Research": "Goldman Sachs", "J.P. Morgan Global Research": "J.P. Morgan" })[b] || b; };
/* The last Friday on or before a window's last day; Christmas Day 2026 is a Friday with the market shut. */
const gradingFriday = iso => { const d = new Date(iso + "T00:00:00Z"); while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1);
  const f = d.toISOString().slice(0, 10); return f === "2026-12-25" ? null : f; };
const ORDER = { Gold: 0, Silver: 1, Platinum: 2 };

/* ---------------------------------------------------------------- the figures
   Everything a card prints that can move is computed here, from record.json
   only. verify_record.js calls this same function and compares. */
function figuresFor(R) {
  const t = R.tally || {};
  const tally = { resolved: t.resolved, held: t.held, wrong: t.wrong, never_reached: t.never_reached, open: t.open };
  const miss = (R.rows || []).filter(r => r.grade === "miss");
  const lastOn = miss.map(r => r.graded_on_close).filter(Boolean).sort().pop() || null;
  const closeOn = (R.closes || []).find(c => c.date === lastOn) || {};
  const latest = miss.filter(r => r.graded_on_close === lastOn).sort((a, b) => (ORDER[a.metal] ?? 9) - (ORDER[b.metal] ?? 9))
    .map(r => ({ metal: r.metal, level: r.level, close: closeOn[r.metal] || null, anchor: r.anchor }));
  const T = R.targets || [];
  const next = T.filter(x => x.grade === "pending").sort((a, b) => a.window.localeCompare(b.window) || a.published.localeCompare(b.published))[0];
  const targets = {
    open: T.filter(x => x.grade === "pending").length, held: T.filter(x => x.grade === "pass").length,
    wrong: T.filter(x => x.grade === "miss").length, left_off: (R.targets_left_off || []).length,
    next: next ? { house: house(next.source), level: next.level, metal: next.metal || "Gold", window_text: next.windowText, grades_on: gradingFriday(next.window), page: next.page } : null
  };
  const tb = R.tick_book || {}, tt = tb.tally || {};
  const tick = { rows: (tb.rows || []).length, held: tt.held || 0, wrong: tt.wrong || 0, never_reached: tt.never_reached || 0, open: tt.open || 0 };
  return {
    misses: { tally, latest_close: lastOn, latest },
    targets,
    method: { chart: METHOD_CHART },
    year: { tally }, guest: { tally }, advisers: { tally }, embed: { tally },
    tick
  };
}

/* ---------------------------------------------------------------- the frame */
const MARK = `<svg viewBox="0 0 40 30" fill="none" aria-hidden="true"><path d="M2 3V9.5H11V16H20V22.5H29V29H38" stroke="#CBA43C" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square"></path><circle cx="33.5" cy="29" r="2.9" fill="#CBA43C"></circle></svg>`;
const C = { bg: "#141210", panel: "#1D1A16", rule: "#4A4238", soft: "#3A342C", ink: "#EFE8DC", ink3: "#CFC6B8", ink5: "#B8AE9E", ink6: "#A69C8C",
  gold: "#CBA43C", pass: "#5FA57A", miss: "#D2764A", open: "#6BA3C7", notest: "#9C9282" };
function frame(label, inner, url, extraCss) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:${C.bg};background-image:radial-gradient(900px 380px at 84% -16%,rgba(203,164,60,.11),transparent 70%);color:${C.ink3};
  font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;padding:44px 60px 38px;display:flex;flex-direction:column}
.mast{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1.5px solid ${C.ink};flex:none}
.mast .b{display:flex;align-items:center;gap:15px;font-size:15px;font-weight:600;letter-spacing:.3em;color:${C.ink};text-transform:uppercase}
.mast svg{width:36px;height:27px;display:block;overflow:visible}
.mast .l{font-size:13px;font-weight:500;letter-spacing:.18em;color:${C.ink5};text-transform:uppercase}
.k{font-size:15px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${C.gold};margin-top:34px}
h1{font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:62px;line-height:1.05;letter-spacing:-.015em;color:${C.ink};margin-top:12px}
.sub{font-family:'Newsreader',Georgia,serif;font-size:27px;line-height:1.38;color:${C.ink3};margin-top:14px;max-width:46ch}
.sub em{font-style:italic;color:${C.ink}}
.body{margin-top:auto}
.figs{display:flex;gap:46px;align-items:flex-end}
.fig b{display:block;font-size:60px;font-weight:600;letter-spacing:-.03em;line-height:1}
.fig span{display:block;font-size:13.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${C.ink5};margin-top:10px}
.line{font-size:19px;line-height:1.5;color:${C.ink3};margin-top:6px}
.line b{color:${C.ink};font-weight:600}
.foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:24px;padding-top:15px;border-top:1px solid ${C.rule};font-size:15px;color:${C.ink5};flex:none}
.foot .law{font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${C.ink};font-size:13px}
.p{color:${C.pass}} .m{color:${C.miss}} .o{color:${C.open}} .n{color:${C.notest}} .g{color:${C.gold}} .i{color:${C.ink}}
${extraCss || ""}
</style></head><body>
<div class="mast"><span class="b">${MARK}The Simplifier</span><span class="l">${esc(label)}</span></div>
${inner}
<div class="foot"><span class="law">Named before · Graded after · Nothing deleted</span><span>${esc(url.replace(/^https:\/\//, ""))}</span></div>
</body></html>`;
}
const tallyFigs = t => `<div class="figs">
  <div class="fig"><b class="i">${t.resolved}</b><span>resolved</span></div>
  <div class="fig"><b class="p">${t.held}</b><span>held</span></div>
  <div class="fig"><b class="m">${t.wrong}</b><span>wrong, kept</span></div>
  ${t.open ? `<div class="fig"><b class="o">${t.open}</b><span>open</span></div>` : ""}
</div>`;

/* ---------------------------------------------------------------- the cards
   Each card's words are the page's own: its title, its lede, its first line. */
const CARDS = [
  { name: "misses", page: "misses.html", label: "The record · the wrong ones", html: (F) => {
      const f = F.misses, t = f.tally;
      const lines = f.latest.map(r => {
        const c = r.close ? num(r.close) : NaN, lv = num(String(r.level).split("/")[0]);
        const d = isFinite(c) && isFinite(lv) ? `, ${fmt(Math.abs(c - lv), decOf(r.metal))} ${c < lv ? "below" : "above"} the level` : "";
        return `<div class="line"><b>${esc(r.metal)} ${esc(r.level)}</b>${r.close ? ` · closed ${esc(r.close)}${d}` : ""}</div>`;
      }).join("");
      return `<div class="k">The ones I got wrong</div>
<h1 style="max-width:20ch">Every call the close proved wrong, in full, and kept.</h1>
<div class="body" style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
  <div class="figs">
    <div class="fig"><b class="m" style="font-size:96px">${t.wrong}</b><span>wrong, kept</span></div>
    <div class="fig"><b class="p">${t.held}</b><span>held</span></div>
    <div class="fig"><b class="i">${t.resolved}</b><span>resolved</span></div>
  </div>
  ${f.latest.length ? `<div style="text-align:right"><div class="line" style="font-size:13.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.miss}">The latest, the ${esc(short(f.latest_close))} close</div>${lines}</div>` : ""}
</div>`; } },
  { name: "targets", page: "targets.html", label: "The bank board", html: (F) => {
      const f = F.targets, n = f.next;
      return `<div class="k">The banks, graded</div>
<h1 style="max-width:22ch">Every dated target the banks publish, graded when its window closes.</h1>
<div class="body" style="display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
  <div class="figs">
    <div class="fig"><b class="o">${f.open}</b><span>open</span></div>
    <div class="fig"><b class="p">${f.held}</b><span>held</span></div>
    <div class="fig"><b class="m">${f.wrong}</b><span>wrong, kept</span></div>
    <div class="fig"><b class="n">${f.left_off}</b><span>left off, and why</span></div>
  </div>
  ${n ? `<div style="text-align:right"><div class="line" style="font-size:13.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.open}">Next to grade</div>
    <div class="line"><b>${esc(n.house)} ${fmt(n.level, n.level % 1 ? 2 : 0)}</b> ${esc(n.metal.toLowerCase())} · ${esc(n.window_text)}</div>
    <div class="line">${n.grades_on ? `on the ${esc(long(n.grades_on).replace(/ \d{4}$/, ""))} close` : "on the last weekly close of 2026"}</div></div>` : ""}
</div>`; } },
  { name: "method", page: "method.html", label: "The Method", css: `.two{display:grid;grid-template-columns:400px 1fr;gap:40px;margin-top:30px;flex:1;min-height:0;align-items:center}
.shot{border:1px solid ${C.soft};border-radius:8px;overflow:hidden;background:#111}
.shot img{display:block;width:100%;height:auto}`, html: (F, img) => `<div class="two">
  <div><div class="k" style="margin-top:0">The Method</div>
    <h1 style="font-size:54px">The indicator the record is read from.</h1>
    <div class="sub" style="font-size:24px">It draws structure. It does not tell you what to do.</div>
    <div class="line" style="margin-top:22px;font-size:15px;color:${C.ink5}">Gold, 8 hour, TVC, 24 September 2026</div></div>
  <div class="shot"><img src="${img}" alt=""></div>
</div>` },
  { name: "year", page: "year.html", label: "By introduction", html: (F) => `<div class="k">The Year</div>
<h1 style="max-width:21ch">Twelve weeks to build the method on your own chart.</h1>
<div class="sub">Nine months to run it with the desk beside you. One person at a time, by introduction.</div>
<div class="body"><div class="line" style="font-size:13.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.ink5};margin-bottom:12px">The record it is judged on</div>${tallyFigs(F.year.tally)}</div>` },
  { name: "guest", page: "guest.html", label: "For producers and hosts", html: (F) => `<div class="k">Bradley van Eden · Metals</div>
<h1>The one who publishes his wrong calls.</h1>
<div class="sub">Ten years on an institutional gold desk. Every call named in advance with what would prove it wrong, graded at Friday's close.</div>
<div class="body">${tallyFigs(F.guest.tally)}</div>` },
  { name: "advisers", page: "advisers.html", label: "For advisers", html: (F) => `<div class="k">What you would be sending a client to</div>
<h1>A method, taught. A ledger, graded.</h1>
<div class="sub">Nothing managed, nothing advised, nothing sold that you would have to disclose.</div>
<div class="body">${tallyFigs(F.advisers.tally)}</div>` },
  { name: "tick", page: "tick.html", label: "The record · the tick book", html: (F) => {
      const f = F.tick;
      return `<div class="k">The tick book</div>
<h1>Intraday calls on the five-minute clock.</h1>
<div class="sub">Named and posted before the trade, graded on the 23:00 Madrid close of the day it names. The wrong ones stay. None of it enters the weekly tally.</div>
<div class="body">${f.rows ? `<div class="figs">
  <div class="fig"><b class="p">${f.held}</b><span>held</span></div>
  <div class="fig"><b class="m">${f.wrong}</b><span>wrong, kept</span></div>
  <div class="fig"><b class="n">${f.never_reached}</b><span>never reached</span></div>
  ${f.open ? `<div class="fig"><b class="o">${f.open}</b><span>open</span></div>` : ""}
</div>` : `<div class="line" style="font-size:15px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.ink5}">No row in the book yet</div>`}</div>`; } },
  { name: "embed", page: "embed.html", label: "The record · for publishers", html: (F) => `<div class="k">Put the record on your page</div>
<h1>One line of code.</h1>
<div class="sub">The live tally and the last graded row, on your newsletter, your blog, your show notes. When a call is wrong, your readers see it.</div>
<div class="body">${tallyFigs(F.embed.tally)}</div>` }
];

/* ---------------------------------------------------------------- the pages
   The live og:image line of each page, on a line of its own; replaced copy
   sits in comments above it and is never touched. */
const OG = /^<meta property="og:image" content="https:\/\/thesimplifier7\.github\.io\/record\/[^"]+">$/m;

async function main() {
  const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
  const F = figuresFor(R);
  const chart = path.join(HERE, METHOD_CHART);
  const img = fs.existsSync(chart) ? "data:image/jpeg;base64," + fs.readFileSync(chart).toString("base64") : "";
  if (!img) throw new Error(METHOD_CHART + " is not beside the record; the Method card draws it");
  const src = CARDS.map(c => ({ c, html: frame(c.label, c.html(F, img), SITE + c.page, c.css) }));

  let chromium; try { ({ chromium } = require("playwright")); } catch (e) {
    const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "link-cards-"));
    for (const s of src) fs.writeFileSync(path.join(tmp, "link_" + s.c.name + ".html"), s.html);
    console.log(`playwright not installed; the card sources are in ${tmp}. Nothing on the site was changed.`);
    return;
  }
  const FD = process.env.CARD_FONTS || process.env.BANK_FONTS || "";
  const face = (fam, file, w, st) => { const f = path.join(FD, file); return FD && fs.existsSync(f)
    ? `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format('woff2');font-weight:${w};font-style:${st || "normal"}}` : ""; };
  const faces = [face("IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", 500), face("IBM Plex Mono", "ibm-plex-mono-latin-600-normal.woff2", 600),
    face("Newsreader", "newsreader-latin-300-normal.woff2", 300), face("Newsreader", "newsreader-latin-400-normal.woff2", 400),
    face("Newsreader", "newsreader-latin-500-normal.woff2", 500), face("Newsreader", "newsreader-latin-400-italic.woff2", 400, "italic")].join("");
  const opts = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
  const b = await chromium.launch(opts);
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const out = [];
  for (const s of src) {
    await p.setContent(s.html, { waitUntil: "load" });
    if (faces) await p.addStyleTag({ content: faces });
    try { await p.evaluate(() => document.fonts.ready); } catch (e) {}
    await p.waitForTimeout(250);
    /* nothing may spill past the card */
    const over = await p.evaluate(() => document.body.scrollHeight > 630 || document.body.scrollWidth > 1200);
    if (over) throw new Error("link_" + s.c.name + " overflows 1200 x 630");
    const file = "link_" + s.c.name + ".png";
    await p.screenshot({ path: path.join(HERE, file) });
    const v = crypto.createHash("sha256").update(fs.readFileSync(path.join(HERE, file))).digest("hex").slice(0, 10);
    out.push({ name: s.c.name, page: s.c.page, file, v, image: SITE + file + "?v=" + v });
  }
  await b.close();

  for (const o of out) {
    const fp = path.join(HERE, o.page);
    if (!fs.existsSync(fp)) throw new Error(o.page + " is not beside the record");
    const html = fs.readFileSync(fp, "utf8");
    if (!OG.test(html)) throw new Error(o.page + " has no live og:image line of its own");
    const next = html.replace(OG, `<meta property="og:image" content="${o.image}">`);
    if (next !== html) fs.writeFileSync(fp, next);
  }
  fs.writeFileSync(path.join(HERE, "link_cards.json"), JSON.stringify({
    note: "Written by make_link_cards.js. Each page's link card, the address its og:image carries, and the figures it was drawn from. verify_record.js check 16 compares these figures with record.json.",
    generated: new Date().toISOString(), cards: out.map(o => ({ ...o, figures: F[o.name] }))
  }, null, 1) + "\n");
  console.log(`${out.length} link cards rendered at 1200 x 630 beside the record` + (faces ? ", faces injected from " + FD : "") + "; og:image set on " + out.map(o => o.page).join(", ") + ".");
}

module.exports = { figuresFor, CARD_PAGES: CARDS.map(c => ({ name: c.name, page: c.page })) };
if (require.main === module) main().catch(e => { console.error("make_link_cards.js: " + e.message); process.exit(1); });
