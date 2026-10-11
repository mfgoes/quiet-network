-- Migration: structured "listing" on posts (side hustles, later maybe more kinds)
-- Run this in the Supabase SQL Editor.
-- The app only sends `listing` when a post has one, so regular posting keeps
-- working before this runs; side-hustle posts need it.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS listing jsonb;

-- Fast lookups for the makers page: live side hustles per circle and category
CREATE INDEX IF NOT EXISTS idx_posts_listing_category
	ON posts ((listing->>'category'), circle_id)
	WHERE listing IS NOT NULL;
