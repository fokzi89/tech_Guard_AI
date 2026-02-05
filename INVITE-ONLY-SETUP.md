# Invite-Only User Registration System

## Overview

TechGuard AI uses an **invite-only registration system** where:
- ✅ **Regular users** (org_admin, technician) can ONLY register via invite tokens
- ✅ **Super admins** can self-register with a secret key (for initial setup only)
- ❌ **Direct public signups** are blocked

## Security Measures Implemented

### 1. Removed Vulnerable Client-Side Methods ✅

**Removed from `lib/services/auth.service.ts`:**
- `registerSuperAdmin()` - Used insecure client-side signup
- `registerWithInvite()` - Used insecure client-side signup

**Replacement:**
All registration now uses server actions in `lib/actions/auth.actions.ts` with admin client:
- `registerSuperAdmin()` - Uses `adminClient.auth.admin.createUser()`
- `registerWithInvite()` - Uses `adminClient.auth.admin.createUser()`

### 2. Super Admin Registration Protected with Secret Key ✅

**File:** `app/auth/register/super-admin/page.tsx`

Requires `NEXT_PUBLIC_SUPER_ADMIN_SECRET` environment variable.

**Setup:**
```bash
# Add to .env.local
NEXT_PUBLIC_SUPER_ADMIN_SECRET=your-secure-random-key-here
```

**Generate a secure key:**
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online
# Use: https://www.uuidgenerator.net/
```

**Usage:**
1. Go to: `http://localhost:3000/auth/register/super-admin`
2. Enter the secret key from your `.env.local`
3. Complete registration

### 3. Disable Public Signups in Supabase ⚠️ **ACTION REQUIRED**

You MUST disable public signups in your Supabase project:

#### Option A: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to **"Email Auth"** section
5. **DISABLE** "Enable email confirmations"
6. **DISABLE** "Enable email signup"
7. Click **Save**

#### Option B: Supabase Local (Development)

Edit `supabase/config.toml`:

```toml
[auth]
# Disable public signups
enable_signup = false

# Email settings
[auth.email]
# Disable email signup
enable_signup = false
# Disable confirmations (we auto-confirm via admin client)
enable_confirmations = false
```

Apply changes:
```bash
supabase stop
supabase start
```

### 4. Database-Level Protection (Optional but Recommended)

Create a database hook to block unauthorized user creation:

**File:** `supabase/migrations/20260201000001_block_public_signups.sql`

```sql
-- Block public signups via database hook
-- This prevents auth.users creation unless done via admin API
CREATE OR REPLACE FUNCTION public.block_public_signups()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if request is from service role (admin client)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block all other signup attempts
  RAISE EXCEPTION 'Public signups are disabled. Please use an invite link.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users
DROP TRIGGER IF EXISTS block_public_signups_trigger ON auth.users;
CREATE TRIGGER block_public_signups_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_public_signups();

COMMENT ON FUNCTION public.block_public_signups() IS 'Blocks public signups - only allows admin client registration';
```

**Apply migration:**
```bash
supabase db push
```

## How It Works

### Regular User Registration Flow

1. **Admin creates invite:**
   - Super admin or org admin generates invite via dashboard
   - Invite link: `https://your-app.com/invite/{token}`
   - Token expires after 7 days (configurable)

2. **User receives invite:**
   - Email sent with invite link (implement email sending separately)
   - Or admin shares link directly

3. **User registers:**
   - Opens invite link: `/invite/{token}`
   - Token is verified (checks: valid, not used, not expired)
   - User enters password and full name
   - Server action `registerWithInvite()` creates user via admin client
   - Profile automatically created
   - Invite marked as used

4. **User logs in:**
   - Redirected to dashboard after registration
   - Or can use `/auth/login` anytime

### Super Admin Registration Flow (Initial Setup Only)

1. **Navigate to:** `/auth/register/super-admin`
2. **Enter secret key** from `NEXT_PUBLIC_SUPER_ADMIN_SECRET`
3. **Complete registration**
4. **Server validates key** and creates user via admin client

⚠️ **Security Note:** This page should be removed or disabled in production after initial setup.

## Invite Management

### Creating Invites

**Via Dashboard:**
```typescript
// Super admin or org admin can create invites
const { generateInviteToken } = await import('@/lib/actions/auth.actions')

const result = await generateInviteToken(
  'org-id-here',
  'user@example.com',
  'technician', // or 'org_admin'
  7 // expires in 7 days
)

if (result.success) {
  console.log('Invite link:', result.inviteLink)
  // Send email with result.inviteLink
}
```

### Checking Invite Status

```bash
# Run diagnostic script
node scripts/check-invite-status.js
```

## Testing Invite-Only System

### Test 1: Verify Public Signups Blocked

Try to signup directly via Supabase client:

```javascript
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(URL, ANON_KEY)

// This SHOULD FAIL if properly configured
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

console.log('Error:', error) // Should show signup disabled error
```

### Test 2: Verify Invite Registration Works

1. Create invite via dashboard
2. Open invite link
3. Complete registration
4. Verify:
   - User created in `auth.users`
   - Profile created in `profiles`
   - Invite marked as used in `invite_tokens`

### Test 3: Verify Super Admin Registration Requires Secret

1. Go to `/auth/register/super-admin`
2. Try with wrong secret → Should fail
3. Try with correct secret → Should succeed

## Monitoring and Auditing

### Check for Orphaned Users

Run regularly to find auth users without profiles:

```bash
node scripts/check-auth-state.js
```

Output shows:
- All auth users
- Which users have profiles
- Which users are orphaned (❌ NO PROFILE)

### Check Invite Usage

Query pending invites:

```sql
SELECT
  email,
  role,
  created_at,
  expires_at,
  used
FROM invite_tokens
WHERE used = false
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Audit Recent Registrations

```sql
SELECT
  u.email,
  u.created_at,
  p.role,
  p.full_name,
  o.name as organization
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.org_id
ORDER BY u.created_at DESC
LIMIT 10;
```

## Security Checklist

Before going to production, verify:

- [ ] `NEXT_PUBLIC_SUPER_ADMIN_SECRET` is set in `.env.local` / production env
- [ ] Supabase public signups disabled (Dashboard → Auth → Settings)
- [ ] Database trigger applied (optional but recommended)
- [ ] Super admin registration page removed or secured in production
- [ ] Email sending configured for invite links
- [ ] Invite expiration period configured appropriately
- [ ] RLS policies tested for all tables
- [ ] Audit scripts accessible for monitoring

## Environment Variables Required

```bash
# .env.local

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Super Admin Registration (required for initial setup)
NEXT_PUBLIC_SUPER_ADMIN_SECRET=your-secure-random-key-here

# App URL (required for invite links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Troubleshooting

### Issue: Users can still signup directly

**Solution:**
1. Check Supabase dashboard: Auth → Settings → Email signup (must be disabled)
2. Apply database trigger migration
3. Verify `.env` has correct service role key

### Issue: Invite links not working

**Solution:**
1. Check token hasn't expired: `expires_at > NOW()`
2. Check token hasn't been used: `used = false`
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly
4. Check browser console for errors

### Issue: Super admin registration failing

**Solution:**
1. Verify `NEXT_PUBLIC_SUPER_ADMIN_SECRET` is set
2. Check secret key matches exactly (no spaces)
3. Restart dev server after adding env var
4. Check browser console for validation errors

## Production Deployment

### Vercel / Netlify

Add environment variables:
```bash
NEXT_PUBLIC_SUPER_ADMIN_SECRET=your-production-secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Post-Deployment

1. **Disable super admin registration page:**
   - Option 1: Add middleware to block route
   - Option 2: Delete `app/auth/register/super-admin/page.tsx`
   - Option 3: Add IP whitelist

2. **Configure email sending for invites:**
   - Set up SMTP or email service
   - Update invite generation to send emails
   - Test email delivery

3. **Monitor audit logs:**
   - Set up regular audits
   - Alert on orphaned users
   - Track invite usage

## Support

For issues or questions:
1. Check this documentation
2. Run diagnostic scripts
3. Check browser console and server logs
4. Review Supabase Auth logs in dashboard

---

**Last Updated:** 2026-02-01
**Version:** 1.0.0
**Status:** ✅ Invite-only system active
