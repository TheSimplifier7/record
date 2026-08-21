/* Client ledger verifier. Runs the ledger's own script under a DOM stub, the
   way verify_page.js does for the record, and blocks the commit on anything
   the client ledger must never carry. Usage:  node verify_ledger.js [file]
   Default file: desk-01.html. Lives in the Studio next to verify_page.js. */
const fs = require('fs');
const file = process.argv[2] || (__dirname + '/desk-01.html');
const src = fs.readFileSync(file, 'utf8');
const script = src.match(/<script>([\s\S]*?)<\/script>/)[1];
const els = {};
const mk = id => (els[id] = els[id] || { id, style:{}, _h:'', _t:'',
  set innerHTML(v){ this._h = v; }, get innerHTML(){ return this._h; },
  set textContent(v){ this._t = v; }, get textContent(){ return this._t; } });
global.document = { getElementById: mk };
try { new Function(script)(); }
catch (e) { console.log('RUNTIME ERROR:', e.message); process.exit(1); }

let bad = 0;
const fail = m => { console.log('  FAIL  ' + m); bad++; };
const handle = (src.match(/const HANDLE\s*=\s*"([^"]*)"/) || [])[1] || '';
const updated = (src.match(/const LAST_UPDATED\s*=\s*"([^"]*)"/) || [])[1] || '';
const rows = els['ledger-list'] ? els['ledger-list'].innerHTML : '';
const nrows = (rows.match(/class="lrow"/g) || []).length;
if (!handle.trim()) {
  console.log('  HOLD  HANDLE is empty: the page publishes only the pending line. Correct before intake, blocking after.');
  console.log('  handle        (unset, fail-closed)');
  console.log('  updated       ' + updated);
  console.log('\nLedger is fail-closed and safe to publish. It carries no client claim until the handle is set at intake.');
  process.exit(0);
}
const opened = (src.match(/const OPENED\s*=\s*"([^"]*)"/) || [])[1] || '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(opened)) fail('HANDLE is set but OPENED is not a dated YYYY-MM-DD: a named instance must carry the date it became the client\'s');
if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) fail('LAST_UPDATED is not a dated YYYY-MM-DD');
if (src.includes('—')) fail('em dash present');
if (/\[FOUNDER:/.test(src)) fail('founder blank leaked');
if (/[$€£]/.test(rows)) fail('a currency symbol is inside a ledger row: balances, sizes, profit and loss never publish');
if (/undefined/.test(rows)) fail('undefined leaked into markup');
const grades = [...src.matchAll(/grade:"([^"]*)"/g)].map(m => m[1]).filter(g => !['pass','miss','notest','pending'].includes(g));
if (grades.length) fail('unknown grade: ' + grades.join(', '));
const ticks = [...src.matchAll(/book:"tick"/g)].length;
if (ticks) fail(ticks + ' tick row(s) on the public instance: the tick stays off until the first cohort finishes');
console.log('  handle        ' + handle);
console.log('  rows          ' + nrows);
const tv = id => (els[id] ? els[id]._t : '?');
console.log('  tally r/p/m/o ' + ['t-resolved','t-pass','t-miss','t-open'].map(tv).join('/'));
console.log('  updated       ' + updated);
console.log(bad ? '\n' + bad + ' FAILED' : 'Ledger renders clean.');
process.exit(bad ? 1 : 0);
