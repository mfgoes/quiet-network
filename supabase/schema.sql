-- Quiet Network: Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your tables.

-- ============================================
-- PROFILES
-- Extends Supabase Auth users with display info
-- ============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Neighbor',
  avatar_emoji text not null default 'house',
  bio text not null default '',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile when a new user signs up
-- NOTE: Must use fully-qualified public.profiles — trigger runs in auth schema context
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================
-- CIRCLES (neighborhoods / groups)
-- ============================================
create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  about text,
  rules text,
  latitude double precision,
  longitude double precision,
  radius_km double precision not null default 1.5,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table circles enable row level security;

create policy "Circles are viewable by authenticated users"
  on circles for select
  to authenticated
  using (true);

create policy "Authenticated users can create circles"
  on circles for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Circle creators can update their circles"
  on circles for update
  to authenticated
  using (created_by = auth.uid());


-- ============================================
-- CIRCLE MEMBERSHIPS
-- ============================================
create table if not exists circle_members (
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

alter table circle_members enable row level security;

create policy "Authenticated users can view circle membership"
  on circle_members for select
  to authenticated
  using (true);

create policy "Users can join circles"
  on circle_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave circles"
  on circle_members for delete
  to authenticated
  using (user_id = auth.uid());


-- ============================================
-- POSTS (ephemeral by design)
-- ============================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,

  -- Ephemerality fields
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  original_duration_seconds int not null,  -- duration in seconds for decay calc

  -- Welcome Mat: pinned posts never expire
  is_welcome boolean not null default false
);

alter table posts enable row level security;

create policy "Posts are viewable by circle members"
  on posts for select
  to authenticated
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = posts.circle_id
        and circle_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create posts in their circles"
  on posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from circle_members
      where circle_members.circle_id = posts.circle_id
        and circle_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own posts"
  on posts for delete
  to authenticated
  using (author_id = auth.uid());

-- Index for efficient expired-post cleanup
create index if not exists idx_posts_expires_at on posts (expires_at)
  where is_welcome = false;

-- Scheduled cleanup: delete expired posts (run via Supabase pg_cron)
-- select cron.schedule('cleanup-expired-posts', '*/15 * * * *',
--   $$delete from posts where is_welcome = false and expires_at < now()$$
-- );


-- ============================================
-- WELCOME MAT: Ensure every circle has one
-- ============================================
create or replace function create_welcome_post()
returns trigger as $$
begin
  insert into posts (circle_id, author_id, content, expires_at, original_duration_seconds, is_welcome)
  values (
    new.id,
    new.created_by,
    '👋 Welcome to ' || new.name || '! This is a quiet space for your neighborhood. Share what matters, and it will fade away naturally.',
    'infinity'::timestamptz,
    0,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_circle_created
  after insert on circles
  for each row execute function create_welcome_post();


-- ============================================
-- POST UPVOTES
-- ============================================
create table if not exists post_upvotes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_upvotes enable row level security;

create policy "Upvotes are viewable by circle members"
  on post_upvotes for select
  to authenticated
  using (
    exists (
      select 1 from posts
      join circle_members on circle_members.circle_id = posts.circle_id
      where posts.id = post_upvotes.post_id
        and circle_members.user_id = auth.uid()
    )
  );

create policy "Users can upvote posts in their circles"
  on post_upvotes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from posts
      join circle_members on circle_members.circle_id = posts.circle_id
      where posts.id = post_upvotes.post_id
        and circle_members.user_id = auth.uid()
    )
  );

create policy "Users can remove their own upvotes"
  on post_upvotes for delete
  to authenticated
  using (user_id = auth.uid());


-- ============================================
-- DELETE ACCOUNT (security definer function)
-- ============================================
-- Allows a user to delete all their own data and auth account.
-- Runs as postgres (security definer) so it can call auth.users delete.
-- Only deletes the calling user's data — auth.uid() is checked internally.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete user's upvotes
  delete from post_upvotes where user_id = auth.uid();
  -- Delete user's posts
  delete from posts where author_id = auth.uid();
  -- Remove from all circles
  delete from circle_members where user_id = auth.uid();
  -- Delete profile
  delete from profiles where id = auth.uid();
  -- Delete auth user
  delete from auth.users where id = auth.uid();
end;
$$;
