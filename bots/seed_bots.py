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
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load environment variables from circles/shared/.env
load_dotenv("circles/shared/.env")

# ── Config ──────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
CIRCLE_ID = os.getenv("CIRCLE_ID", "309f9c00-d7df-4004-b443-a8f2055c22b4")  # Haarlem (default)

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY")

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

def api_request(method, path, body=None, headers_extra=None, ignore_errors=None):
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
        # Check if this error should be ignored (e.g., duplicates)
        if ignore_errors and e.code in ignore_errors:
            return {"_ignored": True, "code": e.code}
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

# ── Step 4: Insert posts from synthetic_content.json ────────────────────

print("\n=== Inserting posts from synthetic content ===")

with open("circles/haarlem/synthetic_content.json", "r") as f:
    synthetic_data = json.load(f)

# Map persona IDs to bot user IDs
persona_to_user_id = {}
for persona in synthetic_data.get("user_personas", []):
    persona_name = persona["name"]
    if persona_name in bot_ids:
        persona_to_user_id[persona["id"]] = bot_ids[persona_name]

# Track post IDs for reply insertion
synthetic_post_ids = {}

for post_item in synthetic_data.get("posts", []):
    author_persona = post_item.get("author_id")
    author_id = persona_to_user_id.get(author_persona)

    if not author_id:
        print(f"  SKIP: No user found for persona {author_persona}")
        continue

    # Parse the timestamp from the JSON
    created_at_str = post_item.get("created_at")
    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
    expires_at = created_at + timedelta(seconds=POST_DURATION_SECONDS)

    result = api_request("POST", "/rest/v1/posts", {
        "circle_id": CIRCLE_ID,
        "author_id": author_id,
        "content": post_item["content"],
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "original_duration_seconds": POST_DURATION_SECONDS,
    }, headers_extra={"Prefer": "return=representation"})

    if result and len(result) > 0:
        post_db_id = result[0]["id"]
        synthetic_post_ids[post_item["id"]] = post_db_id
        print(f"  Posted by {author_persona}: \"{post_item['content'][:50]}...\"")
    else:
        print(f"  FAILED to post: \"{post_item['content'][:50]}...\"")

# ── Step 5: Insert replies (comments) ────────────────────────────────────

print("\n=== Inserting replies ===")

reply_count = 0
for post_item in synthetic_data.get("posts", []):
    post_synthetic_id = post_item["id"]
    post_db_id = synthetic_post_ids.get(post_synthetic_id)

    if not post_db_id:
        continue

    for comment in post_item.get("comments", []):
        author_persona = comment.get("author_id")
        author_id = persona_to_user_id.get(author_persona)

        if not author_id:
            continue

        created_at_str = comment.get("created_at")
        created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))

        result = api_request("POST", "/rest/v1/replies", {
            "post_id": post_db_id,
            "author_id": author_id,
            "content": comment["content"],
            "created_at": created_at.isoformat(),
        }, headers_extra={"Prefer": "return=representation"})

        if result and len(result) > 0:
            reply_count += 1
            reply_db_id = result[0]["id"]

            # Add upvotes to this reply
            upvote_target = comment.get("upvote_count", 0)
            if upvote_target > 0:
                bot_id_list = list(bot_ids.values())
                # Randomly select voters (excluding author)
                potential_voters = [bid for bid in bot_id_list if bid != author_id]
                voters = random.sample(potential_voters, min(upvote_target, len(potential_voters)))

                for voter_id in voters:
                    api_request("POST", "/rest/v1/reply_upvotes", {
                        "reply_id": reply_db_id,
                        "user_id": voter_id,
                    }, headers_extra={"Prefer": "return=minimal"}, ignore_errors=[409])

print(f"  {reply_count} replies inserted")

# ── Step 6: Add upvotes to posts ─────────────────────────────────────────

print("\n=== Adding upvotes to posts ===")

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
            }, headers_extra={"Prefer": "return=minimal"}, ignore_errors=[409])
            # Success returns None, ignored duplicates return {"_ignored": True}
            if result is None or (isinstance(result, dict) and result.get("_ignored")):
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
