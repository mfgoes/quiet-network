-- ============================================
-- POST IMAGES: Add image upload support
-- ============================================

-- Add image_url column to posts table
alter table posts
  add column if not exists image_url text;

-- ============================================
-- STORAGE: Create bucket for post images
-- ============================================

-- Create storage bucket for post images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true, -- public bucket so images can be viewed
  5242880, -- 5MB max file size (5 * 1024 * 1024 bytes)
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ============================================
-- STORAGE POLICIES: Post Images
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Authenticated users can upload post images" on storage.objects;
drop policy if exists "Anyone can view post images" on storage.objects;
drop policy if exists "Users can delete their own post images" on storage.objects;

-- Allow authenticated users to upload images
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow anyone to view post images (public bucket)
create policy "Anyone can view post images"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');

-- Allow users to delete their own post images
create policy "Users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- CLEANUP: Delete image when post is deleted
-- ============================================

create or replace function delete_post_image()
returns trigger as $$
begin
  if old.image_url is not null then
    -- Extract the storage path from the full URL
    -- URL format: https://<project-ref>.supabase.co/storage/v1/object/public/post-images/<path>
    -- We need to extract the path after 'post-images/'
    declare
      storage_path text;
    begin
      storage_path := substring(old.image_url from 'post-images/(.+)$');
      if storage_path is not null then
        delete from storage.objects
        where bucket_id = 'post-images'
          and name = storage_path;
      end if;
    end;
  end if;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_post_deleted_delete_image
  before delete on posts
  for each row execute function delete_post_image();
