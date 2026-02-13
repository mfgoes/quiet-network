# 📸 Image Upload Implementation Guide

## ✅ What's Been Done

### 1. Database & Storage Setup
- ✅ Created migration file: `supabase/migration-post-images.sql`
- ✅ Adds `image_url` column to posts table
- ✅ Creates `post-images` storage bucket with:
  - **5MB max file size**
  - Allowed formats: JPEG, JPG, PNG, WebP, GIF
  - Public bucket for viewing
  - User-specific folders for organization
- ✅ RLS policies for upload, view, and delete
- ✅ Auto-cleanup trigger (deletes images when posts are deleted)

### 2. Frontend Implementation
- ✅ Installed `browser-image-compression` for client-side compression
- ✅ Updated Post type to include `image_url`
- ✅ Enhanced PostComposer with:
  - Image picker button
  - Real-time preview with remove option
  - Automatic compression (max 1MB, 1920px)
  - Upload to Supabase Storage
  - Support for image-only posts (no text required)
- ✅ Updated PostCard to display images
- ✅ Updated hooks to handle image URLs in createPost
- ✅ Updated CircleFeed and HomeFeed components

## 🚀 Setup Instructions

### Step 1: Run SQL Migration
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `supabase/migration-post-images.sql`
4. Paste and run the SQL

### Step 2: Verify Storage Bucket
1. In Supabase dashboard, go to **Storage**
2. Verify `post-images` bucket exists
3. Check policies are enabled

### Step 3: Install Dependencies
```bash
npm install browser-image-compression
```
(Already installed)

### Step 4: Test
1. Start your dev server: `npm run dev`
2. Navigate to a circle
3. Click the image button (camera icon) in PostComposer
4. Select an image (under 5MB)
5. See preview and upload
6. Post should display with image

## 🎯 Features

### Compression
- Images automatically compressed to **max 1MB**
- Max dimensions: **1920px** (maintains aspect ratio)
- Uses web workers for smooth performance

### Size Limits
- Max upload size: **5MB** (enforced at storage bucket level)
- Max compressed size: **1MB** (enforced by compression)
- Frontend validation prevents oversized uploads

### File Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### UX
- Real-time image preview before posting
- Easy remove button
- Loading states during compression & upload
- Toast notifications for errors/success
- Posts can be text + image or image-only

### Storage Organization
```
post-images/
├── {user-id}/
│   ├── 1234567890.jpg
│   ├── 1234567891.png
│   └── ...
```

## 🔐 Security

- **RLS Policies**: Users can only upload to their own folders
- **Public viewing**: Images are publicly viewable (for sharing)
- **Auto-cleanup**: Images deleted when posts are deleted
- **File type validation**: Only approved image formats
- **Size limits**: Prevents abuse with 5MB hard limit

## 📝 Notes

- Images are stored in user-specific folders (`{user_id}/{timestamp}.ext`)
- Compression happens client-side before upload
- Edit functionality doesn't support changing images (users can delete/repost)
- Images persist in storage for the lifetime of the post

## 🐛 Troubleshooting

**Image won't upload:**
- Check file size (<5MB)
- Verify file format (JPEG, PNG, WebP, GIF)
- Check browser console for errors
- Verify Supabase storage bucket exists

**Storage policies error:**
- Re-run the migration SQL
- Check RLS is enabled on storage.objects
- Verify bucket is public

**Images not displaying:**
- Check post has `image_url` in database
- Verify storage bucket URL is correct
- Check browser console for CORS errors
