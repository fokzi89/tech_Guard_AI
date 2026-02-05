# Creating Super Admin Users

## Overview

Super admins are the highest-level users in TechGuard AI with full system access. They are created directly in the Supabase Dashboard, not through the application UI.

**Super Admin Capabilities:**
- Create and manage organizations
- Generate invite links for org admins and technicians
- Impersonate users for support
- Access all system features
- View audit logs

## Prerequisites

- Access to Supabase Dashboard (https://supabase.com/dashboard)
- Project admin permissions
- Service role key (for profile creation script)

---

## Method 1: Supabase Dashboard + SQL (Recommended)

### Step 1: Create Auth User

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in the form:
   - **Email**: Super admin email address
   - **Password**: Strong password (or auto-generate)
   - **Auto Confirm User**: ✅ **Check this box** (enables immediate login)
   - **Email Confirm**: Leave unchecked (we're auto-confirming)
5. Click **"Create user"**
6. **Copy the User ID** (you'll need this for Step 2)

### Step 2: Create Profile Record

1. In Supabase Dashboard, navigate to **SQL Editor**
2. Click **"New query"**
3. Paste the following SQL:

```sql
-- Replace these values:
-- 'USER_ID_HERE' = The UUID from Step 1
-- 'Full Name' = The super admin's full name

INSERT INTO profiles (id, org_id, role, full_name)
VALUES (
  'USER_ID_HERE',  -- User ID from Step 1
  NULL,            -- Super admins have no org_id
  'super_admin',   -- Role
  'Full Name'      -- Replace with actual name
);
```

4. Replace the placeholders:
   - `'USER_ID_HERE'` → User ID from Step 1
   - `'Full Name'` → Actual full name

5. Click **"Run"** or press `Ctrl+Enter`

### Step 3: Verify Creation

Run this query to verify the super admin was created correctly:

```sql
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  p.org_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'super-admin-email@example.com';  -- Replace with the email
```

**Expected result:**
- ✅ `email_confirmed_at` should have a timestamp (not null)
- ✅ `role` should be `'super_admin'`
- ✅ `org_id` should be `NULL`
- ✅ `full_name` should be set

### Step 4: Test Login

1. Go to your app login page: `http://localhost:3000/auth/login`
2. Enter the super admin email and password
3. You should be redirected to the dashboard with super admin access

---

## Method 2: Using Scripts (Automated)

### Create Super Admin Script

Create a script to automate super admin creation:

**File:** `scripts/create-super-admin.js`

```javascript
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
  console.log('=== Create Super Admin ===\n');

  const email = await question('Email address: ');
  const password = await question('Password: ');
  const fullName = await question('Full name: ');

  console.log('\nCreating super admin...');

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError.message);
    rl.close();
    return;
  }

  console.log('✅ Auth user created:', authData.user.id);

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      org_id: null,
      role: 'super_admin',
      full_name: fullName
    });

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
    console.log('   Cleaning up auth user...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    rl.close();
    return;
  }

  console.log('✅ Profile created');
  console.log('\n✅ Super admin created successfully!');
  console.log(`   Email: ${email}`);
  console.log(`   User ID: ${authData.user.id}`);
  console.log('\nYou can now log in with these credentials.');

  rl.close();
}

createSuperAdmin().catch(console.error);
```

### Run the Script

```bash
node scripts/create-super-admin.js
```

Follow the prompts to enter:
- Email address
- Password
- Full name

---

## Method 3: SQL Only (Quick)

If you prefer SQL only, run this single command:

```sql
-- Step 1: Create the user (you'll need to do this via Dashboard first to get password hash)
-- OR use this approach:

-- After creating user in Dashboard with ID 'USER_ID_HERE':
DO $$
DECLARE
  user_id uuid := 'USER_ID_HERE';  -- Replace with actual user ID
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, org_id, role, full_name)
  VALUES (user_id, NULL, 'super_admin', 'Full Name Here');

  -- Confirm the user's email
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id;
END $$;
```

---

## Troubleshooting

### Issue: Profile creation fails with "violates foreign key constraint"

**Cause:** The auth user doesn't exist yet.

**Solution:** Make sure you created the auth user first (Step 1).

### Issue: User can't log in - "Invalid login credentials"

**Possible causes:**
1. Email not confirmed → Check `email_confirmed_at` is not null
2. Wrong password → Reset via Supabase Dashboard
3. Profile doesn't exist → Check profiles table

**Fix:**
```sql
-- Check user status
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'email@example.com';

-- Confirm email if needed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'email@example.com';

-- Check profile exists
SELECT * FROM profiles WHERE id = 'USER_ID_HERE';
```

### Issue: User logs in but gets errors

**Cause:** Profile exists but has wrong data.

**Solution:** Verify profile data:
```sql
SELECT
  p.id,
  p.role,
  p.full_name,
  p.org_id,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'email@example.com';
```

Expected values:
- `role` = `'super_admin'`
- `org_id` = `NULL`

---

## Super Admin Dashboard Features

Once logged in as super admin, you can:

### 1. Create Organizations

From `/dashboard`:
- Click **"Create Organization"**
- Enter organization name
- Select subscription tier (basic, professional, enterprise)

### 2. Generate Invite Links

From organization details or user management:
- Click **"Invite User"**
- Select organization
- Enter email address
- Choose role:
  - **Organization Admin** - Can manage their organization
  - **Technician** - Can use troubleshooting features
- Copy invite link and send to user

### 3. Manage Users

- View all organizations
- View users in each organization
- Suspend organizations
- Impersonate users for support

---

## Security Best Practices

1. **Limit Super Admin Accounts**
   - Only create super admins when absolutely necessary
   - Typical setup: 1-2 super admins for the entire system

2. **Use Strong Passwords**
   - Minimum 12 characters
   - Include uppercase, lowercase, numbers, symbols
   - Consider using a password manager

3. **Enable 2FA** (if available in Supabase)
   - Go to Supabase Dashboard → Project Settings → Authentication
   - Enable multi-factor authentication

4. **Regular Audits**
   - Review super admin accounts regularly
   - Remove accounts that are no longer needed
   - Check audit logs for suspicious activity

5. **Restrict Access**
   - Only share super admin credentials with trusted personnel
   - Use invite links for all other users
   - Never share service role keys

---

## Audit Log

Check super admin activity:

```sql
SELECT
  u.email,
  u.last_sign_in_at,
  p.role,
  p.created_at as profile_created
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.role = 'super_admin'
ORDER BY u.last_sign_in_at DESC;
```

---

## Quick Reference

### Check All Super Admins

```sql
SELECT
  u.email,
  p.full_name,
  u.created_at,
  u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'super_admin'
ORDER BY u.created_at DESC;
```

### Delete Super Admin (if needed)

```sql
-- This will cascade delete the profile due to foreign key
DELETE FROM auth.users
WHERE id = 'USER_ID_HERE';
```

### Change User to Super Admin

```sql
UPDATE profiles
SET role = 'super_admin', org_id = NULL
WHERE id = 'USER_ID_HERE';
```

---

## Next Steps

After creating your first super admin:

1. ✅ Log in and verify access
2. ✅ Create your first organization
3. ✅ Generate invite links for org admins
4. ✅ Test the invite flow
5. ✅ Document your organization structure

---

**Last Updated:** 2026-02-01
**Version:** 1.0.0
