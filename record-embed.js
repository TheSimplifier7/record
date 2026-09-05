/* record-embed.js  ·  THE SIMPLIFIER  ·  the record, live, on someone else's page
   Added 5 September 2026.

   One script tag. Drops the live tally and the last graded row into any page:

     <script src="https://thesimplifier7.github.io/record/record-embed.js" async></script>

   Optional attributes on the tag:
     data-theme="light" | "dark"      default light
     data-width="320px"               default 100% of the container, max 420px
     data-rows="1"                    how many of the latest graded rows to show, 0 to 3

   WHAT IT DOES. Fetches record.json from the record itself, so the numbers on
   the host page are the numbers on the ledger at the moment of loading and
   can never be typed, cached or flattered by the host. Renders inside a
   shadow root so the host page's CSS cannot touch it and it cannot touch the
   host's. No cookies, no tracking, no third party, nothing sent anywhere.

   FAIL CLOSED. If record.json cannot be fetched, it renders one plain link to
   the record and nothing else. It never shows a stale number.

   WHY. The record is the one thing in this space nobody else can show. Until
   today it lived behind a link. Now it can live on every newsletter, blog and
   show page that wants a graded ledger beside its own words, and every one of
   those pages becomes a door to the record that this desk does not have to
   feed. Brand law applies to every string below. */
(function () {
  var RECORD = "https://thesimplifier7.github.io/record/";
  var me = document.currentScript;
  if (!me) return;
  /* record.json is fetched from wherever this script itself was served, so the
     embed follows the record if it ever moves and can be tested on any copy. */
  var BASE = (me.src || RECORD).replace(/record-embed\.js.*$/, "");
  var JSON_URL = BASE + "record.json";

  var theme = (me.getAttribute("data-theme") || "light").toLowerCase() === "dark" ? "dark" : "light";
  var width = me.getAttribute("data-width") || "";
  var rowsN = Math.max(0, Math.min(3, parseInt(me.getAttribute("data-rows") || "1", 10) || 0));

  var host = document.createElement("div");
  host.setAttribute("data-simplifier-record", "");
  if (width) host.style.width = width;
  host.style.maxWidth = width ? width : "420px";
  me.parentNode.insertBefore(host, me);
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var T = theme === "dark"
    ? { bg: "#141210", panel: "#1D1A16", ink: "#EFE8DC", ink2: "#CFC6B8", mute: "#8E8474", rule: "#4A4238", pass: "#5FA57A", miss: "#D2764A", nr: "#8E8474", open: "#6BA3C7", gold: "#CBA43C" }
    : { bg: "#C2BAAE", panel: "#CBC4B9", ink: "#191510", ink2: "#3E372C", mute: "#736A5C", rule: "#8B8071", pass: "#163821", miss: "#7A2A11", nr: "#5A5145", open: "#1B3646", gold: "#8A6A1F" };

  var css = "" +
    ":host{all:initial;display:block}" +
    ".w{font-family:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;background:" + T.bg + ";color:" + T.ink2 + ";border:1px solid " + T.rule + ";padding:14px 16px 12px;line-height:1.4;font-variant-numeric:tabular-nums}" +
    ".m{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid " + T.ink + ";padding-bottom:7px;margin-bottom:10px}" +
    ".n{font-size:10px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:" + T.ink + "}" +
    ".d{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:" + T.mute + "}" +
    ".g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}" +
    ".s b{display:block;font-size:24px;font-weight:600;line-height:1;letter-spacing:-.02em}" +
    ".s span{display:block;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:" + T.mute + ";margin-top:4px}" +
    ".pass{color:" + T.pass + "} .miss{color:" + T.miss + "} .nr{color:" + T.nr + "} .open{color:" + T.open + "}" +
    ".r{border-top:1px solid " + T.rule + ";padding:8px 0 0;font-size:11px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}" +
    ".r .lv{font-weight:600;color:" + T.gold + "} .r .gw{font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:9.5px}" +
    ".r .dt{color:" + T.mute + ";font-size:9.5px;margin-left:auto}" +
    ".f{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:8px;border-top:1px solid " + T.rule + "}" +
    ".f a{color:" + T.ink + ";text-decoration:none;border-bottom:1px solid " + T.gold + ";font-size:10px;letter-spacing:.06em}" +
    ".f .law{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:" + T.mute + "}" +
    ".only a{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;color:" + T.ink + "}";

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(iso) { if (!iso) return ""; var p = iso.split("-"); var M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return (+p[2]) + " " + M[+p[1] - 1] + " " + p[0]; }
  function cls(g) { return g === "pass" ? "pass" : (g === "miss" || g === "partial") ? "miss" : g === "pending" ? "open" : "nr"; }
  function closeOf(res) { var m = String(res || "").match(/close printed ([\d,]+\.?\d*)/i) || String(res || "").match(/closed (?:the week )?at ([\d,]+\.?\d*)/i); return m ? m[1] : ""; }

  function fallback() {
    root.innerHTML = "<style>" + css + "</style><div class='only'><a href='" + RECORD + "'>The Simplifier · the record</a></div>";
  }

  function render(rec) {
    var t = rec.tally || {};
    var graded = (rec.rows || []).filter(function (r) { return r.grade !== "pending" && r.graded_on_close; })
      .sort(function (a, b) { return (b.graded_on_close || "").localeCompare(a.graded_on_close || "") || (b.named || "").localeCompare(a.named || ""); })
      .slice(0, rowsN);
    var lastGraded = graded.length ? graded[0].graded_on_close : (rec.rows || []).map(function (r) { return r.graded_on_close; }).filter(Boolean).sort().pop();

    var h = "<style>" + css + "</style><div class='w'>" +
      "<div class='m'><span class='n'>The Simplifier</span><span class='d'>The record · " + esc(fmt(lastGraded)) + " close</span></div>" +
      "<div class='g'>" +
      "<div class='s'><b class='pass'>" + esc(t.held) + "</b><span>held</span></div>" +
      "<div class='s'><b class='miss'>" + esc(t.wrong) + "</b><span>wrong, kept</span></div>" +
      "<div class='s'><b class='nr'>" + esc(t.never_reached) + "</b><span>never reached</span></div>" +
      "<div class='s'><b class='open'>" + esc(t.open) + "</b><span>open</span></div>" +
      "</div>";
    graded.forEach(function (r) {
      var c = closeOf(r.result);
      h += "<div class='r'><span>" + esc(r.metal) + "</span><span class='lv'>" + esc(r.level) + "</span><span class='gw " + cls(r.grade) + "'>" + esc(r.grade_word) + "</span>" +
        (c ? "<span>close " + esc(c) + "</span>" : "") + "<span class='dt'>named " + esc(fmt(r.named)) + "</span></div>";
    });
    h += "<div class='f'><a href='" + RECORD + "'>Every row, including the wrong ones</a><span class='law'>Nothing deleted</span></div></div>";
    root.innerHTML = h;
  }

  try {
    fetch(JSON_URL, { cache: "no-store", mode: "cors" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rec) { if (!rec || !rec.tally || !rec.rows) throw new Error("shape"); render(rec); })
      .catch(fallback);
  } catch (e) { fallback(); }
})();
