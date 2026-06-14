-- Reviewable business claims tied to real Quiet Network accounts.

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

alter table public.watchmaker_claim_requests enable row level security;
alter table public.watchmaker_claim_reviewers enable row level security;

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
