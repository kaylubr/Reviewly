-- Fix handle_new_user trigger: InsForge auth.users has no raw_user_meta_data field.
-- Use email prefix as username fallback; avatar_url defaults to NULL.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
