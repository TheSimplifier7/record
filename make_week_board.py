#!/usr/bin/env python3
"""make_week_board.py, Design Lab, 7 November 2026. The week box on record.html, renewed from record.json.

  python3 make_week_board.py .            (from the record's folder, after record.json is rebuilt)

Rebuilds only the head, the three rows and the foot of <aside class="wb" id="wb"> on record.html: open rows say
where the last weekly close sat against the line, graded rows say HELD or WRONG with Friday's close. Everything
else in the box (the Monday Level form and its consent line) and on the page stays exactly as it is. Every figure
it writes is a figure in record.json; a distance takes the line's own decimals, as the row's result does.
Run it again and nothing changes.
BRAND LAW. No em dashes, hashtags, exclamation marks, emoji, forecasting.
"""
import argparse, datetime as dt, hashlib, html, json, pathlib, re, sys
from decimal import Decimal

ap = argparse.ArgumentParser(); ap.add_argument("repo"); ap.add_argument("--date", default=None); a = ap.parse_args()
R = pathlib.Path(a.repo); rec = json.loads((R / "record.json").read_text())
maps = [r for r in rec["rows"] if r.get("type") == "Map"]
week = a.date or max(r["named"] for r in maps)
ORDER = ["Gold", "Silver", "Platinum"]
rows = sorted([r for r in maps if r["named"] == week], key=lambda r: ORDER.index(r["metal"]) if r["metal"] in ORDER else 9)
if not rows: sys.exit(f"no lines named {week}")
D = lambda s: Decimal(str(s).replace(",", ""))
mon = dt.date.fromisoformat(week); fri = mon + dt.timedelta(days=4); prev = mon - dt.timedelta(days=3)
MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
MONL = "January February March April May June July August September October November December".split()
closes = {c["date"]: c for c in rec["closes"]}
last = closes.get(prev.isoformat())
dec = lambda s: len(str(s).split(".")[1]) if "." in str(s) else 0
def fmt(x, places):
    q = Decimal(1).scaleb(-places) if places else Decimal(1)
    s = f"{x.quantize(q):,.{places}f}"
    return s
e = html.escape

def glyph(side_needed_above, close_above, graded=None):
    # the gold line, and a dot where the close sat: above or below it. Filled when it sits on the side the line needs.
    on = side_needed_above == close_above
    y = 6 if close_above else 22
    dot = f'<circle cx="20" cy="{y}" r="4.2" fill="#e9e4d8"/>' if on else f'<circle cx="20" cy="{y}" r="3.6" fill="none" stroke="#e9e4d8" stroke-width="1.6"/>'
    return f'<svg class="wb-glyph" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><line x1="1" y1="14" x2="27" y2="14" stroke="#e0a93b" stroke-width="2.4" stroke-linecap="round"/>{dot}</svg>'

items = []
for r in rows:
    lv = D(r["level"]); slate = r["side"] == "slate"; places = dec(r["level"])
    kind = "Floor" if slate else "Ceiling"; rule = "the week must close above it" if slate else "the week must close under it"
    graded = r.get("grade") in ("pass", "miss")
    if graded:
        c = D(r["close"]); dist = abs(c - lv); above = c > lv
        word = "HELD" if r["grade"] == "pass" else "WRONG"
        say = (f'Friday closed {e(r["close"])}, <b>{fmt(dist, places)} {"above" if above else ("under" if not slate else "below")}</b>. '
               f'<span class="wb-v {"held" if word == "HELD" else "wrong"}">{word}</span>')
        cls = "held" if word == "HELD" else "wrong"
    else:
        lc = last and last.get(r["metal"])
        if not lc:
            say, above, cls = "No weekly close on the record yet to set it against.", None, "open"
        else:
            c = D(lc); dist = abs(c - lv); above = c > lv
            dtext = fmt(dist, places)
            where = "above" if above else ("under" if not slate else "below")
            if above == slate:
                say = f'Last close {e(lc)}, <b>{dtext} {where}</b>: the side it needs.'
            else:
                say = f'Last close {e(lc)}, <b>{dtext} {where}</b>: it needs Friday to close back {"above" if slate else "under"}.'
            cls = "ok" if above == slate else "off"
    say = f'<span class="wb-k2">{kind}.</span> ' + say
    g = glyph(slate, above) if above is not None else ""
    label = f'{r["metal"]}, {kind.lower()} {r["level"]}: {rule}.'
    items.append(f'<li class="wb-row {cls}" aria-label="{e(label)}">{g}<span class="wb-name">{e(r["metal"])}<span class="wb-kind">{kind}: {rule}</span></span>'
                 f'<span class="wb-lv">{e(r["level"])}</span><span class="wb-say">{say}</span></li>')

any_open = any(r.get("grade") not in ("pass", "miss") for r in rows)
grade_when = f'Graded Fri {fri.day} {MON[fri.month-1]}, 23:00 CET' if any_open else f'Graded on the close of Fri {fri.day} {MON[fri.month-1]}'
foot_l = (f'Closes off my own chart, Fri {prev.day} {MON[prev.month-1]}' if any_open and last else "Friday's closes off my own chart")
page = f"week-{week}.html"
TITLE = "This week\'s lines" if any_open else f"The lines of {mon.day} {MON[mon.month-1]}"


NEW = (f'<div class="wb-h"><h2 class="wb-t" id="wb-t">{TITLE}</h2><span class="wb-g">{grade_when}</span></div>'
       f'<ol class="wb-list">{"".join(items)}</ol>'
       f'<div class="wb-f"><span>{foot_l}</span>' + (f'<a href="{page}">The week in full</a>' if (R / page).exists() else "") + '</div>')
for bad in ["\u2014", "!"]:
    assert bad not in re.sub(r"<[^>]+>", "", NEW), f"brand law: {bad!r}"
p = R / "record.html"; s = p.read_text()
a = s.find('<aside class="wb" id="wb"'); assert a > 0, "the week box is not on record.html"
i = s.find('<div class="wb-h">', a); j = s.find('<div class="wb-mail"', a); k = s.find("</aside>", a)
assert 0 < i < k, "the box has no head"
end = j if 0 < j < k else k
s2 = s[:i] + NEW + s[end:]
if s2 != s:
    p.write_text(s2)
print(f"week box for {week}: " + "; ".join(f'{r["metal"]} {r["level"]} {r.get("grade")}' for r in rows) + ("" if s2 != s else " (no change)"))
