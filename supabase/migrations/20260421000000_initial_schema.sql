-- 主催者テーブル
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 投票セッションテーブル
CREATE TABLE voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  methods_config JSONB NOT NULL DEFAULT '{
    "enabled": ["majority", "approval", "irv", "range", "qv"],
    "order": ["majority", "approval", "irv", "range", "qv"],
    "qv_credits": 25,
    "range_max": 5
  }'::jsonb,
  participant_id_mode TEXT NOT NULL CHECK (participant_id_mode IN ('anonymous', 'nickname')) DEFAULT 'anonymous',
  result_visibility TEXT NOT NULL CHECK (result_visibility IN ('realtime', 'after_end')) DEFAULT 'after_end',
  share_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
  result_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_voting_sessions_organizer ON voting_sessions(organizer_id);
CREATE INDEX idx_voting_sessions_share_token ON voting_sessions(share_token);

-- 作品テーブル
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  creator_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artworks_session ON artworks(session_id);

-- 参加者テーブル
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  participant_number INTEGER NOT NULL,
  nickname TEXT,
  browser_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (session_id, browser_id),
  UNIQUE (session_id, participant_number)
);

CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_browser ON participants(browser_id);

-- 投票データテーブル（手法ごと）
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('majority', 'approval', 'irv', 'range', 'qv')),
  vote_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_id, method)
);

CREATE INDEX idx_votes_participant ON votes(participant_id);
CREATE INDEX idx_votes_method ON votes(method);

-- メタ承認投票テーブル
CREATE TABLE meta_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  approved_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  none_selected BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meta_votes_participant ON meta_votes(participant_id);

-- 自由記述コメントテーブル
CREATE TABLE free_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE UNIQUE,
  comment_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_free_comments_participant ON free_comments(participant_id);

-- ======================
-- RLS (Row Level Security)
-- ======================

-- organizers: 自分のレコードのみ閲覧・更新可
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizers_self_read" ON organizers
  FOR SELECT USING (auth.uid()::text = google_id);
CREATE POLICY "organizers_self_insert" ON organizers
  FOR INSERT WITH CHECK (auth.uid()::text = google_id);

-- voting_sessions: 主催者は自分のを編集、参加者は share_token で閲覧
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_organizer_full" ON voting_sessions
  FOR ALL USING (
    organizer_id IN (SELECT id FROM organizers WHERE google_id = auth.uid()::text)
  );
CREATE POLICY "sessions_public_read" ON voting_sessions
  FOR SELECT USING (true);

-- artworks: セッション所有者は編集可、参加者は閲覧のみ
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artworks_read_all" ON artworks FOR SELECT USING (true);
CREATE POLICY "artworks_write_organizer" ON artworks
  FOR ALL USING (
    session_id IN (
      SELECT id FROM voting_sessions WHERE organizer_id IN (
        SELECT id FROM organizers WHERE google_id = auth.uid()::text
      )
    )
  );

-- participants: 匿名アクセス許可（browser_idベースの識別）
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_read_all" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_anon" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update_self" ON participants FOR UPDATE USING (true);

-- votes: 匿名アクセス許可
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read_all" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_anon" ON votes FOR INSERT WITH CHECK (true);

-- meta_votes: 匿名アクセス許可
ALTER TABLE meta_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_votes_read_all" ON meta_votes FOR SELECT USING (true);
CREATE POLICY "meta_votes_insert_anon" ON meta_votes FOR INSERT WITH CHECK (true);

-- free_comments: 匿名アクセス許可
ALTER TABLE free_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "free_comments_read_all" ON free_comments FOR SELECT USING (true);
CREATE POLICY "free_comments_insert_anon" ON free_comments FOR INSERT WITH CHECK (true);

-- ======================
-- Storage bucket for artwork images
-- ======================
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);

CREATE POLICY "artworks_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artworks');
CREATE POLICY "artworks_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artworks');
CREATE POLICY "artworks_storage_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artworks');
