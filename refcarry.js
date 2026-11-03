/* refcarry.js, Design Lab, 3 November 2026. Which post brought the trial: a visit that lands with ?ref= (or utm_source)
   keeps that tag on the links it follows inside the site, and hands it to Stripe on the way to checkout, where it comes
   back on the welcome page. Nothing is stored on the reader's device; the tag travels in the address only. */
(function () {
  "use strict";
  var q;
  try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
  var r = q.get("ref") || q.get("utm_source");
  if (!r || !/^[A-Za-z0-9_-]{1,40}$/.test(r)) return;
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var h = a.getAttribute("href") || "";
    try {
      if (/^https:\/\/buy\.stripe\.com\//.test(h)) {
        var u = new URL(h);
        u.searchParams.set("client_reference_id", r);
        u.searchParams.set("utm_source", r);
        u.searchParams.set("utm_medium", "site");
        a.href = u.toString();
        return;
      }
      if (/^[a-z]+:/i.test(h) || h.charAt(0) === "#") return;
      var v = new URL(h, window.location.href);
      if (v.origin !== window.location.origin) return;
      if (!v.searchParams.has("ref")) v.searchParams.set("ref", r);
      a.href = v.pathname + v.search + v.hash;
    } catch (x) {}
  }, true);
})();
