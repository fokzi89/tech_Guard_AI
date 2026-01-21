# TechGuard AI Authentication System

## Overview

The authentication system implements a role-based access control with three user types:
- **Super Admin**: Can register directly, create organizations, and invite users
- **Org Admin**: Can only register via invite link, manage their organization
- **Technician**: Can only register via invite link, use troubleshooting tools

## Database Migration

A new migration has been created: `supabase/migrations/20260120000000_add_invite_tokens.sql`

### Apply the Migration

You can apply this migration in two ways:

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project: `ajffognmxwtwbussgfxx`
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/20260120000000_add_invite_tokens.sql`
5. Paste and run the SQL

**Option 2: Via Supabase CLI**
```bash
# Link to your remote project (if not already linked)
supabase link --project-ref ajffognmxwtwbussgfxx

# Push the new migration
supabase db push
```

## Authentication Pages

### 1. Super Admin Registration
**URL**: `/auth/register/super-admin`

Features:
- Direct registration (no invite needed)
- Creates user with `super_admin` role
- No organization association

### 2. Login Page
**URL**: `/auth/login`

Features:
- Email/password authentication
- Links to super admin registration
- Links to invite-based registration

### 3. Invite-Based Registration
**URL**: `/invite/[token]`

Features:
- Verifies invite token
- Shows organization and role information
- Completes registration for org_admin and technician roles

### 4. Dashboard
**URL**: `/dashboard`

Features:
- **Super Admin View**:
  - Create organizations
  - Generate invite links for org_admin and technician
  - View all organizations
  
- **Org Admin View**:
  - Manage organization users (coming soon)
  - View organization settings (coming soon)
  
- **Technician View**:
  - Access troubleshooting tools (coming soon)

## User Flow

### Super Admin Flow
1. Visit `/auth/register/super-admin`
2. Fill in registration form
3. Redirected to `/dashboard`
4. Create organization(s)
5. Generate invite links for users

### Org Admin / Technician Flow
1. Receive invite link from super admin (e.g., `/invite/abc123-xyz789`)
2. Click invite link
3. See organization details and assigned role
4. Complete registration with password
5. Redirected to `/dashboard`

## Invite Token System

### Generating Invites

From the dashboard, super admins can:
1. Select an organization
2. Enter user email
3. Choose role (org_admin or technician)
4. Generate invite link

The system will:
- Create a unique token
- Set expiration (7 days default)
- Generate shareable link
- Store in `invite_tokens` table

### Invite Link Format
```
http://localhost:3000/invite/[unique-token]
```

### Token Security
- Tokens are unique UUIDs + timestamp
- Expire after 7 days
- Can only be used once
- Tied to specific email and organization

## Testing the System

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Create Super Admin
1. Visit http://localhost:3000/auth/register/super-admin
2. Register with:
   - Full Name: "System Admin"
   - Email: "admin@techguard.ai"
   - Password: (your choice)

### Step 3: Create Organization
1. After login, you'll be on the dashboard
2. Click "Create Organization"
3. Enter organization name (e.g., "ACME Corp")
4. Select subscription tier

### Step 4: Invite Users
1. Click "Invite User"
2. Select the organization
3. Enter user email
4. Choose role (org_admin or technician)
5. Copy the generated invite link

### Step 5: Test Invite Registration
1. Open the invite link in a new browser/incognito window
2. Complete registration
3. Verify user can login

## Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ajffognmxwtwbussgfxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Features

1. **Row Level Security (RLS)**: All tables have RLS policies
2. **Role-based Access**: Users can only access data for their organization
3. **Token Expiration**: Invite tokens expire after 7 days
4. **One-time Use**: Tokens are marked as used after registration
5. **Email Verification**: Tokens are tied to specific email addresses

## API Services

The `authService` provides:
- `registerSuperAdmin()` - Create super admin account
- `createOrganization()` - Create new organization
- `generateInviteToken()` - Generate invite for user
- `verifyInviteToken()` - Verify invite is valid
- `registerWithInvite()` - Complete invite-based registration
- `signIn()` - User login
- `signOut()` - User logout
- `getCurrentUser()` - Get authenticated user with profile
- `getAllOrganizations()` - Get all orgs (super admin only)
- `getOrganizationUsers()` - Get users in organization
- `getPendingInvites()` - Get pending invites for organization

## Next Steps

After testing the auth system:
1. Implement organization management features
2. Add user management for org admins
3. Build technician troubleshooting interface
4. Add email notifications for invites
5. Implement password reset flow
