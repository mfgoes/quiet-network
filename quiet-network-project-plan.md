# Quiet Network — Project Plan

> A hyperlocal, ephemeral community platform. "The anti-Nextdoor."

**Target**: Q4 2026 beta launch (Haarlem pilot)
**Timeline**: 7 weeks to functional MVP
**Builder**: Mischa van der Goes

---

## Concept Summary

Quiet Network fills the gap between:
- **Jodel** (hyperlocal but shallow, student-focused, permanent)
- **Lemmy/Reddit** (topic-focused but global, terrible UX, permanent)
- **Nextdoor** (hyperlocal but real-names, drama-filled, privacy nightmare)

**Core differentiators**:
1. Ephemeral by default — posts fade and disappear after 48h
2. Pseudonymous identity — persistent display names, no real-name requirement
3. Hyperlocal circles — geo-based communities (Haarlem, Amsterdam-West, etc.)
4. Topic tags — lightweight categorization without full subreddit complexity
5. Privacy-first — EU-hosted, no ads, no data selling
6. Calm UX — no follower counts, no karma scores, no gamification## 1. Concept Summary
Quiet Network fills the gap between high-noise platforms like Nextdoor and shallow, permanent ones like Jodel.

### Key UX Updates
* **Variable Ephemerality:** Instead of a hard 48h limit, authors now choose the "breath" of their post:
    * **48 Hours:** Quick questions or "now" sightings.
    * **7 Days:** Local events, news, or lost & found.
    * **30 Days:** Community initiatives or monthly meetups.
* **The "Welcome Mat":** Every circle features a pinned, permanent "Welcome" post to ensure the feed never feels like an "empty wasteland" during the Haarlem pilot.
* **Post Prompts:** The composer includes a "spark" feature that suggests local topics to lower the barrier to posting.

---

## 2. Technical Stack
* **Framework:** React 18+ TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **UI Components:** shadcn/ui
* **Backend:** Supabase (Auth + Postgres + Realtime)
* **Hosting:** Vercel

---

## 3. Database & Logic Updates
* **Posts Table:** The `expires_at` column is now dynamic. The frontend sends a timestamp based on the user's slider selection (Current Time + 48h/7d/30d).
* **Decay Logic:** Visual opacity in the UI is calculated as a percentage: `(Time Remaining / Total Duration)`. A post with 1 hour left looks the same whether it started as a 48h or 30d post.

---

## 4. Revised 7-Week Roadmap
* **Weeks 1-2:** Foundation & Auth. Setting up the Haarlem and Amsterdam-West circles.
* **Week 3:** Feed & Composer. **NEW:** Build the duration slider and the "Post Ideas" lightbulb.
* **Week 4:** Visual Decay. **NEW:** Implement the variable-duration fading logic.
* **Week 5:** Mobile Polishing. Ensuring the "Quiet" experience feels great on a phone.
* **Week 6:** Haarlem Beta. Recruiting 20-30 residents to seed the first "sparks."
* **Week 7:** Soft Launch & Refinement.

### Why This Stack
- **All free-tier friendly** until you have real traction
- **Claude Code fluent** in every part of this stack
- **Supabase EU region** (Frankfurt) for GDPR compliance
- **Type safety** catches bugs early, helps Claude Code write better code
- **shadcn/ui** = beautiful defaults without learning a component framework

---

## Database Schema

```sql
-- ============================================
-- CIRCLES (manually seeded, geo-based communities)
-- ============================================
create table circles (
	id uuid primary key default gen_random_uuid(),
	name text not null,                    -- "Haarlem", "Amsterdam-West"
	region text not null,                  -- "North Holland", "Utrecht"
	description text,
	created_at timestamptz default now()
);

-- Seed initial circles
insert into circles (name, region, description) values
	('Haarlem', 'North Holland', 'Haarlem city center and surroundings'),
	('Amsterdam-West', 'North Holland', 'West side of Amsterdam'),
	('Amsterdam-Zuid', 'North Holland', 'South Amsterdam including De Pijp'),
	('Leiden', 'South Holland', 'Leiden city and university area');

-- ============================================
-- PROFILES (user identity, linked to Supabase auth)
-- ============================================
create table profiles (
	id uuid primary key references auth.users on delete cascade,
	display_name text not null,
	avatar_url text,
	bio text,
	circle_id uuid references circles not null,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Auto-create profile on signup (trigger)
create or replace function handle_new_user()
returns trigger as $$
begin
	insert into public.profiles (id, display_name, circle_id)
	values (
		new.id,
		coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'),
		coalesce(
			(new.raw_user_meta_data->>'circle_id')::uuid,
			(select id from circles where name = 'Haarlem' limit 1)
		)
	);
	return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function handle_new_user();

-- ============================================
-- POSTS (ephemeral content)
-- ============================================
create table posts (
	id uuid primary key default gen_random_uuid(),
	author_id uuid references profiles on delete cascade not null,
	circle_id uuid references circles on delete cascade not null,
	content text not null check (char_length(content) <= 500),
	tags text[] default '{}',
	upvote_count int default 0,
	created_at timestamptz default now(),
	expires_at timestamptz default (now() + interval '48 hours')
);

-- Index for feed queries
create index posts_circle_created_idx on posts (circle_id, created_at desc);
create index posts_expires_idx on posts (expires_at);

-- ============================================
-- UPVOTES (one per user per post)
-- ============================================
create table upvotes (
	user_id uuid references profiles on delete cascade,
	post_id uuid references posts on delete cascade,
	created_at timestamptz default now(),
	primary key (user_id, post_id)
);

-- Function to increment/decrement upvote count
create or replace function handle_upvote()
returns trigger as $$
begin
	if TG_OP = 'INSERT' then
		update posts set upvote_count = upvote_count + 1 where id = NEW.post_id;
		return NEW;
	elsif TG_OP = 'DELETE' then
		update posts set upvote_count = upvote_count - 1 where id = OLD.post_id;
		return OLD;
	end if;
end;
$$ language plpgsql security definer;

create trigger on_upvote_change
	after insert or delete on upvotes
	for each row execute function handle_upvote();

-- ============================================
-- REPORTS (basic moderation)
-- ============================================
create table reports (
	id uuid primary key default gen_random_uuid(),
	reporter_id uuid references profiles on delete set null,
	post_id uuid references posts on delete cascade not null,
	reason text not null,
	status text default 'pending' check (status in ('pending', 'reviewed', 'actioned')),
	created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table posts enable row level security;
alter table upvotes enable row level security;
alter table reports enable row level security;
alter table circles enable row level security;

-- Circles: anyone can read
create policy "Circles are viewable by everyone"
	on circles for select using (true);

-- Profiles: anyone can read, users can update own
create policy "Profiles are viewable by everyone"
	on profiles for select using (true);

create policy "Users can update own profile"
	on profiles for update using (auth.uid() = id);

-- Posts: users in same circle can read, authors can insert/delete own
create policy "Posts visible to circle members"
	on posts for select using (
		circle_id in (select circle_id from profiles where id = auth.uid())
	);

create policy "Users can create posts in their circle"
	on posts for insert with check (
		auth.uid() = author_id
		and circle_id = (select circle_id from profiles where id = auth.uid())
	);

create policy "Users can delete own posts"
	on posts for delete using (auth.uid() = author_id);

-- Upvotes: users can manage their own
create policy "Users can view all upvotes"
	on upvotes for select using (true);

create policy "Users can upvote"
	on upvotes for insert with check (auth.uid() = user_id);

create policy "Users can remove own upvote"
	on upvotes for delete using (auth.uid() = user_id);

-- Reports: users can create, only admins can view (skip admin for MVP)
create policy "Users can report posts"
	on reports for insert with check (auth.uid() = reporter_id);

-- ============================================
-- CLEANUP FUNCTION (run via cron/edge function)
-- ============================================
create or replace function delete_expired_posts()
returns void as $$
begin
	delete from posts where expires_at < now();
end;
$$ language plpgsql security definer;
```

---

## Project Structure

```
quiet-network/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   └── dialog.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx      # mobile nav
│   │   │   └── PageContainer.tsx
│   │   ├── feed/
│   │   │   ├── Feed.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostDecay.tsx      # opacity based on time remaining
│   │   │   └── TagFilter.tsx
│   │   ├── post/
│   │   │   ├── PostComposer.tsx
│   │   │   └── ReportDialog.tsx
│   │   ├── profile/
│   │   │   ├── ProfileSetup.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   └── CircleSelector.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── AuthGuard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── usePosts.ts
│   │   ├── useUpvote.ts
│   │   └── useCircles.ts
│   ├── lib/
│   │   ├── supabase.ts            # client initialization
│   │   ├── utils.ts               # cn() helper, date formatting
│   │   └── constants.ts           # app config
│   ├── pages/
│   │   ├── HomePage.tsx           # feed view
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/
│   │   └── database.ts            # generated Supabase types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Tailwind imports
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
├── public/
│   └── favicon.svg
├── .env.local                     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## Week-by-Week Plan

### Week 1: Foundation
**Goal**: Auth working, basic routing, deploy pipeline

**Tasks**:
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui (button, input, card)
- [ ] Create Supabase project (Frankfurt region)
- [ ] Set up environment variables
- [ ] Implement Supabase auth (magic link email)
- [ ] Create basic routing (react-router-dom)
- [ ] Build LoginPage and SignupPage
- [ ] Deploy to Vercel (connect Git repo)
- [ ] Test auth flow end-to-end

**Claude Code prompts**:
```
"Set up a new Vite project with React, TypeScript, and Tailwind CSS"
"Add Supabase client configuration with environment variables"
"Create a useAuth hook that handles login, logout, and session state with Supabase"
"Build a LoginPage component with magic link email authentication"
```

---

### Week 2: Profile & Circles
**Goal**: Users can create profile, select circle

**Tasks**:
- [ ] Run database migration (circles, profiles tables)
- [ ] Seed initial circles (Haarlem, Amsterdam-West, etc.)
- [ ] Generate TypeScript types from Supabase
- [ ] Build ProfileSetup component (display name, avatar, bio)
- [ ] Build CircleSelector component (dropdown of available circles)
- [ ] Create useProfile hook (fetch, update)
- [ ] Create useCircles hook (list all circles)
- [ ] Add AuthGuard to redirect unauthenticated users
- [ ] Add onboarding flow (signup → profile setup → feed)

**Claude Code prompts**:
```
"Create a ProfileSetup form component with display_name, avatar upload, and bio fields"
"Build a CircleSelector dropdown that fetches circles from Supabase"
"Add a useProfile hook that fetches and updates the current user's profile"
```

---

### Week 3: Feed & Posts
**Goal**: Core loop working — view feed, create posts, upvote

**Tasks**:
- [ ] Run posts, upvotes migration
- [ ] Build Feed component (list of PostCards)
- [ ] Build PostCard component (content, author, upvotes, time)
- [ ] Build PostComposer component (textarea, tag input, submit)
- [ ] Create usePosts hook (fetch posts for circle, create post)
- [ ] Create useUpvote hook (toggle upvote)
- [ ] Add pull-to-refresh or manual refresh button
- [ ] Display relative timestamps ("2h ago")

**Claude Code prompts**:
```
"Create a Feed component that fetches and displays posts from the user's circle"
"Build a PostCard component showing content, author display name, upvote count, and relative time"
"Create a PostComposer with a 500-character limit textarea and tag input"
"Add a useUpvote hook that toggles upvotes and updates the UI optimistically"
```

---

### Week 4: Ephemeral Decay & Tags
**Goal**: Posts visually fade, tag filtering works

**Tasks**:
- [ ] Calculate remaining time for each post
- [ ] Build PostDecay component (opacity/visual treatment based on TTL)
- [ ] Add CSS transitions for smooth decay effect
- [ ] Build TagFilter component (clickable tags to filter feed)
- [ ] Update usePosts to support tag filtering
- [ ] Add "expires in Xh" indicator on posts
- [ ] Set up Supabase Edge Function or cron for expired post cleanup
- [ ] Test decay visuals across different post ages

**Claude Code prompts**:
```
"Create a PostDecay wrapper that calculates opacity based on time remaining until expires_at"
"Add a TagFilter component that shows active tags and filters the feed"
"Create a Supabase Edge Function that deletes posts where expires_at < now()"
```

---

### Week 5: Polish & Mobile
**Goal**: Responsive design, error handling, loading states

**Tasks**:
- [ ] Add loading skeletons for feed and profile
- [ ] Add error boundaries and toast notifications
- [ ] Build responsive Header and BottomNav (mobile)
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Add empty states ("No posts yet, be the first!")
- [ ] Add form validation with helpful error messages
- [ ] Implement basic ReportDialog (flag post for review)
- [ ] Add settings page (change circle, update profile)
- [ ] Performance pass (lazy loading, memo where needed)

**Claude Code prompts**:
```
"Add loading skeleton components for the feed using shadcn/ui"
"Create a mobile-friendly BottomNav with icons for Feed, New Post, and Profile"
"Build a ReportDialog modal for flagging posts with a reason dropdown"
"Add toast notifications for success/error states using sonner"
```

---

### Week 6: Beta Testing
**Goal**: Real users, real feedback

**Tasks**:
- [ ] Invite 20-30 friends/family (Haarlem focus)
- [ ] Create simple onboarding guide / FAQ
- [ ] Monitor Supabase dashboard for errors
- [ ] Collect feedback (Notion form or simple Google Form)
- [ ] Fix critical bugs as they surface
- [ ] Track basic metrics (signups, posts created, DAU)
- [ ] Identify top 3 pain points from feedback

**Not code tasks**:
- Write a short pitch for beta testers
- Create a simple landing page explaining the concept
- Set up a feedback channel (WhatsApp group, Discord, or just email)

---

### Week 7: Iterate & Soft Launch
**Goal**: Address feedback, prepare for wider release

**Tasks**:
- [ ] Fix top 3 pain points from beta feedback
- [ ] Add most-requested small feature (if feasible)
- [ ] Write proper README with setup instructions
- [ ] Add basic analytics (Plausible or Vercel Analytics — privacy-friendly)
- [ ] Create social assets (OG image, app icon)
- [ ] Soft launch to broader Haarlem community
- [ ] Plan v1.1 features based on learnings

---

## Claude Code Workflow Tips

### Starting a session
```
"I'm building Quiet Network, a hyperlocal ephemeral community app. 
Stack: React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase.
Here's my current file structure: [paste tree output]
Today I want to work on: [specific feature]"
```

### Effective prompts
- Be specific: "Create a PostCard component" > "Build the feed"
- Include context: "Using shadcn/ui Card component and Tailwind"
- Ask for explanations: "Explain why you used useCallback here"
- Iterate: "Now add loading state to this component"

### When stuck
```
"This component isn't working as expected. Here's the code: [paste]
The error I'm seeing is: [paste]
What I expected: [describe]"
```

### Code review
```
"Review this component for potential bugs, performance issues, and React best practices"
```

---

## Environment Variables

```bash
# .env.local (do not commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# .env.example (commit this)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Build
npm run build            # Production build
npm run preview          # Preview production build locally

# Supabase
npx supabase login       # Authenticate CLI
npx supabase init        # Initialize local config
npx supabase db push     # Push migrations to remote
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

# Deployment
git push                 # Vercel auto-deploys from main branch
```

---

## Post-MVP Roadmap (v1.1+)

### Near-term (after beta feedback)
- [ ] Comments/threading on posts
- [ ] Image attachments (with compression)
- [ ] Push notifications (via service worker)
- [ ] Multiple circle membership
- [ ] Real-time feed updates (Supabase Realtime)

### Medium-term
- [ ] Interactive map view for discovering circles
- [ ] "Archive mode" for persistent hobby circles
- [ ] Moderator tools (for circle hosts)
- [ ] PWA support (installable on mobile)

### Long-term (if traction)
- [ ] Federation with other instances (ActivityPub?)
- [ ] Native mobile apps (React Native)
- [ ] Premium features for local businesses
- [ ] Expand to other Dutch cities

---

## Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vercel Deployment](https://vercel.com/docs)

---

## Success Metrics (Beta)

| Metric | Target |
|--------|--------|
| Beta signups | 30+ |
| Weekly active users | 15+ |
| Posts created (week 1) | 50+ |
| Retention (week 2) | 40%+ still posting |
| NPS from feedback | 7+ |

---

*Last updated: January 2026*
*Author: Mischa van der Goes*
*Project: Quiet Network*
