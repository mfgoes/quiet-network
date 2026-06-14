-- Make watchmaker contributions persist the form's structured chips.
-- Community listings can now carry accepted watch types and common services.
-- Service reports can carry a watch type, work chip array, matched local slug,
-- and Nominatim location data when no existing shop is matched.

alter table public.watchmakers
  add column if not exists slug text;

create unique index if not exists watchmakers_slug_unique
  on public.watchmakers (slug)
  where slug is not null;

alter table public.watchmaker_service_reports
  add column if not exists watch_type text,
  add column if not exists work_done text[] not null default '{}',
  add column if not exists watchmaker_slug text,
  add column if not exists osm_place_id bigint,
  add column if not exists osm_type text,
  add column if not exists osm_display_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.watchmaker_service_reports
  drop constraint if exists watchmaker_service_reports_watch_type_check,
  add constraint watchmaker_service_reports_watch_type_check
    check (watch_type is null or watch_type in ('genuine', 'replica'));

alter table public.watchmaker_service_reports
  drop constraint if exists watchmaker_service_reports_osm_type_check,
  add constraint watchmaker_service_reports_osm_type_check
    check (osm_type is null or osm_type in ('node', 'way', 'relation'));

alter table public.watchmakers
  drop constraint if exists watchmakers_community_watch_types_empty,
  drop constraint if exists watchmakers_community_services_empty;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.watchmakers'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%profile_type = ''claimed''::text%'
      and (
        pg_get_constraintdef(oid) like '%watch_types = ''{}''::text[]%'
        or pg_get_constraintdef(oid) like '%services = ''{}''::text[]%'
      )
  loop
    execute format('alter table public.watchmakers drop constraint %I', constraint_name);
  end loop;
end $$;

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
  );

drop policy if exists "Anyone can submit service reports" on public.watchmaker_service_reports;
create policy "Anyone can submit service reports"
  on public.watchmaker_service_reports
  for insert
  to anon, authenticated
  with check (
    approved = false
    and work_done is not null
    and (
      watchmaker_id is not null
      or watchmaker_slug is not null
      or watchmaker_name is not null
    )
  );
