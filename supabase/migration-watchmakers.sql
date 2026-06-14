-- Watchmakers vertical: public discovery with anonymous community submissions.
-- This keeps the MVP browseable and contributable without requiring Quiet Network login.

create table if not exists public.watchmakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  profile_type text not null default 'community' check (profile_type in ('claimed', 'community')),
  owner_id uuid references auth.users(id) on delete set null,
  city text not null,
  country text not null,
  address text,
  website text,
  description text,
  shop_type text,
  services text[] not null default '{}',
  watch_types text[] not null default '{}',
  movements text[] not null default '{}',
  rep_friendly text check (rep_friendly in ('yes', 'no', 'unknown')),
  typical_price text,
  turnaround text,
  osm_place_id bigint,
  osm_type text check (osm_type in ('node', 'way', 'relation')),
  osm_display_name text,
  latitude double precision,
  longitude double precision,
  submitted_by uuid references auth.users(id) on delete set null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  check (profile_type = 'claimed' or rep_friendly is null),
  check (profile_type = 'claimed' or watch_types = '{}'),
  check (profile_type = 'claimed' or services = '{}')
);

create table if not exists public.watchmaker_service_reports (
  id uuid primary key default gen_random_uuid(),
  watchmaker_id uuid references public.watchmakers(id) on delete cascade,
  watchmaker_name text,
  watch text not null,
  movement text,
  work_performed text not null,
  watch_accepted boolean,
  price text,
  turnaround text,
  would_return boolean,
  notes text,
  submitted_by uuid references auth.users(id) on delete set null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.watchmaker_claim_requests (
  id uuid primary key default gen_random_uuid(),
  watchmaker_id uuid references public.watchmakers(id) on delete cascade,
  watchmaker_slug text not null,
  watchmaker_name text not null,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  claimant_role text not null,
  proof text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.watchmaker_claim_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists watchmaker_claim_requests_one_pending_per_user
  on public.watchmaker_claim_requests (watchmaker_slug, claimant_id)
  where status = 'pending';

create unique index if not exists watchmakers_slug_unique
  on public.watchmakers (slug)
  where slug is not null;

alter table public.watchmakers enable row level security;
alter table public.watchmaker_service_reports enable row level security;
alter table public.watchmaker_claim_requests enable row level security;
alter table public.watchmaker_claim_reviewers enable row level security;

drop policy if exists "Public can read approved watchmakers" on public.watchmakers;
create policy "Public can read approved watchmakers"
  on public.watchmakers
  for select
  to anon, authenticated
  using (approved = true);

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

drop policy if exists "Public can read approved service reports" on public.watchmaker_service_reports;
create policy "Public can read approved service reports"
  on public.watchmaker_service_reports
  for select
  to anon, authenticated
  using (approved = true);

drop policy if exists "Anyone can submit service reports" on public.watchmaker_service_reports;
create policy "Anyone can submit service reports"
  on public.watchmaker_service_reports
  for insert
  to anon, authenticated
  with check (approved = false);

drop policy if exists "Users can create own watchmaker claim requests" on public.watchmaker_claim_requests;
create policy "Users can create own watchmaker claim requests"
  on public.watchmaker_claim_requests
  for insert
  to authenticated
  with check (claimant_id = auth.uid() and status = 'pending');

drop policy if exists "Users can read own watchmaker claim requests" on public.watchmaker_claim_requests;
create policy "Users can read own watchmaker claim requests"
  on public.watchmaker_claim_requests
  for select
  to authenticated
  using (
    claimant_id = auth.uid()
    or exists (
      select 1
      from public.watchmaker_claim_reviewers
      where watchmaker_claim_reviewers.user_id = auth.uid()
    )
  );

drop policy if exists "Reviewers can see own reviewer status" on public.watchmaker_claim_reviewers;
create policy "Reviewers can see own reviewer status"
  on public.watchmaker_claim_reviewers
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.review_watchmaker_claim_request(
  request_id uuid,
  decision text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer uuid := auth.uid();
  claim public.watchmaker_claim_requests%rowtype;
begin
  if reviewer is null then
    raise exception 'Authentication required';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  if not exists (
    select 1 from public.watchmaker_claim_reviewers where user_id = reviewer
  ) then
    raise exception 'Not authorized to review watchmaker claims';
  end if;

  select *
    into claim
    from public.watchmaker_claim_requests
    where id = request_id
    for update;

  if not found then
    raise exception 'Claim request not found';
  end if;

  if claim.status <> 'pending' then
    raise exception 'Claim request has already been reviewed';
  end if;

  update public.watchmaker_claim_requests
    set status = decision,
        reviewed_by = reviewer,
        reviewed_at = now()
    where id = request_id;

  if decision = 'approved' then
    update public.watchmakers
      set profile_type = 'claimed',
          owner_id = claim.claimant_id
      where (claim.watchmaker_id is not null and id = claim.watchmaker_id)
         or (claim.watchmaker_id is null and slug = claim.watchmaker_slug);
  end if;
end;
$$;

grant execute on function public.review_watchmaker_claim_request(uuid, text) to authenticated;
