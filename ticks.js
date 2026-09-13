/* =========================================================================
   THE TICK BOOK  ·  data  ·  opened 9 September 2026

   One row per intraday call on the 5-minute clock, written BEFORE the trade
   and posted before the trade, graded on the close of the day it names,
   never in the weekly tally. Same law as the record: nothing deleted, a
   wrong row stays, a correction is logged, replaced copy kept in comments.

   HOW A ROW IS WRITTEN. Before the trade: run seal_tick.js and post the
   SEAL on X, not the level. The post's minute is the naming and goes in
   "named". The row is added here with grade "pending" and revealed false
   the same day, before the grading close; every seal posted gets a row
   whatever price did. After the grading close: grade_tick.js fills result
   and grade from the exported bars. On the Friday of that week every seal
   of that week is opened together by setting revealed true. Never edit
   level, kill, side or named after the first push; if one was wrong, say
   so in result and leave it. Editing any of them breaks the seal and
   verify_ticks.js will refuse the upload.

   FIELDS, all required except post and result:
     named   "2026-09-10T09:12+02:00"   the minute it was named, with offset
     post    "https://x.com/TheSimplifier7/status/..."   the public timestamp
     metal   "Gold" | "Silver" | "Platinum"
     side    "long" | "short"
     level   "4,394"     the line, as named, a string exactly as published
     kill    "4,380"     a 5-minute close through it grades the row wrong
     grades  "2026-09-10"   the day whose 23:00 Madrid close grades the row
     grade   "pending" | "pass" | "miss" | "notest"
     result  ""          what price did, written after the grading close

   THE SEAL, added 13 September 2026. Three more fields, required on every
   row written from that date:
     nonce    "4757a67ea919be77"  16 random hex characters from seal_tick.js.
                                  Never reused. Never published before the
                                  row is opened, because publishing it early
                                  publishes the call
     seal     "020bbcce..."       sha-256 of
                                  metal|side|level|kill|grades|nonce
                                  64 hex characters. THIS is what goes on X
                                  at the minute of naming, in place of the
                                  level
     revealed false | true        false while the trade is live and until the
                                  Friday open; true once level and kill are
                                  public and the page draws them

   Why. Posting the level and the kill at the naming proved the call and
   also handed it free to every stranger reading. The seal proves the call
   existed at that minute and that no part of it moved afterwards, while
   revealing nothing. Every seal published is opened on the Friday of its
   week, all of them at once, with the string that made it so anyone can
   recompute the hash. A seal that is never opened counts as wrong; that is
   the rule that stops the book being cherry-picked, and it is stated on the
   page. verify_ticks.js recomputes every seal and refuses to ship a row
   whose hash does not reproduce, so a level cannot move after the fact even
   by accident.

   Make a row with:  node seal_tick.js gold short 4399 4406

   THE RULE. Never reached if price never traded to the level after it was
   named. Wrong if the level was reached and either a five-minute close
   printed through the kill before the grading close, or the grading close
   is not on the row's side of the level. Held if the level was reached, no
   close printed through the kill, and the grading close is on the row's
   side. A row not graded by the next day's open is graded late and says so.

   HOW A ROW IS GRADED. Never by hand. After 23:00 Madrid, export the
   five-minute chart of that metal for that day from TradingView (Export
   chart data; ISO or UNIX time, either is fine) and save it as
     ticks/YYYY-MM-DD_<gold|silver|platinum>_5m.csv
   then run
     node grade_tick.js ticks/YYYY-MM-DD_<metal>_5m.csv          to see the grades
     node grade_tick.js ticks/YYYY-MM-DD_<metal>_5m.csv --write  to write them here
     node verify_ticks.js                                          before upload
     node make_record_json.js                                      so record.json carries them
   Upload ticks.js, record.json and the CSV together.

   A row missing any required field is not drawn; the page says how many
   were held back.
   ========================================================================= */
const TICKS = [
  /* EXAMPLE, not a row, delete when the first real one goes in:
  { named:"2026-09-10T09:12+02:00", post:"", metal:"Gold", side:"long", level:"4,394", kill:"4,380", grades:"2026-09-10", grade:"pending", result:"" },
  */
];
