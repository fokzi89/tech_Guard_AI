# Research: TechGuard AI Technology Stack & Architecture Decisions

**Date**: 2026-01-19
**Feature**: TechGuard AI - Industrial Safety Troubleshooting Platform

## Overview

This document consolidates the technology stack decisions for TechGuard AI. Since the tech stack was well-defined in the PRD and aligns with the project constitution, no significant unknowns required resolution. This document serves as a reference for the chosen technologies and architectural patterns.

## Technology Decisions

### 1. Frontend Framework: Next.js 14 (App Router)

**Decision**: Use Next.js 14 with the App Router for the entire application.

**Rationale**:
- **Server-Side Rendering**: Critical for SEO and initial load performance, especially for marketing/landing pages
- **API Routes**: Built-in serverless functions eliminate need for separate backend deployment
- **Server Components**: Default server rendering reduces client bundle size, improves performance on mobile devices
- **TypeScript Support**: First-class TypeScript support aligns with constitution's Type Safety principle
- **React 19**: Latest React features including improved Server Components and concurrent rendering
- **App Router**: Modern routing system with layouts, loading states, and error boundaries built-in

**Alternatives Considered**:
- **Vite + React SPA**: Rejected because SPA approach would hurt initial load performance and SEO
- **Remix**: Considered, but Next.js has larger ecosystem, better Vercel integration, and more mature tooling
- **Astro**: Rejected because we need significant client-side interactivity (chat interface)

**References**:
- Next.js 14 Documentation: https://nextjs.org/docs
- App Router Guide: https://nextjs.org/docs/app

---

### 2. Database: Supabase (PostgreSQL + Auth + Storage)

**Decision**: Use Supabase as the primary backend platform (PostgreSQL database, Auth, Storage, pgvector).

**Rationale**:
- **Row Level Security (RLS)**: Native PostgreSQL RLS provides database-level multi-tenancy enforcement (critical for FR-009)
- **Built-in Auth**: Supabase Auth handles authentication, sessions, and user management out of the box
- **pgvector Extension**: Native vector similarity search for RAG-based manual retrieval
- **Storage**: Built-in file storage for PDFs and photos
- **TypeScript Client**: Auto-generated TypeScript types from database schema
- **Real-time**: Subscriptions for live updates (potential future feature)
- **Self-hosted Option**: Can migrate to self-hosted Supabase if needed for compliance

**Alternatives Considered**:
- **Firebase**: Rejected because Firestore doesn't support complex queries or vector search; weaker RLS than PostgreSQL
- **MongoDB + Custom Auth**: Rejected because document databases don't provide RLS; would need custom multi-tenancy logic
- **Prisma + Standalone PostgreSQL**: Considered, but Supabase provides auth + storage + edge functions in one platform

**References**:
- Supabase Documentation: https://supabase.com/docs
- Row Level Security Guide: https://supabase.com/docs/guides/auth/row-level-security
- pgvector Extension: https://github.com/pgvector/pgvector

---

### 3. AI Orchestration: Vercel AI SDK

**Decision**: Use Vercel AI SDK for orchestrating multiple AI agents and streaming responses.

**Rationale**:
- **Provider Agnostic**: Supports OpenAI, Anthropic (Claude), Google (Gemini), and other providers with unified API
- **Streaming**: Built-in support for streaming AI responses (improves perceived performance)
- **Edge Runtime**: Compatible with Vercel Edge Functions and Next.js API routes
- **TypeScript**: Fully typed API for agent messages and responses
- **React Integration**: `useChat` hook simplifies chat UI implementation
- **Tool Calling**: Supports function/tool calling for agent-to-agent communication

**Alternatives Considered**:
- **LangChain**: Rejected because it's overly complex for our use case; adds unnecessary abstraction
- **Direct Provider SDKs**: Rejected because we want flexibility to switch between Gemini and Claude without code changes

**References**:
- Vercel AI SDK: https://sdk.vercel.ai/docs
- AI SDK Core Documentation: https://sdk.vercel.ai/docs/ai-sdk-core

---

### 4. LLM Providers: Gemini 1.5 Pro & Claude 3.5 Sonnet

**Decision**: Support both Gemini 1.5 Pro (primary) and Claude 3.5 Sonnet (fallback) for reasoning.

**Rationale**:
- **Gemini 1.5 Pro**: Long context window (1M tokens) allows entire manuals to fit in context; multimodal for photo analysis
- **Claude 3.5 Sonnet**: Strong reasoning for complex troubleshooting; good at following system prompts (safety guidelines)
- **Cost Optimization**: Can route simple queries to Claude Haiku or Gemini Flash for cost savings
- **Provider Flexibility**: Avoid vendor lock-in; can fail over if one provider has outages

**Embeddings**:
- **Primary**: text-embedding-3-small (OpenAI) - good balance of cost and quality
- **Alternative**: Gemini Embeddings - free tier available, simplifies stack if using Gemini for reasoning

**References**:
- Gemini API: https://ai.google.dev/docs
- Claude API: https://docs.anthropic.com/claude/reference

---

### 5. UI Framework: Tailwind CSS + Shadcn/UI

**Decision**: Use Tailwind CSS 4 for styling and Shadcn/UI for component library.

**Rationale**:
- **Tailwind CSS**: Utility-first CSS framework; aligns with constitution's Styling Standards
- **Shadcn/UI**: Copy-paste component library (not npm dependency); full customization; built on Radix UI primitives
- **Accessibility**: Radix UI provides WCAG-compliant primitives (required by constitution Principle VI)
- **TypeScript**: All components fully typed
- **Customization**: Can modify component code directly (no black box dependencies)
- **Dark Mode**: Built-in dark mode support (required for industrial field use)

**Alternatives Considered**:
- **Material-UI**: Rejected because it's opinionated and adds 300KB+ to bundle size
- **Chakra UI**: Rejected because runtime CSS-in-JS hurts performance
- **Headless UI**: Considered, but Shadcn/UI provides more complete component set

**References**:
- Tailwind CSS: https://tailwindcss.com/docs
- Shadcn/UI: https://ui.shadcn.com

---

### 6. Testing: Vitest + Playwright

**Decision**: Use Vitest for unit/integration tests and Playwright for E2E tests.

**Rationale**:
- **Vitest**: Fast, Vite-powered test runner; ESM-first; better TypeScript support than Jest
- **Playwright**: Reliable cross-browser E2E testing; built-in test isolation; visual regression testing
- **Coverage**: Vitest includes built-in code coverage (c8)
- **Constitution Compliance**: Meets Test Coverage Required principle (70% critical paths, 50% overall)

**Critical Tests**:
- **The "Death Jump" Test**: E2E test that verifies Guardian Agent blocks dangerous terminal jumps
- **Data Isolation Test**: E2E test that verifies Org A cannot access Org B data
- **CMMS Report Accuracy**: E2E test that verifies report matches conversation content

**Alternatives Considered**:
- **Jest**: Rejected because Vitest is faster and has better ESM/TypeScript support
- **Cypress**: Rejected because Playwright has better API, faster execution, and better TypeScript support

**References**:
- Vitest: https://vitest.dev
- Playwright: https://playwright.dev

---

### 7. Schema Validation: Zod

**Decision**: Use Zod for runtime schema validation and type inference.

**Rationale**:
- **TypeScript Integration**: Infer TypeScript types from Zod schemas (single source of truth)
- **Runtime Validation**: Validate API requests, form inputs, and environment variables at runtime
- **Composition**: Easily compose and extend schemas
- **Error Messages**: Provides detailed, user-friendly error messages
- **Constitution Compliance**: Aligns with Type Safety and Security-First principles

**Use Cases**:
- **API Route Validation**: Validate request bodies before processing
- **Form Validation**: Validate user inputs in forms (manual upload, session creation)
- **Environment Variables**: Validate required env vars at startup
- **Database Input**: Validate data before inserting into Supabase

**Alternatives Considered**:
- **Yup**: Rejected because it doesn't integrate as well with TypeScript
- **Joi**: Rejected because it's larger and doesn't support TypeScript inference

**References**:
- Zod Documentation: https://zod.dev

---

## Architectural Patterns

### Multi-Agent Architecture

**Decision**: Implement three specialized AI agents rather than one monolithic chatbot.

**Agents**:
1. **Guardian Agent**: Safety intercept layer; runs BEFORE response generation; checks user intent against safety blacklist
2. **Diagnostician Agent**: Main troubleshooting agent; retrieves manual context via RAG; provides step-by-step guidance
3. **Curator Agent**: Report generation agent; summarizes conversation into CMMS-compatible format

**Rationale**:
- **Separation of Concerns**: Each agent has a single, clear responsibility
- **Safety Guarantee**: Guardian Agent cannot be bypassed or influenced by troubleshooting logic
- **Independent Testing**: Each agent can be tested in isolation
- **Scalability**: Agents can be swapped or upgraded independently

**Agent Flow**:
```
User Input → Guardian Agent → [BLOCK or ALLOW] → Diagnostician Agent → User Output
                ↓
          Safety Blacklist Check
```

**References**:
- Multi-Agent Systems: https://www.anthropic.com/research/constitutional-ai

---

### RAG (Retrieval-Augmented Generation) Pipeline

**Decision**: Use pgvector for vector similarity search with manual embeddings.

**Pipeline**:
1. **Ingestion**: PDF → text extraction → chunk into paragraphs → generate embeddings → store in manuals table
2. **Query**: User question → generate embedding → vector similarity search → retrieve top 3-5 chunks → inject into LLM context
3. **Safety Extraction**: Extract safety warnings from manuals → store in safety_blacklist table with embeddings

**Rationale**:
- **Accuracy**: Vector search retrieves semantically similar content even if exact keywords don't match
- **Scalability**: pgvector scales to millions of embeddings
- **Cost**: Embedding-based retrieval is cheaper than passing entire manual to LLM every query

**Chunking Strategy**:
- **Chunk Size**: 500-1000 tokens per chunk (balances context and granularity)
- **Overlap**: 100-token overlap between chunks (preserves context at boundaries)
- **Metadata**: Store page number, section title, machine model with each chunk

**References**:
- RAG Guide: https://www.pinecone.io/learn/retrieval-augmented-generation/
- pgvector Best Practices: https://supabase.com/docs/guides/ai/vector-columns

---

### Row Level Security (RLS) for Multi-Tenancy

**Decision**: Implement multi-tenancy using PostgreSQL Row Level Security policies.

**RLS Policies**:
```sql
-- Technicians can only see their org's data
CREATE POLICY "Users can only see their org's manuals"
ON manuals FOR SELECT
USING (org_id = auth.jwt() -> 'org_id');

-- Super Admins bypass RLS
CREATE POLICY "Super Admins can see all data"
ON manuals FOR SELECT
USING (auth.jwt() -> 'role' = 'super_admin');
```

**Rationale**:
- **Database-Level Enforcement**: Cannot be bypassed by application code bugs
- **Testable**: RLS policies can be tested independently
- **Audit-Ready**: PostgreSQL logs all data access
- **Constitution Compliance**: Meets Security-First principle requirement for data isolation

**References**:
- RLS Deep Dive: https://supabase.com/docs/guides/database/postgres/row-level-security

---

## Research Conclusion

All technology choices are finalized and documented. No additional research required. Proceed to Phase 1 (Design & Contracts).

**Summary**:
- ✅ Next.js 14 for frontend + backend
- ✅ Supabase for database, auth, storage
- ✅ Vercel AI SDK for agent orchestration
- ✅ Gemini 1.5 Pro / Claude 3.5 Sonnet for LLMs
- ✅ Tailwind CSS + Shadcn/UI for components
- ✅ Vitest + Playwright for testing
- ✅ Zod for schema validation
- ✅ Multi-agent architecture for safety
- ✅ RAG pipeline with pgvector
- ✅ RLS policies for multi-tenancy

**Constitution Compliance**: All choices align with the 7 core principles in the TechGuard AI Constitution.
