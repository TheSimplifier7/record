#!/usr/bin/env node
/* ASSAY v2 card builder · Design Lab, 28 October 2026
   Every mark on every card is computed from record.json (the record's own ledger). Nothing typed by hand.
   usage: node build.js [record.json] [outdir] [--monday YYYY-MM-DD] [--friday YYYY-MM-DD (the Monday the lines were named)] [--record]
   No flag: the open week's Monday card, the latest graded week's Friday card and the record. Each in portrait 1080x1350 (ig) and X 1600x900 (x).
   Every card carries a seal whose rosette is drawn from the SHA-256 of the rows on it (assay-core.js, rowKey and seal). */
const fs = require("fs"), path = require("path");
const HERE = __dirname;
const ARGS = process.argv.slice(2), POS = ARGS.filter((a, i) => !a.startsWith("--") && !(i > 0 && /^--(monday|friday)$/.test(ARGS[i - 1])));
const flag = n => { const i = ARGS.indexOf("--" + n); return i < 0 ? null : (ARGS[i + 1] && !ARGS[i + 1].startsWith("--") ? ARGS[i + 1] : true); };
const GLASS = !flag("flat");   /* v2.2: glass over the engraved atmosphere is the default; --flat draws v2.1 */
const REC = JSON.parse(fs.readFileSync(POS[0] || path.join(HERE, "data/record.json"), "utf8"));
const OUT = POS[1] || path.join(HERE, "out");
const FONTS = process.env.CARD_FONTS || process.env.BANK_FONTS || "";
fs.mkdirSync(OUT, { recursive: true });

const A = require("./assay-core.js");
const { places, num, cmp, distOf, esc, dlong, addD, SYM, ORDER, kindOf, word, gauge, bar, legend, MON } = A;
/* ---------- the rows, numbered oldest first, as a reader counts them */
const rows = REC.rows.slice().sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : 0) || (ORDER.indexOf(a.metal) - ORDER.indexOf(b.metal)));
rows.forEach((r, i) => (r.no = i + 1));
const T = REC.tally;
const closesOn = iso => REC.closes.find(c => c.date === iso) || null;

const vault = o => A.vault(rows, Object.assign({ standardFrom: REC.standard_from }, o));

/* ---------- shared frame */
const fontFace = (fam, file, w, st = "normal") => { const f = path.join(FONTS, file); return FONTS && fs.existsSync(f) ? `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format('woff2');font-weight:${w};font-style:${st}}` : ""; };
const FACES = [["Barlow", "barlow-latin-500-normal.woff2", 500], ["Barlow", "barlow-latin-600-normal.woff2", 600], ["Barlow", "barlow-latin-700-normal.woff2", 700],
  ["Barlow Condensed", "barlow-condensed-latin-700-normal.woff2", 700], ["Barlow Condensed", "barlow-condensed-latin-800-normal.woff2", 800],
  ["IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", 500], ["IBM Plex Mono", "ibm-plex-mono-latin-600-normal.woff2", 600]].map(a => fontFace(...a)).join("");
const AVF = [path.join(HERE, "data/avatar_square.jpg"), path.join(HERE, "avatar_square.jpg")].find(f => fs.existsSync(f));
if (!AVF) { console.log("avatar_square.jpg not found beside the builder; the mark is his face"); process.exit(1); }
const AVATAR = "data:image/jpeg;base64," + fs.readFileSync(AVF).toString("base64");
const CSS = fs.readFileSync(path.join(HERE, "assay.css"), "utf8");
const COUNSEL = ["This is structural analysis. It is not a recommendation to buy or sell.", "I develop and sell The Fan, the indicator these levels are read from."];
const GF = FACES ? "" : `<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Barlow+Condensed:wght@700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">`;
const page = (w, h, body, theme, extra = "") => `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex">${GF}<style>${FACES}${CSS}
html,body{width:${w}px;height:${h}px;background:#0B1A2E}
.card{width:${w}px;height:${h}px;padding:64px var(--gutter);display:flex;flex-direction:column}
.legend{display:flex;gap:28px;flex-wrap:wrap;font-size:var(--s-small);color:var(--ink-2);font-weight:500}
.legend span{display:inline-flex;align-items:center;gap:10px}
${extra}</style></head><body class="${GLASS ? "glass" : ""}"><div class="card grain ${theme || ""}">${GLASS ? ATMOS(w, h) : ""}${body}</div></body></html>`;
const ATMOS = (w, h) => { const X = w > h, D = Math.round(X ? h * 1.15 : w * 1.05), cx = X ? w * .7 : w * .5, cy = X ? h * .55 : h * .6;
  return `<div class="atmos" style="-webkit-mask-image:linear-gradient(180deg,transparent ${X ? 8 : 26}%,#000 ${X ? 18 : 34}%,#000 ${X ? 84 : 70}%,transparent ${X ? 96 : 77}%);mask-image:linear-gradient(180deg,transparent ${X ? 8 : 26}%,#000 ${X ? 18 : 34}%,#000 ${X ? 84 : 70}%,transparent ${X ? 96 : 77}%)"><div class="bloom" style="width:${D * .7}px;height:${D * .7}px;left:${cx - D * .35}px;top:${cy - D * .35}px"></div><div class="ros" style="width:${D}px;height:${D}px;left:${Math.round(cx - D / 2)}px;top:${Math.round(cy - D / 2)}px">${A.rosette(rows, D)}</div></div>`; };
const mast = (right) => `<div class="mast"><div class="mark"><img src="${AVATAR}" alt=""><span class="word lift">The Simplifier</span></div>${/class="url"/.test(right) ? right : `<div class="eyebrow">${right}</div>`}</div>`;
const foot = (sealRows, legendBits, stack, d) => { const sl = A.seal(sealRows, { d: d || 150, legend: ["The Simplifier"].concat(legendBits) });
  return `<div class="foot${stack ? " stack" : ""}"><div class="foot-l">${sl.svg}<div class="foot-t"><div class="counsel">${COUNSEL.join("<br>")}</div>${stack ? "" : `<div class="url"><u>thesimplifier7.com</u></div>`}</div></div></div>`; };

/* ---------- the week's columns, shared by Monday and Friday */
function weekRows(iso) { return ORDER.map(m => rows.find(r => r.named === iso && r.metal === m && r.type === "Map")).filter(Boolean); }
const ctxOf = r => r.box ? { lo: r.box[0], hi: r.box[1], label: "Opening range" } : r.last_range ? { lo: r.last_range[0], hi: r.last_range[1], label: "Last week's range" } : null;
const ruleWords = r => kindOf(r) === "ceiling" ? "Wrong on a close above it." : "Wrong on a close below it.";
const numWord = n => ["No", "One", "Two", "Three", "Four", "Five"][n] || String(n);
const VW = { held: "Held", wrong: "Wrong", open: "Open", nr: "Never reached" };
function columns(rs, mode, gw, gh) {
  return rs.map(r => {
    const wd = word(r), ctx = ctxOf(r);
    let pt = null;
    if (mode === "friday" && r.close) pt = { v: r.close, label: "Friday close", kind: "close" };
    if (mode === "monday") { const pc = closesOn(addD(r.named, -3)); if (pc && pc[r.metal]) pt = { v: pc[r.metal], label: "last close", kind: "ref" }; }
    return `<div class="col tile">
      <div class="col-h"><span class="metal">${r.metal}</span><span class="sym fig">${SYM[r.metal]}</span></div>
      ${mode === "friday" ? `<div class="verdict ${wd} lift"><span class="${wd === "held" ? "metal-gold" : wd === "wrong" ? "metal-red" : "metal-ivory"}">${VW[wd]}</span></div>` : ""}
      <div class="lv"><span class="eyebrow"><b>${kindOf(r)}</b></span><span class="lvl fig lift ${mode === "friday" ? "sm " + (wd === "wrong" ? "broke" : "") : ""}"><span class="metal-gold">${esc(r.level)}</span></span></div>
      ${gauge(r, { w: gw, h: gh, ctx, point: pt })}
      <div class="cond">${ruleWords(r)}${ctx ? `<span class="cap"><i class="ctxk"></i>${esc(ctx.label)}, ${esc(ctx.lo)} to ${esc(ctx.hi)}</span>` : ""}</div>
    </div>`;
  }).join("");
}
function weekCard(iso, fmt, mode, gh) {
  const rs = weekRows(iso), fri = addD(iso, 4), X = fmt === "x" || fmt === "og", OG = fmt === "og";
  let head, eyebrow, dek, hall;
  if (mode === "monday") {
    const kinds = [...new Set(rs.map(kindOf))];
    head = kinds.length === 1 ? `${numWord(rs.length)} ${kinds[0]}${rs.length > 1 ? "s" : ""}.` : `${numWord(rs.length)} lines.`;
    eyebrow = `Named Monday ${dlong(iso)} · before the move`;
    dek = `Friday ${dlong(fri)}'s close grades each one, held or wrong. Either way it stays on the record.`;
    hall = ["No. " + rs[0].no + " to " + rs[rs.length - 1].no, "Named " + iso];
  } else {
    const held = rs.filter(r => word(r) === "held").length, wrong = rs.filter(r => word(r) === "wrong").length;
    head = wrong === 0 ? `${numWord(held)} held.` : held === 0 ? `${numWord(wrong)} wrong.` : `${numWord(held)} held. <span class="w">${numWord(wrong)} wrong.</span>`;
    eyebrow = `Graded on the close of Friday ${dlong(fri)}`;
    dek = wrong ? `Named Monday ${dlong(iso)}, before the move. The wrong ones stay.` : `Named Monday ${dlong(iso)}, before the move. Graded on the weekly close and nothing else.`;
    hall = ["No. " + rs[0].no + " to " + rs[rs.length - 1].no, "Graded " + fri];
  }
  const two = /class="w"/.test(head);
  if (X) dek = mode === "monday" ? `Friday ${dlong(fri)}'s close grades each one. Held or wrong, it stays.` : `Named Monday ${dlong(iso)}, before the move.${/wrong/.test(head) ? " The wrong ones stay." : ""}`;
  const tl = OG ? `<div class="ogtally fig"><b class="h">${T.held}</b> held · <b class="w">${T.wrong}</b> wrong, kept · <b>0</b> deleted</div>` : "";
  const headM = head.replace(/^(.*?)(<span class="w">(.*)<\/span>)?$/, (m, a, w, wt) => `<span class="metal-ivory">${a}</span>${w ? `<span class="w metal-red">${wt}</span>` : ""}`);
  const hd = `<div class="hd"><div class="eyebrow">${eyebrow}</div><h1 class="h1 lift${two ? " two" : ""}">${headM}</h1><p class="dek">${dek}</p>${tl}</div>`;
  const cols = `<div class="cols">${columns(rs, mode, X ? 240 : 252, gh || (X ? 400 : 380))}</div>`;
  const m = X ? mast(`<span class="url"><u>thesimplifier7.com</u></span>`) : mast(`<b>Lines ${rs[0].no} to ${rs[rs.length - 1].no}</b> of the record`);
  const body = X ? `${m}<div class="xb"><div class="xl">${hd}${foot(rs, hall, true, 140)}</div>${cols}</div>` : `${m}${hd}${cols}${foot(rs, hall, false, 128)}`;
  return page(X ? 1600 : 1080, OG ? 840 : X ? 900 : 1350, body, "", frameCSS(X));
}
const monday = (iso, fmt, gh) => weekCard(iso, fmt, "monday", gh);
const friday = (iso, fmt, gh) => weekCard(iso, fmt, "friday", gh);
function frameCSS(X) {
  return `
.mast{margin-bottom:${X ? 40 : 50}px}
.hd{display:flex;flex-direction:column;gap:18px;margin-bottom:${X ? 0 : 46}px}
.hd .h1{font-size:${X ? 112 : 124}px}
.ogtally{font-size:22px;color:var(--ink-2);margin-top:10px;white-space:nowrap}.ogtally b{font-weight:600;color:var(--ink)}.ogtally .h{color:var(--gold)}.ogtally .w{color:var(--wrong)}
.hd .h1.two{font-size:${X ? 92 : 104}px}
.hd .dek{font-size:${X ? 27 : 29}px}
.xb{flex:1;display:grid;grid-template-columns:480px 1fr;gap:64px;min-height:0}
.mast .url{font-size:34px}
.xl{display:flex;flex-direction:column;justify-content:space-between}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:${X ? 28 : 24}px;min-height:0}
.col{display:flex;flex-direction:column;gap:14px;min-width:0;padding:24px 22px 22px}
.col-h{display:flex;justify-content:space-between;align-items:baseline}
.metal{font-family:var(--f-display);font-weight:700;font-size:${X ? 34 : 38}px;letter-spacing:.06em;text-transform:uppercase;filter:drop-shadow(1px 2px 1.5px rgba(0,0,0,.4))}
.sym{font-size:18px;color:var(--ink-3)}
.col > .verdict{font-size:${X ? 50 : 54}px;margin-top:2px}
.lvl.sm{font-size:${X ? 30 : 32}px}
.lv{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}
.lv .eyebrow{font-size:16px}
.lvl{font-size:${X ? 40 : 44}px;color:var(--gold);line-height:1.05}
.lvl.broke{color:var(--gold-lo)}
.cond{font-size:20px;color:var(--ink-2);font-weight:500;display:flex;flex-direction:column;gap:8px;line-height:1.3}
.cap{font-size:15px;color:var(--ink-3);display:flex;gap:9px;align-items:flex-start}
.ctxk{flex:none;width:7px;height:20px;border-radius:4px;background:var(--rule);margin-top:0}
.foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:auto;padding-top:26px;border-top:1px solid var(--hairline)}
.foot.stack{flex-direction:column;align-items:flex-start;gap:18px;border-top:0;padding-top:0}
.foot-l{display:flex;flex-direction:row;align-items:center;gap:24px}
.foot .seal{flex:none}
.foot .counsel{max-width:${X ? "16em" : "none"}}
.foot-t{display:flex;flex-direction:column;gap:14px;min-width:0}
.foot-l{flex:1}`;
}

/* ---------- THE RECORD: every line, one image */
function record(fmt) {
  const X = fmt === "x", W = X ? 1600 : 1080, H = X ? 900 : 1350;
  const v = vault({ w: X ? 1600 - 144 - 470 - 56 : 1080 - 144 - 56, laneH: X ? 116 : 132 });
  const firstNamed = rows[0].named, lastNamed = rows[rows.length - 1].named;
  const body = `${mast(`<b>${REC.rows.length} lines</b> since ${dlong(firstNamed)}`)}
    <div class="rec">
      <div class="tally">
        <div class="eyebrow">Every line since ${dlong(firstNamed)} 2026</div>
        <div class="big lift"><span class="n fig-d metal-gold">${T.held}</span><span class="l metal-gold">held</span></div>
        <div class="big w lift"><span class="n fig-d metal-red">${T.wrong}</span><span class="l metal-red">wrong,<br>kept</span></div>
        <div class="rest">${T.never_reached} never reached · ${T.open} open · <b>0 deleted</b></div>
        <p class="dek">Each line named before the move, graded on Friday's close. The wrong ones stay where they fell.</p>
        ${X ? "" : `<div class="bigseal">${A.seal(rows, { d: 236, legend: ["The Simplifier", "No. 1 to " + rows.length, "As of " + REC.last_updated] }).svg}</div>`}
      </div>
      <div class="vault tile">${v.svg}${legend()}</div>
    </div>${X ? foot(rows, ["No. 1 to " + rows.length, "As of " + REC.last_updated], false, 132) : `<div class="foot"><div class="counsel">${COUNSEL.join("<br>")}</div><div class="url"><u>thesimplifier7.com</u></div></div>`}`;
  const extra = `
.mast{margin-bottom:${X ? 40 : 56}px}
.rec{flex:1;display:${X ? "grid" : "flex"};${X ? "grid-template-columns:400px 1fr;gap:70px;align-items:start" : "flex-direction:column;gap:56px"}}
.tally{display:flex;flex-direction:column;gap:${X ? 6 : 8}px}
.big{display:flex;align-items:flex-end;gap:18px;line-height:.8}
.big .n{font-family:var(--f-display);font-weight:800;font-size:${X ? 200 : 230}px;color:var(--gold);letter-spacing:-.02em}
.big .l{font-family:var(--f-display);font-weight:800;font-size:${X ? 54 : 64}px;text-transform:uppercase;color:var(--gold);line-height:.9;padding-bottom:${X ? 14 : 18}px}
.big.w .n{font-size:${X ? 120 : 130}px;color:var(--wrong)}.big.w .l{color:var(--wrong);font-size:${X ? 38 : 44}px;padding-bottom:8px}
.big.w{margin-top:${X ? 18 : 22}px}
.rest{white-space:nowrap;font-family:var(--f-figure);font-size:${X ? 19 : 22}px;color:var(--ink-2);margin-top:18px}.rest b{color:var(--ink);font-weight:600}
.tally .dek{font-size:${X ? 24 : 28}px;margin-top:14px;max-width:${X ? "16em" : "30em"}}
${X ? "" : ".tally{display:grid;grid-template-columns:auto auto 1fr;column-gap:36px;align-items:end}.tally .eyebrow{grid-column:1/3;grid-row:1}.tally .big{grid-column:1;grid-row:2}.tally .big.w{grid-column:2;grid-row:2;margin-top:0}.tally .rest{grid-column:1/3;grid-row:3}.tally .dek{grid-column:1/3;grid-row:4;max-width:19em}.bigseal{grid-column:3;grid-row:1/5;justify-self:end;align-self:center}"}
.vault{display:flex;flex-direction:column;gap:16px;padding:26px 28px 22px;${X ? "margin-top:30px" : ""}}
.foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:auto;padding-top:28px;border-top:1px solid var(--hairline)}
.foot-l{display:flex;flex-direction:row;align-items:center;gap:24px}
.foot .seal{flex:none}`;
  return page(W, H, body, "", extra);
}

/* ---------- write */
const latestOpen = [...new Set(rows.filter(r => r.grade === "pending").map(r => r.named))].sort().pop();
const graded = [...new Set(rows.filter(r => r.type === "Map" && r.close && r.named >= "2026-09-28").map(r => r.named))].sort();
const jobs = [], FMTS = ["ig", "x"];
const want = { monday: flag("monday"), friday: flag("friday"), record: flag("record") };
if (!want.monday && !want.friday && !want.record && !flag("og")) { want.monday = latestOpen || null; want.friday = graded[graded.length - 1]; want.record = true; }
if (want.monday && want.monday !== true) for (const f of FMTS) jobs.push([`monday_${want.monday}_${f}`, gh => monday(want.monday, f, gh), f]);
if (want.friday && want.friday !== true) for (const f of FMTS) jobs.push([`friday_${want.friday}_${f}`, gh => friday(want.friday, f, gh), f]);
if (want.record) for (const f of FMTS) jobs.push([`record_${REC.last_updated}_${f}`, () => record(f), f]);
/* --og: the record's link card (og:image), 1200 x 630, the open week if any, else the week last graded: card_<named>_<open|graded> */
if (flag("og")) { const n = latestOpen || graded[graded.length - 1], md = latestOpen ? "open" : "graded"; jobs.push([`card_${n}_${md}`, gh => weekCard(n, "og", latestOpen ? "monday" : "friday", gh), "og"]); }
(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  for (const [n, make, f] of jobs) {
    const W = f === "ig" ? 1080 : 1600, H = f === "og" ? 840 : f === "x" ? 900 : 1350;
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: f === "og" ? 0.75 : 2 });
    let gh = 300, html = make(gh);
    for (let pass = 0; pass < 2; pass++) {
      await p.setContent(html, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
      const d = await p.evaluate(() => {
        const cols = [...document.querySelectorAll(".col")]; if (!cols.length) return 0;
        const bottom = Math.max(...cols.flatMap(c => [...c.children].map(e => e.getBoundingClientRect().bottom)));
        const card = document.querySelector(".card").getBoundingClientRect(), f = document.querySelector(".foot");
        const lim = f && !f.classList.contains("stack") ? card.bottom - 64 - f.getBoundingClientRect().height - 34 : card.bottom - 64;
        return Math.floor(lim - bottom);
      });
      if (!d || pass === 1) break;
      gh = Math.max(220, Math.min(620, gh + d)); html = make(gh);
    }
    fs.writeFileSync(path.join(OUT, n + ".html"), html);
    const over = await p.evaluate(() => { const c = document.querySelector(".card").getBoundingClientRect(); return [...document.querySelectorAll(".card *")].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > c.right - 40 || r.bottom > c.bottom - 40); }).map(e => (e.className.baseVal ?? e.className) || e.tagName).slice(0, 6); });
    if (over.length) console.log("NEAR EDGE", n, over);
    await p.screenshot({ path: path.join(OUT, n + ".png") }); await p.close();
    console.log("rendered", n, "gauge", gh);
  }
  await b.close();
})();
