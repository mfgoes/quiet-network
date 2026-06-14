-- Stable public identifiers let imported/community watchmaker listings be claimed safely.

alter table public.watchmakers
  add column if not exists slug text;

create unique index if not exists watchmakers_slug_unique
  on public.watchmakers (slug)
  where slug is not null;
