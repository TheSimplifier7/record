#!/usr/bin/env node
/* =========================================================================
   SEAL_TICK.JS  ·  THE SIMPLIFIER  ·  the sealed naming

   Turns a call into a public commitment that proves the call existed at a
   given minute without publishing anything tradeable.

   USAGE
     node seal_tick.js gold short 4399 4406
     node seal_tick.js silver long 63.90 63.60
     node seal_tick.js platinum short 1812 1818 --grades 2026-09-11

   Returns three blocks: the X post (the seal), the ticks.js row, and the
   TradingView alert. Nothing is revealed. The level and the kill live only
   in ticks.js on your machine until the reveal.

   WHY THE NONCE
     Without it the seal is worthless. A gold call is roughly metal x side x
     level x kill, a space small enough to enumerate on a laptop in seconds,
     so anyone could brute-force the plaintext out of the hash and trade it.
     The 64-bit nonce makes that impossible. Never remove it, never reuse
     one, never publish one before the reveal.

   THE COMMITMENT STRING
     metal|side|level|kill|grades|nonce
     hashed SHA-256, hex, lower case.

   VERIFY LATER
     node verify_ticks.js   recomputes every revealed row's seal and fails
     the build if one does not match what was published.
   ========================================================================= */

const crypto = require('crypto');

const METALS = { gold: 'Gold', silver: 'Silver', platinum: 'Platinum' };
const SIDES = ['long', 'short'];

function madridNow() {
  // Madrid is +02:00 until 03:00 on 25 October 2026, +01:00 after.
  const now = new Date();
  const changeover = new Date('2026-10-25T01:00:00Z');
  const offset = now < changeover ? 2 : 1;
  const local = new Date(now.getTime() + offset * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const stamp =
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}+0${offset}:00`;
  const date = `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}`;
  const hhmm = `${p(local.getUTCHours())}:${p(local.getUTCMinutes())}`;
  const pastCutoff = local.getUTCHours() >= 23;
  return { stamp, date, hhmm, pastCutoff };
}

function fmt(metal, raw) {
  const n = Number(String(raw).replace(/,/g, ''));
  if (!isFinite(n)) throw new Error(`Not a number: ${raw}`);
  if (metal === 'Silver') return n.toFixed(2);
  return n.toLocaleString('en-US');
}

function nextDay(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function main() {
  const argv = process.argv.slice(2);
  const flags = {};
  const args = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
    else args.push(argv[i]);
  }

  if (args.length < 4) {
    console.error('usage: node seal_tick.js <metal> <long|short> <level> <kill> [--grades YYYY-MM-DD] [--at HH:MM]');
    process.exit(1);
  }

  const metalKey = String(args[0]).toLowerCase();
  const metal = METALS[metalKey];
  if (!metal) throw new Error(`Metal must be gold, silver or platinum. Got: ${args[0]}`);

  const side = String(args[1]).toLowerCase();
  if (!SIDES.includes(side)) throw new Error(`Side must be long or short. Got: ${args[1]}`);

  const level = fmt(metal, args[2]);
  const kill = fmt(metal, args[3]);

  // Sanity: a short's kill sits above the level, a long's below.
  const lv = Number(level.replace(/,/g, ''));
  const kv = Number(kill.replace(/,/g, ''));
  if (side === 'short' && kv <= lv) throw new Error('A short kill must sit above the level. No row.');
  if (side === 'long' && kv >= lv) throw new Error('A long kill must sit under the level. No row.');

  const clock = madridNow();
  const named = flags.at
    ? clock.stamp.replace(/T\d{2}:\d{2}/, `T${flags.at}`)
    : clock.stamp;
  const hhmm = flags.at || clock.hhmm;

  let grades = flags.grades;
  if (!grades) grades = clock.pastCutoff ? nextDay(clock.date) : clock.date;

  const nonce = crypto.randomBytes(8).toString('hex'); // 64 bits
  const commitment = `${metal}|${side}|${level}|${kill}|${grades}|${nonce}`;
  const seal = crypto.createHash('sha256').update(commitment, 'utf8').digest('hex');

  const killWord = side === 'short' ? 'over' : 'under';
  const graded = grades === clock.date ? "today's 23:00 close" : `the 23:00 close on ${grades}`;

  console.log('\nTHE X POST (the seal, paste as is)\n');
  console.log(`${metal}. Sealed ${hhmm} Madrid. Grades on ${graded}.`);
  console.log(seal);

  console.log('\nTHE ROW (paste into ticks.js, newest first)\n');
  console.log(
    `  { named:"${named}", post:"", metal:"${metal}", side:"${side}", level:"${level}", ` +
    `kill:"${kill}", grades:"${grades}", grade:"pending", result:"", ` +
    `nonce:"${nonce}", seal:"${seal}", revealed:false },`
  );

  console.log('\nTHE ALERT\n');
  console.log(
    `TradingView alert, ${metal} 5m, Close crossing ${side === 'short' ? 'up' : 'down'} ${kill}, once per bar close.`
  );

  console.log('\nTHE REVEAL LINE (hold until Friday, do not post now)\n');
  console.log(`${metal}, ${side} from ${level}. Kill: a five-minute close ${killWord} ${kill}.`);
  console.log(`Seal string: ${commitment}`);

  console.log('\nSeal first. Order second. Row before 23:00.\n');
}

try { main(); } catch (e) { console.error(`\n${e.message}\n`); process.exit(1); }
