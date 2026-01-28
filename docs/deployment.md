# TechGuard AI - Deployment Guide

## Prerequisites

- **Supabase Project**: You need a standard Supabase project (Free tier works).
- **Vercel Account**: For frontend hosting.
- **OpenAI API Key**: For embeddings.
- **Google GenAI API Key**: For Gemini models.

## Environment Variables

Configure the following in Vercel and Supabase:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** Service Role Key (Server-side only) |
| `SUPABASE_JWT_SECRET` | **SECRET** JWT Secret for signing tokens |
| `OPENAI_API_KEY` | For `text-embedding-3-small` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For Gemini models |

## Step 1: Database Setup

1. **Clone the repo locally.**
2. **Execute Migrations**:
   Run the following SQL files in the Supabase Dashboard > SQL Editor in order:
   - `supabase/migrations/20260119000000_initial_schema.sql` (Creates tables)
   - `supabase/migrations/20260126000000_storage_setup.sql` (Storage setup)
   - Any other migration files in `supabase/migrations/` in date order.

3. **Verify Extensions**:
   Ensure `vector` extension is enabled. Migration should handle this.

4. **Seed Data (Optional)**:
   You can run `npx tsx scripts/seed-data.ts` locally if connected to production, OR copy `supabase/seed.sql` content into the SQL editor.
   *Note: `seed.sql` creates raw data but doesn't create Auth Users. Use the script for functional users.*

## Step 2: Storage Setup

Ensure the following private buckets exist in Storage:
- `manuals`
- `safety-proofs`

*The migration script should attempt to create these.*

## Step 3: Frontend Deployment (Vercel)

1. Import the repository into Vercel.
2. Select Next.js framework preset (default).
3. Add the **Environment Variables** listed above.
4. Deploy.

## Step 4: Verification

1. Go to the deployed URL.
2. Log in with the Super Admin credentials (or sign up if you didn't seed).
   - If seeded: `super@techguard.ai` / `password123`
3. Verify Dashboard loads.
4. Go to `/troubleshoot/new` and start a session.

## Troubleshooting

- **RLS Errors**: Check RLS policies in `supabase/migrations`.
- **CORS Errors**: Ensure Supabase Project settings allow your Vercel domain.
- **Vision/AI Errors**: Verify Google API keys and ensuring Gemini 1.5 Pro is enabled in your Google Cloud project.

---
**TechGuard AI MVP - 2026**
