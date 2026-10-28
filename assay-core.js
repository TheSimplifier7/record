/* ASSAY core v1 · THE SIMPLIFIER design system · Design Lab, 28 October 2026
   The drawing primitives every graphic uses: the line gauge, the ingot, the vault. Pure functions: data in, SVG out.
   Runs in Node (require) and in the browser (window.Assay). Colours come only from the system's tokens, as CSS variables. */
(function (root) {
/* ---------- numbers, exactly as the record does them */
const places = s => { const t = String(s), i = t.indexOf("."); return i < 0 ? 0 : t.length - i - 1; };
const num = s => parseFloat(String(s).replace(/,/g, ""));
const scaled = (s, dp) => { const [a, b = ""] = String(s).replace(/,/g, "").split("."); return BigInt(a) * 10n ** BigInt(dp) + (dp ? BigInt((b + "0".repeat(dp)).slice(0, dp)) : 0n); };
const cmp = (a, b) => { const p = Math.max(places(a), places(b)), x = scaled(a, p), y = scaled(b, p); return x < y ? -1 : x > y ? 1 : 0; };
const distOf = (a, b) => {
  const dp = Math.max(places(a), places(b)); let v = scaled(a, dp) - scaled(b, dp); if (v < 0n) v = -v;
  const p = 10n ** BigInt(dp); let s = (v / p).toLocaleString("en-US") + (dp ? "." + String(v % p).padStart(dp, "0") : "");
  if (s.includes(".")) { while (s.endsWith("0") && s.split(".")[1].length > 2) s = s.slice(0, -1); } else s += ".00";
  if (s.split(".")[1].length < 2) s += "0"; return s;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dlong = iso => { const d = new Date(iso + "T12:00:00Z"); return d.getUTCDate() + " " + MON[d.getUTCMonth()]; };
const addD = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const SYM = { Gold: "XAU", Silver: "XAG", Platinum: "XPT" };
const ORDER = ["Gold", "Silver", "Platinum"];

const kindOf = r => r.side === "copper" ? "ceiling" : r.side === "slate" ? "floor" : (/above/.test(r.kill || "") ? "ceiling" : "floor");
const word = r => r.grade === "pass" ? "held" : (r.grade === "miss" || r.grade === "partial") ? "wrong" : r.grade === "pending" ? "open" : "nr";

/* ---------- light: one key from the upper left. lift = a contact shadow and a far soft shadow, so a mark floats above the
   ground; bevel = a specular rim on the edges facing the light. Decoration only: no mark moves. */
const LIGHT = id => `<filter id="${id}l" x="-40%" y="-120%" width="180%" height="440%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="a1"/><feOffset in="a1" dx="1.2" dy="2.4" result="o1"/><feComponentTransfer in="o1" result="s1"><feFuncA type="linear" slope=".62"/></feComponentTransfer>
  <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="a2"/><feOffset in="a2" dx="5" dy="13" result="o2"/><feComponentTransfer in="o2" result="s2"><feFuncA type="linear" slope=".55"/></feComponentTransfer>
  <feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${id}v" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b"/>
  <feSpecularLighting in="b" surfaceScale="3" specularConstant="1.05" specularExponent="22" lighting-color="#fff4dc" result="sp"><feDistantLight azimuth="225" elevation="38"/></feSpecularLighting>
  <feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>
  <feComposite in="SourceGraphic" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".75" k4="0" result="lit"/>
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="a1"/><feOffset in="a1" dx="1.2" dy="2.4" result="o1"/><feComponentTransfer in="o1" result="s1"><feFuncA type="linear" slope=".6"/></feComponentTransfer>
  <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="a2"/><feOffset in="a2" dx="4" dy="11" result="o2"/><feComponentTransfer in="o2" result="s2"><feFuncA type="linear" slope=".5"/></feComponentTransfer>
  <feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="lit"/></feMerge></filter>`;

/* ---------- THE LINE GAUGE (component): one metal, one line, one close, to scale. No price series is drawn. */
function gauge(r, o) {
  const W = o.w, H = o.h, id = "g" + r.no + (o.key || ""), k = kindOf(r), wd = word(r);
  const line = r.level, ctx = o.ctx, pt = o.point;
  const vals = [num(line), ctx ? num(ctx.lo) : null, ctx ? num(ctx.hi) : null, pt ? num(pt.v) : null].filter(v => v != null);
  let lo = Math.min(...vals), hi = Math.max(...vals); const span = (hi - lo) || num(line) * 0.01, pad = span * 0.16; lo -= pad; hi += pad;
  const top = 52, bot = H - 56, y = v => top + (hi - num(v)) / (hi - lo) * (bot - top);
  const yl = y(line), killTop = k === "ceiling", broke = wd === "wrong";
  const px = Math.round(W * 0.66), halo = `stroke="var(--ground)" stroke-width="7" stroke-linejoin="round" paint-order="stroke"`;
  let s = `<svg class="gauge" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="${id}h" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="11" stroke="var(--wrong)" stroke-width="2"/></pattern>
    <linearGradient id="${id}m" x1="0" y1="${killTop ? 1 : 0}" x2="0" y2="${killTop ? 0 : 1}"><stop offset="0" stop-color="#fff" stop-opacity="${broke ? .75 : .42}"/><stop offset="${broke ? .9 : .55}" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}k"><rect x="0" y="${killTop ? 0 : yl.toFixed(1)}" width="${W}" height="${(killTop ? yl : H - yl).toFixed(1)}" fill="url(#${id}m)"/></mask>
    <linearGradient id="${id}s" x1="0" y1="${killTop ? 0 : 1}" x2="0" y2="${killTop ? 1 : 0}"><stop offset="0" stop-color="var(--gold)" stop-opacity=".075"/><stop offset=".6" stop-color="var(--gold)" stop-opacity="0"/></linearGradient>
    <filter id="${id}f" x="-10%" y="-300%" width="120%" height="700%"><feGaussianBlur stdDeviation="5"/></filter>
    <linearGradient id="${id}g" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--gold)"/><stop offset=".4" stop-color="var(--gold-hi)"/><stop offset=".56" stop-color="var(--gold-hi)"/><stop offset="1" stop-color="var(--gold)"/></linearGradient>
    <filter id="${id}b" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
    ${LIGHT(id)}
    <radialGradient id="${id}pearl" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="var(--ink)"/><stop offset="1" stop-color="var(--ink-2)"/></radialGradient>
  </defs>`;
  /* the side that proves it wrong, hatched and fading from the line; the side it must stay on, washed in gold */
  s += `<rect x="0" y="${killTop ? 0 : yl.toFixed(1)}" width="${W}" height="${(killTop ? yl : H - yl).toFixed(1)}" fill="url(#${id}h)" mask="url(#${id}k)"/>`;
  /* context: the range the line was read against, a quiet bar on the left edge */
  if (ctx) { const a = y(ctx.hi), b = y(ctx.lo); s += `<rect x="0" y="${a.toFixed(1)}" width="7" height="${Math.max(3, b - a).toFixed(1)}" rx="3.5" fill="var(--rule)"/>`; }
  /* the line: glow and core; split where a close went through it */
  const g0 = px - 26, g1 = px + 26, Y = yl.toFixed(1);
  s += `<g filter="url(#${id}v)">`;
  if (!broke) {
    s += `<line x1="0" y1="${Y}" x2="${W}" y2="${Y}" stroke="var(--gold-hi)" stroke-width="12" stroke-opacity=".45" filter="url(#${id}f)"/>`;
    s += `<line x1="0" y1="${Y}" x2="${W}" y2="${Y}" stroke="url(#${id}g)" stroke-width="5"/>`;
    s += `<line x1="0" y1="${(yl - 1.7).toFixed(1)}" x2="${W}" y2="${(yl - 1.7).toFixed(1)}" stroke="var(--gold-hi)" stroke-width="1.1" stroke-opacity=".7"/>`;
  } else {
    /* the fracture: the line snapped where the close went through; splintered ends in wrong, two shards thrown toward the close */
    const t = killTop ? -1 : 1, X = v => v.toFixed(1), q = n => (yl + n).toFixed(1);
    s += `<circle cx="${px}" cy="${Y}" r="22" fill="var(--wrong)" fill-opacity=".34" filter="url(#${id}b)"/>`;
    const endL = [[g0, -2.5], [g0 + 9, -5.5], [g0 + 3, -0.8], [g0 + 10, 1.4], [g0 + 2, 2.5]], endR = [[g1, -2.5], [g1 - 6, -0.6], [g1 - 1, 0.6], [g1 - 9, 5.5], [g1 - 2, 2.5]];
    const poly = (edge, x0) => `${X(x0)},${q(-2.5)} ` + edge.map(([x, dy]) => `${X(x)},${q(dy)}`).join(" ") + ` ${X(x0)},${q(2.5)}`;
    s += `<polygon points="${poly(endL, 0)}" fill="var(--gold-lo)"/><polygon points="${poly(endR, W)}" fill="var(--gold-lo)"/>`;
    s += `<polyline points="${endL.map(([x, dy]) => `${X(x)},${q(dy)}`).join(" ")}" fill="none" stroke="var(--wrong)" stroke-width="2.4" stroke-linejoin="miter"/>`;
    s += `<polyline points="${endR.map(([x, dy]) => `${X(x)},${q(dy)}`).join(" ")}" fill="none" stroke="var(--wrong)" stroke-width="2.4" stroke-linejoin="miter"/>`;
    s += `<polygon points="${X(px - 12)},${q(11 * t)} ${X(px - 3)},${q(15 * t)} ${X(px - 10)},${q(21 * t)}" fill="var(--wrong)"/>`;
    s += `<polygon points="${X(px + 8)},${q(18 * t)} ${X(px + 15)},${q(22 * t)} ${X(px + 9)},${q(27 * t)}" fill="var(--gold-lo)"/>`;
  }
  s += `</g>`;
  /* the point: Friday's close, or on Monday the last close, for reference only */
  if (pt) {
    const yp = y(pt.v), isClose = pt.kind === "close";
    const col = !isClose ? "var(--ink-2)" : broke ? "var(--wrong)" : "var(--gold)";
    s += `<line x1="${px}" y1="${Y}" x2="${px}" y2="${yp.toFixed(1)}" stroke="${col}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>`;
    s += `<g filter="url(#${id}v)">` + (isClose ? `<circle cx="${px}" cy="${yp.toFixed(1)}" r="13" fill="url(#${id}pearl)" stroke="${col}" stroke-width="5"/>`
                 : `<circle cx="${px}" cy="${yp.toFixed(1)}" r="10" fill="var(--ground)" stroke="${col}" stroke-width="3"/>`) + `</g>`;
    const d = distOf(pt.v, line), c = cmp(pt.v, line), rel = c > 0 ? "above" : c < 0 ? "under" : "on";
    const my = (yp + yl) / 2 + 7;
    const dTxt = rel === "on" ? "on it" : d + " " + rel, roomL = px - 18, roomR = W - px - 18, dRight = dTxt.length * 11.6 > roomL && roomR > roomL;
    const dFs = Math.max(13, Math.min(19, Math.floor((dRight ? roomR : roomL) / (dTxt.length * 0.61))));
    if (Math.abs(yp - yl) > 44) s += `<text x="${dRight ? px + 14 : px - 14}" y="${my.toFixed(1)}" text-anchor="${dRight ? "start" : "end"}" font-family="IBM Plex Mono" font-size="${dFs}" font-weight="600" fill="${isClose ? col : "var(--ink-2)"}" ${halo}>${rel === "on" ? "on it" : esc(d) + " " + rel}</text>`;
    const below = yp > yl, ly = below ? yp + 38 : yp - 44;
    s += `<text x="${W}" y="${ly.toFixed(1)}" text-anchor="end" font-family="Barlow" font-size="14" font-weight="600" letter-spacing="1.8" fill="var(--ink-3)" ${halo}>${esc(pt.label.toUpperCase())}</text>`;
    s += `<text x="${W}" y="${(ly + 22).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono" font-size="19" font-weight="600" fill="${isClose ? "var(--ink)" : "var(--ink-2)"}" ${halo}>${esc(pt.v)}</text>`;
    if (Math.abs(yp - yl) <= 44) s += `<text x="${px - (broke ? 36 : 22)}" y="${(yp <= yl ? yl - 14 : yl + 27).toFixed(1)}" text-anchor="end" font-family="IBM Plex Mono" font-size="19" font-weight="600" fill="${col}" ${halo}>${rel === "on" ? "on it" : esc(d) + " " + rel}</text>`;
  }
  return s + "</svg>";
}

/* ---------- THE VAULT (component): every row as a bar, three lanes, week by week */
function vault(rows, o) {
  const W = o.w, lanes = ORDER, laneH = o.laneH, labelW = 132, pad = 10;
  const wk = iso => { const d = new Date(iso + "T12:00:00Z"), w = d.getUTCDay(); return w === 0 ? addD(iso, 1) : addD(iso, -(w - 1)); };
  const first = wk(rows[0].named), last = wk(rows[rows.length - 1].named);
  const nW = Math.round((new Date(last) - new Date(first)) / 6048e5) + 1;
  const colW = (W - labelW - pad) / nW, bw = Math.min(30, colW * .7), bh = 17;
  const cell = {}; for (const r of rows) { const key = r.metal + "|" + wk(r.named); (cell[key] = cell[key] || []).push(r); }
  const H = lanes.length * laneH + 46;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${LIGHT("vt")}${INGOT_DEFS}</defs>`;
  let ing = "";
  /* the standard tightened on 3 July: earlier rows were graded under the old one and stay as graded */
  const sf = o.standardFrom || "2026-07-03", stdWk = wk(sf), stdX = labelW + (Math.round((new Date(stdWk) - new Date(first)) / 6048e5) + 1) * colW;
  s += `<rect x="${labelW}" y="0" width="${(stdX - labelW).toFixed(1)}" height="${lanes.length * laneH}" fill="var(--ink)" fill-opacity=".035"/>`;
  s += `<line x1="${stdX.toFixed(1)}" y1="0" x2="${stdX.toFixed(1)}" y2="${lanes.length * laneH}" stroke="var(--rule)" stroke-dasharray="2 4"/>`;
  s += `<text x="${(labelW + 6)}" y="${lanes.length * laneH - 10}" font-family="Barlow" font-weight="600" font-size="13" letter-spacing="1.6" fill="var(--ink-3)">BEFORE THE STANDARD OF ${dlong(sf).toUpperCase()}</text>`;
  lanes.forEach((m, li) => {
    const y0 = li * laneH;
    s += `<line x1="${labelW}" y1="${y0 + laneH}" x2="${W}" y2="${y0 + laneH}" stroke="var(--hairline)"/>`;
    s += `<text x="0" y="${y0 + laneH / 2 + 2}" font-family="Barlow Condensed" font-weight="700" font-size="30" letter-spacing="2" fill="var(--ink)">${m.toUpperCase()}</text>`;
    s += `<text x="0" y="${y0 + laneH / 2 + 26}" font-family="IBM Plex Mono" font-weight="500" font-size="15" fill="var(--ink-3)">${SYM[m]}</text>`;
    for (let i = 0; i < nW; i++) {
      const key = m + "|" + addD(first, i * 7), list = cell[key] || [];
      const cx = labelW + (i + .5) * colW;
      list.forEach((r, j) => {
        const by = y0 + laneH - 14 - (j + 1) * (bh + 7);
        ing += bar(cx - bw / 2, by, bw, bh, word(r));
      });
    }
  });
  s += `<g filter="url(#vtv)">${ing}</g>`;
  /* month ticks */
  for (let i = 0; i < nW; i++) {
    const d = addD(first, i * 7), dd = new Date(d + "T12:00:00Z");
    if (dd.getUTCDate() <= 7) s += `<text x="${(labelW + (i + .5) * colW).toFixed(1)}" y="${lanes.length * laneH + 30}" text-anchor="middle" font-family="Barlow" font-weight="600" font-size="15" letter-spacing="1.8" fill="var(--ink-3)">${MON[dd.getUTCMonth()].slice(0, 3).toUpperCase()}</text>`;
  }
  return { svg: s + "</svg>", weeks: nW, first, last };
}
const INGOT_DEFS = `<linearGradient id="igH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gold-hi)"/><stop offset=".55" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--gold-lo)"/></linearGradient><linearGradient id="igW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a73"/><stop offset=".55" stop-color="var(--wrong)"/><stop offset="1" stop-color="#b8341c"/></linearGradient>`;
/* a bar: held is a filled gold ingot, wrong is a red ingot split through, never reached an empty outline, open a dashed one */
function bar(x, y, w, h, wd) {
  const t = 4, P = `M${(x + t).toFixed(1)},${y.toFixed(1)} L${(x + w - t).toFixed(1)},${y.toFixed(1)} L${(x + w).toFixed(1)},${(y + h).toFixed(1)} L${x.toFixed(1)},${(y + h).toFixed(1)} Z`;
  if (wd === "held") { const tb = h * .34, ti = t * (tb / h);
    return `<path d="${P}" fill="url(#igH)"/><path d="M${(x + t).toFixed(1)},${y.toFixed(1)} L${(x + w - t).toFixed(1)},${y.toFixed(1)} L${(x + w - t + ti).toFixed(1)},${(y + tb).toFixed(1)} L${(x + t - ti).toFixed(1)},${(y + tb).toFixed(1)} Z" fill="var(--gold-hi)"/><line x1="${(x + 1).toFixed(1)}" y1="${(y + h - .6).toFixed(1)}" x2="${(x + w - 1).toFixed(1)}" y2="${(y + h - .6).toFixed(1)}" stroke="var(--gold-lo)" stroke-width="1.2"/>`; }
  if (wd === "wrong") { const mx = x + w / 2, g = 3.4;
    const L = `M${(x + t).toFixed(1)},${y.toFixed(1)} L${(mx + 1 - g).toFixed(1)},${y.toFixed(1)} L${(mx - 2 - g).toFixed(1)},${(y + h).toFixed(1)} L${x.toFixed(1)},${(y + h).toFixed(1)} Z`;
    const R = `M${(mx + 1 + g).toFixed(1)},${y.toFixed(1)} L${(x + w - t).toFixed(1)},${y.toFixed(1)} L${(x + w).toFixed(1)},${(y + h).toFixed(1)} L${(mx - 2 + g).toFixed(1)},${(y + h).toFixed(1)} Z`;
    return `<path d="${L}" fill="url(#igW)"/><path d="${R}" fill="url(#igW)" transform="translate(2,3)"/>`; }
  if (wd === "open") return `<path d="${P}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3"/>`;
  return `<path d="${P}" fill="none" stroke="var(--ink-3)" stroke-width="2"/>`;
}

/* ---------- SHA-256, synchronous, so a card can carry the hash of the rows it draws (constants computed, not typed) */
const sha256 = (() => {
  const primes = []; for (let n = 2; primes.length < 64; n++) if (primes.every(p => n % p)) primes.push(n);
  const frac = x => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
  const K = primes.map(p => frac(Math.cbrt(p))), H0 = primes.slice(0, 8).map(p => frac(Math.sqrt(p)));
  const ror = (x, n) => (x >>> n) | (x << (32 - n));
  return str => {
    const bytes = new TextEncoder().encode(str), l = bytes.length, len = ((l + 9 + 63) >> 6) << 6;
    const m = new Uint8Array(len); m.set(bytes); m[l] = 0x80;
    const dv = new DataView(m.buffer); dv.setUint32(len - 4, (l * 8) >>> 0); dv.setUint32(len - 8, Math.floor(l * 8 / 4294967296));
    const H = H0.slice(), Wd = new Uint32Array(64);
    for (let o = 0; o < len; o += 64) {
      for (let i = 0; i < 16; i++) Wd[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) { const a = Wd[i - 15], b = Wd[i - 2]; Wd[i] = (Wd[i - 16] + (ror(a, 7) ^ ror(a, 18) ^ (a >>> 3)) + Wd[i - 7] + (ror(b, 17) ^ ror(b, 19) ^ (b >>> 10))) >>> 0; }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + Wd[i]) >>> 0;
        const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
    }
    return H.map(x => x.toString(16).padStart(8, "0")).join("");
  };
})();
/* the canonical text of a set of rows: one line per row, oldest first, "no|named|metal|level|side|grade|close" */
const rowKey = rows => rows.slice().sort((a, b) => a.no - b.no).map(r => [r.no, r.named, r.metal, r.level || "", r.side || "", r.grade, r.close || ""].join("|")).join("\n");

/* ---------- THE SEAL (component): the hallmark struck as a coin. Its rosette is drawn from the SHA-256 of the rows the
   graphic carries, so the engraving is unique to those rows and changes if any figure on them changes. */
function seal(rows, o) {
  const D = o.d, R = D / 2, c = R, key = rowKey(rows), hash = sha256(key), by = i => parseInt(hash.slice(i * 2, i * 2 + 2), 16);
  const id = "s" + hash.slice(0, 8) + (o.key || "");
  const k1 = 5 + by(0) % 8, k2 = k1 + 3 + by(1) % 6, k3 = 9 + by(5) % 9, N = 30 + by(2) % 16, a1 = .11 + by(3) / 255 * .05, a2 = .05 + by(4) / 255 * .04;
  const P = 300, pt = (x, y) => (c + x).toFixed(2) + "," + (c + y).toFixed(2);
  let ros = "";
  for (let i = 0; i < N; i++) {
    const ph = 2 * Math.PI * i / N; let d = "";
    for (let j = 0; j <= P; j++) { const th = 2 * Math.PI * j / P, r = R * (.47 + a1 * Math.sin(k1 * th + ph) + a2 * Math.sin(k2 * th - 2 * ph)); d += (j ? " L" : "M") + pt(r * Math.cos(th), r * Math.sin(th)); }
    ros += `<path d="${d}"/>`;
  }
  let inner = "";
  for (let i = 0; i < 18; i++) {
    const ph = 2 * Math.PI * i / 18; let d = "";
    for (let j = 0; j <= 200; j++) { const th = 2 * Math.PI * j / 200, r = R * (.255 + .03 * Math.sin(k3 * th + ph)); d += (j ? " L" : "M") + pt(r * Math.cos(th), r * Math.sin(th)); }
    inner += `<path d="${d}"/>`;
  }
  const rt = R * .845, circ = 2 * Math.PI * rt, legend = (o.legend || []).concat(["Seal " + hash.slice(0, 6).toUpperCase()]).join("  ·  ").toUpperCase() + "  ·  ";
  const fs = Math.min(R * .105, circ / (legend.length * .66));
  let s = `<svg class="seal" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" xmlns="http://www.w3.org/2000/svg" data-seal="${hash}">
  <defs><path id="${id}p" d="M${(c - rt).toFixed(2)},${c} a${rt.toFixed(2)},${rt.toFixed(2)} 0 1,1 ${(2 * rt).toFixed(2)},0 a${rt.toFixed(2)},${rt.toFixed(2)} 0 1,1 ${(-2 * rt).toFixed(2)},0"/></defs>
  <defs>${LIGHT(id)}<radialGradient id="${id}f" cx=".32" cy=".28" r=".85"><stop offset="0" stop-color="var(--raised)"/><stop offset=".6" stop-color="var(--ground)"/><stop offset="1" stop-color="var(--ground-deep)"/></radialGradient>
  <filter id="${id}e" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="b"/><feSpecularLighting in="b" surfaceScale="2.2" specularConstant="1.2" specularExponent="16" lighting-color="#fff2d0" result="sp"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/><feComposite in="SourceGraphic" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0"/></filter></defs>
  <g filter="url(#${id}l)">
  <circle cx="${c}" cy="${c}" r="${(R - 1).toFixed(2)}" fill="url(#${id}f)" stroke="var(--gold-lo)" stroke-width="1.6"/>
  <circle cx="${c}" cy="${c}" r="${(R * .955).toFixed(2)}" fill="none" stroke="var(--gold-lo)" stroke-width=".8"/>
  <circle cx="${c}" cy="${c}" r="${(R * .735).toFixed(2)}" fill="none" stroke="var(--gold-lo)" stroke-width=".8"/>
  <circle cx="${c}" cy="${c}" r="${(R * .7).toFixed(2)}" fill="none" stroke="var(--gold-lo)" stroke-width="1.4"/>
  <g filter="url(#${id}e)"><g fill="none" stroke="var(--gold)" stroke-width="${(D / 280).toFixed(2)}" stroke-opacity=".62">${ros}</g>
  <g fill="none" stroke="var(--gold-hi)" stroke-width="${(D / 420).toFixed(2)}" stroke-opacity=".42">${inner}</g></g>
  <circle cx="${c}" cy="${c}" r="${(R * .205).toFixed(2)}" fill="var(--ground)" stroke="var(--gold-lo)" stroke-width=".8"/>
  <text font-family="IBM Plex Mono" font-weight="600" font-size="${fs.toFixed(2)}" fill="var(--gold)" letter-spacing="${(fs * .06).toFixed(2)}"><textPath href="#${id}p" textLength="${(circ * .995).toFixed(1)}" lengthAdjust="spacing">${esc(legend)}</textPath></text>
  <text x="${c}" y="${(c - R * .035).toFixed(2)}" text-anchor="middle" font-family="Barlow" font-weight="600" font-size="${(R * .075).toFixed(2)}" letter-spacing="${(R * .012).toFixed(2)}" fill="var(--ink-3)">${esc((o.center || "SEAL").toUpperCase())}</text>
  <text x="${c}" y="${(c + R * .1).toFixed(2)}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="${(R * .1).toFixed(2)}" fill="var(--gold)">${hash.slice(0, 6).toUpperCase()}</text>
  </g>
</svg>`;
  return { svg: s, hash, key };
}

const legend = () => `<div class="legend as-legend">${[["held", "Held"], ["wrong", "Wrong, kept"], ["nr", "Never reached"], ["open", "Open"]].map(([k, l], i) => `<span><svg width="44" height="34" viewBox="-6 -6 44 34" style="overflow:visible"><defs>${LIGHT("lg" + i)}${INGOT_DEFS}</defs><g filter="url(#lg${i}v)">${bar(0, 0, 30, 17, k)}</g></svg>${l}</span>`).join("")}</div>`;



/* ---------- the furniture: masthead, verdict, hallmark, tally, footer (HTML strings, styled by bundle.css) */
const COUNSEL = ["This is structural analysis. It is not a recommendation to buy or sell.", "I develop and sell The Fan, the indicator these levels are read from."];
const VW = { held: "Held", wrong: "Wrong", open: "Open", nr: "Never reached" };
const masthead = (avatar, right) => `<div class="as-mast"><div class="as-mark">${avatar ? `<img src="${esc(avatar)}" alt="">` : ""}<span class="as-word">The Simplifier</span></div>${right ? `<div class="as-eyebrow">${right}</div>` : ""}</div>`;
const verdict = (wd, size) => `<span class="as-verdict ${wd}"${size ? ` style="font-size:${size}px"` : ""}>${VW[wd]}</span>`;
const hallmark = items => `<div class="as-hallmark">${items.map(h => `<span>${esc(h)}</span>`).join("")}</div>`;
const tally = t => `<div class="as-tally"><div class="as-big"><span class="n">${t.held}</span><span class="l">held</span></div><div class="as-big w"><span class="n">${t.wrong}</span><span class="l">wrong,<br>kept</span></div><div class="as-rest">${t.never_reached} never reached · ${t.open} open · <b>0 deleted</b></div></div>`;
const counselFooter = (hall, url) => `<div class="as-foot"><div class="as-foot-l">${hall ? hallmark(hall) : ""}<div class="as-counsel">${COUNSEL.join("<br>")}</div></div>${url === false ? "" : `<div class="as-url"><u>thesimplifier7.com</u></div>`}</div>`;

const api = { sha256, rowKey, seal, COUNSEL, VW, masthead, verdict, hallmark, tally, counselFooter, places, num, cmp, distOf, esc, dlong, addD, SYM, ORDER, kindOf, word, gauge, vault, bar, legend, MON };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Assay = api;
})(typeof window !== "undefined" ? window : globalThis);
