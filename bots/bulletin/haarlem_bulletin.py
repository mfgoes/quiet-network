#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Haarlem Bulletin: real, local notices for the Haarlem circle.

Pulls official municipal publications (Gemeenteblad, via the open
officielebekendmakingen.nl SRU API) and turns the ones neighbours care
about into short posts that expire when the thing is over:

	events      → expire when the event ends
	road works  → expire when the works end
	tree felling→ expire 7 days after posting

Everything else (dormer windows, solar panels, ...) is ignored. Disabled
parking spots tied to a licence plate are skipped on purpose (personal).
House numbers are always stripped: street level only.

Usage (from the bots/ folder):
	python bulletin/haarlem_bulletin.py              # dry run: print posts
	python bulletin/haarlem_bulletin.py --post       # create/update the bulletin account and post
	python bulletin/haarlem_bulletin.py --from-file notices.json   # offline test

Safe to run daily: posts are de-duplicated against what the bulletin
account already posted (same notice URL or same headline).
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import urllib.error
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

AMS = ZoneInfo("Europe/Amsterdam")
SRU = "https://repository.overheid.nl/sru"

BULLETIN_USERNAME = "haarlem_bulletin"
BULLETIN_NAME = "Haarlem Bulletin"
BULLETIN_EMAIL = "haarlem.bulletin@quiet.local"
BULLETIN_AVATAR = "house"
BULLETIN_BIO = "Official notices from Gemeente Haarlem: events, road works and tree felling near you. Automated, never a neighbour."

EVENT_LOOKAHEAD_DAYS = 45   # only post events/works starting within this window
TREE_FRESH_DAYS = 7         # only post tree notices published this recently
TREE_LIFETIME_DAYS = 7

MONTHS_NL = {
	"januari": 1, "februari": 2, "maart": 3, "april": 4, "mei": 5, "juni": 6,
	"juli": 7, "augustus": 8, "september": 9, "oktober": 10, "november": 11, "december": 12,
}

TREE_REASONS = [
	("slechte conditie", "poor condition"),
	("dode", "dead tree"),
	("schade aan", "damage to a building"),
	("scheefgroei", "leaning"),
	("sloop", "demolition"),
	("nieuwbouw", "new construction"),
	("trafohuisje", "new transformer station"),
	("vervangen", "to be replaced"),
	("overlast", "nuisance"),
]


# ── Fetching ────────────────────────────────────────────────────────────

def fetch_notices(since: str) -> list[dict]:
	"""All Haarlem publications available since YYYY-MM-DD, flattened."""
	query = f'c.product-area==officielepublicaties AND dt.creator="Haarlem" AND dt.available>="{since}"'
	out, start = [], 1
	while True:
		params = urllib.parse.urlencode({
			"query": query, "maximumRecords": 100, "startRecord": start, "httpAccept": "application/json",
		})
		with urllib.request.urlopen(f"{SRU}?{params}", timeout=30) as resp:
			data = json.loads(resp.read().decode())
		recs = data["searchRetrieveResponse"].get("records", {}).get("record", [])
		if isinstance(recs, dict):
			recs = [recs]
		for r in recs:
			gzd = r["recordData"]["gzd"]
			meta = gzd["originalData"]["meta"]
			types = meta["owmskern"]["type"]
			types = types if isinstance(types, list) else [types]
			punt = (meta["tpmeta"].get("gebiedsmarkering") or {}).get("Punt") or {}
			out.append({
				"id": meta["owmskern"]["identifier"],
				"date": meta["owmsmantel"]["available"],
				"types": "/".join(t["$"] for t in types),
				"title": meta["owmskern"]["title"],
				"pt": punt.get("locatiegebied"),
				"url": gzd["enrichedData"]["preferredUrl"],
			})
		if len(recs) < 100:
			return out
		start += 100


# ── Parsing ─────────────────────────────────────────────────────────────

def split_title(title: str):
	"""'Gemeente Haarlem, <status>, <location>, 0392-..., <description>, verzonden ...'"""
	m = re.search(r"\b0392-\d{4}-\d+\b", title)
	if not m or not title.startswith("Gemeente Haarlem"):
		return None
	head = title[: m.start()].rstrip(", ")
	tail = title[m.end():].lstrip(", ")
	head = head[len("Gemeente Haarlem"):].lstrip(", ")
	status, _, location = head.partition(", ")
	description = re.split(r",\s*(ontvangen op|verzonden)\b", tail)[0].strip()
	return status.strip(), location.strip(), description


def status_word(status: str):
	s = status.lower()
	if "beslistermijn" in s:
		return None  # "decision deadline extended": not news
	if "geweigerd" in s:
		return "refused"
	if "verleend" in s:
		return "granted"
	if "aanvraag" in s:
		return "requested"
	return None


def clean_location(loc: str) -> str:
	"""Street or area only: no 't.h.v.', postcode, city, or house numbers."""
	loc = re.sub(r"^(t\.?\s?h\.?\s?v\.?|thv)\s+", "", loc, flags=re.I)
	loc = re.sub(r"\(.*?\)", "", loc)
	loc = re.sub(r"\b\d{4}\s?[A-Z]{2}\b", "", loc)                 # postcode
	loc = re.sub(r"\s*(gem\.\s*)?Haarlem\b", "", loc)
	loc = re.sub(r"\s+", " ", loc)
	parts = []
	for part in loc.split(","):
		part = re.sub(r"\s+\d[\w\-/ ]*$", "", part.strip())          # house numbers
		part = re.sub(r"\s*t/m.*$", "", part).strip()
		if part and not part[0].isdigit() and part not in parts:
			parts.append(part)
	loc = ", ".join(parts[:3]) + ("…" if len(parts) > 3 else "")
	if len(loc) > 60:
		loc = loc[:58].rsplit(" ", 1)[0] + "…"
	return loc.strip(" ,")


def parse_when(text: str):
	"""Start/end datetimes from the many ways the gemeente writes dates."""
	dates = [
		(int(y), int(m), int(d))
		for d, m, y in re.findall(r"\b(\d{1,2})-(\d{1,2})-(\d{4})\b", text)
	]
	for d, mon, y in re.findall(r"\b(\d{1,2}) (" + "|".join(MONTHS_NL) + r") (\d{4})", text, flags=re.I):
		dates.append((int(y), MONTHS_NL[mon.lower()], int(d)))
	if not dates:
		return None
	times = [(int(h), int(mi)) for h, mi in re.findall(r"\b(\d{1,2})[:.](\d{2})\b", text)]
	(y1, m1, d1), (y2, m2, d2) = dates[0], dates[-1]
	start_t = times[0] if times else (0, 0)
	end_t = times[-1] if times else (23, 59)
	start = datetime(y1, m1, d1, *start_t, tzinfo=AMS)
	end = datetime(y2, m2, d2, *end_t, tzinfo=AMS)
	if end <= start:
		end += timedelta(days=1)  # overnight works: 19:00 tot 07:00
	return start, end


def fmt_day(dt: datetime) -> str:
	return dt.strftime("%a %-d %b")


def fmt_range(start: datetime, end: datetime) -> str:
	all_day = start.strftime("%H:%M") == "00:00" and end.strftime("%H:%M") == "23:59"
	if start.date() == end.date() or (end - start) < timedelta(hours=14) and not all_day:
		if all_day:
			return fmt_day(start)
		same = start.date() == end.date()
		return f"{fmt_day(start)} · {start:%H:%M}–{'' if same else fmt_day(end) + ' '}{end:%H:%M}"
	if all_day:
		return f"{fmt_day(start)} – {fmt_day(end)}"
	return f"{fmt_day(start)} {start:%H:%M} – {fmt_day(end)} {end:%H:%M}"


def notice_to_post(n: dict, now: datetime):
	"""Turn one notice into {key, content, expires_at} or None if it's not for the feed."""
	title = n["title"]

	if "gehandicaptenparkeerplaats" in title.lower():
		return None  # tied to one person's licence plate: not feed material

	parts = split_title(title)
	if not parts:
		return None
	status, location, desc = parts
	word = status_word(status)
	if not word:
		return None
	loc = clean_location(location)
	link = f"[Official notice ↗]({n['url']})"
	permit = {"requested": "Permit requested, not yet granted.", "granted": "Permit granted.", "refused": "Permit refused."}[word]

	# Events (but not the separate alcohol licence for the same event)
	ev = re.match(r"het evenement (.+?), op (.+)$", desc, flags=re.I)
	if ev and not desc.lower().startswith("het tappen"):
		name = ev.group(1).strip()
		name = name[:1].upper() + name[1:]
		if re.search(r"\btest\b", name, flags=re.I):
			return None
		when = parse_when(ev.group(2))
		if not when or not _in_window(when, now):
			return None
		start, end = when
		return {
			"key": f"event|{name.lower()}|{start.date()}",
			"rank": 0 if word == "granted" else 1,
			"content": f"## {name}\n**{loc}** · {fmt_range(start, end)}\n\n{permit}\n\n{link}",
			"expires_at": end + timedelta(hours=2),
		}

	# Road works
	if "werkzaamheden aan de weg" in desc.lower():
		when = parse_when(desc)
		if not when or not _in_window(when, now):
			return None
		start, end = when
		return {
			"key": f"works|{loc.lower()}|{start.date()}",
			"rank": 0 if word == "granted" else 1,
			"content": f"## Road works: {loc}\n{fmt_range(start, end)}\n\nExpect closures or diversions. {permit}\n\n{link}",
			"expires_at": end + timedelta(hours=1),
		}

	# Tree felling
	if "kappen" in desc.lower():
		published = datetime.fromisoformat(n["date"]).replace(tzinfo=AMS)
		if published < now - timedelta(days=TREE_FRESH_DAYS):
			return None
		count = re.search(r"\b(\d+)\s+bomen\b", desc)
		what = f"{count.group(1)} trees" if count else "1 tree"
		reason = next((en for nl, en in TREE_REASONS if nl in desc.lower()), None)
		reason_line = f"{what} · reason: {reason}" if reason else what
		return {
			"key": f"trees|{loc.lower()}|{what}",
			"rank": 0 if word != "requested" else 1,
			"content": f"## Tree felling: {loc}\n{reason_line}\n\n{permit}\n\n{link}",
			"expires_at": now + timedelta(days=TREE_LIFETIME_DAYS),
		}

	return None


def _in_window(when, now):
	start, end = when
	return end > now and start <= now + timedelta(days=EVENT_LOOKAHEAD_DAYS)


def build_posts(notices: list[dict], now: datetime) -> list[dict]:
	"""Parse, keep the best notice per thing (granted beats requested), soonest first."""
	best = {}
	for n in notices:
		p = notice_to_post(n, now)
		if not p:
			continue
		if p["key"] not in best or p["rank"] < best[p["key"]]["rank"]:
			best[p["key"]] = p
	return sorted(best.values(), key=lambda p: p["expires_at"])


# ── Supabase ────────────────────────────────────────────────────────────

class Supa:
	def __init__(self, url: str, key: str):
		self.url, self.key = url.rstrip("/"), key

	def req(self, method, path, body=None, prefer=None):
		headers = {"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json"}
		if prefer:
			headers["Prefer"] = prefer
		data = json.dumps(body).encode() if body is not None else None
		r = urllib.request.Request(f"{self.url}{path}", data=data, headers=headers, method=method)
		try:
			with urllib.request.urlopen(r, timeout=30) as resp:
				raw = resp.read().decode()
				return json.loads(raw) if raw else None
		except urllib.error.HTTPError as e:
			sys.exit(f"Supabase {method} {path} failed ({e.code}): {e.read().decode()[:300]}")


def ensure_bulletin_user(db: Supa, circle_id: str) -> str:
	found = db.req("GET", f"/rest/v1/profiles?select=id&username=eq.{BULLETIN_USERNAME}")
	if found:
		return found[0]["id"]
	user = db.req("POST", "/auth/v1/admin/users", {
		"email": BULLETIN_EMAIL, "password": str(uuid.uuid4()),
		"email_confirm": True, "user_metadata": {"is_bot": True, "display_name": BULLETIN_NAME},
	})
	uid = user["id"]
	db.req("PATCH", f"/rest/v1/profiles?id=eq.{uid}", {
		"display_name": BULLETIN_NAME, "username": BULLETIN_USERNAME,
		"avatar_emoji": BULLETIN_AVATAR, "bio": BULLETIN_BIO, "is_bot": True,
	}, prefer="return=minimal")
	db.req("POST", "/rest/v1/circle_members", {"circle_id": circle_id, "user_id": uid, "role": "member"}, prefer="return=minimal")
	print(f"Created bulletin account {BULLETIN_NAME} ({uid})")
	return uid


def already_posted(db: Supa, uid: str) -> set[str]:
	"""Notice URLs and headlines the bulletin already used (live or recently expired)."""
	since = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
	rows = db.req("GET", f"/rest/v1/posts?select=content&author_id=eq.{uid}&created_at=gte.{urllib.parse.quote(since)}") or []
	seen = set()
	for r in rows:
		c = r["content"]
		seen.update(re.findall(r"\((https://zoek\.officielebekendmakingen\.nl/[^)]+)\)", c))
		seen.add(c.split("\n", 1)[0])
	return seen


# ── Main ────────────────────────────────────────────────────────────────

def main():
	ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	ap.add_argument("--post", action="store_true", help="actually write to Supabase (default: dry run)")
	ap.add_argument("--days", type=int, default=60, help="how far back to read publications (default 60)")
	ap.add_argument("--from-file", help="read notices from a JSON file instead of the API (testing)")
	ap.add_argument("--now", help="pretend it is this ISO datetime (testing)")
	args = ap.parse_args()

	now = datetime.fromisoformat(args.now).astimezone(AMS) if args.now else datetime.now(AMS)
	if args.from_file:
		with open(args.from_file, encoding="utf-8") as f:
			notices = json.load(f)
	else:
		notices = fetch_notices((now - timedelta(days=args.days)).date().isoformat())
	posts = build_posts(notices, now)
	print(f"{len(notices)} notices → {len(posts)} bulletin posts\n")

	if not args.post:
		for p in posts:
			print(p["content"])
			print(f"   expires {p['expires_at']:%a %d %b %H:%M}\n" + "─" * 60)
		print("\nDry run. Add --post to publish.")
		return

	try:
		from dotenv import load_dotenv
		load_dotenv(os.path.join(os.path.dirname(__file__), "..", "circles", "shared", ".env"))
	except ImportError:
		pass
	url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
	circle_id = os.getenv("CIRCLE_ID", "309f9c00-d7df-4004-b443-a8f2055c22b4")  # Haarlem
	if not url or not key:
		sys.exit("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (bots/circles/shared/.env)")

	db = Supa(url, key)
	uid = ensure_bulletin_user(db, circle_id)
	seen = already_posted(db, uid)
	created = 0
	for p in posts:
		headline = p["content"].split("\n", 1)[0]
		notice_url = re.search(r"\((https://[^)]+)\)", p["content"]).group(1)
		if headline in seen or notice_url in seen:
			continue
		now_utc = datetime.now(timezone.utc)
		duration = int((p["expires_at"] - now_utc).total_seconds())
		if duration < 3600:
			continue
		db.req("POST", "/rest/v1/posts", {
			"circle_id": circle_id, "author_id": uid, "content": p["content"],
			"created_at": now_utc.isoformat(), "expires_at": p["expires_at"].astimezone(timezone.utc).isoformat(),
			"original_duration_seconds": duration,
		}, prefer="return=minimal")
		created += 1
		print(f"Posted: {headline}")
	print(f"\n{created} new, {len(posts) - created} already posted or too short-lived.")


if __name__ == "__main__":
	main()
