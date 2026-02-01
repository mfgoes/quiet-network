#!/usr/bin/env python3
"""
Seed bot users and posts into a Supabase-powered Quiet Network circle.
Uses the service_role key to bypass RLS.
"""

import json
import random
import uuid
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

# ── Config ──────────────────────────────────────────────────────────────
SUPABASE_URL = "https://gtlhwapaeytlialzfrao.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bGh3YXBhZXl0bGlhbHpmcmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY4OTcyNywiZXhwIjoyMDg1MjY1NzI3fQ.q6beenq3ftZpKN0zAUrAs2_yGJJqArG83vrMGF52LGU"

CIRCLE_ID = "309f9c00-d7df-4004-b443-a8f2055c22b4"  # Haarlem

# Posts expire in 7 days, duration = 7 days in seconds
POST_DURATION_SECONDS = 7 * 24 * 3600

BOT_USERS = [
    {"name": "Alice",  "bio": "Coffee enthusiast, loves cycling around Haarlem, occasional photographer.", "emoji": "woman"},
    {"name": "Bob",    "bio": "Local foodie and market fan, enjoys exploring hidden gems in the city.", "emoji": "fox"},
    {"name": "Carla",  "bio": "Art lover, spends weekends at museums and street markets.", "emoji": "cat"},
    {"name": "Daniel", "bio": "History buff and dog owner, enjoys long walks and stories about Haarlem's past.", "emoji": "man"},
    {"name": "Emma",   "bio": "Student of design, loves coffee shops and sketching street scenes.", "emoji": "bubu"},
    {"name": "Frank",  "bio": "Weekend cyclist and local music fan, always looking for fun events.", "emoji": "jjk"},
    {"name": "Greta",  "bio": "Enjoys baking, community volunteering, and quiet spots along the canals.", "emoji": "hills"},
    {"name": "Henk",   "bio": "Tech enthusiast and amateur photographer, likes sharing tips about local cafés.", "emoji": "roof"},
    {"name": "Iris",   "bio": "Nature lover, enjoys hiking nearby dunes and sketching landscapes.", "emoji": "house"},
    {"name": "Jack",   "bio": "Sports fan and local history nerd, enjoys chatting about football and city culture.", "emoji": "fox"},
]

# ── Helpers ──────────────────────────────────────────────────────────────

def api_request(method, path, body=None, headers_extra=None):
    """Make a request to the Supabase REST or Auth API."""
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if headers_extra:
        headers.update(headers_extra)

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body}")
        return None


def random_past_time():
    """Generate a random timestamp within the last 2 days."""
    now = datetime.now(timezone.utc)
    # Random offset: 0 to 48 hours ago
    offset_minutes = random.randint(0, 48 * 60)
    return now - timedelta(minutes=offset_minutes)


# ── Step 1: Create bot auth users ────────────────────────────────────────

print("=== Creating bot auth users ===")
bot_ids = {}

for bot in BOT_USERS:
    bot_email = f"{bot['name'].lower()}.bot@quiet.local"
    bot_password = str(uuid.uuid4())  # random password, won't be used

    result = api_request("POST", "/auth/v1/admin/users", {
        "email": bot_email,
        "password": bot_password,
        "email_confirm": True,
        "user_metadata": {"is_bot": True},
    })

    if result and "id" in result:
        bot_ids[bot["name"]] = result["id"]
        print(f"  Created auth user: {bot['name']} -> {result['id']}")
    elif result and "msg" in result and "already" in result.get("msg", "").lower():
        # User might already exist, try to find them
        print(f"  {bot['name']}: may already exist, skipping auth creation")
    else:
        print(f"  {bot['name']}: unexpected result: {result}")

if not bot_ids:
    print("No bot users created. They may already exist.")
    print("Trying to fetch existing bot profiles...")
    # Try to get profiles that look like bots
    existing = api_request("GET", "/rest/v1/profiles?select=id,display_name,is_bot&is_bot=eq.true")
    if existing:
        for p in existing:
            bot_ids[p["display_name"]] = p["id"]
            print(f"  Found existing: {p['display_name']} -> {p['id']}")

print(f"\nBot IDs: {len(bot_ids)} users ready")

# ── Step 2: Update bot profiles ──────────────────────────────────────────

print("\n=== Updating bot profiles ===")
for bot in BOT_USERS:
    uid = bot_ids.get(bot["name"])
    if not uid:
        continue

    result = api_request("PATCH", f"/rest/v1/profiles?id=eq.{uid}", {
        "display_name": bot["name"],
        "avatar_emoji": bot["emoji"],
        "bio": bot["bio"],
        "is_bot": True,
        "username": bot["name"].lower(),
    }, headers_extra={"Prefer": "return=minimal"})

    print(f"  Updated profile: {bot['name']}")

# ── Step 3: Add bots as circle members ───────────────────────────────────

print("\n=== Adding bots to Haarlem circle ===")
for bot in BOT_USERS:
    uid = bot_ids.get(bot["name"])
    if not uid:
        continue

    result = api_request("POST", "/rest/v1/circle_members", {
        "circle_id": CIRCLE_ID,
        "user_id": uid,
        "role": "member",
    }, headers_extra={"Prefer": "return=minimal"})

    print(f"  Added {bot['name']} to circle")

# ── Step 4: Insert posts ─────────────────────────────────────────────────

print("\n=== Inserting posts ===")

with open("circles/haarlem/posts.json", "r") as f:
    posts_data = json.load(f)

bot_names = list(bot_ids.keys())

for post_item in posts_data:
    author_name = random.choice(bot_names)
    author_id = bot_ids[author_name]
    created_at = random_past_time()
    expires_at = created_at + timedelta(seconds=POST_DURATION_SECONDS)

    result = api_request("POST", "/rest/v1/posts", {
        "circle_id": CIRCLE_ID,
        "author_id": author_id,
        "content": post_item["post"],
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "original_duration_seconds": POST_DURATION_SECONDS,
    }, headers_extra={"Prefer": "return=representation"})

    if result and len(result) > 0:
        print(f"  Posted by {author_name}: \"{post_item['post'][:50]}...\" at {created_at.strftime('%Y-%m-%d %H:%M')}")
    else:
        print(f"  FAILED to post: \"{post_item['post'][:50]}...\"")

# ── Step 5: Random upvotes on posts in the circle ────────────────────────

print("\n=== Adding random upvotes ===")

# Fetch all non-welcome posts in the circle
all_posts = api_request(
    "GET",
    f"/rest/v1/posts?circle_id=eq.{CIRCLE_ID}&is_welcome=eq.false&select=id,author_id",
)

if all_posts:
    bot_id_list = list(bot_ids.values())
    upvote_count = 0

    for post in all_posts:
        # Each bot has a 30% chance of upvoting any given post (skip own posts)
        voters = [
            bid for bid in bot_id_list
            if bid != post["author_id"] and random.random() < 0.30
        ]
        for voter_id in voters:
            result = api_request("POST", "/rest/v1/post_upvotes", {
                "post_id": post["id"],
                "user_id": voter_id,
            }, headers_extra={"Prefer": "return=minimal"})
            if result is None:
                # minimal returns empty on success, HTTPError prints on failure
                upvote_count += 1

    # Correct count: minimal preference returns None on success
    # Re-count by querying
    total = api_request(
        "GET",
        f"/rest/v1/post_upvotes?select=post_id&post_id=in.({','.join(p['id'] for p in all_posts)})",
    )
    upvote_count = len(total) if total else 0
    print(f"  {upvote_count} upvotes across {len(all_posts)} posts")
else:
    print("  No posts found to upvote")

print("\n=== Done! ===")
