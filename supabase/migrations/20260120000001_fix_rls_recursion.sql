-- Fix infinite recursion in RLS policies
-- Date: 2026-01-20
-- Description: Replace recursive profile queries in RLS policies with a helper function

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "super_admin_all_organizations" ON organizations;
DROP POLICY IF EXISTS "users_own_organization" ON organizations;
DROP POLICY IF EXISTS "super_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "org_admin_org_profiles" ON profiles;
DROP POLICY IF EXISTS "super_admin_all_manuals" ON manuals;
DROP POLICY IF EXISTS "users_org_manuals" ON manuals;
DROP POLICY IF EXISTS "org_admin_manage_manuals" ON manuals;
DROP POLICY IF EXISTS "super_admin_all_blacklist" ON safety_blacklist;
DROP POLICY IF EXISTS "super_admin_all_incidents" ON incidents;
DROP POLICY IF EXISTS "users_org_incidents" ON incidents;
DROP POLICY IF EXISTS "technicians_own_incidents" ON incidents;

-- Create helper function to get user profile WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  org_id uuid,
  role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.org_id, p.role
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES - ORGANIZATIONS (Fixed)
-- ============================================================================

-- Super Admins can see all organizations
CREATE POLICY "super_admin_all_organizations"
ON organizations FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- Org Admins and Technicians can only see their own organization
CREATE POLICY "users_own_organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id = (SELECT org_id FROM get_user_profile(auth.uid()))
);

-- ============================================================================
-- RLS POLICIES - PROFILES (Fixed)
-- ============================================================================

-- Super Admins can see all profiles
CREATE POLICY "super_admin_all_profiles"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- Users can see their own profile
CREATE POLICY "users_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Org Admins can see all profiles in their organization
CREATE POLICY "org_admin_org_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
  AND (SELECT role FROM get_user_profile(auth.uid())) IN ('org_admin', 'super_admin')
);

-- ============================================================================
-- RLS POLICIES - MANUALS (Fixed)
-- ============================================================================

-- Super Admins can manage all manuals
CREATE POLICY "super_admin_all_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- Users can see their organization's manuals
CREATE POLICY "users_org_manuals"
ON manuals FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
  AND status = 'active'
);

-- Org Admins can insert/update/delete their org's manuals
CREATE POLICY "org_admin_manage_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
  AND (SELECT role FROM get_user_profile(auth.uid())) = 'org_admin'
);

-- ============================================================================
-- RLS POLICIES - SAFETY BLACKLIST (Fixed)
-- ============================================================================

-- Super Admins can manage all blacklist rules
CREATE POLICY "super_admin_all_blacklist"
ON safety_blacklist FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- ============================================================================
-- RLS POLICIES - INCIDENTS (Fixed)
-- ============================================================================

-- Super Admins can see all incidents
CREATE POLICY "super_admin_all_incidents"
ON incidents FOR ALL
TO authenticated
USING (
  (SELECT role FROM get_user_profile(auth.uid())) = 'super_admin'
);

-- Users can only see incidents from their organization
CREATE POLICY "users_org_incidents"
ON incidents FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
);

-- Technicians can create/update their own incidents
CREATE POLICY "technicians_own_incidents"
ON incidents FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id = (SELECT org_id FROM get_user_profile(auth.uid()))
);
