#!/usr/bin/env node
/* =========================================================================
   make_week_email.js · the week graded, as an email
   16 November 2026, his word (note 75)

   Usage, from the repo folder, after Friday's closes are in daily.json:
     node make_week_email.js [YYYY-MM-DD] [--opener]
       the Friday of the week (default: the last Friday on file)
       --opener adds the line the people who joined before 12 November are owed:
       the list is staying open, with the way off beside it

   Writes mail/week_<friday>.txt and mail/week_<friday>.html, prints the
   subject, and sends nothing. The mail folder is not part of the site.

   Every level, close, distance and grade comes from daily.json through
   daily.js, the same code that draws levels.html, so the email cannot carry
   a figure the page does not. A week with a level still open is refused: the
   email is the week graded, and it goes out only when every close is in.
   {{UNSUBSCRIBE_URL}} is left for the list's own script to fill.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const D = require("./daily.js");
const DAILY = JSON.parse(fs.readFileSync(path.join(HERE, "daily.json"), "utf8"));
const SITE = "https://thesimplifier7.com/";

const args = process.argv.slice(2);
const opener = args.includes("--opener");
let fri = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
const probs = D.problems(DAILY);
if (probs.length) { console.error("daily.json cannot be read:\n  " + probs.join("\n  ")); process.exit(1); }
const M = D.model(DAILY);

const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = iso => new Date(iso + "T12:00:00Z").getUTCDay();
if (!fri) { fri = M.last; while (dow(fri) !== 5) fri = addDays(fri, -1); }
if (dow(fri) !== 5) { console.error(fri + " is not a Friday"); process.exit(2); }
const mon = addDays(fri, -4);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dm = iso => { const [, m, d] = iso.split("-"); return `${+d} ${MONTHS[+m - 1]}`; };
const day = iso => `${DAYS[dow(iso)]} ${dm(iso)}`;

const week = M.days.filter(d => d.date >= mon && d.date <= fri).sort((a, b) => a.date.localeCompare(b.date));
if (!week.length) { console.error("no trading day of the week of " + mon + " is on file"); process.exit(1); }
const first = week[0].date;
const rows = week.filter(d => d.state === "named").flatMap(d => d.rows.map(r => Object.assign({ date: d.date }, r)));
const open = rows.filter(r => r.grade === "open");
if (open.length) { console.error(`${open.length} level(s) of this week are still open. The week graded goes out when every close is in. Nothing written.`); process.exit(1); }

const held = rows.filter(r => r.grade === "held"), wrong = rows.filter(r => r.grade === "wrong");
const side = s => s === "floor" ? "Floor" : "Ceiling";
const line = r => `${r.metal}, ${day(r.date)}. ${side(r.side)} ${r.level}, closed ${r.close}, ${r.dist}. ${r.grade === "wrong" ? "Wrong" : "Held"}.`;
const quiet = week.filter(d => d.state !== "named").map(d => `${day(d.date)}: ${d.state === "none" ? "none named" : "not on file"}.`);

/* the series to date, to this Friday's close */
const upto = M.days.filter(d => d.state === "named" && d.date <= fri).flatMap(d => d.rows);
const sHeld = upto.filter(r => r.grade === "held").length, sWrong = upto.filter(r => r.grade === "wrong").length;

const span = first === fri ? dm(fri) : first.slice(5, 7) === fri.slice(5, 7) ? `${+first.slice(8)} to ${dm(fri)}` : `${dm(first)} to ${dm(fri)}`;
const subject = `The week graded: ${span} ${fri.slice(0, 4)}`;
const EXIT = "Every level carries its own Exit, a price line I name each morning in the 08:00 post. A daily close through that Exit grades the level wrong. Otherwise it held.";
if (!D.RULE.includes(EXIT)) { console.error("the rule in daily.js no longer carries the Exit sentences this email quotes. Nothing written."); process.exit(1); }

const parts = [];
if (opener) parts.push(["If you joined before 12 November: the list is staying open. There is no closing email, and nothing is deleted. If you would rather go, the unsubscribe link at the foot takes you off in one click."]);
parts.push([`Every level named this week, graded on its day's close: ${rows.length} named, ${held.length} held, ${wrong.length} wrong.`]);
if (wrong.length) parts.push(["The wrong ones", ...wrong.map(line)]);
if (held.length) parts.push(["The ones that held", ...held.map(line)]);
if (quiet.length) parts.push(["Days with no level", ...quiet]);
parts.push([`The daily series since ${dm(M.start)}: ${sHeld} held, ${sWrong} wrong, nothing deleted.`]);
parts.push([`How a level is graded: ${EXIT} Only the close at 17:00 New York counts.`]);
parts.push([`Every day, graded, with each 08:00 post: ${SITE}levels.html`]);
parts.push([`The levels are read from The Fan, one of the four TradingView tools in the set. 7 days free, then €99 a month: ${SITE}method.html`]);
parts.push(["This is structural analysis. It is not a recommendation to buy or sell. I develop and sell The Fan, the indicator these levels are read from."]);
parts.push(["Bradley"]);
const foot = ["You get this because you asked for it at thesimplifier7.com.", "Unsubscribe: {{UNSUBSCRIBE_URL}}", "Or write to hello@thesimplifier7.com.", "The Simplifier, Bradley Van Eden, Espartinas, Sevilla, Spain."];

const all = [subject, ...parts.flat(), ...foot].join("\n");
const bad = [["em dash", /—/], ["en dash", /–/], ["exclamation mark", /!/], ["hashtag", /(^|\s)#\w/]].filter(([, re]) => re.test(all));
if (bad.length) { console.error("brand law: the email carries " + bad.map(b => b[0]).join(", ") + ". Nothing written."); process.exit(1); }

const heads = new Set(["The wrong ones", "The ones that held", "Days with no level"]);
const txt = parts.map(p => p.join("\n")).join("\n\n") + "\n\n--\n" + foot.join("\n") + "\n";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const link = s => esc(s).replace(/(https:\/\/\S+?)(?=[.,]?(\s|$))/g, '<a href="$1" style="color:#0B1A2E">$1</a>');
const C = { ink: "#0B1A2E", sec: "#4A5568", mut: "#6B7686", rule: "#D9DEE5", red: "#B2412F", gold: "#8C6D12" };
const para = p => p.map((x, i) => i === 0 && heads.has(x)
  ? `<p style="margin:24px 0 6px;font:600 15px/1.4 Arial,sans-serif;color:${C.ink}">${esc(x)}</p>`
  : `<p style="margin:0 0 10px;font:400 16px/1.55 Arial,sans-serif;color:${/\. Wrong\.$/.test(x) ? C.red : C.ink}">${link(x)}</p>`).join("\n");
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:600px;margin:0 auto;padding:28px 20px 36px">
<p style="margin:0 0 6px;font:600 13px/1.4 Arial,sans-serif;color:${C.gold}">The Simplifier</p>
<h1 style="margin:0 0 20px;font:600 24px/1.25 Arial,sans-serif;color:${C.ink}">${esc(subject)}</h1>
${parts.map(para).join("\n")}
<div style="margin:28px 0 0;padding-top:14px;border-top:1px solid ${C.rule}">
${foot.map(x => `<p style="margin:0 0 6px;font:400 13px/1.5 Arial,sans-serif;color:${C.mut}">${x.includes("{{UNSUBSCRIBE_URL}}") ? 'Unsubscribe: <a href="{{UNSUBSCRIBE_URL}}" style="color:' + C.mut + '">{{UNSUBSCRIBE_URL}}</a>' : link(x)}</p>`).join("\n")}
</div>
</div></body></html>
`;

const dir = path.join(HERE, "mail");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const base = path.join(dir, `week_${fri}`);
fs.writeFileSync(base + ".txt", txt);
fs.writeFileSync(base + ".html", html);
console.log(`Subject: ${subject}\n${path.relative(HERE, base)}.txt and .html written: ${rows.length} level(s), ${held.length} held, ${wrong.length} wrong. Nothing sent.`);
