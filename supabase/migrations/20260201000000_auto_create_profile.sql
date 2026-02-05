-- Automatically create profile when a new user signs up
-- This prevents orphaned users (auth users without profiles)
-- Date: 2026-02-01

-- Create a function to automatically create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, org_id, role, full_name)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'org_id')::uuid,
      COALESCE(NEW.raw_user_meta_data->>'role', 'technician'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile creation for new auth users';
