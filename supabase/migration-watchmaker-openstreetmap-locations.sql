-- Store OpenStreetMap/Nominatim place identity for real watchmaker locations.

alter table public.watchmakers
  add column if not exists osm_place_id bigint,
  add column if not exists osm_type text,
  add column if not exists osm_display_name text;

alter table public.watchmakers
  drop constraint if exists watchmakers_osm_type_check,
  add constraint watchmakers_osm_type_check check (osm_type in ('node', 'way', 'relation'));
