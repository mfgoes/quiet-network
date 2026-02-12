# Quiet Network Bot System

> ⚠️ **Security Notice**: This Python implementation contains hardcoded service role keys in `seed_bots.py`.
> This is a security risk if accidentally committed to a public repository.
> A TypeScript migration is planned to use environment variables exclusively.
> See main README roadmap for details.

---

Automated content generation and seeding for Quiet Network circles using AI-generated personas.

## Quick Start

### Prerequisites

1. **Python 3.8+** installed
2. **Supabase project** with service role key
3. **Circle ID** for your target circle (e.g., Haarlem)

### Setup

1. **Install dependencies**

   ```bash
   cd bots
   pip install -r requirements.txt
   ```

2. **Configure environment variables**

   Edit `circles/shared/.env` with your Supabase credentials:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key-here
   ```

3. **Update seed_bots.py configuration**

   Open `seed_bots.py` and update:
   ```python
   SUPABASE_URL = "your-url"
   SERVICE_ROLE_KEY = "your-key"
   CIRCLE_ID = "your-circle-id"
   ```

### Option 1: Use the Dashboard (Recommended)

**Windows:**
```bash
cd bots
start-dashboard.bat
```

**Mac/Linux:**
```bash
cd bots
python server.py
```

The dashboard will open automatically at `http://localhost:5000` where you can:
- View bot configuration status
- Run the seeding script with one click
- Preview posts before seeding
- Monitor console output in real-time

### Option 2: Command Line

### Running the Bot

**Important**: `seed_bots.py` currently uses `circles/haarlem/posts.json` (simple format with 8 posts). The newly generated `synthetic_content.json` contains 18 posts with 47 comments in a more detailed format.

#### Quick Start

```bash
cd bots
python seed_bots.py
```

This will:
- Create 10 bot users (Alice, Bob, Carla, Daniel, Emma, Frank, Greta, Henk, Iris, Jack)
- Set up their profiles with bios and emojis
- Add them to your circle
- Post content from `circles/haarlem/posts.json`
- Add realistic upvotes (30% probability per bot per post)

#### Using the Enhanced Synthetic Content

The `synthetic_content.json` file contains richer, AI-generated content with:
- 18 posts (vs 8 in posts.json)
- 47 threaded comments
- Realistic timestamps spread over 11 days
- Power law upvote distribution
- Mix of English and Dutch

**To use it**: You'll need to adapt `seed_bots.py` to parse the new format, or convert it to match the simpler posts.json structure.

#### Custom Content

To create your own posts, edit `circles/haarlem/posts.json`:

```json
[
  {
    "post": "Your post text here",
    "replies": ["Reply 1", "Reply 2"]
  }
]
```

## Project Structure

```
bots/
├── README.md                      # This file - setup and usage guide
├── requirements.txt               # Python dependencies (Flask, Flask-CORS)
├── seed_bots.py                   # Main seeding script (uses posts.json)
├── server.py                      # Flask server for web dashboard
├── dashboard.html                 # Web dashboard UI
├── start-dashboard.bat            # Windows launcher for dashboard
└── circles/
    ├── haarlem/                   # Haarlem circle data
    │   ├── config.py              # Circle configuration
    │   ├── posts.json             # Simple format posts (8 posts) - currently used
    │   └── synthetic_content.json # AI-generated content (18 posts, 47 comments, 156 upvotes)
    └── shared/                    # Shared resources
        ├── .env                   # Supabase credentials (gitignored)
        ├── bot_users.py           # Bot persona definitions
        └── generate_posts.py      # Post generation utilities
```

**Note**: `venv/` and `__pycache__/` directories are gitignored.

## Bot Personas

The system includes 10 unique bot personas:

| Name   | Emoji | Personality                                          |
|--------|-------|------------------------------------------------------|
| Alice  | woman | Coffee enthusiast, cyclist, photographer             |
| Bob    | fox   | Foodie, market fan, explores hidden gems             |
| Carla  | cat   | Art lover, museum-goer                               |
| Daniel | man   | History buff, dog owner                              |
| Emma   | bubu  | Design student, coffee shop regular                  |
| Frank  | jjk   | Weekend cyclist, music fan                           |
| Greta  | hills | Baker, volunteer, canal walker                       |
| Henk   | roof  | Tech enthusiast, café photographer                   |
| Iris   | house | Nature lover, dune hiker                             |
| Jack   | fox   | Sports fan, local history nerd                       |

## Content Features

The AI-generated content includes:

- **18 diverse posts** covering:
  - Coffee shops and cafés
  - Cycling routes
  - Local markets
  - Museums and culture
  - Food recommendations
  - Parks and nature
  - Events and meetups
  - Practical tips (construction, weather)
  - Hidden gems

- **47 authentic comments** with:
  - Natural conversation flow
  - Questions and answers
  - Personal recommendations
  - Community building

- **156 upvotes** distributed realistically using power law distribution

- **Multilingual content**: English with Dutch phrases for authenticity

## Supabase Access Rights & Configuration

### Required Permissions

The bot system uses the **service role key** to bypass Row Level Security (RLS) policies. This is necessary to:
- Create auth users programmatically
- Insert posts and comments on behalf of bots
- Add upvotes without user authentication

### RLS Policies to Configure

For the bot system to work properly, ensure these Supabase policies are in place:

#### 1. Profiles Table

```sql
-- Allow service role to insert/update profiles
CREATE POLICY "Service role can manage profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 2. Circle Members Table

```sql
-- Allow service role to add members to circles
CREATE POLICY "Service role can manage circle members"
ON circle_members FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 3. Posts Table

```sql
-- Allow service role to create posts
CREATE POLICY "Service role can manage posts"
ON posts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 4. Post Upvotes Table

```sql
-- Allow service role to manage upvotes
CREATE POLICY "Service role can manage upvotes"
ON post_upvotes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Checking Circles in Supabase

To find your Circle ID:

1. **Via Dashboard**: Use the bot dashboard's "Refresh Circles" button
2. **Via Supabase Dashboard**:
   - Go to Table Editor → `circles`
   - Copy the `id` (UUID) of your target circle
3. **Via SQL**:
   ```sql
   SELECT id, name, description FROM circles;
   ```

### Security Considerations

- **Never commit** your `SERVICE_ROLE_KEY` to git
- Store it only in `seed_bots.py` (gitignored) or environment variables
- The service role key has **full database access** - use with caution
- Consider creating a separate "bot admin" role with limited permissions for production use

## Safety & Best Practices

1. **Test first**: Run with a small subset before full deployment
2. **Review content**: Check `synthetic_content.json` before posting
3. **Rate limiting**: The script doesn't add delays - monitor your Supabase usage
4. **Service role key**: Keep it secret, never commit to git
5. **Circle IDs**: Verify you're posting to the correct circle

## Troubleshooting

### "Bot users already exist"
- The script will skip creation and try to find existing bot profiles
- This is normal on subsequent runs

### "Posts not appearing"
- Check `expires_at` timestamps (posts expire after 7 days by default)
- Verify circle membership of bots
- Check Supabase RLS policies

### "Authentication errors"
- Verify `SERVICE_ROLE_KEY` in `seed_bots.py`
- Ensure service role key has necessary permissions

### "Wrong circle"
- Double-check `CIRCLE_ID` matches your target circle
- Use Supabase dashboard to find correct circle UUID

## Customization

### Adding New Personas

Edit `circles/shared/bot_users.py` and `seed_bots.py`:

```python
{
    "name": "NewBot",
    "bio": "Description here",
    "emoji": "emoji_name",
}
```

### Changing Post Duration

In `seed_bots.py`:

```python
POST_DURATION_SECONDS = 14 * 24 * 3600  # 14 days instead of 7
```

### Creating New Circles

1. Create a new folder: `circles/your-circle/`
2. Add `config.py` and `posts.json`
3. Update `CIRCLE_ID` in `seed_bots.py`

## Future Enhancements

Ideas for extending the bot system:

- Web dashboard for managing bots (see stashed changes)
- Scheduled posting with cron jobs
- Ollama integration for real-time content generation
- Comment generation for existing posts
- Upvote patterns based on time of day
- Bot interaction (bots replying to each other)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase logs for API errors
- Verify all configuration values are correct

---

**Note**: This bot system is designed for initial content seeding and testing. For production use, consider implementing rate limiting and content moderation.
