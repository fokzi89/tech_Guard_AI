-- Function to check if user is super_admin securely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- Function to get the current user's org_id securely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT org_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Org members can see colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;

-- 1. Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Super Admin full access (uses the function to avoid recursion)
CREATE POLICY "Super admin full access" ON public.profiles
FOR ALL
USING (public.is_super_admin());

-- 3. Org members can see colleagues (uses the function to avoid recursion)
CREATE POLICY "Org members can see colleagues" ON public.profiles
FOR SELECT
USING (
  org_id = public.get_my_org_id()
);
