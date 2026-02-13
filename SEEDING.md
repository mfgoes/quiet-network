# Circle Seeding Dashboard

A developer tool to populate circles with bot users and realistic content, making the site look active for initial users.

## Setup

### 1. Add Service Role Key

The seeding dashboard requires a Supabase service role key to bypass Row Level Security (RLS).

**Get your service role key:**
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Copy the `service_role` key (keep it secret!)

**Add to your `.env` file:**
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Warning:**
- The service role key bypasses all RLS policies
- Only use this in local development
- Never commit the key to git
- Never deploy with this key in production

### 2. Be an Admin

You must be an admin of at least one circle to use the seeding dashboard.

## Usage

### Access the Dashboard

1. Start your dev server: `npm run dev`
2. Log in to your account
3. Navigate to `/seed` in your browser
4. You'll see all circles where you're an admin

### Quick Seed

The fastest way to populate a circle:

1. Select one or more circles
2. Click **"Quick Seed"**
3. Uses default settings:
   - 10 bot users (or uses existing bots if available)
   - 1 post per bot
   - 0-2 replies per post
   - 30% upvote probability
   - Posts expire in 7 days
   - Posts backdated over last 48 hours

### Custom Seed

For more control:

1. Select circles to seed
2. Choose bot strategy:
   - **Use Existing Bots**: Select from bots already in your database
   - **Create New Bots**: Generate fresh bot users from predefined personas
3. Configure settings:
   - **Posts per bot**: How many posts each bot creates (1-5)
   - **Replies per post**: Min and max replies (0-5)
   - **Upvote probability**: Chance each bot upvotes a post (0-100%)
   - **Post duration**: How long posts live (48h, 7d, or 30d)
   - **Time distribution**: When posts were created
     - Last 48 hours (recent activity)
     - Last 7 days (moderate history)
     - Random (scattered over 30 days)
   - **Content category**: Type of posts to create
     - All Categories (mixed content)
     - General (neighborhood questions)
     - Coffee & Food (local spots)
     - Local Events (community happenings)
     - Questions (engagement prompts)
     - Recommendations (local tips)
     - Community Issues (civic discussions)
     - Lost & Found
     - Weather & Nature
4. Preview sample posts
5. Click **"Custom Seed"**

## Bot Users

The seeding system includes 10 predefined bot personas:

- 👩‍🍳 **Emma** - Local baker and coffee enthusiast
- 🚴 **Marco** - Bike mechanic and sustainability advocate
- 🎨 **Sofia** - Freelance illustrator and gallery curator
- 👨‍🏫 **Liam** - High school history teacher
- 🌱 **Nina** - Urban gardener and farmers market regular
- 💻 **Alex** - Software developer and tech meetup organizer
- 🎵 **Maya** - Jazz pianist and music teacher
- 👨‍🍳 **Oliver** - Restaurant owner and food blogger
- 🏃‍♀️ **Zara** - Marathon runner and fitness coach
- 📷 **Theo** - Street photographer and visual storyteller

## Cleanup

To remove bot content from a circle:

1. Find the circle card
2. Click the **"Cleanup"** button
3. Confirm the action

This will:
- Remove all bot users from the circle
- Delete all posts created by bots (cascade delete handles replies and upvotes)
- Not delete the bot user accounts themselves (they can be reused)

## Features

### Realistic Content

Posts and replies are crafted to look like real community conversations:
- Context-appropriate topics
- Natural conversation flow
- Varied content types (questions, recommendations, events, etc.)
- Realistic timestamps with proper ordering

### Progress Tracking

Watch real-time progress as content is created:
- Bot user creation
- Post seeding
- Reply generation
- Upvote distribution

### Stats Dashboard

Each circle card shows:
- 🤖 Number of bot members
- 💬 Number of posts
- ↩️ Number of replies

### Multi-Circle Support

Seed multiple circles at once:
- Select multiple circles
- Same configuration applies to all
- Progress tracked per circle

## Technical Details

### Architecture

- **Frontend**: React with TypeScript
- **Backend**: Direct Supabase API calls with service role key
- **Execution**: Browser-based (no server-side processing needed)
- **Templates**: 40+ post templates across 8 categories

### Database Operations

The seeding system performs these operations:

1. **Create bot users** (if needed):
   - Insert auth user via `/auth/v1/admin/users`
   - Update profile with bot data (`is_bot = true`)

2. **Add bots to circles**:
   - Insert into `circle_members` with `role = 'member'`
   - Handles duplicates gracefully

3. **Create posts**:
   - Random author assignment
   - Backdated timestamps based on distribution
   - Calculated expiration dates

4. **Create replies**:
   - Match post templates
   - Random reply count within range
   - 5-30 minute delay after parent post
   - Different author than post creator

5. **Create upvotes**:
   - Probability-based generation
   - Skip post authors (can't upvote own posts)
   - Handle duplicate constraints

### Security Considerations

**Why service role key?**
- Bot creation requires admin auth API access
- Bypassing RLS is intentional for seeding
- Backdating timestamps requires bypassing default `created_at`

**Mitigation strategies:**
- Environment variable only (not in code)
- Warning banner in UI
- Developer-only feature
- Clear documentation

**Production alternatives:**
- Run Python script directly on server
- Use Supabase Edge Function with service role
- Admin SDK in secure backend

## Troubleshooting

### "Service Role Key Required" Warning

**Problem**: Service key not configured

**Solution**: Add `VITE_SUPABASE_SERVICE_ROLE_KEY` to your `.env` file

### "No admin circles" Message

**Problem**: You're not an admin of any circles

**Solution**:
1. Create a new circle (you become admin automatically)
2. Or have another admin promote you

### "Please select at least one bot" Error

**Problem**: No bots selected and "Use Existing Bots" mode is active

**Solution**:
- Select some existing bots, or
- Switch to "Create New Bots" mode

### "Seeding failed: RLS" Error

**Problem**: Service role key is invalid or missing

**Solution**: Double-check your service role key in `.env`

### Posts Not Appearing

**Problem**: Posts may have already expired

**Solution**: Check post duration setting - use longer durations for testing

## Examples

### Scenario 1: New Circle

You just created a circle and want to make it look active:

1. Navigate to `/seed`
2. Select your new circle
3. Click "Quick Seed"
4. Done! Your circle now has 10 bots with posts, replies, and upvotes

### Scenario 2: Multiple Circles

You want to populate all your test circles:

1. Select all circles (shift-click or click each one)
2. Configure custom settings (e.g., 2 posts per bot, more replies)
3. Select "Coffee & Food" category for a café-focused circle
4. Click "Custom Seed"
5. All circles seeded with the same configuration

### Scenario 3: Testing Upvote Logic

You want to test how upvote counts display:

1. Select a circle
2. Set upvote probability to 80%
3. Create 5 posts per bot
4. Watch posts get lots of engagement

### Scenario 4: Cleaning Up

After testing, you want to remove all bot content:

1. Find the circle card
2. Note the bot/post/reply counts
3. Click "Cleanup"
4. Confirm
5. Circle is now clean

## Tips

- **Start small**: Test with 1-2 bots first to verify behavior
- **Mix categories**: Use "All Categories" for diverse content
- **Adjust timing**: Recent posts (last-48h) look more active
- **Reuse bots**: Existing bots can be added to multiple circles
- **Check stats**: View bot counts before/after to verify success
- **Test cleanup**: Practice cleanup on test circles before production

## Limitations

- Maximum 10 new bots per seed (uses predefined personas)
- No AI-generated content (uses templates)
- Bot interactions are one-time (no ongoing simulation)
- Service key required (developer tool only)
- English content only (templates not localized)

## Future Enhancements

Ideas for extending the seeding system:

- **AI-generated content**: Use LLM for realistic, varied posts
- **Scheduled seeding**: Auto-seed new circles on creation
- **Presets**: Save/load common configurations
- **Multi-language**: Seed content in different languages
- **Engagement simulation**: Bots interact over time
- **Analytics**: Track which configs lead to better real engagement
- **Template library**: Community-contributed post templates
- **Smart timing**: Post at realistic times (mornings, evenings)
- **Bot personalities**: Different posting patterns per bot type
- **Content variety**: Mix text, questions, events, recommendations

## Contributing

Want to add more bot personas or post templates?

1. Edit `src/lib/seeding/bot-users.ts` to add bots
2. Edit `src/lib/seeding/post-templates.ts` to add templates
3. Follow existing format for consistency
4. Test with "Quick Seed" to verify
5. Submit a PR!
