# Feature Specification: TechGuard AI - Industrial Safety Troubleshooting Platform

**Feature Branch**: `001-techguard-ai-mvp`
**Created**: 2026-01-19
**Status**: Draft
**Input**: User description: "TechGuard AI is a multi-tenant SaaS platform for industrial field technicians to troubleshoot legacy machinery with AI assistance. Core features: 1) Safety Guardian architecture that intercepts and blocks dangerous advice (e.g., bridging voltage sources) based on machine manuals; 2) Isolation Protocol requiring photo verification before revealing dangerous procedures; 3) Multi-tenancy with strict data isolation using Supabase RLS; 4) Three roles: Super Admin (global access, can impersonate orgs), Org Admin (tenant management), Technician (troubleshooting access); 5) CMMS Bridge for automated service report generation; 6) Federated RAG engine with safety_blacklist table for negative constraints; 7) Multimodal chat supporting text and photo uploads for diagnostics; 8) Super Admin console for managing organizations. Tech stack: Next.js 14, Supabase PostgreSQL with pgvector, Tailwind+Shadcn/UI, Vercel AI SDK, Gemini 1.5 Pro/Claude 3.5 Sonnet. Critical success criteria: System MUST block dangerous terminal jumps, technicians MUST NOT access other org data, generated CMMS reports must accurately reflect troubleshooting steps."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Field Technician Safe Troubleshooting (Priority: P1)

A field technician troubleshooting a legacy industrial machine (e.g., a Domino M230i printer) needs step-by-step guidance to diagnose and fix issues. When the technician asks about testing electrical connections, the system must automatically detect if the requested action violates manufacturer safety guidelines (such as jumping terminals that connect internal and external voltage sources). If a dangerous action is detected, the system must block the advice and initiate a safety protocol that requires physical isolation verification before revealing any further instructions.

**Why this priority**: This is the core safety value proposition. Preventing technician injuries and equipment damage is the primary reason for TechGuard AI's existence. Without this feature, the platform would be no different from a standard chatbot and could actively create liability.

**Independent Test**: Can be fully tested by asking the system to "jump Terminal 29 to Terminal 21" on a Domino M230i (a known dangerous procedure documented in the manual). The system should block the response, display a safety warning, and refuse to provide instructions unless proper isolation is verified.

**Acceptance Scenarios**:

1. **Given** a technician is troubleshooting a machine and asks "How do I test if Terminal 21 is getting power?", **When** the system detects this is a safe diagnostic question, **Then** the system provides step-by-step guidance based on the machine manual
2. **Given** a technician asks "Can I jump Terminal 29 to Terminal 21 to test?", **When** the system checks the safety blacklist and finds this action is prohibited for this machine model, **Then** the system blocks the response and displays a critical safety warning
3. **Given** the safety protocol is triggered, **When** the technician is shown the lockout screen, **Then** the chat input is disabled and the technician must acknowledge the safety warning and provide proof of isolation
4. **Given** the technician uploads a photo showing the power cable disconnected, **When** the system analyzes the photo, **Then** the system verifies the isolation is complete and unlocks the safe testing procedure
5. **Given** a technician completes a troubleshooting session, **When** they view the session history, **Then** all safety interventions are clearly logged and documented

---

### User Story 2 - Multi-Organization Data Isolation (Priority: P2)

Organizations (companies) that subscribe to TechGuard AI must have complete data privacy. Company A's machine manuals, troubleshooting sessions, chat histories, and custom safety rules must be completely isolated from Company B's data. A technician from Company A must never see, search, or access any information from Company B, even if both companies work on the same model of machinery.

**Why this priority**: Data isolation is a legal and competitive requirement for a multi-tenant SaaS platform. Violating this would create severe liability, breach contracts, and potentially expose trade secrets. This is a blocking requirement for any paid customer.

**Independent Test**: Create two organizations (Company A and Company B). Upload a unique manual to Company A (e.g., "Company A Custom Wiring Guide"). Log in as a technician from Company B and attempt to search for or access this manual. The system should return no results and provide no access.

**Acceptance Scenarios**:

1. **Given** Company A uploads a proprietary machine manual, **When** a technician from Company B searches for troubleshooting guidance, **Then** the technician only sees manuals and data belonging to Company B
2. **Given** a technician from Company A is troubleshooting a machine, **When** they view their session history, **Then** they only see sessions from their own organization
3. **Given** Company A has custom safety blacklist rules for their specific machine configurations, **When** a technician from Company B troubleshoots the same machine model, **Then** they see only global or Company B-specific safety rules, never Company A's custom rules
4. **Given** an organization is marked as "Suspended", **When** any user from that organization attempts to log in, **Then** access is immediately denied with a clear message
5. **Given** multiple organizations exist in the system, **When** system reports or analytics are generated, **Then** each organization's data remains completely separated

---

### User Story 3 - CMMS Integration Report Generation (Priority: P3)

Field technicians must create service reports for external Computerized Maintenance Management Systems (CMMS) like SAP or Maximo after each repair. Manually writing these reports is time-consuming and error-prone. The system should automatically generate a structured service report based on the troubleshooting conversation, formatted in the standard "As Found / Work Performed / As Left" structure that CMMS systems require.

**Why this priority**: This feature provides significant time savings and reduces administrative burden for technicians. While not safety-critical, it directly impacts technician productivity and customer satisfaction. A technician who saves 15-30 minutes per ticket can complete more work orders per day.

**Independent Test**: Start a troubleshooting session with a work order number (e.g., "WO-12345"). Conduct a full troubleshooting conversation (describe symptom, run diagnostics, perform fix, verify solution). End the session and request the service report. The system should generate a properly formatted report that accurately summarizes all steps taken.

**Acceptance Scenarios**:

1. **Given** a technician starts a troubleshooting session, **When** they provide a work order number, **Then** the system associates all subsequent actions with that work order
2. **Given** a troubleshooting session is in progress, **When** the technician describes symptoms, runs tests, and performs repairs, **Then** the system tracks all key actions and outcomes
3. **Given** a technician completes troubleshooting and clicks "Generate Report", **When** the system processes the session, **Then** a report is generated with three clear sections: "As Found" (initial symptoms), "Work Performed" (tests and repairs done), and "As Left" (final machine status)
4. **Given** a service report is generated, **When** the technician views the report, **Then** they can copy it to clipboard with one click for pasting into their CMMS
5. **Given** a troubleshooting session included safety interventions, **When** the report is generated, **Then** all safety warnings and isolation protocols are documented in the "Work Performed" section

---

### User Story 4 - Super Admin Organization Management (Priority: P4)

The platform owner (TechGuard AI) needs global oversight and administrative control over all customer organizations. A Super Admin must be able to view all registered organizations, see usage metrics, suspend organizations for non-payment or violations, and access any organization's environment for customer support purposes (with appropriate audit logging).

**Why this priority**: Essential for platform operations, billing enforcement, and customer support, but not required for the core user experience. This enables the business to operate but doesn't directly affect end-user technicians.

**Independent Test**: Log in as a Super Admin. View the global organizations dashboard showing all customer companies. Suspend one organization and verify that all users from that organization are immediately blocked from access. Impersonate an Org Admin from a different organization and verify you can view their dashboard as if you were logged in as them.

**Acceptance Scenarios**:

1. **Given** a Super Admin logs into the platform, **When** they access the admin console, **Then** they see a list of all organizations with names, user counts, and current status (Active/Suspended)
2. **Given** a Super Admin views the organizations list, **When** they toggle an organization's status to "Suspended", **Then** all users from that organization are immediately blocked from accessing the platform
3. **Given** a customer contacts support with an issue, **When** the Super Admin clicks "Impersonate" for that customer's organization, **Then** the Super Admin views the platform exactly as that organization's admin would see it
4. **Given** a Super Admin uploads a "global manual" (not tied to any specific organization), **When** any technician from any organization troubleshoots that machine model, **Then** they can access this global manual in addition to their organization-specific manuals
5. **Given** a Super Admin performs any privileged action, **When** the action is completed, **Then** the action is logged with timestamp, admin identity, and organization affected for audit purposes

---

### User Story 5 - Photo-Based Diagnostics (Priority: P5)

Technicians troubleshooting machinery often need to describe what they're seeing (worn parts, wiring configurations, error displays). Typing descriptions is slow and often imprecise. The system should allow technicians to upload photos at any time during troubleshooting, and the system should analyze the photo to identify components, detect wear or damage, and cross-reference with manual diagrams.

**Why this priority**: Enhances troubleshooting effectiveness and user experience, but the platform provides value even without this feature. This is an incremental improvement that makes the system more powerful but isn't blocking for initial deployment.

**Independent Test**: Upload a photo of a circuit board showing visible components and wiring. The system should identify key components (terminals, connections, visible part numbers) and check if the configuration matches the wiring diagram in the manual. If discrepancies are found, the system should highlight them.

**Acceptance Scenarios**:

1. **Given** a technician is in an active troubleshooting session, **When** they click the camera/upload button and attach a photo, **Then** the photo is submitted as part of the conversation and the system begins visual analysis
2. **Given** a technician uploads a photo of machinery, **When** the system analyzes the image, **Then** the system identifies visible components, labels, and part numbers visible in the photo
3. **Given** a photo shows a wiring configuration, **When** the system has access to the machine's wiring diagram in the manual, **Then** the system compares the photo to the diagram and identifies any discrepancies
4. **Given** a photo shows visible wear or damage (e.g., burned components, loose connections), **When** the system analyzes the image, **Then** the system flags the damage and suggests relevant troubleshooting steps
5. **Given** a photo is uploaded during a session that later triggers a safety lockout, **When** the isolation protocol requires verification, **Then** the technician can upload another photo to prove power has been disconnected

---

### Edge Cases

- What happens when a technician asks about a machine model that has no manual uploaded to the system?
- How does the system handle ambiguous questions that might be safety-critical (e.g., "Can I test this?")?
- What happens if the photo verification system cannot clearly determine if isolation is complete?
- How does the system handle partial or corrupted manual uploads?
- What happens if a technician loses internet connection mid-troubleshooting?
- How does the system handle safety blacklist rules that conflict with each other for the same machine model?
- What happens when a Super Admin is impersonating an organization and that organization is suspended by another admin?
- How does the system handle manual uploads that are in non-English languages?
- What happens if a CMMS report is requested for a session with no actionable work performed?
- How does the system handle multiple technicians from the same organization troubleshooting the same machine simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

#### Safety & Risk Management

- **FR-001**: System MUST analyze every user request to detect safety-critical intents (such as "jump", "bypass", "test across", "connect") before generating any response
- **FR-002**: System MUST maintain a blacklist of prohibited actions for each machine model, derived from manufacturer safety warnings in machine manuals
- **FR-003**: System MUST block responses immediately when a user's request matches a blacklisted procedure and display a critical safety warning instead
- **FR-004**: System MUST trigger an Isolation Protocol lockout that disables chat input when a high-risk action is detected
- **FR-005**: System MUST require photo evidence of physical isolation (e.g., disconnected power cable) before revealing any further instructions after a safety lockout
- **FR-006**: System MUST analyze uploaded verification photos to confirm isolation is complete before unlocking the chat
- **FR-007**: System MUST log all safety interventions with full context (user, organization, machine model, blocked action, timestamp) for liability documentation

#### Multi-Tenancy & Access Control

- **FR-008**: System MUST support multiple independent organizations (tenants) with complete data isolation
- **FR-009**: System MUST enforce that users can ONLY access data (manuals, sessions, reports) belonging to their own organization
- **FR-010**: System MUST support three distinct user roles: Super Admin (global access), Org Admin (tenant admin), and Technician (end user)
- **FR-011**: Super Admin MUST be able to view and manage all organizations in the system
- **FR-012**: Super Admin MUST be able to suspend any organization, immediately revoking access for all users in that organization
- **FR-013**: Super Admin MUST be able to impersonate any Org Admin to view the platform from that organization's perspective for support purposes
- **FR-014**: Org Admin MUST be able to invite and manage users within their own organization only
- **FR-015**: Org Admin MUST be able to upload organization-specific machine manuals that are only accessible to their organization's technicians

#### Troubleshooting & Diagnostics

- **FR-016**: System MUST allow technicians to start a troubleshooting session by selecting a machine model and optionally providing a work order number
- **FR-017**: System MUST provide an interactive chat interface where technicians can ask questions and receive step-by-step guidance
- **FR-018**: System MUST retrieve relevant information from uploaded machine manuals to answer troubleshooting questions
- **FR-019**: System MUST support both text-based questions and photo uploads during troubleshooting
- **FR-020**: System MUST analyze uploaded photos to identify machinery components, wiring configurations, and visible damage
- **FR-021**: System MUST cross-reference photo contents with manual diagrams and specifications when available
- **FR-022**: System MUST maintain a complete history of all troubleshooting sessions for each user

#### Reporting & Integration

- **FR-023**: System MUST automatically generate a service report summarizing each completed troubleshooting session
- **FR-024**: Service reports MUST follow the standard "As Found / Work Performed / As Left" format used by CMMS systems
- **FR-025**: Service reports MUST include the work order number if provided at session start
- **FR-026**: Service reports MUST accurately reflect all diagnostic tests performed and repairs attempted during the session
- **FR-027**: Service reports MUST document any safety interventions or lockouts that occurred during troubleshooting
- **FR-028**: System MUST provide a one-click copy function to allow technicians to easily paste reports into external CMMS systems

#### Content Management

- **FR-029**: System MUST allow Org Admins to upload machine manuals in standard document formats
- **FR-030**: System MUST extract text content and safety warnings from uploaded manuals
- **FR-031**: System MUST build a searchable knowledge base from manual contents for each organization
- **FR-032**: Super Admin MUST be able to upload "global manuals" accessible to all organizations
- **FR-033**: System MUST maintain version history for all manual uploads, allowing organizations to keep all versions with active/archived status designation
- **FR-034**: System MUST identify and extract safety warnings from manuals to automatically populate the safety blacklist

#### User Experience

- **FR-035**: System MUST provide a mobile-optimized interface suitable for field technicians working on-site
- **FR-036**: System MUST use clear visual indicators (color coding, icons) to distinguish safety warnings from normal guidance
- **FR-037**: Safety lockout modal MUST be unmissable and cannot be dismissed without completing the isolation protocol
- **FR-038**: System MUST provide clear, actionable error messages when users encounter access restrictions or errors

### Assumptions

- Technicians will have internet connectivity during troubleshooting sessions (offline mode is not included in MVP)
- Manuals will be provided in searchable formats (PDF with text layer, not scanned images)
- Organizations will use standard CMMS systems that accept plain text or formatted text input
- Photo uploads will be in standard image formats (JPEG, PNG)
- The platform will initially support English-language manuals and interfaces
- Technicians will have smartphones or tablets with cameras for photo capture

### Key Entities *(include if feature involves data)*

- **Organization (Tenant)**: Represents a subscribing company. Contains company name, subscription status (Active/Suspended), user count, and subscription tier. Organizations have complete data isolation from each other.

- **User Profile**: Represents a person using the system. Associated with exactly one Organization. Has a role (Super Admin, Org Admin, or Technician), full name, contact information, and authentication credentials. Super Admins are not tied to any specific organization.

- **Machine Manual**: Represents technical documentation for a specific machine model. Contains manual title, machine model identifier, full text content, and extracted safety warnings. Can be organization-specific (only visible to one organization) or global (visible to all organizations).

- **Safety Blacklist Rule**: Represents a prohibited action for a specific machine model. Contains a description of the dangerous procedure (e.g., "Do not connect Internal 0V to External 0V"), the machine model it applies to, and severity level (Critical, High, Medium). Derived from manual safety warnings.

- **Troubleshooting Session (Incident)**: Represents one complete troubleshooting interaction. Contains the technician who performed the work, the organization they belong to, the machine model being serviced, the external work order number (if provided), the complete conversation history, safety interventions that occurred, and the generated service report. Has a status (Open, Resolved, Abandoned).

- **Conversation Message**: Individual message within a troubleshooting session. Can be text from the user, text from the AI, a safety warning, or an uploaded photo. Messages are ordered chronologically within a session.

- **Service Report**: The final output of a troubleshooting session, formatted for CMMS integration. Contains work order number, "As Found" description (initial symptoms), "Work Performed" steps (all diagnostic and repair actions), and "As Left" status (final machine condition). Generated automatically from the conversation history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully blocks 100% of user attempts to perform procedures listed in the safety blacklist (verified through automated testing of known dangerous procedures)

- **SC-002**: Zero cross-tenant data leaks - Technicians from Organization A cannot access any manuals, sessions, or data from Organization B (verified through penetration testing and role-based access audits)

- **SC-003**: Generated service reports accurately include at least 95% of substantive troubleshooting actions performed during the session (verified by human review of sample reports against full conversation logs)

- **SC-004**: Technicians can complete the core troubleshooting workflow (start session, ask question, receive guidance, generate report) in under 5 minutes for simple issues

- **SC-005**: Safety lockout protocol triggers within 2 seconds of detecting a dangerous request, preventing any harmful guidance from being displayed

- **SC-006**: Photo verification successfully identifies valid isolation evidence in at least 90% of clear photos showing disconnected power (verified through test photo submissions)

- **SC-007**: System maintains response time of under 3 seconds for normal troubleshooting questions when the manual contains relevant information

- **SC-008**: Super Admin can suspend an organization and verify access revocation within 30 seconds

- **SC-009**: Platform achieves combined adoption targets: minimum 10 paying organizations onboarded, 100 monthly active technicians, and 500 troubleshooting sessions per month within 6 months of launch

- **SC-010**: Service report generation completes within 10 seconds and produces a properly formatted output for all completed sessions

- **SC-011**: System achieves 95% uptime during business hours (Monday-Friday, 6 AM - 6 PM in all supported time zones)

- **SC-012**: At least 85% of technicians report successfully solving their problem when asked "Did you solve the problem?" at the end of each troubleshooting session
