/* =========================================================================
   house_parts.js  ·  THE HOUSE  ·  22 October 2026  ·  note 53 on the record

   The head of the record (note 52), as parts every page beside it shares:
   the tags for the head of the file, the strip and the band, the navy head
   with the page's title, the bar at the foot of a phone, and the inks that
   carry a page written in the old dark look (the look The Path retired on
   10 October 2026) onto the record's ground: white by day, navy at night.
   The look itself is house.css and what it does is house.js, both beside
   the record; each page names them with the first ten characters of their
   SHA-256, so a changed file is a new address.

   Used by page_parts.js (tools.html, weeks.html and every week page),
   make_bank_pages.js, make_misses.js and make_house.js (the pages written
   by hand). Writes nothing itself.

   The words are the record's own: its band, its bar, its key line.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/* 15 Nov 2026, HALLMARK, his word: every TradingView link carries his partner tag, aff_id=1174265, and nothing else.
   It read: https://www.tradingview.com/u/TheSimplifier7/#published-scripts */
const AFF = "aff_id=1174265";
const aff = u => {
  if (!/^https:\/\/www\.tradingview\.com\//.test(u) || /[?&]aff_id=/.test(u)) return u;
  const i = u.indexOf("#"), base = i < 0 ? u : u.slice(0, i), hash = i < 0 ? "" : u.slice(i);
  return base + (base.includes("?") ? "&amp;" : "?") + AFF + hash;
};
const TV = aff("https://www.tradingview.com/u/TheSimplifier7/#published-scripts");

/* 15 Nov 2026, HALLMARK, his brief of 15 November. The doors to TradingView, used exactly as given.
   PARTNER is the free account through his partner link; BLACK_FRIDAY replaces it from 23 Nov 09:00 to 2 Dec 08:59 Madrid
   (house.js makes the swap in the reader's browser; without scripts the account link stays). SPACE is his Paid Space,
   in review: SPACE_LIVE stays false until he says TradingView has approved it. While false, no page carries the link.
   To turn it on: set SPACE_LIVE to true, then run make_home.js, make_daily.js and make_chrome.js, and the verifiers. */
const PARTNER = "https://www.tradingview.com/?aff_id=1174265";
const BLACK_FRIDAY = "https://www.tradingview.com/black-friday/?aff_id=1174265";
const SPACE = "https://www.tradingview.com/scripts/marketplace/TheSimplifier7/?aff_id=1174265";
const SPACE_LIVE = false;
const OUT = 'target="_blank" rel="sponsored noopener"';
const PARTNER_LINE = "TradingView links on this site are partner links. If you sign up through one and later buy a TradingView plan, TradingView pays me a commission. It costs you nothing extra.";
const BOTH = "Same five tools either way. Pick one route. If you already pay on this site, do not also subscribe on TradingView, and the other way round.";
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const vOf = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname, file))).digest("hex").slice(0, 10);

const FONTS = '<link rel="preload" href="barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n' +
  '<link rel="preload" href="barlow-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>\n' +  /* 12 Nov 2026, note 70: titles are Barlow at 500. It read: barlow-condensed-latin-700-normal.woff2 */
  '<style id="fonts">' + fs.readFileSync(path.join(__dirname, "fonts.css"), "utf8").trim() + '</style>';
/* The reader's choice on the record, applied before first paint, so nothing flashes. */
/* 10 Nov 2026, note 68: the switch is off and every page names the dark ground on its html tag, so no script is needed before first paint. */
const THEME_JS = "";

/* The tags a page's head carries for the house: after its own styles, so the house's few rules come last. */
const ICONS = "<link rel=\"icon\" href=\"/favicon.ico?v=2\" sizes=\"16x16 32x32 48x48\">\n<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/icon-192.png?v=2\">\n<link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png?v=2\">";  /* 1 Nov 2026: the icons index.html carries, on every page that takes the house head */
function headTags({ fonts = true, lean = false } = {}) {
  /* 12 Nov 2026, note 70: lean is for a page drawn whole in the calm layer (the front page, the daily levels): brand.css carries the band, the buttons, the bar and the foot complete, so the four older layers are not asked for. */
  if (lean) return ICONS + "\n" + (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="brand.css?v=${vOf("brand.css")}">`;
  /* 29 Oct 2026, note 63: the page in ASSAY, as the record's own page is drawn. It read: return (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">`; */
  return ICONS + "\n" + (fonts ? FONTS + "\n" : "") + `<link rel="stylesheet" href="house.css?v=${vOf("house.css")}">\n<link rel="stylesheet" href="assay-site.css?v=${vOf("assay-site.css")}">\n<link rel="stylesheet" href="floor.css?v=${vOf("floor.css")}">\n<link rel="stylesheet" href="sharp.css?v=${vOf("sharp.css")}">\n<link rel="stylesheet" href="brand.css?v=${vOf("brand.css")}">`; /* 31 Oct 2026, note 64: sharp.css; 7 Nov 2026: brand.css, the flow in ASSAY, loaded last */
}
/* 12 Nov 2026, note 70: the head of a page drawn whole in the calm layer. pre is a script that must run before anything is drawn. */
function leanHead({ title, description, canonical, image, alt, css = "", pre = "", noindex = false }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${noindex ? '<meta name="robots" content="noindex">\n' : ""}<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Simplifier">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@TheSimplifier7">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="theme-color" content="#0B1A2E">
${earlyTags()}
${pre ? pre + "\n" : ""}${headTags({ lean: true })}
<style>${css}</style>
<script data-goatcounter="https://thesimplifier.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body class="cp hs-has-bot">
<a class="skip" href="#main">Skip to the page</a>`;
}
/* 12 Nov 2026, note 70: the record's seal, as ASSAY keys it on every card (assay-core.js) and as the lamp keyed it (lamp.js):
   every row, oldest first, number|named|metal|level|side|grade|close, through SHA-256. plate.js draws the rosette from it. */
function recordSeal(R) {
  const A = require("./assay-core.js");
  const rows = R.rows.map(r => Object.assign({}, r)).sort((a, b) => (a.named < b.named ? -1 : a.named > b.named ? 1 : 0) || (A.ORDER.indexOf(a.metal) - A.ORDER.indexOf(b.metal)));
  rows.forEach((r, i) => { r.no = i + 1; });
  return A.sha256(A.rowKey(rows));
}
const earlyTags = () => '<meta name="color-scheme" content="dark">';

/* The band's places, as on the record. */
/* 17 Nov 2026, his word: the site sells the indicators and the mentorship; the record sits behind them, last in the
   menu. It read: Daily levels, The record, The set, Free tools, Mentorship. */
/* 18 Nov 2026, the team's report (to-10-report.md) by his word: one job, start the trial. The menu is the set, the
   price and the lessons on X; the record, the levels and the mentorship live in the foot. It read: Indicators,
   Mentorship, Free tools. */
const LESSONS = "https://x.com/TheSimplifier7";
/* 27 Nov 2026, his brief of 02:17: the trial button reads Start 7-day free trial, one wording still, on every button. It read: Start 7 days free. */
const BUY = "Start 7-day free trial";
/* 21 Nov 2026, his word: "we need to showcase that we are an indicator lab". The lab joins the band. It read: The set, Pricing, Lessons. */
/* 27 Nov 2026, his brief of 02:17: the menu is the three ways in. It read: The set, The lab, Pricing, Lessons.
   27 Nov 2026, 10:18, his word: free tools join the menu, mentorship goes to its own page, and on a phone the menu
   opens from the band (it was hidden under 760 px, so a phone reached the lab and mentorship only from the foot). */
const NAV = [
  ["lab", "lab.html", "The lab"],
  ["set", "./#set", "Desk Suite"],
  ["tools", "tools.html", "Free tools"],
  ["mentorship", "mentorship.html", "Mentorship"],
  ["lessons", LESSONS, "Lessons"]
];
/* The phone's menu: the same links, opened from the band. No script needed to open it; house.js closes it after a tap. */
const menu = () => `<details class="hs-menu">
      <summary>Menu</summary>
      <nav class="hs-menu-p" aria-label="The site, menu">
        ${NAV.map(([k, href, label]) => `<a href="${href}"${href.startsWith("http") ? ' rel="noopener"' : ""}>${label}</a>`).join("\n        ")}
      </nav>
    </details>`;
const cur = (k, current) => k === current ? ' aria-current="page"' : "";

function strip() {
  return `<div class="hs-strip" id="hs-strip" role="region" aria-label="The record, counted">
  <div class="hs-wrap hs-strip-in">
    <a class="hs-k" href="./">The record</a>
    <span>Graded <b id="hs-graded"></b></span>
    <span class="k-h">Held <b id="hs-held"></b></span>
    <span class="k-w">Wrong, kept <b id="hs-wrong"></b></span>
    <span>Never reached <b id="hs-nr"></b></span>
    <span class="k-o">Open <b id="hs-open"></b></span>
    <span>Deleted <b>0</b></span>
    <span class="hs-next" id="hs-next" hidden><i class="hs-dot" aria-hidden="true"></i><span>Next grade <b id="hs-when"></b> <span id="hs-cd"></span></span></span>
  </div>
</div>`;
}

/* 12 Nov 2026, note 70: the band in the calm layer. The name set as words, the four places, one quiet button to the trial. */
function band(current, where, { fixed = true } = {}) {
  return `<header class="hs-band${fixed ? "" : " hs-static"}">
  <div class="hs-wrap hs-band-in">
    <a class="hs-brand" href="./" aria-label="The Simplifier, home">THE SIMPLIFIER</a>
    <nav class="hs-nav" aria-label="The site">
      ${NAV.map(([k, href, label]) => `<a href="${href}"${cur(k, current)}>${label}</a>`).join("\n      ")}
    </nav>
    ${menu()}
    <div class="hs-tools">
      <a class="hs-btn hs-ghost" href="${SET_CHECKOUT}" data-tv="band-${esc(where)}">${BUY}</a>
    </div>
  </div>
</header>`;
}

/* The head of the page: the eyebrow, the title and the line under it, on the navy. col and pad line it up with the page's own column. */
function hero({ eyebrow = "", title, lede = "", under = "", key = false, col, pad, id }) {
  const style = [col ? `--hs-col:${col}` : "", pad ? `--hs-pad:${pad}` : ""].filter(Boolean).join(";");
  return `<div class="hs-hero"${id ? ` id="${id}"` : ""}><div class="hs-hero-in"${style ? ` style="${style}"` : ""}>
  ${eyebrow ? `<p class="hs-eyebrow">${eyebrow}</p>` : ""}
  <h1 class="hs-h1">${title}</h1>
  ${lede ? `<p class="hs-lede">${lede}</p>` : ""}
  ${key ? `<p class="hs-key"><span><b>Floor:</b> the week must close above it.</span><span><b>Ceiling:</b> the week must close under it.</span><span>Only Friday's close counts.</span></p>` : ""}
  ${under ? `<div class="hs-under">${under}</div>` : ""}
</div></div>`;
}

/* The bar at the foot of a phone. 12 Nov 2026, note 70: four places in words, no pictures. It read: This week, Record, The Fan, Email, each under a drawn icon. */
function bot(current) {
  /* 18 Nov 2026: on a phone, a slim bar with the price and the one button, on every page. */
  return `<nav class="hs-bot" aria-label="The site, on a phone">
  <p class="hs-buy-t">€99 a month, 7 days free</p><a class="hs-btn hs-gold hs-buy-b" href="${SET_CHECKOUT}" data-tv="bar-${esc(current || "page")}">${BUY}</a>
</nav>`;
}
/* The foot of every page. 12 Nov 2026, note 70: three short lists under the name. It read as one line of links joined by dots.
   15 Nov 2026, HALLMARK, rulings R2 to R4: TradingView is the first follow, "levels" not "call", the set of five at €99.
   It read: The call lands every morning before New York opens. Graded at the close. Follow on X. The list read The Fan,
   What it shows, Plans and the free trial, and the menu read The Fan and Try The Fan free. */
const BILLING = "https://billing.stripe.com/p/login/4gMbJ3gw91552dx4cm5kk00";
const RISK = "Education and charting tools only. Not investment advice. Trading involves risk and you can lose money. Past charts do not predict future prices.";
/* 21 Nov 2026, his word of 19:57: "i don't use the record anymore". The foot's first link is the lab. It read: <a href="record.html">The record</a>. record.html stays where it is, whole. */
const fanFoot = () => `<footer class="hs-foot"><div class="hs-wrap hs-foot-in">
  <div class="hs-foot-id">
    <a class="hs-brand" href="./" aria-label="The Simplifier, home">THE SIMPLIFIER</a>
    <p>${RISK}</p>
    <p>${PARTNER_LINE}</p>
  </div>
  <nav aria-label="The site"><p class="hs-foot-h">The site</p><a href="lab.html">The lab</a><a href="tools.html">Free tools</a><a href="${LESSONS}" rel="noopener">Lessons on X</a><a href="mentorship.html">Want it taught one to one? Ask about mentorship.</a></nav>
  <nav aria-label="The small print"><p class="hs-foot-h">The small print</p><a href="terms.html">Terms</a><a href="privacy.html">Privacy</a><a href="disclaimer.html">Disclaimer</a><a href="aviso-legal.html">Aviso legal</a><a href="mailto:hello@thesimplifier7.com">hello@thesimplifier7.com</a><a href="${BILLING}">Manage subscription</a></nav>
</div></footer>`;

/* 15 Nov 2026, HALLMARK, his brief: the record as the proof, once in every buy block, counted from record.json and never typed. */
function proof(R) {
  const t = R.tally;
  return `<p class="as-proof" data-proof>Every level graded in public on the close, wrong ones included. Weekly record: <b>${t.held}</b> held, <b>${t.wrong}</b> wrong, <b>0</b> deleted. <a href="record.html">Read the record</a></p>`;
}

/* The partner block, in his words of 15 November with "I" for "we" (his ruling the same day). The disclosure sits under the button, always shown. */
function partner(id, tag = "h2") {
  return `<aside class="as-partner" data-partner="${esc(id)}" aria-labelledby="pb-${esc(id)}">
  <${tag} class="as-partner-h" id="pb-${esc(id)}">New to TradingView?</${tag}>
  <p>The five tools, and every free one I publish, run on TradingView. If you do not have an account yet, open one through my link. The Basic plan is free.<span data-bf-off> TradingView says that once you buy your first paid plan through a partner link, you get $15 off your next one.</span></p>
  <a class="hs-btn hs-ghost" href="${PARTNER}" ${OUT} data-tv="partner-block" data-bf-href="${BLACK_FRIDAY}" data-bf-text="TradingView's Black Friday sale">Open a free TradingView account</a>
  <p class="as-partner-d">Partner link. If you sign up through it and later buy a TradingView plan, TradingView pays me a commission. It costs you nothing extra.</p>
</aside>`;
}

/* 16 Nov 2026, his word: the email list stays, on his own Google Sheet and Apps Script, sending through Resend from
   hello@thesimplifier7.com. The box posts to the same script the site used before 12 November, with the same fields, so the
   script's double opt-in is unchanged: it answers with check-email.html, sends the confirmation, and adds nothing to the
   list until the link in it is pressed. No script of anyone else's is loaded for it. refcarry.js adds an allowlisted
   campaign tag to source_ref, as it does at checkout. */
/* 17 Nov 2026, his word: the site is a sales funnel for the indicators and the mentorship, the record behind them.
   The paid set, one source for the home page; each line is method.html's own wording of 15 Nov 2026, and
   verify_record checks method.html still carries it. A fifth tool (The Ratchet) joins here when he sends its
   TradingView link, its one question and its chart. */
const SET_TOOLS = [
  { name: "The Fan", win: "Know which side of the mean you are trading from.", img: "set_fan_gold_1h_2026-11-15", h: 480, cap: "Gold, 1 hour, 15 November 2026", alt: "The Fan alone on Bradley's gold 1 hour chart on TradingView, 15 November 2026",
    q: "Which side of the line is price on, and did the last test of it hold?", not: "It says where price stands against the mean. It does not say where price goes next." },
  { name: "The Keel", win: "See the flow, and the exact close that would end it.", img: "set_keel_gold_1h_2026-11-15", h: 480, cap: "Gold, 1 hour, 15 November 2026", alt: "The Keel alone on Bradley's gold 1 hour chart on TradingView, 15 November 2026",
    q: "Which way is the flow running, and what close would end it?", not: "It describes the flow. It does not predict the next move." },
  { name: "The Method", win: "Know how far this leg has run against the legs before it.", img: "set_method_gold_1h_2026-11-15", h: 480, cap: "Gold, 1 hour, 15 November 2026", alt: "The Method alone on Bradley's gold 1 hour chart on TradingView, 15 November 2026",
    q: "How far has this leg run against the legs that came before it?", not: "A leg that has run far is no more due to come back than one that has not." },
  { name: "The Hinge", win: "Know when a swing is confirmed, and where the structure sits.", img: "set_hinge_gold_1h_2026-11-15", h: 480, cap: "Gold, 1 hour, 15 November 2026", alt: "The Hinge alone on Bradley's gold 1 hour chart on TradingView, 15 November 2026",
    q: "Is the swing confirmed, and did the last one hold?", not: "It confirms swings earlier. It is not right more often." },
  /* 18 Nov 2026, his word: The Ratchet joins the set at the same price. Its question is drawn from his own TradingView
     description (the trail that steps only on a full stride, the glow that shows how much of the structure has turned);
     what it will not do is his sentence there. Chart: his, 30 minute, at 00:03 CET on 18 November 2026. */
  { name: "The Ratchet", win: "See how much of the structure has turned, and the close that would flip it.", img: "set_ratchet_gold_30m_2026-11-18", h: 713, cap: "Gold, 30 minute, 18 November 2026", alt: "The Ratchet on Bradley's gold 30 minute chart on TradingView, 18 November 2026",
    tv: "https://www.tradingview.com/script/sVPjezsq-The-Ratchet-TheSimplifier7/",
    q: "Which side of its trail is price on, and how much of the structure has turned?", not: "It is a trail that shows the structure, not an edge." }
];
const MAIL_ENDPOINT = "https://script.google.com/macros/s/AKfycbzBzhbQC6s4R06NSsNWj75AaSExhEO9JtZkk9KUBLyu_cusOmqfNThSORKoNNYjduOr/exec";
/* 27 Nov 2026, 10:31, his word: the email is The Sunday Desk Note, sent Sunday evening (his script moves from Saturday).
   10:18 it read The Monday Level, on Saturday. */
/* 27 Nov 2026, 10:18, his word: the box is for the email he sends on Saturdays, The Monday Level, framed as open-source
   scripts, lab receipts and desk notes ahead of Monday's open, with no promise of a script every week. It sits on the
   front page mid-page, on the lab above the last call, and on levels.html. It read: The week graded, by email. One
   email on Saturday morning: every level of the week, the close that graded it, the wrong ones first. Free. */
function signup(where, { last = true } = {}) {
  return `<section class="hm-sec${last ? " hm-last" : ""} hm-mail" id="email" aria-labelledby="mail-h">
  <div class="hm-in"><div>
    <div class="hm-side"><h2 id="mail-h">The Sunday Desk Note</h2></div>
    <div class="hm-main">
      <p>One email on Sunday evening, ahead of Monday's open: open-source TradingView scripts, receipts from the Empirical Lab and a note from the desk. No macro fairy tales. No spam. Free.</p>
      <form class="as-mail" method="POST" action="${MAIL_ENDPOINT}" accept-charset="UTF-8">
        <input type="hidden" name="action" value="signup">
        <input type="hidden" name="source_ref" value="${where}" data-ref-base="${where}">
        <label class="as-mail-l" for="mail-email">Your email address</label>
        <input id="mail-email" name="email" type="email" autocomplete="email" maxlength="254" required>
        <div class="as-mail-trap" aria-hidden="true"><label for="mail-co">Leave this empty</label><input id="mail-co" name="company" type="text" tabindex="-1" autocomplete="off"></div>
        <label class="as-mail-ok"><input type="checkbox" name="consent" value="yes" required><span>I agree to receive one email a week from The Simplifier and have read the <a href="privacy.html">Privacy policy</a>. I can unsubscribe from any email.</span></label>
        <button class="hs-btn hs-ghost" type="submit">Send me the Sunday Desk Note</button>
        <p class="as-mail-fine">A confirmation email comes first, and nothing else is sent until you confirm.</p>
      </form>
    </div>
  </div></div>
</section>`;
}

/* 27 Nov 2026, 10:18, his word: Jim's words exactly as he approved them, never spliced or rearranged, signed Jim, US, in a
   grid built for two or three voices, next to the Desk Suite and mentorship blocks and on mentorship.html. These are the
   words that ran on the record page until 18 Nov, each answer in its own place. Add a voice only with its owner's OK. */
const VOICES = [
  { who: "Jim, US", what: "Mentorship client",
    lead: "Remoras follow sharks. Knowing what to look for relative to structure and trend, and waiting for the right combination to present itself, makes all the difference in the world.",
    before: "Very inconsistent for lack of trading protocol and discipline.",
    now: "Still a bit gun-shy, but gaining confidence and comfort.",
    also: "From the first post I saw, it was clear the approach and philosophy are set apart from the herd." }
];
const VOICE_FINE = "In their own words, shared with their permission. One trader's experience, not a promise of your result. Trading involves risk and you can lose money.";
function voices(where) {
  if (!VOICES.length) return "";
  return `<div class="vx" data-n="${VOICES.length}">
      ${VOICES.map(v => `<figure class="vx-c gl">
        <blockquote>
          <p class="vx-q">&ldquo;${esc(v.lead)}&rdquo;</p>
          ${v.before ? `<dl class="vx-ba"><div><dt>Before</dt><dd>${esc(v.before)}</dd></div><div><dt>Now</dt><dd>${esc(v.now)}</dd></div></dl>` : ""}
          ${v.also ? `<p class="vx-also">&ldquo;${esc(v.also)}&rdquo;</p>` : ""}
        </blockquote>
        <figcaption><b>${esc(v.who)}</b>${v.what ? `<span>${esc(v.what)}</span>` : ""}</figcaption>
      </figure>`).join("\n      ")}
    </div>
    <p class="vx-fine">${VOICE_FINE}</p>`;
}

/* The plans on method.html: the site's route first, the Paid Space beside it once TradingView approves it. */
/* 15 Nov 2026, his word: the set's Stripe checkout, one address for the plans block and the home hero. */
const SET_CHECKOUT = "https://buy.stripe.com/fZufZjcfT155bO7gZ85kk04";
/* 27 Nov 2026, 10:18, his word: the yearly Desk Suite is built and stays hidden until he gives its Stripe link, has checked
   TradingView's vendor wording, and the Terms cover the 14-day withdrawal on a yearly payment. Turn on: live true, url set. */
const ANNUAL = { live: false, url: "", price: "€990", per: "a year, VAT included", note: "Two months free, and a private 30-minute 1:1 chart audit." };
const SET_TERMS = "7 days free, then €99 a month, VAT included. Card at checkout. Cancel before day 8 and pay nothing.";
function plans(R) {
  const site = `<div class="s4-route" data-route="site">
      ${SPACE_LIVE ? '<p class="s4-route-h">On this site</p>' : ""}
      <p class="s4-price"><b>€99</b> a month for all five, VAT included</p>
      <ol class="s4-steps">
        <li>Start the 7-day trial. Nothing is charged for 7 days.</li>
        <li>Give your TradingView username at checkout, never your password.</li>
        <li>The five tools are added to it within the hour, or by 09:00 Madrid if you join overnight.</li>
      </ol>
      <a class="hs-btn hs-gold plan-btn s4-btn" href="${SET_CHECKOUT}" data-tv="plans-site-trial" data-plan="set">${BUY}</a>
      <p class="s4-fine">${SET_TERMS}</p>
    </div>`;
  const tv = SPACE_LIVE ? `
    <div class="s4-route" data-route="tradingview">
      <p class="s4-route-h">On TradingView</p>
      <p class="s4-price"><b>$99</b> a month for all five, billed by TradingView</p>
      <ol class="s4-steps">
        <li>Subscribe on TradingView's website with your TradingView account.</li>
        <li>TradingView adds the five tools to your account automatically.</li>
      </ol>
      <a class="hs-btn hs-ghost s4-btn" href="${SPACE}" ${OUT} data-tv="plans-tv-space">Subscribe on TradingView</a>
      <p class="s4-fine">$99 a month, billed by TradingView. VAT added at checkout where it applies. No free trial. You can ask TradingView for a refund within 14 days of a payment. Cancel in your TradingView account.</p>
    </div>` : "";
  /* 25 Nov 2026, glass on every thing: the plan is a pane of the house glass over the record's rosette (plate.js) */
  return `<section id="plans" class="s4-plan gl${SPACE_LIVE ? " s4-two" : ""}" data-plate data-seal="${recordSeal(R)}" aria-labelledby="plans-h">
    <h2 id="plans-h">The set of five</h2>
    <div class="s4-routes">
    ${site}${tv}
    </div>
    ${SPACE_LIVE ? `<p class="s4-both">${BOTH}</p>` : ""}
    <p class="s4-small"><a href="${BILLING}">Manage or cancel your subscription</a><a href="terms.html">Terms</a><a href="privacy.html">Privacy</a></p>
    <p class="s4-note">I sell tools, not signals. The price keeps the tyre-kickers out.</p>
  </section>`;
}

const tail = current => `${fanFoot()}\n${bot(current)}\n<script src="house.js?v=${vOf("house.js")}" defer></script>\n<script src="svgfloor.js?v=${vOf("svgfloor.js")}" defer></script>\n<script src="refcarry.js?v=${vOf("refcarry.js")}" defer></script>`;
/* Everything that opens the body: the strip and the band. */
const top = (current, where, o) => band(current, where, o);

/* THE OLD DARK LOOK, CARRIED ONTO THE RECORD'S GROUND. The pages written in it name their colours with the same
   tokens; these give each token its place on the record's ground. Held is gold, as on the record (note 47), where
   the old look drew it green; wrong is red; open is blue. On white: ink 18.9, ink-3 12.2, ink-5 7.2, ink-6 5.9,
   gold #7a5600 6.6, wrong 6.6, open and links 6.6, never reached 5.6; on the panel, #f5f7fa, none under 5.2.
   At night: ink 16.8, ink-3 12.8, ink-5 8.4, ink-6 6.5, gold 11.5, wrong 8.3, open 8.7; on its panel none under 6.0. */
const STONE_CSS = `
:root{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0B1A2E;--panel:#11233C;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
  --gold:#f2c45a;--miss:#ff8a80;--pass:#f2c45a;--notest:#a3aec0;--pending:#8db0f5;--hs-link:#8db0f5;--hs-link-rule:rgba(141,176,245,.35);--hs-here:rgba(242,196,90,.08);color-scheme:dark}}
:root[data-theme="light"]{--bg:#ffffff;--panel:#f5f7fa;--rule:#c9d0da;--rule-soft:#e1e5eb;--ink:#0e1116;--ink-2:#2e3644;--ink-3:#2e3644;--ink-5:#4e5869;--ink-6:#5b6576;
  --gold:#7a5600;--miss:#b42323;--pass:#7a5600;--notest:#5f6979;--pending:#2b5ba8;--hs-link:#2b5ba8;--hs-link-rule:rgba(43,91,168,.35);--hs-here:rgba(200,150,46,.10);color-scheme:light}
:root[data-theme="dark"]{--bg:#0B1A2E;--panel:#11233C;--rule:#33415a;--rule-soft:#222e42;--ink:#eef2f8;--ink-2:#cdd5e1;--ink-3:#cdd5e1;--ink-5:#a3aec0;--ink-6:#8d98ab;
  --gold:#f2c45a;--miss:#ff8a80;--pass:#f2c45a;--notest:#a3aec0;--pending:#8db0f5;--hs-link:#8db0f5;--hs-link-rule:rgba(141,176,245,.35);--hs-here:rgba(242,196,90,.08);color-scheme:dark}
body{background:var(--bg)}
a{color:var(--hs-link);border-bottom-color:var(--hs-link-rule)}
a:hover{color:var(--ink)}
.facts{border-top:0;gap:12px}
.facts>div{background:var(--panel);border:1px solid var(--rule-soft);border-radius:12px;padding:14px 16px}
.facts>div>div{padding:0;border:0}
.kill,.wrap .tally{border-radius:12px}
.wrap .g,.wrap .grade{border-radius:999px}
blockquote{border-left-color:var(--gold)}
ol.house li.here{background:linear-gradient(90deg,var(--hs-here),transparent)}
.hs-hero .status{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:20px 0 0}
.hs-hero .g{display:inline-flex;align-items:center;gap:8px;font-family:var(--hs-fig);font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:6px 11px;border:1.5px solid currentColor;border-radius:999px}
.hs-hero .g i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.hs-hero .g.pending{color:#8db0f5}.hs-hero .g.pass{color:#f2c45a}.hs-hero .g.miss{color:#ff8a80}.hs-hero .g.notest{color:#c9d3e6}
.hs-hero .status .when{font-family:var(--hs-fig);font-size:13px;color:#c9d3e6}
`;
const stoneStyle = () => `<style id="hs-stone">${STONE_CSS}</style>`;

module.exports = { ANNUAL, VOICES, VOICE_FINE, voices, menu, LESSONS, BUY, RISK, SET_TOOLS, aff, AFF, SET_CHECKOUT, MAIL_ENDPOINT, signup, PARTNER_LINE, PARTNER, BLACK_FRIDAY, SPACE, SPACE_LIVE, OUT, BOTH, SET_TERMS, proof, partner, plans, BILLING, recordSeal, leanHead, fanFoot, TV, esc, vOf, FONTS, THEME_JS, headTags, earlyTags, strip, band, hero, bot, tail, top, STONE_CSS, stoneStyle, NAV };
