#!/usr/bin/env node
/* =========================================================================
   make_scene.js  ·  THE SCENE, STILL  ·  22 October 2026  ·  note 55

   Writes the still of the head of the page into index.html, from
   record.json: the count, every grade's mark, the scene drawn for gold, its
   pins, the dock, the inspector and the funnel's picture, between this
   script's own markers. A reader with scripts off sees the still; with
   scripts on, scene.js draws the same thing from the page's own rows when
   the page opens. It also renews the addresses of scene.js and scene.css in
   index.html when either file changes. It runs in the routine after
   make_record_json.js, and
   verify_record.js checks that the still in index.html is the one
   record.json gives (check 27). Run it twice and the second run changes
   nothing.

     node make_scene.js            write the still
     node make_scene.js --check    say whether the still is current, write nothing

   It moves no figure and types none.
   BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
   ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const SceneR3 = require("./scene.js");

const NUMW = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

function grabConst(idx, name) {
  const m = idx.match(new RegExp("const " + name + "\\s*=\\s*([\\[{][^\\n]*?[\\]}]);"));
  if (!m) throw new Error(name + " not found in index.html. Nothing written.");
  return eval("(" + m[1] + ")");
}

function modelFrom(idx) {
  const R = JSON.parse(fs.readFileSync(path.join(HERE, "record.json"), "utf8"));
  const TJ = JSON.parse(fs.readFileSync(path.join(HERE, "tools.json"), "utf8"));
  const closeOf = r => {
    if (!r.graded_on_close) return "";
    const c = (R.closes || []).find(x => x.date === r.graded_on_close);
    const v = c && c[r.metal];
    if (!v) throw new Error(`${r.anchor}: no close for ${r.metal} on ${r.graded_on_close} in closes. Nothing written.`);
    if (r.close && r.close !== v) throw new Error(`${r.anchor}: its close ${r.close} is not the close in closes, ${v}. Nothing written.`);
    return v;
  };
  const calls = R.rows.map(r => ({
    date: r.named, type: r.type, metal: r.metal, level: r.level, side: r.side || "", kill: r.kill || "",
    grade: r.grade, hit: /\bhit\b/.test(String(r.grade_word || "")), close: closeOf(r),
    lineFrom: r.line_from || "", readAt: r.read_at || "", anchor: r.anchor, box: r.box || null
  }));
  const tools = (TJ.tools || []).filter(t => t.live).map(t => ({ key: t.key, name: t.name, sub: String(t.title || "").split(": ").slice(1).join(": ") || t.name, url: t.url }));
  return SceneR3.model({ calls, closes: R.closes || [], lineFrom: grabConst(idx, "LINE_FROM"), counsel: grabConst(idx, "NOT_ADVICE"), tools });
}

/* 1 Nov 2026: the page carries no comments, so each part of the still is the inside of its own element. */
const AT = { MARKS: 'id="r3-marks"', KPIS: 'id="r3-kpis"', WHEN: 'id="r3-when"', STAGE: 'class="r3-drift" data-still', DOCK: 'id="r3-dock"',
  DRAWER: 'id="r3-drawer"', FMARKS: 'id="r3f-marks"', FCOUNT: 'id="r3f-count"', PIC: 'class="r3f-pic"', CAP: 'class="r3f-cap"',
  TOOLSN: 'id="r3f-toolsn"', TOOLS: 'class="r3f-tools"', TWTOOLS: 'id="tw-tools"', JOINTOOLS: 'id="door-tools-list"' };
function put(s, name, inner) {
  const key = AT[name], k = s.indexOf(key);
  if (!key || k < 0 || s.indexOf(key, k + 1) >= 0) throw new Error(`index.html has no single ${name} element for the still. Nothing written.`);
  const o = s.lastIndexOf("<", k), tag = (s.slice(o + 1).match(/^[a-z][a-z0-9]*/) || [""])[0], gt = s.indexOf(">", k) + 1;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "g"); re.lastIndex = gt; let d = 1, m;
  while ((m = re.exec(s))) { if (m[1]) { if (--d === 0) return s.slice(0, gt) + inner + s.slice(m.index); } else if (!/\/>$/.test(m[0])) d++; }
  throw new Error(`index.html: the ${name} element is not closed. Nothing written.`);
}

/* the addresses of scene.js and scene.css carry their fingerprint, so a change to either reaches every reader at once */
const vOf = f => require("crypto").createHash("sha256").update(fs.readFileSync(path.join(HERE, f))).digest("hex").slice(0, 10);

function expected(idx) {
  const M = modelFrom(idx);
  const S = SceneR3.still(M);
  let s = idx.replace(/scene\.js\?v=[0-9a-f]{10}/g, "scene.js?v=" + vOf("scene.js")).replace(/scene\.css\?v=[0-9a-f]{10}/g, "scene.css?v=" + vOf("scene.css"));
  s = put(s, "MARKS", S.marks);
  s = put(s, "KPIS", S.tele);
  s = put(s, "WHEN", M.next ? M.next.label : "");
  s = put(s, "STAGE", S.stage);
  s = put(s, "DOCK", S.dock);
  s = put(s, "DRAWER", S.drawer);
  s = put(s, "FMARKS", S.marks);
  s = put(s, "FCOUNT", S.count);
  s = put(s, "PIC", S.pic);
  s = put(s, "CAP", S.cap);
  s = put(s, "TOOLSN", NUMW[M.tools.length] || String(M.tools.length));
  s = put(s, "TOOLS", S.tools);
  /* 1 Nov 2026: the strip under this week and the Join list, from the same list in tools.json. */
  s = put(s, "TWTOOLS", M.tools.map(t => t.name).join(" · "));
  s = put(s, "JOINTOOLS", "\n" + M.tools.map(t => `      <li><a href="${t.url}" data-tv="door-${t.key}">${t.name}</a></li>`).join("\n") + "\n    ");
  return { s, M };
}

if (require.main === module) {
  const file = path.join(HERE, "index.html");
  const idx = fs.readFileSync(file, "utf8");
  const { s, M } = expected(idx);
  const lines = M.metals.reduce((a, m) => a + m.lines.length, 0);
  if (process.argv.includes("--check")) {
    if (s === idx) { console.log("make_scene.js: the still in index.html is current."); process.exit(0); }
    console.log("make_scene.js: the still in index.html is not the one record.json gives. Run node make_scene.js."); process.exit(1);
  }
  if (s !== idx) fs.writeFileSync(file, s);
  console.log(`make_scene.js: the still written from record.json, ${M.metals.length} metals, ${lines} lines, ${M.counts.rows} rows${s === idx ? " (no change)" : ""}.`);
}

module.exports = { expected, modelFrom };
