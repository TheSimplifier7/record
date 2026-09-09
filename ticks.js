/* =========================================================================
   THE TICK BOOK  ·  data  ·  opened 9 September 2026

   One row per intraday call on the 5-minute clock, written BEFORE the trade
   and posted before the trade, graded on the close of the day it names,
   never in the weekly tally. Same law as the record: nothing deleted, a
   wrong row stays, a correction is logged, replaced copy kept in comments.

   HOW A ROW IS WRITTEN. Before the trade: post the level, the side and the
   kill on X (the post's timestamp is the public proof), then add the row
   here with grade "pending" and push it (the commit is the second proof).
   After the grading close: fill result and grade, push again. Never edit
   level, kill, side or named after the first push; if one was wrong, say so
   in result and leave it.

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

   THE RULE. Held if the grading close sits on the row's side of the level
   and no 5-minute close printed through the kill before it. Wrong if a
   5-minute close printed through the kill at any time before the grading
   close. Never reached if price never traded to the level. A row that is
   not graded by the next day's open is graded late and says so.

   A row missing any required field is not drawn; the page says how many
   were held back.
   ========================================================================= */
const TICKS = [
  /* EXAMPLE, not a row, delete when the first real one goes in:
  { named:"2026-09-10T09:12+02:00", post:"", metal:"Gold", side:"long", level:"4,394", kill:"4,380", grades:"2026-09-10", grade:"pending", result:"" },
  */
];
