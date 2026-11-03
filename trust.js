(function () {
  "use strict";
  var els = document.querySelectorAll("[data-trust]");
  if (!els.length) return;
  var KEYS = ["resolved", "held", "wrong", "never_reached", "open"], done = false;
  function fill() {
    if (done) return;
    done = true;
    fetch("record.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(function (d) {
      var t = d && d.tally;
      if (!t || !KEYS.every(function (k) { return typeof t[k] === "number" && isFinite(t[k]) && t[k] >= 0; }) || !(t.resolved > 0)) return;
      if (t.held + t.wrong !== t.resolved) return;
      Array.prototype.forEach.call(els, function (el) {
        KEYS.forEach(function (k) { var s = el.querySelector('[data-t="' + k + '"]'); if (s) s.textContent = String(t[k]); });
        var tt = el.querySelector('[data-t="total"]'); if (tt) tt.textContent = String(t.resolved + t.never_reached + t.open);
        var n = el.querySelector(".trust-n"); if (n) n.hidden = false;
      });
    }).catch(function () {});
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fill(); }
    }, { rootMargin: "800px 0px" });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  } else fill();
})();
