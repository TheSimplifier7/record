#!/usr/bin/env python3
"""
xdesk.py  ·  THE SIMPLIFIER's own X connector.  5 September 2026.

One file. Posts, threads, media, metrics, replies, and a ships.csv writer.
No third-party service in the middle. Talks to api.x.com directly with your
own developer keys, OAuth 1.0a user context.

WHAT IT COSTS (X's own pay-per-use, the only model open to new developers
since February 2026, per the sources checked 5 Sep 2026): about $0.015 per
post created, $0.20 per post that contains a link, $0.005 per read. At two
videos a week plus reply threads and a weekly metrics read, that is a few
dollars a month. You put a card on the X developer account; nothing here
spends beyond the calls you run.

SETUP, once:
  1. developer.x.com -> create a project and an app. Set the app's user
     authentication to "Read and write", OAuth 1.0a, type Web/Bot, any URL.
  2. Under Keys and tokens: API Key, API Key Secret, Access Token, Access
     Token Secret. Generate the access token AFTER setting read+write.
  3. pip install requests requests-oauthlib
  4. Create a file called .env beside this script (never commit it; it is
     in .gitignore):
        X_API_KEY=...
        X_API_SECRET=...
        X_ACCESS_TOKEN=...
        X_ACCESS_SECRET=...
  5. python3 xdesk.py doctor      # one cheap read, confirms the keys work

USE:
  python3 xdesk.py post --text caption.txt --media grade.mp4 --thread thread.txt
      Posts the video with the caption, then each paragraph of thread.txt as
      a reply in order. Prints the tweet IDs. Reply one is where the record
      link goes; reply two the cards (--thread-media card1.png card2.png ...).
  python3 xdesk.py metrics 1234567890
      Impressions, likes, reposts, replies, bookmarks, profile clicks, link
      clicks, video views for your own post (organic metrics need user
      context, which this has, and a 30 day window).
  python3 xdesk.py replies 1234567890
      Everyone who replied in that conversation, with handle and follower
      count. This is the Saturday warm inbox, read in ten seconds.
  python3 xdesk.py ships 1234567890 --beat GRADE --format video_split --note "4 Sep grade"
      Appends a row to ships.csv beside this script using live metrics.
  python3 xdesk.py mentions
      Recent posts mentioning @TheSimplifier7.

Every command accepts --dry-run: prints what it would send and sends nothing.

BRAND LAW IS NOT ENFORCED BY THIS FILE. It posts what you give it. The
caption and thread come from the desk, checked, before they reach here.
"""
import argparse, csv, json, mimetypes, os, sys, time
from pathlib import Path

try:
    import requests
    from requests_oauthlib import OAuth1
except ImportError:
    sys.exit("pip install requests requests-oauthlib")

HERE = Path(__file__).resolve().parent
API = "https://api.x.com/2"
UPLOAD = "https://api.x.com/2/media/upload"
HANDLE = "TheSimplifier7"


# ---------------------------------------------------------------- auth ----
def load_env():
    env = {}
    p = HERE / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    for k in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"):
        env.setdefault(k, os.environ.get(k, ""))
    missing = [k for k in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET") if not env.get(k)]
    if missing:
        sys.exit("Missing in .env: " + ", ".join(missing))
    return env


def auth(env):
    return OAuth1(env["X_API_KEY"], env["X_API_SECRET"], env["X_ACCESS_TOKEN"], env["X_ACCESS_SECRET"])


def call(method, url, oauth, dry=False, **kw):
    if dry:
        shown = {k: (v if k != "files" else "<binary>") for k, v in kw.items()}
        print(f"DRY {method} {url} {json.dumps(shown, default=str)[:400]}")
        return {}
    r = requests.request(method, url, auth=oauth, timeout=60, **kw)
    if r.status_code == 429:
        reset = r.headers.get("x-rate-limit-reset")
        sys.exit(f"Rate limited. Resets at unix {reset}.")
    if not r.ok:
        sys.exit(f"{method} {url} -> {r.status_code}\n{r.text}")
    return r.json() if r.text else {}


# --------------------------------------------------------------- media ----
def upload_media(path, oauth, dry=False):
    """Chunked upload for video, simple upload for images. Returns media_id."""
    p = Path(path)
    if not p.exists():
        sys.exit(f"No such file: {path}")
    mime = mimetypes.guess_type(str(p))[0] or "application/octet-stream"
    size = p.stat().st_size
    is_video = mime.startswith("video/")
    category = "tweet_video" if is_video else "tweet_image"

    if dry:
        print(f"DRY upload {p.name} {mime} {size} bytes as {category}")
        return "DRY_MEDIA_ID"

    init = call("POST", UPLOAD, oauth, data={
        "command": "INIT", "media_type": mime, "total_bytes": str(size), "media_category": category})
    media_id = init.get("data", init).get("id") or init.get("data", init).get("media_id_string") or init.get("media_id_string")
    if not media_id:
        sys.exit("INIT returned no media id: " + json.dumps(init))

    chunk = 4 * 1024 * 1024
    with p.open("rb") as f:
        seg = 0
        while True:
            buf = f.read(chunk)
            if not buf:
                break
            call("POST", UPLOAD, oauth, data={"command": "APPEND", "media_id": media_id, "segment_index": str(seg)},
                 files={"media": buf})
            seg += 1

    fin = call("POST", UPLOAD, oauth, data={"command": "FINALIZE", "media_id": media_id})
    info = fin.get("data", fin).get("processing_info") or fin.get("processing_info")
    while info and info.get("state") in ("pending", "in_progress"):
        wait = int(info.get("check_after_secs", 3))
        print(f"  processing {p.name} ... {info.get('state')} ({wait}s)")
        time.sleep(wait)
        st = call("GET", UPLOAD, oauth, params={"command": "STATUS", "media_id": media_id})
        info = st.get("data", st).get("processing_info") or st.get("processing_info")
        if info and info.get("state") == "failed":
            sys.exit("Media processing failed: " + json.dumps(info))
    return media_id


# ---------------------------------------------------------------- post ----
def read_text(arg):
    p = Path(arg)
    return p.read_text(encoding="utf-8").strip() if p.exists() else arg


def post_tweet(text, oauth, media_ids=None, reply_to=None, dry=False):
    body = {"text": text}
    if media_ids:
        body["media"] = {"media_ids": [str(m) for m in media_ids]}
    if reply_to:
        body["reply"] = {"in_reply_to_tweet_id": str(reply_to)}
    res = call("POST", f"{API}/tweets", oauth, dry=dry, json=body)
    tid = (res.get("data") or {}).get("id", "DRY_TWEET_ID")
    return tid


def cmd_post(a, oauth):
    text = read_text(a.text)
    if len(text) > 4000:
        sys.exit(f"Caption is {len(text)} characters.")
    media = [upload_media(m, oauth, a.dry_run) for m in (a.media or [])]
    root = post_tweet(text, oauth, media or None, dry=a.dry_run)
    print(f"posted  {root}  https://x.com/{HANDLE}/status/{root}")
    ids = [root]
    if a.thread:
        paras = [p.strip() for p in read_text(a.thread).split("\n\n") if p.strip()]
        tmedia = list(a.thread_media or [])
        prev = root
        for i, para in enumerate(paras):
            mids = None
            if i == 1 and tmedia:            # reply two carries the cards by convention
                mids = [upload_media(m, oauth, a.dry_run) for m in tmedia]
            tid = post_tweet(para, oauth, mids, reply_to=prev, dry=a.dry_run)
            print(f"reply {i+1}  {tid}")
            ids.append(tid); prev = tid
    (HERE / "last_post.json").write_text(json.dumps({"ids": ids, "at": time.strftime("%Y-%m-%dT%H:%M:%S%z")}, indent=2))
    return ids


# ------------------------------------------------------------- metrics ----
FIELDS = "public_metrics,non_public_metrics,organic_metrics,created_at,text"

def get_metrics(tid, oauth, dry=False):
    res = call("GET", f"{API}/tweets/{tid}", oauth, dry=dry, params={"tweet.fields": FIELDS})
    d = res.get("data", {})
    pub, npub, org = d.get("public_metrics", {}), d.get("non_public_metrics", {}), d.get("organic_metrics", {})
    return {
        "id": tid, "created_at": d.get("created_at"),
        "impressions": npub.get("impression_count", pub.get("impression_count")),
        "likes": pub.get("like_count"), "reposts": pub.get("retweet_count"), "quotes": pub.get("quote_count"),
        "replies": pub.get("reply_count"), "bookmarks": pub.get("bookmark_count"),
        "profile_clicks": npub.get("user_profile_clicks", org.get("user_profile_clicks")),
        "link_clicks": npub.get("url_link_clicks", org.get("url_link_clicks")),
        "video_views": org.get("view_count") or npub.get("view_count"),
        "text": (d.get("text") or "")[:80],
    }


def cmd_metrics(a, oauth):
    m = get_metrics(a.id, oauth, a.dry_run)
    for k, v in m.items():
        print(f"{k:15} {v}")


def cmd_replies(a, oauth):
    params = {"query": f"conversation_id:{a.id} -from:{HANDLE}", "max_results": 100,
              "tweet.fields": "author_id,created_at,public_metrics", "expansions": "author_id",
              "user.fields": "username,name,public_metrics,description"}
    res = call("GET", f"{API}/tweets/search/recent", oauth, dry=a.dry_run, params=params)
    users = {u["id"]: u for u in res.get("includes", {}).get("users", [])}
    rows = []
    for t in res.get("data", []):
        u = users.get(t["author_id"], {})
        rows.append({"handle": "@" + u.get("username", "?"), "followers": u.get("public_metrics", {}).get("followers_count"),
                     "at": t.get("created_at"), "text": t.get("text", "").replace("\n", " ")})
    rows.sort(key=lambda r: -(r["followers"] or 0))
    print(f"{len(rows)} replies")
    for r in rows:
        print(f"{r['handle']:22} {str(r['followers']):>8}  {r['at']}  {r['text'][:140]}")
    out = HERE / f"replies_{a.id}.json"
    out.write_text(json.dumps(rows, indent=2)); print(f"written {out.name}")


def cmd_mentions(a, oauth):
    params = {"query": f"@{HANDLE} -from:{HANDLE}", "max_results": 50,
              "tweet.fields": "author_id,created_at", "expansions": "author_id", "user.fields": "username,public_metrics"}
    res = call("GET", f"{API}/tweets/search/recent", oauth, dry=a.dry_run, params=params)
    users = {u["id"]: u for u in res.get("includes", {}).get("users", [])}
    for t in res.get("data", []):
        u = users.get(t["author_id"], {})
        print(f"@{u.get('username','?'):20} {str(u.get('public_metrics',{}).get('followers_count')):>8}  {t.get('created_at')}  {t.get('text','')[:120]}")


# --------------------------------------------------------------- ships ----
SHIPS_COLS = ["date", "beat", "format", "link", "impressions_24h", "follows_24h", "profile_visits", "video_views", "link_clicks", "url", "note"]

def cmd_ships(a, oauth):
    m = get_metrics(a.id, oauth, a.dry_run)
    path = HERE / "ships.csv"
    new = not path.exists()
    row = {"date": (m.get("created_at") or "")[:10], "beat": a.beat, "format": a.format,
           "link": "y" if m.get("link_clicks") else "n",
           "impressions_24h": m.get("impressions"), "follows_24h": "[ ]",   # X does not expose follows per post; fill from analytics
           "profile_visits": m.get("profile_clicks"), "video_views": m.get("video_views"),
           "link_clicks": m.get("link_clicks"), "url": f"https://x.com/{HANDLE}/status/{a.id}", "note": a.note or ""}
    if a.dry_run:
        print("DRY ships row:", row); return
    with path.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=SHIPS_COLS)
        if new: w.writeheader()
        w.writerow(row)
    print("appended to ships.csv:", row)


def cmd_doctor(a, oauth):
    res = call("GET", f"{API}/users/me", oauth, dry=a.dry_run, params={"user.fields": "public_metrics"})
    d = res.get("data", {})
    print(f"authenticated as @{d.get('username')}  followers {d.get('public_metrics',{}).get('followers_count')}")


# ---------------------------------------------------------------- main ----
def main():
    ap = argparse.ArgumentParser(description="THE SIMPLIFIER's own X connector")
    ap.add_argument("--dry-run", action="store_true", help="print what would be sent, send nothing")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("post"); p.add_argument("--text", required=True, help="caption text or a file containing it")
    p.add_argument("--media", nargs="*", help="video or image files for the root post")
    p.add_argument("--thread", help="file; each blank-line-separated paragraph becomes a reply in order")
    p.add_argument("--thread-media", nargs="*", help="images attached to reply two (the cards)")
    p.set_defaults(fn=cmd_post)

    p = sub.add_parser("metrics"); p.add_argument("id"); p.set_defaults(fn=cmd_metrics)
    p = sub.add_parser("replies"); p.add_argument("id"); p.set_defaults(fn=cmd_replies)
    p = sub.add_parser("mentions"); p.set_defaults(fn=cmd_mentions)
    p = sub.add_parser("ships"); p.add_argument("id"); p.add_argument("--beat", required=True); p.add_argument("--format", required=True); p.add_argument("--note"); p.set_defaults(fn=cmd_ships)
    p = sub.add_parser("doctor"); p.set_defaults(fn=cmd_doctor)

    a = ap.parse_args()
    env = load_env() if not a.dry_run else {k: "dry" for k in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET")}
    a.fn(a, auth(env))


if __name__ == "__main__":
    main()
