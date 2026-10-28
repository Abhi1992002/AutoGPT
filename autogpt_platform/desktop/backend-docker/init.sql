-- Runs before the Prisma migrations on every start; safe to repeat.

-- Schema used by Prisma (DATABASE_URL ?schema=platform).
CREATE SCHEMA IF NOT EXISTS platform;

-- Stand-in for Supabase's auth.users. Historical migrations add triggers to it and backfill
-- from it (e.g. 20241030014950_move_integration_creds_to_platform.User,
-- 20260319120000_revert_invite_system), so it must exist with these columns for the migration
-- history to apply on a plain PostgreSQL. Nothing writes to it at runtime.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text,
    encrypted_password text,
    raw_user_meta_data jsonb DEFAULT '{}',
    raw_app_meta_data jsonb DEFAULT '{}',
    role text,
    is_super_admin boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    email_confirmed_at timestamptz,
    phone text,
    banned_until timestamptz
);
