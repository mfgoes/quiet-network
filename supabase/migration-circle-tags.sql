-- Circle-specific tags (created by admins/mods)
CREATE TABLE IF NOT EXISTS circle_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'var(--color-tag-blue)',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, name)
);

ALTER TABLE circle_tags ENABLE ROW LEVEL SECURITY;

-- Members can read tags for their circles
CREATE POLICY "circle_tags_select" ON circle_tags
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
    OR circle_id IN (SELECT id FROM circles WHERE created_by = auth.uid())
  );

-- Admins and mods can create tags
CREATE POLICY "circle_tags_insert" ON circle_tags
  FOR INSERT WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
    OR circle_id IN (SELECT id FROM circles WHERE created_by = auth.uid())
  );

-- Admins and mods can delete tags
CREATE POLICY "circle_tags_delete" ON circle_tags
  FOR DELETE USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
    OR circle_id IN (SELECT id FROM circles WHERE created_by = auth.uid())
  );
