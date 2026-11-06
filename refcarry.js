/* refcarry.js. A visit that lands with ?ref= or ?utm_source= keeps that tag on the
   links it follows inside the site, and hands it to Stripe as client_reference_id.
   A visit with no valid tag still sends client_reference_id=site, so an untagged
   checkout is not mistaken for a tagged one. test-grok stays test-grok.
   Nothing is stored on the reader's device. No email or other private text is
   accepted as a tag. The default tag is not written onto ordinary page links. */
(function (root) {
  "use strict";
  var DEFAULT_TAG = "site";
  function ok(r) { return !!r && /^[A-Za-z0-9_-]{1,40}$/.test(r); }
  function tagFrom(search) {
    var q;
    try { q = new URLSearchParams(search.charAt(0) === "?" ? search.slice(1) : search); }
    catch (e) { return DEFAULT_TAG; }
    var incoming = q.get("ref") || q.get("utm_source");
    return ok(incoming) ? incoming : DEFAULT_TAG;
  }
  function rewrite(href, pageHref, tag) {
    if (!ok(tag) || !href) return null;
    try {
      if (/^https:\/\/buy\.stripe\.com\//.test(href)) {
        var u = new URL(href);
        u.searchParams.set("client_reference_id", tag);
        u.searchParams.set("utm_source", tag);
        u.searchParams.set("utm_medium", "site");
        return u.toString();
      }
      if (tag === DEFAULT_TAG) return null;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.charAt(0) === "#") return null;
      var v = new URL(href, pageHref);
      var page = new URL(pageHref);
      if (v.origin !== page.origin) return null;
      if (!v.searchParams.has("ref")) v.searchParams.set("ref", tag);
      return v.pathname + v.search + v.hash;
    } catch (e) { return null; }
  }
  var api = { ok: ok, tagFrom: tagFrom, rewrite: rewrite, DEFAULT_TAG: DEFAULT_TAG };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;
  var tag = tagFrom(window.location.search);
  function stamp(a) {
    var next = rewrite(a.getAttribute("href") || "", window.location.href, tag);
    if (next) a.href = next;
  }
  function stampAll() {
    var as = document.querySelectorAll("a[href]");
    for (var i = 0; i < as.length; i++) stamp(as[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", stampAll);
  else stampAll();
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (a) stamp(a);
  }, true);
  root.Refcarry = api;
})(typeof window !== "undefined" ? window : globalThis);
