-- ─── Notification Preferences ──────────────────────────────────

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Email notification settings
  notify_on_replies boolean not null default true,
  notify_on_mentions boolean not null default true,
  notify_weekly_digest boolean not null default true,
  notify_on_circle_updates boolean not null default false,

  -- Future settings (for push notifications, etc.)
  push_enabled boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id)
);

-- ─── RLS Policies ──────────────────────────────────

alter table notification_preferences enable row level security;

create policy "Users can view their own notification preferences"
  on notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own notification preferences"
  on notification_preferences for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own notification preferences"
  on notification_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Function to auto-create preferences on signup ──────────────────────────────────

create or replace function create_notification_preferences()
returns trigger as $$
begin
  insert into notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- ─── Trigger to create preferences when profile is created ──────────────────────────────────

create trigger on_profile_created_create_notification_preferences
  after insert on profiles
  for each row
  execute function create_notification_preferences();

-- ─── Backfill existing users ──────────────────────────────────

insert into notification_preferences (user_id)
select id from profiles
on conflict (user_id) do nothing;
