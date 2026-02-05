-- Add soft delete columns to profiles and organizations
-- This enables safe deletion with a 30-day grace period and audit trail

-- Add soft delete columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delete_requested_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delete_requested_by UUID REFERENCES profiles(id);

-- Add comments to explain the soft delete columns
COMMENT ON COLUMN profiles.deleted_at IS 'When the profile will be permanently deleted (30 days after request)';
COMMENT ON COLUMN profiles.delete_requested_at IS 'When the user requested account deletion';
COMMENT ON COLUMN profiles.delete_requested_by IS 'User ID who requested the deletion';

COMMENT ON COLUMN organizations.deleted_at IS 'When the organization will be permanently deleted (30 days after request)';
COMMENT ON COLUMN organizations.delete_requested_at IS 'When deletion was requested';
COMMENT ON COLUMN organizations.delete_requested_by IS 'Profile ID who requested the deletion';
