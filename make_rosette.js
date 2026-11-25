/* make_rosette.js · 25 November 2026, HALLMARK, his word of 00:55: glass on every thing.
   Writes rosette.svg: the record's rosette, as plate.js cuts it, drawn from the record's seal (the SHA-256 of every row
   on the record, house_parts.js recordSeal), for the panes of glass that have no live plate behind them (the lab's
   charts). It also brings the seal on the hand-kept pages (method.html) up to date, so every plate on the site is
   cut from the same record. Run it after the record changes, before make_chrome.js.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting. */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./house_parts.js");
const HERE = __dirname;
const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
const hash = H.recordSeal(R), TAU = 2 * Math.PI, by = i => parseInt(hash.slice(i * 2, i * 2 + 2), 16);
const D = 1000, C = D / 2, P = D / 2, Q = .8;
const k1 = 5 + by(0) % 8, k2 = k1 + 3 + by(1) % 6, N = 30 + by(2) % 16, a1 = .11 + by(3) / 255 * .05, a2 = .05 + by(4) / 255 * .04;
const N1 = 72 + by(5) % 48, k3 = 9 + by(6) % 10, a3 = .018 + by(7) / 255 * .016;
const curve = (f, steps) => { let d = ""; for (let j = 0; j < steps; j++) { const th = TAU * j / steps, r = f(th); d += (j ? "L" : "M") + Math.round(C + r * Math.cos(th)) + " " + Math.round(C + r * Math.sin(th)); } return d + "Z"; };
const ros = [], band = [];
for (let i = 0; i < N; i++) { const ph = TAU * i / N; ros.push(curve(th => P * Q * (.47 + a1 * Math.sin(k1 * th + ph) + a2 * Math.sin(k2 * th - 2 * ph)), 240)); }
for (let i = 0; i < N1; i += 2) { const ph = TAU * i / N1; band.push(curve(th => P * (.84 + a3 * Math.sin(k3 * th + ph)), 240)); }
const ring = r => `<circle cx="${C}" cy="${C}" r="${r.toFixed(1)}"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${D} ${D}" data-seal="${hash}"><g fill="none" stroke="#E8B84F" stroke-linejoin="round"><path stroke-width=".9" d="${ros.join("")}"/><path stroke-width=".7" d="${band.join("")}"/><g stroke-width="1.4">${ring(P * Q * .72)}${ring(P * Q * .745)}${ring(P * .965)}${ring(P * .985)}</g></g></svg>\n`;
fs.writeFileSync(path.join(HERE, "rosette.svg"), svg);
let moved = 0;
for (const f of ["method.html"]) {
  const p = path.join(HERE, f), s = fs.readFileSync(p, "utf8"), t = s.replace(/data-seal="[0-9a-f]{64}"/g, `data-seal="${hash}"`);
  if (t !== s) { fs.writeFileSync(p, t); moved++; }
}
console.log(`rosette.svg written from the record's seal ${hash.slice(0, 6).toUpperCase()} (${(svg.length / 1024).toFixed(0)} KB); ${moved} hand-kept page(s) brought up to the seal.`);
