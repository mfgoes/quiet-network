-- Migration: Add is_permanent field to posts table
-- Run this in Supabase SQL Editor

-- Add is_permanent column
ALTER TABLE posts ADD COLUMN is_permanent BOOLEAN NOT NULL DEFAULT false;

-- Update index to exclude permanent posts from expiry checks
DROP INDEX IF EXISTS idx_posts_expires_at;
CREATE INDEX idx_posts_expires_at ON posts (expires_at)
  WHERE is_welcome = false AND is_permanent = false;

-- Add UPDATE policy for admins/mods
CREATE POLICY "Admins and mods can update posts to permanent"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = posts.circle_id
        AND circle_members.user_id = auth.uid()
        AND circle_members.role IN ('admin', 'moderator')
    )
    OR EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = posts.circle_id
        AND circles.created_by = auth.uid()
    )
  );
