# Implementation Plan: TechGuard AI - Industrial Safety Troubleshooting Platform

**Branch**: `001-techguard-ai-mvp` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-techguard-ai-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

TechGuard AI is a multi-tenant SaaS platform that provides AI-assisted troubleshooting for industrial field technicians working on legacy machinery. The system's core innovation is a "Safety Guardian" architecture that actively intercepts dangerous advice before it reaches technicians, implementing an Isolation Protocol with photo verification when high-risk procedures are detected. The platform supports complete data isolation between organizations, role-based access control (Super Admin, Org Admin, Technician), and generates CMMS-compatible service reports automatically.

**Technical Approach**: Web application using Next.js 14 with server-side rendering, Supabase for PostgreSQL database with Row Level Security for multi-tenancy, pgvector for RAG-based manual search, and Vercel AI SDK for orchestrating multiple AI agents (Guardian Agent for safety interception, Diagnostician Agent for troubleshooting, Curator Agent for report generation). Mobile-first responsive design using Tailwind CSS and Shadcn/UI components.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)

**Primary Dependencies**:
- **Frontend Framework**: Next.js 14 (React 19, App Router, Server Components)
- **UI Library**: Tailwind CSS 4 + Shadcn/UI component library
- **Database**: Supabase (PostgreSQL 15+ with pgvector extension for embeddings)
- **Authentication**: Supabase Auth with Row Level Security (RLS) policies
- **AI Orchestration**: Vercel AI SDK (ai package)
- **LLM Providers**: Gemini 1.5 Pro (Google) or Claude 3.5 Sonnet (Anthropic)
- **Embeddings**: text-embedding-3-small (OpenAI) or Gemini Embeddings
- **Schema Validation**: Zod for runtime type checking and API validation
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting/Formatting**: ESLint 9, Prettier (via constitution)

**Storage**:
- **Database**: Supabase PostgreSQL with pgvector extension
- **Tables**: organizations, profiles, manuals, safety_blacklist, incidents, conversation_messages
- **Vector Store**: pgvector for embedding-based manual retrieval
- **File Storage**: Supabase Storage for uploaded photos and manual PDFs
- **Session Storage**: Supabase Auth for user sessions

**Testing**:
- **Unit Testing**: Vitest for component logic, utilities, and agent functions
- **Integration Testing**: Playwright for multi-step user flows
- **E2E Testing**: Playwright for critical paths (safety lockout, data isolation, CMMS report)
- **Safety Testing**: Automated "Death Jump" test to verify Guardian Agent blocks dangerous procedures
- **Coverage Targets**: 70% for safety-critical code, 50% overall (per constitution)

**Target Platform**: Web (responsive design optimized for mobile field use)
- **Desktop**: Admin consoles (Super Admin, Org Admin dashboards)
- **Mobile**: Primary technician interface (iOS/Android via responsive web)
- **Minimum Supported**: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+)

**Project Type**: Web application (Next.js full-stack)

**Performance Goals**:
- **API Response Time**: <200ms p95 for troubleshooting queries (per constitution)
- **Safety Lockout Trigger**: <2 seconds from dangerous request to UI lockout (per spec SC-005)
- **Report Generation**: <10 seconds to generate CMMS report (per spec SC-010)
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1 (per constitution)
- **Concurrent Users**: Support 1000+ concurrent technicians across all organizations

**Constraints**:
- **Security**: Multi-tenant data isolation MUST be enforced at database level (RLS policies)
- **Safety**: 100% blocking rate for blacklisted procedures (zero false negatives allowed)
- **Offline**: NOT supported in MVP (requires internet connectivity)
- **Mobile UX**: Interface MUST be usable on smartphones in field conditions (large touch targets, high contrast)
- **Latency**: Field technicians may have slow connections; optimize for 3G networks

**Scale/Scope**:
- **MVP Target**: 10 organizations, 100 active technicians, 500 troubleshooting sessions/month (per spec SC-009)
- **Data Volume**: Estimate 50-100 machine manuals per organization, 10-20 sessions per technician/month
- **Growth Projection**: System architecture should support 100+ organizations without major refactoring

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security-First ✅ PASS

**Requirements Met**:
- ✅ Multi-tenant RLS policies enforce data isolation at database level
- ✅ Supabase Auth handles authentication with secure session management
- ✅ All user inputs validated using Zod schemas
- ✅ API routes will implement rate limiting
- ✅ Environment variables for secrets (API keys, database URLs)
- ✅ Security headers configured in Next.js middleware
- ✅ Photo uploads validated for type, size, and scanned for malicious content

**Action Items**:
- Implement rate limiting middleware for API routes
- Configure CSP, HSTS, X-Frame-Options headers
- Set up dependency vulnerability scanning (npm audit, Snyk)
- Document RLS policy testing procedures

### II. Component-First Architecture ✅ PASS

**Requirements Met**:
- ✅ Shadcn/UI provides base component library
- ✅ Chat interface will be broken into: MessageList, MessageInput, SafetyLockoutModal, PhotoUpload components
- ✅ Admin dashboards: OrganizationTable, UserManagementPanel, ImpersonationControl components
- ✅ Report UI: ServiceReportCard, CopyButton components
- ✅ All components will have TypeScript interfaces for props

**Action Items**:
- Define component directory structure (`components/chat`, `components/admin`, `components/shared`)
- Create reusable form components (Input, Button, Modal, FileUpload)
- Document component usage with Storybook or similar (post-MVP)

### III. Test Coverage Required ✅ PASS

**Requirements Met**:
- ✅ Vitest configured for unit testing
- ✅ Playwright configured for E2E testing
- ✅ Critical safety flow will have automated "Death Jump" test
- ✅ Multi-tenancy isolation will have integration tests
- ✅ Coverage targets defined: 70% critical paths, 50% overall

**Test Strategy**:
- **Safety-Critical Tests** (70% coverage):
  - Guardian Agent intercept logic
  - RLS policy enforcement
  - Isolation Protocol trigger and photo verification
- **Integration Tests**:
  - Full troubleshooting workflow (start session → ask question → generate report)
  - Super Admin impersonation flow
  - Manual upload and RAG retrieval
- **E2E Tests**:
  - "The Death Jump" - verify dangerous procedure is blocked
  - "Data Isolation" - verify org A cannot access org B data
  - "CMMS Report Accuracy" - verify report matches conversation

### IV. Type Safety with TypeScript ✅ PASS

**Requirements Met**:
- ✅ TypeScript 5.x with strict mode enabled
- ✅ All API responses will have defined interfaces
- ✅ Zod schemas for runtime validation + type inference
- ✅ Database types auto-generated from Supabase schema
- ✅ Props interfaces for all React components
- ✅ No `any` types except where explicitly justified with comments

**Action Items**:
- Enable `strict: true` in tsconfig.json
- Generate TypeScript types from Supabase schema (`supabase gen types`)
- Create shared types directory (`types/database.ts`, `types/api.ts`, `types/agents.ts`)

### V. Performance by Design ✅ PASS

**Requirements Met**:
- ✅ Next.js 14 Image component for photo uploads and manual previews
- ✅ Dynamic imports for admin console (not needed by field technicians)
- ✅ Server Components by default, Client Components only where interactive
- ✅ API route response time target <200ms aligns with constitution
- ✅ Bundle size monitoring with Next.js built-in analyzer

**Optimization Strategy**:
- Use Server Components for static content (manuals list, session history)
- Client Components only for interactive elements (chat input, photo upload)
- Code split admin console from technician interface
- Implement streaming responses for long AI completions
- Cache manual embeddings in database to avoid recomputation

### VI. Accessibility First (WCAG 2.1 AA) ⚠️ NEEDS ATTENTION

**Requirements Met**:
- ✅ Shadcn/UI components built with accessibility in mind
- ✅ Semantic HTML will be used (headings, landmarks, buttons vs divs)
- ✅ Forms will have proper labels
- ✅ Color contrast for safety warnings (red, orange) will meet AA standards

**Gaps to Address**:
- ⚠️ Safety Lockout modal must be keyboard accessible and announced to screen readers
- ⚠️ Chat interface must support keyboard navigation between messages
- ⚠️ Photo upload must have accessible file input with clear instructions
- ⚠️ Error messages must be associated with form fields using aria-describedby

**Action Items**:
- Run axe-core accessibility tests during development
- Test keyboard navigation for all critical flows
- Ensure all images (manual diagrams, uploaded photos) have descriptive alt text
- Add aria-live regions for dynamic chat updates

### VII. Developer Experience (DX) ✅ PASS

**Requirements Met**:
- ✅ Environment variables with `.env.example` template
- ✅ ESLint and Prettier configured (Next.js defaults)
- ✅ Conventional commit format will be followed
- ✅ Setup instructions in README

**Action Items**:
- Create comprehensive `.env.example` with all required keys
- Document local development setup (Supabase local, API keys)
- Add pre-commit hooks for linting and type checking
- Write clear error messages for configuration issues

### Constitution Compliance Summary

**Status**: ✅ **PASS** with minor accessibility considerations

All core principles are addressed in the technical architecture. One area requiring additional attention:
- **Accessibility**: Ensure safety-critical UI (lockout modal, photo upload) meets WCAG 2.1 AA

**Overall Assessment**: Architecture is constitution-compliant. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-techguard-ai-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-routes.md    # REST API endpoints
│   └── agent-contracts.md # AI agent interfaces
├── checklists/
│   └── requirements.md  # Spec quality checklist (already complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a Next.js 14 web application using the App Router structure:

```text
app/
├── (auth)/                    # Auth routes group
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── (dashboard)/               # Protected dashboard routes
│   ├── admin/                 # Super Admin console
│   │   ├── organizations/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── org/                   # Org Admin dashboard
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── manuals/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── troubleshoot/          # Technician chat interface
│       ├── [sessionId]/
│       │   └── page.tsx
│       ├── new/
│       │   └── page.tsx
│       └── history/
│           └── page.tsx
├── api/                       # API routes (serverless)
│   ├── chat/
│   │   └── route.ts           # Main chat endpoint (Guardian + Diagnostician agents)
│   ├── safety/
│   │   ├── check/
│   │   │   └── route.ts       # Safety blacklist check
│   │   └── verify-photo/
│   │       └── route.ts       # Photo verification
│   ├── reports/
│   │   └── generate/
│   │       └── route.ts       # CMMS report generation
│   ├── manuals/
│   │   ├── upload/
│   │   │   └── route.ts       # Manual PDF upload + processing
│   │   └── search/
│   │       └── route.ts       # RAG-based manual search
│   └── admin/
│       ├── organizations/
│       │   └── route.ts       # Org CRUD (Super Admin only)
│       └── impersonate/
│           └── route.ts       # Impersonation logic
├── components/
│   ├── chat/                  # Chat interface components
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── SafetyLockoutModal.tsx
│   │   └── PhotoUpload.tsx
│   ├── admin/                 # Admin components
│   │   ├── OrganizationTable.tsx
│   │   ├── UserManagementPanel.tsx
│   │   └── ImpersonationControl.tsx
│   ├── reports/               # Report components
│   │   ├── ServiceReportCard.tsx
│   │   └── CopyButton.tsx
│   └── shared/                # Reusable components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── FileUpload.tsx
├── lib/
│   ├── agents/                # AI agent logic
│   │   ├── guardian.ts        # Safety intercept agent
│   │   ├── diagnostician.ts   # Troubleshooting agent
│   │   └── curator.ts         # Report generation agent
│   ├── supabase/              # Database clients
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── admin.ts           # Service role client (bypasses RLS)
│   ├── rag/                   # RAG engine
│   │   ├── embeddings.ts      # Generate embeddings
│   │   ├── search.ts          # Vector similarity search
│   │   └── manual-processor.ts # Extract text + safety warnings from PDFs
│   └── utils/
│       ├── validation.ts      # Zod schemas
│       └── rls.ts             # Helper to test RLS policies
├── types/
│   ├── database.ts            # Auto-generated from Supabase
│   ├── api.ts                 # API request/response types
│   └── agents.ts              # Agent message types
├── middleware.ts              # Auth + security headers
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
└── globals.css                # Global styles (Tailwind)

public/
├── fonts/                     # Custom fonts (if any)
└── images/                    # Static images

tests/
├── unit/
│   ├── agents/
│   │   ├── guardian.test.ts
│   │   └── curator.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── troubleshooting-flow.test.ts
│   ├── data-isolation.test.ts
│   └── admin-operations.test.ts
└── e2e/
    ├── death-jump.spec.ts     # THE critical safety test
    ├── cmms-report.spec.ts
    └── impersonation.spec.ts

supabase/
├── migrations/                # Database schema migrations
│   └── 00001_initial_schema.sql
├── seed.sql                   # Test data for development
└── config.toml                # Supabase project config
```

**Structure Decision**: Selected **Web Application (Next.js)** structure. This is a full-stack web application using Next.js App Router. The `app/` directory contains all routes (pages and API endpoints), following Next.js 14 conventions. Components are organized by feature area (chat, admin, reports, shared). The `lib/` directory contains business logic including AI agents, database clients, and RAG engine. Testing is organized by test type (unit, integration, E2E) with critical safety tests in E2E suite.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations requiring justification.** All constitution principles are met by the proposed architecture. The complexity of the system (multi-tenancy, AI agents, RAG) is inherent to the requirements and does not violate simplicity principles.
