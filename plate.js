/* =========================================================================
   plate.js  ·  THE PLATE  ·  12 November 2026  ·  note 70 on the record

   Under the levels lies the record's seal, engraved: the rosette ASSAY draws
   on every card (assay-core.js) and the lamp drew under the record's head
   (lamp.js, note 63). It is drawn from the SHA-256 of every row on the
   record, one line per row, oldest first, number|named|metal|level|side|
   grade|close. Change one figure on the record and the engraving changes.

   The seal is worked out when the page is written and carried on the element
   as data-seal, so this file asks the network for nothing. It draws the
   engraving once, on a plain canvas behind the glass, and again if the page
   is resized. The light over it follows the reader's pointer: the one thing
   on the site that moves. With reduced motion, or on a phone, the light
   stays where the key light of every card sits, upper left.
   With scripts off the page reads as it does without the plate.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-plate][data-seal]");
  if (!hosts.length || !window.HTMLCanvasElement) return;
  var reduce = false; try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* the rosette, as on every card: the same five bytes, the same curves */
  function rosette(hash) {
    var by = function (i) { return parseInt(hash.slice(i * 2, i * 2 + 2), 16); };
    var k1 = 5 + by(0) % 8, k2 = k1 + 3 + by(1) % 6, N = 30 + by(2) % 16, a1 = .11 + by(3) / 255 * .05, a2 = .05 + by(4) / 255 * .04, out = [];
    for (var i = 0; i < N; i++) {
      var ph = 2 * Math.PI * i / N, c = new Float32Array(842);
      for (var j = 0; j <= 420; j++) { var th = 2 * Math.PI * j / 420, r = .47 + a1 * Math.sin(k1 * th + ph) + a2 * Math.sin(k2 * th - 2 * ph); c[2 * j] = r * Math.cos(th); c[2 * j + 1] = r * Math.sin(th); }
      out.push(c);
    }
    return out;
  }

  Array.prototype.forEach.call(hosts, function (host) {
    var hash = host.getAttribute("data-seal") || "";
    if (!/^[0-9a-f]{64}$/.test(hash) || !host.parentNode) return;
    var curves = rosette(hash);
    var cv = document.createElement("canvas"); cv.className = "as-plate"; cv.setAttribute("aria-hidden", "true");
    host.parentNode.insertBefore(cv, host);
    var ctx = cv.getContext("2d"); if (!ctx) return;
    var last = "";
    function draw() {
      var w = host.offsetWidth, h = host.offsetHeight; if (!w || !h) return;
      var D = Math.round(Math.min(1040, Math.max(w * 1.9, h * 1.24))), dpr = Math.min(2, window.devicePixelRatio || 1);
      var left = host.offsetLeft + w / 2 - D / 2, top = host.offsetTop + h / 2 - D / 2, key = [D, dpr, Math.round(left), Math.round(top)].join();
      if (key === last) return; last = key;
      cv.style.width = cv.style.height = D + "px"; cv.style.left = Math.round(left) + "px"; cv.style.top = Math.round(top) + "px";
      cv.width = cv.height = Math.round(D * dpr);
      var R = D * dpr / 2;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = "#E8B84F"; ctx.lineWidth = Math.max(1, dpr * .9); ctx.lineJoin = "round";
      for (var i = 0; i < curves.length; i++) {
        var c = curves[i]; ctx.beginPath();
        for (var j = 0; j <= 420; j++) { var x = R + c[2 * j] * R, y = R + c[2 * j + 1] * R; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(1, dpr * 1.4);
      ctx.beginPath(); ctx.arc(R, R, R * .72, 0, 2 * Math.PI); ctx.stroke();   /* the ring that bounds the engraving; the cards' outer ring is left off, so no line runs behind the words beside the plate */
    }
    draw();
    var t = 0; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 120); });
    if (window.ResizeObserver) { try { new ResizeObserver(function () { clearTimeout(t); t = setTimeout(draw, 60); }).observe(host); } catch (e) {} }

    /* the lamp: the light falls where the reader points */
    var fine = false; try { fine = matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) {}
    if (reduce || !fine) return;
    var stage = host.closest("section, .band-hero") || host.parentNode, raf = 0, px = 0, py = 0;
    stage.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = cv.getBoundingClientRect();
        cv.style.setProperty("--lx", (px - r.left).toFixed(0) + "px"); cv.style.setProperty("--ly", (py - r.top).toFixed(0) + "px");
      });
    });
    stage.addEventListener("pointerleave", function () { cv.style.removeProperty("--lx"); cv.style.removeProperty("--ly"); });
  });
})();
