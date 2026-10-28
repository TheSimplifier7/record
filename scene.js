/* =========================================================================
   scene.js  ·  THE SCENE  ·  22 October 2026  ·  note 55 on the record

   Round 3 of the head of the page, by the founder's ruling of 22 October
   2026. One file, read two ways:

     in the page   SceneR3.model() builds the model from the page's own rows
                   and CLOSES when the page opens, and SceneR3.mount() draws
                   the scene, the pins, the inspector, the dock, the count
                   and the funnel's picture from it;
     in node       make_scene.js builds the same model from record.json and
                   writes a still of the same drawing into index.html, for a
                   reader with scripts off (SceneR3.still).

   THE LINES are read by the rule the head of the page has read them by since
   note 52, and each week's own page before it: a floor from a row that holds
   above, a ceiling from a row that stays below, the line is the row's level
   and its one weekly close is the row's own. A row that does not read cleanly
   is left out of the drawing rather than drawn wrong. It stays on the record.
   Every distance is worked in exact decimals. Nothing here types a figure.

   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
(function (root, make) {
  if (typeof module === "object" && module.exports) module.exports = make();
  else root.SceneR3 = make();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* ---------------------------------------------------------------- words and figures */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NUMW = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const dt = iso => new Date(iso + "T12:00:00Z");
const addD = (iso, n) => { const d = dt(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dm = iso => dt(iso).getUTCDate() + " " + MON[dt(iso).getUTCMonth()];
const dml = iso => dt(iso).getUTCDate() + " " + MONL[dt(iso).getUTCMonth()];
const ddm = iso => DAY3[dt(iso).getUTCDay()] + " " + dm(iso);
const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = s => parseFloat(String(s).replace(/,/g, ""));
const f1 = v => v.toFixed(1);
const ms = iso => Date.parse(iso + "T00:00:00Z");
/* exact decimals, as distOf on the record: the finer precision of the two, trailing zeros trimmed to no fewer than two places */
const places = s => { const t = String(s), i = t.indexOf("."); return i < 0 ? 0 : t.length - i - 1; };
const scaled = (s, dp) => { const [a, b = ""] = String(s).replace(/,/g, "").split("."); return parseInt(a, 10) * Math.pow(10, dp) + (dp ? parseInt((b + "0".repeat(dp)).slice(0, dp), 10) : 0); };
const cmp = (a, b) => { const p = Math.max(places(a), places(b)), x = scaled(a, p), y = scaled(b, p); return x < y ? -1 : x > y ? 1 : 0; };
const distOf = (a, b) => {
  const dp = Math.max(places(a), places(b)), v = Math.abs(scaled(a, dp) - scaled(b, dp)), p = Math.pow(10, dp);
  let s = Math.floor(v / p).toLocaleString("en-US") + (dp ? "." + String(v % p).padStart(dp, "0") : "");
  if (s.includes(".")) { while (s.endsWith("0") && s.split(".")[1].length > 2) s = s.slice(0, -1); } else s += ".00";
  if (s.split(".")[1].length < 2) s += "0";
  return s;
};

/* the close that grades a line: Friday 23:00 in Madrid, from the row's own date (gradeCloseFor, as on the record) */
const madridOffsetMin = d => {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", timeZoneName: "longOffset" }).formatToParts(d);
    const tz = (parts.find(x => x.type === "timeZoneName") || {}).value || "";
    const m = tz.match(/([+-])(\d{2}):?(\d{2})?/);
    if (!m) return 120;
    return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10));
  } catch (e) { return 120; }
};
/* 28 Oct 2026, note note 60: the close that grades a week is 17:00 in New York, read off New York's own clock,
   so it is 23:00 in Madrid in most weeks and 22:00 in the weeks the clocks change on different Sundays. */
const nyOffsetMin = d => {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", timeZoneName: "longOffset" }).formatToParts(d);
    const tz = (parts.find(x => x.type === "timeZoneName") || {}).value || "";
    const m = tz.match(/([+-])(\d{2}):?(\d{2})?/);
    if (!m) return -240;
    return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10));
  } catch (e) { return -240; }
};
const nyCloseOn = iso => { const g = new Date(iso + "T21:00:00Z"); if (isNaN(g)) return null; return new Date(Date.parse(iso + "T17:00:00Z") - nyOffsetMin(g) * 60000); };
const madridHM = d => { const t = new Date(d.getTime() + madridOffsetMin(d) * 60000); return String(t.getUTCHours()).padStart(2, "0") + ":" + String(t.getUTCMinutes()).padStart(2, "0"); };
const gradeCloseFor = iso => {
  const d = new Date(iso + "T12:00:00Z");
  if (isNaN(d)) return null;
  const day = d.getUTCDay(); let add = (5 - day + 7) % 7; if (add === 0) add = 7;
  d.setUTCDate(d.getUTCDate() + add);
  return nyCloseOn(d.toISOString().slice(0, 10));
  /* WAS, until note 60:
  const guess = new Date(d.toISOString().slice(0, 10) + "T23:00:00Z");
  return new Date(guess.getTime() - madridOffsetMin(guess) * 60000); */
};
const tzOf = d => d && madridOffsetMin(d) === 60 ? "CET" : "CEST";
const tradingMonday = iso => { const w = dt(iso).getUTCDay(); return w === 0 ? addD(iso, 1) : addD(iso, -(w - 1)); };

/* ---------------------------------------------------------------- the model */
const FROM = "2026-08-31", MAX_WEEKS = 12;
const WORD = { pass: "held", miss: "wrong", partial: "wrong", notest: "never reached", pending: "open" };
const WORDUP = { held: "HELD", hit: "HELD", wrong: "WRONG", nr: "NEVER REACHED", open: "OPEN" };
const MARK = { held: "h", hit: "H", wrong: "w", nr: "n", open: "o" };

/* src.calls: the record's rows in its own order, newest first, each
   { date, type, metal, level, side, kill, grade, hit, close, lineFrom, readAt, anchor, box }.
   src.closes: [{ date, Gold, Silver, Platinum }]. src.lineFrom: where a line comes from, in words.
   src.counsel: counsel's two lines. src.tools: the free tools live on TradingView, [{ name, sub, url }]. */
function model(src) {
  const calls = src.calls || [];
  const n = g => calls.filter(c => c.grade === g).length;
  const held = n("pass"), wrong = n("miss") + n("partial");
  const counts = { graded: held + wrong, held, wrong, nr: n("notest"), open: n("pending"), deleted: 0, rows: calls.length };
  const marks = calls.slice().reverse().map(c => c.grade === "pass" ? (c.hit ? "H" : "h") : (c.grade === "miss" || c.grade === "partial") ? "w" : c.grade === "pending" ? "o" : "n").join("");
  const pend = calls.filter(c => c.grade === "pending").map(c => gradeCloseFor(c.date)).filter(Boolean).sort((a, b) => a - b);
  let next = null;
  if (pend.length) {
    const c = pend[0], fri = new Date(c.getTime() + madridOffsetMin(c) * 60000).toISOString().slice(0, 10);
    next = { fri, at: c.getTime(), label: ddm(fri) + " · " + madridHM(c) + " " + tzOf(c) };   /* note 60. This read: ddm(fri) + " · 23:00 " + tzOf(c) */
  }
  const lineRead = c => {
    if (c.type !== "Map") return null;
    let kind = c.side === "slate" ? "floor" : c.side === "copper" ? "ceiling" : null;
    const km = /^a weekly close (back )?(below|beneath|under|above) ([\d,]+(?:\.\d+)?)\.?$/.exec(String(c.kill || "").trim());
    if (!km) return null;
    const kk = km[2] === "above" ? "ceiling" : "floor";
    if (kind && kind !== kk) return null;
    kind = kind || kk;
    if (km[3] !== c.level) return null;
    const word = WORD[c.grade]; if (!word) return null;
    const close = word === "open" ? "" : String(c.close || "");
    if (word !== "open" && !close) return null;
    if (close && (word === "held" || word === "wrong")) {
      const through = kind === "floor" ? cmp(close, c.level) < 0 : cmp(close, c.level) > 0;
      if (through !== (word === "wrong")) return null;
    }
    const side = close ? (cmp(close, c.level) < 0 ? "under" : cmp(close, c.level) > 0 ? "above" : "on") : "";
    const mon = tradingMonday(c.date);
    const mark = word === "held" && c.hit ? "hit" : word === "held" ? "held" : word === "wrong" ? "wrong" : word === "open" ? "open" : "nr";
    return { metal: c.metal, mon, fri: addD(mon, 4), kind, level: c.level, close, word, mark, side,
      gap: close ? (side === "on" ? "0" : distOf(close, c.level)) : "",
      posted: ddm(c.date) + (c.readAt ? " · " + c.readAt : ""),
      from: (src.lineFrom || {})[c.lineFrom] || "",
      proof: String(c.kill || "").trim().replace(/\.$/, ""),
      anchor: c.anchor || "",
      box: Array.isArray(c.box) && c.box.length === 2 && c.box.every(Boolean) ? [String(c.box[0]), String(c.box[1])] : null };
  };
  const ALL = calls.map(lineRead).filter(L => L && L.mon >= FROM);
  const WEEKS = [...new Set(ALL.map(L => L.mon))].sort().slice(-MAX_WEEKS);
  const LINES = ALL.filter(L => WEEKS.includes(L.mon));
  const first = WEEKS[0] || FROM, last = WEEKS[WEEKS.length - 1] || FROM;
  const metals = ["Gold", "Silver", "Platinum"].filter(m => LINES.some(L => L.metal === m)).map(name => {
    const lines = LINES.filter(L => L.metal === name).sort((a, b) => a.mon.localeCompare(b.mon));
    const closes = (src.closes || []).filter(c => c[name] && c.date >= addD(first, -3) && c.date <= addD(last, 6)).map(c => [c.date, String(c[name])]);
    const lastClose = closes.length ? closes[closes.length - 1] : null;
    lines.forEach(L => {
      if (L.word === "open" && lastClose && L.mon > lastClose[0]) {
        const s = cmp(lastClose[1], L.level);
        L.lastClose = lastClose[1]; L.lastDate = lastClose[0];
        L.lastGap = s === 0 ? "0" : distOf(lastClose[1], L.level); L.lastSide = s < 0 ? "under" : s > 0 ? "above" : "on";
      }
    });
    return { name, lines, closes };
  });
  return { counts, marks, next, metals, first, last, counsel: src.counsel || [], tools: src.tools || [] };
}

/* ---------------------------------------------------------------- the camera */
/* The closes as a ribbon in perspective: turned 24 degrees to the left, looking down 13, fitted to the box T. */
const CAM = { yaw: -24, pitch: 13, cam: 1500, F: 1360, W: 1000, H: 300, Z: 26 };
function geo(m, T, cam) {
  const C = Object.assign({}, CAM, cam || {});
  const vals = m.closes.map(c => num(c[1])).concat(m.lines.map(L => num(L.level)));
  let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.12 || hi * 0.01; lo -= pad; hi += pad;
  const d0 = m.closes.length ? m.closes[0][0] : m.lines[0].mon;
  const lf = m.lines[m.lines.length - 1].fri, lc = m.closes.length ? m.closes[m.closes.length - 1][0] : lf;
  const t0 = ms(addD(d0, -1)), t1 = ms(addD(lf > lc ? lf : lc, 2));
  const yaw = C.yaw * Math.PI / 180, pitch = C.pitch * Math.PI / 180, W = C.W, H = C.H, Z = C.Z;
  const P0 = (x, y, z) => {
    const x1 = x * Math.cos(yaw) + z * Math.sin(yaw), z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    const k = C.F / (C.cam - z2);
    return [x1 * k, -y2 * k];
  };
  const X = iso => -W / 2 + (ms(iso) - t0) / (t1 - t0) * W;
  const Yv = v => (v - lo) / (hi - lo) * H;
  const corners = [[-W / 2, -16, Z * 1.2], [W / 2, -16, Z * 1.2], [-W / 2, -16, -Z * 1.2], [W / 2, -16, -Z * 1.2], [-W / 2, H, Z], [W / 2, H, Z], [-W / 2, H, -Z], [W / 2, H, -Z]].map(q => P0(q[0], q[1], q[2]));
  const bx0 = Math.min(...corners.map(q => q[0])), bx1 = Math.max(...corners.map(q => q[0])), by0 = Math.min(...corners.map(q => q[1])), by1 = Math.max(...corners.map(q => q[1]));
  const sc = Math.max(0.05, Math.min((T.x1 - T.x0) / (bx1 - bx0), (T.y1 - T.y0) / (by1 - by0)));
  const ox = T.x0 + ((T.x1 - T.x0) - (bx1 - bx0) * sc) / 2, oy = T.y1 - (by1 - by0) * sc;
  const P = (x, y, z) => { const q = P0(x, y, z); return [ox + (q[0] - bx0) * sc, oy + (q[1] - by0) * sc]; };
  return { P, X, Yv, Z, W, H, lo, hi, t0, t1, sc };
}

/* ---------------------------------------------------------------- the scene */
function pickOf(m, pick) {
  if (m.lines.some(L => L.mon === pick)) return pick;
  const o = m.lines.filter(L => L.word === "open");
  return (o.length ? o[o.length - 1] : m.lines[m.lines.length - 1]).mon;
}
const markI = (k, extra) => `<i class="r3m r3m-${MARK[k] || k}"${extra || ""} aria-hidden="true"></i>`;

/* The SVG and the pins, for a stage w by hh, the ribbon fitted to T. */
function stage(m, pick, T, w, hh, opt) {
  const o = opt || {};
  const g = geo(m, T), P = g.P, Z = g.Z;
  const pt = (x, y, z) => { const p = P(x, y, z); return f1(p[0]) + "," + f1(p[1]); };
  const S = m.lines.find(L => L.mon === pick);
  const cl = m.closes.map(c => [g.X(c[0]), g.Yv(num(c[1]))]);
  let svg = "";
  if (cl.length > 1) {
    const top = "M" + cl.map(c => pt(c[0], c[1], Z)).join(" L");
    const back = "M" + cl.map(c => pt(c[0], c[1], -Z)).join(" L");
    let band = "";
    for (let i = 0; i < cl.length - 1; i++) { const a = cl[i], b = cl[i + 1]; band += "M" + pt(a[0], a[1], Z) + " L" + pt(b[0], b[1], Z) + " L" + pt(b[0], b[1], -Z) + " L" + pt(a[0], a[1], -Z) + " Z "; }
    const curtain = "M" + pt(cl[0][0], -16, Z) + " L" + cl.map(c => pt(c[0], c[1], Z)).join(" L") + " L" + pt(cl[cl.length - 1][0], -16, Z) + " Z";
    const reflTop = "M" + cl.map(c => pt(c[0], -32 - c[1], Z)).join(" L");
    const reflCurtain = "M" + pt(cl[0][0], -16, Z) + " L" + cl.map(c => pt(c[0], -32 - c[1], Z)).join(" L") + " L" + pt(cl[cl.length - 1][0], -16, Z) + " Z";
    let floor = "";
    for (let i = 0; i <= 10; i++) { const x = -g.W / 2 - 80 + i * (g.W + 160) / 10; floor += "M" + pt(x, -16, 220) + " L" + pt(x, -16, -420) + " "; }
    for (let j = 0; j <= 6; j++) { const z = 220 - j * 640 / 6; floor += "M" + pt(-g.W / 2 - 80, -16, z) + " L" + pt(g.W / 2 + 80, -16, z) + " "; }
    const tube = L => "M" + pt(g.X(L.mon), g.Yv(num(L.level)), Z * 1.15) + " L" + pt(g.X(L.fri), g.Yv(num(L.level)), Z * 1.15) + " ";
    const slab = L => { const xa = g.X(L.mon), xb = g.X(L.fri), y = g.Yv(num(L.level)), t = Z * 1.15, e = 2.4;
      return "M" + pt(xa, y + e, t) + " L" + pt(xb, y + e, t) + " L" + pt(xb, y - e, t) + " L" + pt(xa, y - e, t) + " Z M" + pt(xa, y + e, t) + " L" + pt(xb, y + e, t) + " L" + pt(xb, y + e, -t) + " L" + pt(xa, y + e, -t) + " Z "; };
    const graded = m.lines.filter(L => L.word !== "open"), open = m.lines.filter(L => L.word === "open");
    const sx = g.X(S.fri);
    const picked = "M" + pt(g.X(S.mon), g.Yv(num(S.level)) + 3.2, Z * 1.15) + " L" + pt(sx, g.Yv(num(S.level)) + 3.2, Z * 1.15);
    const stem = S.close ? "M" + pt(sx, g.Yv(num(S.level)), Z) + " L" + pt(sx, g.Yv(num(S.close)), Z) : "";
    const pool = P((g.X(S.mon) + sx) / 2, -16, 0);
    const poolR = Math.max(120, Math.min(300, 290 * g.sc / 0.62));
    svg =
      `<svg class="r3-svg" viewBox="0 0 ${Math.round(w)} ${Math.round(hh)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
      `<defs>` +
      `<linearGradient id="r3-curtain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a93b" stop-opacity=".42"/><stop offset=".55" stop-color="#e0a93b" stop-opacity=".1"/><stop offset="1" stop-color="#e0a93b" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="r3-topg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe6ad" stop-opacity=".55"/><stop offset="1" stop-color="#f2c45a" stop-opacity=".95"/></linearGradient>` +
      `<radialGradient id="r3-poolg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2c45a" stop-opacity=".3"/><stop offset="1" stop-color="#f2c45a" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="r3-openg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8db0f5" stop-opacity=".28"/><stop offset="1" stop-color="#8db0f5" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="r3-ff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".15" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="r3-sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff" stop-opacity="1"/><stop offset=".92" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient>` +
      `<mask id="r3-side" maskUnits="userSpaceOnUse" x="0" y="0" width="${Math.round(w)}" height="${Math.round(hh)}"><rect x="0" y="0" width="${Math.round(w)}" height="${Math.round(hh)}" fill="url(#r3-sg)"/></mask>` +
      `<mask id="r3-refl" maskUnits="userSpaceOnUse" x="0" y="0" width="${Math.round(w)}" height="${Math.round(hh)}"><rect x="0" y="${f1(T.y1 - 4)}" width="${Math.round(w)}" height="${f1(Math.max(40, hh - T.y1 + 4))}" fill="url(#r3-ff)"/></mask>` +
      `<filter id="r3-glow" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
      `<filter id="r3-soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>` +
      `</defs>` +
      `<g mask="url(#r3-side)">` +
      `<path d="${floor}" stroke="#cdd5e1" stroke-opacity=".07" stroke-width="1" fill="none"/>` +
      `<ellipse class="r3-pool" cx="${f1(pool[0])}" cy="${f1(pool[1])}" rx="${f1(poolR)}" ry="${f1(poolR * 0.21)}" fill="url(#r3-poolg)" filter="url(#r3-soft)"/>` +
      `<g mask="url(#r3-refl)" opacity=".22"><path d="${reflCurtain}" fill="url(#r3-curtain)"/><path d="${reflTop}" fill="none" stroke="#f2c45a" stroke-width="1.6"/></g>` +
      `<g class="r3-face"><path d="${curtain}" fill="url(#r3-curtain)"/><path d="${band}" fill="#e0a93b" fill-opacity=".09" stroke="#f2c45a" stroke-opacity=".16" stroke-width=".6"/><path d="${back}" fill="none" stroke="#f2c45a" stroke-opacity=".35" stroke-width="1.2"/></g>` +
      `<path class="r3-top" pathLength="1" d="${top}" fill="none" stroke="url(#r3-topg)" stroke-width="2.6" stroke-linejoin="round" filter="url(#r3-glow)"/>` +
      `<g class="r3-bars">` +
      (graded.length ? `<path d="${graded.map(slab).join("")}" fill="#e0a93b" fill-opacity=".55" stroke="#f2c45a" stroke-opacity=".7" stroke-width=".6"/><path d="${graded.map(tube).join("")}" stroke="#f2c45a" stroke-width="2.4" stroke-linecap="round" fill="none" filter="url(#r3-glow)"/>` : "") +
      (open.length ? `<path d="${open.map(slab).join("")}" fill="#8db0f5" fill-opacity=".35" stroke="#8db0f5" stroke-opacity=".7" stroke-width=".6"/><path d="${open.map(tube).join("")}" stroke="#8db0f5" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="7 6" fill="none" filter="url(#r3-glow)"/>` : "") +
      `<path d="${picked}" stroke="#fff" stroke-opacity=".9" stroke-width="1.4" stroke-linecap="round" fill="none"/>` +
      (stem ? `<path d="${stem}" stroke="${S.word === "wrong" ? "#ff8a80" : "#f2c45a"}" stroke-width="1.6" stroke-dasharray="3 4" fill="none"/>` : "") +
      `</g></g></svg>`;
  }
  /* the pins: one a week, over the middle of its line; a cap that would sit on another rises 22px */
  const placed = [];
  const pins = m.lines.map((L, i) => {
    const p = P(g.X(L.fri), g.Yv(num(L.level)) + 3.2, Z * 1.15), on = L.mon === pick;
    const label = dm(L.mon).toUpperCase();
    const cw = (o.compact && !on) ? 22 : (label.length + (on ? L.level.length + 1 : 0)) * 7.4 + 38, chh = 26;
    const dx = Math.min(0, (w - 8) - (p[0] + cw / 2)) + Math.max(0, 8 - (p[0] - cw / 2));
    let stem = 30, cls = "";
    const top = o.capTop == null ? -1e9 : o.capTop;
    for (let k = 0; k < 4; k++) {
      const r = { x0: p[0] - cw / 2, x1: p[0] + cw / 2, y0: p[1] - stem - chh, y1: p[1] - stem };
      if (r.y0 < top) {
        if (on) { cls = " below"; stem = 30; placed.push({ x0: r.x0, x1: r.x1, y0: p[1] + stem, y1: p[1] + stem + chh }); }
        else { cls = " mini"; stem = 30; placed.push({ x0: p[0] - 11, x1: p[0] + 11, y0: p[1] - 30 - chh, y1: p[1] - 30 }); }
        break;
      }
      if (!placed.some(q => r.x0 < q.x1 + 4 && r.x1 > q.x0 - 4 && r.y0 < q.y1 + 3 && r.y1 > q.y0 - 3)) { placed.push(r); break; }
      stem += 22; if (k === 3) placed.push(r);
    }
    const aria = m.name + ", week of " + dml(L.mon) + ", " + L.kind + " " + L.level + ", " + (L.mark === "hit" ? "held" : L.word);
    return `<button class="r3-pin${on ? " on" : ""}${L.word === "open" ? " open" : ""}${cls}" type="button" data-w="${h(L.mon)}" aria-pressed="${on}" aria-label="${h(aria)}" style="left:${f1(p[0])}px;top:${f1(p[1])}px;--stem:${stem}px;--i:${i};--dx:${f1(dx)}px">` +
      `<span class="cap">${markI(L.mark)}<span>${h(label)}</span>${on ? `<span class="lv">${h(L.level)}</span>` : ""}</span><span class="stem" aria-hidden="true"></span><span class="foot" aria-hidden="true"></span></button>`;
  }).join("");
  return { svg, pins };
}

/* ---------------------------------------------------------------- the count */
function teleMarks(M) { return M.marks.split("").map(c => `<i class="r3m r3m-${c}"></i>`).join(""); }
function countdown(M, now) {
  if (!M.next) return { text: "", frac: 0, past: false };
  const left = M.next.at - now;
  if (left <= 0) return { text: "Close printed, grade pending", frac: 0, past: true };
  const m = Math.floor(left / 60000), d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
  return { text: (d ? d + "d " : "") + String(hh).padStart(2, "0") + "h " + String(mm).padStart(2, "0") + "m", frac: Math.max(0, Math.min(1, left / (5 * 86400000))), past: false };
}

/* ---------------------------------------------------------------- the dock */
function dockHTML(M, metal) {
  const opens = M.metals.map(m => m.lines.filter(L => L.word === "open").slice(-1)[0]).filter(Boolean);
  let head;
  if (opens.length) {
    const k = { floor: opens.filter(L => L.kind === "floor").length, ceiling: opens.filter(L => L.kind === "ceiling").length };
    const part = (n, w) => (n === 1 ? "a " + w : (NUMW[n] || n) + " " + w + "s");
    const words = k.floor && k.ceiling ? part(k.floor, "floor") + " and " + part(k.ceiling, "ceiling") : k.floor ? part(k.floor, "floor") : part(k.ceiling, "ceiling");
    head = `<span class="r3-ey r3k-a"><i class="r3-dot" aria-hidden="true"></i>This week</span><span class="r3-ey r3k-b">${h(words.charAt(0).toUpperCase() + words.slice(1))}, open</span>`;
  } else head = `<span class="r3-ey r3k-a">Last week</span><span class="r3-ey r3k-b">Graded on Friday's close</span>`;
  const tabs = M.metals.map(m => {
    const L = m.lines.filter(x => x.word === "open").slice(-1)[0] || m.lines[m.lines.length - 1];
    const sub = L.word === "open" ? (L.lastGap ? "Last close " + L.lastGap + " " + (L.lastSide === "on" ? "on it" : L.lastSide) : "Waiting for Friday's close") : (L.mark === "hit" ? "held" : L.word) + (L.gap ? " · " + L.gap + " " + (L.side === "on" ? "on it" : L.side) : "");
    return `<button class="r3-tab" type="button" data-m="${h(m.name)}" aria-pressed="${m.name === metal}"><span class="r3t-a">${h(m.name)} <b>${h(L.level)}</b></span><span class="r3t-b">${h(sub)}</span></button>`;
  }).join("");
  return `<div class="r3k-head">${head}</div><div class="r3k-tabs" role="group" aria-label="Metal">${tabs}</div>`;
}

/* ---------------------------------------------------------------- the inspector */
function drawerHTML(M, metal, pick, opt) {
  const o = opt || {};
  const m = M.metals.find(x => x.name === metal) || M.metals[0];
  const S = m.lines.find(L => L.mon === pick) || m.lines[m.lines.length - 1];
  const floor = S.kind === "floor";
  const zone = (floor ? "left:50%" : "left:0") + ";background:linear-gradient(" + (floor ? "90deg" : "270deg") + "," + (S.close ? "rgba(224,169,59,.18)" : "rgba(141,176,245,.2)") + ",transparent)";
  let gauge = `<div class="r3g-zone" style="${zone}"></div><div class="r3g-line"></div>`;
  if (S.close) {
    const cv = num(S.close), lv = num(S.level), span = Math.max(Math.abs(cv - lv) * 1.6, lv * 0.004), off = Math.max(-1, Math.min(1, (cv - lv) / span));
    gauge += `<div class="r3g-close" style="left:${(50 + off * 42).toFixed(1)}%;background:${S.word === "wrong" ? "#d83a3a" : S.word === "never reached" ? "#8d97a8" : "#e0a93b"}"></div><div class="r3g-lab" style="${floor ? "right:10px" : "left:10px"}">${floor ? "ABOVE" : "UNDER"} = HELD</div>`;
  } else gauge += `<div class="r3g-lab" style="${floor ? "right:10px" : "left:10px"}">NEEDS A CLOSE ${floor ? "ABOVE" : "UNDER"}</div>`;
  /* the mini chart: the Friday closes and this line */
  const n = m.closes.length, mx = i => 14 + i * (302 / Math.max(1, n - 1));
  const lv = num(S.level), vals = m.closes.map(c => num(c[1])).concat([lv]);
  let lo = Math.min(...vals), hi = Math.max(...vals); const pd = (hi - lo) * 0.15 || hi * 0.01; lo -= pd; hi += pd;
  const my = v => 10 + (hi - v) / (hi - lo) * 72;
  const path = n ? "M" + m.closes.map((c, i) => f1(mx(i)) + "," + f1(my(num(c[1])))).join(" L") : "";
  const area = n ? path + " L" + f1(mx(n - 1)) + ",86 L" + f1(mx(0)) + ",86 Z" : "";
  const fi = m.closes.findIndex(c => c[0] === S.fri), xi = fi >= 0 ? fi : n - 1;
  const lineD = "M" + f1(Math.max(14, mx(xi) - 30)) + "," + f1(my(lv)) + " L" + f1(mx(xi) + (fi >= 0 ? 0 : 26)) + "," + f1(my(lv));
  const dotY = fi >= 0 ? my(num(m.closes[fi][1])) : n ? my(num(m.closes[n - 1][1])) : my(lv);
  const dotC = S.word === "wrong" ? "#ff8a80" : S.close ? "#f2c45a" : "#8db0f5";
  const cnt = k => m.lines.filter(L => L.word === k).length;
  const parts = [["held", "held"], ["wrong", "wrong"], ["never reached", "never reached"], ["open", "open"]].filter(([k]) => cnt(k)).map(([k, w]) => cnt(k) + " " + w);
  const dist = S.close ? `<dd class="r3-mono">${h(S.gap + " " + (S.side === "on" ? "on it" : S.side))}</dd>`
    : S.lastGap ? `<dd><span class="r3-mono">${h(S.lastGap + " " + (S.lastSide === "on" ? "on it" : S.lastSide))}</span><small>at the last close, ${h(dm(S.lastDate))}</small></dd>` : `<dd>Not yet graded</dd>`;
  const tv = (M.tools.find(t => /^the week$/i.test(t.name)) || {}).url || "https://www.tradingview.com/u/TheSimplifier7/#published-scripts";
  return `<div class="r3d-top"><span class="r3-ey">Inspector · ${h(m.name)}</span>${o.still ? "" : `<button class="r3d-x" type="button" aria-label="Close the inspector"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>`}</div>` +
    `<div class="r3d-sum"><div class="r3d-wk">Week of ${h(dml(S.mon))}</div>` +
    `<div class="r3d-lv"><b>${h(S.level)}</b><span class="r3-pill p-${S.mark}">${h(WORDUP[S.mark])}</span></div>` +
    `<p class="r3d-rule"><b>${floor ? "Floor" : "Ceiling"}:</b> the week must close ${floor ? "above" : "under"} it.</p></div>` +
    `<button class="r3d-more-b" type="button" aria-expanded="false">Show the details</button>` +
    `<div class="r3d-more">` +
    `<div class="r3d-gauge" aria-hidden="true">${gauge}</div>` +
    `<svg class="r3d-mini" viewBox="0 0 330 92" role="img" aria-label="${h(m.name + ", the Friday closes since " + (n ? dml(m.closes[0][0]) : dml(S.mon)) + ", with the line of the week of " + dml(S.mon))}">` +
    `<path d="M14,28 L316,28 M14,52 L316,52 M14,76 L316,76" stroke="#cdd5e1" stroke-opacity=".08" fill="none"/>` +
    (n ? `<path d="${area}" fill="#e0a93b" fill-opacity=".1"/><path d="${path}" stroke="#e6ebf3" stroke-width="1.6" fill="none"/>` : "") +
    `<path d="${lineD}" stroke="#e0a93b" stroke-width="2.4" fill="none"${S.close ? "" : ` stroke-dasharray="5 4"`}/>` +
    `<circle cx="${f1(fi >= 0 ? mx(fi) : mx(xi))}" cy="${f1(dotY)}" r="3.5" fill="${dotC}"/></svg>` +
    `<dl class="r3d-dl"><dt>Posted</dt><dd>${h(S.posted)}</dd>` +
    (S.from ? `<dt>Where it comes from</dt><dd>${h(S.from)}</dd>` : "") +
    `<dt>Proved wrong by</dt><dd>${h(S.proof)}</dd>` +
    `<dt>Friday's close</dt>${S.close ? `<dd class="r3-mono">${h(S.close)}</dd>` : `<dd>${h("Fri " + dm(S.fri) + " · " + madridHM(gradeCloseFor(S.mon)) + " " + tzOf(gradeCloseFor(S.mon)))}</dd>`}` +
    `<dt>Distance from the level</dt>${dist}</dl>` +
    `<div class="r3d-since"><div class="r3-ey">${h(m.name)} since ${h(dml(m.lines[0].mon))}</div><div class="r3d-marks" aria-hidden="true">${m.lines.map(L => markI(L.mark, L.mon === S.mon ? ' style="outline:1.5px solid #fff;outline-offset:2px"' : "")).join("")}</div>` +
    `<p class="r3d-count">${m.lines.length} ${m.lines.length === 1 ? "line" : "lines"} · ${h(parts.join(" · "))}</p></div>` +
    `</div>` +
    `<div class="r3d-foot"><div class="r3-ey r3-gold">Draw this on your own chart</div>` +
    `<a class="hd-btn hd-gold r3d-tv" href="${h(tv)}" data-tv="home-drawer"><span>The Week · free on TradingView</span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` +
    `<div class="r3d-links"><a class="hd-btn hd-ghost" href="#${h(S.anchor)}">This line on the record</a><a class="r3d-tl" href="week-${h(S.mon)}.html">The week's page</a></div>` +
    `<p class="r3d-counsel">${h(M.counsel.join(" "))}</p></div>`;
}

/* ---------------------------------------------------------------- the funnel's picture */
/* The week picked, as a plain chart. At t = 0 every point sits where the ribbon draws it; at t = 1 on a flat chart. */
function flatHTML(M, metal, pick, t) {
  const m = M.metals.find(x => x.name === metal) || M.metals[0];
  const S = m.lines.find(L => L.mon === pick) || m.lines[m.lines.length - 1];
  const W = 600, HH = 250, x0 = 28, x1 = 572, y0 = 22, y1 = 214;
  const g = geo(m, { x0: 40, x1: 560, y0: 40, y1: 214 });
  const vals = m.closes.map(c => num(c[1])).concat([num(S.level)]).concat(S.box ? S.box.map(num) : []);
  let lo = Math.min(...vals), hi = Math.max(...vals); const pd = (hi - lo) * 0.12 || hi * 0.01; lo -= pd; hi += pd;
  const FX = iso => x0 + (ms(iso) - g.t0) / (g.t1 - g.t0) * (x1 - x0), FY = v => y0 + (hi - v) / (hi - lo) * (y1 - y0);
  const e = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const mix = (a, b) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
  const at = (iso, v, z) => mix(g.P(g.X(iso), g.Yv(v), z), [FX(iso), FY(v)]);
  const P2 = p => f1(p[0]) + "," + f1(p[1]);
  const path = m.closes.length ? "M" + m.closes.map(c => P2(at(c[0], num(c[1]), g.Z))).join(" L") : "";
  const ln = (v, a, b) => "M" + P2(at(a, num(v), g.Z * 1.15)) + " L" + P2(at(b, num(v), g.Z * 1.15));
  const kind = S.kind === "floor" ? "Floor" : "Ceiling";
  const lab = e > 0.85 ? (e - 0.85) / 0.15 : 0;
  const ly = FY(num(S.level));
  const other = S.box ? (S.kind === "ceiling" ? S.box[0] : S.box[1]) : null;
  const grid = [0, 1, 2, 3].map(i => { const y = y0 + i * (y1 - y0) / 3; return `M${x0},${f1(y)} L${x1},${f1(y)}`; }).join(" ");
  return `<svg class="r3f-svg" viewBox="0 0 ${W} ${HH}" role="img" aria-label="${h(m.name + ", the Friday closes as a plain chart, with the " + kind.toLowerCase() + " of the week of " + dml(S.mon) + " at " + S.level + (other ? " and the other edge of the range the week opened in, " + other : ""))}">` +
    `<path d="${grid}" stroke="#cdd5e1" stroke-opacity="${(0.08 * e).toFixed(3)}" fill="none"/>` +
    (S.box ? `<rect x="${f1(FX(S.mon))}" y="${f1(FY(Math.max(num(S.box[0]), num(S.box[1]))))}" width="${f1(FX(S.fri) - FX(S.mon))}" height="${f1(Math.abs(FY(num(S.box[0])) - FY(num(S.box[1]))))}" fill="#8db0f5" fill-opacity="${(0.12 * e).toFixed(3)}"/>` +
      `<path d="${ln(other, S.mon, S.fri)}" stroke="#8db0f5" stroke-width="1.6" stroke-opacity="${(0.9 * e).toFixed(3)}" fill="none"/>` : "") +
    (path ? `<path d="${path}" stroke="${e < 0.5 ? "#f2c45a" : "#e6ebf3"}" stroke-width="2" stroke-linejoin="round" fill="none"/>` : "") +
    `<path d="${ln(S.level, S.mon, S.fri)}" stroke="#f2c45a" stroke-width="3" stroke-linecap="round" fill="none"${S.close ? "" : ` stroke-dasharray="7 5"`}/>` +
    `<g opacity="${lab.toFixed(3)}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="12" font-weight="600">` +
    `<text x="${f1(Math.min(FX(S.fri) + 8, x1 - 4))}" y="${f1(ly + 4)}" fill="#f2c45a" text-anchor="${FX(S.fri) + 120 > x1 ? "end" : "start"}">${h(kind + " " + S.level)}</text>` +
    (other ? `<text x="${f1(Math.min(FX(S.fri) + 8, x1 - 4))}" y="${f1(FY(num(other)) + 4)}" fill="#8db0f5" text-anchor="${FX(S.fri) + 120 > x1 ? "end" : "start"}">${h(other)}</text>` : "") +
    `<text x="${x0}" y="${HH - 8}" fill="#a3aec0" font-size="11">${h(dm(m.closes.length ? m.closes[0][0] : S.mon).toUpperCase())}</text>` +
    `<text x="${x1}" y="${HH - 8}" fill="#a3aec0" font-size="11" text-anchor="end">${h(dm(m.closes.length ? m.closes[m.closes.length - 1][0] : S.fri).toUpperCase())}</text>` +
    `</g></svg>`;
}
function flatCaption(M, metal, pick) {
  const m = M.metals.find(x => x.name === metal) || M.metals[0];
  const S = m.lines.find(L => L.mon === pick) || m.lines[m.lines.length - 1];
  return m.name + ", week of " + dml(S.mon) + ", as a plain chart: the " + (S.kind === "floor" ? "floor" : "ceiling") + " at " + S.level + (S.box ? " and the range the week opened in" : "") + ".";
}

/* ---------------------------------------------------------------- the still, for a reader with scripts off */
function still(M) {
  const m = M.metals[0], pick = pickOf(m, null), w = 1440, hh = 940;
  const T = { x0: 64, x1: 1014, y0: 600, y1: 850 };
  const s = stage(m, pick, T, w, hh, { still: true, capTop: 540 });
  return {
    tele: teleCountsHTML(M),
    marks: teleMarks(M),
    stage: s.svg + `<div class="r3-pins">${s.pins}</div>`,
    dock: dockHTML(M, m.name),
    drawer: drawerHTML(M, m.name, pick, { still: true }),
    count: String(M.counts.rows),
    pic: flatHTML(M, m.name, pick, 1),
    cap: h(flatCaption(M, m.name, pick)),
    tools: toolsHTML(M)
  };
}
function teleCountsHTML(M) {
  const c = M.counts;
  const k = [["Graded", c.graded, ""], ["Held", c.held, "r3-cg"], ["Wrong, kept", c.wrong, "r3-cr"], ["Never reached", c.nr, "r3-cn"], ["Open", c.open, "r3-cb"], ["Deleted", c.deleted, ""]];
  return k.map(([l, v, cls]) => `<div class="r3-kpi${l === "Never reached" ? " r3-kpi-nr" : ""}${l === "Deleted" ? " r3-kpi-del" : ""}"><span class="r3-ey">${h(l)}</span><b class="${cls}">${h(v)}</b></div>`).join("");
}
function toolsHTML(M) {
  return M.tools.map(t => `<li><a href="${h(t.url)}" data-tv="home-funnel-02-${h(t.key)}">${h(t.name)}</a><span class="r3-ey">${h(t.sub)}</span></li>`).join("");
}

/* ---------------------------------------------------------------- in the page */
function mount(M) {
  const doc = document, root = doc.querySelector(".r3");
  if (!root || !M.metals.length) return null;
  let reduce = false; try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  const q = s => root.querySelector(s);
  const stageEl = q(".r3-stage"), cam = q(".r3-cam"), drift = q(".r3-drift"), copy = q(".r3-copy"), dock = q("#r3-dock"), drawer = q("#r3-drawer"), opener = q("#r3-open");
  const tele = q("#r3-tele"), cdEl = q("#r3-cd"), ring = q("#r3-ring"), whenEl = q("#r3-when");
  const fun = doc.getElementById("r3f"), pic = fun && fun.querySelector(".r3f-pic"), picCap = fun && fun.querySelector(".r3f-cap");
  const st = { metal: M.metals[0].name, pick: null, drawer: true, more: false, flatT: reduce ? 1 : 0 };
  const metalOf = () => M.metals.find(x => x.name === st.metal) || M.metals[0];
  const wide = () => window.innerWidth >= 1100;

  function layout() {
    const w = stageEl.clientWidth, hh = stageEl.clientHeight;
    if (!wide()) return { w, hh, T: { x0: 10, x1: w - 10, y0: w < 761 ? 54 : 70, y1: hh - 14 }, capTop: 2 };
    const sr = stageEl.getBoundingClientRect(), cr = copy.getBoundingClientRect(), kr = dock.getBoundingClientRect();
    const dr = st.drawer && !drawer.hidden ? drawer.getBoundingClientRect() : null;
    const T = { x0: 56, x1: (dr ? dr.left - sr.left - 34 : w - 64), y0: cr.bottom - sr.top + 56, y1: kr.top - sr.top + 24 };
    if (T.y1 - T.y0 < 180) T.y0 = T.y1 - 180;
    return { w, hh, T, capTop: cr.bottom - sr.top + 10 };
  }
  let lastPinX = null;
  function draw() {
    const m = metalOf(); st.pick = pickOf(m, st.pick);
    const L = layout();
    const s = stage(m, st.pick, L.T, L.w, L.hh, { compact: window.innerWidth < 761, capTop: L.capTop });
    drift.innerHTML = s.svg + `<div class="r3-pins">${s.pins}</div>`;
    drift.removeAttribute("data-still");
    dock.innerHTML = dockHTML(M, st.metal);
    drawer.innerHTML = drawerHTML(M, st.metal, st.pick, {});
    drawer.classList.toggle("more", st.more);
    const mb = drawer.querySelector(".r3d-more-b"); if (mb) { mb.setAttribute("aria-expanded", String(st.more)); mb.textContent = st.more ? "Hide the details" : "Show the details"; }
    if (pic) { pic.innerHTML = flatHTML(M, st.metal, st.pick, st.flatT); if (picCap) picCap.textContent = flatCaption(M, st.metal, st.pick); }
    /* the camera eases toward the week picked, 40px at most */
    const on = drift.querySelector(".r3-pin.on");
    if (on && !reduce && wide()) {
      const px = parseFloat(on.style.left), mid = (L.T.x0 + L.T.x1) / 2;
      cam.style.setProperty("--pan", Math.max(-40, Math.min(40, (mid - px) * 0.12)).toFixed(1) + "px");
    } else cam.style.setProperty("--pan", "0px");
  }
  function settle() { root.classList.add("r3-done"); }
  function pick(mon, focusPin) {
    settle();
    st.pick = mon; st.drawer = true; drawer.hidden = false; if (opener) opener.hidden = true;
    draw();
    if (focusPin) { const b = drift.querySelector(`.r3-pin[data-w="${mon}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
  }
  root.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const p = t.closest(".r3-pin"); if (p) { pick(p.dataset.w, true); return; }
    const tb = t.closest(".r3-tab"); if (tb) { settle(); if (tb.dataset.m !== st.metal) { st.metal = tb.dataset.m; st.pick = null; } st.drawer = true; drawer.hidden = false; if (opener) opener.hidden = true; draw(); const again = dock.querySelector(`.r3-tab[data-m="${tb.dataset.m}"]`); if (again) try { again.focus({ preventScroll: true }); } catch (x) {} return; }
    if (t.closest(".r3d-x")) { settle(); st.drawer = false; drawer.hidden = true; if (opener) { opener.hidden = false; try { opener.focus({ preventScroll: true }); } catch (x) {} } draw(); return; }
    if (opener && t.closest("#r3-open")) { st.drawer = true; drawer.hidden = false; opener.hidden = true; draw(); const x = drawer.querySelector(".r3d-x"); if (x) try { x.focus({ preventScroll: true }); } catch (y) {} return; }
    if (t.closest(".r3d-more-b")) { st.more = !st.more; draw(); const b = drawer.querySelector(".r3d-more-b"); if (b) try { b.focus({ preventScroll: true }); } catch (x) {} return; }
  });
  root.addEventListener("keydown", e => {
    if (e.key === "Escape" && wide() && st.drawer && drawer.contains(doc.activeElement)) { st.drawer = false; drawer.hidden = true; if (opener) { opener.hidden = false; try { opener.focus({ preventScroll: true }); } catch (x) {} } draw(); }
  });
  /* a swipe across the scene moves week to week */
  let sx = null, sy = null;
  stageEl.addEventListener("touchstart", e => { const t = e.touches && e.touches[0]; if (t) { sx = t.clientX; sy = t.clientY; } }, { passive: true });
  stageEl.addEventListener("touchend", e => {
    const t = e.changedTouches && e.changedTouches[0]; if (!t || sx == null) return;
    const dx = t.clientX - sx, dy = t.clientY - sy; sx = sy = null;
    if (Math.abs(dx) < 44 || Math.abs(dy) > 40) return;
    const ls = metalOf().lines, i = ls.findIndex(L => L.mon === st.pick), j = Math.max(0, Math.min(ls.length - 1, i + (dx < 0 ? 1 : -1)));
    if (j !== i) pick(ls[j].mon, false);
  }, { passive: true });
  /* the count and the clock to the next grade */
  const tick = () => {
    if (!M.next || !cdEl) return;
    const c = countdown(M, Date.now());
    cdEl.textContent = c.text;
    if (ring) ring.setAttribute("stroke-dasharray", f1(119.38 * c.frac) + " 119.38");
  };
  if (q("#r3-kpis")) q("#r3-kpis").innerHTML = teleCountsHTML(M);
  if (q("#r3-marks")) q("#r3-marks").innerHTML = teleMarks(M);
  if (M.next) { if (whenEl) whenEl.textContent = M.next.label; tick(); setInterval(tick, 30000); }
  else { const nx = q(".r3-next"); if (nx) nx.innerHTML = `<span class="r3-ey">Every line graded on Friday's close</span>`; }
  if (fun) {
    const fm = fun.querySelector("#r3f-marks"); if (fm) fm.innerHTML = teleMarks(M);
    const fc = fun.querySelector("#r3f-count"); if (fc) fc.textContent = String(M.counts.rows);
    fun.addEventListener("click", e => {
      const a = e.target && e.target.closest ? e.target.closest("a[data-r3ev]") : null;
      if (!a) return;
      try { if (window.goatcounter && typeof window.goatcounter.count === "function") window.goatcounter.count({ path: a.getAttribute("data-r3ev"), title: "The funnel, step 1: week by week", event: true }); } catch (x) {}
    });
  }
  draw();
  /* the picture in the funnel flattens from the ribbon the first time it is seen */
  if (pic && !reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(x => x.isIntersecting)) return; io.disconnect();
      const t0 = performance.now(), dur = 1300;
      const step = now => { st.flatT = Math.min(1, (now - t0) / dur); pic.innerHTML = flatHTML(M, st.metal, st.pick, st.flatT); if (st.flatT < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.45 });
    io.observe(pic);
  } else st.flatT = 1;
  let rz = 0; window.addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(draw); });
  if (reduce) root.classList.add("r3-done");
  requestAnimationFrame(() => { root.classList.add("r3-in"); setTimeout(settle, 4200); });
  return { draw, state: st };
}

return { model, mount, still, stage, dockHTML, drawerHTML, flatHTML, flatCaption, teleMarks, teleCountsHTML, toolsHTML, countdown, pickOf, gradeCloseFor, distOf, tradingMonday };
});
