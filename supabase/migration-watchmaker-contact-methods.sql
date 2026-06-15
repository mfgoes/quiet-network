-- Store non-website contact channels for imported and claimed watchmaker profiles.
-- Example: Reddit usernames from community source lists.

alter table public.watchmakers
  add column if not exists contact_methods jsonb not null default '[]'::jsonb;
