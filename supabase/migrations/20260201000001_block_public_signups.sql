-- Block public signups via database hook
-- This prevents auth.users creation unless done via admin API (service role)
-- Date: 2026-02-01

-- Create function to block public signups
CREATE OR REPLACE FUNCTION public.block_public_signups()
RETURNS TRIGGER AS $$
DECLARE
  request_role text;
BEGIN
  -- Get the role from JWT claims
  -- Service role bypasses this check (used by admin client)
  BEGIN
    request_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    request_role := NULL;
  END;

  -- Allow if request is from service role (admin client)
  IF request_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block all other signup attempts
  RAISE EXCEPTION 'Public signups are disabled. Please use an invite link or contact your administrator.'
    USING HINT = 'Registration is only available through organization invites';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users table
DROP TRIGGER IF EXISTS block_public_signups_trigger ON auth.users;
CREATE TRIGGER block_public_signups_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_public_signups();

-- Add comments
COMMENT ON FUNCTION public.block_public_signups() IS 'Blocks public signups - only allows admin client (service role) registration via invite system';
COMMENT ON TRIGGER block_public_signups_trigger ON auth.users IS 'Enforces invite-only registration by blocking direct user creation';
