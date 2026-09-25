# record

The public track record of THE SIMPLIFIER. Gold, silver and platinum.

**Live record: https://thesimplifier7.github.io/record/**

<!-- 24 Sep 2026, note 33, reached by note 35. This read: "Every call is named before the week opens and graded after the week closes." -->
Every call is named in advance and graded after the week closes. The wins and the misses sit in the same place. Nothing is ever removed.

The file only grows. The commit history of this repository is the proof. If a call was wrong, it is still here.

## How a call is graded

Every claim is published with the exact weekly close that would prove it wrong. That number goes out with the call, before the move.

On Friday at the weekly close, every open claim is graded in public. Held, wrong, or never reached.

A level that was never reached is marked no test. It counts for neither side. It is never banked as a win.

The page states counts only. It does not publish a strike rate in headline type, because a percentage on a small base becomes an argument about the denominator instead of a record. The rate is written beside its base in the note under the tally, and a reader who does the division will find the count was already honest.

Grades are not restamped to fit a rulebook written after them. The standard tightened on 3 July 2026. Earlier entries are marked pre-standard and left exactly as they were graded.

Corrections are published on the page as numbered notes. Notes are never renumbered. Replaced copy is kept in the source beside the line that replaced it. That includes the corrections against me.

## Cadence

<!-- 24 Sep 2026, note 33. This read: "A call is named on Sunday night, before the market opens, and written into this file open, so the commit timestamp sits hours before the tape exists." -->
A call is named on Monday evening, on the week's own opening box after it freezes and before the first 8h close after that, and written into this file open, so the commit timestamp sits before any close through the box. Until 20 September 2026 calls were named on Sunday night, before the market opened (note 33). It is graded on Friday at the weekly close, 23:00 in Spain, and nothing is graded before the candle closes.

## The standing calls

Two directional calls run on their own clocks, one for the year and one for the swing, and they are never counted in the tally. Each one carries the condition that would end it. Since the ruling of 29 August 2026 a swing clock turns on structure crossing structure, not on a price close, and the board under each call shows where every metal closed against its own line as confirmation, not as the trigger.

## What else is here

The wrong ones, in full, at https://thesimplifier7.github.io/record/misses.html. The banks' gold, silver and platinum targets, graded on the close, at https://thesimplifier7.github.io/record/targets.html. The tick book, intraday calls on the five-minute clock named before the trade and graded on the day's close, at https://thesimplifier7.github.io/record/tick.html (rows in ticks.js). The indicator the record is read from, at https://thesimplifier7.github.io/record/method.html. Guest rows, graded by the same rule, at https://thesimplifier7.github.io/record/guest.html. The live tally on any page, one script tag, at https://thesimplifier7.github.io/record/embed.html.

The page is dark by default since 6 September 2026. A switch in the masthead turns the paper ground on for a reader who wants it, and remembers the choice on that device.

## The files

index.html is the record. Every row, note, standing call and provenance line lives in it, as data the page renders. record.json is the same ledger as JSON, written by make_record_json.js and never edited by hand. misses.html is written by make_misses.js. The tally cards, the first frame of every video, are written by make_tally_card.js. The share card that timelines show for the link is written by make_share_card.js from one graded row, so it can never claim a count the ledger does not hold. verify_record.js is run before every upload and refuses the upload if the page disagrees with itself.

After any edit to index.html:

    node make_record_json.js && node make_bank_pages.js && node make_tally_card.js && node make_misses.js && node make_link_cards.js && node verify_record.js

<!-- 24 Sep 2026, note 37. This read:
    node make_record_json.js && node make_tally_card.js && node make_misses.js && node verify_record.js
make_bank_pages.js joined the routine with note 35, and make_link_cards.js with note 37. -->
make_bank_pages.js writes a page and a link card for every bank row. make_link_cards.js draws the link card of every other page beside the record, from record.json, and verify_record.js refuses an upload whose cards are older than the record. Every page but the embed and the seal counts its visits with GoatCounter: no cookies, no personal data.

descent.js, from 25 September 2026 (note 41), is the animation under The Chart and on the Method page: the record's closes and levels, read from index.html on the record and from record.json on the Method page, then an illustration of the last week, its trades and its orders, the people and the machines behind them, the matching engine and the metal in the vault, the source of every fact in its words named on screen and in the file's header. It changes no row and needs no step in the routine. verify_record.js check 19 refuses an upload whose pages stop loading it, whose captions break the brand law, or whose animation asks the network for anything but record.json.

<!-- 24 Sep 2026, the book v2. The paragraph and the command under this comment are how the tick book ran until 24 September and are kept. -->
The tick book, from 24 September 2026: a seal is made on seal.html and posted on X at the setup, and nothing else happens that day. After the Friday close the week opens: the block seal.html builds goes into ticks.js, opened, and one five-minute export of the week per metal sealed is graded with

    node grade_week.js <the export>.csv --write && node verify_ticks.js && node make_record_json.js

grade_week.js writes each day's bars beside the page as tick_YYYY-MM-DD_<metal>_5m.csv, with no folder because a web upload flattens folders (note 36), never over a file already on file, and refuses a day the export does not finish.

The emails: after the routine, node make_email.js monday writes the Monday Level from the rows named that day, and node make_email.js friday the Friday grade from the rows graded on that close, into mail/, which is not part of the site. Every figure in them comes from record.json.

The tick book, after 23:00 Madrid on a day with rows: export the five-minute chart of that metal for that day from TradingView and save it as ticks/YYYY-MM-DD_<gold|silver|platinum>_5m.csv, then

    node grade_tick.js ticks/YYYY-MM-DD_<metal>_5m.csv --write && node verify_ticks.js && node make_record_json.js

and upload ticks.js, record.json and the CSV together. Rows are graded from the bars on file by the rule on tick.html and never by hand; verify_ticks.js refuses any graded row whose bars are not beside the page or disagree with its grade.

---

I name the line. I do not forecast. I grade in public.

**Named before. Graded after. Nothing deleted.**

Posted first on X: https://x.com/TheSimplifier7
