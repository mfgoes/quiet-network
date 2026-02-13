#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Seed bot users and posts into a Supabase-powered Quiet Network circle.
Uses the service_role key to bypass RLS.
"""
import sys, io
# Force UTF-8 output so emoji/unicode don't crash on Windows cp1252 consoles
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import json
import random
import uuid
import urllib.request
import urllib.error
import os
import time
import numpy as np
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load environment variables from circles/shared/.env
load_dotenv("circles/shared/.env")

# ── Config ──────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
CIRCLE_ID = os.getenv("CIRCLE_ID", "309f9c00-d7df-4004-b443-a8f2055c22b4")  # Haarlem (default)
CIRCLE_NAME = os.getenv("CIRCLE_NAME", "haarlem")  # Circle name for loading local context
CIRCLE_DESCRIPTION = os.getenv("CIRCLE_DESCRIPTION", "")  # Circle description for content generation
CIRCLE_CATEGORY = os.getenv("CIRCLE_CATEGORY", "")  # Circle category for content generation

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY")

# Load circle-specific local context (file I/O only — no API calls here)
LOCAL_CONTEXT = None
local_context_path = f"circles/{CIRCLE_NAME}/local_context.json"
if os.path.exists(local_context_path):
    with open(local_context_path, "r") as f:
        LOCAL_CONTEXT = json.load(f)
    print(f"Loaded local context for {LOCAL_CONTEXT.get('circle_name', CIRCLE_NAME)}")
else:
    print(f"Note: No local_context.json found for circle '{CIRCLE_NAME}' (will use circle metadata from DB)")

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

# Engagement profiles: personality-based interaction patterns
BOT_ENGAGEMENT_PROFILES = {
    "Alice": {"upvote_prob": 0.40, "reply_freq": 0.6},   # Moderate engager - thoughtful photographer
    "Bob": {"upvote_prob": 0.50, "reply_freq": 0.7},     # Active foodie - loves sharing discoveries
    "Carla": {"upvote_prob": 0.65, "reply_freq": 0.9},   # Social butterfly - art lover, very engaged
    "Daniel": {"upvote_prob": 0.35, "reply_freq": 0.5},  # Thoughtful historian - selective engagement
    "Emma": {"upvote_prob": 0.55, "reply_freq": 0.8},    # Social student - active in community
    "Frank": {"upvote_prob": 0.45, "reply_freq": 0.6},   # Moderate cyclist - balanced engagement
    "Greta": {"upvote_prob": 0.50, "reply_freq": 0.7},   # Warm volunteer - supportive and active
    "Henk": {"upvote_prob": 0.20, "reply_freq": 0.3},    # Lurker/critic - tech enthusiast, less social
    "Iris": {"upvote_prob": 0.38, "reply_freq": 0.5},    # Selective nature lover - thoughtful engagement
    "Jack": {"upvote_prob": 0.60, "reply_freq": 0.9},    # Very active sports fan - chatty and engaged
}

# Persona schedules: time-of-day posting patterns (24-hour format)
PERSONA_SCHEDULES = {
    "Alice": {"peak_hour": 8, "variance": 2.0},    # Morning coffee time (6-10am typical)
    "Bob": {"peak_hour": 11, "variance": 2.5},     # Late morning/lunch exploration (8:30am-1:30pm)
    "Carla": {"peak_hour": 14, "variance": 3.0},   # Afternoon museum visits (11am-5pm)
    "Daniel": {"peak_hour": 7, "variance": 1.5},   # Morning dog walks (5:30-8:30am)
    "Emma": {"peak_hour": 10, "variance": 2.5},    # Late morning student hours (7:30am-12:30pm)
    "Frank": {"peak_hour": 18, "variance": 2.0},   # Evening after work (4-10pm)
    "Greta": {"peak_hour": 6, "variance": 1.5},    # Early morning baker (4:30-7:30am)
    "Henk": {"peak_hour": 21, "variance": 2.5},    # Evening/night owl tech time (6:30pm-11:30pm)
    "Iris": {"peak_hour": 15, "variance": 3.0},    # Afternoon nature time (noon-6pm)
    "Jack": {"peak_hour": 19, "variance": 2.0},    # Evening sports/social time (5-11pm)
}

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


def api_request_with_retry(method, path, body=None, headers_extra=None, ignore_errors=None, max_retries=3):
    """
    Make an API request with automatic retry and exponential backoff.

    Args:
        method: HTTP method (GET, POST, PATCH, etc.)
        path: API path
        body: Request body (optional)
        headers_extra: Additional headers (optional)
        ignore_errors: List of HTTP error codes to ignore (optional)
        max_retries: Maximum number of retry attempts (default: 3)

    Returns:
        API response or None on failure
    """
    for attempt in range(max_retries):
        result = api_request(method, path, body, headers_extra, ignore_errors)

        # Success cases: valid response or ignored error
        if result is not None:
            return result

        # Retry logic: only retry on network errors or 5xx server errors
        # Don't retry on client errors (4xx)
        if attempt < max_retries - 1:
            # Exponential backoff: 1s, 2s, 4s
            wait_time = 2 ** attempt
            print(f"  Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
            time.sleep(wait_time)
        else:
            print(f"  Failed after {max_retries} attempts")

    return None


def random_past_time():
    """Generate a random timestamp within the last 2 days (legacy fallback)."""
    now = datetime.now(timezone.utc)
    # Random offset: 0 to 48 hours ago
    offset_minutes = random.randint(0, 48 * 60)
    return now - timedelta(minutes=offset_minutes)


def realistic_post_time(bot_name, days_back=2):
    """
    Generate a realistic timestamp based on bot's personality and schedule.

    Args:
        bot_name: Name of the bot (must be in PERSONA_SCHEDULES)
        days_back: How many days back to generate timestamps (default: 2)

    Returns:
        datetime object with timezone UTC
    """
    schedule = PERSONA_SCHEDULES.get(bot_name)
    if not schedule:
        # Fallback to random time if bot not in schedule
        return random_past_time()

    peak_hour = schedule["peak_hour"]
    variance = schedule["variance"]

    # Pick a random day in the past `days_back` days
    now = datetime.now(timezone.utc)
    days_ago = random.randint(0, days_back)
    target_date = now - timedelta(days=days_ago)

    # Generate hour using normal distribution around peak_hour
    # Use variance as standard deviation (in hours)
    hour = np.random.normal(peak_hour, variance)

    # Clamp hour to valid range [0, 23]
    hour = max(0, min(23, hour))

    # Generate random minutes within the hour
    minutes = random.randint(0, 59)

    # Construct the timestamp
    result = target_date.replace(
        hour=int(hour),
        minute=minutes,
        second=random.randint(0, 59),
        microsecond=0
    )

    return result


def realistic_reply_time(bot_name, post_timestamp):
    """
    Generate a realistic reply timestamp that comes after the post.

    Args:
        bot_name: Name of the replying bot
        post_timestamp: Timestamp of the parent post (datetime)

    Returns:
        datetime object with timezone UTC, after post_timestamp
    """
    schedule = PERSONA_SCHEDULES.get(bot_name)
    if not schedule:
        # Fallback: random time 5 minutes to 24 hours after post
        offset_minutes = random.randint(5, 24 * 60)
        return post_timestamp + timedelta(minutes=offset_minutes)

    peak_hour = schedule["peak_hour"]
    variance = schedule["variance"]

    # Replies typically come within a few hours to a day after the post
    # Generate a delay based on normal distribution (mean: 6 hours, std: 4 hours)
    delay_hours = abs(np.random.normal(6, 4))  # abs to ensure positive delay
    delay_hours = min(delay_hours, 48)  # Cap at 48 hours

    # Generate the reply time based on the delay
    reply_time = post_timestamp + timedelta(hours=delay_hours)

    # Adjust to bot's preferred posting time if the delay allows
    # If we're more than 12 hours from the post, bias toward bot's peak hour
    if delay_hours > 12:
        hour = np.random.normal(peak_hour, variance)
        hour = max(0, min(23, hour))
        reply_time = reply_time.replace(
            hour=int(hour),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
            microsecond=0
        )

    return reply_time


def validate_content_for_circle(content, circle_context=None):
    """
    Validate if content is appropriate for the circle's interests and theme.

    Args:
        content: Post or reply content (string)
        circle_context: LOCAL_CONTEXT with circle_metadata (optional)

    Returns:
        dict with 'valid' (bool), 'score' (0-1), and 'reason' (string)
    """
    if not circle_context or "circle_metadata" not in circle_context:
        # No context to validate against, assume valid
        return {"valid": True, "score": 1.0, "reason": "No circle metadata available"}

    metadata = circle_context["circle_metadata"]
    description = (metadata.get("description") or "").lower()
    category = (metadata.get("category") or "").lower()
    content_lower = content.lower()

    # Basic validation: check if content mentions circle-relevant keywords
    relevance_score = 0.0

    # Check for local references from LOCAL_CONTEXT
    if "landmarks" in circle_context:
        landmark_names = [l.get("name", "").lower() for l in circle_context["landmarks"]]
        if any(landmark in content_lower for landmark in landmark_names):
            relevance_score += 0.4

    if "businesses" in circle_context:
        business_names = [b.get("name", "").lower() for b in circle_context["businesses"]]
        if any(business in content_lower for business in business_names):
            relevance_score += 0.3

    if "activities" in circle_context:
        if any(activity.lower() in content_lower for activity in circle_context["activities"]):
            relevance_score += 0.3

    # Check for circle name mentions
    circle_name = (metadata.get("name") or "").lower()
    if circle_name and circle_name in content_lower:
        relevance_score += 0.5

    # Category-based keywords (if we expand to other categories in the future)
    if category == "city" or category == "location":
        city_keywords = ["street", "cafe", "restaurant", "park", "downtown", "neighborhood"]
        if any(keyword in content_lower for keyword in city_keywords):
            relevance_score += 0.2

    # Cap score at 1.0
    relevance_score = min(relevance_score, 1.0)

    # Content is valid if it has some relevance (score > 0) or is generic enough
    # Generic content (score 0) is also acceptable for now
    return {
        "valid": True,  # For now, all content is valid
        "score": relevance_score,
        "reason": f"Relevance score: {relevance_score:.2f}"
    }


def generate_circle_content(circle_name, circle_description, circle_category):
    """
    Generate synthetic content for circles that don't have a dedicated content file.
    Uses templates that adapt to the circle's description and category.

    Returns a synthetic_data dict in the same structure as synthetic_content.json.
    """
    # Extract topic keywords from the description
    desc_lower = (circle_description or circle_name).lower()

    # Determine content flavor based on category and description keywords
    is_city = any(w in desc_lower for w in ["city", "town", "village", "local", "resident", "neighborhood", "buurt", "stad"])
    is_food = any(w in desc_lower for w in ["food", "eat", "restaurant", "cafe", "koffie", "dinner", "lunch", "cuisine"])
    is_sport = any(w in desc_lower for w in ["sport", "run", "cycle", "fitness", "swim", "voetbal", "football", "yoga"])
    is_culture = any(w in desc_lower for w in ["art", "music", "museum", "culture", "history", "theater", "concert"])
    is_nature = any(w in desc_lower for w in ["nature", "hike", "park", "garden", "outdoor", "duin", "strand", "beach"])
    is_family = any(w in desc_lower for w in ["family", "parent", "kids", "school", "children", "gezin"])
    is_tech = any(w in desc_lower for w in ["tech", "software", "developer", "startup", "digital", "code", "ai"])

    name = circle_name  # e.g. "Leiden"

    # Build a topic-aware post set from templates
    # Each tuple: (author_id, content, [(reply_author, reply_content), ...])
    post_templates = []

    # --- Universal welcome & intro posts (every circle gets these) ---
    post_templates += [
        ("alice", f"Just joined {name} — excited to connect with everyone here! 👋 What's the best way to get involved?",
            [("carla", f"Welcome! Best tip: introduce yourself and jump into conversations. {name} is a great community."),
             ("bob", f"Great to have you! I've been here a few months — happy to help you find your way around.")]),

        ("bob", f"What are people enjoying most about {name} lately? Always looking for new things to discover.",
            [("emma", "There's always something happening if you know where to look!"),
             ("frank", f"Honestly just the community here. Good people."),
             ("daniel", f"I've been rediscovering parts of {name} I hadn't visited in years. Worth a wander.")]),

        ("greta", f"Shoutout to everyone making {name} such a welcoming place. Lovely to have a space like this. 🌟",
            [("jack", "Agreed! Nice to have a place to actually talk to neighbours."),
             ("iris", "This kind of community matters more than people realise.")]),
    ]

    # --- City/local-specific posts ---
    if is_city or not any([is_food, is_sport, is_culture, is_nature, is_tech]):
        post_templates += [
            ("emma", f"Does anyone have a go-to coffee spot in {name} they'd recommend? Looking for a good place to work from occasionally.",
                [("alice", "I've been hunting for the same thing — let us know if you find a gem!"),
                 ("carla", "I'd say the smaller independent places are usually best. Worth avoiding the chains.")]),

            ("daniel", f"Interesting piece of local history I came across about {name} — anyone else into the backstory of this area?",
                [("henk", "Didn't know that, thanks for sharing."),
                 ("iris", "Love this kind of thing. Keep them coming!")]),

            ("frank", f"Anyone up for a casual get-together to meet other {name} members in person? Could be fun.",
                [("carla", "Yes! Would love to finally put faces to names."),
                 ("emma", "Count me in if it's on a weekend."),
                 ("greta", "Great idea — let's make it happen!")]),

            ("carla", f"What's your favourite hidden gem in or around {name}? 🔍 Drop your recommendations below.",
                [("bob", "There's a little spot I found last month I'll share once I find the address again."),
                 ("jack", "Great thread idea. Following this one."),
                 ("alice", "I have a few! Will write them up properly and share them.")]),

            ("henk", f"Anyone else noticed how much {name} has changed in the last few years? Mixed feelings honestly.",
                [("daniel", "Change is always complicated. Some things better, some worse."),
                 ("frank", "Which bits are you thinking of specifically?")]),
        ]

    # --- Food-specific posts ---
    if is_food:
        post_templates += [
            ("bob", f"Just tried a new place in {name} — won't name it yet but the menu is seriously good. Will report back.",
                [("carla", "Don't keep us waiting! 😄"),
                 ("emma", "This is why I follow this circle.")]),

            ("carla", f"Best lunch spot in {name} right now? I'm on a mission to find the perfect sandwich.",
                [("alice", "There's a great bakery I keep going back to."),
                 ("greta", "Homemade is always best but I know that's not helpful 😄")]),
        ]

    # --- Sport/fitness posts ---
    if is_sport:
        post_templates += [
            ("frank", f"Anyone doing a group run or ride in {name} this weekend? Would love to join.",
                [("bob", "I'm usually out Saturday mornings — DM me if you want to join."),
                 ("jack", "I'll come if the pace is reasonable 😄")]),

            ("jack", "What's your current training routine looking like? Always curious how others structure their week.",
                [("alice", "I try to keep it consistent — 3-4 times a week, mix of intensity."),
                 ("frank", "Consistency is everything. More important than the programme itself.")]),
        ]

    # --- Culture/arts posts ---
    if is_culture:
        post_templates += [
            ("daniel", f"Went to a really good exhibition recently — if you're into that kind of thing, worth checking what's on in {name}.",
                [("iris", "Please share more details! What was the theme?"),
                 ("emma", "I love a good exhibition. Which one?")]),

            ("iris", "Anyone been to a live music event lately that really stuck with them? Looking for recommendations.",
                [("frank", "Saw something last month that was genuinely brilliant. Will dig up the details."),
                 ("carla", "Live music is something I don't do enough of. Thread bookmarked.")]),
        ]

    # --- Nature/outdoor posts ---
    if is_nature:
        post_templates += [
            ("iris", f"Went for a long walk near {name} yesterday — reminded me why I love this area. 🌿",
                [("greta", "There's something really restorative about getting outside. Glad you got out!"),
                 ("alice", "Which route did you take? Always looking for new walks.")]),

            ("alice", "What's the best time of year to really appreciate the landscape around here? Spring? Autumn?",
                [("iris", "Both honestly, for very different reasons."),
                 ("daniel", "Autumn light is hard to beat.")]),
        ]

    # --- Tech posts ---
    if is_tech:
        post_templates += [
            ("henk", "What tools is everyone using at the moment? Always curious what's actually useful vs. just hyped.",
                [("bob", "Depends on the problem. Happy to compare notes."),
                 ("emma", "Good question. I've been experimenting with a few things lately.")]),

            ("emma", "Anyone working on a side project they're excited about? Would love to hear what people are building.",
                [("henk", "Currently tinkering with something, not ready to share yet."),
                 ("jack", "Love hearing about what people are working on. Even early-stage stuff.")]),
        ]

    # --- Family posts ---
    if is_family:
        post_templates += [
            ("greta", f"Any recommendations for family-friendly activities in or near {name}? Always looking for new ideas.",
                [("carla", "So many options! Depends on the age of the kids too."),
                 ("alice", "I'll ask around and compile a list — feels like a useful thread.")]),
        ]

    # --- Universal closing posts ---
    post_templates += [
        ("jack", f"What's one thing you wish more people knew about {name}?",
            [("daniel", "That it has a lot more depth than people give it credit for."),
             ("carla", "That the community here is genuinely friendly 😊"),
             ("alice", "Good question. Let me think on that."),
             ("henk", "That parking is a nightmare and everyone should just cycle.")]),

        ("iris", f"Something I appreciate about being part of {name}: it doesn't take itself too seriously. Nice change.",
            [("greta", "Exactly. There's a warmth here that's hard to find online generally."),
             ("bob", "Agreed. Keep it this way.")]),
    ]

    # Build synthetic_data structure matching synthetic_content.json format
    personas = [
        {"id": b["name"].lower(), "name": b["name"], "traits": b["bio"], "typical_content": "Community engagement"}
        for b in BOT_USERS
    ]

    posts = []
    for i, (author_id, content, replies) in enumerate(post_templates):
        post = {
            "id": f"gen_{i+1:02d}",
            "author_id": author_id,
            "content": content,
            "created_at": "2026-02-10T10:00:00Z",  # placeholder, replaced with realistic_post_time
            "upvote_count": random.randint(1, 8),
            "comments": [
                {
                    "id": f"gen_{i+1:02d}_c{j+1}",
                    "author_id": reply_author,
                    "content": reply_content,
                    "created_at": "2026-02-10T11:00:00Z",  # placeholder
                    "upvote_count": random.randint(0, 4),
                }
                for j, (reply_author, reply_content) in enumerate(replies)
            ],
        }
        posts.append(post)

    print(f"  Generated {len(posts)} posts for '{name}' ({circle_category or 'general'} circle)")
    print(f"  Topics detected: city={is_city}, food={is_food}, sport={is_sport}, culture={is_culture}, nature={is_nature}, tech={is_tech}, family={is_family}")

    return {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "circle": circle_name,
            "description": f"Auto-generated content for {circle_name} based on circle description",
            "total_posts": len(posts),
            "source": "template_generator",
        },
        "user_personas": personas,
        "posts": posts,
    }



# ── Preflight: Fetch circle metadata from database ───────────────────────

print(f"\n=== Fetching metadata for circle: {CIRCLE_NAME} ===")
circle_data = api_request("GET", f"/rest/v1/circles?id=eq.{CIRCLE_ID}&select=id,name,description")

if circle_data and len(circle_data) > 0:
    circle = circle_data[0]
    print(f"  Name: {circle.get('name', 'Unknown')}")
    desc_preview = (circle.get('description') or 'N/A')[:120]
    print(f"  Description: {desc_preview}{'...' if len(circle.get('description') or '') > 120 else ''}")

    # Merge DB metadata into LOCAL_CONTEXT
    if LOCAL_CONTEXT is None:
        LOCAL_CONTEXT = {}
    LOCAL_CONTEXT["circle_metadata"] = {
        "id": circle.get("id"),
        "name": circle.get("name"),
        "description": circle.get("description"),
    }
    print(f"  OK: Circle metadata ready")
else:
    print(f"  WARNING: Could not fetch circle metadata for ID {CIRCLE_ID}")

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

print(f"\n=== Adding bots to {CIRCLE_NAME} circle ===")
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

print(f"\n=== Inserting posts for {CIRCLE_NAME} circle ===")

# Try to load circle-specific content file; fall back to template generation
content_file = f"circles/{CIRCLE_NAME}/synthetic_content.json"
if os.path.exists(content_file):
    with open(content_file, "r") as f:
        synthetic_data = json.load(f)
    print(f"  Loaded content from {content_file}")
else:
    print(f"  No content file found at {content_file}")
    # Use circle metadata already fetched from Supabase
    desc = CIRCLE_DESCRIPTION
    cat = CIRCLE_CATEGORY
    if LOCAL_CONTEXT and "circle_metadata" in LOCAL_CONTEXT:
        meta = LOCAL_CONTEXT["circle_metadata"]
        desc = desc or meta.get("description", "")
        cat = cat or meta.get("category", "")
    print(f"  Generating content from circle description...")
    synthetic_data = generate_circle_content(CIRCLE_NAME, desc, cat)

# Map persona IDs to bot user IDs and bot names
persona_to_user_id = {}
persona_to_name = {}
for persona in synthetic_data.get("user_personas", []):
    persona_name = persona["name"]
    if persona_name in bot_ids:
        persona_to_user_id[persona["id"]] = bot_ids[persona_name]
        persona_to_name[persona["id"]] = persona_name

# Track post IDs and timestamps for reply insertion
synthetic_post_ids = {}
post_timestamps = {}  # Maps synthetic post ID to creation timestamp
content_relevance_scores = []  # Track relevance scores for reporting

for post_item in synthetic_data.get("posts", []):
    author_persona = post_item.get("author_id")
    author_id = persona_to_user_id.get(author_persona)

    if not author_id:
        print(f"  SKIP: No user found for persona {author_persona}")
        continue

    # Validate content relevance to circle
    content_text = post_item["content"]
    validation = validate_content_for_circle(content_text, LOCAL_CONTEXT)
    content_relevance_scores.append(validation["score"])

    # Generate realistic timestamp based on bot's personality and schedule
    bot_name = persona_to_name.get(author_persona)
    if bot_name:
        created_at = realistic_post_time(bot_name)
    else:
        # Fallback: parse timestamp from JSON if bot name not found
        created_at_str = post_item.get("created_at")
        created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))

    expires_at = created_at + timedelta(seconds=POST_DURATION_SECONDS)

    # Build post payload — include image_url if present in content JSON
    post_payload = {
        "circle_id": CIRCLE_ID,
        "author_id": author_id,
        "content": post_item["content"],
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "original_duration_seconds": POST_DURATION_SECONDS,
    }
    if post_item.get("image_url"):
        post_payload["image_url"] = post_item["image_url"]

    # Use retry logic for critical post insertion
    result = api_request_with_retry("POST", "/rest/v1/posts", post_payload,
        headers_extra={"Prefer": "return=representation"})

    if result and len(result) > 0:
        post_db_id = result[0]["id"]
        synthetic_post_ids[post_item["id"]] = post_db_id
        post_timestamps[post_item["id"]] = created_at  # Track post timestamp for replies
        print(f"  Posted by {author_persona}: \"{post_item['content'][:50]}...\"")
    else:
        print(f"  FAILED to post: \"{post_item['content'][:50]}...\"")

# Report content relevance statistics
if content_relevance_scores:
    avg_score = sum(content_relevance_scores) / len(content_relevance_scores)
    high_relevance = sum(1 for s in content_relevance_scores if s >= 0.5)
    print(f"\n📊 Content Relevance Report:")
    print(f"  Average relevance score: {avg_score:.2f}")
    print(f"  High relevance posts (≥0.5): {high_relevance}/{len(content_relevance_scores)}")
    if avg_score < 0.3:
        print(f"  ⚠ Low relevance - consider adding more circle-specific content")

# ── Step 5: Insert replies (comments) ────────────────────────────────────

print("\n=== Inserting replies ===")

reply_count = 0
for post_item in synthetic_data.get("posts", []):
    post_synthetic_id = post_item["id"]
    post_db_id = synthetic_post_ids.get(post_synthetic_id)
    post_created_at = post_timestamps.get(post_synthetic_id)

    if not post_db_id or not post_created_at:
        continue

    for comment in post_item.get("comments", []):
        author_persona = comment.get("author_id")
        author_id = persona_to_user_id.get(author_persona)

        if not author_id:
            continue

        # Generate realistic reply timestamp based on bot personality
        bot_name = persona_to_name.get(author_persona)
        if bot_name:
            created_at = realistic_reply_time(bot_name, post_created_at)
        else:
            # Fallback: parse from JSON or random delay
            created_at_str = comment.get("created_at")
            if created_at_str:
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            else:
                created_at = post_created_at + timedelta(minutes=random.randint(5, 60))

        # Use retry logic for critical reply insertion
        result = api_request_with_retry("POST", "/rest/v1/replies", {
            "post_id": post_db_id,
            "author_id": author_id,
            "content": comment["content"],
            "created_at": created_at.isoformat(),
        }, headers_extra={"Prefer": "return=representation"})

        if result and len(result) > 0:
            reply_count += 1
            reply_db_id = result[0]["id"]

            # Add upvotes to this reply using personality-based probabilities
            upvote_target = comment.get("upvote_count", 0)
            if upvote_target > 0:
                bot_id_list = list(bot_ids.values())
                # Create reverse mapping: bot_id -> bot_name for personality lookup
                id_to_name = {bot_id: name for name, bot_id in bot_ids.items()}

                # Use personality-based upvote probabilities
                potential_voters = []
                for bid in bot_id_list:
                    if bid == author_id:
                        continue  # Exclude author

                    # Look up bot's upvote probability
                    bot_name = id_to_name.get(bid, "Unknown")
                    upvote_prob = BOT_ENGAGEMENT_PROFILES.get(bot_name, {}).get("upvote_prob", 0.30)

                    if random.random() < upvote_prob:
                        potential_voters.append(bid)

                # Select voters (up to upvote_target, but can be less based on probabilities)
                voters = potential_voters[:upvote_target] if len(potential_voters) >= upvote_target else potential_voters

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
    # Create reverse mapping: bot_id -> bot_name for personality lookup
    id_to_name = {bot_id: name for name, bot_id in bot_ids.items()}
    upvote_count = 0

    for post in all_posts:
        # Each bot upvotes based on their personality (skip own posts)
        voters = []
        for bid in bot_id_list:
            if bid == post["author_id"]:
                continue  # Don't upvote own posts

            # Look up bot's personality-based upvote probability
            bot_name = id_to_name.get(bid, "Unknown")
            upvote_prob = BOT_ENGAGEMENT_PROFILES.get(bot_name, {}).get("upvote_prob", 0.30)

            # Probabilistically decide to upvote
            if random.random() < upvote_prob:
                voters.append(bid)

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
