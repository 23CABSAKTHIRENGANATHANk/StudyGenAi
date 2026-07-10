-- Migration: add unique constraint on profiles.user_id (required for upsert ON CONFLICT)
-- Run this in your Supabase SQL editor if you applied schema.sql before this migration.
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
