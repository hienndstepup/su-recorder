-- RECORDINGS
CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
  audio_url TEXT,
  audio_duration INTEGER,
  audio_script TEXT,
  age INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_question_id ON recordings(question_id);
CREATE INDEX IF NOT EXISTS idx_recordings_province_id ON recordings(province_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_recordings_user_recorded ON recordings(user_id, recorded_at DESC);

CREATE TRIGGER update_recordings_updated_at 
  BEFORE UPDATE ON recordings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update profile stats after insert/update
CREATE OR REPLACE FUNCTION update_user_stats_simple()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET total_recordings = (SELECT COUNT(*) FROM recordings WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;

  UPDATE profiles 
  SET total_duration = (
    SELECT COALESCE(SUM(audio_duration), 0)
    FROM recordings WHERE user_id = NEW.user_id AND audio_duration IS NOT NULL
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_recording
  AFTER INSERT OR UPDATE ON recordings
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_stats_simple();

-- RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "recordings_select_self" ON recordings;
DROP POLICY IF EXISTS "recordings_select_admin_all" ON recordings;
DROP POLICY IF EXISTS "recordings_select_referrals" ON recordings;
DROP POLICY IF EXISTS "recordings_insert_self" ON recordings;
DROP POLICY IF EXISTS "recordings_update_self" ON recordings;
DROP POLICY IF EXISTS "recordings_delete_self" ON recordings;
DROP POLICY IF EXISTS "recordings_admin_manage" ON recordings;

-- Self can see their recordings
CREATE POLICY "recordings_select_self" ON recordings
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can see/manage all
CREATE POLICY "recordings_select_admin_all" ON recordings
  FOR SELECT USING (is_admin());

CREATE POLICY "recordings_admin_manage" ON recordings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CTV can view recordings of their referrals
CREATE POLICY "recordings_select_referrals" ON recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = recordings.user_id AND p.referrer_id = auth.uid()
    )
  );

-- Self can insert/update/delete own recordings
CREATE POLICY "recordings_insert_self" ON recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_update_self" ON recordings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_delete_self" ON recordings
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE recordings IS 'Bảng recordings - RLS fixed to include WITH CHECK and admin manage';