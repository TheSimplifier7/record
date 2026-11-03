/* svgfloor.js, Design Lab, 3 November 2026. The type floor for the words inside the charts: no chart label is drawn
   under 12 px on a desktop or 13 px on a phone, measured as it lands on the screen. A chart that shrinks to a phone
   would shrink its labels with it; this sizes each label back up to the floor and, where two then collide, lets the
   axis and other secondary labels give way to the line's own labels. It changes no figure and no mark. */
(function () {
  "use strict";
  var t0 = 0;
  function floor() { return window.innerWidth <= 760 ? 13 : 12; }
  function rank(t) {
    var c = (t.getAttribute("class") || "") + " " + (t.parentNode && t.parentNode.getAttribute ? t.parentNode.getAttribute("class") || "" : "");
    if (/ref|tag|row|lv|line|lab|cap/.test(c)) return 0;
    if (/axis|tick|div/.test(c)) return 2;
    return 1;
  }
  function run() {
    var fl = floor();
    Array.prototype.forEach.call(document.querySelectorAll("svg"), function (svg) {
      var ts = Array.prototype.slice.call(svg.querySelectorAll("text"));
      if (!ts.length) return;
      var box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return;
      ts.forEach(function (t) {
        t.style.visibility = "";
        var m = t.getScreenCTM && t.getScreenCTM();
        if (!m) return;
        var sc = Math.sqrt(m.a * m.a + m.b * m.b);
        if (!sc) return;
        if (t.__fs0 === undefined) { t.style.fontSize = ""; t.__fs0 = parseFloat(window.getComputedStyle(t).fontSize) || 0; }
        if (!t.__fs0) return;
        t.style.fontSize = t.__fs0 * sc < fl - 0.01 ? (fl / sc).toFixed(3) + "px" : "";
      });
      var kept = [];
      ts.slice().sort(function (a, b) { return rank(a) - rank(b); }).forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var hit = kept.some(function (k) { return !(r.right < k.left - 2 || r.left > k.right + 2 || r.bottom < k.top - 1 || r.top > k.bottom + 1); });
        if (hit && rank(t) > 0) t.style.visibility = "hidden"; else kept.push(r);
      });
    });
  }
  function soon() { clearTimeout(t0); t0 = setTimeout(function () { if (window.requestAnimationFrame) requestAnimationFrame(run); else run(); }, 180); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", soon); else soon();
  window.addEventListener("load", soon);
  window.addEventListener("resize", soon);
  if ("MutationObserver" in window) {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var n = ms[i].target;
        if (n && (n.nodeName === "svg" || (n.querySelector && n.querySelector("svg")) || (n.closest && n.closest("svg")))) { soon(); return; }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
