#!/usr/bin/env node
/* =========================================================================
   make_email.js · the Monday Level and the Friday grade, as emails
   24 September 2026

   Usage, from the repo folder, after the record routine:
     node make_email.js monday [YYYY-MM-DD]   the rows named that day
                                              (default: the latest day rows were named)
     node make_email.js friday [YYYY-MM-DD]   the rows graded on that close
                                              (default: the latest graded close)

   Writes mail/email_<date>_<kind>.txt, the text to paste into Kit, and
   mail/email_<date>_<kind>.html, the same email as a page. Prints the
   subject. Sends nothing. The mail folder is not part of the site: an email
   goes on the page only when it is chosen as the sample the email door
   links, as its own file beside the record, named in DOORS.sample.

   Every figure comes from record.json, which the page builds, so an email
   cannot carry a number the record does not. Words are the rows' own.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const SITE = R.url || "https://thesimplifier7.github.io/record/";

const kind = (process.argv[2] || "").toLowerCase();
if (!/^(monday|friday)$/.test(kind)) { console.error("usage: node make_email.js monday|friday [YYYY-MM-DD]"); process.exit(2); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const long = iso => { const [y, m, d] = iso.split("-"); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
const ORDER = { Gold: 0, Silver: 1, Platinum: 2 };
const byMetal = (a, b) => (ORDER[a.metal] ?? 9) - (ORDER[b.metal] ?? 9);
const rows = R.rows || [];

let date = process.argv[3];
if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("the date is YYYY-MM-DD"); process.exit(2); }
if (!date) date = kind === "monday"
  ? rows.map(r => r.named).filter(Boolean).sort().pop()
  : rows.map(r => r.graded_on_close).filter(Boolean).sort().pop();
if (!date) { console.error("record.json holds no row to write about"); process.exit(1); }

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const count = (n, one, many) => `${WORDS[n] || n} ${n === 1 ? one : many}`;
const fridayOf = iso => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7)); return d.toISOString().slice(0, 10); };
const sideLine = r => r.side === "copper" ? "Copper · stays below the line" : "Slate · holds above the line";
const WORD = r => r.grade === "pending" ? "OPEN" : (r.grade === "pass" && /hit/.test(r.grade_word || "")) ? "HIT" : ({ pass: "HELD", miss: "WRONG", notest: "NEVER REACHED", nokill: "NO KILL", partial: "PARTIAL" })[r.grade] || String(r.grade_word || r.grade).toUpperCase();

/* ---------------------------------------------------------------- blocks */
const blocks = [];   // { head, lines[], link }
let subject, lede, tail = [];
if (kind === "monday") {
  const set = rows.filter(r => r.named === date).sort(byMetal);
  if (!set.length) { console.error("no row named on " + date); process.exit(1); }
  const fri = fridayOf(date);
  subject = `The Monday Level · week of ${long(date)}`;
  lede = `${count(set.length, "row", "rows")}, named ${long(date)} and graded on the weekly close of ${long(fri)}. The same rows that go on the record, where they stay whatever the close does.`;
  for (const r of set) {
    if (r.grammar) blocks.push({ head: `${r.metal.toUpperCase()} · ${r.line || r.level}`, lines: [sideLine(r), `Room ${r.room} · Odds at naming ${r.odds} in 100`, `Kill: ${r.kill}`], link: r.url });
    else blocks.push({ head: `${r.metal.toUpperCase()} · ${r.level}`, lines: [r.call, `Kill: ${r.kill}`], link: r.url });
  }
  if (set.some(r => r.grammar)) tail.push("On Friday each row takes one word. HIT, the week closed at or through the room. HELD, on the called side of the line, short of the room. WRONG, through the line.");
} else {
  const set = rows.filter(r => r.graded_on_close === date).sort(byMetal);
  if (!set.length) { console.error("no row graded on the close of " + date); process.exit(1); }
  const cl = (R.closes || []).find(c => c.date === date) || {};
  const closes = ["Gold", "Silver", "Platinum"].filter(m => cl[m]).map(m => `${m.toLowerCase()} ${cl[m]}`);
  subject = `The Friday grade · ${long(date)}`;
  lede = `The weekly close of ${long(date)}${closes.length ? ": " + closes.join(", ") : ""}. ${count(set.length, "row", "rows")} graded on it.`;
  for (const r of set) blocks.push({ head: `${r.metal.toUpperCase()} · ${r.level} · ${WORD(r)}`, lines: [r.result || ""], link: r.url });
  const t = R.tally || {};
  const latest = rows.map(r => r.graded_on_close).filter(Boolean).sort().pop();
  tail.push(`${date === latest ? "The record after this close" : "The record today"}: ${t.resolved} resolved, ${t.held} held and ${t.wrong} wrong, every one of them kept. ${t.never_reached} never reached, counted for neither side.${t.open ? ` ${t.open} open.` : ""}`);
  const g = R.grammar || {};
  if (g.graded) tail.push(`Under the call grammar: ${g.graded} graded, ${g.held} held. The odds they were named at add up to ${g.expected}. Held past that figure is the read beating the odds; short of it, it is not.`);
  const wrong = set.filter(r => r.grade === "miss");
  if (wrong.length) tail.push(`Every wrong row, in full: ${SITE}misses.html`);
}
tail.push(`Every row since June, the wrong ones included: ${SITE}`);

/* ---------------------------------------------------------------- brand law */
const all = [subject, lede, ...blocks.flatMap(b => [b.head, ...b.lines]), ...tail].join("\n");
const bad = [["em dash", /\u2014/], ["exclamation mark", /!/], ["hashtag", /(^|\s)#\w/]].filter(([, re]) => re.test(all));
if (bad.length) { console.error("brand law: the email carries " + bad.map(b => b[0]).join(", ") + ". Nothing written."); process.exit(1); }

/* ---------------------------------------------------------------- text */
const txt = [subject, "", lede, "", ...blocks.flatMap(b => [b.head, ...b.lines.filter(Boolean), b.link, ""]), ...tail.flatMap(x => [x, ""]),
  "No signals. No forecast without its kill.", "The Simplifier · @TheSimplifier7"].join("\n") + "\n";

/* ---------------------------------------------------------------- html */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const C = { bg: "#F6F1E7", card: "#FFFDF8", ink: "#1D1A16", ink3: "#4A4238", ink5: "#6E6456", rule: "#D9CFBE", gold: "#8C6D12", pass: "#2F6F48", miss: "#A24A20", open: "#35668A" };
const wordCol = h => /WRONG/.test(h) ? C.miss : /HELD|HIT/.test(h) ? C.pass : /OPEN/.test(h) ? C.open : C.ink5;
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="max-width:600px;margin:0 auto;padding:28px 20px 36px;font-family:Georgia,'Times New Roman',serif;color:${C.ink}">
<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:${C.gold};font-weight:700">The Simplifier</div>
<h1 style="font-weight:400;font-size:26px;line-height:1.2;margin:10px 0 14px">${esc(subject)}</h1>
<p style="font-size:17px;line-height:1.55;color:${C.ink3};margin:0 0 22px">${esc(lede)}</p>
${blocks.map(b => `<div style="background:${C.card};border:1px solid ${C.rule};border-left:3px solid ${wordCol(b.head)};padding:14px 16px;margin:0 0 14px">
<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;letter-spacing:.12em;font-weight:700;color:${wordCol(b.head)}">${esc(b.head)}</div>
${b.lines.filter(Boolean).map(l => `<p style="font-size:16px;line-height:1.5;margin:8px 0 0">${esc(l)}</p>`).join("\n")}
<p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;margin:10px 0 0"><a href="${esc(b.link)}" style="color:${C.gold}">The row on the record</a></p>
</div>`).join("\n")}
${tail.map(x => `<p style="font-size:15px;line-height:1.55;color:${C.ink3};margin:16px 0 0">${esc(x).replace(/(https:\/\/\S+)/g, `<a href="$1" style="color:${C.gold}">$1</a>`)}</p>`).join("\n")}
<p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${C.ink5};margin:28px 0 0;border-top:1px solid ${C.rule};padding-top:14px">No signals · No forecast without its kill · @TheSimplifier7</p>
</div></body></html>
`;

const dir = path.join(HERE, "mail");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const base = path.join(dir, `email_${date}_${kind}`);
fs.writeFileSync(base + ".txt", txt);
fs.writeFileSync(base + ".html", html);
console.log(`Subject: ${subject}\n${path.relative(HERE, base)}.txt and .html written, ${blocks.length} row(s). Nothing sent.`);
