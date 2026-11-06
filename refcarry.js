/* refcarry.js. A visit that lands with ?ref= or ?utm_source= keeps that tag on the
   links it follows inside the site, and hands it to Stripe as client_reference_id,
   only when the tag is on the campaign allowlist below. Anything else, including
   a name, a phone number or an email address, is ignored and the checkout is
   marked client_reference_id=site. test-grok stays test-grok. Nothing is stored
   on the reader's device. The site default is not written onto ordinary page links. */
(function (root) {
  "use strict";
  var DEFAULT_TAG = "site";
  /* Approved campaign tags only. x-bio and x-pin are the X bio and pin links.
     test-grok marks an authorised test. site is the untagged default. */
  var CAMPAIGNS = { "test-grok": 1, "x-bio": 1, "x-pin": 1, "site": 1 };
  function campaign(r) { return CAMPAIGNS[r] ? r : ""; }
  function tagFrom(search) {
    var q;
    try { q = new URLSearchParams(search.charAt(0) === "?" ? search.slice(1) : search); }
    catch (e) { return DEFAULT_TAG; }
    return campaign(q.get("ref") || q.get("utm_source")) || DEFAULT_TAG;
  }
  function rewrite(href, pageHref, tag) {
    if (!campaign(tag) || !href) return null;
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
  var api = { campaign: campaign, tagFrom: tagFrom, rewrite: rewrite, CAMPAIGNS: CAMPAIGNS, DEFAULT_TAG: DEFAULT_TAG };
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
