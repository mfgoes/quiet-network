-- Backfill: add role column and assign user "mike" as admin for all circles.
-- Run this in the Supabase SQL Editor.

-- Step 1: Add the role column if it doesn't exist yet
alter table circle_members
  add column if not exists role text not null default 'member'
  check (role in ('admin', 'moderator', 'member'));

-- Step 2: Set existing circle creators to admin
update circle_members cm
set role = 'admin'
from circles c
where cm.circle_id = c.id
  and cm.user_id = c.created_by
  and cm.role != 'admin';

-- Step 3: Create the trigger so future creators auto-get admin
create or replace function set_creator_as_admin()
returns trigger as $$
begin
  if exists (
    select 1 from circles
    where id = new.circle_id and created_by = new.user_id
  ) then
    new.role := 'admin';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_member_insert_set_admin on circle_members;
create trigger on_member_insert_set_admin
  before insert on circle_members
  for each row execute function set_creator_as_admin();

-- Step 4: For circles that STILL have no admin/mod, promote mike's
-- existing membership or insert him as admin.

-- 4a: Update mike's existing memberships in staff-less circles
update circle_members
set role = 'admin'
where user_id = (select id from profiles where username = 'mike' limit 1)
  and circle_id in (
    select c.id from circles c
    where not exists (
      select 1 from circle_members cm
      where cm.circle_id = c.id
        and cm.role in ('admin', 'moderator')
    )
  );

-- 4b: Insert mike as admin into staff-less circles he hasn't joined
insert into circle_members (circle_id, user_id, role)
select c.id, m.id, 'admin'
from circles c
cross join (select id from profiles where username = 'mike' limit 1) m
where not exists (
  select 1 from circle_members cm
  where cm.circle_id = c.id
    and cm.role in ('admin', 'moderator')
)
and not exists (
  select 1 from circle_members cm2
  where cm2.circle_id = c.id
    and cm2.user_id = m.id
);
