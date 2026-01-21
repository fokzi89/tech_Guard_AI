# Supabase Database Setup Guide

This guide will help you set up the TechGuard AI database using Supabase for local development.

## Prerequisites

- **Node.js**: 20.x or later
- **Docker Desktop**: Required for running Supabase locally (Download: https://www.docker.com/products/docker-desktop/)
- **Git**: For version control

## Step 1: Install Supabase CLI

The Supabase CLI cannot be installed via `npm install -g supabase` anymore. Use one of the following methods:

### Windows (Recommended Methods)

**Option A: Using Scoop**
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option B: Using Chocolatey**
```powershell
# Install Chocolatey if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Supabase CLI
choco install supabase
```

**Option C: Direct Binary Download**
1. Download the latest Windows binary from: https://github.com/supabase/cli/releases
2. Extract the executable to a folder (e.g., `C:\supabase`)
3. Add the folder to your PATH environment variable
4. Restart your terminal

### macOS
```bash
brew install supabase/tap/supabase
```

### Linux
```bash
# Download and install
curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
sudo mv supabase /usr/local/bin/
```

### Verify Installation
```bash
supabase --version
```

You should see output like: `1.x.x` or similar.

## Step 2: Start Docker Desktop

Supabase CLI uses Docker to run PostgreSQL, PostgREST, and other services locally.

1. Open Docker Desktop
2. Wait for Docker to fully start (the Docker icon in system tray should stop animating)
3. Verify Docker is running:
   ```bash
   docker --version
   docker ps
   ```

## Step 3: Initialize Supabase

From your project root (`techguard_ai/`), run:

```bash
supabase init
```

This creates the `supabase/` directory with configuration files. **Note**: We've already created this directory with migrations, so this step may show "already initialized" - that's okay!

## Step 4: Start Supabase Local Development

```bash
supabase start
```

This command will:
- Pull Docker images (first time only - may take 5-10 minutes)
- Start PostgreSQL database
- Start Supabase Studio UI
- Start API server
- Generate local API keys

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Copy the `anon key` and `service_role key` - you'll need these for your `.env.local` file.

## Step 5: Apply Database Migration

The migration file has already been created at `supabase/migrations/20260119000000_initial_schema.sql`.

Apply it with:

```bash
supabase db reset
```

This command:
- Drops the existing database (if any)
- Applies all migrations in `supabase/migrations/`
- Runs the seed data from `supabase/seed.sql`

**Expected Output:**
```
Applying migration 20260119000000_initial_schema.sql...
Seeding data from supabase/seed.sql...
TechGuard AI seed data loaded successfully!
```

## Step 6: Verify Database Schema

Open Supabase Studio:
```
http://localhost:54323
```

Navigate to:
1. **Table Editor**: You should see 7 tables:
   - organizations
   - profiles
   - manuals
   - safety_blacklist
   - incidents
   - conversation_messages
   - service_reports

2. **Database > Policies**: Verify RLS policies are enabled for all tables

3. **Database > Extensions**: Verify `vector` extension is enabled

## Step 7: Generate TypeScript Types

Generate TypeScript types from your database schema:

```bash
supabase gen types typescript --local > types/database.ts
```

This creates type-safe interfaces for all your database tables that you can use in your Next.js application.

## Step 8: Create Test Users

You'll need to create test users via Supabase Auth:

### Method 1: Via Supabase Studio (Easiest)

1. Open Studio: http://localhost:54323
2. Go to **Authentication** > **Users**
3. Click **Add User**
4. Create the following users:

**Super Admin:**
- Email: `admin@techguard.ai`
- Password: `test1234`
- Confirm Password: `test1234`
- Click **Create User**
- Copy the User UUID

**ACME Org Admin:**
- Email: `orgadmin@acme.com`
- Password: `test1234`

**ACME Technician:**
- Email: `tech1@acme.com`
- Password: `test1234`

### Method 2: Via API

```bash
curl -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techguard.ai",
    "password": "test1234"
  }'
```

## Step 9: Link Users to Profiles

After creating auth users, you need to link them to profiles in the database.

1. Open Studio: http://localhost:54323
2. Go to **Table Editor** > **profiles**
3. Click **Insert** > **Insert row**
4. Fill in:
   - **id**: (paste User UUID from auth.users)
   - **org_id**: NULL (for super_admin) or organization UUID
   - **role**: `super_admin`, `org_admin`, or `technician`
   - **full_name**: User's full name

**Example Super Admin Profile:**
```sql
INSERT INTO profiles (id, org_id, role, full_name) VALUES
  ('USER_UUID_HERE', NULL, 'super_admin', 'System Administrator');
```

**Example Org Admin Profile (ACME):**
```sql
INSERT INTO profiles (id, org_id, role, full_name) VALUES
  ('USER_UUID_HERE', '22222222-2222-2222-2222-222222222222', 'org_admin', 'Jane Smith');
```

## Step 10: Configure Next.js Environment Variables

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step_4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_4

# AI Providers (add these later when needed)
# GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
# ANTHROPIC_API_KEY=your_claude_api_key
# OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Commands

### Start Supabase
```bash
supabase start
```

### Stop Supabase
```bash
supabase stop
```

### Reset Database (reapply all migrations + seed)
```bash
supabase db reset
```

### View Logs
```bash
supabase logs
```

### Check Status
```bash
supabase status
```

### Generate Types
```bash
supabase gen types typescript --local > types/database.ts
```

## Troubleshooting

### Error: "Docker is not running"
- Make sure Docker Desktop is open and running
- Check Docker icon in system tray

### Error: "Port already in use"
- Another service is using Supabase's default ports
- Stop conflicting services or change ports in `supabase/config.toml`

### Error: "Migration failed"
- Check the migration file for syntax errors
- View logs: `supabase logs`
- Try resetting: `supabase db reset`

### Types Not Generated
- Make sure Supabase is running: `supabase status`
- Create `types/` directory if it doesn't exist: `mkdir types`
- Run: `supabase gen types typescript --local > types/database.ts`

### Can't Access Supabase Studio
- Verify Supabase is running: `supabase status`
- Open: http://localhost:54323
- Check firewall settings

## Next Steps

After completing this setup:

1. **Verify the schema**: Check that all 7 tables exist in Supabase Studio
2. **Test RLS policies**: Try querying data as different users
3. **Start Next.js dev server**: `npm run dev`
4. **Begin implementing User Story 1**: Safe Troubleshooting (Tasks T044-T078)

## Database Schema Overview

Your database now includes:

- **7 Tables**: organizations, profiles, manuals, safety_blacklist, incidents, conversation_messages, service_reports
- **20 Indexes**: Including 2 pgvector indexes for embeddings
- **18 RLS Policies**: Enforcing multi-tenant data isolation
- **2 Database Functions**: check_safety_blacklist, search_manuals
- **4 Triggers**: Auto-update timestamps

All tables have Row Level Security (RLS) enabled, ensuring that:
- Technicians can only access their organization's data
- Org Admins can manage their organization
- Super Admins have global access for support

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **pgvector Guide**: https://supabase.com/docs/guides/ai/vector-columns
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Local Development**: https://supabase.com/docs/guides/cli/local-development
