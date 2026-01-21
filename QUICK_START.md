# Quick Start - Apply Invite Tokens Migration

## Step 1: Apply the Migration to Supabase

Since you've already integrated the database, you need to apply the new `invite_tokens` table migration.

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/ajffognmxwtwbussgfxx/sql/new
2. Copy and paste the entire contents of: `supabase/migrations/20260120000000_add_invite_tokens.sql`
3. Click "Run" to execute the SQL

### Option B: Via SQL Editor in Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Paste the migration SQL
5. Execute

## Step 2: Test the Auth System

The development server is now running at: http://localhost:3000

### Test Flow:

1. **Register as Super Admin**
   - Visit: http://localhost:3000/auth/register/super-admin
   - Fill in your details
   - Submit the form

2. **Create an Organization**
   - After registration, you'll be on the dashboard
   - Click "Create Organization"
   - Enter organization name (e.g., "ACME Corp")
   - Select subscription tier

3. **Generate Invite Link**
   - Click "Invite User"
   - Select the organization you just created
   - Enter an email address
   - Choose role (org_admin or technician)
   - Copy the generated invite link

4. **Test Invite Registration**
   - Open the invite link in a new incognito/private window
   - Complete the registration
   - Login with the new account

## Migration SQL Location

The migration file is located at:
`c:\Users\AFOKE\techguard_ai\supabase\migrations\20260120000000_add_invite_tokens.sql`

## What the Migration Does

- Creates `invite_tokens` table
- Adds indexes for performance
- Sets up Row Level Security (RLS) policies
- Allows super_admin and org_admin to manage invites
- Allows anonymous users to read valid tokens (for signup)

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify the migration was applied successfully in Supabase Dashboard
