# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TechGuard AI** is a multi-tenant SaaS platform for industrial field technicians to troubleshoot legacy machinery with AI assistance. The core innovation is a **Safety Guardian architecture** that actively intercepts dangerous advice before it reaches technicians, implementing an Isolation Protocol with photo verification when high-risk procedures are detected.

**Critical Success Criteria:**
- System MUST block 100% of dangerous procedures (e.g., "jump Terminal 29 to 21")
- Zero cross-tenant data leaks (Org A cannot access Org B data)
- Generated CMMS reports must accurately reflect troubleshooting steps

## Technology Stack

- **Framework**: Next.js 14 (App Router, React 19, Server Components)
- **Language**: TypeScript 5.x with strict mode
- **Database**: Supabase (PostgreSQL 15+ with pgvector extension)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **AI**: Vercel AI SDK with Gemini 1.5 Pro / Claude 3.5 Sonnet
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **UI**: Tailwind CSS 4 + Shadcn/UI component library
- **Testing**: Vitest (unit), Playwright (E2E)
- **Validation**: Zod for runtime schema validation

## Architecture: Multi-Agent System

TechGuard AI uses **three specialized AI agents** with strict separation of concerns:

### 1. Guardian Agent (Safety Intercept)
**File**: `lib/agents/guardian.ts`
**Purpose**: Detect dangerous user intents and block AI responses BEFORE they reach the user
**Trigger**: Runs on EVERY user message before Diagnostician Agent
**Critical**: Must FAIL CLOSED for safety - if error occurs, default to BLOCK

**Contract**:
```typescript
interface GuardianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: Message[];
  orgId: string;
}

interface GuardianOutput {
  decision: 'ALLOW' | 'BLOCK';
  confidence: number; // 0.0 - 1.0
  matchedRule?: {
    ruleId: string;
    ruleDescription: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    requiredAction: 'disconnect_power' | 'lockout_tagout';
  };
  reasoning: string;
}
```

**Flow**:
1. Parse user message to detect safety keywords ("jump", "bypass", "test across")
2. Generate embedding for user input
3. Vector similarity search against `safety_blacklist` table (threshold: 0.85)
4. Return BLOCK if match found, ALLOW otherwise

### 2. Diagnostician Agent (Troubleshooting)
**File**: `lib/agents/diagnostician.ts`
**Purpose**: Provide step-by-step troubleshooting guidance based on machine manuals
**Trigger**: Runs AFTER Guardian Agent returns ALLOW

**Contract**:
```typescript
interface DiagnosticianInput {
  userMessage: string;
  machineModel: string;
  conversationHistory: Message[];
  photoUrl?: string; // For vision model analysis
  retrievedContext: ManualChunk[]; // From RAG search
  orgId: string;
}

interface DiagnosticianOutput {
  response: string;
  citedManuals: string[];
  nextSteps: string[];
  requiresPhoto: boolean;
  metadata: {
    responseType: 'diagnostic' | 'explanation' | 'procedure';
    confidence: number;
  };
}
```

**RAG Integration**:
- Receives top 3-5 manual chunks from vector similarity search
- Uses Vercel AI SDK to stream responses
- Must cite manual sections in responses

### 3. Curator Agent (Report Generator)
**File**: `lib/agents/curator.ts`
**Purpose**: Generate CMMS-compatible service reports from completed sessions
**Trigger**: When user clicks "Generate Report" after resolving incident

**Contract**:
```typescript
interface CuratorInput {
  incidentId: string;
  conversationHistory: Message[];
  safetyInterventions: SafetyEvent[];
  machineModel: string;
  externalTicketId?: string;
}

interface CuratorOutput {
  asFound: string; // Initial symptoms
  workPerformed: string; // Bullet-point list
  asLeft: string; // Final status
  formattedReport: string; // Copy-paste ready
}
```

## Database Schema (Multi-Tenant with RLS)

**7 Tables** with Row Level Security enabled on ALL:

1. **organizations**: Tenants (companies). Status can be 'active' or 'suspended'
2. **profiles**: Users linked to Supabase Auth. Roles: 'super_admin', 'org_admin', 'technician'
3. **manuals**: Machine manuals with 1536-dim embeddings for RAG. `org_id = NULL` means global manual
4. **safety_blacklist**: Prohibited actions with embeddings for similarity matching
5. **incidents**: Troubleshooting sessions (1 session = 1 incident)
6. **conversation_messages**: Individual messages within sessions
7. **service_reports**: CMMS reports (1-to-1 with incidents)

**RLS Enforcement**:
- Technicians can ONLY access their organization's data
- Org Admins can manage their organization
- Super Admins bypass RLS (for support/impersonation)

**Migration File**: `supabase/migrations/20260119000000_initial_schema.sql`

**Key Functions**:
- `check_safety_blacklist(user_input, machine_model)`: Vector similarity search against blacklist
- `search_manuals(query, org_id, limit)`: RAG-based manual retrieval

## Project Structure

```
app/
├── (auth)/                    # Auth routes (login, signup)
├── (dashboard)/               # Protected routes
│   ├── admin/                 # Super Admin console
│   ├── org/                   # Org Admin dashboard
│   └── troubleshoot/          # Technician chat interface
├── api/                       # API routes (serverless)
│   ├── chat/route.ts          # Main chat (Guardian + Diagnostician)
│   ├── safety/                # Safety checks, photo verification
│   ├── reports/               # CMMS report generation
│   └── manuals/               # Manual upload, RAG search
└── components/
    ├── chat/                  # MessageList, MessageInput, SafetyLockoutModal
    ├── admin/                 # OrganizationTable, ImpersonationControl
    └── shared/                # Reusable components

lib/
├── agents/                    # AI agent implementations
│   ├── guardian.ts            # Safety intercept
│   ├── diagnostician.ts       # Troubleshooting
│   └── curator.ts             # Report generation
├── supabase/                  # Database clients
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server component client
│   └── admin.ts               # Service role (bypasses RLS)
├── rag/                       # RAG engine
│   ├── embeddings.ts          # Generate embeddings
│   ├── search.ts              # Vector similarity search
│   └── manual-processor.ts   # PDF extraction
└── utils/
    ├── validation.ts          # Zod schemas
    └── rls.ts                 # RLS policy testing helpers

supabase/
├── migrations/                # Database schema migrations
│   └── 20260119000000_initial_schema.sql
├── seed.sql                   # Test data
└── config.toml                # Local dev configuration

specs/001-techguard-ai-mvp/    # Feature documentation
├── spec.md                    # Requirements (5 user stories)
├── plan.md                    # Implementation plan
├── data-model.md              # Database schema details
├── contracts/
│   ├── api-routes.md          # REST API specs
│   └── agent-contracts.md     # AI agent interfaces
├── quickstart.md              # Developer onboarding
└── tasks.md                   # 160 implementation tasks
```

## Development Commands

### Next.js
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (MUST pass before merging)
npm run start        # Start production server
npm run lint         # Run ESLint (MUST pass before merging)
```

### Supabase (Local Development)
```bash
supabase start       # Start local Supabase (PostgreSQL + Studio)
supabase stop        # Stop all Supabase services
supabase db reset    # Reapply migrations + seed data
supabase status      # Check running services

# Generate TypeScript types from database schema
supabase gen types typescript --local > types/database.ts

# Access Supabase Studio
# http://localhost:54323
```

### Testing (Not yet implemented - part of tasks)
```bash
npm test                     # Run Vitest unit tests
npm test -- guardian.test.ts # Run specific test file
npm test -- --coverage       # Run with coverage report

npm run test:e2e             # Run Playwright E2E tests
npm run test:e2e -- --headed # Run in headed mode (see browser)
npm run test:e2e -- death-jump.spec.ts # Run specific E2E test
```

**Critical Test**: `tests/e2e/death-jump.spec.ts` - THE most important test. Verifies Guardian Agent blocks dangerous "Terminal 29 to 21" jump. This test MUST ALWAYS PASS.

## Constitution Compliance (Code Quality Gates)

All code MUST pass these gates before merging (see `.specify/memory/constitution.md`):

1. **Security-First**: Multi-tenant RLS enforced, all inputs validated (Zod), no secrets in code
2. **Component-First**: Modular components with TypeScript interfaces, independently testable
3. **Test Coverage**: 70% for safety-critical code (Guardian Agent, RLS), 50% overall
4. **Type Safety**: Strict TypeScript, no `any` without justification, explicit types
5. **Performance**: API routes <200ms p95, Core Web Vitals "Good", use Server Components by default
6. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, semantic HTML
7. **Developer Experience**: Self-documenting code, automated linting, conventional commits

**Pre-merge Checklist**:
- [ ] `npm run build` succeeds (TypeScript compilation)
- [ ] `npm run lint` passes (ESLint)
- [ ] All tests pass (when implemented)
- [ ] Code review approved
- [ ] Constitution principles followed

## API Route Patterns

All API routes follow this structure:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Define request schema
const requestSchema = z.object({
  field: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Get authenticated Supabase client (RLS applies)
    const supabase = createServerClient();

    // Query database (RLS enforced automatically)
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('org_id', validated.orgId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Rate Limiting**: All routes MUST implement rate limiting (see `lib/utils/rate-limit.ts` when implemented)

## RAG Pipeline (Manual Search)

**Flow**:
1. User asks question → Generate embedding using OpenAI API
2. Vector similarity search in `manuals` table (pgvector)
3. Filter by `org_id` (RLS enforced) + `status = 'active'`
4. Return top 3-5 chunks sorted by cosine similarity
5. Inject chunks into Diagnostician Agent context

**Embedding Generation**:
```typescript
// lib/rag/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}
```

**Vector Search** (in Supabase):
```sql
SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
FROM manuals
WHERE (org_id = $1 OR org_id IS NULL) AND status = 'active'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## Safety-Critical Development Rules

### Guardian Agent MUST:
- Run on EVERY user message (no exceptions)
- Fail closed (if error → BLOCK, not ALLOW)
- Log all decisions with full context (liability documentation)
- Never be bypassed or influenced by other agents
- Use vector similarity threshold of 0.85 (configurable, but conservative)

### Isolation Protocol:
1. Guardian detects dangerous intent → returns BLOCK
2. UI displays SafetyLockoutModal (chat input DISABLED)
3. User must upload photo showing disconnected power
4. Photo analyzed via vision model to verify isolation
5. Only after verification → reveal safe procedure

### Data Isolation (RLS):
- NEVER use `supabase.admin` client in user-facing routes (bypasses RLS)
- Admin client ONLY for Super Admin operations with explicit checks
- Test cross-tenant isolation in `tests/integration/rls-policies.test.ts`
- All new tables MUST have RLS policies before production deployment

## User Stories (Priority Order)

Feature implementation follows 5 user stories (see `specs/001-techguard-ai-mvp/tasks.md`):

**P1: Safe Troubleshooting (MVP)** - Guardian + Diagnostician agents, safety lockout
**P2: Data Isolation** - Multi-tenant RLS enforcement, org management
**P3: CMMS Reports** - Curator agent, automated report generation
**P4: Admin Management** - Super Admin console, impersonation, org suspension
**P5: Photo Diagnostics** - Vision model integration, component identification

**MVP = P1 Only** (78 tasks): Setup + Foundational + User Story 1

## Environment Variables

Required in `.env.local`:

```env
# Supabase (from `supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key  # For embeddings

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for complete template (when created).

## Key Documentation Files

- `SUPABASE_SETUP.md`: Complete database setup guide (CLI installation, migration, seed data)
- `specs/001-techguard-ai-mvp/quickstart.md`: 5 development workflows with code examples
- `specs/001-techguard-ai-mvp/contracts/agent-contracts.md`: Full agent specifications
- `.specify/memory/constitution.md`: 7 core development principles (MUST READ)

## Common Pitfalls to Avoid

1. **Using admin client in API routes**: Bypasses RLS, creates security vulnerability
2. **Skipping Guardian Agent**: Never allow direct Diagnostician access without safety check
3. **Missing RLS policies**: All new tables MUST have RLS enabled + policies
4. **Using `any` type**: Violates constitution, breaks type safety
5. **Hardcoding embeddings**: Always generate via OpenAI API (placeholder zeros in seed data only)
6. **Cross-tenant data leaks**: Always filter by `org_id` from authenticated user
7. **Ignoring test failures**: Especially "death-jump.spec.ts" - this MUST pass

## Implementation Status

**Current Phase**: Database schema integrated, ready for implementation

**Completed**:
- ✅ Project initialization (Next.js 14 + TypeScript)
- ✅ Database schema with 7 tables and RLS policies
- ✅ Complete specification and planning documents
- ✅ 160 tasks generated and prioritized

**Next Steps** (follow `specs/001-techguard-ai-mvp/tasks.md`):
1. Phase 1: Setup (T001-T011) - Install dependencies, configure tools
2. Phase 2: Foundational (T012-T043) - Supabase clients, RAG engine, shared components
3. Phase 3: User Story 1 (T044-T078) - Guardian + Diagnostician agents, chat UI

**To start implementation**: See `specs/001-techguard-ai-mvp/tasks.md` for complete task list with dependencies and parallel opportunities.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
