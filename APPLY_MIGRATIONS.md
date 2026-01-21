# IMPORTANT: Apply These Migrations to Fix Auth

You need to apply two SQL migrations to your Supabase database to fix the authentication system.

## Migration 1: Add Invite Tokens Table

**File**: `supabase/migrations/20260120000000_add_invite_tokens.sql`

This creates the `invite_tokens` table for managing user invitations.

## Migration 2: Fix Profile RLS Policies (CRITICAL)

**File**: `supabase/migrations/20260120000001_fix_profile_rls.sql`

This fixes the Row Level Security policies that were preventing profile creation during registration.

**The Issue**: When users sign up, they need permission to INSERT their own profile record. The original RLS policies didn't allow this, causing a 401 Unauthorized error.

**The Fix**: Adds two new policies:
- `users_insert_own_profile` - Allows users to create their own profile during registration
- `users_update_own_profile` - Allows users to update their own profile

## How to Apply (Choose One Method)

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/ajffognmxwtwbussgfxx/sql/new

2. **First**, copy and paste the contents of:
   `supabase/migrations/20260120000000_add_invite_tokens.sql`
   
3. Click "Run"

4. **Then**, copy and paste the contents of:
   `supabase/migrations/20260120000001_fix_profile_rls.sql`
   
5. Click "Run"

### Method 2: Via Supabase CLI

```bash
# Make sure you're linked to your project
supabase link --project-ref ajffognmxwtwbussgfxx

# Push all migrations
supabase db push
```

## After Applying Migrations

1. The development server is already running at http://localhost:3000

2. Test the super admin registration:
   - Visit: http://localhost:3000/auth/register/super-admin
   - Fill in the form
   - Submit
   - You should be redirected to the dashboard without errors

3. The profile should be created successfully in the database

## Verify the Fix

After registration, check your Supabase dashboard:
1. Go to Table Editor > profiles
2. You should see your newly created profile with:
   - id: (your auth user ID)
   - org_id: NULL
   - role: super_admin
   - full_name: (what you entered)

## Changes Made to UI

✅ Removed "Create Super Admin Account" link from login page
✅ Removed "Already have an account? Sign In" link from super admin registration page
✅ Login page now only shows "Have an invite code? Register with Invite"

## Next Steps After Successful Registration

1. Create an organization from the dashboard
2. Generate invite links for org_admin and technician users
3. Test the invite-based registration flow
