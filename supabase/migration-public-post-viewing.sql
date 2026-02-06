-- Allow public viewing of posts (for unauthenticated users)

-- Drop the old policy
drop policy if exists "Posts are viewable by authenticated users" on posts;

-- Create new policy that allows both authenticated and anonymous users to view posts
create policy "Posts are viewable by everyone"
  on posts for select
  to anon, authenticated
  using (true);

-- Also update replies to be viewable by everyone
drop policy if exists "Replies are viewable by authenticated users" on replies;

create policy "Replies are viewable by everyone"
  on replies for select
  to anon, authenticated
  using (true);

-- Update profiles to be viewable by everyone (so post authors are visible)
drop policy if exists "Profiles are viewable by authenticated users" on profiles;

create policy "Profiles are viewable by everyone"
  on profiles for select
  to anon, authenticated
  using (true);

-- Update circles to be viewable by everyone
drop policy if exists "Circles are viewable by authenticated users" on circles;

create policy "Circles are viewable by everyone"
  on circles for select
  to anon, authenticated
  using (true);

-- Note: Upvotes remain authenticated-only (no changes needed)
-- Creating posts, replies, etc. still requires authentication
