/* =========================================================================
   movement.js  ·  MOVEMENT  ·  THE FAN, THE INNER WORKINGS  ·  11 October 2026

   A film of The Fan from the inside, in ten parts, drawn in the browser:
      1  One line      the midline holds through the noise and moves only when price earns the move
      2  The noise     every bar's move, counted; the mean the stride is built on, and its memory
      3  The stride    7.5 mean bar moves, laid against the chart: the distance a close must travel
      4  The step      closes inside one stride move nothing; a close past it steps the line
      5  The flip      a stride and a half the other way turns the fan over
      6  Five rungs    the rungs, spaced so a fair walk from the midline touches each before the
                       next step 92.5, 85, 77.5, 70 and 62.5 times in 100; then what came on his chart
      7  The mirror    the same five reflected through the midline
      8  The clocks    the same engine on the 10 minute, the 2 hour and the 8 hour
      9  The week      the week's line on the record, a floor or a ceiling, graded on Friday's close
     10  The decision

   WHAT IS DATA AND WHAT IS NOT
   Parts 1 to 8 run on an illustration: a tape of 10 minute bars drawn from a seeded model in this file,
   with no price printed anywhere, and the screen says so while it runs. TradingView licenses its data
   for display only (its terms, section 3, read 11 October 2026), so his chart's own bars are not redrawn
   here. The Fan's engine runs on that tape line for line as THE_FAN_v4_5_11OCT.pine runs it: the width,
   the steps, the flips, the rungs and the clocks are the indicator's own, not a drawing of them.
   The numbers on screen that are not the engine's own constants are his:
     the rungs as his exports graded them, the 8 October 2026 scorecard (project doc THE_FAN_v4_1_TWIN.md):
       from the midline, rungs one to five came 92.7, 85.3, 79.6, 72.8, 64.9 on the 10 minute and
       91.8, 85.3, 79.2, 71.0, 61.6 on the 2 hour, against the walk's 92.5 to 62.5
     the week, read from the record itself (record.json, or CALLS when it runs on the record page):
       the newest gold row, its line, its range, its odds at the call, Friday's close and the grade.

   EVERY WORD ON SCREEN IS HIS
   The sentences come from his Method page (thesimplifier7.github.io/record/method.html, as live on
   11 October 2026), the key he approved on 10 October 2026, and one setting's description from The Fan
   itself. The labels are The Fan's own: its tags, its panel's rows and its settings, as it ships. Each
   is listed with its source between CAPTIONS-START and CAPTIONS-END below.

   BRAND LAW. The words carry no em dash, hashtag, exclamation mark, emoji, superlative or forecast.

   Mount: any element with data-movement. data-movement-autoplay="view" plays it once when it comes into
   view (never under a setting for reduced motion); anything else waits for a press. No dependency, no
   request but record.json, and on a page with GoatCounter two events by path alone, movement-play and
   movement-end. A device that cannot draw it at full resolution gets fewer pixels, never a slower clock.

   For recording: Movement.mount(el, { capture: true, video: true, width, height }) and then
   player.frame(t) for each t; every frame is a pure function of t, so a film made this way is the same
   film on any machine. Movement.cues() lists the sound design's moments for the score.
   ========================================================================= */
(function () {
  "use strict";
  if (window.Movement) return;

  /* ---------------------------------------------------------------- math */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const sstep = (a, b, v) => { const x = inv(a, b, v); return x * x * (3 - 2 * x); };
  const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeIn = x => x * x * x;
  const quint = x => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2);
  const frac = x => x - Math.floor(x);
  const win = (t, a, b, fi, fo) => sstep(a, a + (fi == null ? 0.5 : fi), t) * (1 - sstep(b - (fo == null ? 0.5 : fo), b, t));
  /* a snap with a little overshoot, for parts that click into place */
  const snap = x => { x = clamp(x, 0, 1); const c1 = 1.70158 * 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const h32 = x => { x |= 0; x = Math.imul(x ^ (x >>> 16), 0x7feb352d); x = Math.imul(x ^ (x >>> 15), 0x846ca68b); return (x ^ (x >>> 16)) >>> 0; };
  const hash = (a, b, c) => h32(h32(h32(a | 0) + (b | 0)) + (c | 0)) / 4294967296;
  const fmt = (x, d) => { const s = Math.abs(x).toFixed(d), p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return (x < 0 ? "−" : "") + p.join("."); };

  /* ---------------------------------------------------------------- the palette: The Fan's own (v4.3.1 onward) on the record's navy */
  const P = {
    ground: "#060c18", night: "#0B1730", navy: "#0f1e3a", navy2: "#14244a", navy3: "#1d3260",
    gold: "#E0A93B", goldHi: "#F2C45A", floor: "#F0D98E",
    up: "#8DB0F5", dn: "#E2574C",                     /* the fan's two colours, as the indicator draws them */
    ink: "#F3EFE6", ink3: "#C5C5C4", ink6: "#9AA4B5", ink9: "#6B7894"
  };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a.toFixed(3) + ")"; };

  /* CAPTIONS-START */
  /* Every sentence and label the film shows. Sources, each as it stood on 11 October 2026:
       M  his Method page, thesimplifier7.github.io/record/method.html
       K  the key he approved on 10 October 2026 (The Path)
       F  The Fan itself, THE_FAN_v4_5_11OCT.pine: its tags, its panel's rows, its settings and their notes
     A label built from those words names what is on screen; no sentence here is new. */
  const WORDS = {
    title: "The Fan",                                                          /* the indicator's name */
    subtitle: "The inner workings",                                            /* F: group IV · THE INNER WORKINGS */
    rail: ["One line", "The noise", "The stride", "The step", "The flip", "Five rungs", "The mirror", "The clocks", "The week", "The decision"],
    /* the sentences, each at its moment in seconds */
    caps: [
      [0.9, 5.9, "One line through the market, moved only when price earns the move."],                        /* M */
      [6.9, 11.2, "The noise stays noise."],                                                                    /* M */
      [52.4, 57.7, "The chance that a driftless walk from the midline touches the rung before the midline steps again."], /* F: the rungs' odds, its setting's note */
      [58.6, 63.3, "Its own ledger shows what its odds said and what came."],                                   /* M */
      [80.4, 86.2, "Trade the 10 minute. See the 8 hour."],                                                     /* M */
      [88.3, 95.2, "Floor: the week must close above it. Ceiling: the week must close under it. Only Friday's close counts."], /* K */
      [96.2, 102.6, "It does not tell you what to do, and it makes no forecast. It draws the structure. The decision stays yours."] /* M */
    ],
    /* the labels */
    earns: "Moved only when price earns the move",                             /* M */
    meanMove: "Mean bar move",                                                 /* F: Step threshold, mean bar moves */
    period: "Epoch period · 999 bars",                                         /* F: Epoch period, bars */
    memory: "Half the stride's memory · 346 bars",                             /* F: the memory mark's tag */
    stride: "One stride",                                                      /* F: the stride's bracket */
    strideIs: "7.5 mean bar moves",                                            /* F: Step threshold, mean bar moves, 7.5 */
    stepsAt: "Steps at",                                                       /* F: tag */
    stepUp: "10 min step up", stepDn: "10 min step down",                      /* F: the panel's rows under 2 hours */
    flipLine: "Flip line", flipDist: "1.5 strides",                            /* F: caption; the engine's 1 + band widths */
    flipDn: "10 min flip down", flipUp: "10 min flip up",                      /* F: the panel's rows */
    closes: "Closes", steps: "Steps",
    fiveRungs: "The Fan · five rungs",                                         /* F: its caption pushed in */
    said: "Said", came: "Came", c10: "10 min", c2h: "2H",                     /* M: what its odds said and what came; F: clock names */
    cameSrc: "TVC:GOLD · 10 minute and 2 hour exports · read 8 Oct 2026",
    mirror: "The mirror",                                                      /* F: group VII · THE MIRROR */
    even: "Even", step: "Step", flip: "Flip", mid: "Mid",                      /* F: tags */
    anchor: "The anchor", longView: "The long view",                           /* F: its captions pulled out, 2 hours · the anchor, 8 hours · the long view */
    tenMin: "10 minutes", thread: "The thread",                                /* F: group III · THE THREAD */
    clocks: ["10 min", "2 hours", "8 hours"],
    week: "The week", line: "The line", ceiling: "Ceiling", floorW: "Floor",   /* F: panel rows; K */
    held: "Held", hit: "Hit", wrong: "Wrong",                                  /* the record's grades, as the Friday film stamps them */
    atCall: "in 100 at the call",                                              /* F: the panel's row */
    friday: "Friday's close",                                                  /* F: tag */
    weekOf: "Week of",                                                         /* F: the panel's week label */
    open: "Graded in the open",                                                /* M: section heading */
    illus: "Illustration · no price printed",
    noData: "The record's own data could not be read on this page, so the week is not drawn.",
    url: "thesimplifier7.github.io/record",
    play: "Play", pause: "Pause", resume: "Play", replay: "Play again", length: "1 min 43 s",
    text: "Read it as text"
  };
  /* his chart's own rungs, the 8 October 2026 scorecard (THE_FAN_v4_1_TWIN.md) */
  const CAME = { m10: [92.7, 85.3, 79.6, 72.8, 64.9], h2: [91.8, 85.3, 79.2, 71.0, 61.6] };
  /* CAPTIONS-END */


  /* CORE-START */
  const CORE = (function () {
    "use strict";
    const PER = 999, EM0 = 7.5, RR = 0.60, BAND = 0.5;          /* The Fan's defaults, THE_FAN_v4_5_11OCT.pine */
    const RHO = [1, 2, 3, 4, 5].map(k => k * RR / (5 + (5 - k) * RR));   /* 0.081 0.176 0.290 0.429 0.600 */
    const ODDS = RHO.map(r => 100 / (1 + r));                    /* 92.5 85.0 77.5 70.0 62.5 */
  
    /* deterministic randomness */
    const rngOf = seed => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    /* a normal draw from twelve uniforms, Irwin and Hall: plain arithmetic only, so every browser draws the same tape
       to the last bit (Math.log and Math.cos may differ in their last place from one engine to the next) */
    const gaussOf = r => () => { let s = -6; for (let k = 0; k < 12; k++) s += r(); return s; };
  
    /* the hours of a 23 hour metals day, quiet in Asia, loud at the New York open; mean 1 */
    const HOURS = (() => {
      const raw = [0.72, 0.66, 0.63, 0.64, 0.68, 0.74, 0.82, 0.95, 1.08, 1.12, 1.10, 1.18, 1.42, 1.53, 1.38, 1.22, 1.10, 0.98, 0.88, 0.80, 0.76, 0.74, 0.73];
      const m = raw.reduce((a, b) => a + b, 0) / raw.length; return raw.map(x => x / m);
    })();
  
    /* THE TAPE: an illustration, never a price. 10 minute bars, 138 to a 23 hour day; volatility that clusters,
       fat tails, the hours of the day, and a drift that wanders slowly, so the clocks have trends to read. */
    function tape(seed, N) {
      const r = rngOf(seed), g = gaussOf(r);
      const O = new Float64Array(N), H = new Float64Array(N), L = new Float64Array(N), C = new Float64Array(N);
      let p = 2000, h = 1, z0 = 0, d1 = 0, d2 = 0;
      for (let i = 0; i < N; i++) {
        h = 0.02 + 0.06 * h * z0 * z0 + 0.92 * h;
        /* fat tails: one bar in about eighty takes a shock 2.6 times its size; unit variance kept */
        const z = g() * (r() < 0.012 ? 2.6 : 1) / 1.034;
        d1 = d1 * 0.9995 + g() * 0.0016;          /* a drift with a half life of about 1,400 bars */
        d2 = d2 * 0.99997 + g() * 0.00012;        /* and a slower one, about 23,000 bars */
        const sg = Math.sqrt(h) * HOURS[Math.floor((i % 138) / 6)];
        const ret = (d1 + d2) + sg * z;
        const o = p, c = p + ret;
        const ext = sg * (0.35 + 0.55 * Math.abs(g()));
        O[i] = o; C[i] = c; H[i] = Math.max(o, c) + ext * r(); L[i] = Math.min(o, c) - ext * r();
        p = c; z0 = z;
      }
      return { O, H, L, C, N };
    }
  
    /* the clocks: n bars folded into one */
    function fold(T, n) {
      const M = Math.floor(T.N / n), O = new Float64Array(M), H = new Float64Array(M), L = new Float64Array(M), C = new Float64Array(M);
      for (let j = 0; j < M; j++) {
        const a = j * n; let hi = -Infinity, lo = Infinity;
        for (let k = a; k < a + n; k++) { if (T.H[k] > hi) hi = T.H[k]; if (T.L[k] < lo) lo = T.L[k]; }
        O[j] = T.O[a]; C[j] = T.C[a + n - 1]; H[j] = hi; L[j] = lo;
      }
      return { O, H, L, C, N: M };
    }
  
    /* ta.ema as Pine runs it: na until `len` values, seeded with their simple mean */
    function emaPine(src, len) {
      const n = src.length, out = new Float64Array(n).fill(NaN), a = 2 / (len + 1);
      let prev = NaN, sum = 0, cnt = 0;
      for (let i = 0; i < n; i++) {
        const x = src[i];
        if (isNaN(prev)) {
          if (!isNaN(x)) { sum += x; cnt++; } else { sum = 0; cnt = 0; }
          if (cnt >= len) { prev = sum / len; out[i] = prev; } /* the first full window's mean, then on */
          if (cnt > len) { /* never: seeded at len */ }
        } else { prev = a * x + (1 - a) * prev; out[i] = prev; }
      }
      return out;
    }
  
    /* THE ENGINE, f_fan of THE_FAN_v4_5_11OCT.pine, line for line: the width W is EM0 mean bar moves as of the
       prior bar; the midline steps with the side on a close more than W past it and against it on a close more
       than 1 + BAND widths past it, landing one W behind the close; at each step the rungs freeze at RHO of W. */
    function engine(C) {
      const n = C.length, d = new Float64Array(n).fill(NaN);
      for (let i = 1; i < n; i++) d[i] = Math.abs(C[i] - C[i - 1]);
      const rng = emaPine(d, PER);
      const mid = new Float64Array(n).fill(NaN), side = new Float64Array(n).fill(NaN), wp = new Float64Array(n).fill(NaN);
      const g5 = new Float64Array(n).fill(NaN), stepped = new Uint8Array(n), flipped = new Uint8Array(n);
      let rf = NaN, fd = NaN, g = NaN;
      for (let i = 0; i < n; i++) {
        const base1 = i >= 1 && i - 1 >= 2 * PER ? rng[i - 1] : NaN;   /* base[1]: the prior bar's, from 2 x PER on */
        const w = base1 * EM0; wp[i] = w;
        const upk = !isNaN(fd) && fd < 0 ? 1 + BAND : 1, dnk = !isNaN(fd) && fd > 0 ? 1 + BAND : 1;
        let rn = NaN;
        if (!isNaN(w)) {
          const p0 = isNaN(rf) ? C[i] : rf;
          rn = C[i] > p0 && C[i] - upk * w >= p0 ? C[i] - w : C[i] <= p0 && C[i] + dnk * w <= p0 ? C[i] + w : p0;
        }
        const prev = i > 0 ? mid[i - 1] : NaN;
        rf = rn; mid[i] = rf;
        if (!isNaN(rf) && !isNaN(prev) && rf !== prev) {
          const nf = C[i] >= rf ? 1 : -1;
          if (!isNaN(fd) && nf !== fd) flipped[i] = 1;
          fd = nf; g = w * RR; stepped[i] = 1;
        }
        side[i] = fd; g5[i] = g;
      }
      return { mid, side, wp, g5, stepped, flipped, rng, n };
    }
  
    /* the lattice of a fan at bar i, by number: 0 the midline, 1 to 5 the rungs as cut, 6 to 10 their mirror,
       11 the step level, 12 the even-odds line, 13 the flip line, 14 its mirror (f_lat of the Pine) */
    function lat(E, i, k) {
      const m = E.mid[i], d = E.side[i], g5 = E.g5[i], w = E.wp[i];
      if (isNaN(m) || isNaN(d)) return NaN;
      if (k === 0) return m;
      if (k <= 5) return m - d * g5 * k / (5 + (5 - k) * RR);
      if (k <= 10) return m + d * g5 * (k - 5) / (5 + (10 - k) * RR);
      if (k === 11) return m + d * w;
      if (k === 12) return m - d * w;
      if (k === 13) return m - d * (1 + BAND) * w;
      return m + d * (1 + BAND) * w;
    }
  
    return { PER, EM0, RR, BAND, RHO, ODDS, HOURS, rngOf, gaussOf, tape, fold, emaPine, engine, lat };
  })();
  /* CORE-END */


  /* ---------------------------------------------------------------- the world: the tape, the engine on three clocks, the walks */
  /* The seed and the bar the film turns on were chosen once, on 11 October 2026, by searching seeds for a
     stretch that shows each part: a quiet range, a rally the midline follows step by step, a one bar
     collapse that flips it, and a long view that runs both ways. The tape is arithmetic only, so every
     browser draws the same bars; if one ever did not, the film takes the nearest flip down instead. */
  const SEED = 25345009, E_AT = 127731, NBARS = E_AT + 360;
  const KW = 2400;                                      /* walks drawn in part 6 */
  let WD = null;
  function world() {
    if (WD) return WD;
    const T = CORE.tape(SEED, NBARS), E = CORE.engine(T.C);
    const T2 = CORE.fold(T, 12), E2 = CORE.engine(T2.C), T8 = CORE.fold(T, 48), E8 = CORE.engine(T8.C);
    let e = E_AT;
    if (!(E.flipped[e] && E.side[e] === -1)) {
      let best = -1;
      for (let d = 1; d < 4000 && best < 0; d++) for (const c of [E_AT - d, E_AT + d]) if (c > 100000 && c < NBARS - 200 && E.flipped[c] && E.side[c] === -1) { best = c; break; }
      if (best > 0) e = best;
    }
    WD = { T, E, T2, E2, T8, E8, e, W: E.wp[e] };
    WD.walks = walks(WD);
    return WD;
  }

  /* the clocks' fans as a 10 minute bar sees them: each as it stood after its last closed bar */
  const j2of = i => Math.floor((i + 1) / 12) - 1;
  const j8of = i => Math.floor((i + 1) / 48) - 1;

  /* Part 6's walks: fair coin walks from the midline in strides, with the side positive, a bar's spread
     the tape's own (a mean bar move is a 7.5th of a stride, its spread that times the root of half pi),
     sixteen steps to a bar so a touch is not missed; each ends where the midline would step (+1) or the
     fan would flip (-1.5), and records which rungs it touched before the step. */
  function walks(w) {
    const r = CORE.rngOf(SEED ^ 0x5eed), g = CORE.gaussOf(r), sub = 16, sg = Math.sqrt(Math.PI / 2) / 7.5 / Math.sqrt(sub);
    const out = [], hit = [0, 0, 0, 0, 0];
    for (let k = 0; k < KW; k++) {
      const pts = [0]; let v = 0, lo = 0, end = 0;
      for (let b = 0; b < 700 && !end; b++) {
        for (let s = 0; s < sub; s++) {
          v += sg * g();
          if (v >= 1) { v = 1; end = 1; break; }
          if (v <= -1.5) { v = -1.5; end = -1; break; }
          if (v < lo) lo = v;
        }
        pts.push(v);
      }
      const touched = CORE.RHO.map(rho => lo <= -rho);
      touched.forEach((t, i) => { if (t) hit[i]++; });
      out.push({ pts: Float32Array.from(pts), end, touched, born: hash(k, 1, 7), lo });
    }
    out.share = hit.map(h => h / KW);
    return out;
  }

  /* ---------------------------------------------------------------- the record's newest gold row, for part 9 */
  let dataP = null;
  function loadData(src) {
    if (dataP) return dataP;
    if (window.MOVEMENT_RECORD) return (dataP = Promise.resolve(weekOf(window.MOVEMENT_RECORD.rows)));
    if (!window.fetch) return (dataP = Promise.resolve(null));
    dataP = fetch(src || "record.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : null))
      .then(j => (j ? weekOf(j.rows) : null)).catch(() => null);
    return dataP;
  }
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function weekOf(rows) {
    if (!Array.isArray(rows)) return null;
    const r = rows.find(x => x && x.metal === "Gold" && x.grammar && x.line && Array.isArray(x.box));
    if (!r) return null;
    const num = s => parseFloat(String(s).replace(/,/g, ""));
    const dt = String(r.named || "").split("-").map(Number);
    const graded = r.grade === "pass" || r.grade === "miss";
    return {
      line: String(r.line), lineN: num(r.line), ceiling: r.side === "copper",
      lo: String(r.box[0]), hi: String(r.box[1]), loN: num(r.box[0]), hiN: num(r.box[1]),
      odds: typeof r.odds === "number" ? r.odds : null,
      close: graded && r.close ? String(r.close) : null, closeN: graded && r.close ? num(r.close) : null,
      held: r.grade === "pass", hit: r.grade === "pass" && r.hit === true, graded,
      week: dt.length === 3 ? dt[2] + " " + MON[dt[1] - 1] : ""
    };
  }

  /* ---------------------------------------------------------------- the clock: ten parts on one timeline */
  const SC = [
    { id: "line", t0: 0, t1: 6.5 }, { id: "noise", t0: 6.5, t1: 16.5 }, { id: "stride", t0: 16.5, t1: 25.0 },
    { id: "step", t0: 25.0, t1: 41.0 }, { id: "flip", t0: 41.0, t1: 48.5 }, { id: "rungs", t0: 48.5, t1: 63.5 },
    { id: "mirror", t0: 63.5, t1: 70.5 }, { id: "clocks", t0: 70.5, t1: 86.5 }, { id: "week", t0: 86.5, t1: 95.5 },
    { id: "decision", t0: 95.5, t1: 103.0 }
  ];
  const TOTAL = 103.0;
  const sceneAt = t => { for (let i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; };

  /* the playhead: which 10 minute bar has just closed, counted from the bar the fan flips on (0).
     The last bar before the flip is drawn slowly, over more than a second: the collapse. */
  const PH = { A: -1250, B: -215, C: -160, D: -40 };
  const T_FLIP = 47.2;
  function playhead(t) {
    if (t < 0.4) return PH.A;
    if (t < 6.1) { const u = (t - 0.4) / 5.7; return lerp(PH.A, PH.B, u * u * (3 - 2 * u) * 0.35 + u * 0.65); }
    if (t < 25.6) return PH.B;
    if (t < 32.6) return lerp(PH.B, PH.C, (t - 25.6) / 7.0);
    if (t < 39.6) { const u = (t - 32.6) / 7.0; return lerp(PH.C, PH.D, u * u * (3 - 2 * u)); }
    if (t < 45.9) return lerp(PH.D, -1, (t - 39.6) / 6.3);
    if (t < T_FLIP) return -1 + sstep(45.9, T_FLIP, t) * 0.999999;
    return 0;
  }
  /* bars a second, for the escapement's beat */
  const speed = t => Math.abs(playhead(t + 0.02) - playhead(t - 0.02)) / 0.04;
  /* when bar r (counted from the flip) closes on screen: the first moment the playhead reaches it */
  const SEGS = [[0.4, 6.1], [25.6, 32.6], [32.6, 39.6], [39.6, 45.9], [45.9, T_FLIP]];
  function closeTime(r) {
    if (r <= PH.A) return 0;
    if (r >= 0) return r === 0 ? T_FLIP : Infinity;
    for (const [a, b] of SEGS) {
      const r0 = playhead(a), r1 = playhead(b - 1e-9);
      if (r > r0 && r <= r1 + 1e-6) { let lo = a, hi = b; for (let k = 0; k < 46; k++) { const m = (lo + hi) / 2; if (playhead(m) < r) lo = m; else hi = m; } return hi; }
    }
    return Infinity;
  }

  /* when each 10 minute step and flip shows on screen, for the sound and the escapement */
  function events() {
    const w = world(), ev = [];
    for (let r = PH.A + 1; r <= 0; r++) {
      const i = w.e + r; if (!w.E.stepped[i]) continue;
      ev.push({ t: closeTime(r), r, kind: w.E.flipped[i] ? "flip" : "step", side: w.E.side[i] });
    }
    return ev;
  }
  let EV = null;
  const evs = () => (EV || (EV = events()));
  /* the steps from bar a to bar b, both counted from the flip, inclusive */
  let CUM = null;
  function stepsBetween(a, b) {
    const w = world();
    if (!CUM) { CUM = new Int32Array(w.T.N + 1); for (let i = 1; i < w.T.N; i++) CUM[i] = CUM[i - 1] + (w.E.stepped[i] ? 1 : 0); }
    const ia = clamp(w.e + Math.ceil(a), 1, w.T.N - 1), ib = clamp(w.e + Math.floor(b), 0, w.T.N - 1);
    return ib < ia ? 0 : CUM[ib] - CUM[ia - 1];
  }

  /* ---------------------------------------------------------------- the camera */
  /* xr: the bar at the right edge, counted from the flip; nb: how many 10 minute bars across; pad: the share
     of the width left empty right of the playhead, for the fan and its tags */
  function camera(t) {
    const r = playhead(t);
    let nb, pad;
    if (t < 6.5) { nb = 900; pad = 0.06; }
    else if (t < 16.5) {
      /* in to the noise, out to the stride's memory, back */
      const a = Math.log(900), b = Math.log(110), c = Math.log(1300);
      const k = t < 9.0 ? lerp(a, b, quint(inv(6.5, 9.0, t))) : t < 12.6 ? b : t < 14.6 ? lerp(b, c, quint(inv(12.6, 14.6, t))) : c;
      nb = Math.exp(k); pad = t < 12.6 ? lerp(0.06, 0.12, inv(6.5, 9.0, t)) : 0.1;
    }
    else if (t < 25.0) { nb = Math.exp(lerp(Math.log(1300), Math.log(130), quint(inv(16.5, 18.6, t)))); pad = lerp(0.1, 0.36, ease(inv(16.5, 18.6, t))); }
    else if (t < 41.0) {
      nb = t < 32.6 ? 130 : lerp(130, 230, ease(inv(32.6, 39.6, t)));
      pad = 0.36;
    }
    else if (t < 48.5) { nb = lerp(230, 150, ease(inv(41.0, 46.0, t))); pad = 0.36; }
    else if (t < 70.5) { nb = lerp(150, 96, ease(inv(48.5, 50.5, t))); pad = lerp(0.36, 0.5, ease(inv(48.5, 50.5, t))); }
    else if (t < 86.5) {
      /* out to the long view and back: 96 bars to 9,600 and home to 230 */
      const a = Math.log(96), b = Math.log(1300), c = Math.log(9600), d = Math.log(230);
      const k = t < 73.2 ? lerp(a, b, quint(inv(70.5, 73.2, t))) : t < 74.2 ? b : t < 77.0 ? lerp(b, c, quint(inv(74.2, 77.0, t))) : t < 82.4 ? c : lerp(c, d, quint(inv(82.4, 85.6, t)));
      nb = Math.exp(k); pad = t < 82.4 ? lerp(0.5, 0.26, ease(inv(70.5, 73.2, t))) : lerp(0.26, 0.3, ease(inv(82.4, 85.6, t)));
    }
    else { nb = lerp(230, 170, ease(inv(95.5, 103, t))); pad = 0.3; }
    return { r, nb, pad, xr: r + nb * pad };
  }


  /* ---------------------------------------------------------------- the frame's layout */
  /* wide: the chart left, the instruments right; tall: the chart over the instruments over the words */
  function layout(W, H, video) {
    const U = Math.min(W, H) / 100, land = W / H >= 1.2, L = { W, H, U, land, video };
    if (land) {
      const m = W * 0.034;
      L.head = { x: m, y: H * 0.055, w: W - 2 * m, h: H * 0.1 };
      L.chart = { x: m * 0.5, y: H * 0.175, w: W * 0.635, h: H * 0.62 };
      L.inst = { x: W * 0.675, y: H * 0.175, w: W * 0.295, h: H * 0.62 };
      L.foot = { x: m, y: H * 0.955, w: W - 2 * m, h: H * 0.03 };
      L.week = { x: W * 0.06, y: H * 0.2, w: W * 0.88, h: H * 0.57 };
    } else {
      const m = W * 0.055, tall = H / W > 1.5;
      L.head = { x: m, y: H * (tall ? 0.04 : 0.035), w: W - 2 * m, h: H * 0.08 };
      L.chart = { x: m * 0.35, y: H * (tall ? 0.135 : 0.13), w: W - m * 0.7, h: H * (tall ? 0.45 : 0.43) };
      L.inst = { x: m, y: H * (tall ? 0.6 : 0.575), w: W - 2 * m, h: H * (tall ? 0.19 : 0.2) };
      L.foot = { x: m, y: H * 0.958, w: W - 2 * m, h: H * 0.03 };
      L.week = { x: m, y: H * 0.15, w: W - 2 * m, h: H * 0.62 };
    }
    /* type sizes: from the frame, never under what a phone can read */
    const px = (k, min) => Math.max(min, k * U);
    L.f = { tag: px(1.55, 9.5), lab: px(1.9, 10.5), big: px(5.6, 22), mark: px(3.6, 15), mono: px(1.65, 9.5), small: px(1.35, 9) };
    /* a tall film is watched on a phone, held at arm's length: its type is set larger */
    if (video && !land) L.f = { tag: 2.45 * U, lab: 2.8 * U, big: 7.0 * U, mark: 4.6 * U, mono: 2.45 * U, small: 2.05 * U };
    L.cap = video && !land ? 3.9 : null;
    return L;
  }

  /* ---------------------------------------------------------------- strokes, glow and type */
  function font(L, kind, size, weight) {
    const fam = kind === "mono" ? "'IBM Plex Mono',ui-monospace,Menlo,monospace" : kind === "cond" ? "'Barlow Condensed','Arial Narrow',sans-serif" : "'Barlow','Helvetica Neue',Arial,sans-serif";
    return (weight || (kind === "mono" ? 500 : 600)) + " " + size.toFixed(1) + "px " + fam;
  }
  /* text waits here while the picture is drawn, then goes on over the bloom so it stays sharp */
  let TQ = null;
  function txt(c, L, s, x, y, o) {
    o = o || {};
    const al = (o.alpha == null ? 1 : o.alpha) * c.globalAlpha;
    if (al <= 0.004) return 0;
    const size = o.size || L.f.lab, t = o.upper === false ? String(s) : String(s).toUpperCase();
    const fnt = font(L, o.kind || "cond", size, o.weight), ls = (o.ls == null ? (o.kind === "mono" ? 0.04 : 0.14) : o.ls) * size + "px";
    const q = { t, x, y, fnt, ls, al, color: o.color || P.ink, align: o.align || "left", base: o.base || "alphabetic", glow: o.glow, glowR: (o.glowR || 10) * (L.U / 10) * (o.glowK || 1) };
    c.save(); c.font = fnt; if ("letterSpacing" in c) c.letterSpacing = ls; const wd = c.measureText(t).width;
    if (TQ && !o.now) { q.tf = c.getTransform(); TQ.push(q); c.restore(); return wd; }
    c.restore(); drawText(c, q); return wd;
  }
  function drawText(c, q) {
    c.save(); if (q.tf) c.setTransform(q.tf);
    c.font = q.fnt; if ("letterSpacing" in c) c.letterSpacing = q.ls; c.textAlign = q.align; c.textBaseline = q.base; c.globalAlpha = Math.min(1, q.al); c.globalCompositeOperation = "source-over";
    if (q.glow) { c.shadowColor = q.glow; c.shadowBlur = q.glowR; }
    c.fillStyle = q.color; c.fillText(q.t, q.x, q.y); c.restore();
  }
  function holdText() { TQ = []; }
  function flushText(c) { const q = TQ || []; TQ = null; for (const k of q) drawText(c, k); }
  function measure(c, L, s, o) {
    c.save(); c.font = font(L, o.kind || "cond", o.size || L.f.lab, o.weight); if ("letterSpacing" in c) c.letterSpacing = (o.ls == null ? (o.kind === "mono" ? 0.04 : 0.14) : o.ls) * (o.size || L.f.lab) + "px";
    const w = c.measureText(o.upper === false ? s : String(s).toUpperCase()).width; c.restore(); return w;
  }
  /* a path stroked twice: a wide soft glow under a fine core */
  function glow(c, L, path, color, w, a, gw, ga) {
    if (a <= 0.004) return;
    c.save(); c.lineJoin = "round"; c.lineCap = "round";
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = color; c.globalAlpha = a * (ga == null ? 0.16 : ga); c.lineWidth = w * (gw || 5); path(); c.stroke();
    c.globalAlpha = a * (ga == null ? 0.16 : ga) * 1.6; c.lineWidth = w * (gw || 5) * 0.45; path(); c.stroke();
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = a; c.lineWidth = w; path(); c.stroke();
    c.restore();
  }
  function line(c, x1, y1, x2, y2, color, w, a, dash) {
    if (a <= 0.004) return;
    c.save(); c.strokeStyle = color; c.globalAlpha = a; c.lineWidth = w; if (dash) c.setLineDash(dash); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
  }
  /* a vertical dimension, as a drawing marks one: extension ticks, a line with an arrow at each end */
  function dimV(c, L, x, y1, y2, color, a, label, side) {
    if (a <= 0.004 || Math.abs(y2 - y1) < 4) return;
    const u = L.U, ah = Math.max(4, 0.9 * u), aw = Math.max(2.5, 0.5 * u), s = y2 > y1 ? 1 : -1;
    c.save(); c.globalAlpha = a; c.strokeStyle = color; c.fillStyle = color; c.lineWidth = Math.max(1, 0.16 * u);
    c.beginPath(); c.moveTo(x - 1.4 * u, y1); c.lineTo(x + 1.4 * u, y1); c.moveTo(x - 1.4 * u, y2); c.lineTo(x + 1.4 * u, y2); c.stroke();
    c.beginPath(); c.moveTo(x, y1 + s * ah); c.lineTo(x, y2 - s * ah); c.stroke();
    c.beginPath(); c.moveTo(x, y1); c.lineTo(x - aw, y1 + s * ah); c.lineTo(x + aw, y1 + s * ah); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x, y2); c.lineTo(x - aw, y2 - s * ah); c.lineTo(x + aw, y2 - s * ah); c.closePath(); c.fill();
    c.restore();
    if (label) {
      const lines = Array.isArray(label) ? label : [label], ym = (y1 + y2) / 2, lh = L.f.tag * 1.35;
      lines.forEach((s2, k) => txt(c, L, s2, x + (side || 1) * 1.6 * u, ym + (k - (lines.length - 1) / 2) * lh + L.f.tag * 0.35, { kind: "mono", size: L.f.tag, color, alpha: a, align: (side || 1) > 0 ? "left" : "right" }));
    }
  }

  /* ---------------------------------------------------------------- the escapement, drawn as a movement is */
  /* an escape wheel of fifteen club teeth, its pallet fork and the balance: wheel turns one tooth a step */
  function escapement(c, L, cx, cy, R, o) {
    const a = o.alpha == null ? 1 : o.alpha; if (a <= 0.004) return;
    const gold = o.color || P.gold, lw = Math.max(1, R * 0.028);
    c.save(); c.globalAlpha = a; c.lineJoin = "round"; c.lineCap = "round";
    const stroke = (w, col, al) => { c.strokeStyle = col || gold; c.lineWidth = w; c.globalAlpha = a * (al == null ? 1 : al); c.stroke(); };
    /* construction circles, as on a drawing */
    c.setLineDash([R * 0.04, R * 0.06]);
    c.beginPath(); c.arc(cx, cy, R * 1.12, 0, TAU); stroke(lw * 0.6, P.ink9, 0.5);
    c.setLineDash([]);
    /* the wheel */
    const th = o.wheel || 0, n = 15;
    c.beginPath();
    for (let k = 0; k < n; k++) {
      const b = th + k * TAU / n, r0 = R * 0.74;
      const p = (ang, rr) => [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr];
      const q1 = p(b, r0), q2 = p(b + 0.17, R), q3 = p(b + 0.26, R * 0.97), q4 = p(b + 0.33, r0);
      if (k === 0) c.moveTo(q1[0], q1[1]); else c.lineTo(q1[0], q1[1]);
      c.lineTo(q2[0], q2[1]); c.lineTo(q3[0], q3[1]); c.lineTo(q4[0], q4[1]);
      const q5 = p(b + TAU / n, r0); c.arc(cx, cy, r0, b + 0.33, b + TAU / n);
    }
    c.closePath();
    c.save(); c.shadowColor = rgba(P.gold, 0.6); c.shadowBlur = R * 0.12; stroke(lw * 1.2, gold); c.restore();
    c.beginPath(); c.arc(cx, cy, R * 0.6, 0, TAU); stroke(lw * 0.8, gold, 0.8);
    c.beginPath(); c.arc(cx, cy, R * 0.13, 0, TAU); stroke(lw * 0.9, gold);
    for (let k = 0; k < 5; k++) { const b = th + k * TAU / 5 + 0.3; c.beginPath(); c.moveTo(cx + Math.cos(b) * R * 0.13, cy + Math.sin(b) * R * 0.13);
      c.quadraticCurveTo(cx + Math.cos(b + 0.45) * R * 0.38, cy + Math.sin(b + 0.45) * R * 0.38, cx + Math.cos(b + 0.25) * R * 0.6, cy + Math.sin(b + 0.25) * R * 0.6); stroke(lw * 0.8, gold, 0.85); }
    if (o.lever !== false) {
      /* the pallet fork, pivoted right of the wheel */
      const px = cx + R * 1.55, py = cy - R * 0.08, pa = o.pallet || 0;
      const rot = (x, y) => { const dx = x - px, dy = y - py, cs = Math.cos(pa), sn = Math.sin(pa); return [px + dx * cs - dy * sn, py + dx * sn + dy * cs]; };
      const e1 = rot(cx + R * 0.86, cy - R * 0.62), e2 = rot(cx + R * 0.95, cy + R * 0.5), f1 = rot(px + R * 0.95, py - R * 0.05), f2 = rot(px + R * 1.1, py - R * 0.12), f3 = rot(px + R * 1.1, py + R * 0.02);
      c.beginPath(); c.moveTo(e1[0], e1[1]); c.lineTo(px, py); c.lineTo(e2[0], e2[1]); stroke(lw * 1.3, gold);
      c.beginPath(); c.moveTo(px, py); c.lineTo(f1[0], f1[1]); c.moveTo(f1[0], f1[1]); c.lineTo(f2[0], f2[1]); c.moveTo(f1[0], f1[1]); c.lineTo(f3[0], f3[1]); stroke(lw * 1.1, gold);
      for (const [q, s] of [[e1, -1], [e2, 1]]) { c.beginPath(); c.arc(q[0], q[1], R * 0.07, 0, TAU); c.fillStyle = P.dn; c.globalAlpha = a * 0.9; c.fill(); }
      c.beginPath(); c.arc(px, py, R * 0.06, 0, TAU); stroke(lw, gold);
      /* the balance and its hairspring */
      const bx = px + R * 2.0, by = py, bR = R * 0.82, ba = o.balance || 0;
      c.beginPath(); c.arc(bx, by, bR, 0, TAU); stroke(lw * 1.6, gold);
      c.beginPath(); c.arc(bx, by, bR * 0.9, 0, TAU); stroke(lw * 0.6, gold, 0.6);
      for (let k = 0; k < 3; k++) { const b = ba + k * TAU / 3; c.beginPath(); c.moveTo(bx + Math.cos(b) * bR * 0.12, by + Math.sin(b) * bR * 0.12); c.lineTo(bx + Math.cos(b) * bR * 0.9, by + Math.sin(b) * bR * 0.9); stroke(lw * 0.9, gold, 0.9); }
      c.beginPath(); for (let k = 0; k <= 160; k++) { const u = k / 160, rr = bR * (0.1 + 0.55 * u), an = ba * 0.6 + u * TAU * 4.2; const x = bx + Math.cos(an) * rr, y = by + Math.sin(an) * rr; if (k) c.lineTo(x, y); else c.moveTo(x, y); } stroke(lw * 0.5, P.floor, 0.65);
      c.beginPath(); c.arc(bx, by, bR * 0.1, 0, TAU); stroke(lw, gold);
    }
    c.restore();
  }

  /* ---------------------------------------------------------------- the ground: navy, a drawing's grid, its corner marks, grain */
  let GRAIN = null;
  function grain() {
    if (GRAIN) return GRAIN;
    const cv = document.createElement("canvas"); cv.width = cv.height = 192; const g = cv.getContext("2d"), im = g.createImageData(192, 192);
    for (let i = 0; i < 192 * 192; i++) { const v = Math.floor(hash(i, 3, 9) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); return (GRAIN = cv);
  }
  function ground(c, L, t) {
    const { W, H, U } = L;
    const gr = c.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.45, Math.hypot(W, H) * 0.62);
    gr.addColorStop(0, "#12224a"); gr.addColorStop(0.45, "#0b1631"); gr.addColorStop(1, P.ground);
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    /* the grid, a drawing's, drifting very slowly */
    const s = 6 * U, ox = (t * 0.6 * U) % s;
    c.save(); c.strokeStyle = "rgba(150,175,230,0.045)"; c.lineWidth = 1; c.beginPath();
    for (let x = -ox; x < W; x += s) { c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H); }
    for (let y = 0; y < H; y += s) { c.moveTo(0, Math.round(y) + 0.5); c.lineTo(W, Math.round(y) + 0.5); }
    c.stroke(); c.restore();
    /* corner marks */
    const k = 2.4 * U, m = 1.6 * U;
    c.save(); c.strokeStyle = rgba(P.ink6, 0.35); c.lineWidth = Math.max(1, 0.12 * U); c.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.moveTo(x, y + sy * k); c.lineTo(x, y); c.lineTo(x + sx * k, y); }
    c.stroke(); c.restore();
  }
  function finish(c, L, t, cw, ch, dpr) {
    /* grain, fine and moving, a film's not a screen's */
    const g = grain(), n = Math.floor(t * 24);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.045; c.globalCompositeOperation = "overlay";
    const pat = c.createPattern(g, "repeat"); const ox = Math.floor(hash(n, 1, 1) * 192), oy = Math.floor(hash(n, 2, 1) * 192);
    c.translate(-ox, -oy); c.fillStyle = pat; c.fillRect(0, 0, cw + 192, ch + 192);
    c.restore();
  }


  /* ---------------------------------------------------------------- the chart's frame: where every bar and price falls */
  function fitRaw(t, id) {
    const w = world(), cam = camera(t), s = id || SC[sceneAt(t)].id, ip = w.e + Math.floor(cam.r), W = w.W;
    if (s === "rungs" || s === "mirror") { const m = w.E.mid[w.e]; return [m - 1.85 * W, m + 1.85 * W]; }
    let lo = Infinity, hi = -Infinity;
    const a = Math.max(1, w.e + Math.floor(cam.xr - cam.nb)), b = Math.min(ip + 1, w.T.N - 1);
    for (let i = a; i <= b; i++) { if (w.T.L[i] < lo) lo = w.T.L[i]; if (w.T.H[i] > hi) hi = w.T.H[i]; }
    const inc = v => { if (!isNaN(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } };
    if (s === "stride" || s === "step" || s === "flip" || s === "decision") { inc(w.E.mid[ip]); inc(CORE.lat(w.E, ip, 11)); }
    if (s === "flip") { inc(CORE.lat(w.E, ip, 13)); }
    if (s === "clocks") { const st = Math.max(1, Math.floor((b - a) / 400)); for (let i = a; i <= b; i += st) { inc(w.E2.mid[j2of(i)]); inc(w.E8.mid[j8of(i)]); } }
    const pad = (hi - lo) * (s === "noise" ? 0.2 : s === "line" ? 0.16 : 0.13);
    return [lo - pad, hi + pad];
  }
  function yrange(t) {
    const id = SC[sceneAt(t)].id;
    let lo = 0, hi = 0, n = 0;
    for (let k = 0; k < 5; k++) { const tt = t - 0.07 * k; if (tt < 0) break; const f = fitRaw(tt, sceneAt(tt) === sceneAt(t) ? id : null); lo += f[0]; hi += f[1]; n++; }
    lo /= n; hi /= n;
    const blend = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    if (t >= 48.5 && t < 50.6) return blend(fitRaw(48.45, "flip"), [lo, hi], quint(inv(48.5, 50.6, t)));
    if (t >= 70.5 && t < 72.6) return blend(fitRaw(70.45, "mirror"), [lo, hi], quint(inv(70.5, 72.6, t)));
    return [lo, hi];
  }
  function geom(L, t) {
    const w = world(), cam = camera(t), R = L.chart, left = cam.xr - cam.nb, bw = R.w / cam.nb;
    const [lo, hi] = yrange(t);
    const xOf = i => R.x + ((i - w.e) - left + 0.5) / cam.nb * R.w;
    const yOf = p => R.y + (hi - p) / (hi - lo) * R.h;
    const ip = w.e + Math.floor(cam.r), fr = frac(cam.r);
    const i0 = Math.max(1, w.e + Math.floor(left) - 2), i1 = Math.min(w.T.N - 2, w.e + Math.ceil(cam.xr) + 1);
    const G = { w, cam, R, bw, xOf, yOf, lo, hi, ip, fr, i0, i1, xp: xOf(ip) + bw / 2, ppw: R.h / (hi - lo), t, U: L.U };
    G.m = midNow(G);
    return G;
  }

  /* ---------------------------------------------------------------- the tape: candles pushed in, a filament pulled out, the clocks' candles folded */
  function candleSet(c, L, G, O, H, Lo, C, idx, xOf, wd, a, part) {
    if (a <= 0.004) return;
    const up = new Path2D(), dn = new Path2D(), wkU = new Path2D(), wkD = new Path2D();
    const bwB = Math.max(1, wd * 0.62), hollow = wd >= 9;
    for (const [i, x, o, h, l, cl] of idx) {
      const isUp = cl >= o, y1 = G.yOf(Math.max(o, cl)), y2 = G.yOf(Math.min(o, cl)), wk = isUp ? wkU : wkD, body = isUp ? up : dn;
      wk.moveTo(x, G.yOf(h)); wk.lineTo(x, G.yOf(l));
      body.rect(x - bwB / 2, y1, bwB, Math.max(1, y2 - y1));
    }
    c.save(); c.globalAlpha = a; c.lineWidth = Math.max(1, Math.min(2, wd * 0.12));
    c.strokeStyle = rgba(P.ink, 0.75); c.stroke(wkU); c.strokeStyle = rgba(P.dn, 0.85); c.stroke(wkD);
    if (hollow) { c.fillStyle = rgba(P.ground, 0.9); c.fill(up); c.strokeStyle = rgba(P.ink, 0.92); c.lineWidth = Math.max(1, wd * 0.09); c.stroke(up); }
    else { c.fillStyle = rgba(P.ink, 0.9); c.fill(up); }
    c.fillStyle = rgba(P.dn, 0.92); c.fill(dn);
    c.restore();
  }
  function drawTape(c, L, G, o) {
    const { w, bw, xOf, ip, fr, i0 } = G, T = w.T, a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.004) return;
    const last = Math.min(ip, G.i1);
    /* the bar now forming, grown to where the playhead is */
    const part = () => { const j = ip + 1, op = T.O[j], k = clamp(fr * 1.15, 0, 1), cl = op + (T.C[j] - op) * k; return [j, xOf(j), op, Math.max(op, cl, op + (T.H[j] - op) * k), Math.min(op, cl, op + (T.L[j] - op) * k), cl]; };
    if (o.fold) {
      /* the clocks: 10 minute candles fold twelve into one 2 hour candle, four of those into one 8 hour */
      const f10 = sstep(1.5, 2.8, bw), bw2 = bw * 12, f2 = sstep(1.5, 2.8, bw2), bw8 = bw * 48;
      const R2x = J => (xOf(J * 12) + xOf(J * 12 + 11)) / 2;
      if (f10 > 0.01) {
        const idx = [];
        for (let i = i0; i <= last; i++) { const J = Math.floor(i / 12), xc = R2x(J); idx.push([i, lerp(xc, xOf(i), f10), T.O[i], T.H[i], T.L[i], T.C[i]]); }
        candleSet(c, L, G, null, null, null, null, idx, xOf, bw * lerp(4, 1, f10), a * f10);
      }
      const T2 = w.T2, T8 = w.T8, J0 = Math.floor(i0 / 12), J1 = Math.floor(last / 12) - 1;
      if ((1 - f10) * f2 > 0.01) {
        const idx = [];
        for (let J = J0; J <= J1; J++) { const K = Math.floor(J / 4), xc = (xOf(K * 48) + xOf(K * 48 + 47)) / 2; idx.push([J, lerp(xc, R2x(J), f2), T2.O[J], T2.H[J], T2.L[J], T2.C[J]]); }
        candleSet(c, L, G, null, null, null, null, idx, xOf, bw2 * lerp(3, 1, f2), a * (1 - f10) * f2);
      }
      if (1 - f2 > 0.01) {
        const idx = [], K0 = Math.floor(i0 / 48), K1 = Math.floor(last / 48) - 1;
        for (let K = K0; K <= K1; K++) idx.push([K, (xOf(K * 48) + xOf(K * 48 + 47)) / 2, T8.O[K], T8.H[K], T8.L[K], T8.C[K]]);
        candleSet(c, L, G, null, null, null, null, idx, xOf, bw8, a * (1 - f2));
      }
      return;
    }
    const fc = sstep(1.7, 3.4, bw);
    if (fc > 0.004) {
      const idx = []; for (let i = i0; i <= last; i++) idx.push([i, xOf(i), T.O[i], T.H[i], T.L[i], T.C[i]]);
      if (o.forming !== false && ip + 1 <= G.i1) idx.push(part());
      candleSet(c, L, G, null, null, null, null, idx, xOf, bw, a * fc);
    }
    if (fc > 0.996) return;
    const af = a * (1 - fc);
    /* the filament: every bar's reach as a fine haze, the closes as one bright thread */
    c.save(); c.globalAlpha = af * 0.34; c.strokeStyle = P.ink6; c.lineWidth = Math.max(1, bw * 0.9); c.beginPath();
    for (let i = i0; i <= last; i++) { const x = xOf(i); c.moveTo(x, G.yOf(T.H[i])); c.lineTo(x, G.yOf(T.L[i])); }
    c.stroke(); c.restore();
    const path = () => { c.beginPath(); for (let i = i0; i <= last; i++) { const x = xOf(i), y = G.yOf(T.C[i]); if (i === i0) c.moveTo(x, y); else c.lineTo(x, y); } };
    glow(c, L, path, P.ink, Math.max(1, 0.17 * L.U), af * 0.95, 4, 0.1);
    /* the head of the thread, where the tape is being written */
    if (o.head) { const x = xOf(last), y = G.yOf(T.C[last]); c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(x, y, 0, x, y, 3.2 * L.U); g.addColorStop(0, rgba(P.floor, 0.85 * af)); g.addColorStop(1, rgba(P.floor, 0)); c.fillStyle = g; c.fillRect(x - 4 * L.U, y - 4 * L.U, 8 * L.U, 8 * L.U); c.restore(); }
  }

  /* ---------------------------------------------------------------- a fan's lines over the bars */
  /* the value of fan E's line k at 10 minute bar i, the 2 hour and 8 hour clocks as they stood after their last closed bar */
  function lineAt(E, clk, i, k) { const j = clk === 1 ? i : clk === 12 ? j2of(i) : j8of(i); return j < 0 ? NaN : CORE.lat(E, j, k); }
  function stepPath(c, G, f, ia, ib, xs) {
    let prev = NaN, open = false;
    c.beginPath();
    for (let i = ia; i <= ib; i++) {
      const v = f(i), x1 = G.xOf(i) - G.bw / 2, x2 = G.xOf(i) + G.bw / 2;
      if (isNaN(v)) { open = false; prev = NaN; continue; }
      const y = G.yOf(v);
      if (!open) { c.moveTo(x1, y); open = true; } else if (v !== prev) c.lineTo(x1, y);
      c.lineTo(x2, y); prev = v;
    }
    if (open && xs != null && !isNaN(prev)) c.lineTo(xs, G.yOf(prev));
  }
  /* the midline at the present, the step it took on this close drawn as it happens */
  function midNow(G) {
    const { w, ip } = G, m1 = w.E.mid[ip], m0 = w.E.mid[ip - 1];
    if (!w.E.stepped[ip] || isNaN(m0)) return m1;
    const u = (G.t - closeTime(ip - w.e)) / 0.36;
    return lerp(m0, m1, snap(clamp(u, 0, 1)));
  }
  function drawMid(c, L, G, a, o) {
    if (a <= 0.004) return;
    o = o || {};
    const { w, ip, i0 } = G, m = G.m;
    const ib = Math.min(ip - 1, G.i1);
    const path = () => { stepPath(c, G, i => (isNaN(w.E.side[i]) ? NaN : w.E.mid[i]), i0, ib, null); const x1 = G.xOf(ip) - G.bw / 2, x2 = G.xOf(ip) + G.bw / 2; const yp = isNaN(w.E.mid[ip - 1]) ? G.yOf(m) : G.yOf(w.E.mid[ip - 1]); c.lineTo(x1, yp); c.lineTo(x1, G.yOf(m)); c.lineTo(x2, G.yOf(m)); };
    c.save(); c.strokeStyle = P.gold; glow(c, L, path, P.gold, Math.max(1.5, 0.3 * L.U) * (o.w || 1), a, 3.4, o.ga == null ? 0.16 : o.ga); c.restore();
    if (o.ext) { const y = G.yOf(m); line(c, G.xp, y, o.ext, y, P.gold, Math.max(1, 0.16 * L.U), a * 0.55, [0.5 * L.U, 0.7 * L.U]); }
    return m;
  }

  /* the right edge tags, kept clear of each other */
  function tags(c, L, list, x) {
    list = list.filter(q => q.a > 0.01 && !isNaN(q.y)).sort((p, q) => p.y - q.y);
    const gap = L.f.tag * 1.45;
    for (let k = 1; k < list.length; k++) if (list[k].y - list[k - 1].y < gap) list[k].y = list[k - 1].y + gap;
    for (const q of list) {
      line(c, x - 0.8 * L.U, q.y0 == null ? q.y : q.y0, x - 0.1 * L.U, q.y, q.color, 1, q.a * 0.6);
      txt(c, L, q.s, x + 0.4 * L.U, q.y + L.f.tag * 0.35, { kind: "mono", size: L.f.tag, color: q.color, alpha: q.a, ls: 0.06 });
    }
  }

  /* the light under a fan, rung by rung: from the midline's light down a step at each rung (the indicator's own) */
  const LIGHT = [0.94, 0.81, 0.69, 0.56, 0.44];
  function drawLight(c, L, G, a, unf, mirror) {
    if (a <= 0.004) return;
    const { w, i0, ip } = G, E = w.E;
    c.save();
    let i = i0;
    while (i <= ip) {
      if (isNaN(E.side[i]) || isNaN(E.mid[i])) { i++; continue; }
      let j = i; while (j + 1 <= ip && E.mid[j + 1] === E.mid[i] && E.side[j + 1] === E.side[i] && E.g5[j + 1] === E.g5[i]) j++;
      const x1 = G.xOf(i) - G.bw / 2, x2 = (j === ip ? G.xp : G.xOf(j) + G.bw / 2), col = E.side[i] > 0 ? P.up : P.dn;
      let yPrev = G.yOf(E.mid[i]);
      for (let k = 1; k <= 5; k++) {
        const m = E.mid[i], v = CORE.lat(E, i, mirror ? k + 5 : k), u = unf ? unf[k - 1] : 1, y = G.yOf(m + (v - m) * u);
        c.fillStyle = rgba(col, a * LIGHT[k - 1] * 0.2 * (mirror ? 0.34 : 1));
        c.fillRect(x1, Math.min(yPrev, y), x2 - x1, Math.abs(y - yPrev)); yPrev = y;
      }
      i = j + 1;
    }
    c.restore();
  }
  function drawRungs(c, L, G, a, unf, mirror, dotted) {
    if (a <= 0.004) return;
    const { w, i0, ip } = G, E = w.E;
    for (let k = 1; k <= 5; k++) {
      const u = unf ? unf[k - 1] : 1; if (u <= 0.002) continue;
      for (const sd of [1, -1]) {
        c.save(); c.strokeStyle = sd > 0 ? P.up : P.dn; c.globalAlpha = a * (k === 1 || k === 5 ? 0.85 : 0.6); c.lineWidth = Math.max(1, 0.13 * L.U);
        if (dotted) c.setLineDash([0.25 * L.U, 0.55 * L.U]);
        stepPath(c, G, i => (E.side[i] === sd ? E.mid[i] + (CORE.lat(E, i, mirror ? k + 5 : k) - E.mid[i]) * u : NaN), i0, ip, G.xp);
        c.stroke(); c.restore();
      }
    }
  }

  /* THE FAN at the present: its ribs from the midline to each rung, its leaf lit as the light is */
  function fanRibs(c, L, G, o) {
    const a = o.alpha; if (a <= 0.004) return;
    const { w } = G, E = w.E, i = G.ip, m = o.m == null ? E.mid[i] : o.m, W = E.wp[i] * (o.wscale || 1), g5 = E.g5[i] * (o.wscale || 1);
    const sd = o.side == null ? E.side[i] : o.side, px = G.xp, py = G.yOf(m), x2 = o.x2;
    const col = o.color || (sd > 0 ? P.up : P.dn);
    const ang = o.ang == null ? 1 : o.ang;                    /* 1 open as the fan stands, -1 swung over the midline */
    const pts = [];
    for (let k = 1; k <= 5; k++) { const v = g5 * k / (5 + (5 - k) * CORE.RR), u = o.unf ? o.unf[k - 1] : 1; pts.push([x2, G.yOf(m - sd * v * u * ang)]); }
    c.save();
    let yp = py;
    for (let k = 0; k < 5; k++) {
      c.beginPath(); c.moveTo(px, py); c.lineTo(x2, yp); c.lineTo(pts[k][0], pts[k][1]); c.closePath();
      c.fillStyle = rgba(col, a * LIGHT[k] * 0.16); c.fill(); yp = pts[k][1];
    }
    c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(px, py); c.lineTo(pts[k][0], pts[k][1]); c.strokeStyle = col; c.globalAlpha = a * (k === 0 || k === 4 ? 0.95 : 0.7); c.lineWidth = Math.max(1, 0.16 * L.U); c.stroke(); }
    c.globalCompositeOperation = "source-over";
    c.beginPath(); c.arc(px, py, Math.max(2.5, 0.5 * L.U), 0, TAU); c.fillStyle = P.goldHi; c.globalAlpha = a; c.fill();
    c.restore();
    return pts;
  }


  /* ---------------------------------------------------------------- part 2's grains: every bar's move, counted into its bin */
  const GR = { t0: 9.2, span: 3.1, fly: 0.8, nVis: 96, rain0: 12.7, rain1: 14.9, bins: 20, maxM: 4 };
  let GRD = null;
  function grains() {
    if (GRD) return GRD;
    const w = world(), B = w.e + PH.B, mean = w.E.rng[B - 1], list = [];
    const cnt = new Array(GR.bins).fill(0);
    for (let k = 0; k < 999; k++) {
      const i = B - k, d = Math.abs(w.T.C[i] - w.T.C[i - 1]), bin = Math.min(GR.bins - 1, Math.floor(d / mean / (GR.maxM / GR.bins)));
      const vis = k < GR.nVis;
      const tb = vis ? GR.t0 + (1 - k / GR.nVis) * GR.span + 0.05 * hash(k, 4, 1) : GR.rain0 + (k - GR.nVis) / (999 - GR.nVis) * (GR.rain1 - GR.rain0 - 0.5) + 0.2 * hash(k, 5, 1);
      list.push({ i, d, bin, vis, tb, slot: 0 });
    }
    list.sort((a, b) => a.tb - b.tb);
    for (const g of list) g.slot = cnt[g.bin]++;
    GRD = { list, cnt, mean, maxC: Math.max(...cnt), B };
    return GRD;
  }
  function histGeom(L) {
    const I = L.inst, g = grains(), x0 = I.x + 0.02 * I.w, x1 = I.x + I.w * 0.98, base = I.y + I.h * 0.86;
    const bwid = (x1 - x0) / GR.bins, unit = Math.min(bwid * 0.9, (I.h * 0.74) / g.maxC);
    return { x0, x1, base, bwid, unit, xm: m => x0 + (m / GR.maxM) * (x1 - x0) };
  }
  function drawNoise(c, L, G, t, a) {
    if (a <= 0.004) return;
    const g = grains(), H = histGeom(L), U = L.U;
    /* the axis, in mean bar moves */
    line(c, H.x0, H.base, H.x1, H.base, P.ink6, 1, a * 0.7);
    for (let m = 0; m <= GR.maxM; m++) { const x = H.xm(m); line(c, x, H.base, x, H.base + 0.9 * U, P.ink6, 1, a * 0.7); txt(c, L, String(m), x, H.base + 2.8 * U, { kind: "mono", size: L.f.tag, color: P.ink6, alpha: a * 0.9, align: m === 0 ? "left" : m === GR.maxM ? "right" : "center" }); }
    const land = [], flying = [];
    for (const q of g.list) {
      if (t < q.tb) continue;
      const u = (t - q.tb) / (q.vis ? GR.fly : 0.55);
      if (u >= 1) land.push(q); else flying.push([q, u]);
    }
    /* landed: each bar's move a brick in its bin, gold for the bars just seen, the rest of the memory in ink */
    const gold = new Path2D(), ink = new Path2D();
    for (const q of land) { const x = H.x0 + q.bin * H.bwid + H.bwid * 0.1, y = H.base - (q.slot + 1) * H.unit; (q.vis ? gold : ink).rect(x, y + 0.35, H.bwid * 0.8, Math.max(0.7, H.unit - 0.7)); }
    c.save(); c.globalAlpha = a; c.fillStyle = rgba(P.ink6, 0.62); c.fill(ink); c.fillStyle = P.goldHi; c.fill(gold); c.restore();
    /* in flight: the bar's own move lifted off the chart, a sliver until it lands and lies down */
    c.save(); c.globalCompositeOperation = "lighter"; c.lineCap = "round";
    for (const [q, u] of flying) {
      const e = ease(u), tx = H.x0 + (q.bin + 0.5) * H.bwid, ty = H.base - (q.slot + 0.5) * H.unit;
      const sx = clamp(G.xOf(q.i), G.R.x, G.R.x + G.R.w), y1 = G.yOf(G.w.T.C[q.i]), y0 = G.yOf(G.w.T.C[q.i - 1]);
      const sy = clamp((y0 + y1) / 2, G.R.y, G.R.y + G.R.h), len = Math.max(2, Math.abs(y1 - y0));
      const mx = lerp(sx, tx, 0.35), my = Math.min(sy, ty) - (q.vis ? 9 : 4) * U;
      const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx, y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty;
      const lie = sstep(0.72, 1, u), l = lerp(len, H.unit, lie), wd = lerp(Math.max(1.2, 0.22 * U), H.bwid * 0.8, lie);
      c.strokeStyle = q.vis ? P.goldHi : P.ink3; c.globalAlpha = a * (q.vis ? 0.95 : 0.55);
      if (lie < 0.5) { c.lineWidth = wd; c.beginPath(); c.moveTo(x, y - l / 2); c.lineTo(x, y + l / 2); c.stroke(); }
      else { c.fillStyle = c.strokeStyle; c.fillRect(x - wd / 2, y - l / 2, wd, Math.max(0.8, l)); }
    }
    c.restore();
    /* the mean the stride is built on: the engine's own average, remembering 999 bars */
    const am = a * sstep(14.2, 14.9, t), xm = H.xm(1), top = H.base - g.maxC * H.unit * 1.06;
    if (am > 0.01) {
      glow(c, L, () => { c.beginPath(); c.moveTo(xm, H.base); c.lineTo(xm, top); }, P.goldHi, Math.max(1.5, 0.28 * U), am, 5, 0.22);
      txt(c, L, WORDS.meanMove, xm + 1.2 * U, top + L.f.lab * 0.8, { size: L.f.lab, color: P.goldHi, alpha: am });
    }
  }
  /* the stride's memory along the foot of the chart: each bar's weight in the mean, the newest brightest */
  function drawMemory(c, L, G, t, a) {
    if (a <= 0.004) return;
    const w = G.w, B = w.e + PH.B, al = 2 / 1000, R = G.R, h = 1.1 * L.U, y = R.y + R.h - 2.6 * L.U;
    const xb = G.xOf(B) + G.bw / 2, xl = Math.max(R.x, G.xOf(B - 1600));
    const g = c.createLinearGradient(xl, 0, xb, 0);
    for (let s = 0; s <= 16; s++) { const x = lerp(xl, xb, s / 16), k = (xb - x) / G.bw; g.addColorStop(s / 16, rgba(P.gold, 0.9 * Math.pow(1 - al, k))); }
    c.save(); c.globalAlpha = a; c.fillStyle = g; c.fillRect(xl, y, xb - xl, h); c.restore();
    const grow = ease(inv(13.5, 15.2, t));
    for (const [k, s, col] of [[346, WORDS.memory, P.goldHi], [999, WORDS.period, P.ink3]]) {
      const x = G.xOf(B - k) + G.bw / 2; if (x < R.x + 2 * L.U) continue;
      const yt = y - (y - (R.y + R.h * (k === 346 ? 0.16 : 0.26))) * grow;
      line(c, x, yt, x, y + h, col, Math.max(1, 0.12 * L.U), a * 0.8, [0.3 * L.U, 0.45 * L.U]);
      c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y + h / 2, Math.max(2, 0.35 * L.U), 0, TAU); c.fill(); c.restore();
      const lw = measure(c, L, s, { kind: "mono", size: L.f.tag }), back = x + 0.9 * L.U + lw > R.x + R.w - L.U;
      txt(c, L, s, back ? x - 0.9 * L.U : x + 0.9 * L.U, yt + L.f.tag * 0.9, { kind: "mono", size: L.f.tag, color: col, alpha: a * sstep(0.6, 1, grow), align: back ? "right" : "left" });
    }
  }

  /* ---------------------------------------------------------------- part 3: the stride, built from the mean */
  const dimX = G => G.xp + 1.5 * G.U;
  function drawStride(c, L, G, t, a) {
    if (a <= 0.004 || t > 23.2) return;
    const w = G.w, B = w.e + PH.B, mean = w.E.rng[B - 1], m = w.E.mid[B], x = dimX(G), unit = mean * G.ppw;
    const yOf = k => G.yOf(m) - k * unit;
    /* the mean lifted from the instrument, then laid seven and a half times */
    const H = histGeom(L), lift = ease(inv(16.6, 17.9, t));
    if (lift < 1) {
      const g = grains(), sx = H.xm(1), sy = H.base - g.maxC * H.unit * 0.5, tx = x, ty = yOf(0.5);
      const xx = lerp(sx, tx, lift), yy = lerp(sy, ty, lift) - Math.sin(Math.PI * lift) * 10 * L.U, l = lerp(g.maxC * H.unit * 1.08, unit, lift);
      glow(c, L, () => { c.beginPath(); c.moveTo(xx, yy - l / 2); c.lineTo(xx, yy + l / 2); }, P.goldHi, Math.max(2, 0.55 * L.U), a, 4, 0.3);
      return;
    }
    const fadeNums = 1 - sstep(21.8, 22.6, t);
    for (let k = 0; k < 8; k++) {
      const top = k === 7 ? 7.5 : k + 1, born = 18.0 + 0.42 * k, u = clamp((t - born) / 0.22, 0, 1);
      if (u <= 0) break;
      const yb = yOf(k), yt = yOf(lerp(k, top, snap(u)));
      glow(c, L, () => { c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yt); }, k % 2 ? P.gold : P.goldHi, Math.max(2.2, 0.6 * L.U), a * (1 - sstep(22.0, 22.8, t)), 3.5, 0.28);
      line(c, x - 0.9 * L.U, yt, x + 0.9 * L.U, yt, P.goldHi, Math.max(1, 0.14 * L.U), a * u * fadeNums);
      txt(c, L, k === 7 ? "7.5" : String(k + 1), x + 1.6 * L.U, yt + L.f.tag * 0.35, { kind: "mono", size: L.f.tag, color: P.floor, alpha: a * u * fadeNums });
    }
  }
  /* the stride as the drawing's dimension, from the midline to where it next steps; from part 3 to the flip */
  function strideDim(c, L, G, t, a) {
    if (a <= 0.004) return;
    const w = G.w, sd = w.E.side[G.ip], W = w.E.rng[G.ip] * CORE.EM0, x = dimX(G);
    dimV(c, L, x, G.yOf(G.m), G.yOf(G.m + sd * W), P.floor, a, [WORDS.stride, WORDS.strideIs], 1);
  }
  function flipDim(c, L, G, t, a) {
    if (a <= 0.004) return;
    const w = G.w, sd = w.E.side[G.ip], W = w.E.wp[G.ip], x = dimX(G);
    dimV(c, L, x, G.yOf(G.m), G.yOf(G.m - sd * 1.5 * W), sd > 0 ? P.dn : P.up, a, [WORDS.flipDist], 1);
  }

  /* the level where the midline next steps, its dotted line from the past to the tags, and the stride's bracket */
  function stepLevel(G) { const w = G.w, i = G.ip, sd = w.E.side[i]; return G.m + sd * w.E.rng[i] * CORE.EM0; }
  function drawStepLevel(c, L, G, a, xTo, label) {
    if (a <= 0.004) return NaN;
    const y = G.yOf(stepLevel(G)), x0 = Math.max(G.R.x, G.xp - G.R.w * 0.42);
    line(c, x0, y, xTo, y, P.goldHi, Math.max(1, 0.15 * L.U), a * 0.85, [0.25 * L.U, 0.55 * L.U]);
    return y;
  }

  /* ---------------------------------------------------------------- part 6's walks */
  /* each walk is drawn as the chart would draw it, a bar to a step, the far end eased in so that every one
     ends on screen where it ends: at the step or at the flip */
  const WK = { t0: 50.7, spread: 3.2, speed: 34, tau: 130 };
  let WFIN = null;
  function walkFinish() {
    if (WFIN) return WFIN;
    const w = world(), fin = [[], [], [], [], []], all = [];
    for (const q of w.walks) { const tf = WK.t0 + q.born * WK.spread + (q.pts.length - 1) / WK.speed; q.tf = tf; all.push(tf); q.touched.forEach((h, k) => { if (h) fin[k].push(tf); }); }
    fin.forEach(f => f.sort((a, b) => a - b)); all.sort((a, b) => a - b);
    return (WFIN = { fin, all });
  }
  const countLE = (arr, t) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; } return lo; };
  /* every walk's path laid into one field, counted per pixel, and lit by its count: where many paths run the
     light is white, where few run it is the fan's blue */
  let WB = null;
  function drawWalks(c, L, G, t, a, x2, o) {
    if (a <= 0.004) return;
    o = o || {};
    const w = G.w, i = w.e, m = w.E.mid[i], sd = w.E.side[i], W = w.E.wp[i], R = G.R, dpr = o.dpr || 1, step = o.lite ? 2 : 1;
    walkFinish();
    const x0 = Math.floor(G.xp * dpr), y0 = Math.floor(R.y * dpr), bw = Math.max(2, Math.ceil(x2 * dpr) - x0 + 2), bh = Math.ceil(R.h * dpr) + 2;
    if (!WB || WB.w !== bw || WB.h !== bh) { const cv = mkCanvas(bw, bh); WB = { w: bw, h: bh, d: new Float32Array(bw * bh), e: new Float32Array(bw * bh), cv, g: cv.getContext("2d") }; WB.img = WB.g.createImageData(bw, bh); }
    const Dall = WB.d, Dst = WB.e; Dall.fill(0); Dst.fill(0);
    const span = x2 - G.xp, X = new Float32Array(702);
    for (let j = 0; j < 702; j++) X[j] = (G.xp + span * (1 - Math.exp(-j / WK.tau))) * dpr - x0;
    const ky = -sd * W * G.ppw * dpr, yc = G.yOf(m) * dpr - y0;          /* a walk's value to a row */
    const heads = [], ends = [];
    for (let k = 0; k < w.walks.length; k += step) {
      const q = w.walks[k], tb = WK.t0 + q.born * WK.spread; if (t < tb) continue;
      const P_ = q.pts, last = P_.length - 1, n = Math.min(last, (t - tb) * WK.speed), nf = Math.floor(n);
      let px = X[0], py = yc;
      const wt = nf >= last ? lerp(1, 0.22, sstep(q.tf + 0.4, q.tf + 2.6, t)) : 1, toStep = q.end > 0;
      const seg = (nx, ny) => {
        const dx = nx - px, dy = ny - py, st = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
        const sx = dx / st, sy = dy / st; let xx = px, yy = py;
        for (let s2 = 0; s2 < st; s2++) { xx += sx; yy += sy; const ix = xx | 0, iy = yy | 0; if (ix >= 0 && ix < bw && iy >= 0 && iy < bh) { const p = iy * bw + ix; Dall[p] += wt; if (toStep) Dst[p] += wt; } }
        px = nx; py = ny;
      };
      for (let j = 1; j <= nf; j++) seg(X[j], yc + ky * P_[j]);
      if (n > nf && nf < last) { const f = n - nf; seg(lerp(X[nf], X[nf + 1], f), yc + ky * lerp(P_[nf], P_[nf + 1], f)); heads.push(px, py); }
      else if (nf >= last && q.end && t - q.tf < 0.7) ends.push(px, py, 1 - (t - q.tf) / 0.7, q.end);
    }
    /* the light, by count: a log scale, so one path still shows and two thousand do not burn out */
    const img = WB.img, px8 = img.data, k0 = 2.2 / step, ref = Math.log(1 + 420 / step / k0);
    /* the light by count on a log scale, so one path still shows and two thousand do not burn out; its colour
       by where the paths through the pixel end: gold toward the step, the flip's own colour toward the flip */
    const cF = sd > 0 ? [226, 87, 76] : [141, 176, 245], cS = [242, 196, 90];
    for (let p = 0, n = bw * bh; p < n; p++) {
      const dv = Dall[p], o4 = p * 4;
      if (dv <= 0.02) { px8[o4 + 3] = 0; continue; }
      const v = Math.min(1, Math.log(1 + dv / k0) / ref), f = Dst[p] / dv;
      const r0 = cF[0] + (cS[0] - cF[0]) * f, g0 = cF[1] + (cS[1] - cF[1]) * f, b0 = cF[2] + (cS[2] - cF[2]) * f;
      const wv = sstep(0.62, 1, v);                                   /* where paths crowd, toward white */
      px8[o4] = r0 + (255 - r0) * wv * 0.85; px8[o4 + 1] = g0 + (250 - g0) * wv * 0.85; px8[o4 + 2] = b0 + (236 - b0) * wv * 0.85;
      px8[o4 + 3] = 255 * Math.min(1, 0.06 + 0.95 * v);
    }
    WB.g.putImageData(img, 0, 0);
    WB.g.save(); WB.g.globalCompositeOperation = "destination-out"; const fe = WB.g.createLinearGradient(bw * 0.7, 0, bw, 0); fe.addColorStop(0, "rgba(0,0,0,0)"); fe.addColorStop(1, "rgba(0,0,0,0.85)"); WB.g.fillStyle = fe; WB.g.fillRect(0, 0, bw, bh); WB.g.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "lighter"; c.globalAlpha = a; c.drawImage(WB.cv, x0, y0);
    /* the heads still walking, and the ends: gold at the step, the other colour at the flip */
    c.fillStyle = P.floor; c.globalAlpha = a * 0.3; c.beginPath();
    const hr = Math.max(0.7, 0.1 * L.U * dpr);
    for (let k = 0; k < heads.length; k += 2) { c.moveTo(heads[k] + x0 + hr, heads[k + 1] + y0); c.arc(heads[k] + x0, heads[k + 1] + y0, hr, 0, TAU); }
    c.fill();
    for (const [col, sgn] of [[P.goldHi, 1], [sd > 0 ? P.dn : P.up, -1]]) {
      c.fillStyle = col; c.globalAlpha = a * 0.9; c.beginPath();
      for (let k = 0; k < ends.length; k += 4) if (ends[k + 3] === sgn) { const r = Math.max(1, 0.34 * L.U * dpr) * (0.6 + ends[k + 2]); c.moveTo(ends[k] + x0 + r, ends[k + 1] + y0); c.arc(ends[k] + x0, ends[k + 1] + y0, r, 0, TAU); }
      c.fill();
    }
    c.restore();
  }

  /* the rungs' count: of the walks ended so far, the share that touched each rung before the step; the
     rung's own odds; and what came on his chart */
  function drawTally(c, L, t, a) {
    if (a <= 0.004) return;
    const F = walkFinish(), I = L.inst, U = L.U, fs = L.f.tag * 1.08;
    const done = countLE(F.all, t);
    let colW = Math.max(measure(c, L, "88.8", { kind: "mono", size: fs }) + 2.4 * U, 7.5 * U);
    if (!L.video) colW = Math.max(colW, measure(c, L, WORDS.c10, { kind: "mono", size: L.f.small }) + 1.6 * U);   /* a small frame: the heads need their room */
    const lx = I.x, rx = I.x + I.w, cS = rx - 3 * colW, c10 = rx - 2 * colW, c2 = rx - colW;
    const x0 = lx + 4.6 * U, x1 = cS - 2.4 * U, lo = 50, xv = v => x0 + clamp((v - lo) / (100 - lo), 0, 1) * (x1 - x0);
    const top = I.y + I.h * 0.2, rowH = Math.min(I.h * 0.13, 5.4 * U), hgt = Math.max(3, rowH * 0.34);
    const said = CORE.ODDS, dial = sstep(57.0, 57.8, t), came = sstep(59.4, 60.2, t);
    /* the heads of the columns */
    const hy = top - rowH * 0.62;
    txt(c, L, WORDS.said, cS + colW - 0.6 * U, hy, { kind: "mono", size: L.f.small, color: P.goldHi, alpha: a * dial, align: "right" });
    txt(c, L, WORDS.c10, c10 + colW - 0.6 * U, hy, { kind: "mono", size: L.f.small, color: P.floor, alpha: a * came, align: "right" });
    txt(c, L, WORDS.c2h, c2 + colW - 0.6 * U, hy, { kind: "mono", size: L.f.small, color: P.ink, alpha: a * came, align: "right" });
    txt(c, L, WORDS.came, c2 + colW - 0.6 * U, hy - L.f.small * 1.5, { kind: "mono", size: L.f.small, color: P.ink3, alpha: a * came, align: "right" });
    line(c, c10 + 0.6 * U, hy - L.f.small * 1.15, c2 + colW - 0.6 * U, hy - L.f.small * 1.15, P.ink6, 1, a * came * 0.6);
    /* the guides: 50, 60 ... 100 in 100 */
    for (let v = 50; v <= 100; v += 10) { const x = xv(v); line(c, x, top - rowH * 0.35, x, top + rowH * 4.6, P.ink9, 1, a * 0.4, [0.2 * U, 0.55 * U]); txt(c, L, String(v), x, top + rowH * 4.6 + L.f.small * 1.3, { kind: "mono", size: L.f.small, color: P.ink9, alpha: a * 0.9, align: "center" }); }
    for (let k = 0; k < 5; k++) {
      const y = top + k * rowH, share = done >= 24 ? (100 * countLE(F.fin[k], t)) / done : NaN;
      txt(c, L, "E" + (k + 1), lx, y + hgt * 0.5 + fs * 0.36, { kind: "mono", size: fs, color: P.dn, alpha: a, weight: 600 });
      c.save(); c.fillStyle = rgba(P.ink9, a * 0.28); c.fillRect(x0, y, x1 - x0, hgt); c.restore();
      if (!isNaN(share)) {
        const xs = xv(share);
        c.save(); const g = c.createLinearGradient(x0, 0, xs, 0); g.addColorStop(0, rgba(P.dn, a * 0.15)); g.addColorStop(1, rgba(P.dn, a * 0.95)); c.fillStyle = g; c.fillRect(x0, y, Math.max(0, xs - x0), hgt);
        c.globalCompositeOperation = "lighter"; c.fillStyle = rgba(P.floor, a * 0.9); c.fillRect(xs - Math.max(1, 0.12 * U), y - hgt * 0.35, Math.max(2, 0.24 * U), hgt * 1.7); c.restore();
      }
      /* the walk's odds, the rung's own */
      const xo = xv(said[k]);
      line(c, xo, y - hgt * 0.9, xo, y + hgt * 1.9, P.goldHi, Math.max(1.5, 0.26 * U), a * dial);
      txt(c, L, said[k].toFixed(1), cS + colW - 0.6 * U, y + hgt * 0.5 + fs * 0.36, { kind: "mono", size: fs, color: P.goldHi, alpha: a * dial, align: "right", weight: 600 });
      /* what came on his chart */
      for (const [v, col, x, up] of [[CAME.m10[k], P.floor, c10, false], [CAME.h2[k], P.ink, c2, true]]) {
        const xc = xv(v), yc = up ? y + hgt + 0.25 * U : y - 0.25 * U, s2 = 0.55 * U;
        c.save(); c.globalAlpha = a * came; c.fillStyle = col; c.beginPath(); c.moveTo(xc, yc); c.lineTo(xc - s2, yc + (up ? 1.6 : -1.6) * s2); c.lineTo(xc + s2, yc + (up ? 1.6 : -1.6) * s2); c.closePath(); c.fill(); c.restore();
        txt(c, L, v.toFixed(1), x + colW - 0.6 * U, y + hgt * 0.5 + fs * 0.36, { kind: "mono", size: fs, color: col, alpha: a * came, align: "right" });
      }
    }
    txt(c, L, WORDS.cameSrc, lx, top + rowH * 4.6 + L.f.small * 3.2, { kind: "mono", size: L.f.small, color: P.ink6, alpha: a * came, upper: false });
  }

  /* ---------------------------------------------------------------- part 7: the fan as a fan, its ribs at the levels' own distances */
  /* the pivot is the midline; each rib's angle is its level's distance in strides, the rungs on one side,
     the mirror on the other, the step and even-odds guards, and the flip lines outermost */
  const HF = [[13, 1.5, "Flip"], [12, 1, "Even"], [5, 0.6, "E5"], [4, 0.429, ""], [3, 0.29, ""], [2, 0.176, ""], [1, 0.081, ""], [0, 0, "Mid"],
    [6, -0.081, ""], [7, -0.176, ""], [8, -0.29, ""], [9, -0.429, ""], [10, -0.6, "E5′"], [11, -1, "Step"], [14, -1.5, "Flip′"]];
  const LIGHT_HF = [0.875, 0.75, 0.625, 0.5, 0.375];
  function drawHandFan(c, L, t, a, o) {
    if (a <= 0.004) return;
    o = o || {};
    const I = o.box || L.inst, U = L.U, sd = o.side == null ? -1 : o.side;
    const R = o.R || Math.min(I.h * 0.8, I.w * 0.44), px = I.x + I.w / 2, py = o.py == null ? I.y + I.h * 0.9 : o.py, K = (o.span || 78) * Math.PI / 180 / 1.5;
    const open = o.open == null ? 1 : o.open, mir = o.mirror == null ? 1 : o.mirror;
    const angOf = v => (v >= 0 ? v * K * open : v * K * mir) * (sd > 0 ? -1 : 1);
    const tip = (v, r) => { const an = angOf(v); return [px + Math.sin(an) * r, py - Math.cos(an) * r]; };
    const cAg = sd > 0 ? P.up : P.dn, cOpp = sd > 0 ? P.dn : P.up;
    c.save(); c.lineCap = "round";
    /* the leaf: the light between the ribs, falling a step at each rung; the mirror's at a third */
    const rungV = [0, 0.081, 0.176, 0.29, 0.429, 0.6];
    for (const [side_, scale] of [[1, 1], [-1, 0.34 * mir]]) {
      for (let k = 0; k < 5; k++) {
        const v0 = side_ * rungV[k], v1 = side_ * rungV[k + 1], A0 = angOf(v0), A1 = angOf(v1);
        const s0 = Math.min(A0, A1) - Math.PI / 2, s1 = Math.max(A0, A1) - Math.PI / 2;
        c.beginPath(); c.arc(px, py, R * 0.97, s0, s1); c.arc(px, py, R * 0.42, s1, s0, true); c.closePath();
        const g = c.createRadialGradient(px, py, R * 0.42, px, py, R);
        g.addColorStop(0, rgba(cAg, a * LIGHT_HF[k] * 0.12 * scale)); g.addColorStop(1, rgba(cAg, a * LIGHT_HF[k] * 0.5 * scale));
        c.fillStyle = g; c.fill();
      }
    }
    /* the leaf's edges, top and bottom */
    c.save(); c.strokeStyle = cAg; c.lineWidth = Math.max(1, 0.12 * U);
    for (const [v0, v1, al] of [[0, 0.6, 0.8], [-0.6, 0, 0.45 * mir]]) {
      if (al <= 0.01) continue;
      const A0 = angOf(v0) - Math.PI / 2, A1 = angOf(v1) - Math.PI / 2;
      for (const rr of [0.97, 0.42]) { c.globalAlpha = a * al; c.beginPath(); c.arc(px, py, R * rr, Math.min(A0, A1), Math.max(A0, A1)); c.stroke(); }
    }
    c.restore();
    /* the ribs */
    for (const [k, v, s] of HF) {
      if (v < 0 && mir <= 0.01) continue;
      const isMid = k === 0, guard = k >= 11, mirror = (k >= 6 && k <= 10) || k === 14;
      const col = isMid ? P.goldHi : k === 11 ? P.goldHi : k === 12 || k === 13 ? cOpp : cAg;
      const r = R * (isMid ? 1.06 : guard ? 1.0 : 0.97), [x, y] = tip(v, r);
      c.save();
      if (mirror) c.setLineDash([0.3 * U, 0.45 * U]);
      c.globalAlpha = a * (isMid ? 1 : guard ? 0.85 : k === 1 || k === 5 || k === 6 || k === 10 ? 0.95 : 0.7) * (v < 0 ? mir : 1);
      c.strokeStyle = col; c.lineWidth = Math.max(1, (isMid ? 0.34 : guard ? 0.2 : 0.16) * U);
      if (isMid) { c.shadowColor = rgba(P.gold, 0.8); c.shadowBlur = 1.4 * U; }
      c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      c.restore();
      if (s && !o.bare) {
        const [lx, ly] = tip(v, r + 2.2 * U), an = angOf(v);
        const la = k === 0 ? 1 : v < 0 ? sstep(0.7, 1, mir) : sstep(0.7, 1, open);
        txt(c, L, s, lx, ly + L.f.tag * 0.35, { kind: "mono", size: L.f.tag, color: col, alpha: a * la, align: Math.abs(an) < 0.12 ? "center" : an > 0 ? "left" : "right" });
      }
    }
    /* the rivet */
    c.beginPath(); c.arc(px, py, Math.max(2.5, 0.55 * U), 0, TAU); c.fillStyle = P.goldHi; c.globalAlpha = a; c.fill();
    c.beginPath(); c.arc(px, py, Math.max(4, 1.1 * U), 0, TAU); c.strokeStyle = P.gold; c.lineWidth = Math.max(1, 0.12 * U); c.stroke();
    c.restore();
  }

  /* ---------------------------------------------------------------- part 8: three clocks, one engine */
  let SWLO = null;
  function sweepLo() { if (SWLO == null) { const cam = camera(79.5); SWLO = Math.ceil(cam.xr - cam.nb); } return SWLO; }
  function clockSteps(t) {
    /* the steps the sweep has passed, each clock's, signed by the side they stepped on */
    const w = world(), lo = w.e + sweepLo(), sw = inv(77.2, 82.2, t);
    const cur = Math.floor(lo + sw * (w.e - lo));
    const count = (E, n) => { let s = 0, sd = 0; const a = Math.ceil(lo / n), b = Math.floor((cur + 1) / n) - 1; for (let j = a; j <= b; j++) if (E.stepped[j]) { s += E.side[j]; sd++; } return [s, sd]; };
    return { cur, sw, lo, m10: count(w.E, 1), m2: count(w.E2, 12), m8: count(w.E8, 48) };
  }
  function drawClockWheels(c, L, t, a) {
    if (a <= 0.004) return;
    const I = L.inst, cs = clockSteps(t), sizes = [0.62, 0.82, 1.0], vert = I.h > I.w * 0.9, U = L.U;
    const sets = [cs.m10, cs.m2, cs.m8];
    const Rmax = vert ? Math.min(I.w * 0.24, I.h / 7.2) : Math.min(I.h * 0.3, I.w / 8.2);
    const pos = sizes.map((s, k) => vert ? [I.x + I.w * 0.32, I.y + I.h * (0.17 + 0.32 * k)] : [I.x + I.w * (0.17 + 0.33 * k), I.y + I.h * 0.3]);
    sizes.forEach((s, k) => {
      const R = Rmax * s, [cx, cy] = pos[k], n = sets[k][1];
      escapement(c, L, cx, cy, R, { alpha: a, wheel: -(n + t * [1.6, 0.4, 0.1][k]) * TAU / 15 + 0.35 * k, lever: false, color: k === 0 ? P.goldHi : k === 1 ? P.gold : P.floor });
      const lx = vert ? cx + Rmax * 1.25 : cx, ly = vert ? cy - L.f.lab * 0.2 : cy + Rmax * 1.25 + L.f.lab;
      const role = [null, WORDS.anchor, WORDS.longView][k], al = vert ? "left" : "center";
      txt(c, L, WORDS.clocks[k], lx, ly, { size: L.f.lab, color: P.ink, alpha: a, align: al });
      if (role) txt(c, L, role, lx, ly + L.f.tag * 1.35, { size: L.f.tag, color: P.gold, alpha: a, align: al });
      const ny = ly + L.f.tag * 1.35 + L.f.lab * 1.45;
      txt(c, L, fmt(n, 0) + " " + WORDS.steps, lx, ny, { kind: "mono", size: L.f.tag, color: P.goldHi, alpha: a * sstep(77.2, 77.6, t), align: al });
    });
  }
  /* ---------------------------------------------------------------- part 9: the week, from the record */
  /* drawn to scale from the record's newest gold row: the range the week opened in, its line, a floor or a
     ceiling, and Friday's close against it, then its grade */
  function drawWeek(c, L, t, a, d) {
    if (a <= 0.004) return;
    const Wk = L.week, U = L.U;
    txt(c, L, WORDS.week, Wk.x, Wk.y + L.f.mark * 0.8, { size: L.f.mark, color: P.ink, alpha: a, weight: 700, ls: 0.12 });
    if (!d) { txt(c, L, WORDS.noData, Wk.x, Wk.y + L.f.mark * 2.2, { kind: "sans", size: L.f.lab, color: P.ink3, alpha: a, upper: false, ls: 0 }); return; }
    txt(c, L, WORDS.weekOf + " " + d.week, Wk.x, Wk.y + L.f.mark * 0.8 + L.f.lab * 1.7, { kind: "mono", size: L.f.tag * 1.1, color: P.ink6, alpha: a });
    const vals = [d.loN, d.hiN, d.lineN]; if (d.closeN != null) vals.push(d.closeN);
    let lo = Math.min(...vals), hi = Math.max(...vals); const pd = (hi - lo) * 0.45; lo -= pd; hi += pd;
    const top = Wk.y + Wk.h * 0.2, bot = Wk.y + Wk.h * 0.9, y = v => bot - ((v - lo) / (hi - lo)) * (bot - top);
    const x0 = Wk.x, x1 = Wk.x + Wk.w, xB = x0 + Wk.w * 0.15, xF = x0 + Wk.w * (L.land ? 0.7 : 0.66);
    const u1 = sstep(87.0, 87.8, t), u2 = ease(inv(87.6, 88.7, t)), u3 = ease(inv(90.4, 91.2, t)), u4 = sstep(91.6, 91.85, t), u5 = sstep(92.4, 93.2, t);
    const yl = y(d.lineN), col = d.ceiling ? P.dn : P.up;
    /* which side of the line the week must close on: the key, drawn */
    c.save(); c.globalAlpha = a * u2;
    const gz = c.createLinearGradient(0, yl, 0, d.ceiling ? bot : top); gz.addColorStop(0, rgba(P.gold, 0.16)); gz.addColorStop(1, rgba(P.gold, 0));
    c.fillStyle = gz; c.fillRect(x0, d.ceiling ? yl : top, (x1 - x0) * u2, d.ceiling ? bot - yl : yl - top); c.restore();
    /* the range of the week's first sixteen hours */
    c.save(); c.globalAlpha = a * u1; c.fillStyle = rgba(P.ink6, 0.16); c.fillRect(x0, y(d.hiN), (xB - x0) * u1, y(d.loN) - y(d.hiN));
    c.strokeStyle = rgba(P.ink6, 0.7); c.lineWidth = 1; c.setLineDash([0.3 * U, 0.35 * U]); c.strokeRect(x0, y(d.hiN), (xB - x0) * u1, y(d.loN) - y(d.hiN)); c.restore();
    txt(c, L, d.lo, x0, y(d.loN) + L.f.tag * 1.5, { kind: "mono", size: L.f.tag, color: P.ink6, alpha: a * u1 });
    if (Math.abs(y(d.hiN) - yl) > L.f.tag * 2) txt(c, L, d.hi, x0, y(d.hiN) - L.f.tag * 0.6, { kind: "mono", size: L.f.tag, color: P.ink6, alpha: a * u1 });
    /* the line, drawn across the week */
    glow(c, L, () => { c.beginPath(); c.moveTo(x0, yl); c.lineTo(x0 + (x1 - x0) * u2, yl); }, P.gold, Math.max(2, 0.42 * U), a * sstep(0, 0.05, u2), 5, 0.2);
    const lab = WORDS.line + " · " + d.line, side = d.ceiling ? WORDS.ceiling : WORDS.floorW;
    txt(c, L, lab, xB + 2 * U, yl - 1.5 * U, { size: L.f.lab * 1.25, color: P.goldHi, alpha: a * sstep(0.3, 0.8, u2), weight: 700 });
    txt(c, L, side, xB + 2 * U, yl + 1.5 * U + L.f.lab * 1.1, { size: L.f.lab * 1.25, color: P.ink, alpha: a * sstep(0.4, 0.9, u2), weight: 700 });
    if (d.odds != null) txt(c, L, d.odds + " " + WORDS.atCall, xB + 2 * U, yl + 1.5 * U + L.f.lab * 2.7, { kind: "mono", size: L.f.tag, color: P.ink3, alpha: a * sstep(0.5, 1, u2) });
    /* Friday's close */
    if (d.closeN != null) {
      const yc = y(d.closeN), yy = lerp(yl, yc, u3);
      line(c, xF, top - 1 * U, xF, bot, P.ink6, 1, a * sstep(90.2, 90.6, t) * 0.5, [0.2 * U, 0.5 * U]);
      if (u3 > 0.01) {
        dimV(c, L, xF + 4.2 * U, yl, yy, P.ink3, a * u3, null);
        c.save(); c.globalAlpha = a * sstep(0, 0.3, u3); c.fillStyle = P.ink; c.beginPath(); c.arc(xF, yy, Math.max(3, 0.8 * U), 0, TAU); c.fill();
        c.globalCompositeOperation = "lighter"; const h = c.createRadialGradient(xF, yy, 0, xF, yy, 3.5 * U); h.addColorStop(0, rgba(P.ink, 0.5)); h.addColorStop(1, rgba(P.ink, 0)); c.fillStyle = h; c.fillRect(xF - 4 * U, yy - 4 * U, 8 * U, 8 * U); c.restore();
        const above = yc < yl;
        txt(c, L, WORDS.friday, xF - 2 * U, yy + (above ? -1.2 * U - L.f.tag * 1.6 : 2.2 * U + L.f.tag), { kind: "mono", size: L.f.tag, color: P.ink3, alpha: a * sstep(0.6, 1, u3), align: "right" });
        txt(c, L, d.close, xF - 2 * U, yy + (above ? -1.2 * U : 2.2 * U + L.f.tag * 2.4), { kind: "mono", size: L.f.lab * 1.15, color: P.ink, alpha: a * sstep(0.6, 1, u3), align: "right", weight: 600 });
      }
      /* the grade, stamped */
      if (u4 > 0.004) {
        const word = d.hit ? WORDS.hit : d.held ? WORDS.held : WORDS.wrong, gc = d.held ? P.goldHi : P.dn, sc = lerp(1.7, 1, easeOut(u4));
        const sx = xF + (x1 - xF) * 0.5, sy = Math.min(yc, yl) - 6 * U;
        c.save(); c.globalAlpha = a * u4; c.translate(sx, sy); c.rotate(-0.07); c.scale(sc, sc);
        const fs = L.f.big * 0.95, wd = measure(c, L, word, { size: fs, weight: 700, ls: 0.12 }) + 3.4 * U;
        c.strokeStyle = gc; c.lineWidth = Math.max(2, 0.4 * U); c.strokeRect(-wd / 2, -fs * 0.86, wd, fs * 1.3);
        txt(c, L, word, 0, fs * 0.22, { size: fs, color: gc, align: "center", weight: 700, ls: 0.12 });
        c.restore();
      }
    }
    txt(c, L, WORDS.open, x0, Wk.y + Wk.h + L.f.lab * 0.6, { size: L.f.lab, color: P.ink6, alpha: a * u5, ls: 0.2 });
  }

  /* ---------------------------------------------------------------- the head and the foot */
  function head(c, L, t, a, status, poster) {
    if (a <= 0.004 && !poster) return;
    if (poster) a = 1;
    const Hd = L.head, i = sceneAt(t), U = L.U;
    /* the title, its letters closing in as it arrives */
    const ls = poster ? 0.2 : lerp(0.6, 0.2, easeOut(inv(0.1, 1.6, t)));
    txt(c, L, WORDS.title, Hd.x, Hd.y + L.f.big * 0.8, { size: L.f.big, color: P.ink, alpha: a, weight: 700, ls });
    const first = poster || t < 6.3;
    const sub = first ? WORDS.subtitle : String(i + 1).padStart(2, "0") + " · " + WORDS.rail[i];
    const sa = poster ? 1 : first ? (0.7 + 0.3 * sstep(0.0, 0.8, t)) * (1 - sstep(5.8, 6.3, t)) : sstep(SC[i].t0, SC[i].t0 + 0.5, t);
    txt(c, L, sub, Hd.x + 0.15 * U, Hd.y + L.f.big * 0.8 + L.f.lab * 1.6, { size: L.f.lab, color: P.gold, alpha: a * sa, ls: 0.22 });
    if (status && status.s && !poster) txt(c, L, status.s, Hd.x + Hd.w, Hd.y + L.f.big * 0.8 + L.f.lab * 1.6, { kind: "mono", size: L.f.tag * 1.1, color: status.color || P.ink3, alpha: a * (status.a == null ? 1 : status.a), align: "right" });
  }
  function foot(c, L, t, a, s) {
    if (a <= 0.004) return;
    txt(c, L, s, L.foot.x, L.foot.y + L.f.small, { kind: "mono", size: L.f.small, color: P.ink6, alpha: a * 0.85, upper: s !== WORDS.url });
  }


  /* ---------------------------------------------------------------- the frame: every part at its moment */
  /* how much of each part is on screen at t */
  function envelopes(t) {
    const end = 1 - sstep(100.4, 101.3, t);
    return {
      chart: (1 - win(t, 86.5, 96.3, 0.8, 0.8)) * end,
      wipe: inv(-0.25, 1.3, t),
      head1: win(t, 0.35, 6.4, 0.2, 0.5),
      count1: win(t, 1.0, 6.7, 0.6, 0.5),
      noise: win(t, 8.9, 18.4, 0.3, 1.4),
      memory: win(t, 13.3, 16.9, 0.7, 0.5),
      stride: t >= 16.6 && t < 23.2 ? 1 : 0,
      dim: win(t, 21.8, 48.8, 0.9, 0.7),
      stepLv: win(t, 22.6, 48.8, 0.8, 0.7),
      mid: 1,
      esc: win(t, 19.2, 48.9, 1.4, 0.9),
      count4: win(t, 25.0, 48.9, 0.7, 0.9),
      earns: win(t, 27.0, 40.6, 0.8, 0.8),
      flipLv: win(t, 41.0, T_FLIP + 0.12, 0.9, 0.14),
      gate: win(t, T_FLIP - 0.02, 49.2, 0.04, 0.9),
      fan: win(t, 48.7, 71.6, 0.3, 1.0),
      guards: win(t, 49.4, 71.4, 0.8, 1.0),
      walks: win(t, 50.6, 64.6, 0.1, 1.4),
      tally: win(t, 50.2, 63.9, 0.6, 0.6),
      mirror: win(t, 63.7, 71.4, 0.6, 1.0),
      handFan: win(t, 63.8, 70.9, 0.6, 0.6),
      h2: win(t, 71.8, 86.4, 1.0, 0.5),
      h8: win(t, 75.2, 86.4, 1.2, 0.5),
      wheels: win(t, 72.2, 86.3, 1.0, 0.7),
      week: win(t, 86.9, 96.0, 0.6, 0.7),
      present: win(t, 16.8, 70.8, 0.8, 0.8) + win(t, 96.2, 101.0, 0.6, 0.6),
      head: (0.8 + 0.2 * sstep(0.0, 0.6, t)) * (1 - sstep(100.4, 101.2, t)),
      foot: sstep(0.6, 1.6, t) * (1 - sstep(100.4, 101.2, t)),
      end: sstep(100.9, 101.9, t)
    };
  }
  /* the bloom, a little more where light is the subject */
  function bloomAt(t) {
    let b = 0.62;
    b += 0.5 * win(t, 0.0, 1.8, 0.1, 1.2);                     /* the line drawn in */
    b += 1.5 * Math.exp(-Math.max(0, t - T_FLIP) * 2.6) * (t >= T_FLIP ? 1 : 0);   /* the flip */
    b += 0.3 * win(t, 50.6, 63.0, 1.0, 2.0);                  /* the walks */
    b += 0.25 * win(t, 77.2, 82.4, 0.4, 0.6);                 /* the sweep */
    b += 0.35 * win(t, 101.2, 103.2, 0.8, 0.4);               /* the end */
    return b;
  }

  /* the fan's tip, the space beyond the present that the fan and the walks open into */
  const fanX2 = G => G.xp + (G.R.x + G.R.w - G.xp) * 0.6;
  /* the rungs, one after another, as the fan opens */
  const unfold = (t, t0) => [0, 1, 2, 3, 4].map(k => ease(inv(t0 + 0.22 * k, t0 + 0.55 + 0.22 * k, t)));

  function guides(c, L, G, a) {
    const R = G.R;
    c.save(); c.strokeStyle = rgba(P.ink6, 0.075 * a); c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 8; k++) { const y = Math.round(R.y + (R.h * k) / 8) + 0.5; c.moveTo(R.x, y); c.lineTo(R.x + R.w, y); }
    c.stroke(); c.restore();
  }
  /* a fan line's history: line k of the 10 minute fan, from the left edge to the present */
  function fanLine(c, L, G, k, color, a, o) {
    if (a <= 0.004) return;
    o = o || {};
    const E = G.w.E;
    c.save(); c.strokeStyle = color; c.globalAlpha = a; c.lineWidth = Math.max(1, (o.w || 0.14) * L.U); if (o.dash) c.setLineDash(o.dash.map(v => v * L.U));
    stepPath(c, G, i => (isNaN(E.side[i]) ? NaN : CORE.lat(E, i, k)), G.i0, G.ip, o.to == null ? G.xp : o.to);
    c.stroke(); c.restore();
  }
  /* the present: where the playhead sits on the midline */
  function present(c, L, G, a) {
    if (a <= 0.004) return;
    const x = G.xp, y = G.yOf(G.m), R = G.R;
    const g = c.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, rgba(P.gold, 0)); g.addColorStop(0.5, rgba(P.gold, 0.22 * a)); g.addColorStop(1, rgba(P.gold, 0));
    c.save(); c.fillStyle = g; c.fillRect(x - 0.5, R.y, 1, R.h);
    c.globalCompositeOperation = "lighter"; const h = c.createRadialGradient(x, y, 0, x, y, 2.6 * L.U); h.addColorStop(0, rgba(P.goldHi, 0.55 * a)); h.addColorStop(1, rgba(P.goldHi, 0));
    c.fillStyle = h; c.fillRect(x - 3 * L.U, y - 3 * L.U, 6 * L.U, 6 * L.U); c.restore();
    c.save(); c.globalAlpha = a; c.fillStyle = P.floor; c.beginPath(); c.arc(x, y, Math.max(2, 0.42 * L.U), 0, TAU); c.fill(); c.restore();
  }
  /* the step or flip just taken, for its tag */
  function lastEvent(t) { const ev = evs(); let e = null; for (const q of ev) { if (q.t <= t) e = q; else break; } return e; }

  /* ---------------------------------------------------------------- the chart */
  function chartPart(c, L, G, t, A, o) {
    const w = G.w, E = w.E, R = G.R, U = L.U, ip = G.ip, sd = E.side[ip], W = E.wp[ip], m = G.m;
    c.save();
    /* part 1 draws the past in from the left, its front lit */
    const wipeX = R.x + R.w * easeOut(A.wipe) + 1;
    c.beginPath(); c.rect(R.x, R.y - 2 * U, Math.max(0, Math.min(R.w, wipeX - R.x)) , R.h + 4 * U); c.clip();
    guides(c, L, G, 1);

    /* the light under the fan and its mirror */
    if (A.fan > 0.004) drawLight(c, L, G, A.fan, unfold(t, 48.9), false);
    if (A.mirror > 0.004) drawLight(c, L, G, A.mirror, unfold(t, 64.0), true);

    /* the long view and the anchor, behind the bars */
    const fold = t >= 70.5 && t < 86.6;
    if (A.h2 > 0.004 || A.h8 > 0.004) drawClockLinesBy(c, L, G, t, A);

    /* the bars */
    drawTape(c, L, G, { alpha: 1, fold, forming: t < T_FLIP, head: A.head1 > 0.01 });

    /* the fan's rungs and its mirror's */
    if (A.fan > 0.004) drawRungs(c, L, G, A.fan, unfold(t, 48.9), false, false);
    if (A.mirror > 0.004) drawRungs(c, L, G, A.mirror, unfold(t, 64.0), true, true);
    /* the guards: the step, even odds and the flip, and the flip's own mirror */
    if (A.guards > 0.004) {
      fanLine(c, L, G, 11, P.goldHi, A.guards * 0.8, { dash: [0.25, 0.55] });
      fanLine(c, L, G, 12, sd > 0 ? P.dn : P.up, A.guards * 0.55, { dash: [0.6, 0.5] });
      fanLine(c, L, G, 13, sd > 0 ? P.dn : P.up, A.guards * 0.85, { dash: [0.25, 0.55] });
      if (A.mirror > 0.004) fanLine(c, L, G, 14, sd > 0 ? P.up : P.dn, A.mirror * 0.7, { dash: [0.25, 0.55] });
    }
    /* parts 3 to 5: where the midline next steps, and the flip line */
    if (A.stepLv > 0.004) fanLine(c, L, G, 11, P.goldHi, A.stepLv * 0.85, { dash: [0.25, 0.55], w: 0.15 });
    if (A.flipLv > 0.004) fanLine(c, L, G, 13, P.dn, A.flipLv * 0.9, { dash: [0.25, 0.55], w: 0.17 });

    /* the midline */
    const thin = t >= 70.5 && t < 86.6 ? lerp(1, 0.45, sstep(2.0, 0.3, G.bw)) : 1;
    drawMid(c, L, G, A.mid, { w: thin, ga: t < 2 ? 0.3 : 0.16 });

    /* the wipe's lit front */
    if (A.wipe < 1) {
      const gx = wipeX, fa = 1 - sstep(0.75, 1, A.wipe), g = c.createLinearGradient(gx - 2.2 * U, 0, gx, 0); g.addColorStop(0, rgba(P.goldHi, 0)); g.addColorStop(1, rgba(P.goldHi, 0.35 * fa));
      c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(gx - 2.2 * U, R.y, 2.2 * U, R.h);
      const v = c.createLinearGradient(0, R.y, 0, R.y + R.h); v.addColorStop(0, rgba(P.floor, 0)); v.addColorStop(0.5, rgba(P.floor, 0.9 * fa)); v.addColorStop(1, rgba(P.floor, 0));
      c.fillStyle = v; c.fillRect(gx - 1, R.y, 2, R.h); c.restore();
    }
    c.restore();

    /* the fan itself at the present: the ribs, opening */
    if (A.fan > 0.004) {
      const x2 = fanX2(G), rib = A.fan * lerp(1, 0.32, sstep(50.4, 51.6, t)) * (1 - 0.5 * A.mirror);
      fanRibs(c, L, G, { alpha: rib, x2, unf: unfold(t, 48.9) });
      if (A.mirror > 0.004) {
        c.save(); c.setLineDash([0.3 * U, 0.45 * U]);
        fanRibs(c, L, G, { alpha: A.mirror * 0.55, x2, unf: unfold(t, 64.0), ang: -1 });
        c.restore();
      }
      /* the levels carried on past the fan to their tags */
      for (let k = 1; k <= 5; k++) {
        const u = unfold(t, 48.9)[k - 1], y = G.yOf(CORE.lat(E, ip, k));
        line(c, G.xp, y, R.x + R.w - 0.6 * U, y, sd > 0 ? P.up : P.dn, 1, A.fan * u * 0.35 * sstep(50.2, 51.2, t), [0.2 * U, 0.6 * U]);
      }
      if (A.mirror > 0.004) for (let k = 6; k <= 10; k++) {
        const u = unfold(t, 64.0)[k - 6], y = G.yOf(CORE.lat(E, ip, k));
        line(c, G.xp, y, R.x + R.w - 0.6 * U, y, sd > 0 ? P.up : P.dn, 1, A.mirror * u * 0.3, [0.15 * U, 0.7 * U]);
      }
    }
    /* part 5: the fan swings over, and the close that did it rings out */
    if (A.gate > 0.004) gateSwing(c, L, G, t, A.gate);
    if (t >= T_FLIP && t < T_FLIP + 1.6) {
      const x = G.xOf(w.e), y = G.yOf(w.T.C[w.e]), yf = G.yOf(E.mid[w.e - 1] - 1.5 * E.wp[w.e]);
      c.save(); c.globalCompositeOperation = "lighter";
      for (let k = 0; k < 3; k++) {
        const u = clamp((t - T_FLIP - k * 0.12) / 1.1, 0, 1); if (u <= 0 || u >= 1) continue;
        const r = easeOut(u) * 26 * U, al = (1 - u) * (1 - u) * 0.75;
        c.strokeStyle = k ? P.dn : P.floor; c.globalAlpha = al; c.lineWidth = Math.max(1, (0.5 - 0.12 * k) * U * (1 - u) + 0.6);
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      }
      /* the flip line itself flashes along its length */
      const uf = clamp((t - T_FLIP) / 0.9, 0, 1), fl = (1 - uf) * (1 - uf);
      const g = c.createLinearGradient(R.x, 0, x, 0); g.addColorStop(0, rgba(P.dn, 0)); g.addColorStop(1, rgba(P.dn, 0.9 * fl));
      c.fillStyle = g; c.fillRect(R.x, yf - 0.25 * U, x - R.x, 0.5 * U);
      const h = c.createRadialGradient(x, y, 0, x, y, 9 * U); h.addColorStop(0, rgba(P.floor, 0.7 * fl)); h.addColorStop(1, rgba(P.dn, 0)); c.fillStyle = h; c.fillRect(x - 9 * U, y - 9 * U, 18 * U, 18 * U);
      c.restore();
    }
    /* part 6: the walks */
    if (A.walks > 0.004) drawWalks(c, L, G, t, A.walks, fanX2(G), { lite: !!(o && o.lite), dpr: (o && o.dpr) || 1 });
    /* part 2: each bar's weight in the mean */
    if (A.memory > 0.004) drawMemory(c, L, G, t, A.memory);
    present(c, L, G, A.present);
  }

  /* the 2 hour and 8 hour fans over the same bars, each as a 10 minute bar sees it */
  function drawClockLinesBy(c, L, G, t, A) {
    const w = G.w, U = L.U;
    const sets = [[w.E8, 48, A.h8, 1.7], [w.E2, 12, A.h2, 1.15]];
    for (const [E, n, a, wd] of sets) {
      if (a <= 0.004) continue;
      const jOf = n === 12 ? j2of : j8of;
      const lv = (i, k, sd) => { const j = jOf(i); if (j < 0 || isNaN(E.side[j]) || (sd && E.side[j] !== sd)) return NaN; return CORE.lat(E, j, k); };
      for (const [k, dash, aa, lw] of [[13, [0.25, 0.6], 0.6, 0.13], [5, null, 0.5, 0.12], [0, null, 1, 0.3]]) {
        for (const sd of k === 0 ? [0] : [1, -1]) {
          c.save(); c.globalAlpha = a * aa; c.lineWidth = Math.max(1, lw * U * wd); if (dash) c.setLineDash(dash.map(v => v * U));
          c.strokeStyle = k === 0 ? (n === 48 ? P.ink : P.gold) : k === 13 ? (sd > 0 ? P.dn : P.up) : (sd > 0 ? P.up : P.dn);
          if (k === 0) { c.shadowColor = rgba(n === 48 ? P.ink : P.gold, 0.6); c.shadowBlur = 1.4 * U; }
          stepPath(c, G, i => lv(i, k, sd), G.i0, G.ip, k === 0 ? G.xp : null);
          c.stroke(); c.restore();
        }
      }
    }
    /* the sweep: a line crossing the long view, the clocks ticking as it passes their steps */
    const sw = inv(77.2, 82.2, t);
    if (sw > 0 && sw < 1) {
      const R = G.R, cs = clockSteps(t), x = G.xOf(cs.cur), fade = win(t, 77.2, 82.2, 0.3, 0.3);
      c.save(); c.globalCompositeOperation = "lighter";
      const g = c.createLinearGradient(x - 10 * U, 0, x, 0); g.addColorStop(0, rgba(P.gold, 0)); g.addColorStop(1, rgba(P.gold, 0.16 * fade));
      c.fillStyle = g; c.fillRect(x - 10 * U, R.y, 10 * U, R.h); c.restore();
      line(c, x, R.y, x, R.y + R.h, P.goldHi, Math.max(1, 0.16 * U), 0.85 * fade);
    }
  }

  /* part 5: the moment the fan flips, its ribs swing over the midline */
  function gateSwing(c, L, G, t, a) {
    const w = G.w, E = w.E, e = w.e, u = clamp((t - T_FLIP) / 0.75, 0, 1), k = ease(u);
    const m0 = E.mid[e - 1], m1 = E.mid[e], x2 = G.xp + (G.R.x + G.R.w - G.xp) * 0.55;
    for (let g = 5; g >= 0; g--) {
      const ug = clamp(u - g * 0.035, 0, 1), kg = ease(ug), al = g ? (1 - g / 6) * 0.22 : 1;
      fanRibs(c, L, G, { alpha: a * al * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, ug * 1.15))), m: lerp(m0, m1, kg), side: 1, ang: lerp(1, -1, kg), x2, color: kg < 0.5 ? P.up : P.dn });
    }
  }

  /* ---------------------------------------------------------------- the instruments */
  function escBox(L) {
    const I = L.inst, vert = I.h > I.w * 0.9;
    const R = vert ? Math.min(I.w / 5.9, I.h * 0.22) : Math.min(I.h / 2.7, (I.w * 0.6) / 5.7);
    const cx = I.x + 1.25 * R, cy = vert ? I.y + 1.35 * R : I.y + I.h / 2;
    const tx = vert ? I.x : cx + 4.7 * R, ty = vert ? cy + 2.2 * R : I.y + I.h * 0.24, tw = vert ? I.w : I.x + I.w - tx;
    return { R, cx, cy, tx, ty, tw, vert };
  }
  /* the escapement's state: the wheel turns a tooth at each step, back the other way after the flip;
     the fork and balance beat once a close */
  function escState(t) {
    const ev = evs(); let teeth = 0, kick = 0;
    for (const q of ev) {
      if (q.t > t) break;
      const u = snap(clamp((t - q.t) / 0.2, 0, 1)), dir = q.kind === "flip" ? -3 : q.side > 0 ? 1 : -1;
      teeth += dir * u;
      kick = Math.max(kick, Math.exp(-(t - q.t) * 7));
    }
    const r = playhead(t), sp = speed(t), amp = clamp(1.3 - sp / 18, 0.25, 1);
    const flip = t >= T_FLIP ? Math.exp(-(t - T_FLIP) * 3.2) : 0;
    return {
      wheel: -teeth * TAU / 15,
      pallet: 0.11 * Math.tanh(3 * Math.sin(Math.PI * r)) * amp + 0.3 * flip * Math.sin((t - T_FLIP) * 22),
      balance: 1.5 * Math.sin(Math.PI * r) * amp + 0.16 * Math.sin(TAU * 0.9 * t) + 2.2 * flip * Math.sin((t - T_FLIP) * 9),
      kick, flip
    };
  }
  function counters(c, L, x, y, closes, steps, a, size, gap, flash) {
    if (a <= 0.004) return;
    const U = L.U;
    gap = Math.max(gap, measure(c, L, "8,888", { kind: "mono", size, weight: 500, ls: 0 }) + 4 * U);
    txt(c, L, WORDS.closes, x, y, { kind: "mono", size: L.f.tag, color: P.ink6, alpha: a });
    txt(c, L, fmt(closes, 0), x, y + size * 1.02, { kind: "mono", size, color: P.ink, alpha: a, weight: 500, ls: 0 });
    txt(c, L, WORDS.steps, x + gap, y, { kind: "mono", size: L.f.tag, color: P.goldHi, alpha: a });
    txt(c, L, fmt(steps, 0), x + gap, y + size * 1.02, { kind: "mono", size, color: P.goldHi, alpha: a, weight: 600, ls: 0, glow: flash > 0.02 ? rgba(P.goldHi, flash) : null, glowR: 30 });
  }
  function instruments(c, L, G, t, A, o) {
    const I = L.inst, U = L.U;
    /* part 1: the closes against the steps, counted as the tape is written */
    if (A.count1 > 0.004) {
      const r = playhead(t), n = Math.max(0, Math.floor(r) - PH.A), s = stepsBetween(PH.A + 1, Math.floor(r));
      const size = Math.min(L.f.big * 1.05, I.h * 0.3), vert = I.h > I.w * 0.9;
      counters(c, L, I.x, I.y + (vert ? I.h * 0.1 : I.h * 0.16), n, s, A.count1, size, vert ? I.w * 0.5 : Math.min(I.w * 0.42, 22 * U), 0);
      /* every close a mark, the ones that moved the line in gold */
      const w = world(), y0 = I.y + (vert ? I.h * 0.42 : I.h * 0.62), h = vert ? I.h * 0.16 : I.h * 0.24, N = PH.B - PH.A, upTo = Math.floor(r);
      const xOfN = k => I.x + (k / N) * I.w;
      c.save(); c.globalAlpha = A.count1;
      c.fillStyle = rgba(P.ink6, 0.32); c.beginPath();
      for (let r2 = PH.A + 1; r2 <= upTo; r2 += 1) { const x = xOfN(r2 - PH.A); c.rect(x, y0 + h * 0.3, Math.max(0.6, I.w / N * 0.55), h * 0.4); }
      c.fill();
      c.fillStyle = P.goldHi; c.beginPath();
      for (let r2 = PH.A + 1; r2 <= upTo; r2 += 1) if (w.E.stepped[w.e + r2]) { const x = xOfN(r2 - PH.A); c.rect(x - 0.4, y0, Math.max(1.4, 0.2 * U), h); }
      c.fill();
      c.globalCompositeOperation = "lighter"; const hx = xOfN(upTo - PH.A), g = c.createRadialGradient(hx, y0 + h / 2, 0, hx, y0 + h / 2, 3 * U); g.addColorStop(0, rgba(P.floor, 0.6)); g.addColorStop(1, rgba(P.floor, 0)); c.fillStyle = g; c.fillRect(hx - 3 * U, y0 + h / 2 - 3 * U, 6 * U, 6 * U);
      c.restore();
    }
    /* part 2: the noise counted */
    if (A.noise > 0.004 && G) drawNoise(c, L, G, t, A.noise * (t > 16.5 ? 1 : 1));
    /* parts 3 to 5: the escapement */
    if (A.esc > 0.004) {
      const B = escBox(L), s = escState(t), a = A.esc;
      if (s.kick > 0.01 || s.flip > 0.01) {
        c.save(); c.globalCompositeOperation = "lighter"; const rr = B.R * 2.2, g = c.createRadialGradient(B.cx, B.cy, 0, B.cx, B.cy, rr);
        g.addColorStop(0, rgba(s.flip > 0.01 ? P.dn : P.goldHi, a * Math.min(0.5, 0.18 * s.kick + 0.5 * s.flip))); g.addColorStop(1, rgba(P.gold, 0)); c.fillStyle = g; c.fillRect(B.cx - rr, B.cy - rr, rr * 2, rr * 2); c.restore();
      }
      escapement(c, L, B.cx, B.cy, B.R, { alpha: a, wheel: s.wheel, pallet: s.pallet, balance: s.balance, color: t >= T_FLIP ? P.gold : P.goldHi });
      const r = playhead(t), n = Math.max(0, Math.floor(r) - PH.B), st = stepsBetween(PH.B + 1, Math.floor(r));
      const size = B.vert ? Math.min(L.f.big, B.tw * 0.14) : Math.min(L.f.big * 0.9, I.h * 0.24);
      counters(c, L, B.tx, B.ty, n, st, A.count4, size, B.vert ? B.tw * 0.5 : B.tw * 0.5, s.kick);
      if (A.earns > 0.004) {
        const one = measure(c, L, WORDS.earns, { size: L.f.lab, ls: 0.16 }) <= B.tw - U;
        const k = WORDS.earns.indexOf(" when "), lines = one ? [WORDS.earns] : [WORDS.earns.slice(0, k + 5), WORDS.earns.slice(k + 6)];
        lines.forEach((s2, j) => txt(c, L, s2, B.tx, B.ty + size * 1.02 + L.f.lab * (2.1 + 1.3 * j), { size: L.f.lab, color: P.gold, alpha: A.earns, ls: 0.16 }));
      }
    }
    /* part 6: the walks counted */
    if (A.tally > 0.004) drawTally(c, L, t, A.tally);
    /* part 7: the fan as a fan */
    if (A.handFan > 0.004) {
      const I2 = L.inst, vert = I2.h > I2.w * 0.9;
      const box = vert ? { x: I2.x, y: I2.y + I2.h * 0.06, w: I2.w, h: I2.h * 0.6 } : I2;
      drawHandFan(c, L, t, A.handFan, { box, open: ease(inv(63.8, 64.9, t)), mirror: ease(inv(64.7, 66.0, t)), side: -1 });
    }
    /* part 8: three clocks */
    if (A.wheels > 0.004) drawClockWheels(c, L, t, A.wheels);
  }

  /* ---------------------------------------------------------------- the tags at the present */
  function chartTags(c, L, G, t, A) {
    const w = G.w, E = w.E, ip = G.ip, sd = E.side[ip], W = E.wp[ip], m = G.m, U = L.U, list = [];
    const cAg = sd > 0 ? P.up : P.dn, cOpp = sd > 0 ? P.dn : P.up;
    let tx = G.xp + 1.8 * U;
    if (A.fan > 0.05 || A.mirror > 0.05) tx = lerp(tx, fanX2(G) + 1.4 * U, sstep(49.0, 50.4, t));
    const add = (y, s, color, a) => { if (a > 0.01 && !isNaN(y)) list.push({ y: G.yOf(y), y0: G.yOf(y), s, color, a }); };
    /* the midline, or the step it just took */
    const ev = lastEvent(t), flash = ev && t < 49 ? 1 - sstep(ev.t + 0.9, ev.t + 1.5, t) : 0;
    const midS = flash > 0.5 && ev ? (ev.kind === "flip" ? (ev.side > 0 ? WORDS.flipUp : WORDS.flipDn) : ev.side > 0 ? WORDS.stepUp : WORDS.stepDn) : WORDS.mid;
    const midA = (t >= 16.8 && t < 71.6 ? 1 : 0) * (t > 70.5 ? 1 - sstep(70.5, 71.5, t) : sstep(16.8, 17.6, t));
    add(m, midS, flash > 0.5 ? P.goldHi : P.gold, midA);
    add(m + sd * W, WORDS.stepsAt, P.goldHi, A.stepLv);
    if (t < T_FLIP) add(CORE.lat(E, ip, 13), WORDS.flipLine, P.dn, A.flipLv);
    /* parts 6 and 7: the rungs with their odds, the guards, the mirror */
    if (A.fan > 0.01) {
      const u = unfold(t, 48.9);
      for (let k = 1; k <= 5; k++) add(CORE.lat(E, ip, k), "E" + k + " · " + CORE.ODDS[k - 1].toFixed(1), cAg, A.fan * u[k - 1] * sstep(49.6, 50.4, t));
      add(CORE.lat(E, ip, 11), WORDS.step, P.goldHi, A.guards);
      add(CORE.lat(E, ip, 12), WORDS.even, cOpp, A.guards * 0.85);
      add(CORE.lat(E, ip, 13), WORDS.flip, cOpp, A.guards);
    }
    if (A.mirror > 0.01) {
      const u = unfold(t, 64.0);
      for (let k = 1; k <= 5; k++) add(CORE.lat(E, ip, k + 5), "E" + k + "′", cAg, A.mirror * u[k - 1]);
      add(CORE.lat(E, ip, 14), WORDS.flip + "′", sd > 0 ? P.up : P.dn, A.mirror);
    }
    /* part 8: the clocks' midlines */
    if (t > 70.5 && t < 87) {
      const j2 = j2of(ip), j8 = j8of(ip);
      add(m, WORDS.clocks[0], P.goldHi, win(t, 72.4, 86.4, 0.8, 0.5));
      add(w.E2.mid[j2], WORDS.clocks[1], P.gold, A.h2);
      add(w.E8.mid[j8], WORDS.clocks[2], P.ink, A.h8);
    }
    /* the tags never run past the chart's right edge */
    const maxW = G.R.x + G.R.w - tx - 1.2 * U;
    for (const q of list) { const wd = measure(c, L, q.s, { kind: "mono", size: L.f.tag, ls: 0.06 }); if (wd > maxW) q.small = true; }
    tags(c, L, list, tx);
  }

  /* ---------------------------------------------------------------- his words, a word at a time */
  const CAPW = {};
  function capLayout(c, L, s) {
    const key = L.W + "x" + L.H + "|" + s;
    if (CAPW[key]) return CAPW[key];
    const box = capBox(L), size = box.size, words = s.split(" "), lines = [[]];
    c.save(); c.font = "400 " + size.toFixed(1) + "px 'Newsreader',Georgia,'Times New Roman',serif"; if ("letterSpacing" in c) c.letterSpacing = "0px";
    const sp = c.measureText(" ").width;
    let x = 0;
    for (const wd of words) {
      const ww = c.measureText(wd).width;
      if (x > 0 && x + ww > box.w) { lines.push([]); x = 0; }
      lines[lines.length - 1].push({ s: wd, x, w: ww }); x += ww + sp;
    }
    c.restore();
    return (CAPW[key] = { lines, size, box });
  }
  function capBox(L) {
    if (L.land) return { x: L.chart.x + L.W * 0.016, y: L.H * 0.835, w: L.W * 0.6, size: Math.max(15, 2.55 * L.U) };
    return { x: L.inst.x, y: L.H * 0.812, w: L.inst.w, size: Math.max(15, (L.cap || (L.H / L.W > 1.5 ? 3.2 : 2.8)) * L.U) };
  }
  function caption(c, L, t, o) {
    if (o && o.poster) return;
    for (const [t0, t1, s] of WORDS.caps) {
      if (t < t0 || t > t1 + 0.05) continue;
      const lay = capLayout(c, L, s), { box, size } = lay, lh = size * 1.3, out = 1 - sstep(t1 - 0.45, t1, t);
      const n = lay.lines.reduce((p, l) => p + l.length, 0), dt = Math.min(0.11, 1.5 / n);
      c.save(); c.font = "400 " + size.toFixed(1) + "px 'Newsreader',Georgia,'Times New Roman',serif"; if ("letterSpacing" in c) c.letterSpacing = "0px";
      c.textBaseline = "alphabetic"; c.fillStyle = P.ink; c.shadowColor = "rgba(4,8,18,0.9)"; c.shadowBlur = size * 0.5;
      let j = 0;
      lay.lines.forEach((ln, li) => {
        for (const q of ln) {
          const u = easeOut(inv(t0 + 0.05 + j * dt, t0 + 0.45 + j * dt, t)); j++;
          if (u <= 0) continue;
          c.globalAlpha = u * out; c.fillText(q.s, box.x + q.x, box.y + size + li * lh + (1 - u) * 0.5 * L.U);
        }
      });
      c.restore();
    }
  }

  /* ---------------------------------------------------------------- the end */
  function endCard(c, L, t, a) {
    if (a <= 0.004) return;
    const U = L.U, cx = L.W / 2, cy = L.land ? L.H * 0.46 : L.H * 0.44, R = (L.land ? 17 : 24) * U;
    drawHandFan(c, L, t, a, { box: { x: cx - R, y: cy - R, w: 2 * R, h: R }, R: R * 0.95, py: cy, open: ease(inv(100.9, 101.8, t)), mirror: ease(inv(101.3, 102.2, t)), side: -1, span: 74, bare: true });
    const ta = a * sstep(101.4, 102.1, t);
    txt(c, L, WORDS.title, cx, cy + 6 * U + L.f.big * 1.0, { size: L.f.big * 1.35, color: P.ink, alpha: ta, weight: 700, align: "center", ls: 0.24 });
    txt(c, L, WORDS.url, cx, cy + 6 * U + L.f.big * 1.0 + L.f.lab * 2.8, { kind: "mono", size: L.f.lab * 1.05, color: P.gold, alpha: ta * sstep(101.7, 102.4, t), align: "center", upper: false });
  }

  /* ---------------------------------------------------------------- one frame: a pure function of t */
  function drawFrame(c, L, t, d, o) {
    o = o || {};
    const A = envelopes(t), U = L.U;
    ground(c, L, t);
    let G = null;
    if (A.chart > 0.004) {
      G = geom(L, t);
      const lay = o.layer;
      if (lay) {
        const k = lay.getContext("2d"); k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, lay.width, lay.height); k.setTransform(o.dpr || 1, 0, 0, o.dpr || 1, 0, 0);
        chartPart(k, L, G, t, A, o);
        /* the left edge fades, as a drawing's does */
        const R = G.R, fw = R.w * 0.08;
        k.save(); k.globalCompositeOperation = "destination-out";
        const g = k.createLinearGradient(R.x, 0, R.x + fw, 0); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
        k.fillStyle = g; k.fillRect(R.x - 4 * U, R.y - 4 * U, fw + 4 * U, R.h + 8 * U); k.restore();
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = A.chart; c.drawImage(lay, 0, 0); c.restore();
      } else { c.save(); c.globalAlpha = A.chart; chartPart(c, L, G, t, A, o); c.restore(); }
      c.save(); c.globalAlpha = A.chart;
      if (A.stride) drawStride(c, L, G, t, 1);
      strideDim(c, L, G, t, A.dim * (t < 23.0 ? sstep(22.3, 23.0, t) : 1));
      flipDim(c, L, G, t, t < T_FLIP ? A.flipLv : 0);
      chartTags(c, L, G, t, A);
      c.restore();
    }
    instruments(c, L, G, t, A, o);
    drawWeek(c, L, t, A.week, d);
    endCard(c, L, t, A.end);
    const st = t >= 86.6 && t < 95.6 ? null : { s: t > 70.5 && t < 86.5 && G ? (G.cam.nb > 4200 ? WORDS.clocks[2] : G.cam.nb > 700 ? WORDS.clocks[1] : WORDS.clocks[0]) : WORDS.clocks[0], color: P.ink3 };
    head(c, L, t, A.head, st, o.poster);
    foot(c, L, t, A.foot, t >= 86.6 && t < 95.6 ? WORDS.url : WORDS.illus);
  }


  /* ---------------------------------------------------------------- the sound design's moments, for the score */
  /* Every cue is taken from the same clock the picture runs on, so the sound is in step by construction.
     kind names a sound in the score's own synthesis (synth.py); x is where on screen, -1 left to 1 right. */
  function cues() {
    const w = world(), out = [];
    const add = (t, kind, gain, extra) => out.push(Object.assign({ t: +t.toFixed(4), kind, gain: gain == null ? 1 : gain }, extra || {}));
    add(0.0, "air", 0.5, { dur: TOTAL });
    add(0.02, "draw_in", 0.9, { dur: 1.4 });
    add(0.4, "scribe", 0.55, { dur: 5.75 });
    for (const q of evs()) {
      if (q.t < 6.3) add(q.t, "step_soft", 0.3, { x: 0.5 });
      else if (q.kind === "flip") add(q.t, "flip", 1.0, { x: 0.45 });
      else add(q.t, "step", 0.85, { x: 0.45, up: q.side > 0 ? 1 : 0 });
    }
    add(6.5, "zoom_in", 0.7, { dur: 2.5 });
    const g = grains();
    for (const q of g.list) { const land = q.tb + (q.vis ? GR.fly : 0.55); if (q.vis) add(land, "grain", 0.5, { bin: q.bin }); }
    add(GR.rain0, "rain", 0.8, { dur: GR.rain1 - GR.rain0 + 0.6, times: g.list.filter(q => !q.vis).map(q => +(q.tb + 0.55).toFixed(3)) });
    add(12.6, "zoom_out", 0.6, { dur: 2.0 });
    add(14.25, "mean", 0.8);
    add(16.5, "zoom_in", 0.55, { dur: 2.1 });
    add(16.6, "lift", 0.75, { dur: 1.3 });
    for (let k = 0; k < 8; k++) add(18.0 + 0.42 * k + 0.1, "lay", 0.85, { k });
    add(21.85, "settle", 0.8);
    add(22.7, "level", 0.6);
    add(23.4, "movement_in", 0.6, { dur: 1.6 });
    /* the beat: one a close while the escapement runs, thinned where the closes come fast */
    for (let r = PH.B + 1; r <= -1; r++) {
      const tt = closeTime(r); if (!(tt >= 25.6 && tt < T_FLIP)) continue;
      const sp = speed(tt), every = Math.max(1, Math.round(sp / 9));
      if ((r - PH.B) % every) continue;
      add(tt, "beat", 0.42, { alt: r & 1, x: 0.45 });
    }
    add(41.0, "flipline", 0.7);
    add(45.9, "tension", 0.9, { dur: T_FLIP - 45.9 });
    for (let k = 0; k < 5; k++) add(48.9 + 0.22 * k + 0.25, "rib", 0.7, { k });
    add(50.7, "walks", 0.8, { dur: 11.5 });
    const F = walkFinish();
    add(50.7, "sparks", 0.75, { times: F.all.filter((tt, i) => tt < 62.8 && w.walks.length && i % 2 === 0).map(tt => +tt.toFixed(3)) });
    add(57.0, "said", 0.8);
    add(59.4, "came", 0.8);
    add(63.8, "mirror", 0.8, { dur: 2.0 });
    for (let k = 0; k < 5; k++) add(64.0 + 0.22 * k + 0.25, "rib", 0.55, { k, mirror: 1 });
    add(70.5, "pull_out", 0.85, { dur: 2.8 });
    add(74.2, "pull_out_deep", 0.9, { dur: 3.0 });
    add(77.2, "sweep", 0.7, { dur: 5.0 });
    /* the clocks ticking as the sweep passes their steps */
    const lo = w.e + sweepLo(), tOf = i => 77.2 + 5.0 * (i - lo) / (w.e - lo);
    const ticks = [[], [], []];
    for (let i = lo; i <= w.e; i++) if (w.E.stepped[i]) ticks[0].push(+tOf(i).toFixed(3));
    for (let j = Math.ceil(lo / 12); j <= Math.floor((w.e + 1) / 12) - 1; j++) if (w.E2.stepped[j]) ticks[1].push(+tOf(j * 12 + 11).toFixed(3));
    for (let j = Math.ceil(lo / 48); j <= Math.floor((w.e + 1) / 48) - 1; j++) if (w.E8.stepped[j]) ticks[2].push(+tOf(j * 48 + 47).toFixed(3));
    add(77.2, "ticks10", 0.5, { times: ticks[0] });
    for (const tt of ticks[1]) add(tt, "tick2", 0.6);
    for (const tt of ticks[2]) add(tt, "tick8", 0.85);
    add(82.4, "push_in", 0.75, { dur: 3.2 });
    add(86.6, "turn", 0.6, { dur: 1.0 });
    add(87.7, "line", 0.75);
    add(90.6, "close", 0.75);
    add(91.62, "stamp", 1.0);
    add(95.5, "return", 0.6, { dur: 1.0 });
    add(101.15, "end", 1.0, { dur: 1.85 });
    return out.sort((a, b) => a.t - b.t);
  }

  /* ---------------------------------------------------------------- the player's styles, once per page */
  const CSS = `
.mvt{position:relative;width:100%;aspect-ratio:16/9;background:#060c18;color:#F3EFE6;border-radius:14px;overflow:hidden;isolation:isolate;container-type:inline-size;
  font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;box-shadow:0 0 0 1px rgba(243,239,230,.08),0 26px 70px rgba(0,0,0,.32);outline:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.mvt:focus-visible{box-shadow:0 0 0 2px #E0A93B}
.mvt canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.mvt button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0;margin:0;white-space:nowrap}
.mvt-ctl{position:absolute;right:3.4%;bottom:5%;display:flex;gap:8px;align-items:center;transition:opacity .4s}
.mvt-ctl button{min-height:34px;padding:0 12px;border:1px solid rgba(243,239,230,.24);border-radius:3px;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;background:rgba(6,12,24,.66)}
.mvt-ctl button:hover,.mvt-ctl button:focus-visible{border-color:#F3EFE6}
.mvt-bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(243,239,230,.1);cursor:pointer}
.mvt-bar i{display:block;height:100%;width:0;background:#E0A93B}
.mvt-go{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:14px;padding:15px 26px 15px 20px!important;border:1px solid rgba(224,169,59,.7)!important;border-radius:40px;background:rgba(6,12,24,.78)!important;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#F3EFE6;transition:transform .2s,border-color .2s,background .2s}
.mvt-go:hover,.mvt-go:focus-visible{border-color:#E0A93B!important;background:rgba(6,12,24,.9)!important;transform:translate(-50%,-50%) scale(1.03)}
.mvt-go i{width:0;height:0;border-left:13px solid #E0A93B;border-top:8px solid transparent;border-bottom:8px solid transparent}
.mvt[data-state="playing"] .mvt-go,.mvt[data-state="paused"] .mvt-go{display:none}
.mvt[data-state="poster"] .mvt-pp,.mvt[data-state="poster"] .mvt-bar{display:none}
.mvt[data-idle="1"] .mvt-ctl{opacity:0}
.mvt[data-capture="1"] .mvt-ctl,.mvt[data-capture="1"] .mvt-go,.mvt[data-capture="1"] .mvt-bar{display:none}
.mvt[data-portrait="1"] .mvt-ctl{left:5%;right:5%;bottom:2.6%;justify-content:flex-end}
.mvt[data-portrait="1"] .mvt-ctl button{min-height:44px}
.mvt[data-portrait="1"] .mvt-fs{display:none}
@media (max-width:760px){.mvt{aspect-ratio:4/5;border-radius:10px}}
.mvt:fullscreen{aspect-ratio:auto;width:100vw;height:100vh;border-radius:0}
.mvt-text{margin-top:12px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;line-height:1.7;color:inherit}
.mvt-text summary{cursor:pointer;font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;min-height:44px;display:flex;align-items:center}
.mvt-text ol{margin:6px 0 0;padding-left:1.4em}
.mvt-text li{margin:0 0 8px}
@media (prefers-reduced-motion:reduce){.mvt-go,.mvt-ctl{transition:none}}
`;
  const VERSION = "2026-10-11";
  let cssDone = false;
  function injectCSS() { if (cssDone) return; cssDone = true; const s = document.createElement("style"); s.setAttribute("data-movement", VERSION); s.textContent = CSS; document.head.appendChild(s); }
  const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

  /* the text under the picture: every part in a sentence or its labels, every word as on screen */
  const TEXT = [
    () => WORDS.caps[0][2],
    () => WORDS.caps[1][2] + " " + WORDS.meanMove + ". " + WORDS.memory + ". " + WORDS.period + ".",
    () => WORDS.stride + ": " + WORDS.strideIs + ". " + WORDS.stepsAt + ".",
    () => WORDS.earns + ". " + WORDS.stepUp + ".",
    () => WORDS.flipLine + ": " + WORDS.flipDist + ". " + WORDS.flipDn + ".",
    () => WORDS.caps[2][2] + " " + CORE.ODDS.map((o, k) => "E" + (k + 1) + " · " + o.toFixed(1)).join(", ") + ". " + WORDS.caps[3][2] + " " + WORDS.came + ", " + WORDS.c10 + ": " + CAME.m10.map(v => v.toFixed(1)).join(", ") + "; " + WORDS.c2h + ": " + CAME.h2.map(v => v.toFixed(1)).join(", ") + ". " + WORDS.cameSrc + ".",
    () => WORDS.mirror + ": E1′ to E5′, " + WORDS.step + ", " + WORDS.even + ", " + WORDS.flip + ", " + WORDS.flip + "′.",
    () => WORDS.clocks[0] + ". " + WORDS.clocks[1] + ", " + WORDS.anchor.toLowerCase() + ". " + WORDS.clocks[2] + ", " + WORDS.longView.toLowerCase() + ". " + WORDS.caps[4][2],
    d => WORDS.caps[5][2] + (d ? " " + WORDS.weekOf + " " + d.week + ": " + WORDS.line + " " + d.line + ", " + (d.ceiling ? WORDS.ceiling : WORDS.floorW) + (d.odds != null ? ", " + d.odds + " " + WORDS.atCall : "") + (d.close ? ". " + WORDS.friday + " " + d.close + ": " + (d.hit ? WORDS.hit : d.held ? WORDS.held : WORDS.wrong) : "") + "." : ""),
    () => WORDS.caps[6][2]
  ];

  /* ---------------------------------------------------------------- the player */
  class Player {
    constructor(host, opts) {
      injectCSS();
      this.opts = opts || {};
      this.host = host; this.t = 0; this.state = "poster"; this.last = 0; this.data = null;
      this.capture = !!this.opts.capture;
      this.build();
      if (this.opts.width && this.opts.height) { this.el.style.width = this.opts.width + "px"; this.el.style.height = this.opts.height + "px"; this.el.style.aspectRatio = "auto"; }
      this.resize();
      loadData(this.opts.src).then(d => { this.data = d; this.writeText(); this.draw(); });
      if (document.fonts && document.fonts.load) {
        const faces = ["600 20px 'Barlow Condensed'", "700 20px 'Barlow Condensed'", "500 20px 'IBM Plex Mono'", "600 20px 'IBM Plex Mono'", "400 20px 'Newsreader'"];
        Promise.all(faces.map(f => document.fonts.load(f).catch(() => null))).then(() => { for (const k in CAPW) delete CAPW[k]; this.draw(); });
      }
      if (!this.capture) this.wire();
      this.draw();
    }
    build() {
      const h = this.host, el = document.createElement("div");
      el.className = "mvt"; el.tabIndex = 0; el.setAttribute("role", "region"); el.setAttribute("aria-label", WORDS.title + ", " + WORDS.subtitle.toLowerCase() + ". An animation of " + WORDS.length + ".");
      el.dataset.state = "poster"; if (this.capture) el.dataset.capture = "1"; if (this.opts.video) el.dataset.video = "1";
      el.innerHTML = '<canvas aria-hidden="true"></canvas>' +
        '<div class="mvt-ctl"><button type="button" class="mvt-pp"></button><button type="button" class="mvt-fs">Full screen</button></div>' +
        '<div class="mvt-bar" aria-hidden="true"><i></i></div>' +
        '<button type="button" class="mvt-go"><i></i><span></span></button>';
      h.appendChild(el);
      this.el = el; this.cv = el.querySelector("canvas"); this.ctx = this.cv.getContext("2d");
      const q = s => el.querySelector(s);
      this.ui = { pp: q(".mvt-pp"), fs: q(".mvt-fs"), bar: q(".mvt-bar i"), barBox: q(".mvt-bar"), go: q(".mvt-go"), goTxt: q(".mvt-go span") };
      this.ui.goTxt.textContent = WORDS.play + " · " + WORDS.length; this.ui.pp.textContent = WORDS.pause;
      if (!this.capture) {
        const d = document.createElement("details"); d.className = "mvt-text"; d.innerHTML = "<summary></summary><ol></ol>";
        d.firstChild.textContent = WORDS.text; h.appendChild(d); this.textList = d.querySelector("ol");
      }
      this.writeText();
    }
    writeText() {
      if (!this.textList) return;
      this.textList.innerHTML = "";
      SC.forEach((s, i) => {
        const li = document.createElement("li"), b = document.createElement("b");
        b.textContent = WORDS.rail[i] + ". "; li.appendChild(b);
        li.appendChild(document.createTextNode(TEXT[i](this.data) + (i < 8 ? " " + WORDS.illus + "." : "")));
        this.textList.appendChild(li);
      });
    }
    wire() {
      const el = this.el, go = () => (this.state === "playing" ? this.pause() : this.play());
      this.ui.go.addEventListener("click", e => { e.stopPropagation(); this.play(); });
      this.ui.pp.addEventListener("click", e => { e.stopPropagation(); go(); });
      this.cv.addEventListener("click", () => { if (this.state === "poster" || this.state === "ended") this.play(); else go(); });
      this.ui.fs.addEventListener("click", e => { e.stopPropagation(); try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); } catch (x) {} });
      this.ui.barBox.addEventListener("click", e => { const r = this.ui.barBox.getBoundingClientRect(); this.seek(clamp((e.clientX - r.left) / r.width, 0, 1) * TOTAL); if (this.state !== "playing") this.play(); });
      el.addEventListener("keydown", e => {
        if (e.target !== el) return;
        if (e.key === " " || e.key === "k" || e.key === "Enter") { e.preventDefault(); go(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); const i = Math.min(SC.length - 1, sceneAt(this.t) + 1); this.seek(SC[i].t0 + 0.01); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); const i = sceneAt(this.t), j = this.t - SC[i].t0 > 1.5 ? i : Math.max(0, i - 1); this.seek(SC[j].t0 + 0.01); }
      });
      let idle = 0; const wake = () => { el.dataset.idle = "0"; clearTimeout(idle); idle = setTimeout(() => { if (this.state === "playing") el.dataset.idle = "1"; }, 2600); };
      el.addEventListener("pointermove", wake); el.addEventListener("pointerdown", wake); el.addEventListener("focusin", wake);
      this.wake = wake;                                  /* a film that starts by itself still clears its controls off the words */
      if (window.ResizeObserver) new ResizeObserver(() => { if (this.resize()) this.draw(); }).observe(el);
      else window.addEventListener("resize", () => { if (this.resize()) this.draw(); });
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
    }
    kick() { if (this.raf || this.capture) return; const loop = ts => { this.raf = 0; this.tick(ts); if (this.state === "playing" && this.visible && !document.hidden) this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
    tick(ts) {
      const dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0;
      this.last = ts;
      if (this.state === "playing") { this.t += dt; if (this.t >= TOTAL) { this.t = TOTAL; this.end(); } }
      const a = performance.now(); this.draw(); this.pace(performance.now() - a);
    }
    /* a device that cannot keep up gets fewer pixels, never a slower film */
    pace(ms) {
      if (this.state !== "playing" || this.opts.dpr) return;
      this.ema = this.ema ? 0.92 * this.ema + 0.08 * ms : ms; this.paced = (this.paced || 0) + 1;
      if (this.paced > 40 && this.ema > 24 && (this.quality || 1) > 0.42) { this.quality = Math.max(0.4, (this.quality || 1) * 0.8); this.ema = 0; this.paced = 0; this.resize(); }
    }
    play() {
      if (this.state === "ended" || this.t >= TOTAL - 0.05) this.t = 0;
      const first = !this.started; this.started = true; this.state = "playing"; this.el.dataset.state = "playing"; this.last = 0;
      this.ui.pp.textContent = WORDS.pause;
      if (first) this.count("movement-play");
      if (this.wake) this.wake();
      this.kick();
    }
    pause(auto) { if (this.state !== "playing") return; this.state = "paused"; this.el.dataset.state = "paused"; this.ui.pp.textContent = WORDS.resume; this.autoPaused = !!auto; this.draw(); }
    end() { this.state = "ended"; this.el.dataset.state = "ended"; this.ui.pp.textContent = WORDS.replay; this.ui.goTxt.textContent = WORDS.replay; this.el.dataset.idle = "0"; this.count("movement-end"); }
    seek(t) { this.t = clamp(t, 0, TOTAL); if (this.state === "poster" || this.state === "ended") { this.state = "paused"; this.el.dataset.state = "paused"; this.ui.pp.textContent = WORDS.resume; } this.draw(); this.kick(); }
    count(what) { try { if (window.goatcounter && typeof window.goatcounter.count === "function") window.goatcounter.count({ path: what + "/" + (location.pathname.split("/").pop() || "index.html"), title: WORDS.title, event: true }); } catch (x) {} }
    resize() {
      const r = this.el.getBoundingClientRect(), W = Math.max(200, Math.round(this.opts.width || r.width || 800)), H = Math.max(150, Math.round(this.opts.height || r.height || 450));
      const dpr = this.opts.dpr || Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2) * (this.quality || 1));
      if (W === this.W && H === this.H && dpr === this.dpr) return false;
      this.W = W; this.H = H; this.dpr = dpr;
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
      this.layer = mkCanvas(this.cv.width, this.cv.height); this.vign = null;
      this.L = layout(W, H, !!this.opts.video);
      this.el.dataset.portrait = W / H < 1.05 ? "1" : "0";
      return true;
    }
    draw() {
      if (!this.W) return;
      const c = this.ctx, poster = this.state === "poster", t = poster ? POSTER_T : this.t;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const o = { layer: this.layer, dpr: this.dpr, lite: this.W * this.H * this.dpr * this.dpr < 700000, poster };
      holdText();
      try { drawFrame(c, this.L, t, this.data, o); }
      catch (x) { if (window.console) console.warn("movement", x); }
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      this.post(bloomAt(t));
      /* the words go on last, over the light, so they stay sharp */
      flushText(c);
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); caption(c, this.L, t, o); c.setTransform(1, 0, 0, 1, 0, 0);
      finish(c, this.L, t, this.cv.width, this.cv.height, this.dpr);
      if (!poster) { const v = ((100 * this.t) / TOTAL).toFixed(2) + "%"; if (this.ui.bar._w !== v) { this.ui.bar._w = v; this.ui.bar.style.width = v; } }
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
      c.globalAlpha = Math.min(1, 0.5 * bl); c.drawImage(this.b2, 0, 0, cw, ch); c.globalAlpha = Math.min(1, 0.45 * bl); c.drawImage(this.b3, 0, 0, cw, ch);
      c.globalCompositeOperation = "source-over";
      /* vignette */
      if (!this.vign) {
        this.vign = mkCanvas(cw, ch); const v = this.vign.getContext("2d"), R = Math.hypot(cw, ch) / 2;
        const gr = v.createRadialGradient(cw / 2, ch * 0.45, R * 0.42, cw / 2, ch * 0.45, R * 1.02); gr.addColorStop(0, "rgba(3,6,14,0)"); gr.addColorStop(1, "rgba(3,6,14,0.66)");
        v.fillStyle = gr; v.fillRect(0, 0, cw, ch);
      }
      c.globalAlpha = 1; c.drawImage(this.vign, 0, 0);
    }
    /* for recording: draw the frame at t, nothing else */
    frame(t) { if (this.state === "poster") { this.state = "paused"; this.el.dataset.state = "paused"; } this.t = clamp(t, 0, TOTAL); this.draw(); }
  }
  /* the picture that waits for a press: the walks counted against the rungs */
  const POSTER_T = 60.6;

  /* ---------------------------------------------------------------- mount */
  const players = [];
  function mount(host, opts) { if (!host || host._movement) return host && host._movement; const p = new Player(host, opts); host._movement = p; players.push(p); return p; }
  function auto() {
    document.querySelectorAll("[data-movement]").forEach(h => mount(h, { autoplay: h.getAttribute("data-movement-autoplay") || "off", src: h.getAttribute("data-movement-src") || "record.json" }));
  }
  window.Movement = { version: VERSION, duration: TOTAL, parts: SC.map(s => ({ id: s.id, start: s.t0, end: s.t1 })), mount, players, words: WORDS, cues, ready: () => world() && true };
  if (!window.MOVEMENT_MANUAL) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto(); }
})();
