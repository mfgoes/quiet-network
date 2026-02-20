-- ─── Notifications table ─────────────────────────────

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('reply','upvote','mention','circle_post')),
  actor_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id   UUID REFERENCES replies(id) ON DELETE CASCADE,
  circle_id  UUID REFERENCES circles(id) ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX notifications_user_id_idx  ON notifications(user_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own notifications"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can update own notifications"  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "system can insert notifications"     ON notifications FOR INSERT WITH CHECK (true);

-- ─── Trigger 1: reply → notify post author ───────────

CREATE OR REPLACE FUNCTION notify_on_reply() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications(user_id, type, actor_id, post_id, reply_id, circle_id)
  SELECT p.author_id, 'reply', NEW.author_id, NEW.post_id, NEW.id, p.circle_id
  FROM posts p WHERE p.id = NEW.post_id AND p.author_id != NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_reply
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- ─── Trigger 2: post upvote → notify post author ─────

CREATE OR REPLACE FUNCTION notify_on_upvote() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications(user_id, type, actor_id, post_id, circle_id)
  SELECT p.author_id, 'upvote', NEW.user_id, NEW.post_id, p.circle_id
  FROM posts p WHERE p.id = NEW.post_id AND p.author_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_upvote
  AFTER INSERT ON post_upvotes
  FOR EACH ROW EXECUTE FUNCTION notify_on_upvote();

-- ─── Trigger 3: post/reply → @mention notifications ──

CREATE OR REPLACE FUNCTION notify_on_mention() RETURNS TRIGGER AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id  UUID;
  actor              UUID;
  pid                UUID;
  cid                UUID;
  rid                UUID;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    actor := NEW.author_id; pid := NEW.id; cid := NEW.circle_id; rid := NULL;
  ELSE
    actor := NEW.author_id; rid := NEW.id;
    SELECT p.id, p.circle_id INTO pid, cid FROM posts p WHERE p.id = NEW.post_id;
  END IF;

  FOR mentioned_username IN
    SELECT (regexp_matches(NEW.content, '@([A-Za-z0-9_]+)', 'g'))[1]
  LOOP
    SELECT id INTO mentioned_user_id FROM profiles WHERE username = mentioned_username;
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != actor THEN
      INSERT INTO notifications(user_id, type, actor_id, post_id, reply_id, circle_id)
      VALUES (mentioned_user_id, 'mention', actor, pid, rid, cid)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_mention_post
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_on_mention();

CREATE TRIGGER trg_notify_mention_reply
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION notify_on_mention();

-- ─── Trigger 4: new post → notify circle members ─────

CREATE OR REPLACE FUNCTION notify_on_circle_post() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications(user_id, type, actor_id, post_id, circle_id)
  SELECT cm.user_id, 'circle_post', NEW.author_id, NEW.id, NEW.circle_id
  FROM circle_members cm
  JOIN notification_preferences np ON np.user_id = cm.user_id
  WHERE cm.circle_id = NEW.circle_id
    AND cm.user_id != NEW.author_id
    AND np.notify_on_circle_updates = true
    AND NEW.is_welcome = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_circle_post
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_on_circle_post();
