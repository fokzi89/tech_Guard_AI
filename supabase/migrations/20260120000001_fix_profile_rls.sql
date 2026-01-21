-- Fix RLS policies to allow profile creation during registration
-- Date: 2026-01-20

-- Drop the existing super_admin_all_profiles policy and recreate it properly
DROP POLICY IF EXISTS "super_admin_all_profiles" ON profiles;

-- Super Admins can do everything with all profiles
CREATE POLICY "super_admin_all_profiles"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Allow users to insert their own profile during registration
-- This is critical for the signup flow
CREATE POLICY "users_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

COMMENT ON POLICY "users_insert_own_profile" ON profiles IS 'Allows users to create their own profile during registration';
COMMENT ON POLICY "users_update_own_profile" ON profiles IS 'Allows users to update their own profile information';
