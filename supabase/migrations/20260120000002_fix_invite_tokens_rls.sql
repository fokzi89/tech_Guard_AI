-- Fix invite_tokens RLS policies to use helper function
-- Date: 2026-01-20
-- Description: Replace recursive profile queries in invite_tokens RLS policies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "super_admin_all_invite_tokens" ON invite_tokens;
DROP POLICY IF EXISTS "org_admin_manage_invite_tokens" ON invite_tokens;

-- Super admins can see all invite tokens
CREATE POLICY "super_admin_all_invite_tokens"
ON invite_tokens FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- Org admins can manage invite tokens for their organization
CREATE POLICY "org_admin_manage_invite_tokens"
ON invite_tokens FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
  AND (SELECT role FROM get_user_profile(auth.uid())) = 'org_admin'
);
