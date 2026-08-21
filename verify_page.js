/* Renders index.html's own script under a DOM stub and reports what a browser
   would build. Run before every commit:  node verify_page.js
   Lives in the Studio, not the scratchpad, so it survives between sessions. */
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = src.match(/<script>([\s\S]*?)<\/script>/)[1];

const attrs = {}; const replaced = [];
const mk = id => (attrs[id] = attrs[id] || { id, a: {},
  setAttribute(k, v) { this.a[k] = v; },
  replaceWith(el) { replaced.push(el); },
  querySelectorAll() { return []; }, querySelector() { return mk(id + '/q'); },
  addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} },
  style: {}, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
  set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; } });
global.document = {
  getElementById: mk, querySelector: () => mk('q'), querySelectorAll: () => [],
  createElement: () => ({ className: '', textContent: '' }), addEventListener: () => {},
  documentElement: { style: { setProperty() {} } },
};
global.location = { search: '' };
global.window = { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), location: global.location };

try { new Function(script)(); }
catch (e) { console.log('RUNTIME ERROR:', e.message); process.exit(1); }

const rows = attrs['ledger-list'].innerHTML || '';
const out = {
  'ledger rows': (rows.match(/class="lrow/g) || []).length,
  'standing': ((attrs['standing'] || {}).innerHTML || '').split('sc-pos').length - 1,
  'notes': ((attrs['notes'] || {}).innerHTML || '').match(/class="note"/g)?.length || 0,
  'tally r/p/m/o': [attrs['t-resolved']._t, attrs['t-pass']._t, attrs['t-miss']._t, attrs['t-open']._t].join('/'),
  'issue no': attrs['issue-no']._t,
  'updated': attrs['updated-foot']._t,
};
let bad = 0;
if (/undefined/.test(rows)) { console.log('  FAIL  undefined leaked into markup'); bad++; }
const kit = attrs['signup-form'].a['action'] || '';
const tally = attrs['apply-link'].a['href'] || '';
if (kit !== 'https://app.kit.com/forms/9787640/subscriptions') { console.log('  FAIL  kit endpoint: ' + kit); bad++; }
if (tally !== 'https://tally.so/r/EkVxJA') { console.log('  FAIL  tally url: ' + tally); bad++; }
if (attrs['doors'].a['data-open'] !== '1') { console.log('  FAIL  doors closed'); bad++; }
if (src.includes('—')) { console.log('  FAIL  em dash present'); bad++; }
if (/\[FOUNDER:/.test(rows)) { console.log('  FAIL  founder blank leaked into the LEDGER'); bad++; }
const notesHtml = attrs['notes'].innerHTML;
const blankInNotes = /\[FOUNDER:/.test(notesHtml);
for (const [k, v] of Object.entries(out)) console.log('  ' + k.padEnd(14) + v);
console.log(blankInNotes
  ? '\n  ⚠ note 09 still carries the founder blank. DO NOT COMMIT until it is filled.'
  : '\n  note 09 blank: filled');
console.log(bad ? '\n' + bad + ' FAILED' : 'Page renders clean.');
process.exit(bad ? 1 : 0);
