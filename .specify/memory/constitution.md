<!--
SYNC IMPACT REPORT
==================
Version Change: [NEW] → 1.0.0
Rationale: Initial constitution creation with 7 core principles focused on web standards,
           best practices, and quality-driven development.

Modified Principles: N/A (new constitution)
Added Sections: All sections (initial creation)
  - 7 Core Principles (Security-First, Component-First, Test Coverage Required,
    Type Safety, Performance by Design, Accessibility First, Developer Experience)
  - Development Standards
  - Code Quality Gates
  - Governance

Removed Sections: N/A

Templates Status:
  ✅ spec-template.md - Reviewed, aligned with constitution requirements
  ✅ plan-template.md - Reviewed, constitution check section applies
  ✅ tasks-template.md - Reviewed, task organization matches principles

Follow-up TODOs: None - all placeholders filled
-->

# TechGuard AI Constitution

## Core Principles

### I. Security-First

Security MUST be the top priority in all development decisions. This includes:

- All user inputs MUST be validated and sanitized
- Authentication and authorization MUST be implemented before feature deployment
- Sensitive data MUST be encrypted at rest and in transit
- Security headers MUST be configured (CSP, HSTS, X-Frame-Options)
- Dependencies MUST be regularly audited for vulnerabilities
- API endpoints MUST implement rate limiting and input validation
- Secrets MUST never be committed to version control

**Rationale**: Given the AI-focused nature of TechGuard AI, protecting user data and
ensuring system integrity is paramount. Security breaches can undermine user trust and
violate regulatory requirements.

### II. Component-First Architecture

Every UI feature MUST be built as reusable, modular components:

- Components MUST be self-contained with clear, single responsibilities
- Components MUST accept props with TypeScript interfaces
- Shared components MUST be documented with examples
- Components MUST be independently testable
- Avoid monolithic page components; break into logical sub-components

**Rationale**: Next.js and React thrive on component composition. Modular components
improve maintainability, enable reuse across the application, and facilitate parallel
development efforts.

### III. Test Coverage Required

Testing MUST be implemented for all features, though timing is flexible:

- All new features MUST have corresponding tests (unit, integration, or E2E)
- Tests MUST cover happy paths and critical error scenarios
- Critical user flows MUST have integration or E2E test coverage
- Test files MUST be co-located or organized in parallel test directories
- Broken tests MUST be fixed before merging to main branch
- Minimum coverage targets: 70% for critical paths, 50% overall

**Rationale**: Tests prevent regressions, document expected behavior, and enable
confident refactoring. While strict TDD is not enforced, test coverage ensures
code quality and reduces production bugs.

### IV. Type Safety with TypeScript

TypeScript MUST be used throughout the codebase with strict mode enabled:

- `any` type is forbidden except with explicit justification
- All function parameters and return types MUST be explicitly typed
- API responses MUST have defined TypeScript interfaces
- Props interfaces MUST be defined for all React components
- Type assertions MUST be justified with comments
- No `@ts-ignore` without documented rationale

**Rationale**: TypeScript catches errors at compile time, serves as living documentation,
and enables better IDE support. Strict typing prevents runtime errors and improves
code maintainability.

### V. Performance by Design

Performance MUST be considered from the start, not as an afterthought:

- Images MUST use Next.js Image component with proper sizing
- Code splitting MUST be implemented using dynamic imports for heavy components
- Bundle size MUST be monitored; additions >50KB require justification
- API routes MUST respond within 200ms (p95) or document why exceptions needed
- Core Web Vitals MUST meet "Good" thresholds (LCP <2.5s, FID <100ms, CLS <0.1)
- Client-side rendering MUST be justified; prefer SSR/SSG where applicable

**Rationale**: Performance directly impacts user experience and SEO rankings.
Next.js provides powerful optimization tools; we must leverage them to ensure
fast, responsive experiences.

### VI. Accessibility First (WCAG 2.1 AA)

Accessibility MUST be built in, not bolted on:

- All interactive elements MUST be keyboard accessible
- Semantic HTML MUST be used (headings, landmarks, lists)
- Images MUST have descriptive alt text
- Color contrast MUST meet WCAG AA standards (4.5:1 for normal text)
- Forms MUST have proper labels and error messaging
- ARIA attributes MUST be used correctly when semantic HTML insufficient
- Focus indicators MUST be visible and distinct

**Rationale**: Accessibility ensures our application is usable by everyone,
including people with disabilities. It's both an ethical imperative and often
a legal requirement.

### VII. Developer Experience (DX)

Code MUST be written for humans first, machines second:

- Code MUST be self-documenting with clear naming conventions
- Complex logic MUST include explanatory comments
- Configuration MUST use environment variables with `.env.example` template
- Setup instructions MUST be maintained in README.md
- Error messages MUST be actionable and include context
- Linting and formatting MUST be automated (ESLint, Prettier)
- Git commits MUST follow conventional commit format

**Rationale**: Great developer experience accelerates development, reduces onboarding
time, and minimizes debugging friction. Clear code and processes enable team
collaboration and long-term maintainability.

## Development Standards

### Code Organization

- Follow Next.js App Router conventions (`app/` directory structure)
- Group related features in directories (components, hooks, utils, types)
- Keep files focused; split when exceeding 300 lines
- Use barrel exports (`index.ts`) for public APIs

### Styling Standards

- Use Tailwind CSS for styling (already configured)
- Avoid inline styles except for dynamic values
- Define custom design tokens in `tailwind.config.ts`
- Use CSS modules for component-specific complex styles

### State Management

- Use React hooks (useState, useReducer) for local state
- Use Context API for shared state across component trees
- Consider Zustand or Redux for complex global state (requires approval)
- Avoid prop drilling beyond 2 levels

### API Design

- RESTful conventions for API routes (`app/api/`)
- Use standard HTTP status codes correctly
- Validate request bodies with Zod or similar schema validation
- Return consistent error response format

## Code Quality Gates

All code MUST pass these gates before merging:

1. **TypeScript Compilation**: `npm run build` must succeed with zero errors
2. **Linting**: `npm run lint` must pass with zero errors
3. **Tests**: All tests must pass; coverage targets met for changed files
4. **Code Review**: At least one approved review from team member
5. **Performance**: No lighthouse score regressions for affected pages

## Governance

### Amendment Process

1. Proposed changes MUST be documented in a PR with rationale
2. Team discussion required for principle additions/modifications
3. Changes require approval from project maintainer(s)
4. Version MUST be incremented following semantic versioning:
   - **MAJOR**: Backward incompatible changes (removing/redefining principles)
   - **MINOR**: New principles or substantial expansions
   - **PATCH**: Clarifications, typos, non-semantic refinements

### Compliance Review

- All pull requests MUST verify compliance with this constitution
- Violations MUST be justified with documented trade-offs
- Unjustified complexity or pattern violations MUST be rejected
- Constitution MUST be reviewed quarterly and updated as needed

### Version Control

This constitution supersedes all informal practices and undocumented conventions.
When conflicts arise, constitution principles take precedence. Developers should
reference this document when making architectural and implementation decisions.

**Version**: 1.0.0 | **Ratified**: 2026-01-19 | **Last Amended**: 2026-01-19
