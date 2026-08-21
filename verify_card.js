/* Verifies every figure and phrase on card.html against ONE row of the CALLS
   array in index.html. Run before regenerating card.png. Exits non-zero if the
   card asserts anything the ledger does not.

   Why this exists: the first draft of card.html took its claim wording from the
   27 July row, which graded PASS, and put the 7 August MISS grade underneath it.
   Two real rows blended into one card is a fabricated row. Eyeballing did not
   catch it. This does.

   Run:  node verify_card.js
*/
const fs = require('fs');
const idx  = fs.readFileSync(__dirname + '/index.html', 'utf8');
const card = fs.readFileSync(__dirname + '/card.html', 'utf8');

const CALLS = eval(idx.match(/const CALLS = (\[[\s\S]*?\n\]);/)[1]);

/* The one row this card is allowed to speak for. */
const KEY = { date: '2026-08-07', metal: 'Gold', level: '4,098.275' };
const row = CALLS.find(c => c.date === KEY.date && c.metal === KEY.metal && c.level === KEY.level);
if (!row) { console.log('FAIL: source row not found in index.html'); process.exit(1); }

const body = card.split('<body>')[1].replace(/<!--[\s\S]*?-->/g, '');
const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const claim = row.call.split(/\s*Kill:\s*/i)[0].trim();
const kill  = row.call.split(/\s*Kill:\s*/i)[1].trim();

/* Every number printed on the card, and where it must come from. */
const figuresOnCard = text.match(/[\d][\d,.]*/g) || [];
const rowText = row.call + ' ' + row.result + ' ' + row.date + ' ' + row.level;
const unsourced = [...new Set(figuresOnCard)].filter(f => !rowText.includes(f));

const checks = [
  ['row exists and grades miss',      row.grade === 'miss'],
  ['level printed matches the row',   text.includes(row.level)],
  ['metal printed matches the row',   text.includes(row.metal)],
  ['claim is verbatim from the row',  text.includes(claim)],
  ['kill text is inside the row kill', kill.includes('a weekly close back above 4,098.275 grades the break a trap')],
  ['grade renders as Wrong',          /Wrong/.test(text)],
  ['closing figure is in the result', row.result.includes('4,342') && text.includes('4,342')],
  ['21 July is stated in the row',    row.call.includes('21 July') && text.includes('21 July')],
  ['7 August is the row date',        row.date === '2026-08-07' && text.includes('7 August')],
  ['no em dash anywhere on the card', !card.includes('—')],
  ['every figure traces to the row',  unsourced.length === 0],
];

let bad = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  ok    ' : '  FAIL  ') + name);
  if (!ok) bad++;
}
if (unsourced.length) console.log('\n  unsourced figures on card: ' + unsourced.join(', '));
console.log(bad ? '\n' + bad + ' CHECK(S) FAILED. Do not ship the card.'
                : '\nCard matches the ledger row exactly. Safe to render.');
process.exit(bad ? 1 : 0);
