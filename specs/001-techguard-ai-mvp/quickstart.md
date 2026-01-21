# Quickstart Guide: TechGuard AI

**Last Updated**: 2026-01-19
**Branch**: `001-techguard-ai-mvp`

## Overview

This guide will help you set up a local development environment for TechGuard AI and understand the key development workflows.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 20.x or later ([Download](https://nodejs.org/))
- **npm**: 10.x or later (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **VS Code** (recommended): With ESLint and Prettier extensions
- **Supabase CLI**: For local database development
  ```bash
  npm install -g supabase
  ```

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/techguard-ai.git
cd techguard-ai

# Checkout the feature branch
git checkout 001-techguard-ai-mvp

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Providers (choose one or both)
# Option 1: Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Option 2: Anthropic Claude
ANTHROPIC_API_KEY=your-claude-api-key

# Option 3: OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Supabase Local Development

```bash
# Initialize Supabase (first time only)
supabase init

# Start local Supabase instance
supabase start
```

This will start:
- PostgreSQL database on `localhost:54322`
- Supabase Studio UI on `http://localhost:54323`
- API server on `http://localhost:54321`

**Note**: Copy the `anon key` and `service_role key` from the output into your `.env.local`.

### 4. Run Database Migrations

```bash
# Apply the initial schema
supabase db reset
```

This creates all tables, indexes, and RLS policies from `supabase/migrations/`.

### 5. Seed Test Data (Optional)

```bash
# Load sample organizations, users, and manuals
supabase db seed
```

Test users created:
- **Super Admin**: `admin@techguard.ai` / password: `test1234`
- **Org Admin**: `orgadmin@acme.com` / password: `test1234`
- **Technician**: `tech1@acme.com` / password: `test1234`

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
techguard-ai/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard routes
│   ├── api/                 # API routes
│   └── components/          # React components
├── lib/                     # Business logic
│   ├── agents/              # AI agents (Guardian, Diagnostician, Curator)
│   ├── supabase/            # Database clients
│   └── rag/                 # RAG engine
├── types/                   # TypeScript types
├── tests/                   # Test suites
├── supabase/                # Database migrations & seeds
└── specs/                   # Feature specifications & planning docs
```

---

## Key Development Workflows

### Workflow 1: Add a New UI Component

1. Create component file in `app/components/{category}/`
   ```bash
   mkdir -p app/components/chat
   touch app/components/chat/MessageList.tsx
   ```

2. Define TypeScript props interface:
   ```typescript
   interface MessageListProps {
     messages: Message[];
     onMessageClick?: (id: string) => void;
   }
   ```

3. Build component using Shadcn/UI primitives:
   ```bash
   # Add Shadcn component
   npx shadcn-ui@latest add card
   ```

4. Write unit test:
   ```typescript
   // tests/unit/components/MessageList.test.tsx
   import { render, screen } from '@testing-library/react';
   import { MessageList } from '@/app/components/chat/MessageList';

   describe('MessageList', () => {
     it('renders messages', () => {
       const messages = [{ id: '1', content: 'Hello', role: 'user' }];
       render(<MessageList messages={messages} />);
       expect(screen.getByText('Hello')).toBeInTheDocument();
     });
   });
   ```

5. Run tests:
   ```bash
   npm test -- MessageList
   ```

---

### Workflow 2: Create a New API Route

1. Create route file under `app/api/`:
   ```bash
   mkdir -p app/api/example
   touch app/api/example/route.ts
   ```

2. Implement GET/POST handlers:
   ```typescript
   // app/api/example/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createServerClient } from '@/lib/supabase/server';

   export async function GET(request: NextRequest) {
     const supabase = createServerClient();

     // Your logic here
     const { data, error } = await supabase
       .from('your_table')
       .select('*');

     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json({ data });
   }
   ```

3. Add Zod validation:
   ```typescript
   import { z } from 'zod';

   const schema = z.object({
     name: z.string().min(1),
     email: z.string().email(),
   });

   export async function POST(request: NextRequest) {
     const body = await request.json();
     const validated = schema.parse(body); // Throws if invalid

     // Process validated data...
   }
   ```

4. Test the endpoint:
   ```bash
   curl http://localhost:3000/api/example
   ```

---

### Workflow 3: Add a Database Table

1. Create a new migration:
   ```bash
   supabase migration new add_my_table
   ```

2. Edit the migration file in `supabase/migrations/`:
   ```sql
   -- supabase/migrations/20260119_add_my_table.sql
   CREATE TABLE my_table (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     created_at timestamptz DEFAULT now()
   );

   -- Add RLS policies
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "users_own_data"
   ON my_table FOR ALL
   TO authenticated
   USING (user_id = auth.uid());
   ```

3. Apply the migration:
   ```bash
   supabase db reset
   ```

4. Generate TypeScript types:
   ```bash
   supabase gen types typescript --local > types/database.ts
   ```

5. Use the new table:
   ```typescript
   const { data } = await supabase
     .from('my_table')
     .select('*');
   ```

---

### Workflow 4: Implement a New AI Agent

1. Create agent file in `lib/agents/`:
   ```typescript
   // lib/agents/my-agent.ts
   import { generateText } from 'ai';
   import { google } from '@ai-sdk/google';

   export interface MyAgentInput {
     userMessage: string;
   }

   export interface MyAgentOutput {
     response: string;
     confidence: number;
   }

   export async function runMyAgent(input: MyAgentInput): Promise<MyAgentOutput> {
     const { text } = await generateText({
       model: google('models/gemini-1.5-pro'),
       system: 'You are a helpful assistant.',
       prompt: input.userMessage,
     });

     return {
       response: text,
       confidence: 0.95,
     };
   }
   ```

2. Add unit tests:
   ```typescript
   // tests/unit/agents/my-agent.test.ts
   import { runMyAgent } from '@/lib/agents/my-agent';

   describe('MyAgent', () => {
     it('generates a response', async () => {
       const result = await runMyAgent({ userMessage: 'Hello' });
       expect(result.response).toBeTruthy();
       expect(result.confidence).toBeGreaterThan(0);
     });
   });
   ```

3. Integrate into API route:
   ```typescript
   // app/api/chat/route.ts
   import { runMyAgent } from '@/lib/agents/my-agent';

   export async function POST(request: NextRequest) {
     const { message } = await request.json();
     const result = await runMyAgent({ userMessage: message });
     return NextResponse.json(result);
   }
   ```

---

### Workflow 5: Test RLS Policies

1. Write RLS test in `tests/integration/rls-policies.test.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   describe('RLS Policies', () => {
     it('prevents cross-tenant data access', async () => {
       // Create client as Org A user
       const orgAUser = createClient(url, anonKey, {
         global: { headers: { Authorization: `Bearer ${orgAToken}` } }
       });

       // Try to access Org B's manual
       const { data, error } = await orgAUser
         .from('manuals')
         .select('*')
         .eq('org_id', orgBId);

       expect(data).toHaveLength(0); // Should be empty
     });
   });
   ```

2. Run RLS tests:
   ```bash
   npm test -- rls-policies
   ```

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- guardian.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- death-jump.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

### Critical Safety Tests

```bash
# THE critical test - must always pass
npm run test:e2e -- death-jump.spec.ts
```

This test verifies the Guardian Agent blocks the dangerous "Terminal 29 to 21" jump.

---

## Common Development Tasks

### Add a Shadcn/UI Component

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

### Generate TypeScript Types from Database

```bash
# After any database schema changes
supabase gen types typescript --local > types/database.ts
```

### View Database in Supabase Studio

Open [http://localhost:54323](http://localhost:54323)

Default credentials:
- **Email**: (leave blank or use any email)
- **Password**: (leave blank or use any password)

### Reset Database

```bash
# WARNING: Destroys all local data
supabase db reset
```

### View Logs

```bash
# Supabase logs
supabase logs

# Next.js dev server logs
# (automatically shown in terminal where you ran `npm run dev`)
```

### Lint and Format Code

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format with Prettier (if configured)
npm run format
```

---

## Debugging Tips

### Debug API Routes

Add breakpoints in VS Code:

1. Add a `debugger;` statement in your API route
2. Run `npm run dev`
3. In VS Code, press `F5` or use Run > Start Debugging
4. Make a request to your API route
5. Debugger will pause at your breakpoint

### Debug Supabase Queries

Enable query logging:

```typescript
const supabase = createServerClient();
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

View SQL queries in Supabase Studio under "SQL Editor" > "Logs".

### Debug AI Agent Responses

Log the full LLM response:

```typescript
const { text, finishReason } = await generateText({
  model: google('models/gemini-1.5-pro'),
  prompt: userMessage,
});

console.log('LLM Response:', { text, finishReason });
```

---

## Deployment (Production)

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy:
   ```bash
   npm run build
   vercel deploy --prod
   ```

### Connect to Production Supabase

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run migrations against production:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. Update production environment variables with production Supabase URL and keys

---

## Troubleshooting

### "Module not found" errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Supabase connection errors

```bash
# Stop and restart Supabase
supabase stop
supabase start
```

### TypeScript errors after schema changes

```bash
# Regenerate database types
supabase gen types typescript --local > types/database.ts
```

### Tests failing after dependency updates

```bash
# Clear test cache
npm test -- --clearCache
```

---

## Learning Resources

- **Next.js 14 Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Shadcn/UI**: https://ui.shadcn.com
- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev

---

## Getting Help

- **Documentation**: Check `specs/001-techguard-ai-mvp/` for detailed planning docs
- **Constitution**: Review `.specify/memory/constitution.md` for coding standards
- **GitHub Issues**: Search existing issues or create a new one
- **Team Chat**: Ask in the #techguard-dev channel (if applicable)

---

## Next Steps

1. **Explore the Codebase**: Start with `app/page.tsx` and follow the imports
2. **Read the Spec**: Review `specs/001-techguard-ai-mvp/spec.md` to understand requirements
3. **Run the Tests**: Make sure all tests pass before making changes
4. **Pick a Task**: Check `specs/001-techguard-ai-mvp/tasks.md` (when generated) for implementation tasks
5. **Make Your First Change**: Start with a small, isolated component or utility function

---

## Development Checklist

Before committing code, ensure:

- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] All tests pass (`npm test` and `npm run test:e2e`)
- [ ] Linting passes (`npm run lint`)
- [ ] Changes follow the constitution (`.specify/memory/constitution.md`)
- [ ] New code has tests (70% coverage for safety-critical, 50% overall)
- [ ] RLS policies protect any new database tables
- [ ] Commit message follows conventional format

**Example commit message**:
```
feat(chat): add photo upload to diagnostician agent

- Implement PhotoUpload component with drag-and-drop
- Add vision model integration for photo analysis
- Update agent contracts to handle image input
- Add E2E test for photo-based diagnostics

Refs: #123
```

---

Happy coding! 🚀
