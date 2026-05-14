-- ============================================================
-- Reviewly: AI-Powered Gamified Study App
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active DATE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
  tree_theme TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules (user study content)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  tags TEXT[] DEFAULT '{}',
  mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  ai_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MCQ Questions
CREATE TABLE IF NOT EXISTS mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('flashcard', 'mcq', 'speed')),
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly XP tracking (for analytics)
CREATE TABLE IF NOT EXISTS daily_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general'
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- Seed Achievements
-- ============================================================
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_session', 'First Steps', 'Complete your first review session', '🌱', 50, 'milestone'),
  ('streak_3', '3-Day Streak', 'Study for 3 days in a row', '🔥', 100, 'streak'),
  ('streak_7', 'Week Warrior', 'Study for 7 days in a row', '⚡', 250, 'streak'),
  ('streak_30', 'Monthly Master', 'Study for 30 days in a row', '🌟', 1000, 'streak'),
  ('level_5', 'Sprouting', 'Reach Level 5', '🌿', 200, 'level'),
  ('level_10', 'Growing Strong', 'Reach Level 10', '🌳', 500, 'level'),
  ('level_20', 'Ancient Wisdom', 'Reach Level 20', '✨', 1500, 'level'),
  ('perfect_score', 'Perfectionist', 'Get 100% on any session', '💯', 150, 'performance'),
  ('speed_demon', 'Speed Demon', 'Complete a speed round in under 60s', '⚡', 100, 'performance'),
  ('module_5', 'Knowledge Collector', 'Create 5 modules', '📚', 200, 'content'),
  ('sessions_10', 'Dedicated Learner', 'Complete 10 sessions', '📖', 300, 'milestone'),
  ('sessions_50', 'Study Machine', 'Complete 50 sessions', '🤖', 750, 'milestone')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid());

-- Modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_own" ON modules FOR ALL USING (user_id = auth.uid());

-- Flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flashcards_own" ON flashcards FOR ALL USING (user_id = auth.uid());

-- MCQ Questions
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcq_own" ON mcq_questions FOR ALL USING (user_id = auth.uid());

-- Sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON sessions FOR ALL USING (user_id = auth.uid());

-- Daily XP
ALTER TABLE daily_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_xp_own" ON daily_xp FOR ALL USING (user_id = auth.uid());

-- Achievements (public read)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_read" ON achievements FOR SELECT USING (true);

-- User Achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_own" ON user_achievements FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Note: auth trigger must be created via InsForge dashboard or admin SQL
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- XP Level calculation helper
-- ============================================================
CREATE OR REPLACE FUNCTION xp_for_level(p_level INTEGER)
RETURNS INTEGER LANGUAGE plpgsql AS $$
BEGIN
  RETURN p_level * 100;
END;
$$;
