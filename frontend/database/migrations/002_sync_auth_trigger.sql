-- Migration: ensure profiles.user_id is unique and add auth sync trigger
-- Run after schema.sql

-- Ensure unique constraint on profiles.user_id (safe even if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_user_id_key'
        AND conrelid = 'profiles'::regclass
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END
$$;

-- Function to sync Supabase auth users to local users table
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_local()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.created_at, now()),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();

    INSERT INTO public.profiles (user_id, display_name, bio, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'display_name',
        NULL,
        NULL
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (only works if you have access to the auth schema in Supabase)
-- Note: In Supabase, this requires creating the trigger in the Supabase dashboard SQL editor
-- or using the supabase CLI with appropriate permissions.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_local();
