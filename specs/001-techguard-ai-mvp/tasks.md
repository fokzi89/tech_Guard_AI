# Tasks: TechGuard AI - Industrial Safety Troubleshooting Platform

**Input**: Design documents from `/specs/001-techguard-ai-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-routes.md, contracts/agent-contracts.md

**Tests**: E2E tests are included for safety-critical features as specified in spec.md success criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Next.js 14 App Router structure:
- Pages: `app/(auth)/`, `app/(dashboard)/`, `app/api/`
- Components: `app/components/`
- Business logic: `lib/`
- Types: `types/`
- Tests: `tests/`
- Database: `supabase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 14 project with TypeScript and App Router
- [x] T002 [P] Install core dependencies (Supabase client, Vercel AI SDK, Zod, Tailwind CSS)
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T004 [P] Configure ESLint and Prettier per constitution
- [x] T005 [P] Setup Tailwind CSS 4 configuration in tailwind.config.ts
- [x] T006 [P] Initialize Shadcn/UI and install base components (button, input, card, dialog)
- [x] T007 [P] Create project directory structure per plan.md (app/, lib/, types/, tests/, supabase/)
- [x] T008 [P] Setup environment variables template in .env.example
- [x] T009 [P] Create .gitignore for Next.js project
- [x] T010 [P] Setup Vitest configuration for unit testing in vitest.config.ts
- [x] T011 [P] Setup Playwright configuration for E2E testing in playwright.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Authentication

- [x] T012 Initialize Supabase project locally with supabase init
- [x] T013 Create initial database migration in supabase/migrations/00001_initial_schema.sql with all 7 tables (organizations, profiles, manuals, safety_blacklist, incidents, conversation_messages, service_reports)
- [x] T014 [P] Enable pgvector extension in migration file
- [x] T015 [P] Create vector indexes for embeddings columns (manuals, safety_blacklist)
- [x] T016 Create RLS policies for organizations table in migration file
- [x] T017 Create RLS policies for profiles table in migration file
- [x] T018 Create RLS policies for manuals table in migration file
- [x] T019 Create RLS policies for safety_blacklist table in migration file
- [x] T020 Create RLS policies for incidents table in migration file
- [x] T021 Create RLS policies for conversation_messages table in migration file
- [x] T022 Create RLS policies for service_reports table in migration file
- [x] T023 Create database functions (check_safety_blacklist, search_manuals) in migration file
- [x] T024 Apply migration with supabase db reset
- [x] T025 Generate TypeScript types from Supabase schema in types/database.ts

### API Infrastructure

- [x] T026 Create Supabase client factory for browser in lib/supabase/client.ts
- [x] T027 Create Supabase client factory for server components in lib/supabase/server.ts
- [x] T028 Create Supabase admin client (service role) in lib/supabase/admin.ts
- [x] T029 [P] Create authentication middleware in app/middleware.ts
- [x] T030 [P] Configure security headers (CSP, HSTS, X-Frame-Options) in middleware
- [x] T031 [P] Create API error handling utilities in lib/utils/errors.ts
- [x] T032 [P] Create Zod validation schemas for API requests in lib/utils/validation.ts
- [x] T033 [P] Create rate limiting middleware in lib/utils/rate-limit.ts

### RAG Engine Infrastructure

- [x] T034 Setup embedding generation using OpenAI text-embedding-3-small in lib/rag/embeddings.ts
- [x] T035 [P] Implement vector similarity search function in lib/rag/search.ts
- [x] T036 [P] Create PDF text extraction utility in lib/rag/manual-processor.ts
- [x] T037 [P] Create safety warning extraction logic in lib/rag/manual-processor.ts

### Shared Types & Components

- [x] T038 [P] Create shared API types in types/api.ts (request/response interfaces)
- [x] T039 [P] Create agent message types in types/agents.ts
- [x] T040 [P] Create shared UI components: Button, Input, Modal, FileUpload in app/components/shared/
- [x] T041 [P] Create root layout with providers in app/layout.tsx
- [x] T042 [P] Create landing page placeholder in app/page.tsx
- [x] T043 [P] Setup global styles in app/globals.css

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Safe Troubleshooting (Priority: P1) 🎯 MVP

**Goal**: Field technicians can start troubleshooting sessions and receive AI-guided assistance. The Guardian Agent intercepts dangerous requests and blocks them immediately, triggering an Isolation Protocol that requires photo verification before revealing dangerous procedures.

**Independent Test**: Ask the system "Can I jump Terminal 29 to Terminal 21?" on a Domino M230i. The Guardian Agent should block the response within 2 seconds, display a critical safety warning, disable chat input, and require photo verification of power disconnection before unlocking.

### E2E Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T044 [P] [US1] Create E2E test "The Death Jump" in tests/e2e/death-jump.spec.ts verifying dangerous terminal jump is blocked
- [x] T045 [P] [US1] Create E2E test for safety lockout modal in tests/e2e/safety-lockout.spec.ts verifying chat input is disabled
- [x] T046 [P] [US1] Create E2E test for photo verification workflow in tests/e2e/photo-verification.spec.ts

### Guardian Agent Implementation

- [x] T047 [P] [US1] Create Guardian Agent contract interface in lib/agents/guardian.ts (GuardianInput, GuardianOutput types)
- [x] T048 [US1] Implement Guardian Agent intent analysis logic in lib/agents/guardian.ts
- [x] T049 [US1] Implement safety blacklist vector search in Guardian Agent
- [x] T050 [US1] Implement decision logic (ALLOW/BLOCK) with confidence scoring in Guardian Agent
- [x] T051 [P] [US1] Create unit tests for Guardian Agent in tests/unit/agents/guardian.test.ts

### Diagnostician Agent Implementation

- [x] T052 [P] [US1] Create Diagnostician Agent contract interface in lib/agents/diagnostician.ts (DiagnosticianInput, DiagnosticianOutput types)
- [x] T053 [US1] Implement Diagnostician Agent with Vercel AI SDK in lib/agents/diagnostician.ts
- [x] T054 [US1] Integrate RAG manual search into Diagnostician Agent
- [x] T055 [US1] Implement system prompt for Diagnostician Agent with safety mindset
- [x] T056 [P] [US1] Create unit tests for Diagnostician Agent in tests/unit/agents/diagnostician.test.ts

### Chat API Endpoints

- [x] T057 [P] [US1] Create POST /api/chat route in app/api/chat/route.ts
- [x] T058 [US1] Implement Guardian Agent call in chat route (runs first on every message)
- [x] T059 [US1] Implement Diagnostician Agent call in chat route (runs if Guardian allows)
- [x] T060 [US1] Implement streaming response for AI completions in chat route
- [x] T061 [US1] Implement error handling and logging in chat route
- [x] T062 [P] [US1] Create POST /api/chat/session route in app/api/chat/session/route.ts for creating new troubleshooting sessions
- [x] T063 [P] [US1] Create POST /api/safety/check route in app/api/safety/check/route.ts for safety blacklist checking
- [x] T064 [P] [US1] Create POST /api/safety/verify-photo route in app/api/safety/verify-photo/route.ts for photo verification

### Chat UI Components

- [x] T065 [P] [US1] Create MessageList component in app/components/chat/MessageList.tsx
- [x] T066 [P] [US1] Create MessageInput component in app/components/chat/MessageInput.tsx
- [x] T067 [P] [US1] Create SafetyLockoutModal component in app/components/chat/SafetyLockoutModal.tsx
- [x] T068 [P] [US1] Create PhotoUpload component in app/components/chat/PhotoUpload.tsx
- [x] T069 [US1] Create chat page layout in app/(dashboard)/troubleshoot/[sessionId]/page.tsx
- [x] T070 [US1] Integrate chat components with API route using Vercel AI SDK useChat hook
- [x] T071 [US1] Implement safety lockout modal trigger on BLOCK response
- [x] T072 [US1] Implement photo verification flow in chat page

### Session Management

- [x] T073 [P] [US1] Create session creation page in app/(dashboard)/troubleshoot/new/page.tsx
- [x] T074 [P] [US1] Create session history page in app/(dashboard)/troubleshoot/history/page.tsx
- [x] T075 [US1] Implement session state persistence in database (incidents, conversation_messages tables)

### Authentication Pages

- [x] T076 [P] [US1] Create login page in app/(auth)/login/page.tsx
- [x] T077 [P] [US1] Create signup page in app/(auth)/signup/page.tsx (super admin registration)
- [x] T078 [US1] Integrate Supabase Auth with login/signup forms

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Technicians can log in, start troubleshooting sessions, ask questions, and the Guardian Agent will block dangerous requests with the Isolation Protocol.

---

## Phase 4: User Story 2 - Data Isolation (Priority: P2)

**Goal**: Complete multi-tenant data isolation enforced at the database level. Organizations cannot access each other's manuals, sessions, or custom safety rules. All data access is protected by Row Level Security policies.

**Independent Test**: Create two organizations (Company A and Company B). Upload a unique manual to Company A. Log in as a technician from Company B and attempt to search for or access this manual. The system should return no results and provide no access, even via direct API calls.

### E2E Tests for User Story 2

- [x] T079 [P] [US2] Create E2E test for data isolation in tests/e2e/data-isolation.spec.ts verifying org A cannot access org B data
- [x] T080 [P] [US2] Create integration test for RLS policies in tests/integration/rls-policies.test.ts

### Organization & User Management

- [x] T081 [P] [US2] Create GET /api/org/users route in app/api/org/users/route.ts for listing organization users
- [x] T082 [P] [US2] Create POST /api/org/users/invite route in app/api/org/users/invite/route.ts for inviting users
- [x] T083 [US2] Implement organization user management UI in app/(dashboard)/org/users/page.tsx
- [x] T084 [US2] Create user invitation form component in app/components/admin/UserInvitationForm.tsx

### RLS Policy Validation

- [x] T085 [US2] Create RLS policy testing utility in lib/utils/rls.ts
- [x] T086 [US2] Validate all RLS policies are correctly enforcing org_id filtering
- [x] T087 [US2] Create integration tests for cross-tenant isolation in tests/integration/multi-tenancy.test.ts

### Manual Upload & Management

- [x] T088 [P] [US2] Create POST /api/manuals/upload route in app/api/manuals/upload/route.ts
- [x] T089 [US2] Implement PDF upload to Supabase Storage in manual upload route
- [x] T090 [US2] Implement PDF text extraction and chunking in manual upload route
- [x] T091 [US2] Implement embedding generation for manual chunks in manual upload route
- [x] T092 [US2] Store manual chunks with embeddings in manuals table
- [x] T093 [P] [US2] Create GET /api/manuals/search route in app/api/manuals/search/route.ts for RAG-based search
- [x] T094 [P] [US2] Create GET /api/manuals/:manualId route in app/api/manuals/[manualId]/route.ts
- [x] T095 [P] [US2] Create DELETE /api/manuals/:manualId route in app/api/manuals/[manualId]/route.ts for archiving
- [x] T096 [US2] Create manual upload page in app/(dashboard)/org/manuals/page.tsx
- [x] T097 [US2] Create manual list component in app/components/admin/ManualsList.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Data isolation is enforced, and organizations can manage their own manuals securely.

---

## Phase 5: User Story 3 - CMMS Reports (Priority: P3)

**Goal**: Automatically generate CMMS-compatible service reports from completed troubleshooting sessions. Reports follow the "As Found / Work Performed / As Left" format and can be copied to clipboard with one click.

**Independent Test**: Start a troubleshooting session with work order "WO-12345". Conduct a full conversation (describe symptom, run diagnostics, perform fix, verify solution). Click "Generate Report". The system should produce a properly formatted CMMS report with all troubleshooting steps accurately summarized.

### Curator Agent Implementation

- [x] T098 [P] [US3] Create Curator Agent contract interface in lib/agents/curator.ts (CuratorInput, CuratorOutput types)
- [x] T099 [US3] Implement Curator Agent with Vercel AI SDK in lib/agents/curator.ts
- [x] T100 [US3] Implement conversation parsing logic to extract key events
- [x] T101 [US3] Implement "As Found" extraction from initial messages
- [x] T102 [US3] Implement "Work Performed" extraction from conversation history
- [x] T103 [US3] Implement "As Left" determination from final status
- [x] T104 [US3] Implement CMMS report formatting logic
- [x] T105 [P] [US3] Create unit tests for Curator Agent in tests/unit/agents/curator.test.ts

### Reports API

- [x] T106 [P] [US3] Create POST /api/reports/generate route in app/api/reports/generate/route.ts
- [x] T107 [US3] Integrate Curator Agent into report generation route
- [x] T108 [US3] Store generated reports in service_reports table
- [x] T109 [P] [US3] Create GET /api/reports/:reportId route in app/api/reports/[reportId]/route.ts

### Reports UI

- [x] T110 [P] [US3] Create ServiceReportCard component in app/components/reports/ServiceReportCard.tsx
- [x] T111 [P] [US3] Create CopyButton component in app/components/reports/CopyButton.tsx
- [x] T112 [US3] Add "Generate Report" button to chat interface
- [x] T113 [US3] Implement report display modal in chat page
- [x] T114 [US3] Implement copy-to-clipboard functionality

### E2E Test for User Story 3

- [x] T115 [US3] Create E2E test for CMMS report accuracy in tests/e2e/cmms-report.spec.ts verifying report matches conversation

**Checkpoint**: All three user stories (Safe Troubleshooting, Data Isolation, CMMS Reports) should now work independently. Technicians can troubleshoot safely and generate professional service reports.

---

## Phase 6: User Story 4 - Super Admin Management (Priority: P4)

**Goal**: Platform owners can manage all customer organizations globally, view usage metrics, suspend organizations, and impersonate Org Admins for customer support with full audit logging.

**Independent Test**: Log in as Super Admin. View global organizations dashboard. Suspend one organization and verify all users from that organization are immediately blocked. Impersonate an Org Admin from a different organization and verify you can view their dashboard as if logged in as them.

### Admin API Endpoints

- [x] T116 [P] [US4] Create GET /api/admin/organizations route in app/api/admin/organizations/route.ts
- [x] T117 [P] [US4] Create PATCH /api/admin/organizations/:orgId route in app/api/admin/organizations/[orgId]/route.ts for status updates
- [x] T118 [P] [US4] Create POST /api/admin/impersonate route in app/api/admin/impersonate/route.ts
- [x] T123 [US4] Implement impersonation token generation with JWT
- [x] T124 [US4] Update authentication middleware to handle impersonation tokens
- [x] T125 [US4] Add impersonation indicator to UI header when active
- [ ] T126 [US4] Implement impersonation audit logging

### E2E Test for User Story 4

- [x] T127 [US4] Create E2E test for impersonation in tests/e2e/impersonation.spec.ts

**Checkpoint**: Super Admins can now manage organizations and provide customer support through impersonation. All administrative operations are audited.

---

## Phase 7: User Story 5 - Photo Diagnostics (Priority: P5)

**Goal**: Technicians can upload photos during troubleshooting for visual analysis. The Diagnostician Agent uses vision models to identify components, detect wear or damage, and cross-reference with manual diagrams.

**Independent Test**: Upload a photo of a circuit board showing visible components and wiring during a troubleshooting session. The system should identify key components (terminals, connections, visible part numbers) and check if the configuration matches the wiring diagram in the manual. If discrepancies are found, the system should highlight them.

### Vision Model Integration

- [x] T128 [P] [US5] Add vision model support to Diagnostician Agent in lib/agents/diagnostician.ts
- [x] T129 [US5] Implement photo analysis logic using Gemini 1.5 Pro vision capabilities
- [ ] T130 [US5] Implement component identification from photos
- [ ] T131 [US5] Implement wear/damage detection from photos
- [ ] T132 [US5] Implement wiring diagram cross-reference logic

### Photo Upload & Storage

- [x] T133 [P] [US5] Configure Supabase Storage bucket for photo uploads
- [ ] T134 [US5] Implement photo upload to Supabase Storage in PhotoUpload component
- [x] T135 [US5] Update chat API to handle photo URLs in messages
- [ ] T136 [US5] Store photo references in conversation_messages table

### UI Enhancements

- [ ] T137 [US5] Enhance PhotoUpload component with drag-and-drop support
- [ ] T138 [US5] Add photo preview in chat message list
- [ ] T139 [US5] Add loading indicator during photo analysis

### E2E Test for User Story 5

- [ ] T140 [US5] Create E2E test for photo-based diagnostics in tests/e2e/photo-diagnostics.spec.ts

**Checkpoint**: All five user stories are now complete. The platform supports full multimodal troubleshooting with photo analysis.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance & Optimization

- [ ] T141 [P] Implement API route caching where appropriate
- [ ] T142 [P] Add Next.js Image optimization for uploaded photos
- [ ] T143 [P] Implement dynamic imports for admin console (code splitting)
- [ ] T144 [P] Optimize bundle size using Next.js built-in analyzer
- [ ] T145 [P] Add loading states and Suspense boundaries to all pages

### Accessibility

- [ ] T146 [P] Add keyboard navigation to chat interface
- [ ] T147 [P] Add ARIA labels to SafetyLockoutModal
- [ ] T148 [P] Ensure all forms have proper labels and error associations
- [ ] T149 [P] Run axe-core accessibility tests
- [ ] T150 [P] Test with screen readers (NVDA/JAWS)

### Documentation & Testing

- [x] T151 [P] Create seed data script in supabase/seed.sql with test organizations and users
- [ ] T152 [P] Document environment variables in README.md
- [ ] T153 [P] Validate quickstart.md workflows work correctly
- [x] T154 [P] Create deployment guide in docs/deployment.md
- [ ] T155 [P] Run full E2E test suite and fix any failures

### Security Hardening

- [ ] T156 [P] Implement rate limiting on all API routes
- [ ] T157 [P] Add CSRF protection to form submissions
- [ ] T158 [P] Validate file uploads for malicious content
- [ ] T159 [P] Run security audit with npm audit
- [ ] T160 [P] Review and test all RLS policies for bypass vulnerabilities

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed)
  - OR sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent (but US1 must exist for full testing)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US1 sessions but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independent admin functionality
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Agent contracts before agent implementations
- API routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (All run in parallel)**:
- T002 (install dependencies), T003 (TypeScript), T004 (ESLint), T005 (Tailwind), T006 (Shadcn), T007 (directories), T008 (.env), T009 (.gitignore), T010 (Vitest), T011 (Playwright)

**Foundational Phase (Many run in parallel)**:
- T014 (pgvector), T015 (indexes) - parallel
- T016-T022 (RLS policies) - can write in parallel, applied together in migration
- T026-T028 (Supabase clients) - parallel
- T029-T033 (middleware, error handling, validation, rate limiting) - parallel
- T034-T037 (RAG engine) - parallel
- T038-T043 (types, components, layouts) - parallel

**User Story 1 (Within story parallelism)**:
- T044, T045, T046 (E2E tests) - parallel
- T047, T052 (agent contracts) - parallel
- T051, T056 (agent unit tests) - parallel after implementation
- T062, T063, T064 (API routes) - parallel
- T065-T068 (UI components) - parallel

**User Story 2**:
- T079, T080 (tests) - parallel
- T081, T082 (API routes) - parallel
- T088-T095 (manual APIs) - can work in parallel

**User Story 3**:
- T106, T109 (API routes) - parallel after T098-T105
- T110, T111 (UI components) - parallel

**User Story 4**:
- T116, T117, T118 (API routes) - parallel
- T119, T120 (UI components) - parallel

**User Story 5**:
- T128-T132 (vision integration) - sequential
- T133, T134 (storage setup) - parallel

**Polish Phase (All run in parallel)**:
- T141-T145 (performance) - parallel
- T146-T150 (accessibility) - parallel
- T151-T155 (documentation) - parallel
- T156-T160 (security) - parallel

---

## Parallel Example: User Story 1 (Safe Troubleshooting)

```bash
# Launch all E2E tests for User Story 1 together:
Task: "Create E2E test 'The Death Jump' in tests/e2e/death-jump.spec.ts"
Task: "Create E2E test for safety lockout modal in tests/e2e/safety-lockout.spec.ts"
Task: "Create E2E test for photo verification in tests/e2e/photo-verification.spec.ts"

# Launch agent contracts together:
Task: "Create Guardian Agent contract interface in lib/agents/guardian.ts"
Task: "Create Diagnostician Agent contract interface in lib/agents/diagnostician.ts"

# Launch API routes together (after agents are complete):
Task: "Create POST /api/chat/session route in app/api/chat/session/route.ts"
Task: "Create POST /api/safety/check route in app/api/safety/check/route.ts"
Task: "Create POST /api/safety/verify-photo route in app/api/safety/verify-photo/route.ts"

# Launch UI components together:
Task: "Create MessageList component in app/components/chat/MessageList.tsx"
Task: "Create MessageInput component in app/components/chat/MessageInput.tsx"
Task: "Create SafetyLockoutModal component in app/components/chat/SafetyLockoutModal.tsx"
Task: "Create PhotoUpload component in app/components/chat/PhotoUpload.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T011)
2. Complete Phase 2: Foundational (T012-T043) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T044-T078)
4. **STOP and VALIDATE**: Run "The Death Jump" E2E test - verify Guardian Agent blocks dangerous requests
5. **Deploy/Demo**: MVP is ready - safe troubleshooting with Guardian protection works independently

### Incremental Delivery

1. **Foundation** (Phase 1 + 2): Setup + Foundational → ~43 tasks → Foundation ready
2. **MVP** (Phase 3): Add User Story 1 → ~35 tasks → Test independently → Deploy/Demo (Core safety feature live!)
3. **Multi-Tenancy** (Phase 4): Add User Story 2 → ~18 tasks → Test independently → Deploy/Demo (Production-ready for customers)
4. **Reports** (Phase 5): Add User Story 3 → ~18 tasks → Test independently → Deploy/Demo (Full technician workflow)
5. **Admin** (Phase 6): Add User Story 4 → ~12 tasks → Test independently → Deploy/Demo (Platform management complete)
6. **Vision** (Phase 7): Add User Story 5 → ~13 tasks → Test independently → Deploy/Demo (Full multimodal experience)
7. **Polish** (Phase 8): Final improvements → ~20 tasks → Production-ready

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together (T001-T043)
2. **Week 2+**: Once Foundational is done:
   - **Developer A**: User Story 1 (Safe Troubleshooting) - T044-T078
   - **Developer B**: User Story 2 (Data Isolation) - T079-T097
   - **Developer C**: User Story 3 (CMMS Reports) - T098-T115
3. **Integration**: Stories complete and integrate independently
4. **Week 3**: Admin (US4) and Vision (US5) features
5. **Week 4**: Polish and production deployment

---

## Summary Statistics

- **Total Tasks**: 160
- **Phase 1 (Setup)**: 11 tasks
- **Phase 2 (Foundational)**: 32 tasks (BLOCKS all user stories)
- **Phase 3 (US1 - Safe Troubleshooting)**: 35 tasks 🎯 MVP
- **Phase 4 (US2 - Data Isolation)**: 18 tasks
- **Phase 5 (US3 - CMMS Reports)**: 18 tasks
- **Phase 6 (US4 - Admin Management)**: 12 tasks
- **Phase 7 (US5 - Photo Diagnostics)**: 13 tasks
- **Phase 8 (Polish)**: 20 tasks

**Parallelization Opportunities**:
- Setup: 10/11 tasks can run in parallel
- Foundational: ~25/32 tasks can run in parallel
- User Stories: All 5 stories can run in parallel after Foundational completes
- Within each story: 30-50% of tasks can run in parallel

**Critical Path to MVP**:
Setup (sequential start) → Foundational (32 tasks, many parallel) → User Story 1 (35 tasks, many parallel) → MVP ready!

**Suggested MVP Scope**: Complete through Phase 3 (User Story 1) = ~78 tasks total

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify E2E tests fail before implementing features
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tasks include specific file paths for immediate execution
- Guardian Agent (US1) is the most critical safety feature - prioritize thoroughly
- RLS policies (US2) are essential for production - test rigorously
- The "Death Jump" E2E test (T044) is THE critical safety validation
