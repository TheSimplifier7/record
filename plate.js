/* =========================================================================
   plate.js  ·  THE PLATE  ·  12 November 2026, note 70; engraved and lit, 15 November 2026

   Under the levels lies the record's seal, engraved. It is drawn from the
   SHA-256 of every row on the record, one line per row, number|named|metal|
   level|side|grade|close. Change one figure on the record and the engraving
   changes. The seal is worked out when the page is written and carried on
   the element as data-seal, so this file asks the network for nothing.

   The engraving, in three bands, every number read from the seal's bytes:
     the rosette ASSAY draws on every card, bytes 0 to 4, the same curves;
     an outer band of rose waves, bytes 5 to 7;
     a basket of fine waves at the centre, bytes 8 to 10;
   framed by plain rings.

   15 November 2026, HALLMARK. Where the browser has WebGL the engraving is
   cut as a height map and lit by one lamp: the reader's pointer on a desk,
   the reader's scroll on a phone, upper left with reduced motion. Flat
   metal, depth from the light alone, nothing turns and nothing loops; the
   page is drawn again only when the lamp moves. The words beside the plate
   are kept clear of it. Without WebGL the plate is drawn as it was on
   12 November: the rosette in gold, under the light the stylesheet casts.
   With scripts off the page reads as it does without the plate.
   25 November 2026, HALLMARK, his word of 00:55: glass on every thing. The
   plate now lies under every pane of glass on the front page, so each plate
   waits until it is near the screen and the browser is idle before it cuts
   its engraving, and one engraving is cut once and shared by every plate of
   the same size. The words beside a plate are found by its h1, or by an
   element marked data-plate-copy (a section's own heading).
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-plate][data-seal]");
  if (!hosts.length || !window.HTMLCanvasElement) return;
  var reduce = false, fine = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { fine = matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) {}
  var TAU = 2 * Math.PI;

  /* every measure in units of the plate's half width P; Q is the rosette's own unit, as on the cards */
  function bands(hash) {
    var by = function (i) { return parseInt(hash.slice(i * 2, i * 2 + 2), 16); };
    return {
      k1: 5 + by(0) % 8, k2: 0, N: 30 + by(2) % 16, a1: .11 + by(3) / 255 * .05, a2: .05 + by(4) / 255 * .04, b1: by(1),
      N1: 72 + by(5) % 48, k3: 9 + by(6) % 10, a3: .018 + by(7) / 255 * .016,
      M: 34 + by(8) % 22, m: 18 + by(9) % 30, a4: .004 + by(10) / 255 * .004
    };
  }
  var Q = .8;
  function engrave(g, S, B, full, w) {
    var C = S / 2, P = S / 2, F = typeof full === "number" ? full : 1, n = function (k) { return Math.max(240, Math.round(k * F)); };
    var k2 = B.k1 + 3 + B.b1 % 6;
    function curve(f, steps) {
      g.beginPath();
      for (var j = 0; j <= steps; j++) { var th = TAU * j / steps, r = f(th), x = C + r * Math.cos(th), y = C + r * Math.sin(th); if (j) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    var i, ph;
    g.lineWidth = w * 1.1;
    for (i = 0; i < B.N; i++) { ph = TAU * i / B.N; (function (ph) { curve(function (th) { return P * Q * (.47 + B.a1 * Math.sin(B.k1 * th + ph) + B.a2 * Math.sin(k2 * th - 2 * ph)); }, full ? n(1800) : 420); })(ph); }
    g.lineWidth = w * 1.4;
    curve(function () { return P * Q * .72; }, n(720));
    if (!full) return;
    curve(function () { return P * Q * .745; }, n(720));
    g.lineWidth = w * .9;
    for (i = 0; i < B.M; i++) { (function (r0, ph) { curve(function (th) { return r0 + P * B.a4 * Math.sin(B.m * th + ph); }, n(1200)); })(P * (.04 + .17 * i / B.M), i * .61); }
    g.lineWidth = w * 1.4;
    curve(function () { return P * .228; }, n(720));
    g.lineWidth = w;
    for (i = 0; i < B.N1; i++) { (function (ph) { curve(function (th) { return P * (.84 + B.a3 * Math.sin(B.k3 * th + ph)); }, n(1800)); })(TAU * i / B.N1); }
    g.lineWidth = w * 1.4;
    curve(function () { return P * .965; }, n(720));
    curve(function () { return P * .985; }, n(720));
  }

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = "precision highp float;" +
    "uniform sampler2D uH;uniform vec2 uC;uniform float uR,uSig;uniform vec3 uL;uniform vec4 uSafe;" +
    "float hgt(vec2 p){vec2 q=(p-uC)/(2.*uR)+.5;if(q.x<0.||q.y<0.||q.x>1.||q.y>1.)return 0.;return texture2D(uH,vec2(q.x,1.-q.y)).r;}" +
    "void main(){" +
    " vec2 p=gl_FragCoord.xy;" +
    " float H=hgt(p),hx=hgt(p+vec2(1.,0.))-hgt(p-vec2(1.,0.)),hy=hgt(p+vec2(0.,1.))-hgt(p-vec2(0.,1.));" +
    " vec3 n=normalize(vec3(hx*2.2,hy*2.2,1.));" +
    " vec3 L=uL-vec3(p,0.);float d=length(L.xy);vec3 h=normalize(normalize(L)+vec3(0.,0.,1.));" +
    " vec2 rp=p-uC;float disc=1.-smoothstep(uR*.99,uR*1.002,length(rp));" +
    " float safe=uSafe.x>1.5?1.-smoothstep(uSafe.y,uSafe.z,p.y):uSafe.x>.5?smoothstep(uSafe.y,uSafe.z,p.x):1.;" +
    " vec3 t=vec3(normalize(vec2(-rp.y,rp.x)+1e-4),0.);t=normalize(t-n*dot(n,t));" +
    " float th=dot(t,h);float aniso=pow(sqrt(max(0.,1.-th*th)),96.);" +
    " float fall=exp(-d*d/(2.*uSig*uSig));" +
    " float spec=pow(max(dot(n,h),0.),48.);" +
    " float groove=smoothstep(.03,.3,H);" +
    " vec3 add=vec3(.102,.188,.314)*aniso*fall*.34+vec3(.91,.722,.31)*groove*.055*(.3+fall)+vec3(.969,.847,.557)*groove*spec*fall*.58;" +
    " add*=disc*safe;" +
    " gl_FragColor=vec4(add,max(add.r,max(add.g,add.b)));" +
    "}";

  var HM = {};
  var idle = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 1500 }); } : function (f) { setTimeout(f, 120); };
  function begin(host) { idle(function () { mount(host); }); }
  function start() {
    if (!window.IntersectionObserver) { Array.prototype.forEach.call(hosts, begin); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); begin(e.target); } }); }, { rootMargin: "320px 0px" });
    Array.prototype.forEach.call(hosts, function (h) { io.observe(h); });
  }
  /* the engraving is cut on the reader's first move (a scroll, a touch, the pointer, a key), never while the page is
     still loading, so the first screen and the button come first */
  var go = false, EV = ["scroll", "pointermove", "pointerdown", "touchstart", "keydown", "wheel"];
  function first() { if (go) return; go = true; EV.forEach(function (e) { removeEventListener(e, first, true); }); start(); }
  EV.forEach(function (e) { addEventListener(e, first, { capture: true, passive: true }); });

  function mount(host) {
    var hash = host.getAttribute("data-seal") || "";
    if (!/^[0-9a-f]{64}$/.test(hash) || !host.parentNode) return;
    var B = bands(hash);
    var cv = document.createElement("canvas"); cv.className = "as-plate"; cv.setAttribute("aria-hidden", "true");
    host.parentNode.insertBefore(cv, host);
    var stage = (host.parentNode.closest && host.parentNode.closest(".gl-stage")) || host.closest("section, .band-hero") || host.parentNode;
    var h1 = stage.querySelector("h1") || stage.querySelector("[data-plate-copy]"), copy = !h1 || host.contains(h1) ? null : h1.parentNode.contains(host) ? h1 : h1.parentNode;

    var gl = null, prog = null, U = {}, tex = null, texS = 0;
    try { gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false }); } catch (e) { gl = null; }
    if (gl) {
      try {
        var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader"); return s; };
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
        gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var a = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        ["uC", "uR", "uSig", "uL", "uSafe"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        cv.className = "as-plate as-plate-gl"; cv.style.opacity = "0"; cv.style.transition = "opacity .8s ease"; cv.style.webkitMaskImage = cv.style.maskImage = "none";
      } catch (e) {
        gl = null; var fresh = document.createElement("canvas"); fresh.className = "as-plate"; fresh.setAttribute("aria-hidden", "true");
        cv.parentNode.replaceChild(fresh, cv); cv = fresh;
      }
    }
    var ctx = gl ? null : cv.getContext("2d");
    if (!gl && !ctx) return;

    var D = 0, dpr = 1, last = "", lamp = { x: 0, y: 0, tx: 0, ty: 0 }, raf = 0, safe = [0, 0, 0, 0];

    function heightMap(S) {
      var k = hash + "/" + S; if (HM[k]) return HM[k];
      return (HM[k] = cut(S));
    }
    function cut(S) {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, S, S); g.strokeStyle = "#fff"; g.lineJoin = "round";
      engrave(g, S, B, S >= 2048 ? 1 : .4, S / 1900);
      var s = document.createElement("canvas"); s.width = s.height = S;
      var sg = s.getContext("2d"); if ("filter" in sg) sg.filter = "blur(" + (S / 2300).toFixed(2) + "px)"; sg.drawImage(c, 0, 0);
      return s;
    }
    function rest() {
      var W = cv.width, Hh = cv.height, r = cv.getBoundingClientRect();
      if (fine && !reduce) return null;
      if (reduce || !r.height) return [W * .26, Hh * .82];
      var t = Math.min(1, Math.max(0, (innerHeight * .55 - r.top) / r.height));
      return [W * (.16 + .62 * t), Hh * (.86 - .5 * t)];
    }
    function frame() {
      raf = 0;
      if (!gl) return;
      lamp.x += (lamp.tx - lamp.x) * (reduce ? 1 : .14); lamp.y += (lamp.ty - lamp.y) * (reduce ? 1 : .14);
      var P = cv.width / 2;
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uC, P, P); gl.uniform1f(U.uR, P); gl.uniform1f(U.uSig, P * .62);
      gl.uniform3f(U.uL, lamp.x, lamp.y, P * .42); gl.uniform4f(U.uSafe, safe[0], safe[1], safe[2], 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (cv.style.opacity !== "1") cv.style.opacity = "1";
      if (Math.abs(lamp.tx - lamp.x) + Math.abs(lamp.ty - lamp.y) > .5) raf = requestAnimationFrame(frame);
    }
    function ask() { if (!raf) raf = requestAnimationFrame(frame); }
    function aim(x, y) { lamp.tx = x; lamp.ty = y; ask(); }

    function layout() {
      var w = host.offsetWidth, h = host.offsetHeight; if (!w || !h) return;
      var D0 = Math.min(1040, Math.max(w * 1.9, h * 1.24));
      D = Math.round(D0 * 1.25); dpr = Math.min(gl ? 1.5 : 2, window.devicePixelRatio || 1);
      var left = host.offsetLeft + w / 2 - D / 2, top = host.offsetTop + h / 2 - D / 2, key = [D, dpr, Math.round(left), Math.round(top)].join();
      if (key === last) return; last = key;
      cv.style.width = cv.style.height = D + "px"; cv.style.left = Math.round(left) + "px"; cv.style.top = Math.round(top) + "px";
      cv.width = cv.height = Math.round(D * dpr);
      /* on a glass stage the engraving fades out at the stage's top and foot, so no plate ends on a cut line */
      if (stage.classList && stage.classList.contains("gl-stage")) {
        var sr0 = stage.getBoundingClientRect(), cr0 = cv.getBoundingClientRect(), a0 = Math.round(sr0.top - cr0.top), z0 = Math.round(sr0.bottom - cr0.top), f0 = Math.min(140, Math.round(sr0.height / 4));
        var mk = "linear-gradient(to bottom,transparent " + a0 + "px,#000 " + (a0 + f0) + "px,#000 " + (z0 - f0) + "px,transparent " + z0 + "px)";
        cv.style.webkitMaskImage = cv.style.maskImage = mk;
      }
      if (!gl) {
        ctx.clearRect(0, 0, cv.width, cv.height); ctx.strokeStyle = "#E8B84F"; ctx.lineJoin = "round";
        engrave(ctx, cv.width, B, false, Math.max(1, dpr * .9));
        return;
      }
      var S = cv.width > 1200 ? 2048 : 1024;
      if (S !== texS) { texS = S; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightMap(S)); }
      var cr = cv.getBoundingClientRect(), hr = host.getBoundingClientRect(); safe = [0, 0, 0, 0];
      if (copy) {
        var tr = copy.getBoundingClientRect();
        if (tr.right <= hr.left + 1) { var x0 = (tr.right - cr.left + 8) * dpr; safe = [1, x0, x0 + 96 * dpr, 0]; }
        else if (tr.bottom <= hr.top + 1) { var y1 = (cr.bottom - tr.bottom - 8) * dpr; safe = [2, y1 - 96 * dpr, y1, 0]; }
      }
      var r0 = rest();
      if (r0) { lamp.x = lamp.tx = r0[0]; lamp.y = lamp.ty = r0[1]; }
      else if (!lamp.tx && stage.classList && stage.classList.contains("gl-stage")) { lamp.x = lamp.tx = (hr.left - cr.left + hr.width * .22) * dpr; lamp.y = lamp.ty = (cr.bottom - hr.top - hr.height * .12) * dpr; }
      else if (!lamp.tx) { lamp.x = lamp.tx = cv.width * .26; lamp.y = lamp.ty = cv.height * .82; }
      ask();
    }
    function soon(ms) { clearTimeout(soon.t); soon.t = setTimeout(layout, ms); }
    layout();
    addEventListener("resize", function () { soon(120); });
    if (window.ResizeObserver) { try { new ResizeObserver(function () { soon(60); }).observe(host); } catch (e) {} }
    if (gl) cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); cv.style.display = "none"; });

    /* the lamp: on a desk the light falls where the reader points; on a phone it travels with the scroll */
    if (reduce) return;
    if (fine) {
      if (gl) addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); aim((e.clientX - r.left) * dpr, (r.bottom - e.clientY) * dpr); }, { passive: true });
      else stage.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect(); cv.style.setProperty("--lx", (e.clientX - r.left).toFixed(0) + "px"); cv.style.setProperty("--ly", (e.clientY - r.top).toFixed(0) + "px");
      });
    } else if (gl) {
      addEventListener("scroll", function () { var r0 = rest(); if (r0) aim(r0[0], r0[1]); }, { passive: true });
    }
  }
})();
