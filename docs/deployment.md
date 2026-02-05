# Deployment Guide

This guide describes how to deploy the TechGuard AI platform to production.
The application is designed to be deployed on Vercel, but can be deployed to any platform supporting Next.js (AWS Amplify, Docker, etc.).

## Prerequisites

1.  **Vercel Account**: For hosting the frontend and serverless functions.
2.  **Supabase Project**: Production database, authentication, and storage.
3.  **Google AI Studio Account**: API key for Gemini Pro models.

## Environment Variables

Ensure the following environment variables are set in your production environment (e.g., Vercel Project Settings):

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Service Role Key |
| `SUPABASE_JWT_SECRET` | Production JWT Secret (from Supabase Auth settings) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API Key |
| `NEXT_PUBLIC_APP_URL` | The production URL (e.g., `https://techguard-ai.vercel.app`) |

## Vercel Deployment

1.  **Import Project**: Connect your GitHub repository to Vercel.
2.  **Configure Project**:
    *   **Framework Preset**: Next.js
    *   **Root Directory**: `./`
3.  **Set Environment Variables**: Copy the values from your production Supabase project and AI providers.
4.  **Deploy**: Click "Deploy". Vercel will build the application and deploy it to a global edge network.

## Database Migrations

**Important**: Do not run migrations automatically in the build step unless you have a robust CI/CD pipeline ensuring safety.

Recommended approach for production:

1.  **Local Changes**: Make schema changes locally and generate a migration file.
    ```bash
    supabase db diff -f my_new_migration
    ```
2.  **Push to Production**: Use the Supabase CLI to push migrations to the linked production project.
    ```bash
    supabase link --project-ref your-project-ref
    supabase db push
    ```

## Storage Policies

Ensure your production Supabase Storage buckets (`safety-photos`, `manuals`) exist and have the correct Row Level Security (RLS) policies applied. The application expects:

*   **safety-photos**:
    *   `INSERT`: Authenticated users can upload to their own folders `(bucket_id = 'safety-photos' AND auth.uid() = owner)`.
    *   `SELECT`: Authenticated users can view photos (`bucket_id = 'safety-photos'`).

## CSP & Security Headers

The application includes a `middleware.ts` that sets strict Content Security Policy (CSP) headers.
If you use external scripts or analytics (e.g., Vercel Analytics, Google Analytics), you may need to update the `cspHeader` in `lib/supabase/middleware.ts` to allow those domains.

## Troubleshooting

*   **Build Failures**: Check the build logs. Common issues include type errors or missing environment variables during build time (though Next.js usually inlines `NEXT_PUBLIC_` vars).
*   **Auth Issues**: If users are logged out frequently or redirects fail, verify `NEXT_PUBLIC_APP_URL` matches your deployment domain.
*   **Vision/AI Errors**: Verify the `GOOGLE_GENERATIVE_AI_API_KEY` is valid and has quota available.

