/* =========================================================================
   lamp.js  ·  THE LAMP  ·  29 October 2026  ·  note 63 on the record

   The head of the page has one light, and the reader holds it. With a mouse
   the light follows the pointer; on a phone it follows the tilt of the phone,
   or a finger on the plate; left alone it drifts slowly around the upper left,
   where the key light of every card sits.

   Under the light lies the record's seal, engraved: the rosette drawn from the
   SHA-256 of every row on this page, the same key as the seal on every card,
   one line per row, oldest first, number|named|metal|level|side|grade|close,
   read from record.json. The engraving shows only where the light falls.
   Change one figure on the record and the engraving changes.

   The plate lies behind the scene of Round 3, under its chart: the chart
   stays in front, the engraving is the ground it stands on. The count, the
   dock and the inspector catch the same light. With scripts off, or on a
   device without WebGL, the scene shows as before, without the plate. The
   lamp moves no figure and types none.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
(function () {
  "use strict";
  /* two places: the record's own head (the stage of Round 3), or the head of any page beside it (the house's navy
     head, or The Fan's), where the plate lies to the right of the words, on a screen wide enough to leave it room */
  const stageHead = document.querySelector(".band-hero.r3");
  const heroHead = stageHead ? null : document.querySelector(".hs-hero, .band-hero, .fan-head");
  const head = stageHead || heroHead, HERO = !stageHead;
  if (!head || !window.crypto || !crypto.subtle || !window.WebGLRenderingContext) return;
  if (HERO && window.innerWidth < 900) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ORDER = ["Gold", "Silver", "Platinum"];

  /* ---------------------------------------------------------------- the seal of the record */
  async function sealOf(rows) {
    const rs = rows.slice().sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : 0) || (ORDER.indexOf(a.metal) - ORDER.indexOf(b.metal)));
    const key = rs.map((r, i) => [i + 1, r.named, r.metal, r.level || "", r.side || "", r.grade, r.close || ""].join("|")).join("\n");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
  }
  /* the rosette, as on every card: the same five bytes, the same curves */
  function rosette(hash) {
    const by = i => parseInt(hash.slice(i * 2, i * 2 + 2), 16);
    const k1 = 5 + by(0) % 8, k2 = k1 + 3 + by(1) % 6, N = 30 + by(2) % 16, a1 = .11 + by(3) / 255 * .05, a2 = .05 + by(4) / 255 * .04;
    const curves = [];
    for (let i = 0; i < N; i++) {
      const ph = 2 * Math.PI * i / N, c = new Float32Array(842);
      for (let j = 0; j <= 420; j++) { const th = 2 * Math.PI * j / 420, r = .47 + a1 * Math.sin(k1 * th + ph) + a2 * Math.sin(k2 * th - 2 * ph); c[2 * j] = r * Math.cos(th); c[2 * j + 1] = r * Math.sin(th); }
      curves.push(c);
    }
    return curves;
  }

  /* ---------------------------------------------------------------- the plate */
  const slot = document.createElement("div"); slot.className = "lamp-slot"; slot.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); cv.className = "lamp-plate"; slot.appendChild(cv);
  const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return;
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uH;uniform vec2 uRes;uniform vec3 uL;uniform float uDepth,uFall,uBase,uMax;
void main(){
  vec2 fc=gl_FragCoord.xy, uv=vec2(fc.x/uRes.x,1.-fc.y/uRes.y), e=1./uRes;
  float h=texture2D(uH,uv).r;
  float hx=texture2D(uH,uv+vec2(e.x,0.)).r-texture2D(uH,uv-vec2(e.x,0.)).r;
  float hy=texture2D(uH,uv+vec2(0.,e.y)).r-texture2D(uH,uv-vec2(0.,e.y)).r;
  vec3 n=normalize(vec3(hx*uDepth,hy*uDepth,1.));
  vec2 p=vec2(fc.x,uRes.y-fc.y);
  vec3 L=vec3(uL.xy-p,uL.z);float d=length(L);L/=d;
  vec3 H=normalize(L+vec3(0.,0.,1.));
  float ndh=max(dot(n,H),0.), diff=max(dot(n,L),0.), fall=1./(1.+d*d/(uFall*uFall));
  float g=smoothstep(.03,.6,h), wall=clamp(length(vec2(hx,hy))*3.,0.,1.);
  /* the ground, not the subject: dim gold rising to pale gold where the light falls, never white, capped by uMax */
  float lum=g*(uBase+1.15*diff*diff*fall)+(pow(ndh,70.)*1.6+pow(ndh,14.)*.18)*fall*max(g,wall)*.8;
  lum+=pow(max(H.z,0.),40.)*fall*.05*(1.-g);
  float k=1.-exp(-lum*1.4), a=k*uMax;
  gl_FragColor=vec4(mix(vec3(.72,.55,.24),vec3(.98,.86,.6),k)*a,a);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n), uRes = U("uRes"), uL = U("uL"), uDepth = U("uDepth"), uFall = U("uFall"), uBase = U("uBase"), uMax = U("uMax");
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
  const hm = document.createElement("canvas"), hc = hm.getContext("2d");

  let curves = null, dpr = 1, wide = true, gain = .8, plate = { x: 0, y: 0, w: 1, h: 1 }, dial = { cx: 0, cy: 0, R: 1 }, lit = [], cone = null, coneA = null;
  const lamp = { x: 0, y: 0, tx: 0, ty: 0, px: -9, py: -9, last: -1e9, t0: performance.now(), tilt: null };
  const rel = el => { const a = head.getBoundingClientRect(), b = el.getBoundingClientRect(); return { l: b.left - a.left, t: b.top - a.top, w: b.width, h: b.height }; };

  function layout() {
    const W = head.clientWidth, H = head.clientHeight; wide = W >= 1100; dpr = Math.min(2, window.devicePixelRatio || 1);
    const copy = head.querySelector(".r3-copy"), s = rel(slot);
    if (HERO) {
      /* to the right of the words: the plate from the end of the lede to the edge, the engraving faded in from its left */
      const words = head.querySelector(".hs-lede, .lede, .hs-h1, .band-lede, h1"), wb = words ? rel(words) : { l: 0, w: W * .55 };
      const left = Math.max(W * .5, Math.min(W - 360, wb.l + wb.w + 24));
      dial.R = clamp(Math.min(H * .78, (W - left) * .7), 160, 380); dial.cx = W - dial.R * .62; dial.cy = H * .52;
      plate = { x: left, y: 0, w: W - left, h: H }; gain = .3;
      cv.classList.add("side"); cv.style.setProperty("--fade", Math.min(200, (W - left) * .4).toFixed(0) + "px");
    } else if (wide) {
      /* behind the chart: the engraving is the ground the chart stands on, under the words and clear of them */
      const cb = copy ? rel(copy) : { t: 0, h: H * .55 }, top = Math.max(0, cb.t + cb.h - 60);
      dial.R = clamp(W * .36, 420, 600); dial.cx = Math.min(W * .32, W - 560); dial.cy = H * .86;
      plate = { x: 0, y: top, w: W, h: H - top }; gain = .3;
      cv.style.setProperty("--fade", "120px");
    } else {
      dial.R = clamp(s.w * .56, 180, 300); dial.cx = s.l + s.w / 2; dial.cy = s.t + s.h * .56;
      plate = { x: s.l, y: s.t, w: s.w, h: s.h }; gain = .34;
      cv.style.setProperty("--fade", "40px");
    }
    Object.assign(cv.style, { left: (plate.x - s.l) + "px", top: (plate.y - s.t) + "px", width: plate.w + "px", height: plate.h + "px" });
    const pw = Math.max(1, Math.round(plate.w * dpr)), ph = Math.max(1, Math.round(plate.h * dpr));
    cv.width = hm.width = pw; cv.height = hm.height = ph;
    /* the engraving, as a height map: every line of the rosette cut into the plate, soft at its walls */
    hc.setTransform(1, 0, 0, 1, 0, 0); hc.fillStyle = "#000"; hc.fillRect(0, 0, pw, ph);
    hc.setTransform(dpr, 0, 0, dpr, -plate.x * dpr, -plate.y * dpr); hc.lineJoin = "round"; hc.lineCap = "round";
    const R = dial.R, cx = dial.cx, cy = dial.cy;
    const pass = (w, a, ring) => {
      hc.strokeStyle = `rgba(255,255,255,${a})`; hc.lineWidth = w; hc.beginPath();
      if (!ring) for (const c of curves) { hc.moveTo(cx + c[0] * R, cy + c[1] * R); for (let j = 1; j <= 420; j++) hc.lineTo(cx + c[2 * j] * R, cy + c[2 * j + 1] * R); }
      else for (const rr of [.72, .985]) { hc.moveTo(cx + rr * R, cy); hc.arc(cx, cy, rr * R, 0, Math.PI * 2); }
      hc.stroke();
    };
    pass(2.6, .32, false); pass(1.25, 1, false); pass(3.6, .32, true); pass(1.9, 1, true);
    gl.viewport(0, 0, pw, ph); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, hm);
    gl.uniform2f(uRes, pw, ph); gl.uniform1f(uDepth, 2.3); gl.uniform1f(uFall, R * .7 * dpr); gl.uniform1f(uBase, .06); gl.uniform1f(uMax, gain);
    /* what catches the light: the count, the dock, the inspector, and the cone that follows the lamp */
    lit = [".r3-tele", ".r3-dock", ".r3-drawer"].map(q => head.querySelector(q)).filter(Boolean).map(el => { const b = rel(el); return { el, x: b.l + b.w / 2, y: b.t + b.h / 2, c: {} }; });
    cone = head.querySelector(".r3-cone");
    if (cone) { const b = rel(cone); coneA = { x: b.l + b.w * .4, y: b.t }; }
    lamp.px = -9; paint();
  }

  /* ---------------------------------------------------------------- the light */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), q = (v, s) => Math.round(v / s) * s;
  const setp = (o, k, v) => { if (o.c[k] !== v) { o.c[k] = v; o.el.style.setProperty(k, v); } };
  function paint() {
    if (Math.abs(lamp.x - lamp.px) < .3 && Math.abs(lamp.y - lamp.py) < .3) return;
    lamp.px = lamp.x; lamp.py = lamp.y;
    gl.uniform3f(uL, (lamp.x - plate.x) * dpr, (lamp.y - plate.y) * dpr, dial.R * .24 * dpr);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    for (const o of lit) {
      const dx = o.x - lamp.x, dy = o.y - lamp.y, d = Math.hypot(dx, dy) || 1, k = clamp(d / 700, .3, 1.2);
      setp(o, "--lux", q(dx / d * k, .05).toFixed(2)); setp(o, "--luy", q(dy / d * k, .05).toFixed(2));
    }
    if (cone && coneA) cone.style.setProperty("--cone", q(clamp(-Math.atan2(lamp.x - coneA.x, Math.max(40, lamp.y - coneA.y)) * 180 / Math.PI, -38, 38), .5) + "deg");
  }
  function home() { return HERO ? { x: plate.x + plate.w * .4, y: head.clientHeight * .25 } : wide ? { x: head.clientWidth * .22, y: 60 } : { x: plate.x + plate.w * .3, y: plate.y + plate.h * .2 }; }
  let onScreen = true, tick = 0;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }).observe(head);
  function frame(now) {
    requestAnimationFrame(frame);
    if (!onScreen) return;
    const drifting = !reduce && !lamp.tilt && now - lamp.last > 4000;
    if (drifting) {
      const t = (now - lamp.t0) / 1000, W = head.clientWidth;
      if (HERO) { lamp.tx = plate.x + plate.w * (.5 + .3 * Math.sin(t * .21)); lamp.ty = head.clientHeight * (.45 + .3 * Math.sin(t * .29 + 1.3)); }
      else if (wide) { lamp.tx = W * (.3 + .2 * Math.sin(t * .21)); lamp.ty = head.clientHeight * (.66 + .14 * Math.sin(t * .29 + 1.3)); }
      else { lamp.tx = plate.x + plate.w * (.5 + .38 * Math.sin(t * .23)); lamp.ty = plate.y + plate.h * (.3 + .25 * Math.sin(t * .31 + 1.1)); }
      if (++tick % 2) return;
    }
    const e = drifting ? .2 : .14; lamp.x += (lamp.tx - lamp.x) * e; lamp.y += (lamp.ty - lamp.y) * e;
    paint();
  }
  function aim(x, y) { const a = head.getBoundingClientRect(); lamp.tx = x - a.left; lamp.ty = y - a.top; lamp.last = performance.now(); }
  window.addEventListener("pointermove", e => { if (e.pointerType === "mouse" || e.pointerType === "pen" || (e.target.closest && e.target.closest(".r3-stage"))) aim(e.clientX, e.clientY); }, { passive: true });
  /* the tilt of the phone, like tilting an engraved plate under a lamp */
  function onTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    if (!lamp.tilt) lamp.tilt = { b: e.beta, g: e.gamma };
    lamp.tx = plate.x + plate.w * (.5 + clamp((e.gamma - lamp.tilt.g) / 36, -.6, .6));
    lamp.ty = plate.y + plate.h * (.32 + clamp((e.beta - lamp.tilt.b) / 26, -.7, .9));
    lamp.last = performance.now();
  }
  function listenTilt() { window.addEventListener("deviceorientation", onTilt, { passive: true }); }
  let tiltBtn = null;
  const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  if (!HERO && coarse && typeof DeviceOrientationEvent !== "undefined") {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      tiltBtn = document.createElement("button"); tiltBtn.type = "button"; tiltBtn.className = "lamp-tilt"; tiltBtn.textContent = "Tilt to light the record";
      tiltBtn.addEventListener("click", () => { DeviceOrientationEvent.requestPermission().then(s => { if (s === "granted") listenTilt(); tiltBtn.remove(); }).catch(() => tiltBtn.remove()); });
    } else listenTilt();
  }

  /* ---------------------------------------------------------------- start */
  function start(rows) {
    sealOf(rows).then(hash => {
      curves = rosette(hash);
      slot.dataset.seal = hash.slice(0, 12);
      const stage = head.querySelector(".r3-stage");
      if (stage) { stage.insertBefore(slot, stage.firstChild); if (tiltBtn) stage.after(tiltBtn); } else head.insertBefore(slot, head.firstChild);
      head.classList.add("lamp-on");
      layout();
      const h0 = home(); lamp.x = lamp.tx = h0.x; lamp.y = lamp.ty = h0.y; lamp.last = reduce ? Infinity : performance.now() - 2500;
      lamp.px = -9; paint(); requestAnimationFrame(frame);
      let rt = 0; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 140); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    }).catch(() => {});
  }
  fetch("record.json", { cache: "no-cache" }).then(r => r.json()).then(j => start(j.rows || [])).catch(() => {});
  window.__lamp = lamp;
})();
