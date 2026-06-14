-- Split watchmaker profiles into claimed and community listings.
-- Existing rows become community listings and cannot carry shop-level replica policy labels.

alter table public.watchmakers
  add column if not exists profile_type text not null default 'community',
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.watchmaker_service_reports
  add column if not exists watch_accepted boolean;

alter table public.watchmakers
  alter column rep_friendly drop not null,
  alter column rep_friendly drop default;

update public.watchmakers
set
  profile_type = 'community',
  owner_id = null,
  rep_friendly = null,
  watch_types = '{}',
  services = '{}'
where profile_type is null or profile_type = 'community';

alter table public.watchmakers
  drop constraint if exists watchmakers_profile_type_check,
  add constraint watchmakers_profile_type_check check (profile_type in ('claimed', 'community'));

alter table public.watchmakers
  drop constraint if exists watchmakers_rep_friendly_check,
  add constraint watchmakers_rep_friendly_check check (rep_friendly in ('yes', 'no', 'unknown'));

alter table public.watchmakers
  drop constraint if exists watchmakers_community_rep_friendly_null,
  add constraint watchmakers_community_rep_friendly_null check (profile_type = 'claimed' or rep_friendly is null);

alter table public.watchmakers
  drop constraint if exists watchmakers_community_watch_types_empty,
  add constraint watchmakers_community_watch_types_empty check (profile_type = 'claimed' or watch_types = '{}');

alter table public.watchmakers
  drop constraint if exists watchmakers_community_services_empty,
  add constraint watchmakers_community_services_empty check (profile_type = 'claimed' or services = '{}');

drop policy if exists "Anyone can submit watchmakers" on public.watchmakers;
create policy "Anyone can submit watchmakers"
  on public.watchmakers
  for insert
  to anon, authenticated
  with check (
    approved = false
    and profile_type = 'community'
    and owner_id is null
    and rep_friendly is null
    and watch_types = '{}'
    and services = '{}'
  );

drop policy if exists "Claimed owners can update own watchmaker profile" on public.watchmakers;
create policy "Claimed owners can update own watchmaker profile"
  on public.watchmakers
  for update
  to authenticated
  using (profile_type = 'claimed' and owner_id = auth.uid())
  with check (profile_type = 'claimed' and owner_id = auth.uid());
