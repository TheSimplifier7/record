/* =========================================================================
   descent.js  ·  WHAT A PRICE IS MADE OF  ·  25 September 2026, record note 41

   One animation, eight scales, in the order a price is built, and back:
      1  The record     every weekly close and every level named, from the record's own data
      2  One week       the week between the last two closes, folded into one candle
      3  The trades     the trades inside that candle, zoomed from a week to two seconds
      4  The orders     resting orders and the orders that cross them
      5  The floor      the people behind the orders: a trading pit, palms in to buy,
                        palms out to sell, every trade an arc of light across it
      6  The machines   the programs that send most orders now, in a hall of racks
      7  The match      the matching engine, the clock stretched to a nanosecond
      8  The vault      the metal itself, in Good Delivery bars that rarely move
   then back up through all of them to this week's lines on the record.
   (As first built on 24 September the scales below the orders went into the
   metal's physics, the ounce down to the quantum fields. The founder asked
   the same night for scales about trading and money instead; that version
   was never published.)

   WHAT IS DATA AND WHAT IS NOT
   Scale 1 draws the record's weekly closes and levels, read from CLOSES and
   CALLS when it runs on the record page and from record.json anywhere else,
   and the last caption names this week's lines from the same data, so it moves
   with every grade. Everything below it is an illustration and the screen says
   so while it runs. Scales 2 to 4 are a seeded model between the last two
   closes on the record, with no price printed on them. Scales 5 to 8 draw how
   the market works; every fact their words state is below, with its source,
   and the source is named on screen under the words.

   THE FACTS AND THEIR SOURCES, checked 25 September 2026
     COMEX gold futures began trading on 31 December 1974, the day private
       ownership of gold became legal again in the United States (BullionStar,
       the New York gold market; COMEX)
     futures trading on the New York trading floor, COMEX and NYMEX, was
       discontinued in July 2015; the floor closed for options on 30 December
       2016 (CME Group press release, 13 April 2016)
     open outcry hand signals: palms facing in to buy, palms facing out to
       sell (StoneX, Trading floor hand signals; Hand signaling (open outcry))
     automated trading, CFTC Office of the Chief Economist, Automated Trading
       in Futures Markets, update of 2019, 1 November 2014 to 31 October 2016:
       gold futures 46.1 percent of volume automated on both sides and 37.8 on
       one side, so a program on at least one side of about 84 percent; silver
       36.0 and 36.2, about 72 percent; platinum not reported
     CME's data centre at Aurora, Illinois, about 35 miles from its Chicago
       headquarters, houses the trade matching engines for all Globex products
       and customer equipment beside them (CME Group, co-location services)
     light in optical fibre travels at about 200,000 kilometres a second, so
       about 20 centimetres in a nanosecond (the Optical fiber article)
     LBMA Good Delivery: gold bars of 350 to 430 fine troy ounces, about 400,
       at least 995.0 fine, about 250 x 70 mm on top and 35 mm high, marked
       with a serial number, the refiner's stamp, the fineness and, from 2019,
       the year; silver bars of about 1,000 troy ounces (750 to 1,100), at
       least 999.0, about 300 x 130 x 80 mm (LBMA, Good Delivery Rules,
       technical specifications)
     LPPM Good Delivery: platinum in plates or ingots of 1 to 6 kilograms, at
       least 99.95 percent, marked with the producer's mark, PT or PLATINUM and
       the purity, an individual number and the year (LBMA, the OTC guide)
     the Bank of England holds about 400,000 bars of gold; when a customer
       trades gold it usually does not move, the name of the owner changes on
       the Bank's system (Bank of England, How much gold is kept in the Bank of
       England?)

   BRAND LAW. The captions, between CAPTIONS-START and CAPTIONS-END below,
   carry no em dash, hashtag, exclamation mark, emoji, superlative or
   forecast; verify_record.js check 19 reads that block and refuses one.

   Mount: any element with data-descent. data-descent-autoplay="view" plays
   it once when it comes into view (never under reduced motion); anything
   else waits for a press. data-descent-metal picks the metal followed down
   (Gold unless it says Silver or Platinum). No dependency, no request but
   record.json, and on a page with GoatCounter two events by path alone,
   descent-play and descent-end. A device that cannot draw it at full
   resolution gets fewer pixels, never a slower clock.

   For recording: Descent.mount(el, { capture: true, video: true, width,
   height }) and then player.frame(t) for each t; every frame is a pure
   function of t, so a film made this way is the same film on any machine.
   ========================================================================= */
(function () {
  "use strict";
  if (window.Descent) return;

  /* ---------------------------------------------------------------- math */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const sstep = (a, b, v) => { const x = inv(a, b, v); return x * x * (3 - 2 * x); };
  const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const expLerp = (a, b, t) => a * Math.pow(b / a, t);
  const frac = x => x - Math.floor(x);

  /* ---------------------------------------------------------------- deterministic randomness */
  const h32 = x => { x |= 0; x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return (x ^ (x >>> 16)) >>> 0; };
  const hash = (a, b, c) => h32(h32(h32(a | 0) + (b | 0)) + (c | 0)) / 4294967296;
  const rng = seed => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = r => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const hgauss = (a, b, c) => { const u = Math.max(1e-9, hash(a, b, c)), v = hash(a, b, (c | 0) + 7919); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

  /* simplex noise, after Stefan Gustavson's public-domain reference */
  const SN = (() => {
    const g3 = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1];
    const r = rng(90210), p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512), pm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = perm[i] % 12; }
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6, F3 = 1 / 3, G3 = 1 / 6;
    function n2(xin, yin) {
      let n0 = 0, n1 = 0, n2v = 0;
      const s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2, x0 = xin - (i - t), y0 = yin - (j - t);
      const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { const gi = pm[ii + perm[jj]] * 3; t0 *= t0; n0 = t0 * t0 * (g3[gi] * x0 + g3[gi + 1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { const gi = pm[ii + i1 + perm[jj + j1]] * 3; t1 *= t1; n1 = t1 * t1 * (g3[gi] * x1 + g3[gi + 1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { const gi = pm[ii + 1 + perm[jj + 1]] * 3; t2 *= t2; n2v = t2 * t2 * (g3[gi] * x2 + g3[gi + 1] * y2); }
      return 70 * (n0 + n1 + n2v);
    }
    function n3(xin, yin, zin) {
      let n0 = 0, n1 = 0, n2v = 0, n3v = 0;
      const s = (xin + yin + zin) * F3;
      const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
      const t = (i + j + k) * G3;
      const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
        else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
      } else {
        if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
        else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
        else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      }
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
      const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
      const ii = i & 255, jj = j & 255, kk = k & 255;
      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 > 0) { const gi = pm[ii + perm[jj + perm[kk]]] * 3; t0 *= t0; n0 = t0 * t0 * (g3[gi] * x0 + g3[gi + 1] * y0 + g3[gi + 2] * z0); }
      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 > 0) { const gi = pm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; t1 *= t1; n1 = t1 * t1 * (g3[gi] * x1 + g3[gi + 1] * y1 + g3[gi + 2] * z1); }
      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 > 0) { const gi = pm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; t2 *= t2; n2v = t2 * t2 * (g3[gi] * x2 + g3[gi + 1] * y2 + g3[gi + 2] * z2); }
      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 > 0) { const gi = pm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; t3 *= t3; n3v = t3 * t3 * (g3[gi] * x3 + g3[gi + 1] * y3 + g3[gi + 2] * z3); }
      return 32 * (n0 + n1 + n2v + n3v);
    }
    return { n2, n3 };
  })();
  /* smooth one-dimensional value noise in [-1, 1] */
  const vn1 = (x, seed) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = hash(i, seed, 3) * 2 - 1, b = hash(i + 1, seed, 3) * 2 - 1; return a + (b - a) * u; };

  /* ---------------------------------------------------------------- colour */
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgbOf = c => (typeof c === "string" ? hex(c) : c);
  const rgba = (c, a) => { const x = rgbOf(c); return "rgba(" + (x[0] | 0) + "," + (x[1] | 0) + "," + (x[2] | 0) + "," + a + ")"; };
  const mix = (c1, c2, t) => { const a = rgbOf(c1), b = rgbOf(c2); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };

  /* the record's palette (THE_GRAPHIC_MANUAL): colour means something or it is out */
  const P = { ground: "#141210", panel: "#1D1A16", rule: "#4A4238", soft: "#3A342C", ink: "#EFE8DC", ink3: "#CFC6B8", ink5: "#B8AE9E", ink6: "#A69C8C",
    gold: "#CBA43C", goldHi: "#E0C878", pass: "#5FA57A", miss: "#D2764A", open: "#6BA3C7", notest: "#9C9282", slate: "#6BA3C7", copper: "#D2764A" };
  const GRADE_COL = { pass: P.pass, miss: P.miss, partial: P.miss, notest: P.notest, pending: P.open };
  const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace", SERIF = "'Newsreader', Georgia, serif";

  /* ---------------------------------------------------------------- sprites, drawn once, stamped many times */
  const sprites = new Map();
  const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  /* a light: white core, coloured halo */
  function glow(color, soft) {
    const key = "g" + color + (soft ? "s" : ""); let c = sprites.get(key); if (c) return c;
    c = mkCanvas(64, 64); const g = c.getContext("2d"), x = rgbOf(color);
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (soft) { gr.addColorStop(0, rgba(x, 0.5)); gr.addColorStop(0.35, rgba(x, 0.2)); gr.addColorStop(0.7, rgba(x, 0.05)); gr.addColorStop(1, rgba(x, 0)); }
    else { gr.addColorStop(0, "rgba(255,252,244,1)"); gr.addColorStop(0.1, rgba(mix(x, [255, 252, 244], 0.5), 0.95)); gr.addColorStop(0.3, rgba(x, 0.42)); gr.addColorStop(0.6, rgba(x, 0.1)); gr.addColorStop(1, rgba(x, 0)); }
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites.set(key, c); return c;
  }
  /* a lit sphere, the light high on the left */
  function ball(color, shine) {
    const key = "b" + color + (shine || 0); let c = sprites.get(key); if (c) return c;
    const S = 128; c = mkCanvas(S, S); const g = c.getContext("2d");
    const base = rgbOf(color), hi = mix(base, [255, 250, 240], 0.72), lo = mix(base, [8, 7, 6], 0.74);
    const gr = g.createRadialGradient(S * 0.35, S * 0.32, S * 0.01, S * 0.5, S * 0.5, S * 0.5);
    gr.addColorStop(0, rgba(mix(hi, [255, 255, 255], shine || 0), 1)); gr.addColorStop(0.3, rgba(mix(base, hi, 0.25), 1));
    gr.addColorStop(0.72, rgba(mix(base, lo, 0.55), 1)); gr.addColorStop(1, rgba(lo, 1));
    g.fillStyle = gr; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1.5, 0, TAU); g.fill();
    const rim = g.createRadialGradient(S * 0.56, S * 0.58, S * 0.3, S * 0.5, S * 0.5, S * 0.5);
    rim.addColorStop(0, rgba(base, 0)); rim.addColorStop(0.82, rgba(base, 0)); rim.addColorStop(1, rgba(mix(base, [255, 245, 230], 0.45), 0.5));
    g.fillStyle = rim; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1.5, 0, TAU); g.fill();
    sprites.set(key, c); return c;
  }
  function stamp(ctx, spr, x, y, r, a) { if (a <= 0.004 || r <= 0.15) return; ctx.globalAlpha = a > 1 ? 1 : a; ctx.drawImage(spr, x - r, y - r, 2 * r, 2 * r); }

  /* ---------------------------------------------------------------- 3D */
  /* world: x right, y up, z away from the viewer */
  function camera(pos, target, fovDeg, W, H, cy) {   /* cy: the screen height the camera looks at, the middle unless given */
    const f = [target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]]; const fl = Math.hypot(f[0], f[1], f[2]) || 1; f[0] /= fl; f[1] /= fl; f[2] /= fl;
    let rl = Math.hypot(f[2], f[0]) || 1; const r = [f[2] / rl, 0, -f[0] / rl];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const foc = (H / 2) / Math.tan((fovDeg * Math.PI) / 360);
    return { pos, f, r, u, foc, W, H,
      project(p) {
        const dx = p[0] - pos[0], dy = p[1] - pos[1], dz = p[2] - pos[2];
        const zc = dx * f[0] + dy * f[1] + dz * f[2]; if (zc < 0.03) return null;
        const xc = dx * r[0] + dy * r[1] + dz * r[2], yc = dx * u[0] + dy * u[1] + dz * u[2];
        return { x: W / 2 + (foc * xc) / zc, y: (cy == null ? H / 2 : cy) - (foc * yc) / zc, z: zc, s: foc / zc };
      } };
  }
  const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)];
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  /* ---------------------------------------------------------------- dates */
  const DAY = 86400000;
  const dnum = iso => Date.parse(iso + "T12:00:00Z") / DAY;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dShort = iso => { const [y, m, d] = iso.split("-"); return (+d) + " " + MON[+m - 1]; };
  const dLong = iso => { const [y, m, d] = iso.split("-"); return (+d) + " " + MONTHS[+m - 1]; };
  /* the Friday that grades a row named on a date: the next Friday, a week on if named on a Friday */
  const fridayOf = iso => { const d = new Date(iso + "T12:00:00Z"); let a = (5 - d.getUTCDay() + 7) % 7; if (a === 0) a = 7; d.setUTCDate(d.getUTCDate() + a); return d.toISOString().slice(0, 10); };
  const fmtNum = (v, dec) => Number(v).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* ---------------------------------------------------------------- the three metals */
  const METALS = {
    Gold: { key: "Gold", name: "gold", Name: "Gold", sym: "Au", Z: 79, A: 197, N: 118,
      col: "#CBA43C", hi: "#F6E4A6", lo: "#4E3A0E", tint: "#E6C766", core: "#FFF4DA",
      shells: [2, 8, 18, 32, 18, 1], radii: [0.011, 0.036, 0.092, 0.2, 0.43, 0.9],
      tick: 0.1, spreadTicks: 1, cube: "1.17", sci: "9.5 × 10²²", digits: "95,100,000,000,000,000,000,000", latt: "0.408", across: "0.29", ratio: "20,000", nucR: 6.98 },
    Silver: { key: "Silver", name: "silver", Name: "Silver", sym: "Ag", Z: 47, A: 107, N: 60,
      col: "#C6CCD2", hi: "#FBFCFD", lo: "#40464C", tint: "#DCE4EB", core: "#F7FAFF",
      shells: [2, 8, 18, 18, 1], radii: [0.016, 0.055, 0.14, 0.38, 0.9],
      tick: 0.005, spreadTicks: 1, cube: "1.44", sci: "1.7 × 10²³", digits: "174,000,000,000,000,000,000,000", latt: "0.409", across: "0.29", ratio: "25,000", nucR: 5.7 },
    Platinum: { key: "Platinum", name: "platinum", Name: "Platinum", sym: "Pt", Z: 78, A: 195, N: 117,
      col: "#A9B3BA", hi: "#F0F3F5", lo: "#3C4247", tint: "#C8D2D9", core: "#F2F6F9",
      shells: [2, 8, 18, 32, 17, 1], radii: [0.011, 0.036, 0.092, 0.2, 0.43, 0.9],
      tick: 0.1, spreadTicks: 2, cube: "1.13", sci: "9.6 × 10²²", digits: "96,000,000,000,000,000,000,000", latt: "0.392", across: "0.28", ratio: "20,000", nucR: 6.96 }
  };
  const ORDER = ["Gold", "Silver", "Platinum"];

  /* CAPTIONS-START */
  const WORDS = {
    title: "What a price is made of",
    subtitle: "Gold, silver and platinum, from the record down to the metal in the vault",
    rail: ["The record", "One week", "The trades", "The orders", "The floor", "The machines", "The match", "The vault", "Back up"],
    unitTime: "time on screen", unitSpace: "width on screen",
    record: D => D.ok
      ? ["The weekly closes on the record, " + D.closesSince + ", and every level named against them since " + D.firstRow + "."]
      : ["The record's own data could not be read on this page, so its closes are not drawn. Everything below it is."],
    week: M => ["The last week of " + M.name + " on the record, from one Friday close to the next. Price never travels it in a straight line.",
      "Fold it into one candle: where it opened, how far it ran each way, where it closed."],
    trades: () => ["A candle is made of trades. Each dot is one: a buyer, a seller, one price, one instant.",
      "Zoom in and it stays just as rough, down to single trades: buyers paying the offer, sellers taking the bid."],
    orders: () => ["Beneath the trades, orders. Buyers queue below the price and sellers above it, first come, first served.",
      "An order that crosses the gap meets the first in line, and that is a trade. Empty a whole row and the price moves."],
    floor: {
      Gold: ["Behind every order, someone decided. For decades gold futures were traded face to face in New York, in the COMEX pit, until July 2015.",
        "Palms in to buy, palms out to sell. Each arc of light is a trade: two people, one price, agreed across the pit."],
      Silver: ["Behind every order, someone decided. For decades silver futures were traded face to face in New York, in the COMEX pit, until July 2015.",
        "Palms in to buy, palms out to sell. Each arc of light is a trade: two people, one price, agreed across the pit."],
      Platinum: ["Behind every order, someone decided. For decades platinum futures were traded face to face in New York, in the NYMEX pit, until July 2015.",
        "Palms in to buy, palms out to sell. Each arc of light is a trade: two people, one price, agreed across the pit."]
    },
    machines: {
      Gold: ["Now the orders come through screens. From 2014 to 2016 a program was on at least one side of about 84 percent of the gold futures traded.",
        "Programs that make markets quote both sides at once and move their prices many times a second, faster than any hand."],
      Silver: ["Now the orders come through screens. From 2014 to 2016 a program was on at least one side of about 72 percent of the silver futures traded.",
        "Programs that make markets quote both sides at once and move their prices many times a second, faster than any hand."],
      Platinum: ["Now the orders come through screens, and many of them are sent by programs rather than by hands.",
        "Programs that make markets quote both sides at once and move their prices many times a second, faster than any hand."]
    },
    match: {
      Gold: ["On screen, COMEX gold futures orders meet in one building, CME's data centre at Aurora, outside Chicago, where matching engines pair each with the orders waiting at its price.",
        "In a nanosecond a signal in glass fibre travels about 20 centimetres. That is why firms pay to put their machines in the same building."],
      Silver: ["On screen, COMEX silver futures orders meet in one building, CME's data centre at Aurora, outside Chicago, where matching engines pair each with the orders waiting at its price.",
        "In a nanosecond a signal in glass fibre travels about 20 centimetres. That is why firms pay to put their machines in the same building."],
      Platinum: ["On screen, NYMEX platinum futures orders meet in one building, CME's data centre at Aurora, outside Chicago, where matching engines pair each with the orders waiting at its price.",
        "In a nanosecond a signal in glass fibre travels about 20 centimetres. That is why firms pay to put their machines in the same building."]
    },
    vault: {
      Gold: ["What changes hands is metal. In London it lies in bars of about 400 troy ounces, each stamped with its refiner, its number and its fineness.",
        "The Bank of England alone holds about 400,000 of them. When gold is traded they usually do not move: only the owner's name changes."],
      Silver: ["What changes hands is metal. In London it lies in bars of about 1,000 troy ounces, each stamped with its refiner, its number and its fineness.",
        "Most trades never move a bar. The owner changes in the vault's records and the metal stays where it lies."],
      Platinum: ["What changes hands is metal. Platinum is traded in plates and ingots of 1 to 6 kilograms, each stamped with its maker, its number and its purity.",
        "Most trades never move a bar. The owner changes in the vault's records and the metal stays where it lies."]
    },
    back: D => [D.lines],
    /* the small line under the words: what is drawn and where the facts come from */
    feet: {
      week: () => "An illustration, modelled between the last two closes on the record.",
      trades: () => "An illustration, modelled between the last two closes on the record.",
      orders: () => "An illustration, modelled between the last two closes on the record.",
      floor: () => "An illustration. Dates: CME Group, 13 April 2016.",
      machines: () => "An illustration. Figures: CFTC, Automated Trading in Futures Markets, update of 2019.",
      match: () => "An illustration. CME Group co-location; light in glass fibre at about 200,000 kilometres a second.",
      vault: M => "An illustration. " + (M.key === "Platinum" ? "LPPM Good Delivery rules." : M.key === "Gold" ? "LBMA Good Delivery rules; Bank of England." : "LBMA Good Delivery rules.")
    },
    candle: ["open", "high", "low", "close"],
    book: ["buyers", "sellers", "the price", "last trade"],
    pit: [["buying", "palms in"], ["selling", "palms out"]],
    engine: ["bids", "offers", "the matching engine"],
    ruler: ["light in glass fibre,", "in the time on screen"],
    stamp: { Gold: ["FINE GOLD", "999.9"], Silver: ["FINE SILVER", "999.9"], Platinum: ["PLATINUM", "99.95"] },
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    play: "Watch", replay: "Watch again", pause: "Pause", resume: "Play",
    length: "1 min 33"
  };
  /* CAPTIONS-END */

  /* ---------------------------------------------------------------- the record's own data */
  const num = s => { const v = Number(String(s).replace(/,/g, "")); return isFinite(v) ? v : NaN; };
  const GRADE_WORD = { pass: "held", miss: "wrong", partial: "partial, counted as wrong", notest: "never reached", pending: "open" };   /* the record page's own words */
  function normalize(closes, rows) {
    const C = (closes || []).filter(c => c && /^\d{4}-\d{2}-\d{2}$/.test(c.date))
      .map(c => ({ date: c.date, Gold: num(c.Gold), Silver: num(c.Silver), Platinum: num(c.Platinum), s: { Gold: String(c.Gold || ""), Silver: String(c.Silver || ""), Platinum: String(c.Platinum || "") } }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const R = (rows || []).map(r => ({ date: r.named || r.date, metal: r.metal, level: String(r.level),
      levels: String(r.level).split("/").map(num).filter(isFinite), grade: r.grade, hit: !!r.hit || /hit/.test(r.grade_word || "") }))
      .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && METALS[r.metal] && r.levels.length && GRADE_COL[r.grade]);
    return C.length ? { closes: C, rows: R } : null;
  }
  let dataP = null;
  function loadData(src) {
    if (dataP) return dataP;
    try {
      if (typeof CLOSES !== "undefined" && typeof CALLS !== "undefined" && Array.isArray(CLOSES) && Array.isArray(CALLS)) { // eslint-disable-line no-undef
        const d = normalize(CLOSES, CALLS); if (d) return (dataP = Promise.resolve(d)); // eslint-disable-line no-undef
      }
    } catch (e) { /* not on the record page */ }
    if (window.DESCENT_RECORD) { const j = window.DESCENT_RECORD; return (dataP = Promise.resolve(normalize(j.closes, j.rows))); }
    if (!window.fetch) return (dataP = Promise.resolve(null));
    dataP = fetch(src || "record.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : null))
      .then(j => (j ? normalize(j.closes, j.rows) : null)).catch(() => null);
    return dataP;
  }
  /* the words and numbers the captions take from the data */
  function dataWords(data) {
    if (!data) return { ok: false, lines: "" };
    const firstClose = data.closes[0].date, rows = data.rows.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const firstRow = rows.length ? rows[0].date : firstClose;
    /* each metal's closes start on their own date: gold's first, silver's and platinum's later */
    const since = ORDER.map(m => { const c = data.closes.find(x => isFinite(x[m])); return c ? METALS[m].name + "'s since " + dLong(c.date) : ""; }).filter(Boolean);
    const closesSince = since.length > 1 ? since.slice(0, -1).join(", ") + " and " + since[since.length - 1] : since[0] || "";
    let lines = "", open = rows.filter(r => r.grade === "pending");
    const byMetal = list => ORDER.map(m => list.filter(r => r.metal === m)).flat();
    if (open.length) {
      const fri = fridayOf(open[open.length - 1].date);
      lines = "This week's lines on the record: " + byMetal(open).map(r => METALS[r.metal].name + " " + r.level).join(", ") + ", graded on the " + dLong(fri) + " close.";
    } else if (rows.length) {
      const last = rows[rows.length - 1].date, week = rows.filter(r => r.date === last);
      lines = "The last week graded on the record: " + byMetal(week).map(r => METALS[r.metal].name + " " + r.level + " " + (r.hit ? "hit" : GRADE_WORD[r.grade])).join(", ") + ", on the " + dLong(fridayOf(last)) + " close.";
    }
    return { ok: true, firstClose: dLong(firstClose), firstRow: dLong(firstRow), closesSince, lines };
  }

  /* =====================================================================
     THE MARKET · scales 1 to 4
     ===================================================================== */
  const DUR = { record: 12, week: 9, trades: 10, orders: 11, floor: 12, machines: 10, match: 10, vault: 11, back: 7.5 };
  const WEEK_RANGE = { Gold: 0.028, Silver: 0.05, Platinum: 0.042 };  /* a typical weekly high-low, as a share of price */

  function font(px, fam, w) { return (w || 400) + " " + Math.max(6, px).toFixed(1) + "px " + fam; }
  let QUIET = false;   /* set while a stage is drawn as the layer being zoomed through: its words stay behind */
  const setQuiet = v => { QUIET = v; };
  const tsz = env => (env.video ? 1.5 : 1);   /* a film is watched smaller than the page: its words are drawn larger */
  const lbl = env => clamp(env.U * 0.0175, 10, 22) * tsz(env);   /* the size of a label on the canvas */
  function label(ctx, txt, x, y, px, col, a, align, fam, w, track) {
    if (a <= 0.01 || QUIET) return;
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.font = font(px, fam || MONO, w || 500); ctx.textAlign = align || "left"; ctx.textBaseline = "middle";
    if (track && ctx.letterSpacing !== undefined) ctx.letterSpacing = track + "px";
    ctx.fillText(txt, x, y);
    if (track && ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
  }
  function polyline(ctx, pts, lw, col, a) {
    if (pts.length < 2 || a <= 0.01) return;
    ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  }

  /* ---------------------------------------------------------------- 1 · THE RECORD, in perspective */
  function recGeom(env) {
    if (env.cache.rec) return env.cache.rec;
    const data = env.data, sel = env.key, others = ORDER.filter(m => m !== sel), tall = env.W / env.H < 0.7;
    /* side by side, or stacked on a screen at least half as tall again as it is wide; the metal followed down sits in the middle */
    const slots = tall
      ? [{ m: others[0], x: 0, y: 10.9, z: 3.6, yaw: 0, pitch: 0.46 }, { m: sel, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }, { m: others[1], x: 0, y: -10.9, z: 3.6, yaw: 0, pitch: -0.46 }]
      : [{ m: others[0], x: -18.6, y: 0, z: 6.4, yaw: 0.46, pitch: 0 }, { m: sel, x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }, { m: others[1], x: 18.6, y: 0, z: 6.4, yaw: -0.46, pitch: 0 }];
    const PW = 16, PH = 9;
    let t0 = Infinity, t1 = -Infinity;
    if (data) {
      for (const c of data.closes) { const d = dnum(c.date); t0 = Math.min(t0, d); t1 = Math.max(t1, d); }
      for (const r of data.rows) { t0 = Math.min(t0, dnum(r.date)); t1 = Math.max(t1, dnum(fridayOf(r.date))); }
    }
    if (!isFinite(t0)) { t0 = 0; t1 = 100; }
    t0 -= 4; t1 += 4;
    const months = [];
    for (let d = Math.ceil(t0); d <= t1; d++) { const iso = new Date(d * DAY).toISOString().slice(0, 10); if (iso.slice(8) === "01") months.push({ d, name: MON[+iso.slice(5, 7) - 1] }); }
    const panels = slots.map(s => {
      const closes = data ? data.closes.filter(c => isFinite(c[s.m])).map(c => ({ d: dnum(c.date), date: c.date, v: c[s.m] })) : [];
      const rows = data ? data.rows.filter(r => r.metal === s.m) : [];
      let lo = Infinity, hi = -Infinity;
      for (const c of closes) { lo = Math.min(lo, c.v); hi = Math.max(hi, c.v); }
      for (const r of rows) for (const v of r.levels) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.01 || 1; lo -= pad; hi += pad;
      const L = (x, y) => { const p = rotY(rotX([x, y, 0], s.pitch), s.yaw); return [p[0] + s.x, p[1] + s.y, p[2] + s.z]; };
      const Wp = (u, v) => L(lerp(-PW / 2 + 0.7, PW / 2 - 0.7, u), lerp(-PH / 2 + 1.0, PH / 2 - 1.35, v));
      const U = d => (d - t0) / (t1 - t0), V = v => (v - lo) / (hi - lo);
      const corners = [L(-PW / 2, -PH / 2), L(PW / 2, -PH / 2), L(PW / 2, PH / 2), L(-PW / 2, PH / 2)];
      const nodes = closes.map(c => ({ ...c, w: Wp(U(c.d), V(c.v)) }));
      const segs = [];
      for (const r of rows) for (const v of r.levels) segs.push({ r, a: Wp(U(dnum(r.date)), V(v)), b: Wp(U(dnum(fridayOf(r.date))), V(v)), col: r.hit ? P.pass : GRADE_COL[r.grade], open: r.grade === "pending", txt: r.levels.length > 1 ? fmtNum(v, v % 1 ? 2 : 0) : r.level });
      const grid = [0.2, 0.4, 0.6, 0.8].map(v => [Wp(0, v), Wp(1, v)]);
      const ticks = months.map(mo => ({ name: mo.name, a: Wp(U(mo.d), -0.03), b: Wp(U(mo.d), 0.0) }));
      return { ...s, closes, rows, nodes, segs, grid, ticks, corners, center: L(0, 0), title: L(-PW / 2 + 0.7, PH / 2 - 0.62), Wp, U, V,
        col: METALS[s.m].col, sel: s.m === sel, raw: data ? data.closes.filter(c => isFinite(c[s.m])) : [] };
    });
    const me = panels[1];
    let F = me.center;
    if (me.nodes.length >= 2) F = lerp3(me.nodes[me.nodes.length - 2].w, me.nodes[me.nodes.length - 1].w, 0.5);
    else if (me.nodes.length === 1) F = me.nodes[0].w;
    const dust = [];
    const nd = env.lite ? 220 : 480;
    for (let i = 0; i < nd; i++) dust.push([(hash(i, 1) - 0.5) * 170, (hash(i, 2) - 0.5) * 70, hash(i, 3) * 130 - 30, hash(i, 4)]);
    return (env.cache.rec = { panels, F, dust, tall, weeks: Math.round((t1 - t0 - 8) / 7) });
  }
  function recCamera(env, tau, p) {
    const g = recGeom(env), F = g.F;
    const a = sstep(0, 0.34, p);
    const drift = [Math.sin(tau * 0.13) * 2.0 * (1 - a), Math.sin(tau * 0.085) * 0.7 * (1 - a), Math.sin(tau * 0.05) * 1.2 * (1 - a)];
    /* wide: from above and to the left; tall: from the left, the stack set low enough to leave the title room;
       in between (a phone's 4:5), closer in on the middle panel, set low under the title */
    const mode = g.tall ? 0 : env.W / env.H < 1.05 ? 1 : 2;
    const P0 = add3([[-10.5, 4.2, -49], [-5.2, 5.4, -33], [-8.6, 7.6, -41]][mode], drift), T0 = [[0, 3.1, 3.2], [0, 1.6, 3.0], [0, 0.3, 4.5]][mode];
    const P1 = [[-2.2, 2.0, -39.5], [-1.8, 3.0, -27], [-2.6, 4.6, -31]][mode], T1 = [[0, 0.5, 1.5], [0, 0.4, 1.5], [0, 0, 1.5]][mode];
    let pos = lerp3(P0, P1, ease(a)), tgt = lerp3(T0, T1, ease(a));
    if (p > 0.34) {
      const q = ease(inv(0.34, 1, p));
      const d0 = [P1[0] - F[0], P1[1] - F[1], P1[2] - F[2]], dist0 = Math.hypot(d0[0], d0[1], d0[2]);
      const dir = norm3(lerp3(norm3(d0), norm3([0.05, 0.16, -1]), q)), dist = expLerp(dist0, 1.25, q);
      pos = add3(F, dir, dist); tgt = lerp3(T1, F, sstep(0, 0.6, q));
    }
    return camera(pos, tgt, 42, env.W, env.H);
  }
  const S_RECORD = {
    id: "record", dur: DUR.record, xin: 1,
    scale: (env, p) => { const g = recGeom(env); return { v: expLerp(Math.max(2, g.weeks) * 604800, 604800, sstep(0.34, 1, p)), kind: "t" }; },
    caps: env => WORDS.record(env.words), capAt: [0.28],
    draw(env, tau, p) {
      const { ctx, W, H } = env, g = recGeom(env), cam = recCamera(env, tau, p);
      /* dust in the depth, for the space the three panels hang in */
      ctx.fillStyle = P.ink5;
      for (const d of g.dust) {
        const s = cam.project(d); if (!s || s.x < -4 || s.x > W + 4 || s.y < -4 || s.y > H + 4) continue;
        const r = clamp(0.05 * s.s, 0.35, 2.4); ctx.globalAlpha = (0.1 + 0.35 * d[3]) * clamp(s.s / 25, 0.25, 1);
        ctx.fillRect(s.x - r / 2, s.y - r / 2, r, r);
      }
      const order = g.panels.map(pn => ({ pn, z: (cam.project(pn.center) || { z: 1e9 }).z })).sort((a, b) => b.z - a.z);
      for (const { pn } of order) {
        const cs = pn.corners.map(c => cam.project(c)); if (cs.some(c => !c)) continue;
        const sc = (cs[0].s + cs[1].s + cs[2].s + cs[3].s) / 4, dim = pn.sel ? 1 : 0.78;
        ctx.globalAlpha = 0.72; ctx.fillStyle = P.panel; ctx.beginPath(); cs.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y))); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.9; ctx.strokeStyle = pn.sel ? rgba(pn.col, 0.55) : P.rule; ctx.lineWidth = 1; ctx.stroke();
        for (const [a, b] of pn.grid) { const A = cam.project(a), B = cam.project(b); if (A && B) polyline(ctx, [[A.x, A.y], [B.x, B.y]], 1, P.soft, 0.55 * dim); }
        for (const tk of pn.ticks) { const A = cam.project(tk.a), B = cam.project(tk.b); if (!A || !B) continue; polyline(ctx, [[A.x, A.y], [B.x, B.y]], 1, P.rule, 0.9 * dim); label(ctx, tk.name, A.x + 3, A.y + clamp(0.25 * A.s, 5, 14) * tsz(env), clamp(0.3 * A.s, 7, 15) * tsz(env), P.ink6, 0.8 * dim, "left"); }
        const tl = cam.project(pn.title);
        if (tl) label(ctx, METALS[pn.m].Name, tl.x, tl.y, clamp(0.62 * tl.s, 9, 48), pn.sel ? pn.col : P.ink5, dim, "left", SERIF, 400);
        /* every level named: from the day it was named to the close that graded it, in the colour it was graded */
        for (const sg of pn.segs) {
          const A = cam.project(sg.a), B = cam.project(sg.b); if (!A || !B) continue;
          const lw = clamp(0.034 * (A.s + B.s) / 2, 0.8, 3.4), pulse = sg.open ? 0.72 + 0.28 * Math.sin(tau * 3.1) : 1;
          polyline(ctx, [[A.x, A.y], [B.x, B.y]], lw * 3.4, sg.col, 0.15 * dim * pulse);
          polyline(ctx, [[A.x, A.y], [B.x, B.y]], lw, sg.col, 0.95 * dim * pulse);
          if (sg.open) label(ctx, sg.txt, B.x + clamp(0.18 * B.s, 3, 12), B.y, clamp(0.3 * B.s, 7, 16) * tsz(env), sg.col, 0.95 * pulse, "left");
        }
        /* the weekly closes */
        const pts = pn.nodes.map(n => cam.project(n.w)).filter(Boolean).map(s => [s.x, s.y, s.s]);
        if (pts.length) {
          const lw = clamp(0.05 * pts[pts.length - 1][2], 1, 4.2), col = pn.sel ? pn.col : rgba(mix(pn.col, P.ground, 0.22), 1);
          polyline(ctx, pts, lw * 5.5, col, 0.08); polyline(ctx, pts, lw * 2.4, col, 0.25); polyline(ctx, pts, lw, col, 1);
          for (const s of pts) stamp(ctx, glow(pn.col), s[0], s[1], clamp(0.2 * s[2], 2.5, 16), pn.sel ? 0.95 : 0.7);
          const last = pts[pts.length - 1], raw = pn.raw[pn.raw.length - 1];
          if (raw) {
            /* the last close, written above its point so a line named near it stays clear */
            const fs = clamp(0.32 * last[2], 8, 20) * tsz(env);
            label(ctx, raw.s[pn.m], last[0] + fs * 0.45, last[1] - fs * 2.05, fs, P.ink, 0.95 * dim, "left");
            label(ctx, dShort(raw.date), last[0] + fs * 0.45, last[1] - fs * 0.95, fs * 0.72, P.ink6, 0.9 * dim, "left");
          }
        }
      }
      ctx.globalAlpha = 1;
    },
    focus(env) { const cam = recCamera(env, 0, 1), s = cam.project(recGeom(env).F); return s ? [s.x, s.y] : [env.W / 2, env.H / 2]; }
  };

  /* ---------------------------------------------------------------- 2 · ONE WEEK, folded into a candle */
  function weekData(env) {
    if (env.cache.week) return env.cache.week;
    const M = env.metal, data = env.data;
    const cl = data ? data.closes.filter(c => isFinite(c[M.key])) : [];
    let open = 100, close = 100.8;
    if (cl.length >= 2) { open = cl[cl.length - 2][M.key]; close = cl[cl.length - 1][M.key]; }
    else if (cl.length === 1) { open = close = cl[0][M.key]; }
    const N = 1440, r = rng(h32(Math.round(close * 1000)) ^ h32(M.Z * 7919));
    const w = new Float64Array(N + 1), sess = new Float64Array(N + 1);
    let vol = 1; sess[0] = 0.55;
    for (let i = 1; i <= N; i++) {
      const hr = (22 + (i * 5) / 60) % 24;  /* UTC; the week opens Sunday 22:00 UTC */
      const f = hr >= 21 && hr < 22 ? 0.12 : hr >= 22 || hr < 7 ? 0.55 : hr < 12 ? 1.0 : hr < 13.5 ? 1.2 : hr < 17 ? 1.4 : 0.75;
      vol = clamp(0.93 * vol + 0.07 * (0.5 + 0.95 * Math.abs(gauss(r))), 0.45, 2.4);
      sess[i] = f * vol;
      w[i] = w[i - 1] + gauss(r) * sess[i];
    }
    const b = new Float64Array(N + 1); let bl = Infinity, bh = -Infinity;
    for (let i = 0; i <= N; i++) { b[i] = w[i] - (w[N] * i) / N; bl = Math.min(bl, b[i]); bh = Math.max(bh, b[i]); }
    const k = (WEEK_RANGE[M.key] * open) / Math.max(1e-9, bh - bl);
    const path = new Float64Array(N + 1); let lo = Infinity, hi = -Infinity, iLo = 0, iHi = 0;
    for (let i = 0; i <= N; i++) { path[i] = open + ((close - open) * i) / N + b[i] * k; if (path[i] < lo) { lo = path[i]; iLo = i; } if (path[i] > hi) { hi = path[i]; iHi = i; } }
    return (env.cache.week = { N, path, sess, open, close, lo, hi, iLo, iHi });
  }
  function weekLayout(env) {
    const { W, H } = env, wk = weekData(env), portrait = W / H < 1.05, vid = env.video && !portrait;   /* a film's captions are larger: the chart sits higher */
    const px0 = W * (portrait ? 0.07 : 0.07), px1 = W * (portrait ? 0.66 : 0.64), cx = W * (portrait ? 0.83 : 0.8);
    const py0 = H * (portrait ? 0.2 : vid ? 0.15 : 0.17), py1 = H * (portrait ? 0.62 : vid ? 0.56 : 0.66);
    const R = wk.hi - wk.lo, lo = wk.lo - R * 0.1, hi = wk.hi + R * 0.1;
    return { px0, px1, cx, py0, py1, bw: Math.max(14, W * 0.05), X: i => px0 + (i / wk.N) * (px1 - px0), Y: v => py1 - ((v - lo) / (hi - lo)) * (py1 - py0) };
  }
  function drawCandle(ctx, L, O, Hh, Lo, C, a, env, labels) {
    if (a <= 0.01) return;
    const up = C >= O, col = up ? P.slate : P.copper, x = L.cx, bw = L.bw;
    const yO = L.Y(O), yC = L.Y(C), yH = L.Y(Hh), yL = L.Y(Lo), top = Math.min(yO, yC), bot = Math.max(yO, yC);
    polyline(ctx, [[x, yH], [x, yL]], 1.6, P.ink3, 0.9 * a);
    const g = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    g.addColorStop(0, rgba(mix(col, P.ground, 0.5), 1)); g.addColorStop(0.42, rgba(mix(col, P.ground, 0.08), 1)); g.addColorStop(1, rgba(mix(col, P.ground, 0.62), 1));
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - bw / 2, top, bw, Math.max(1.5, bot - top));
    ctx.globalAlpha = 0.35 * a; ctx.strokeStyle = rgba(mix(col, "#FFFFFF", 0.4), 1); ctx.lineWidth = 1; ctx.strokeRect(x - bw / 2 + 0.5, top + 0.5, bw - 1, Math.max(0.5, bot - top - 1));
    stamp(ctx, glow(col, true), x, (top + bot) / 2, bw * 2.2, 0.14 * a);
    if (labels > 0.01) {
      const fs = lbl(env), dx = bw / 2 + 10;
      label(ctx, WORDS.candle[0], x - dx, yO, fs, P.ink5, labels, "right");
      label(ctx, WORDS.candle[3], x + dx, yC, fs, P.ink5, labels, "left");
      label(ctx, WORDS.candle[1], x, yH - fs * 0.95, fs, P.ink5, labels, "center");
      label(ctx, WORDS.candle[2], x, yL + fs * 0.95, fs, P.ink5, labels, "center");
    }
  }
  const S_WEEK = {
    id: "week", dur: DUR.week, xin: 7,
    scale: () => ({ v: 604800, kind: "t" }),
    caps: env => WORDS.week(env.metal), capAt: [0.02, 0.5], foot: 0.02,
    draw(env, tau, p) {
      const { ctx, W, H, metal: M } = env, wk = weekData(env), L = weekLayout(env);
      const zk = 1 + 0.32 * ease(inv(0.8, 1.05, p)), fx = L.cx, fy = (L.Y(wk.open) + L.Y(wk.close)) / 2;
      ctx.save(); ctx.translate(fx, fy); ctx.scale(zk, zk); ctx.translate(-fx, -fy);
      /* the five trading days */
      const fs = lbl(env);
      for (let d = 0; d <= 5; d++) {
        const x = L.X(d * 288); polyline(ctx, [[x, L.py0 - 6], [x, L.py1 + 6]], 1, P.soft, 0.55 * sstep(0.02, 0.12, p));
        if (d < 5) label(ctx, WORDS.days[d], L.X(d * 288 + 144), L.py1 + fs * 1.9, fs, P.ink6, 0.9 * sstep(0.04, 0.14, p), "center");
      }
      /* the straight line the record draws between two closes */
      const sa = 1 - sstep(0.12, 0.46, p);
      polyline(ctx, [[L.X(0), L.Y(wk.open)], [L.X(wk.N), L.Y(wk.close)]], 2.6, M.col, 0.9 * sa);
      /* the path the week actually took, drawn as it happened */
      const rv = sstep(0.07, 0.62, p), head = Math.max(0, Math.min(wk.N, Math.floor(rv * wk.N)));
      if (head > 1) {
        const pts = []; for (let i = 0; i <= head; i++) pts.push([L.X(i), L.Y(wk.path[i])]);
        polyline(ctx, pts, 5, M.col, 0.12); polyline(ctx, pts, 1.5, mix(M.col, "#FFFFFF", 0.15), 0.95);
      }
      let O = wk.open, Hh = wk.open, Lo = wk.open, C = wk.open, iH = 0, iL = 0;
      for (let i = 0; i <= head; i++) { const v = wk.path[i]; if (v > Hh) { Hh = v; iH = i; } if (v < Lo) { Lo = v; iL = i; } C = v; }
      if (head > 0 && head < wk.N) stamp(ctx, glow(M.col), L.X(head), L.Y(C), 10, 0.95);
      /* the candle, built from the path so far */
      const ca = sstep(0.06, 0.14, p);
      if (ca > 0) {
        ctx.setLineDash([3, 5]);
        polyline(ctx, [[L.X(iH), L.Y(Hh)], [L.cx - L.bw / 2 - 5, L.Y(Hh)]], 1, P.ink5, 0.32 * ca);
        polyline(ctx, [[L.X(iL), L.Y(Lo)], [L.cx - L.bw / 2 - 5, L.Y(Lo)]], 1, P.ink5, 0.32 * ca);
        polyline(ctx, [[L.X(head), L.Y(C)], [L.cx - L.bw / 2 - 5, L.Y(C)]], 1, P.ink5, 0.22 * ca);
        ctx.setLineDash([]);
        drawCandle(ctx, L, O, Hh, Lo, C, ca, env, sstep(0.6, 0.7, p));
      }
      ctx.restore(); ctx.globalAlpha = 1;
    },
    focus(env) { const wk = weekData(env), L = weekLayout(env); return [L.cx, (L.Y(wk.open) + L.Y(wk.close)) / 2]; }
  };

  /* ---------------------------------------------------------------- 3 · THE TRADES inside the candle */
  function tapeModel(env) {
    if (env.cache.tape) return env.cache.tape;
    const wk = weekData(env), M = env.metal, dt = 300, T = 432000;
    let s2 = 0; for (let i = 1; i <= wk.N; i++) { const d = wk.path[i] - wk.path[i - 1]; s2 += d * d; }
    const sig5 = Math.sqrt(s2 / wk.N), hs = (M.tick * M.spreadTicks) / 2;
    const coarse = t => { const x = clamp(t / dt, 0, wk.N - 1e-9), i = Math.floor(x), f = x - i; return wk.path[i] + (wk.path[i + 1] - wk.path[i]) * f; };
    const sessAt = t => wk.sess[clamp(Math.floor(t / dt), 1, wk.N)];
    /* Brownian detail below five minutes: each halving of the time scale adds a layer 1/sqrt(2) as large */
    const mid = (t, minPer) => { let v = coarse(t), a = sig5 * 0.62, per = dt / 2; for (let k = 0; k < 19 && per >= minPer; k++) { v += a * vn1(t / per, 100 + k); a *= Math.SQRT1_2; per /= 2; } return v; };
    const nIn = b => { const L = 9 * sessAt(b + 0.5), u = hash(b, 11, 1); let k = 0, q = Math.exp(-L), s = q; while (u > s && k < 40) { k++; q *= L / k; s += q; } return k; };
    const trade = (b, j, n) => {
      const t = b + (j + 0.15 + 0.7 * hash(b, j, 3)) / n, m = mid(t, 0.02), slope = coarse(t + 90) - coarse(t - 90);
      const buy = hash(b, j, 5) < 0.5 + 0.3 * Math.tanh(slope / (sig5 * 0.6));
      return { t, px: Math.round((m + (buy ? hs : -hs)) / M.tick) * M.tick, buy, sz: Math.exp(0.75 * hgauss(b, j, 9)) };
    };
    /* one representative trade per bin of 2^L seconds, the same trade at every level, so no dot jumps as the view narrows */
    const rep = (L, k) => {
      if (k < 0 || k * Math.pow(2, L) >= T) return null;
      if (L === 0) { const n = nIn(k); return n ? trade(k, 0, n) : null; }
      const c = hash(L, k, 77) < 0.5 ? 0 : 1;
      return rep(L - 1, 2 * k + c) || rep(L - 1, 2 * k + 1 - c);
    };
    return (env.cache.tape = { T, sig5, hs, coarse, mid, nIn, trade, rep, wk, range: wk.hi - wk.lo, tf: T * 0.585 + 0.37 });
  }
  function tapeView(env, p) {
    const tm = tapeModel(env), { W, H } = env, T = tm.T, u = ease(inv(0.17, 0.97, p)), w = expLerp(T, 2, u);
    const vid = env.video && W / H >= 1.05, a = clamp(tm.tf - w / 2, 0, T - w), px0 = W * 0.06, px1 = W * 0.94, cy = H * (vid ? 0.37 : 0.43), hy = H * (vid ? 0.2 : 0.24);
    let s = 0; const n = 160; for (let i = 0; i <= n; i++) s += tm.mid(a + (w * i) / n, w / 400); const mean = s / (n + 1);
    const hh = Math.max(0.62 * tm.range * Math.sqrt(w / T), 2.6 * tm.hs + env.metal.tick * 0.6);
    return { tm, u, w, a, px0, px1, cy, hy, X: t => px0 + ((t - a) / w) * (px1 - px0), Y: v => cy - ((v - mean) / hh) * hy, Yinv: y => mean + ((cy - y) / hy) * hh };
  }
  function eachTrade(env, V, fn) {
    const tm = V.tm, Mx = env.lite ? 520 : 1100, x = Math.log2(V.w / Mx);
    if (x > 0) {
      const L = Math.ceil(x), fine = L - 1, bw = Math.pow(2, fine), extra = clamp(L - x, 0, 1);
      const k0 = Math.floor(V.a / bw), k1 = Math.floor((V.a + V.w) / bw);
      for (let k = k0; k <= k1; k++) {
        const tr = tm.rep(fine, k); if (!tr) continue;
        const c = hash(L, k >> 1, 77) < 0.5 ? 0 : 1, base = (k & 1) === c || !tm.rep(fine, k ^ 1);
        fn(tr, base ? 1 : extra);
      }
    } else {
      const extra = sstep(90, 40, V.w), b0 = Math.floor(V.a), b1 = Math.floor(V.a + V.w);
      for (let b = b0; b <= b1; b++) {
        const n = tm.nIn(b);
        for (let j = 0; j < n; j++) { if (j > 0 && extra <= 0.01) break; const tr = tm.trade(b, j, n); if (tr.t < V.a || tr.t > V.a + V.w) continue; fn(tr, j === 0 ? 1 : extra); }
      }
    }
  }
  const S_TRADES = {
    id: "trades", dur: DUR.trades, xin: 4,
    scale: (env, p) => ({ v: tapeView(env, p).w, kind: "t" }),
    caps: () => WORDS.trades(), capAt: [0.02, 0.5], foot: 1,
    draw(env, tau, p) {
      const { ctx, W, metal: M } = env, V = tapeView(env, p), tm = V.tm, wk = tm.wk;
      const unfold = ease(inv(0.0, 0.16, p)), Lw = weekLayout(env);
      /* the mid-price, faint, under the trades */
      const pts = [], n = 360;
      for (let i = 0; i <= n; i++) { const t = V.a + (V.w * i) / n; pts.push([lerp(Lw.cx, V.X(t), unfold), V.Y(tm.mid(t, V.w / 700))]); }
      polyline(ctx, pts, 1, P.ink, 0.2 * unfold + 0.05);
      /* the candle opening into its trades */
      if (unfold < 1) {
        const La = { ...Lw, Y: V.Y };
        drawCandle(ctx, La, wk.open, wk.hi, wk.lo, wk.close, 1 - unfold, env, 0);
      }
      /* at a few seconds wide the price shows its steps: one tick apart */
      const ga = sstep(90, 20, V.w);
      if (ga > 0.01) {
        const M = env.metal, top = V.cy - V.hy * 1.25, bot = V.cy + V.hy * 1.25;
        const lo = Math.floor(Math.min(V.Yinv(bot), V.Yinv(top)) / M.tick), hi = Math.ceil(Math.max(V.Yinv(bot), V.Yinv(top)) / M.tick);
        if (hi - lo < 60) for (let k = lo; k <= hi; k++) { const y = V.Y(k * M.tick); polyline(ctx, [[V.px0, y], [V.px1, y]], 1, P.soft, 0.5 * ga); }
      }
      const dot = lerp(1.25, 5.2, V.u) * (env.lite ? 0.9 : 1);
      ctx.globalCompositeOperation = "lighter";
      eachTrade(env, V, (tr, al) => {
        const x = lerp(Lw.cx, V.X(tr.t), unfold), y = V.Y(tr.px);
        if (x < -10 || x > W + 10) return;
        stamp(ctx, glow(tr.buy ? P.slate : P.copper), x, y, 2.6 * dot * Math.sqrt(tr.sz), al * 0.95);
      });
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    },
    focus(env) {
      const V = tapeView(env, 1); let best = null, bd = Infinity;
      eachTrade(env, V, tr => { if (!tr.buy) return; const d = Math.abs(tr.t - V.tm.tf); if (d < bd) { bd = d; best = tr; } });
      return best ? [V.X(best.t), V.Y(best.px)] : [env.W / 2, V.cy];
    }
  };

  /* ---------------------------------------------------------------- 4 · THE ORDERS behind the trades */
  function bookModel(env) {
    if (env.cache.book) return env.cache.book;
    const r = rng(20260924 + env.metal.Z * 131), D = DUR.orders;
    let id = 1;
    const qsz = () => Math.max(1, Math.round(Math.exp(0.55 * gauss(r)) * 3));
    const A = new Map(), B = new Map();
    for (let L = 1; L <= 12; L++) A.set(L, Array.from({ length: 2 + Math.floor(r() * 4) + Math.min(3, L - 1) }, () => ({ id: id++, q: qsz() })));
    for (let L = 0; L >= -11; L--) B.set(L, Array.from({ length: 2 + Math.floor(r() * 4) + Math.min(3, -L) }, () => ({ id: id++, q: qsz() })));
    const snap = m => new Map([...m].map(([L, q]) => [L, q.map(o => ({ ...o }))]));
    const initA = snap(A), initB = snap(B);
    const bestA = () => { let b = Infinity; for (const [L, q] of A) if (q.length && L < b) b = L; return b; };
    const bestB = () => { let b = -Infinity; for (const [L, q] of B) if (q.length && L > b) b = L; return b; };
    const ev = [];
    const add = (t, side, L, q) => { const m = side === "a" ? A : B; if (!m.has(L)) m.set(L, []); const o = { id: id++, q }; m.get(L).push(o); ev.push({ t, type: "add", side, L, id: o.id, q }); };
    const mkt = (t, side, size) => {
      const m = side === "buy" ? A : B, fills = []; let rem = size;
      while (rem > 0) {
        const L = side === "buy" ? bestA() : bestB(); if (!isFinite(L)) break;
        const q = m.get(L), o = q[0], f = Math.min(o.q, rem);
        o.q -= f; rem -= f; fills.push({ L, id: o.id, f, full: o.q === 0 });
        if (o.q === 0) q.shift();
      }
      if (fills.length) ev.push({ t, type: "mkt", side, fills });
    };
    const cancel = t => {
      const pool = [];
      for (const [L, q] of A) q.forEach((o, i) => { if (!(L === bestA() && q.length < 2)) pool.push(["a", L, o.id]); });
      for (const [L, q] of B) q.forEach((o, i) => { if (!(L === bestB() && q.length < 2)) pool.push(["b", L, o.id]); });
      if (!pool.length) return;
      const [side, L, oid] = pool[Math.floor(r() * pool.length)], q = (side === "a" ? A : B).get(L), i = q.findIndex(o => o.id === oid);
      q.splice(i, 1); ev.push({ t, type: "cancel", side, L, id: oid });
    };
    const script = [[3.0, "buy"], [6.1, "buy"], [8.6, "sell"]];
    let t = 0.5, si = 0;
    while (t < D - 0.9) {
      t += 0.06 + r() * 0.1;
      if (si < script.length && t >= script[si][0]) {
        const [, side] = script[si++];
        const m = side === "buy" ? A : B, L = side === "buy" ? bestA() : bestB(), tot = m.get(L).reduce((s, o) => s + o.q, 0);
        mkt(t, side, tot + 1);
        const tt = t + 0.55; t = tt;
        if (bestA() - bestB() > 1) add(tt, side === "buy" ? "b" : "a", side === "buy" ? bestB() + 1 : bestA() - 1, qsz());
        continue;
      }
      const x = r();
      if (x < 0.44) {
        const side = r() < 0.5 ? "a" : "b", d = Math.floor(-Math.log(Math.max(1e-6, r())) * 1.3);
        let L = side === "a" ? bestA() + d : bestB() - d;
        if (bestA() - bestB() > 1 && r() < 0.5) L = side === "a" ? bestA() - 1 : bestB() + 1;
        add(t, side, L, qsz());
      } else if (x < 0.68) cancel(t);
      else mkt(t, x < 0.85 ? "buy" : "sell", Math.max(1, Math.round(Math.exp(0.5 * gauss(r)) * 2)));
    }
    return (env.cache.book = { initA, initB, ev });
  }
  /* the book as it stands at tau, with what each order is doing */
  function bookAt(bm, tau) {
    const E = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const mk = m => new Map([...m].map(([L, q]) => [L, q.map((o, i) => ({ ...o, idx: i, from: i, moved: -9, born: -9 }))]));
    const A = mk(bm.initA), B = mk(bm.initB), ghosts = [], shots = [], flashes = [];
    const disp = (o, t) => lerp(o.from, o.idx, E((t - o.moved) / 0.32));
    const reindex = (q, t) => q.forEach((o, i) => { if (o.idx !== i) { o.from = disp(o, t); o.idx = i; o.moved = t; } });
    let lastL = null, midPrev = 0.5, midNow = 0.5, midT = -9;
    const best = () => { let a = Infinity, b = -Infinity; for (const [L, q] of A) if (q.length && L < a) a = L; for (const [L, q] of B) if (q.length && L > b) b = L; return [a, b]; };
    const setMid = t => { const [a, b] = best(); const m = (a + b) / 2; if (isFinite(m) && m !== midNow) { midPrev = lerp(midPrev, midNow, E((t - midT) / 0.5)); midNow = m; midT = t; } };
    for (const e of bm.ev) {
      if (e.type === "mkt") {
        e.fills.forEach((f, i) => {
          const tf = e.t + i * 0.13;
          flashes.push({ L: f.L, side: e.side, t: tf });
          if (tf > tau) return;
          const m = e.side === "buy" ? A : B, q = m.get(f.L), k = q ? q.findIndex(o => o.id === f.id) : -1;
          if (k < 0) return;
          q[k].q -= f.f; lastL = f.L;
          if (f.full) { const o = q.splice(k, 1)[0]; ghosts.push({ side: e.side === "buy" ? "a" : "b", L: f.L, x: disp(o, tf), q: f.f, t: tf, kind: "fill", id: o.id }); reindex(q, tf); }
          setMid(tf);
        });
        shots.push(e);
        continue;
      }
      if (e.t > tau) continue;
      const m = e.side === "a" ? A : B;
      if (e.type === "add") { if (!m.has(e.L)) m.set(e.L, []); const q = m.get(e.L); q.push({ id: e.id, q: e.q, idx: q.length, from: q.length, moved: -9, born: e.t }); setMid(e.t); }
      else if (e.type === "cancel") { const q = m.get(e.L), k = q ? q.findIndex(o => o.id === e.id) : -1; if (k >= 0) { const o = q.splice(k, 1)[0]; ghosts.push({ side: e.side, L: e.L, x: disp(o, e.t), q: o.q, t: e.t, kind: "cancel", id: o.id }); reindex(q, e.t); setMid(e.t); } }
    }
    const mid = lerp(midPrev, midNow, E((tau - midT) / 0.5));
    return { A, B, ghosts, shots, flashes, lastL, mid, disp, best: best() };
  }
  function bookLayout(env) {
    const { W, H } = env, portrait = W / H < 1.05, vid = env.video && !portrait;
    const rowH = clamp(H * (portrait ? 0.05 : vid ? 0.056 : 0.066), 14, 72), cell = clamp(Math.min(rowH * 1.08, W * 0.052), 12, 76);
    return { cx: W / 2, cy: H * (portrait ? 0.4 : vid ? 0.35 : 0.4), rowH, cell, gap: cell * 0.8, top: H * (vid ? 0.08 : 0.1), bot: H * (portrait ? 0.68 : vid ? 0.6 : 0.7) };
  }
  const S_ORDERS = {
    id: "orders", dur: DUR.orders, xin: 7,
    scale: () => ({ v: 0.001, kind: "t" }),
    caps: () => WORDS.orders(), capAt: [0.02, 0.5], foot: 1,
    draw(env, tau, p) {
      const { ctx, W, H } = env, bm = bookModel(env), s = bookAt(bm, tau), Lo = bookLayout(env);
      const { cx, cy, rowH, cell, gap } = Lo, Y = L => cy - (L - s.mid) * rowH, fs = lbl(env), vis = y => y > Lo.top - rowH * 0.3 && y < Lo.bot + rowH * 0.3;
      const edge = y => sstep(Lo.top - rowH * 0.3, Lo.top + rowH * 1.2, y) * (1 - sstep(Lo.bot - rowH * 1.2, Lo.bot + rowH * 0.3, y));   /* rows far from the price fade out */
      const fin = sstep(0, 0.1, p);
      /* the rows */
      for (let L = Math.floor(s.mid) - 9; L <= Math.ceil(s.mid) + 9; L++) {
        const y = Y(L); if (!vis(y)) continue;
        const bestRow = L === s.best[0] || L === s.best[1];
        polyline(ctx, [[W * 0.03, y], [W * 0.97, y]], 1, bestRow ? P.rule : P.soft, (bestRow ? 0.55 : 0.28) * fin * edge(y));
        polyline(ctx, [[cx - 5, y], [cx + 5, y]], 1, P.ink5, 0.7 * fin);
      }
      polyline(ctx, [[cx, Lo.top - rowH * 0.5], [cx, Lo.bot + rowH * 0.5]], 1, P.rule, 0.9 * fin);
      /* the gap between the best bid and the best offer */
      if (isFinite(s.best[0]) && isFinite(s.best[1])) {
        const ya = Y(s.best[0]), yb = Y(s.best[1]);
        const g = ctx.createLinearGradient(0, ya, 0, yb); g.addColorStop(0, rgba(P.copper, 0.1)); g.addColorStop(0.5, rgba(P.gold, 0.06)); g.addColorStop(1, rgba(P.slate, 0.1));
        ctx.globalAlpha = fin; ctx.fillStyle = g; ctx.fillRect(cx - gap * 0.8, ya + rowH * 0.35, gap * 1.6, yb - ya - rowH * 0.7);
      }
      const lx = Math.min(W * 0.34, gap + cell * 8.6);
      /* the two sides named, kept inside the book as the price moves */
      if (isFinite(s.best[1])) label(ctx, WORDS.book[0], cx - lx, Math.min(Lo.bot - fs, Y(s.best[1]) + rowH * 2.5), fs, P.slate, 0.95 * fin, "right", MONO, 600, 2);
      if (isFinite(s.best[0])) label(ctx, WORDS.book[1], cx + lx, Math.max(Lo.top + fs * 1.5, H * 0.2, Y(s.best[0]) - rowH * 2.5), fs, P.copper, 0.95 * fin, "left", MONO, 600, 2);   /* clear of the scale in the corner */
      label(ctx, WORDS.book[2], cx, Lo.top - rowH * 0.95, fs, P.ink5, 0.95 * fin, "center", MONO, 600, 2);
      /* resting orders, as atoms in their queues */
      const draw = (m, side) => {
        const spr = ball(side === "a" ? P.copper : P.slate, 0.1);
        for (const [L, q] of m) {
          const y0 = Y(L); if (!vis(y0)) continue;
          for (const o of q) {
            const i = s.disp(o, tau), age = tau - o.born;
            let x = side === "a" ? cx + gap + (i + 0.5) * cell : cx - gap - (i + 0.5) * cell;
            if (x < -cell || x > W + cell) continue;
            let a = fin * edge(y0);
            if (age < 0.5) { const e = easeOut(clamp(age / 0.5, 0, 1)); x = lerp(side === "a" ? W + cell : -cell, x, e); a *= clamp(age / 0.25, 0, 1); }
            const y = y0 + rowH * 0.07 * SN.n2(o.id * 0.71, tau * 1.7), rr = cell * clamp(0.3 * Math.cbrt(o.q / 3), 0.2, 0.47);
            stamp(ctx, glow(side === "a" ? P.copper : P.slate, true), x, y, rr * 2.6, 0.22 * a);
            stamp(ctx, spr, x, y, rr, a);
          }
        }
      };
      draw(s.B, "b"); draw(s.A, "a");
      /* what left the book: filled orders burst, cancelled ones fade out */
      ctx.globalCompositeOperation = "lighter";
      for (const g of s.ghosts) {
        const age = tau - g.t; if (age > 0.6 || age < 0) continue;
        const x0 = g.side === "a" ? cx + gap + (g.x + 0.5) * cell : cx - gap - (g.x + 0.5) * cell, y0 = Y(g.L), col = g.side === "a" ? P.copper : P.slate;
        if (g.kind === "fill") for (let k = 0; k < 8; k++) { const an = TAU * hash(g.id, k, 1), d = cell * 2.4 * easeOut(age / 0.6) * (0.4 + hash(g.id, k, 2)); stamp(ctx, glow(col), x0 + Math.cos(an) * d, y0 + Math.sin(an) * d, cell * 0.2, 0.9 * (1 - age / 0.6)); }
        else stamp(ctx, glow(col, true), x0 + (g.side === "a" ? 1 : -1) * cell * 1.5 * age, y0, cell * 0.6, 0.6 * (1 - age / 0.6));
      }
      /* the orders that cross the gap, and the trades they make */
      for (const e of s.shots) {
        const t0 = e.t - 0.55, tl = e.t + (e.fills.length - 1) * 0.13;
        if (tau < t0 || tau > tl + 0.08) continue;
        const buy = e.side === "buy", col = buy ? P.slate : P.copper;
        const front = L => [buy ? cx + gap + 0.5 * cell : cx - gap - 0.5 * cell, Y(L)];
        const pos = t => {
          if (t <= e.t) { const k = easeOut(clamp((t - t0) / 0.55, 0, 1)), f = front(e.fills[0].L); return [lerp(buy ? -cell : W + cell, f[0], k), f[1]]; }
          const i = Math.min(e.fills.length - 1, Math.floor((t - e.t) / 0.13)), j = Math.min(e.fills.length - 1, i + 1), k = clamp((t - e.t) / 0.13 - i, 0, 1);
          const a = front(e.fills[i].L), b = front(e.fills[j].L); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
        };
        const pnow = pos(tau), pold = pos(tau - 0.07);
        polyline(ctx, [pold, pnow], cell * 0.16, col, 0.55); stamp(ctx, glow(col), pnow[0], pnow[1], cell * 0.55, 0.95);
      }
      for (const f of s.flashes) {
        const age = tau - f.t; if (age < 0 || age > 0.6) continue;
        const e = age / 0.6, x = f.side === "buy" ? cx + gap + 0.5 * cell : cx - gap - 0.5 * cell, y = Y(f.L);
        stamp(ctx, glow(P.gold), x, y, cell * (0.7 + 2.6 * e), 0.95 * (1 - e));
        ctx.globalAlpha = 0.7 * (1 - e); ctx.strokeStyle = P.goldHi; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, cell * (0.35 + 2 * e), 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      /* the last trade on the price axis */
      if (s.lastL !== null && !QUIET) {
        const y = Y(s.lastL); ctx.globalAlpha = fin; ctx.fillStyle = P.gold;
        ctx.beginPath(); ctx.moveTo(cx, y - 6); ctx.lineTo(cx + 6, y); ctx.lineTo(cx, y + 6); ctx.lineTo(cx - 6, y); ctx.closePath(); ctx.fill();
        label(ctx, WORDS.book[3], cx - 12, y - rowH * 0.5, fs * 0.9, P.gold, 0.9 * fin, "right");
      }
      ctx.globalAlpha = 1;
    },
    focus(env) {
      const bm = bookModel(env), tau = DUR.orders, s = bookAt(bm, tau), Lo = bookLayout(env);
      let f = null; for (const x of s.flashes) if (x.t <= tau && (!f || x.t > f.t)) f = x;
      if (!f) return [Lo.cx, Lo.cy];
      return [f.side === "buy" ? Lo.cx + Lo.gap + 0.5 * Lo.cell : Lo.cx - Lo.gap - 0.5 * Lo.cell, Lo.cy - (f.L - s.mid) * Lo.rowH];
    }
  };

  /* =====================================================================
     BEHIND THE ORDERS · scales 5 to 8: the people, the machines, the match, the metal
     ===================================================================== */
  /* a camera that keeps at least hmin degrees across on a tall screen */
  function camFit(pos, tgt, vfov, hmin, W, H, cy) {
    const need = (2 * Math.atan(Math.tan((hmin * Math.PI) / 360) * (H / W)) * 180) / Math.PI;
    return camera(pos, tgt, Math.max(vfov, need), W, H, cy);
  }
  /* distance a thing has travelled under a clock that slows: a table of the running sum, read by interpolation */
  function runningSum(fn, t0, t1, n) {
    const S = new Float64Array(n + 1), dt = (t1 - t0) / n;
    for (let i = 1; i <= n; i++) S[i] = S[i - 1] + fn(t0 + (i - 0.5) * dt) * dt;
    return t => { const x = clamp((t - t0) / dt, 0, n - 1e-9), i = Math.floor(x); return S[i] + (S[i + 1] - S[i]) * (x - i); };
  }

  /* ---------------------------------------------------------------- 5 · THE FLOOR, people buying and selling */
  const PIT_R = [2.2, 3.4, 4.6, 5.8, 7.0], PIT_H = [0, 0.3, 0.6, 0.9, 1.2];
  const octa = (r, y) => Array.from({ length: 8 }, (_, j) => { const a = ((j + 0.5) * TAU) / 8; return [Math.cos(a) * r, y, Math.sin(a) * r]; });
  const octR = (r, a) => { const s = TAU / 8, d = ((((a % s) + s) % s) + s / 2) % s - s / 2; return (r * Math.cos(s / 2)) / Math.cos(d); };   /* the octagon's edge along angle a */
  function pitGeom(env) {
    if (env.cache.pit) return env.cache.pit;
    const r = rng(19741231), D = DUR.floor, people = [];
    for (let k = 1; k < PIT_R.length; k++) {
      const rr = (PIT_R[k - 1] + PIT_R[k]) / 2, n = Math.round((TAU * rr) / (env.lite ? 0.92 : 0.68));
      for (let i = 0; i < n; i++) {
        const a = ((i + 0.25 + 0.5 * r()) / n) * TAU + k * 0.41, jr = octR(rr, a) + (r() - 0.5) * 0.3;
        people.push({ x: Math.cos(a) * jr, z: Math.sin(a) * jr, y: PIT_H[k], tone: r(), tall: 1.6 + 0.16 * r(), ph: r() * TAU, sig: [] });
      }
    }
    for (let i = 0; i < 6; i++) { const a = r() * TAU, jr = 0.7 + r() * 1.1; people.push({ x: Math.cos(a) * jr, z: Math.sin(a) * jr, y: 0, tone: r(), tall: 1.6 + 0.16 * r(), ph: r() * TAU, sig: [] }); }
    /* each bids or offers now and then: palms in to buy (+1), palms out to sell (-1) */
    for (const q of people) { let t = -4 * r(); while (t < D + 1) { t += 0.6 + 3.4 * -Math.log(Math.max(1e-6, r())); const len = 0.6 + 1.5 * r(); q.sig.push({ t0: t, t1: t + len, side: r() < 0.5 ? 1 : -1 }); t += len; } }
    /* the last trade, across the well toward the camera: the next scale opens out of it */
    let fb = 0, fs = 0, db = 1e9, ds = 1e9;
    people.forEach((q, i) => { const eb = Math.hypot(q.x - 0.5, q.z + 4.1), es = Math.hypot(q.x + 0.8, q.z - 4.0); if (eb < db) { db = eb; fb = i; } if (es < ds) { ds = es; fs = i; } });
    const tf = D - 0.42;
    for (const i of [fb, fs]) people[i].sig = people[i].sig.filter(g => g.t1 < tf - 2.2 || g.t0 > tf + 0.6);
    people[fb].sig.push({ t0: tf - 1.7, t1: tf + 0.2, side: 1 }); people[fs].sig.push({ t0: tf - 1.4, t1: tf + 0.2, side: -1 });
    const active = (q, t, side) => { let s = 0, best = -1e9; for (const g of q.sig) if (t >= g.t0 && t <= g.t1 && g.t0 > best) { best = g.t0; s = g.side; } return s === side && t - best > 0.25; };
    const trades = [], busy = new Float64Array(people.length).fill(-9);
    busy[fb] = busy[fs] = 1e9;
    for (let t = 0.3; t < D - 0.8; t += 0.02) {
      if (r() > lerp(2, 4.6, sstep(0.05, 0.7, t / D)) * 0.02) continue;
      const B = [], S = [];
      people.forEach((q, i) => { if (Math.abs(t - busy[i]) < 0.9) return; if (active(q, t, 1)) B.push(i); else if (active(q, t, -1)) S.push(i); });
      if (!B.length || !S.length) continue;
      const b = B[Math.floor(r() * B.length)];
      let s = S[0], far = -1;
      for (let k = 0; k < 4; k++) { const c = S[Math.floor(r() * S.length)], d = Math.hypot(people[c].x - people[b].x, people[c].z - people[b].z); if (d > far) { far = d; s = c; } }
      trades.push({ t, b, s }); busy[b] = busy[s] = t;
      for (const i of [b, s]) for (const g of people[i].sig) if (t >= g.t0 && t <= g.t1) g.t1 = t + 0.2;
    }
    const last = { t: tf, b: fb, s: fs, last: true }; trades.push(last);
    return (env.cache.pit = { people, trades, last });
  }
  /* how far a person's hands are up, and for which side */
  function pitSig(q, t) {
    let v = 0, side = 0, best = -1e9;
    for (const g of q.sig) { if (t < g.t0 || t > g.t1 + 0.3) continue; const a = sstep(g.t0, g.t0 + 0.16, t) * (1 - sstep(g.t1, g.t1 + 0.3, t)); if (a > 0.01 && g.t0 > best) { best = g.t0; v = a; side = g.side; } }
    return [v, side];
  }
  /* hands and shoulders in the pit, a person facing the well */
  function pitBody(q, v, tau) {
    const dl = Math.hypot(q.x, q.z) || 1, fx = -q.x / dl, fz = -q.z / dl, lx = -fz, lz = fx;
    const sh = q.y + q.tall - 0.24, bob = 0.035 * Math.sin(tau * 7.5 + q.ph) * v;
    const up = lerp(-0.52, 0.44, v) + bob, fwd = lerp(0.04, 0.15, v), spread = lerp(0.19, 0.27, v);
    return { hL: [q.x + lx * spread + fx * fwd, sh + up, q.z + lz * spread + fz * fwd], hR: [q.x - lx * spread + fx * fwd, sh + up, q.z - lz * spread + fz * fwd],
      sL: [q.x + lx * 0.2, sh, q.z + lz * 0.2], sR: [q.x - lx * 0.2, sh, q.z - lz * 0.2], wL: [q.x + lx * 0.15 - fx * 0.03, sh - 0.62, q.z + lz * 0.15 - fz * 0.03], wR: [q.x - lx * 0.15 - fx * 0.03, sh - 0.62, q.z - lz * 0.15 - fz * 0.03],
      head: [q.x + fx * 0.02, q.y + q.tall - 0.07, q.z + fz * 0.02] };
  }
  function pitArc(g, tr) {
    const B = pitBody(g.people[tr.b], 1, tr.t).hL, S = pitBody(g.people[tr.s], 1, tr.t).hR, d = Math.hypot(S[0] - B[0], S[2] - B[2]);
    const C = [(B[0] + S[0]) / 2, Math.max(B[1], S[1]) + 1.0 + 0.16 * d, (B[2] + S[2]) / 2];
    return { B, S, C, at: u => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * B[0] + b * C[0] + c * S[0], a * B[1] + b * C[1] + c * S[1], a * B[2] + b * C[2] + c * S[2]]; } };
  }
  function pitCamera(env, tau, p) {
    const g = pitGeom(env), F = pitArc(g, g.last).at(0.5), e = ease(clamp(p, 0, 1));
    const tall = env.W / env.H < 1.05, az = lerp(-0.7, -0.12, e) + 0.025 * Math.sin(tau * 0.31), el = lerp(0.74, 0.5, e), dist = expLerp(tall ? 13.5 : 18.5, tall ? 6.8 : 7.6, e);
    const tgt = lerp3([0, 0.8, 0.4], F, sstep(0.3, 1, p));
    const pos = [tgt[0] + Math.sin(az) * Math.cos(el) * dist, tgt[1] + Math.sin(el) * dist, tgt[2] - Math.cos(az) * Math.cos(el) * dist];
    return camFit(pos, tgt, 44, 62, env.W, env.H, env.cy);
  }
  const S_FLOOR = {
    id: "floor", dur: DUR.floor, xin: 7,
    scale: () => ({ v: 1, kind: "t" }),
    caps: env => WORDS.floor[env.key], capAt: [0.02, 0.5],
    draw(env, tau, p) {
      const { ctx, W, H } = env, g = pitGeom(env), cam = pitCamera(env, tau, p), fin = sstep(0, 0.08, p);
      /* the floor round the pit, and the light over it */
      const lit = cam.project([0, 0, 0]);
      if (lit) stamp(ctx, glow(P.gold, true), lit.x, lit.y, lit.s * 11, 0.16 * fin);
      /* the steps: an octagon for each, the risers that face us, lowest first */
      const poly = (pts, fill, a, stroke) => { const s = pts.map(q => cam.project(q)); if (s.some(v => !v)) return; ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); s.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } };
      const outer = octa(11, PIT_H[4]);
      poly(outer, P.ground, fin, null);
      for (let k = 0; k < PIT_R.length; k++) {
        const top = octa(PIT_R[k], PIT_H[k]);
        if (k > 0) {
          const low = octa(PIT_R[k - 1], PIT_H[k - 1]), hi = octa(PIT_R[k - 1], PIT_H[k]);
          for (let j = 0; j < 8; j++) {   /* the riser under this step, where it faces the camera */
            const a = low[j], b = low[(j + 1) % 8], mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
            if ((cam.pos[0] - mx) * -mx + (cam.pos[2] - mz) * -mz <= 0) continue;
            poly([a, b, hi[(j + 1) % 8], hi[j]], rgba(mix(P.panel, P.rule, 0.5), 1), 0.95 * fin, null);
          }
        }
        /* the step itself, a ring */
        const inner = k > 0 ? octa(PIT_R[k - 1], PIT_H[k]) : null, ring = octa(PIT_R[k], PIT_H[k]);
        const so = ring.map(q => cam.project(q)), si = inner ? inner.map(q => cam.project(q)) : null;
        if (so.some(v => !v) || (si && si.some(v => !v))) continue;
        ctx.globalAlpha = fin; ctx.fillStyle = rgba(mix(P.ground, P.panel, 0.55 + 0.1 * k), 1); ctx.beginPath();
        so.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath();
        if (si) { ctx.moveTo(si[0].x, si[0].y); for (let i = 7; i >= 0; i--) ctx.lineTo(si[i].x, si[i].y); ctx.closePath(); }
        ctx.fill("evenodd");
        ctx.globalAlpha = 0.8 * fin; ctx.strokeStyle = rgba(mix(P.rule, P.ink6, 0.3), 1); ctx.lineWidth = 1; ctx.beginPath(); so.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.stroke();
      }
      /* the people, far to near */
      const list = [];
      g.people.forEach((q, i) => { const s = cam.project([q.x, q.y + 1.2, q.z]); if (s && s.x > -80 && s.x < W + 80 && s.y > -80 && s.y < H + 80) list.push({ q, i, z: s.z }); });
      list.sort((a, b) => b.z - a.z);
      const flash = new Map();
      for (const tr of g.trades) { const age = tau - tr.t; if (age >= -0.05 && age < 0.45) { const f = 1 - sstep(0.1, 0.45, age); flash.set(tr.b, f); flash.set(tr.s, f); } }
      const headSpr = ball("#8A7F72", 0.06);
      for (const { q, i } of list) {
        const [v, side] = pitSig(q, tau), bd = pitBody(q, v, tau);
        const sL = cam.project(bd.sL), sR = cam.project(bd.sR), wL = cam.project(bd.wL), wR = cam.project(bd.wR), hd = cam.project(bd.head);
        if (!sL || !sR || !wL || !wR || !hd) continue;
        const s = hd.s, dim = clamp(1.25 - hd.z / 26, 0.35, 1) * fin, jacket = rgba(mix("#16130F", "#352F28", q.tone), 1);
        /* a body: the back, then the shoulders as one rounded line, lit a little along the top */
        const mx = (sL.x + sR.x) / 2, my = (sL.y + sR.y) / 2, rx = Math.hypot(sR.x - sL.x, sR.y - sL.y) / 2 + 0.07 * s, ang = Math.atan2(sR.y - sL.y, sR.x - sL.x);
        ctx.globalAlpha = dim; ctx.fillStyle = jacket;
        ctx.beginPath(); ctx.moveTo(sL.x, sL.y); ctx.lineTo(sR.x, sR.y); ctx.lineTo(wR.x, wR.y); ctx.lineTo(wL.x, wL.y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx, my, rx, Math.max(1, rx * 0.42), ang, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.22 * dim; ctx.strokeStyle = P.ink5; ctx.lineWidth = Math.max(0.6, 0.02 * s); ctx.beginPath(); ctx.ellipse(mx, my, rx, Math.max(1, rx * 0.42), ang, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        const fl = flash.get(i) || 0, col = fl > 0.01 ? P.goldHi : side > 0 ? P.slate : P.copper;
        if (v > 0.03) {
          ctx.lineCap = "round";
          for (const [sh, hh] of [[sL, cam.project(bd.hL)], [sR, cam.project(bd.hR)]]) {
            if (!hh) continue;
            ctx.globalAlpha = dim; ctx.strokeStyle = jacket; ctx.lineWidth = Math.max(1, 0.085 * s); ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(hh.x, hh.y); ctx.stroke();
            ctx.globalCompositeOperation = "lighter";
            stamp(ctx, glow(col), hh.x, hh.y, Math.max(2, 0.16 * s) * (0.7 + 0.5 * v + fl), (0.35 + 0.6 * v) * dim);
            stamp(ctx, glow(col, true), hh.x, hh.y, Math.max(4, 0.5 * s), 0.3 * v * dim);
            ctx.globalCompositeOperation = "source-over";
          }
        }
        stamp(ctx, headSpr, hd.x, hd.y, Math.max(1.2, 0.108 * s), dim);
      }
      /* every trade an arc of light, from both hands to the middle, where the price is agreed */
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (const tr of g.trades) {
        const age = tau - tr.t; if (age < 0 || age > 1.0) continue;
        const arc = pitArc(g, tr), grow = sstep(0, 0.24, age), fade = (1 - sstep(0.4, 1.0, age)) * fin, n = 26;
        const pts = []; for (let k = 0; k <= n; k++) { const s = cam.project(arc.at(k / n)); if (s) pts.push([s.x, s.y, k / n, s.s]); }
        if (pts.length < 2) continue;
        const half = 0.5 * grow, seg = pts.filter(q => q[2] <= half + 1e-6 || q[2] >= 1 - half - 1e-6);
        const lw = clamp(0.035 * pts[Math.floor(pts.length / 2)][3], 0.8, 5);
        for (const part of [seg.filter(q => q[2] <= 0.5), seg.filter(q => q[2] >= 0.5)]) {
          polyline(ctx, part, lw * 4, P.gold, 0.12 * fade); polyline(ctx, part, lw, P.goldHi, 0.85 * fade);
        }
        if (grow > 0.98) { const m = pts[Math.floor(pts.length / 2)], f = 1 - sstep(0.24, 0.7, age); stamp(ctx, glow(P.goldHi), m[0], m[1], clamp(0.5 * m[3], 6, 60) * (1 + tr.last * 0.6), (0.4 + 0.6 * f) * fade); }
      }
      ctx.globalCompositeOperation = "source-over";
      /* what the colours mean, once, early */
      const la = sstep(0.1, 0.18, p) * (1 - sstep(0.44, 0.5, p)) * fin;
      if (la > 0.01 && !QUIET) {
        const fs = lbl(env); let bi = -1, si = -1, bz = 1e9, sz = 1e9;
        for (const { q, i, z } of list) {
          const [v, side] = pitSig(q, tau); if (v < 0.85) continue;
          const h = cam.project([q.x, q.y + q.tall, q.z]); if (!h || h.y < H * 0.24 || h.y > env.cy + H * 0.1) continue;
          if (side > 0 && h.x < W * 0.4 && z < bz) { bz = z; bi = i; } if (side < 0 && h.x > W * 0.6 && z < sz) { sz = z; si = i; }
        }
        for (const [i, words, col] of [[bi, WORDS.pit[0], P.slate], [si, WORDS.pit[1], P.copper]]) {
          if (i < 0) continue; const h = cam.project(pitBody(g.people[i], 1, tau).hL); if (!h) continue;
          polyline(ctx, [[h.x, h.y - 8], [h.x, h.y - fs * 2.2]], 1, col, 0.8 * la);
          label(ctx, words[0], h.x, h.y - fs * 4.1, fs, col, la, "center", MONO, 600, 1);
          label(ctx, words[1], h.x, h.y - fs * 2.9, fs * 0.9, col, 0.8 * la, "center", MONO, 500, 1);
        }
      }
      ctx.globalAlpha = 1;
    },
    focus(env) { const g = pitGeom(env), cam = pitCamera(env, DUR.floor, 1), s = cam.project(pitArc(g, g.last).at(0.5)); return s ? [s.x, s.y] : [env.W / 2, env.H / 2]; }
  };

  /* ---------------------------------------------------------------- 6 · THE MACHINES, a hall of racks */
  const HALL = { L: 72, pitch: 0.62, half: 1.15, h: 2.1 };
  const machinesTos = p => expLerp(1e-3, 1e-6, sstep(0.04, 0.96, p));
  function hallGeom(env) {
    if (env.cache.hall) return env.cache.hall;
    const r = rng(20150702), racks = [], n = Math.floor(HALL.L / HALL.pitch), D = DUR.machines;
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) racks.push({ side, z: i * HALL.pitch, seed: Math.floor(r() * 1e6), sends: [] });
    const trays = [-0.64, -0.38, 0.38, 0.64];
    const pulses = [], np = env.lite ? 520 : 950;
    for (let k = 0; k < np; k++) {
      const rk = racks[Math.floor(r() * racks.length)], te = r() * (D + 3) - 3, side = r() < 0.5 ? 1 : -1;
      pulses.push({ te, z0: rk.z, tray: rk.side < 0 ? (r() < 0.5 ? 0 : 1) : r() < 0.5 ? 2 : 3, side, sp: 0.85 + 0.3 * r() });
      rk.sends.push({ te, side });
    }
    /* how far an order has run: fast while the clock reads milliseconds, slower as it reaches microseconds */
    const run = runningSum(t => 46 * Math.pow(machinesTos(clamp(t / D, 0, 1)) / 1e-3, 0.3), -3, D + 1, 1600);
    return (env.cache.hall = { racks, trays, pulses, run });
  }
  function hallCamera(env, tau, p) {
    const e = ease(clamp(p, 0, 1)), z = lerp(-1.5, 36, e), pos = [0.06 * Math.sin(tau * 0.45), 1.42 + 0.05 * Math.sin(tau * 0.33), z];
    return camFit(pos, [0, 1.36, z + 26], 50, 64, env.W, env.H, env.cy);
  }
  const S_MACHINES = {
    id: "machines", dur: DUR.machines, xin: 9,
    scale: (env, p) => ({ v: machinesTos(clamp(p, 0, 1)), kind: "t" }),
    caps: env => WORDS.machines[env.key], capAt: [0.02, 0.5],
    draw(env, tau, p) {
      const { ctx, W, H } = env, g = hallGeom(env), cam = hallCamera(env, tau, p), fin = sstep(0, 0.08, p), cz = cam.pos[2];
      /* the engine room at the far end, a light that grows as it comes */
      const far = cam.project([0, 1.3, HALL.L]);
      if (far) { stamp(ctx, glow(P.gold, true), far.x, far.y, Math.max(W, H) * lerp(0.35, 0.8, p), 0.3 * fin); stamp(ctx, glow(P.goldHi), far.x, far.y, lerp(10, 44, p), 0.7 * fin); }
      /* the floor tiles and the ceiling trays */
      for (let z = Math.ceil((cz + 0.4) / 0.6) * 0.6; z < Math.min(HALL.L, cz + 60); z += 0.6) {
        const a = cam.project([-HALL.half, 0, z]), b = cam.project([HALL.half, 0, z]); if (!a || !b) continue;
        polyline(ctx, [[a.x, a.y], [b.x, b.y]], 1, P.soft, 0.5 * fin * clamp(1 - (z - cz) / 60, 0, 1));
      }
      for (const x of [-1.15, -0.575, 0, 0.575, 1.15]) { const a = cam.project([x, 0, cz + 0.4]), b = cam.project([x, 0, HALL.L]); if (a && b) polyline(ctx, [[a.x, a.y], [b.x, b.y]], 1, P.soft, 0.45 * fin); }
      for (const x of g.trays) { const a = cam.project([x, 2.42, cz + 0.4]), b = cam.project([x, 2.42, HALL.L]); if (a && b) polyline(ctx, [[a.x, a.y], [b.x, b.y]], 1, P.rule, 0.6 * fin); }
      ctx.globalCompositeOperation = "lighter";
      for (const x of [-1.02, 1.02]) { const a = cam.project([x, 0.01, cz + 0.4]), b = cam.project([x, 0.01, HALL.L]); if (a && b) { polyline(ctx, [[a.x, a.y], [b.x, b.y]], 6, P.gold, 0.05 * fin); polyline(ctx, [[a.x, a.y], [b.x, b.y]], 1.2, P.goldHi, 0.35 * fin); } }
      ctx.globalCompositeOperation = "source-over";
      /* the racks, far to near: a dark face each, lights on it, and a flash of colour when it sends an order */
      const vis = g.racks.filter(rk => rk.z + HALL.pitch > cz + 0.3 && rk.z < cz + 64).sort((a, b) => b.z - a.z);
      for (const rk of vis) {
        const x = rk.side * HALL.half, z0 = rk.z, z1 = rk.z + HALL.pitch * 0.94;
        const c = [[x, 0, z0], [x, 0, z1], [x, HALL.h, z1], [x, HALL.h, z0]].map(q => cam.project(q)); if (c.some(v => !v)) continue;
        const fog = clamp(1.2 - (z0 - cz) / 62, 0.1, 1) * fin;
        ctx.globalAlpha = fog; ctx.fillStyle = rgba(mix("#1A1713", "#2A251F", hash(rk.seed, 1, 1)), 1); ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.5 * fog; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; ctx.stroke();
        let hot = 0, hs = 1; for (const sd of rk.sends) { const a = tau - sd.te; if (a >= 0 && a < 0.35) { const v = 1 - a / 0.35; if (v > hot) { hot = v; hs = sd.side; } } }
        const sc = cam.project([x, 1, (z0 + z1) / 2]); if (!sc || sc.s < 9) continue;
        const sz = Math.max(1, 0.018 * sc.s);
        for (let row = 0; row < 12; row++) for (let col = 0; col < 3; col++) {
          const h = hash(rk.seed, row * 3 + col, Math.floor(tau * (3 + (row % 3)))), on = h > 0.6;
          if (!on && hot < 0.05) continue;
          const q = cam.project([x, 0.25 + row * 0.15, z0 + 0.1 + col * 0.17]); if (!q) continue;
          ctx.globalAlpha = fog * (hot > 0.05 ? 0.55 + 0.45 * hot : 0.35 + 0.5 * h); ctx.fillStyle = hot > 0.05 ? (hs > 0 ? P.slate : P.copper) : "#E8DDC9";
          ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        }
      }
      /* the orders, running along the trays toward the engine */
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      const now = g.run(tau);
      for (const pu of g.pulses) {
        if (tau < pu.te) continue;
        const z = pu.z0 + pu.sp * (now - g.run(pu.te)); if (z > HALL.L || z < cz + 0.5) continue;
        const x = g.trays[pu.tray], a = cam.project([x, 2.42, z]), b = cam.project([x, 2.42, Math.max(pu.z0, z - 0.9)]); if (!a || !b) continue;
        const col = pu.side > 0 ? P.slate : P.copper, al = clamp(1.2 - (z - cz) / 60, 0.1, 1) * fin;
        polyline(ctx, [[b.x, b.y], [a.x, a.y]], clamp(0.05 * a.s, 0.8, 4), col, 0.55 * al);
        stamp(ctx, glow(col), a.x, a.y, clamp(0.12 * a.s, 2, 16), 0.9 * al);
      }
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    },
    focus(env) { const cam = hallCamera(env, DUR.machines, 1), s = cam.project([0, 1.3, HALL.L]); return s ? [s.x, s.y] : [env.W / 2, env.H / 2]; }
  };

  /* ---------------------------------------------------------------- 7 · THE MATCH, inside the engine */
  const matchTos = p => expLerp(1e-6, 1e-9, ease(clamp(p, 0, 1)));
  function matchGeom(env) {
    if (env.cache.match) return env.cache.match;
    const r = rng(90210 + env.metal.Z), D = DUR.match, ev = [];
    let t = 0.2;
    while (t < D - 1.6) { t += (0.1 + 0.45 * r()) * lerp(0.6, 3.2, sstep(0.2, 0.9, t / D)); ev.push({ t, bi: Math.floor(r() * 7), ai: Math.floor(r() * 7) }); }
    ev.push({ t: D - 0.32, bi: 3, ai: 3, last: true });
    /* the orders slow as the time on screen shrinks: at a nanosecond they crawl */
    const run = runningSum(tt => 0.95 * Math.pow(matchTos(clamp(tt / D, 0, 1)) / 1e-6, 0.3), -4, D + 3, 1600);
    return (env.cache.match = { ev, run });
  }
  function matchLayout(env) {
    const { W, H, U } = env, cx = W / 2, cy = env.cy, Rc = U * 0.085, sp = Math.min(H * 0.1, U * 0.1);
    const fib = (side, k) => { const o = k - 3, P0 = [cx + side * W * 0.62, cy + o * sp * 1.25], C = [cx + side * W * 0.24, cy + o * sp * 0.8], P1 = [cx + side * Rc * 1.18, cy + o * Rc * 0.1];
      return u => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * P0[0] + b * C[0] + c * P1[0], a * P0[1] + b * C[1] + c * P1[1]]; }; };
    return { cx, cy, Rc, fib };
  }
  function fmtLen(m) { return m >= 1 ? round1(m) + (round1(m) === "1" ? " metre" : " metres") : m >= 0.01 ? round1(m * 100) + (round1(m * 100) === "1" ? " centimetre" : " centimetres") : round1(m * 1000) + " millimetres"; }
  const S_MATCH = {
    id: "match", dur: DUR.match, xin: 8, streaks: true,
    scale: (env, p) => ({ v: matchTos(p), kind: "t" }),
    caps: env => WORDS.match[env.key], capAt: [0.02, 0.5],
    draw(env, tau, p) {
      const { ctx, W, H, U } = env, g = matchGeom(env), L = matchLayout(env), fin = sstep(0, 0.1, p), now = g.run(tau), K = 1.05;
      const { cx, cy, Rc } = L;
      /* the fibres */
      for (const side of [-1, 1]) for (let k = 0; k < 7; k++) {
        const f = L.fib(side, k), pts = []; for (let i = 0; i <= 40; i++) pts.push(f(i / 40));
        polyline(ctx, pts, 3, side < 0 ? P.slate : P.copper, 0.07 * fin); polyline(ctx, pts, 1, P.rule, 0.8 * fin);
      }
      /* the engine: its clock, its rings */
      ctx.globalCompositeOperation = "lighter";
      stamp(ctx, glow(P.gold, true), cx, cy, Rc * 4.2, 0.3 * fin);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rc);
      rg.addColorStop(0, rgba(P.goldHi, 0.55)); rg.addColorStop(0.55, rgba(P.gold, 0.18)); rg.addColorStop(1, rgba(P.gold, 0.02));
      ctx.globalAlpha = fin; ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.85 * fin; ctx.strokeStyle = P.gold; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.5 * fin; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, Rc * 0.62, 0, TAU); ctx.stroke();
      const rot = now * 0.35;
      ctx.globalAlpha = 0.6 * fin; ctx.strokeStyle = P.goldHi;
      for (let k = 0; k < 72; k++) { const a = rot + (k * TAU) / 72, r0 = Rc * 1.1, r1 = Rc * (k % 6 ? 1.15 : 1.22); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
      /* the orders arriving, and the trades they make */
      ctx.globalCompositeOperation = "lighter";
      for (const e of g.ev) {
        const left = (g.run(e.t) - now) * K;   /* how far each order still has to run, in fibre lengths */
        if (left > 1.05) continue;
        if (left > 0) {
          for (const [side, k] of [[-1, e.bi], [1, e.ai]]) {
            const f = L.fib(side, k), u = 1 - left, a = f(u), b = f(Math.max(0, u - 0.06)), col = side < 0 ? P.slate : P.copper;
            polyline(ctx, [b, a], Math.max(1.5, U * 0.004), col, 0.6 * fin);
            stamp(ctx, glow(col), a[0], a[1], Math.max(4, U * 0.011) * (e.last ? 1.6 : 1), fin);
          }
        } else {
          const age = tau - e.t; if (age > 1.2) continue;
          const f = 1 - sstep(0, 0.7, age);
          stamp(ctx, glow(P.goldHi), cx, cy, Rc * (0.5 + 1.8 * sstep(0, 0.5, age)) * (e.last ? 1.8 : 1), (e.last ? 1 : 0.8) * f * fin);
          /* the print, leaving for the tape */
          const up = (now - g.run(e.t)) * K * H * 0.5; if (up < H * 0.6) stamp(ctx, glow(P.gold), cx, cy - Rc - up, Math.max(3, U * 0.008), 0.9 * (1 - sstep(0.3, 0.6, up / H)) * fin);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      const fs = lbl(env);
      label(ctx, WORDS.engine[0], cx - Rc * 2.2, cy - Rc * 1.55, fs, P.slate, 0.9 * fin * sstep(0.04, 0.12, p), "center", MONO, 600, 2);
      label(ctx, WORDS.engine[1], cx + Rc * 2.2, cy - Rc * 1.55, fs, P.copper, 0.9 * fin * sstep(0.04, 0.12, p), "center", MONO, 600, 2);
      label(ctx, WORDS.engine[2], cx, cy + Rc * 1.62, fs, P.ink5, 0.9 * fin * sstep(0.04, 0.12, p), "center", MONO, 600, 2);
      /* how far light in glass fibre gets in the time on screen */
      const ra = sstep(0.18, 0.28, p) * fin;
      if (ra > 0.01 && !QUIET) {
        const tall = W / H < 1.05, x0 = W * 0.055, y0 = H * (tall ? 0.2 : 0.11), len = Math.min(U * 0.3, W * 0.3);
        polyline(ctx, [[x0, y0], [x0 + len, y0]], 2, P.gold, ra); polyline(ctx, [[x0, y0 - 6], [x0, y0 + 6]], 1.5, P.gold, ra); polyline(ctx, [[x0 + len, y0 - 6], [x0 + len, y0 + 6]], 1.5, P.gold, ra);
        label(ctx, fmtLen(matchTos(p) * 2e8), x0, y0 + fs * 1.7, fs * 1.6, P.ink, ra, "left", MONO, 500);
        label(ctx, WORDS.ruler[0], x0, y0 - fs * 2.5, fs * 0.9, P.ink5, ra, "left", MONO, 600, 1.5);
        label(ctx, WORDS.ruler[1], x0, y0 - fs * 1.3, fs * 0.9, P.ink5, ra, "left", MONO, 600, 1.5);
      }
      ctx.globalAlpha = 1;
    },
    focus(env) { const L = matchLayout(env); return [L.cx, L.cy]; }
  };

  /* ---------------------------------------------------------------- 8 · THE VAULT, the metal itself */
  /* Good Delivery sizes (LBMA, LPPM): a gold bar about 250 x 70 mm on top, 35 mm high; silver about 300 x 130 x 80 mm; platinum in plates and ingots */
  const BAR = {
    Gold: { top: [0.25, 0.07], bot: [0.228, 0.05], h: 0.036, nx: 3, nz: 11, layers: 7 },
    Silver: { top: [0.3, 0.13], bot: [0.274, 0.104], h: 0.08, nx: 3, nz: 7, layers: 5 },
    Platinum: { top: [0.12, 0.06], bot: [0.112, 0.052], h: 0.02, nx: 5, nz: 10, layers: 9 }
  };
  const VROW = { gap: 1.25, first: 2.2, x: 1.15, n: 16 };
  function vaultGeom(env) {
    if (env.cache.vault) return env.cache.vault;
    const B = BAR[env.key], stacks = [];
    const fw = Math.max(B.nx * B.top[0], B.nz * B.top[1] * 1.04) + 0.02;
    for (const side of [-1, 1]) for (let i = 0; i < VROW.n; i++) stacks.push({ side, x: side * (VROW.x + fw / 2), z: VROW.first + i * VROW.gap, layers: B.layers - (hash(i, side + 3, 7) < 0.3 ? 1 : 0) });
    const tgt = stacks.find(s => s.side > 0 && s.z > 6.5); tgt.layers = B.layers;   /* odd, so its top layer runs along the aisle */
    return (env.cache.vault = { B, stacks, fw, tgt });
  }
  /* the bars of one layer: centre, orientation (0 along x, 1 along z) */
  function layerBars(B, st, l, fw) {
    const out = [], along = l % 2;
    const n1 = along ? B.nx : B.nx, n2 = B.nz, L0 = B.top[0], W0 = B.top[1] * 1.04;
    for (let a = 0; a < n1; a++) for (let b = 0; b < n2; b++) {
      const u = (a - (n1 - 1) / 2) * L0, v = (b - (n2 - 1) / 2) * W0;
      out.push(along ? { x: st.x + v, z: st.z + u, rot: 1 } : { x: st.x + u, z: st.z + v, rot: 0 });
    }
    return out;
  }
  function vaultCamera(env, tau, p) {
    const g = vaultGeom(env), T = [g.tgt.x, g.tgt.layers * g.B.h, g.tgt.z];
    const a = sstep(0, 0.62, p), b = sstep(0.42, 1, p);
    const p0 = [0, 1.75, -3.2], t0 = [0, 0.7, 10];
    const p1 = [0.1, 1.2, g.tgt.z - 3.2], t1 = [T[0], T[1], T[2] - 0.2];
    const p2 = [T[0] - 0.01, T[1] + expLerp(0.9, 0.2, b), T[2] - expLerp(0.75, 0.06, b)], t2 = [T[0], T[1], T[2]];
    let pos = lerp3(p0, p1, ease(a)), tgt = lerp3(t0, t1, ease(a));
    if (b > 0) { pos = lerp3(pos, p2, ease(b)); tgt = lerp3(tgt, t2, ease(b)); }
    pos = add3(pos, [0.03 * Math.sin(tau * 0.4) * (1 - b), 0.02 * Math.sin(tau * 0.31) * (1 - b), 0]);
    return { cam: camFit(pos, tgt, 46, 58, env.W, env.H, env.cy), T };
  }
  const S_VAULT = {
    id: "vault", dur: DUR.vault, xin: 7,
    scale: (env, p) => { const { cam, T } = vaultCamera(env, 0, clamp(p, 0, 1)); const d = Math.hypot(T[0] - cam.pos[0], T[1] - cam.pos[1], T[2] - cam.pos[2]); return { v: (env.W / cam.foc) * d, kind: "m" }; },
    caps: env => WORDS.vault[env.key], capAt: [0.02, 0.5],
    draw(env, tau, p) {
      const { ctx, W, H, metal: M } = env, g = vaultGeom(env), B = g.B, { cam } = vaultCamera(env, tau, p), fin = sstep(0, 0.08, p);
      /* pools of light down the aisle */
      for (let i = 0; i < VROW.n; i += 2) { const s = cam.project([0, 0, VROW.first + i * VROW.gap]); if (s) stamp(ctx, glow(M.col, true), s.x, s.y, s.s * 2.6, 0.12 * fin); }
      /* the floor */
      for (let z = 0; z < VROW.first + VROW.n * VROW.gap; z += 0.8) { const a = cam.project([-3, 0, z]), b = cam.project([3, 0, z]); if (a && b) polyline(ctx, [[a.x, a.y], [b.x, b.y]], 1, P.soft, 0.35 * fin); }
      const faces = [], Lp = norm3([-0.35, 1, -0.25]), eye = cam.pos;
      const bar = (cx, cy, cz, rot, detail) => {
        /* a Good Delivery bar: a wider top than bottom, sloped sides */
        const [tl, tw] = B.top, [bl, bw] = B.bot, h = B.h;
        const P8 = [[-bl / 2, 0, -bw / 2], [bl / 2, 0, -bw / 2], [bl / 2, 0, bw / 2], [-bl / 2, 0, bw / 2], [-tl / 2, h, -tw / 2], [tl / 2, h, -tw / 2], [tl / 2, h, tw / 2], [-tl / 2, h, tw / 2]]
          .map(q => (rot ? [cx + q[2], cy + q[1], cz + q[0]] : [cx + q[0], cy + q[1], cz + q[2]]));
        const F = [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
        for (const f of F) {
          const a = P8[f[0]], b = P8[f[1]], c = P8[f[2]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = norm3([u[2] * v[1] - u[1] * v[2], u[0] * v[2] - u[2] * v[0], u[1] * v[0] - u[0] * v[1]]);   /* outward: the faces are listed clockwise from outside */
          const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], to = [eye[0] - mid[0], eye[1] - mid[1], eye[2] - mid[2]];
          if (n[0] * to[0] + n[1] * to[1] + n[2] * to[2] <= 0) continue;
          faces.push({ pts: f.map(i => P8[i]), n, d: Math.hypot(to[0], to[1], to[2]), top: f[0] === 4, detail, tone: hash(Math.round(cx * 1000), Math.round(cz * 1000), Math.round(cy * 1000)) - 0.5 });
        }
      };
      const box = st => {   /* a stack too far to count its bars: one block, lined by layer */
        const hw = g.fw / 2, top = st.layers * B.h, P8 = [[-hw, 0, -hw], [hw, 0, -hw], [hw, 0, hw], [-hw, 0, hw], [-hw, top, -hw], [hw, top, -hw], [hw, top, hw], [-hw, top, hw]].map(q => [st.x + q[0], q[1], st.z + q[2]]);
        for (const f of [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
          const a = P8[f[0]], b = P8[f[1]], c = P8[f[2]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const n = norm3([u[2] * v[1] - u[1] * v[2], u[0] * v[2] - u[2] * v[0], u[1] * v[0] - u[0] * v[1]]), mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], to = [eye[0] - mid[0], eye[1] - mid[1], eye[2] - mid[2]];
          if (n[0] * to[0] + n[1] * to[1] + n[2] * to[2] <= 0) continue;
          faces.push({ pts: f.map(i => P8[i]), n, d: Math.hypot(to[0], to[1], to[2]), top: f[0] === 4, detail: false, layers: f[0] === 4 ? 0 : st.layers });
        }
      };
      for (const st of g.stacks) {
        const dz = st.z - eye[2]; if (dz < -1.5 || dz > 26) continue;
        const near = Math.hypot(st.x - eye[0], st.z - eye[2]) < 4.2;
        if (!near) { box(st); continue; }
        for (let l = 0; l < st.layers; l++) {
          const y = l * B.h, top = l === st.layers - 1;
          for (const b of layerBars(B, st, l, g.fw)) {
            /* inside a stack only the top layer and the outer bars can be seen */
            const edge = Math.abs(b.x - st.x) > g.fw / 2 - B.top[0] * 0.9 || Math.abs(b.z - st.z) > g.fw / 2 - B.top[0] * 0.9;
            if (!top && !edge) continue;
            if (!near && !top && hash(Math.round(b.x * 100), Math.round(b.z * 100), l) < 0.4) continue;
            bar(b.x, y, b.z, b.rot, near);
          }
        }
      }
      faces.sort((a, b) => b.d - a.d);
      const hl = norm3([Lp[0] - 0, Lp[1] + 1, Lp[2] - 1]);
      for (const f of faces) {
        const s = f.pts.map(q => cam.project(q)); if (s.some(v => !v)) continue;
        const dif = Math.max(0, f.n[0] * Lp[0] + f.n[1] * Lp[1] + f.n[2] * Lp[2]), spec = Math.pow(Math.max(0, f.n[0] * hl[0] + f.n[1] * hl[1] + f.n[2] * hl[2]), 14);
        const tone = f.tone == null ? 0 : f.tone, fog = clamp(1.15 - f.d / 24, 0.12, 1) * fin;
        const base = mix(M.lo, M.col, (f.top ? 0.62 : 0.15 + 0.55 * dif) + 0.12 * tone), lite = mix(M.col, M.hi, (f.top ? 0.3 : 0.2) + 0.25 * dif);
        let fill;
        if (f.top && f.detail && f.d < 1.6) { const gr = ctx.createLinearGradient(s[0].x, s[0].y, s[2].x, s[2].y); gr.addColorStop(0, rgba(base, 1)); gr.addColorStop(0.5, rgba(mix(lite, "#FFFFFF", 0.25 * spec), 1)); gr.addColorStop(1, rgba(mix(base, M.lo, 0.3), 1)); fill = gr; }
        else fill = rgba(mix(base, lite, 0.5 * spec), 1);
        ctx.globalAlpha = fog; ctx.fillStyle = fill; ctx.beginPath(); s.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill();
        if (f.detail) { ctx.globalAlpha = 0.35 * fog; ctx.strokeStyle = rgba(mix(M.lo, "#000000", 0.4), 1); ctx.lineWidth = 0.8; ctx.stroke(); }
        else if (f.layers) {   /* the layers of a far stack, as lines */
          ctx.globalAlpha = 0.4 * fog; ctx.strokeStyle = rgba(mix(M.lo, "#000000", 0.3), 1); ctx.lineWidth = 0.7; ctx.beginPath();
          for (let l = 1; l < f.layers; l++) { const k = l / f.layers, A = lerp(s[0].y, s[3].y, k), Bv = lerp(s[1].y, s[2].y, k); ctx.moveTo(lerp(s[0].x, s[3].x, k), A); ctx.lineTo(lerp(s[1].x, s[2].x, k), Bv); }
          ctx.stroke();
        }
      }
      /* the stamp on the bar the camera comes down to */
      const sa = sstep(0.55, 0.75, p) * fin;
      if (sa > 0.01 && !QUIET) {
        const T = g.tgt, top = T.layers * B.h, lb = layerBars(B, T, T.layers - 1, g.fw), c = lb[Math.floor(lb.length / 2)];
        const [tl, tw] = B.top, q = (u, v) => (c.rot ? [c.x + v * tw, top, c.z + u * tl] : [c.x + u * tl, top, c.z + v * tw]);
        const o = cam.project(q(-0.5, 0.5)), ux = cam.project(q(0.5, 0.5)), vy = cam.project(q(-0.5, -0.5));
        if (o && ux && vy) {
          /* the face in millimetres, so the letters keep their shape */
          const Lm = tl * 1000, Wm = tw * 1000;
          ctx.save(); ctx.transform((ux.x - o.x) / Lm, (ux.y - o.y) / Lm, (vy.x - o.x) / Wm, (vy.y - o.y) / Wm, o.x, o.y);
          const ink = rgba(mix(M.lo, "#000000", 0.2), 1), edge = rgba(M.hi, 1), words = WORDS.stamp[env.key], k = Wm / 70;
          ctx.globalAlpha = 0.55 * sa; ctx.strokeStyle = ink; ctx.lineWidth = 1.1 * k; ctx.beginPath(); ctx.arc(Lm * 0.14, Wm * 0.5, Wm * 0.2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(Lm * 0.14, Wm * 0.5, Wm * 0.11, 0, TAU); ctx.stroke();
          ctx.textBaseline = "middle"; ctx.textAlign = "left";
          for (const [txt, y, sz] of [[words[0], Wm * 0.32, 12.5 * k], [words[1], Wm * 0.7, 20 * k]]) {
            ctx.font = "600 " + sz.toFixed(2) + "px " + MONO;
            ctx.globalAlpha = 0.5 * sa; ctx.fillStyle = edge; ctx.fillText(txt, Lm * 0.27 + 0.5 * k, y + 0.7 * k);
            ctx.globalAlpha = 0.85 * sa; ctx.fillStyle = ink; ctx.fillText(txt, Lm * 0.27, y);
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    },
    focus(env) { return [env.W / 2, env.cy]; }
  };

  /* ---------------------------------------------------------------- 11 · BACK UP, to this week's lines */
  const S_BACK = {
    id: "back", dur: DUR.back, xin: 1, montage: true,
    scale: (env, p) => ({ v: p < 0.5 ? expLerp(1e-9, 604800, sstep(0, 0.5, p)) : expLerp(604800, Math.max(2, recGeom(env).weeks) * 604800, sstep(0.5, 1, p)), kind: "t" }),
    caps: env => WORDS.back(env.words), capAt: [0.56],
    focus(env) { return [env.W / 2, env.H / 2]; }
  };
  const STAGES = [S_RECORD, S_WEEK, S_TRADES, S_ORDERS, S_FLOOR, S_MACHINES, S_MATCH, S_VAULT, S_BACK];
  const BLOOM = { record: 0.8, week: 0.7, trades: 1, orders: 0.85, floor: 0.9, machines: 0.95, match: 1, vault: 0.5, back: 0.75 };
  const DOWN = STAGES.map((s, i) => i).filter(i => i > 0 && i < STAGES.length - 1).reverse();   /* the way back up, deepest first */
  const STARTS = []; let TOTAL = 0; for (const s of STAGES) { STARTS.push(TOTAL); TOTAL += s.dur; }
  const XT = 1.3;
  const stageAt = t => { let i = 0; while (i < STAGES.length - 1 && t >= STARTS[i + 1]) i++; return i; };

  /* ---------------------------------------------------------------- how a scale is read out */
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sup = n => String(n).split("").map(c => SUP[c] || c).join("");
  const round1 = v => (v >= 9.95 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
  function fmtScale(s) {
    if (s.kind === "t") {
      const v = s.v;
      const U = [[604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"], [1, "second"], [0.001, "millisecond"], [1e-6, "microsecond"]];
      for (const [u, n] of U) if (v >= u * 0.985) { const x = round1(v / u); return x + " " + n + (x === "1" ? "" : "s"); }
      return "1 microsecond";
    }
    const v = s.v, U = [[1e-2, "centimetre"], [1e-3, "millimetre"], [1e-6, "micrometre"], [1e-9, "nanometre"], [1e-12, "picometre"], [1e-15, "femtometre"]];
    for (const [u, n] of U) if (v >= u * 0.985) { const x = round1(v / u); return x + " " + n + (x === "1" ? "" : "s"); }
    const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return (m >= 1.05 ? round1(m) + " × " : "") + "10" + sup(e) + " metres";
  }

  /* ---------------------------------------------------------------- the player's styles, once per page */
  const CSS = `
.dsc{position:relative;width:100%;aspect-ratio:16/9;background:#141210;color:#EFE8DC;border-radius:14px;overflow:hidden;isolation:isolate;container-type:inline-size;
  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;box-shadow:0 0 0 1px rgba(239,232,220,.07),0 26px 70px rgba(0,0,0,.3);outline:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.dsc:focus-visible{box-shadow:0 0 0 2px #CBA43C}
.dsc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.dsc button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0;margin:0;white-space:nowrap}
.dsc-title{position:absolute;left:5.5%;right:5.5%;top:10%;pointer-events:none}
.dsc-t1{font-family:'Newsreader',Georgia,serif;font-weight:300;font-size:clamp(26px,5.4vw,78px);font-size:clamp(26px,5.4cqw,78px);line-height:1.02;letter-spacing:-.02em;color:#EFE8DC;text-shadow:0 0 30px rgba(0,0,0,.6);text-wrap:balance}
.dsc-t2{margin-top:clamp(10px,1.4vw,20px);font-size:clamp(9px,1.02vw,13px);font-size:clamp(9px,1.02cqw,13px);font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#B8AE9E;max-width:64ch;line-height:1.7}
.dsc-cap{position:absolute;left:4.6%;bottom:9%;width:min(60%,760px);pointer-events:none;z-index:1}
.dsc-cap::before{content:"";position:absolute;left:-14%;right:-18%;top:-45%;bottom:-40%;z-index:-1;background:radial-gradient(closest-side,rgba(12,10,8,.74),rgba(12,10,8,.5) 55%,rgba(12,10,8,0))}
.dsc-kick{font-size:clamp(9.5px,.95vw,12px);font-size:clamp(9.5px,.95cqw,12px);font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#CBA43C;margin-bottom:.75em;text-shadow:0 0 14px rgba(0,0,0,.9)}
.dsc-txt{font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:clamp(15px,1.72vw,25px);font-size:clamp(15px,1.72cqw,25px);line-height:1.36;color:#EFE8DC;text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 24px rgba(0,0,0,.9);text-wrap:pretty}
.dsc-foot{margin-top:.95em;font-size:clamp(9.5px,.88vw,12px);font-size:clamp(9.5px,.88cqw,12px);letter-spacing:.05em;color:#B8AE9E;text-shadow:0 0 12px rgba(0,0,0,.95)}
.dsc-scale{position:absolute;right:4%;top:6.4%;text-align:right;pointer-events:none}
.dsc-scale b{display:block;font-size:clamp(15px,2.2vw,32px);font-size:clamp(15px,2.2cqw,32px);font-weight:500;letter-spacing:-.01em;color:#EFE8DC;font-variant-numeric:tabular-nums;text-shadow:0 0 20px rgba(0,0,0,.85)}
.dsc-scale span{display:block;margin-top:.45em;font-size:clamp(8.5px,.82vw,11px);font-size:clamp(8.5px,.82cqw,11px);font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#B8AE9E}
.dsc-rail{position:absolute;right:4%;top:23%;bottom:26%;margin:0;padding:0;list-style:none;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;transition:opacity .4s}
.dsc-rail button{display:flex;align-items:center;gap:10px;min-height:22px;font-size:clamp(9px,.7vw,11px);font-size:clamp(9px,.7cqw,11px);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(184,174,158,.5);transition:color .35s;text-shadow:0 0 10px rgba(0,0,0,.9)}
.dsc-rail button span{opacity:0;transition:opacity .3s}
.dsc-rail:hover button span,.dsc-rail button:focus-visible span{opacity:1}
.dsc-rail button i{display:block;width:12px;height:1.5px;background:currentColor;transition:width .35s}
.dsc-rail button[aria-current="step"]{color:#CBA43C}
.dsc-rail button[aria-current="step"] i{width:26px}
.dsc-rail button:hover,.dsc-rail button:focus-visible{color:#EFE8DC}
.dsc-ctl{position:absolute;right:4%;bottom:5.4%;display:flex;gap:8px;align-items:center;transition:opacity .4s}
.dsc-ctl button{min-height:34px;padding:0 12px;border:1px solid rgba(239,232,220,.22);border-radius:3px;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;background:rgba(20,18,16,.6)}
.dsc-ctl button:hover,.dsc-ctl button:focus-visible{border-color:#EFE8DC}
.dsc-metal{display:flex}
.dsc-metal button{border-radius:0}
.dsc-metal button+button{border-left-width:0}
.dsc-metal button:first-child{border-radius:3px 0 0 3px}
.dsc-metal button:last-child{border-radius:0 3px 3px 0}
.dsc-metal button[aria-pressed="true"]{background:#EFE8DC;color:#141210;border-color:#EFE8DC}
.dsc-bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(239,232,220,.1);cursor:pointer}
.dsc-bar i{display:block;height:100%;width:0;background:#CBA43C}
.dsc-go{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:14px;padding:15px 26px 15px 20px!important;border:1px solid rgba(203,164,60,.65)!important;border-radius:40px;background:rgba(20,18,16,.72)!important;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#EFE8DC;transition:transform .2s,border-color .2s,background .2s}
.dsc-go:hover,.dsc-go:focus-visible{border-color:#CBA43C!important;background:rgba(20,18,16,.88)!important;transform:translate(-50%,-50%) scale(1.03)}
.dsc-go i{width:0;height:0;border-left:13px solid #CBA43C;border-top:8px solid transparent;border-bottom:8px solid transparent}
.dsc[data-state="playing"] .dsc-go,.dsc[data-state="paused"] .dsc-go{display:none}
.dsc[data-state="poster"] .dsc-cap,.dsc[data-state="poster"] .dsc-scale,.dsc[data-state="poster"] .dsc-rail,.dsc[data-state="poster"] .dsc-pp,.dsc[data-state="poster"] .dsc-bar{display:none}
.dsc[data-idle="1"] .dsc-ctl,.dsc[data-idle="1"] .dsc-rail{opacity:0}
.dsc[data-capture="1"] .dsc-ctl,.dsc[data-capture="1"] .dsc-go,.dsc[data-capture="1"] .dsc-bar,.dsc[data-capture="1"] .dsc-rail{display:none}
.dsc[data-capture="1"] *{transition:none!important}
.dsc[data-portrait="1"] .dsc-rail{display:none}
.dsc[data-portrait="1"] .dsc-cap{left:6%;right:6%;width:auto;bottom:13%}
.dsc[data-portrait="1"] .dsc-txt{font-size:clamp(15px,4.1vw,34px);font-size:clamp(15px,4.4cqw,34px)}
.dsc[data-portrait="1"] .dsc-kick,.dsc[data-portrait="1"] .dsc-foot{font-size:clamp(9.5px,2.6vw,20px);font-size:clamp(9.5px,2.7cqw,20px)}
.dsc[data-portrait="1"] .dsc-scale b{font-size:clamp(15px,4.6vw,40px);font-size:clamp(15px,4.8cqw,40px)}
.dsc[data-portrait="1"] .dsc-scale span{font-size:clamp(8.5px,2.2vw,17px);font-size:clamp(8.5px,2.3cqw,17px)}
.dsc[data-portrait="1"] .dsc-t1{font-size:clamp(26px,8.6vw,96px);font-size:clamp(26px,8.6cqw,96px)}
.dsc[data-portrait="1"] .dsc-t2{font-size:clamp(9px,2.6vw,20px);font-size:clamp(9px,2.6cqw,20px)}
.dsc[data-portrait="1"] .dsc-ctl{left:6%;right:6%;bottom:3.4%;justify-content:space-between}
.dsc[data-portrait="1"] .dsc-ctl button{min-height:44px;padding:0 9px;letter-spacing:.1em}
.dsc[data-portrait="1"] .dsc-fs{display:none}
.dsc[data-portrait="1"] .dsc-go{padding:13px 20px 13px 16px!important;gap:11px;letter-spacing:.14em}
.dsc[data-video="1"] .dsc-t1{font-size:6.2cqw}
.dsc[data-video="1"] .dsc-t2{font-size:1.5cqw;max-width:none}
.dsc[data-video="1"] .dsc-cap{width:68%;bottom:8%}
.dsc[data-video="1"] .dsc-kick{font-size:1.2cqw}
.dsc[data-video="1"] .dsc-txt{font-size:2.55cqw;line-height:1.3}
.dsc[data-video="1"] .dsc-foot{font-size:1.12cqw}
.dsc[data-video="1"] .dsc-scale b{font-size:2.6cqw}
.dsc[data-video="1"] .dsc-scale span{font-size:1.05cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-t1{font-size:9.6cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-t2{font-size:2.5cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-cap{width:auto;bottom:10%}
.dsc[data-video="1"][data-portrait="1"] .dsc-kick{font-size:2.3cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-txt{font-size:3.9cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-foot{font-size:2.1cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-scale b{font-size:4.6cqw}
.dsc[data-video="1"][data-portrait="1"] .dsc-scale span{font-size:2cqw}
@media (max-width:760px){.dsc{aspect-ratio:4/5;border-radius:10px}}
.dsc:fullscreen{aspect-ratio:auto;width:100vw;height:100vh;border-radius:0}
.dsc-text{margin-top:12px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;line-height:1.7;color:inherit}
.dsc-text summary{cursor:pointer;font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;min-height:44px;display:flex;align-items:center}
.dsc-text ol{margin:6px 0 0;padding-left:1.4em}
.dsc-text li{margin:0 0 8px}
@media (prefers-reduced-motion:reduce){.dsc-go,.dsc-rail,.dsc-ctl{transition:none}}
`;
  let cssDone = false;
  function injectCSS() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.setAttribute("data-descent", VERSION); s.textContent = CSS; document.head.appendChild(s); }

  /* ---------------------------------------------------------------- the player */
  const VERSION = "2026-09-25";
  class Player {
    constructor(host, opts) {
      injectCSS();
      this.opts = opts || {};
      this.host = host; this.t = 0; this.state = "poster"; this.idleT = 0; this.last = 0; this.metalKey = this.opts.metal && METALS[this.opts.metal] ? this.opts.metal : "Gold";
      this.capture = !!this.opts.capture; this.focusCache = {}; this.layers = []; this.frameNo = 0;
      this.build(); this.env = { cache: {}, data: null, words: dataWords(null) };
      if (this.opts.width && this.opts.height) { this.el.style.width = this.opts.width + "px"; this.el.style.height = this.opts.height + "px"; this.el.style.aspectRatio = "auto"; }
      this.resize();
      loadData(this.opts.src).then(d => { this.env.data = d; this.env.words = dataWords(d); this.env.cache = {}; this.focusCache = {}; this.writeText(); this.draw(); });
      if (!this.capture) this.wire();
      this.draw();
    }
    build() {
      const h = this.host, el = document.createElement("div");
      el.className = "dsc"; el.tabIndex = 0; el.setAttribute("role", "region"); el.setAttribute("aria-label", WORDS.title + ". An animation of about a minute and a half.");
      el.dataset.state = "poster"; if (this.capture) el.dataset.capture = "1"; if (this.opts.video) el.dataset.video = "1";
      el.innerHTML = '<canvas aria-hidden="true"></canvas>' +
        '<div class="dsc-title"><div class="dsc-t1"></div><div class="dsc-t2"></div></div>' +
        '<div class="dsc-scale" aria-hidden="true"><b></b><span></span></div>' +
        '<ol class="dsc-rail"></ol>' +
        '<div class="dsc-cap" aria-hidden="true"><div class="dsc-kick"></div><div class="dsc-txt"></div><div class="dsc-foot"></div></div>' +
        '<div class="dsc-ctl"><button type="button" class="dsc-pp"></button><div class="dsc-metal" role="group" aria-label="Which metal to follow down"></div><button type="button" class="dsc-fs">Full screen</button></div>' +
        '<div class="dsc-bar" aria-hidden="true"><i></i></div>' +
        '<button type="button" class="dsc-go"><i></i><span></span></button>';
      h.appendChild(el);
      this.el = el; this.cv = el.querySelector("canvas"); this.ctx = this.cv.getContext("2d");
      const q = s => el.querySelector(s);
      this.ui = { t1: q(".dsc-t1"), t2: q(".dsc-t2"), title: q(".dsc-title"), scale: q(".dsc-scale"), sb: q(".dsc-scale b"), ss: q(".dsc-scale span"), rail: q(".dsc-rail"), kick: q(".dsc-kick"), txt: q(".dsc-txt"), foot: q(".dsc-foot"), cap: q(".dsc-cap"), pp: q(".dsc-pp"), metal: q(".dsc-metal"), fs: q(".dsc-fs"), bar: q(".dsc-bar i"), barBox: q(".dsc-bar"), go: q(".dsc-go"), goTxt: q(".dsc-go span") };
      this.ui.t1.textContent = WORDS.title; this.ui.t2.textContent = WORDS.subtitle;
      this.ui.goTxt.textContent = WORDS.play + " · " + WORDS.length;
      this.railBtns = STAGES.map((s, i) => {
        const li = document.createElement("li"), b = document.createElement("button");
        b.type = "button"; b.innerHTML = "<span></span><i></i>"; b.firstChild.textContent = WORDS.rail[i]; b.setAttribute("aria-label", "Go to " + WORDS.rail[i]);
        b.addEventListener("click", e => { e.stopPropagation(); this.seek(STARTS[i] + 0.01); if (this.state !== "playing") this.play(); });
        li.appendChild(b); this.ui.rail.appendChild(li); return b;
      });
      this.metalBtns = ORDER.map(k => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = METALS[k].Name; b.setAttribute("aria-pressed", String(k === this.metalKey));
        b.addEventListener("click", e => { e.stopPropagation(); this.setMetal(k); }); this.ui.metal.appendChild(b); return b;
      });
      /* the same words, readable without the picture */
      if (!this.capture) {
        const d = document.createElement("details"); d.className = "dsc-text"; d.innerHTML = "<summary>Read it as text</summary><ol></ol>";
        h.appendChild(d); this.textList = d.querySelector("ol");
      }
      this.writeText();
    }
    writeText() {
      if (!this.textList) return;
      const env = { metal: METALS[this.metalKey], key: this.metalKey, words: this.env ? this.env.words : dataWords(null) };
      this.textList.innerHTML = "";
      STAGES.forEach((s, i) => {
        const li = document.createElement("li"), b = document.createElement("b");
        b.textContent = WORDS.rail[i] + ". "; li.appendChild(b);
        /* the illustration line once, where it starts; every source line where its facts are */
        const ft = WORDS.feet[s.id] && (s.id === "week" || !/modelled/.test(WORDS.feet[s.id](env.metal))) ? " " + WORDS.feet[s.id](env.metal) : "";
        li.appendChild(document.createTextNode(s.caps(env).filter(Boolean).join(" ") + ft));
        this.textList.appendChild(li);
      });
    }
    wire() {
      const el = this.el, go = () => (this.state === "playing" ? this.pause() : this.play());
      this.ui.go.addEventListener("click", e => { e.stopPropagation(); this.play(); });
      this.ui.pp.addEventListener("click", e => { e.stopPropagation(); go(); });
      this.cv.addEventListener("click", () => { if (this.state === "poster" || this.state === "ended") this.play(); else go(); });
      this.ui.fs.addEventListener("click", e => { e.stopPropagation(); try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch (x) {} });
      this.ui.barBox.addEventListener("click", e => { const r = this.ui.barBox.getBoundingClientRect(); this.seek(clamp((e.clientX - r.left) / r.width, 0, 1) * TOTAL); if (this.state !== "playing") this.play(); });
      el.addEventListener("keydown", e => {
        if (e.target !== el) return;
        if (e.key === " " || e.key === "k" || e.key === "Enter") { e.preventDefault(); go(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); const i = Math.min(STAGES.length - 1, stageAt(this.t) + 1); this.seek(STARTS[i] + 0.01); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); const i = stageAt(this.t), j = this.t - STARTS[i] > 1.5 ? i : Math.max(0, i - 1); this.seek(STARTS[j] + 0.01); }
      });
      let idle = 0; const wake = () => { el.dataset.idle = "0"; clearTimeout(idle); idle = setTimeout(() => { if (this.state === "playing") el.dataset.idle = "1"; }, 2600); };
      el.addEventListener("pointermove", wake); el.addEventListener("pointerdown", wake); el.addEventListener("focusin", wake);
      if (window.ResizeObserver) new ResizeObserver(() => { this.resize(); this.draw(); }).observe(el);
      else window.addEventListener("resize", () => { this.resize(); this.draw(); });
      let reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (x) {}
      this.reduce = reduce; this.visible = true;
      if (window.IntersectionObserver) {
        new IntersectionObserver(es => {
          for (const e of es) {
            this.visible = e.isIntersecting && e.intersectionRatio > 0.05;
            if (e.intersectionRatio >= 0.6 && this.opts.autoplay === "view" && !reduce && this.state === "poster") this.play();
            if (!this.visible && this.state === "playing") this.pause(true);
            else if (this.visible && this.state === "paused" && this.autoPaused) { this.autoPaused = false; this.play(); }
          }
          this.kick();
        }, { threshold: [0, 0.06, 0.6] }).observe(el);
      }
      document.addEventListener("visibilitychange", () => { if (document.hidden && this.state === "playing") this.pause(true); else if (!document.hidden && this.visible && this.state === "paused" && this.autoPaused) { this.autoPaused = false; this.play(); } this.kick(); });
      this.kick();
    }
    kick() { if (this.raf || this.capture) return; const loop = ts => { this.raf = 0; this.tick(ts); const live = this.state === "playing" || (this.state === "poster" && !this.reduce); if (live && this.visible && !document.hidden) this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    tick(ts) {
      const dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0;
      if (this.state === "poster" && this.last && ts - this.last < 45) return;   /* the waiting picture only drifts: 20 frames a second is plenty */
      this.last = ts;
      if (this.state === "playing") { this.t += dt; if (this.t >= TOTAL) { this.t = TOTAL; this.end(); } }
      else if (this.state === "poster") this.idleT += dt;
      const a = performance.now(); this.draw(); this.pace(performance.now() - a);
    }
    /* a device that cannot keep up gets fewer pixels, never a slower film */
    pace(ms) {
      if (this.state !== "playing" || this.opts.dpr) return;
      this.ema = this.ema ? 0.92 * this.ema + 0.08 * ms : ms; this.paced = (this.paced || 0) + 1;
      if (this.paced > 40 && this.ema > 26 && this.dpr > 1.01) { this.quality = Math.max(0.5, (this.quality || 1) * 0.8); this.ema = 0; this.paced = 0; this.resize(); }
    }
    play() {
      if (this.state === "ended" || this.t >= TOTAL - 0.05) this.t = 0;
      const first = !this.started; this.started = true; this.state = "playing"; this.el.dataset.state = "playing"; this.last = 0;
      this.ui.pp.textContent = WORDS.pause;
      if (first) this.count("descent-play");
      this.kick();
    }
    pause(auto) { if (this.state !== "playing") return; if (!auto) this.autoPaused = false; this.state = "paused"; this.el.dataset.state = "paused"; this.ui.pp.textContent = WORDS.resume; this.autoPaused = !!auto; this.draw(); }
    end() { this.state = "ended"; this.el.dataset.state = "ended"; this.ui.pp.textContent = WORDS.replay; this.ui.goTxt.textContent = WORDS.replay; this.el.dataset.idle = "0"; this.count("descent-end"); }
    seek(t) { this.t = clamp(t, 0, TOTAL); if (this.state === "poster") { this.state = "paused"; this.el.dataset.state = "paused"; this.ui.pp.textContent = WORDS.resume; } if (this.state === "ended") { this.state = "paused"; this.el.dataset.state = "paused"; } this.draw(); this.kick(); }
    setMetal(k) {
      if (!METALS[k] || k === this.metalKey) return;
      this.metalKey = k; this.env.cache = {}; this.focusCache = {};
      this.metalBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(ORDER[i] === k)));
      this.writeText(); this.draw();
    }
    count(what) { try { if (window.goatcounter && typeof window.goatcounter.count === "function") window.goatcounter.count({ path: what + "/" + (location.pathname.split("/").pop() || "index.html"), title: WORDS.title, event: true }); } catch (x) {} }
    resize() {
      const r = this.el.getBoundingClientRect(), W = Math.max(200, Math.round(this.opts.width || r.width || 800)), H = Math.max(150, Math.round(this.opts.height || r.height || 450));
      const dpr = this.opts.dpr || Math.max(1, Math.min(window.devicePixelRatio || 1, W * H < 520000 ? 1.75 : 2) * (this.quality || 1));
      if (W === this.W && H === this.H && dpr === this.dpr) return;
      this.W = W; this.H = H; this.dpr = dpr;
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
      this.layers.forEach(l => { l.width = this.cv.width; l.height = this.cv.height; });
      this.el.dataset.portrait = W / H < 1.05 ? "1" : "0";
      this.env.cache = {}; this.focusCache = {}; this.vign = null;
    }
    layer(i) { if (!this.layers[i]) this.layers[i] = mkCanvas(this.cv.width, this.cv.height); return this.layers[i]; }
    envFor(ctx) {
      const e = Object.create(this.env);
      e.ctx = ctx; e.W = this.W; e.H = this.H; e.U = Math.min(this.W, this.H); e.dpr = this.dpr; e.lite = this.W * this.H < 520000; e.hq = this.capture; e.video = !!this.opts.video;
      e.cy = this.H * (this.W / this.H < 1.05 ? (e.video ? 0.46 : 0.4) : e.video ? 0.42 : 0.5);   /* the middle of the picture, above the captions where they are large */
      e.key = this.metalKey; e.metal = METALS[this.metalKey];
      return e;
    }
    focusOf(i) {
      const k = i + "|" + this.metalKey; if (this.focusCache[k]) return this.focusCache[k];
      let f = [this.W / 2, this.H / 2]; try { f = STAGES[i].focus(this.envFor(this.ctx)); } catch (x) {}
      return (this.focusCache[k] = f);
    }
    /* draw stage i at its own time tau into a context, under a transform */
    paint(ctx, i, tau, tf, pOver) {
      const s = STAGES[i], e = this.envFor(ctx);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (tf) tf(ctx);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      try { s.draw(e, tau, pOver == null ? clamp(tau / s.dur, -0.25, 1.25) : pOver); } catch (x) { if (window.console) console.warn("descent · " + s.id, x); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    paintLayer(n, i, tau, tf, pOver) { const L = this.layer(n), c = L.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, L.width, L.height); this.paint(c, i, tau, tf, pOver); return L; }
    composite(L, a) { if (a <= 0.003) return; const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = "source-over"; c.drawImage(L, 0, 0); c.globalAlpha = 1; }
    draw() {
      if (!this.W) return;
      const c = this.ctx, W = this.W, H = this.H, dpr = this.dpr;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.fillStyle = P.ground; c.fillRect(0, 0, this.cv.width, this.cv.height);
      const poster = this.state === "poster", t = poster ? 0 : this.t, i = stageAt(t), s = STAGES[i], tau = t - STARTS[i];
      let hud = { i, tau, p: tau / s.dur, trans: null }, bloom = BLOOM[s.id];
      if (poster) { this.paint(c, 0, this.idleT, null, 0); }
      else if (s.montage) { this.montage(tau); }
      else if (i > 0 && tau < XT / 2 && !STAGES[i - 1].montage) { const q = (tau + XT / 2) / XT; this.transition(i - 1, i, q, t); hud.trans = { a: i - 1, b: i, q }; bloom = lerp(BLOOM[STAGES[i - 1].id], bloom, sstep(0.3, 0.7, q)); }
      else if (i < STAGES.length - 1 && tau > s.dur - XT / 2 && !STAGES[i + 1].montage) { const q = (tau - (s.dur - XT / 2)) / XT; this.transition(i, i + 1, q, t); hud.trans = { a: i, b: i + 1, q }; bloom = lerp(bloom, BLOOM[STAGES[i + 1].id], sstep(0.3, 0.7, q)); }
      else this.paint(c, i, tau, null);
      this.post(poster ? BLOOM.record : bloom);
      this.hud(hud, poster);
      this.frameNo++;
    }
    transition(a, b, q, t) {
      const A = STAGES[a], B = STAGES[b], F = this.focusOf(a), W = this.W, H = this.H, Kz = B.xin || 8, e = ease(clamp(q, 0, 1));
      setQuiet(e > 0.12);
      const La = this.paintLayer(0, a, t - STARTS[a], c => { const k = Math.pow(Kz, e); c.translate(F[0], F[1]); c.scale(k, k); c.translate(-F[0], -F[1]); });
      setQuiet(e < 0.55);
      const Lb = this.paintLayer(1, b, t - STARTS[b], c => { const k = Math.pow(Kz, e - 1), x = lerp(F[0], W / 2, e), y = lerp(F[1], H / 2, e); c.translate(x, y); c.scale(k, k); c.translate(-W / 2, -H / 2); });
      setQuiet(false);
      this.composite(La, 1 - sstep(0.4, 0.92, q));
      this.composite(Lb, sstep(0.12, 0.62, q));
      const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.globalCompositeOperation = "lighter";
      const fl = Math.pow(Math.sin(Math.PI * clamp(q, 0, 1)), 2);
      stamp(c, glow(P.goldHi, true), lerp(F[0], W / 2, e), lerp(F[1], H / 2, e), Math.max(W, H) * (0.3 + 0.5 * e), 0.4 * fl);
      if (B.streaks) {
        const cx = lerp(F[0], W / 2, e), cy = lerp(F[1], H / 2, e), n = 70, R = Math.hypot(W, H);
        c.lineCap = "round";
        for (let k = 0; k < n; k++) {
          const an = TAU * hash(k, b, 1), r0 = R * (0.05 + 0.5 * frac(hash(k, b, 2) + q * 1.7)), len = R * 0.12 * fl;
          c.globalAlpha = 0.5 * fl * hash(k, b, 3); c.strokeStyle = k % 3 ? P.ink : P.goldHi; c.lineWidth = 1 + 1.5 * hash(k, b, 4);
          c.beginPath(); c.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); c.lineTo(cx + Math.cos(an) * (r0 + len), cy + Math.sin(an) * (r0 + len)); c.stroke();
        }
      }
      c.globalCompositeOperation = "source-over"; c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
    }
    /* back up through every scale, then settle on the record */
    montage(tau) {
      const u = tau / S_BACK.dur, seq = DOWN, span = 0.5, W = this.W, H = this.H;
      if (u < span + 0.04) {
        const x = (u / span) * seq.length, j = Math.min(seq.length - 1, Math.floor(x)), v = x - j;
        for (const [jj, vv] of [[j - 1, v + 1], [j, v]]) {
          if (jj < 0 || jj >= seq.length) continue;
          const si = seq[jj], S = STAGES[si], k = lerp(2.4, 0.42, vv / 2 + (jj === j ? 0 : 0)), a = jj === j ? sstep(0, 0.35, v) : 1 - sstep(0, 0.45, v);
          setQuiet(true);
          const L = this.paintLayer(jj === j ? 1 : 0, si, S.dur * 0.72 + tau, c => { c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-W / 2, -H / 2); });
          setQuiet(false);
          this.composite(L, a * (1 - sstep(span - 0.02, span + 0.04, u)));
        }
      }
      if (u > span - 0.04) {
        /* the record's own camera, run backwards from the close-up to the wide view */
        const L = this.paintLayer(0, 0, tau + 40, null, lerp(1, 0.22, ease(inv(span, 1, u))));
        this.composite(L, sstep(span - 0.04, span + 0.08, u));
      }
    }
    post(bl) {
      const c = this.ctx, cw = this.cv.width, ch = this.cv.height;
      /* bloom: the bright parts, blurred by scaling down and up, added back */
      const bw = Math.max(40, Math.round(cw / 6)), bh = Math.max(24, Math.round(ch / 6)), tw = Math.max(20, Math.round(cw / 16)), th = Math.max(12, Math.round(ch / 16));
      if (!this.b1 || this.b1.width !== bw || this.b1.height !== bh) { this.b1 = mkCanvas(bw, bh); this.b2 = mkCanvas(bw, bh); this.b3 = mkCanvas(tw, th); }
      const g1 = this.b1.getContext("2d"), g2 = this.b2.getContext("2d"), g3 = this.b3.getContext("2d");
      g1.globalCompositeOperation = "source-over"; g1.clearRect(0, 0, bw, bh); g1.drawImage(this.cv, 0, 0, bw, bh);
      g2.globalCompositeOperation = "source-over"; g2.clearRect(0, 0, bw, bh); g2.drawImage(this.b1, 0, 0); g2.globalCompositeOperation = "multiply"; g2.drawImage(this.b1, 0, 0); g2.drawImage(this.b1, 0, 0);
      g3.globalCompositeOperation = "source-over"; g3.clearRect(0, 0, tw, th); g3.drawImage(this.b2, 0, 0, tw, th);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "lighter"; c.imageSmoothingEnabled = true;
      c.globalAlpha = 0.55 * bl; c.drawImage(this.b2, 0, 0, cw, ch); c.globalAlpha = 0.5 * bl; c.drawImage(this.b3, 0, 0, cw, ch);
      c.globalCompositeOperation = "source-over";
      /* vignette */
      if (!this.vign) {
        this.vign = mkCanvas(cw, ch); const v = this.vign.getContext("2d"), R = Math.hypot(cw, ch) / 2;
        const gr = v.createRadialGradient(cw / 2, ch / 2, R * 0.45, cw / 2, ch / 2, R); gr.addColorStop(0, "rgba(10,8,6,0)"); gr.addColorStop(1, "rgba(10,8,6,0.62)");
        v.fillStyle = gr; v.fillRect(0, 0, cw, ch);
        /* a low shade where the captions sit, so the words stay readable over the brightest scales */
        const lo = v.createLinearGradient(0, ch, 0, ch * 0.62); lo.addColorStop(0, "rgba(10,8,6,0.5)"); lo.addColorStop(0.55, "rgba(10,8,6,0.2)"); lo.addColorStop(1, "rgba(10,8,6,0)");
        v.fillStyle = lo; v.fillRect(0, 0, cw, ch);
      }
      c.globalAlpha = 1; c.drawImage(this.vign, 0, 0);
    }
    hud(h, poster) {
      const ui = this.ui, set = (el, k, v) => { if (el["_" + k] !== v) { el["_" + k] = v; if (k === "text") el.textContent = v; else el.style[k] = v; } };
      const env = this.envFor(this.ctx);
      set(ui.title, "opacity", String(poster ? 1 : 1 - sstep(0.16, 0.26, this.t / S_RECORD.dur)));
      if (poster) return;
      /* on a tall screen the title and the scale share the top: the scale waits for the title to go */
      set(ui.scale, "opacity", String(this.W / this.H < 1.05 ? sstep(0.22, 0.3, this.t / S_RECORD.dur) : 1));
      const s = STAGES[h.i], p = clamp(h.tau / s.dur, 0, 1);
      /* the scale, read out */
      let sc;
      if (h.trans) {
        const A = STAGES[h.trans.a], B = STAGES[h.trans.b], sa = A.scale(env, 1), sb = B.scale(env, 0), q = clamp(h.trans.q, 0, 1);
        sc = sa.kind === sb.kind ? { kind: sa.kind, v: Math.exp(lerp(Math.log(sa.v), Math.log(sb.v), ease(q))) } : q < 0.5 ? sa : sb;
      } else if (s.montage && p < 0.5) {
        const seq = DOWN, j = Math.min(seq.length - 1, Math.floor((p / 0.5) * seq.length));
        sc = STAGES[seq[j]].scale(env, 0.72);
      } else sc = s.scale(env, p);
      set(ui.sb, "text", fmtScale(sc)); set(ui.ss, "text", sc.kind === "t" ? WORDS.unitTime : WORDS.unitSpace);
      /* the caption: each fades in at its moment and out before the next */
      const caps = s.caps(env), at = s.capAt || [0.05];
      let ci = -1; for (let k = 0; k < at.length; k++) if (p >= at[k]) ci = k;
      let op = 0;
      if (ci >= 0) { const end = ci + 1 < at.length ? at[ci + 1] : h.i === STAGES.length - 1 ? 9 : 1.02; op = sstep(at[ci], at[ci] + 0.05, p) * (1 - sstep(end - 0.045, end, p)); }
      set(ui.txt, "text", ci >= 0 ? caps[ci] || "" : ""); set(ui.cap, "opacity", String(op));
      set(ui.kick, "text", WORDS.rail[h.i]);
      let ft = WORDS.feet[s.id] ? WORDS.feet[s.id](env.metal) : "";
      if (this.W < 560 && !this.opts.video && /\. /.test(ft)) ft = ft.slice(0, ft.indexOf(". ") + 1);   /* a phone gets the first sentence; the sources are in the text under it */
      set(ui.foot, "text", ft); set(ui.foot, "display", ft ? "block" : "none");
      this.railBtns.forEach((b, k) => { const v = k === h.i ? "step" : ""; if (b._cur !== v) { b._cur = v; if (v) b.setAttribute("aria-current", v); else b.removeAttribute("aria-current"); } });
      set(ui.bar, "width", ((100 * this.t) / TOTAL).toFixed(2) + "%");
    }
    /* for recording: draw the frame at t, nothing else */
    frame(t) { if (this.state === "poster") { this.state = "paused"; this.el.dataset.state = "paused"; } this.t = clamp(t, 0, TOTAL); this.draw(); }
  }

  /* ---------------------------------------------------------------- mount */
  const players = [];
  function mount(host, opts) { if (!host || host._descent) return host && host._descent; const p = new Player(host, opts); host._descent = p; players.push(p); return p; }
  function auto() {
    document.querySelectorAll("[data-descent]").forEach(h => mount(h, { autoplay: h.getAttribute("data-descent-autoplay") || "off", metal: h.getAttribute("data-descent-metal") || "Gold", src: h.getAttribute("data-descent-src") || "record.json" }));
  }
  window.Descent = { version: VERSION, duration: TOTAL, stages: STAGES.map((s, i) => ({ id: s.id, start: STARTS[i], dur: s.dur })), mount, players, words: WORDS };
  if (!window.DESCENT_MANUAL) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto(); }
})();
