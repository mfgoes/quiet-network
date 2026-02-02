-- Add edit tracking columns to posts table
alter table posts
  add column if not exists updated_at timestamptz,
  add column if not exists edited boolean not null default false,
  add column if not exists tags text[] default '{}';

-- Add RLS policy for UPDATE operations (enforces 30-minute window)
create policy "Authors can update their own posts within 30 minutes"
  on posts for update
  to authenticated
  using (
    author_id = auth.uid()
    and (extract(epoch from (now() - created_at)) / 60) <= 30
  )
  with check (
    author_id = auth.uid()
    and (extract(epoch from (now() - created_at)) / 60) <= 30
  );
