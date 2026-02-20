# Synthetic Content Guide

Instructions for creating natural-sounding `synthetic_content.json` files for circle seeding. Use this as a prompt reference when asking an LLM to generate or rewrite content.

---

## File location

Each circle's content lives at:
```
bots/circles/{circle_slug}/synthetic_content.json
```
Where `circle_slug` is the lowercase, underscore-separated circle name (e.g. `haarlem`, `jakarta`).

---

## JSON structure

```jsonc
{
  "metadata": { ... },
  "user_personas": [ ... ],   // 10 bot personas
  "posts": [ ... ]            // array of post objects
}
```

### Post object

```jsonc
{
  "id": "post_001",
  "author_id": "emma",              // persona id (lowercase)
  "content": "Post text here",
  "image_url": "/images/placeholder_posts/cafe.jpg",  // optional
  "duration_seconds": 172800,       // optional — 48h, 604800 (7d), or 2592000 (30d)
  "permanent": true,                // optional — never expires, shows "Permanent" badge
  "created_at": "2026-02-10T08:15:00Z",
  "upvote_count": 12,
  "comments": [ ... ]
}
```

### Comment object

```jsonc
{
  "id": "comment_001_01",
  "author_id": "carla",
  "content": "Reply text here",
  "created_at": "2026-02-10T08:47:00Z",
  "upvote_count": 3
}
```

---

## The 10 bot personas

Every circle uses the same 10 accounts. Adapt their traits to fit the circle's location and theme, but keep the core personality consistent:

| ID | Core personality | Engagement style |
|---|---|---|
| **alice** | Parent, practical, community helper | Moderate — helpful answers, family angle |
| **bob** | Outdoorsy, tech-savvy, active | Active — shares tips, cycling/sports |
| **carla** | Foodie, social organiser, warm | Very active — organises things, lots of emoji |
| **daniel** | History buff, thoughtful, detail-oriented | Selective — longer posts, cultural depth |
| **emma** | Freelancer, coffee lover, creative | Active — cafe/workspace reviews, creative |
| **frank** | Business owner, practical, community-focused | Moderate — local knowledge, practical PSAs |
| **greta** | Nature lover, photographer, calm | Moderate — scenic posts, environmental topics |
| **henk** | Long-time resident, honest, occasional complainer | Low — blunt opinions, but helpful when asked |
| **iris** | Young professional, social, event-goer | Active — events, nightlife, new openings |
| **jack** | Newcomer/expat, curious, friendly | Active — asks questions, grateful for answers |

### Persona rules

- **Jack always asks questions** — he's new and discovering the area. Other personas answer him.
- **Henk complains but helps** — he'll grumble about change but still give useful local knowledge.
- **Carla organises** — she's the one suggesting meetups, sharing food spots, using emoji.
- **Daniel goes deep** — his posts have historical or cultural substance, not surface-level.
- **Don't make everyone enthusiastic** — henk is dry, daniel is measured, frank is matter-of-fact.

---

## Writing natural content

### What makes a post feel real

- **First-person experience**: "Just tried..." / "Took it this morning..." / "Went there yesterday..."
- **Hedging and uncertainty**: "Not sure if..." / "I think..." / "Might just be me but..."
- **Casual tone**: contractions, sentence fragments, lowercase starts for comments
- **Specific details**: name actual streets, businesses, landmarks — vague posts feel fake
- **Imperfect formatting**: not every sentence needs to be grammatically perfect. People type fast.
- **Local language mixed in**: use local phrases naturally (Dutch: "bedankt", "gezellig", "lekker"; Indonesian: "macet", "warung", "ojek")

### What to avoid

- **Marketing speak**: "Amazing hidden gem you MUST visit!" — nobody talks like this to neighbours
- **Uniform enthusiasm**: not every post should be positive. Include mild complaints, honest "meh" opinions, practical warnings
- **Identical sentence structure**: vary between questions, statements, tips, observations, complaints
- **Everyone commenting on everything**: some posts get 5 comments, some get 2. Some get none. That's fine.
- **Generic filler replies**: avoid "Great post!", "Thanks for sharing!", "Love this!" as standalone comments. If someone says thanks, they should add something ("Thanks! I'll check it out tomorrow morning")
- **Perfect punctuation in comments**: real replies often skip periods, use lowercase, trail off with "..."

### Post types that work well

| Type | Example feel | Good for |
|---|---|---|
| **Observation** | "Anyone else noticed that [X] changed?" | emma, greta, henk |
| **Recommendation** | "Just tried [X] and wow..." | carla, bob, frank |
| **Question** | "Is it normal for [X]?" / "Where do people [X]?" | jack, iris, alice |
| **PSA / Warning** | "Heads up: construction on [X] starts Monday" | frank, bob |
| **Nostalgia / Opinion** | "Remember when [X]? Now it's [Y]..." | henk, daniel |
| **Event / Meetup** | "Anyone going to [X] this Friday?" | iris, carla |
| **Photo moment** | "Beautiful morning at [X]..." (with image_url) | greta, emma |
| **History / Culture** | "Random fact: [X] was built in..." | daniel |

---

## Media: images, YouTube, maps

### Images

Use existing placeholder images from `/public/images/placeholder_posts/`. Reference them with a relative path — no need to upload or duplicate:

```json
"image_url": "/images/placeholder_posts/cafe.jpg"
```

Available images:
- `cafe.jpg` — coffee/indoor cafe
- `park.jpg` — green outdoor/nature
- `street_city.jpg` — urban/street scene
- `snack.png` — food close-up
- `playground1.jpg` — playground/kids
- `movie_screenshot.jpg` — screen/movie
- `anime_screenshot.webp` — anime/pop culture

Use images sparingly — roughly 20-30% of posts. Not every post needs a photo.

### YouTube links

Embed a YouTube URL on its own line at the end of the post content. The app auto-renders it as a rich embed:

```json
"content": "Post text here.\n\nhttps://www.youtube.com/watch?v=XXXXXXXXXXX"
```

Use real, relevant YouTube videos (walking tours, local music, cultural content). Don't overdo it — 2-4 per circle of ~20 posts.

### Google Maps links

Same as YouTube — place the maps URL on its own line. The app renders an embedded map preview:

```json
"content": "Discovered this amazing spot yesterday.\n\nhttps://www.google.com/maps/search/?api=1&query=Place+Name+City"
```

Check `circles/{slug}/haarlem-locations-maps.txt` (or similar) for pre-curated location URLs if available.

---

## Engagement numbers

### Upvote distribution (power law)

Don't give every post 10 upvotes. Use a realistic spread:

- **Most posts**: 5-12 upvotes
- **Popular posts** (food recs, scenic photos, useful PSAs): 15-21
- **Low engagement** (niche questions, observations): 3-7
- **Comments**: top-level replies get 2-6, deeper replies get 0-3

### Comment count distribution

- 2-3 comments: most posts
- 4-5 comments: popular or social posts (meetup planning, food recs)
- 0-1 comments: occasional — PSAs that just get upvoted, niche posts
- Never give every post the same number of comments

### Comment thread flow

Natural threads follow patterns:
1. **Question → Answer → Thanks**: jack asks, henk answers, jack says thanks + adds detail
2. **Recommendation → Follow-up → More options**: carla recommends, iris asks about it, emma adds an alternative
3. **Observation → Agreement → Tangent**: greta notices something, alice agrees from different angle, bob adds related tip
4. **Complaint → Context → Practical advice**: henk complains, frank explains why, alice offers workaround

---

## Post duration (`duration_seconds`)

Posts in Quiet Network expire after a set duration, showing countdown badges like "6d left" or "expires in 3h". You can control this per post with an optional `duration_seconds` field:

```jsonc
{
  "id": "post_010",
  "author_id": "frank",
  "content": "PSA: Construction starts Monday...",
  "duration_seconds": 172800,   // 48 hours — short-lived PSA
  "created_at": "2026-02-02T10:20:00Z",
  ...
}
```

### Available durations

| Value | Label | Good for |
|---|---|---|
| `172800` | 48 hours | Time-sensitive PSAs, event reminders, weather alerts |
| `604800` | 7 days | Default — most posts (questions, recommendations, observations) |
| `2592000` | 30 days | Evergreen content (meetup planning, cultural tips, guides) |

### Permanent posts

Posts can also be marked as permanent — they never expire and show a "Permanent" badge instead of a countdown. Use this for cornerstone content that should always be visible:

```jsonc
{
  "id": "post_001",
  "author_id": "jack",
  "content": "Welcome thread with beginner advice...",
  "permanent": true,    // never expires, shows "Permanent" badge
  "created_at": "2026-02-01T09:30:00Z",
  ...
}
```

Good candidates for permanent posts:
- Welcome/intro threads with lots of helpful replies
- Curated resource lists or book recommendations
- Classic discussion threads that define the circle's vibe
- Evergreen reference posts (FAQs, guides)

Use sparingly — 2-3 per circle at most. Most posts should still be ephemeral.

### How it works in the seeding pipeline

- **If `duration_seconds` is set** in the JSON, the seeder uses that exact value.
- **If omitted**, the seeder randomly picks from the three options above, weighted 20% / 60% / 20% (toward 7 days).
- The seeder also shifts 2-3 of the oldest posts so they expire within 1-24 hours of seeding. This ensures the feed immediately shows amber "expires soon" badges for visual variety.

### Tips

- Add explicit `duration_seconds` to 4-5 posts per circle for variety. The rest will get random durations automatically.
- Use 48h for posts that feel ephemeral (warnings, urgent questions).
- Use 30d for posts with lasting value (meetup threads, cultural guides, evergreen recommendations).

---

## Timestamps and date handling

### How the seeder uses timestamps

When content comes from a curated `synthetic_content.json` file, the seeder preserves the **relative spacing** between posts but shifts the entire date range so the newest post is anchored to "now". For example, if your JSON spans Feb 1-11 and seeding runs on Feb 20, all timestamps shift forward by ~9 days.

This means you should focus on realistic **relative timing** between posts (spread across 10-14 days), not on absolute dates. The seeder handles the rest.

For auto-generated content (circles without a content file), timestamps are generated from each bot's personality schedule instead.

### Timestamp guidelines

- Spread posts across 10-14 days to look organic
- Morning posts (7-10am): emma, alice, greta, daniel
- Midday posts (11am-2pm): bob, carla, frank
- Evening posts (5-9pm): iris, jack, henk, frank
- Comments arrive 30 minutes to 24 hours after the post — not instantly
- Later comments can come the next day (someone seeing it in the morning)

---

## Adapting to a new circle

When creating content for a new circle:

1. **Research the location** — find real street names, businesses, landmarks, local slang
2. **Adapt persona traits** — same personality, local flavour. Bob is still outdoorsy, but in Jakarta he's cycling through traffic; in Haarlem he's on bike paths.
3. **Mix universal + specific** — a few posts work anywhere (meetup planning, community appreciation). Most should reference specific local things.
4. **Include a `local_context.json`** if possible — helps `seed_bots.py` validate content relevance
5. **Include a locations/maps file** (e.g. `{slug}-locations-maps.txt`) for Google Maps embeds

---

## LLM prompt template

When asking an LLM to generate or rewrite content, use something like:

> You are writing synthetic social media posts for a local community app called Quiet Network. The circle is for **[CITY/AREA]**.
>
> Write posts as 10 different personas (alice, bob, carla, daniel, emma, frank, greta, henk, iris, jack) — each with a distinct voice and personality described above.
>
> Rules:
> - Write like real people chatting with neighbours, not marketing copy
> - Reference specific real places, streets, and businesses in [CITY/AREA]
> - Mix post types: questions, recommendations, observations, warnings, meetup proposals
> - Vary engagement: not every post is popular, not every post gets many comments
> - Include 4-5 posts with `image_url` using available placeholder images
> - Include 2-3 posts with a YouTube link (real relevant video) on its own line
> - Include 3-4 posts with a Google Maps link to a real local place
> - Use local language/slang naturally mixed with English
> - Output valid JSON matching the synthetic_content.json schema
>
> Available images: cafe.jpg, park.jpg, street_city.jpg, snack.png, playground1.jpg, movie_screenshot.jpg, anime_screenshot.webp
>
> See existing examples in bots/circles/haarlem/ and bots/circles/jakarta/ for reference.
