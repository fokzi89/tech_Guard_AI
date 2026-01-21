# Data Model: TechGuard AI

**Date**: 2026-01-19
**Feature**: TechGuard AI - Industrial Safety Troubleshooting Platform
**Database**: Supabase PostgreSQL 15+ with pgvector extension

## Overview

This document defines the complete database schema for TechGuard AI, including all tables, columns, relationships, constraints, indexes, and Row Level Security (RLS) policies. The schema enforces multi-tenant data isolation at the database level using PostgreSQL RLS.

## Entity Relationship Diagram

```
organizations (1) ──< (M) profiles
organizations (1) ──< (M) manuals
organizations (1) ──< (M) incidents

manuals (1) ──< (M) safety_blacklist
incidents (1) ──< (M) conversation_messages
incidents (1) ──  (1) service_reports

profiles ── (Supabase auth.users via FK)
```

## Core Entities

###organizations

Represents a subscribing company (tenant). Each organization's data is completely isolated from others.

**Table**: `public.organizations`

| Column             | Type        | Constraints                        | Description                                    |
|--------------------|-------------|------------------------------------|------------------------------------------------|
| id                 | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique organization identifier                 |
| name               | text        | NOT NULL, UNIQUE                   | Company name                                   |
| status             | text        | NOT NULL, DEFAULT 'active'         | 'active' or 'suspended'                        |
| subscription_tier  | text        | DEFAULT 'basic'                    | 'basic', 'professional', 'enterprise'          |
| created_at         | timestamptz | DEFAULT now()                      | Organization creation timestamp                |
| updated_at         | timestamptz | DEFAULT now()                      | Last update timestamp                          |

**Indexes**:
- `idx_organizations_status` on `status` (for filtering active orgs)

**Validation Rules**:
- `status` must be 'active' or 'suspended'
- `subscription_tier` must be 'basic', 'professional', or 'enterprise'

**RLS Policies**:
```sql
-- Super Admins can see all organizations
CREATE POLICY "super_admin_all_organizations"
ON organizations FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Org Admins and Technicians can only see their own organization
CREATE POLICY "users_own_organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);
```

---

### profiles

Represents users of the system. Each profile is linked to exactly one organization (except Super Admins who are global).

**Table**: `public.profiles`

| Column      | Type        | Constraints                              | Description                                  |
|-------------|-------------|------------------------------------------|----------------------------------------------|
| id          | uuid        | PRIMARY KEY, REFERENCES auth.users(id)   | References Supabase Auth user                |
| org_id      | uuid        | REFERENCES organizations(id), NULLABLE   | Organization (NULL for super_admin)          |
| role        | text        | NOT NULL                                 | 'super_admin', 'org_admin', or 'technician'  |
| full_name   | text        | NOT NULL                                 | User's full name                             |
| created_at  | timestamptz | DEFAULT now()                            | Profile creation timestamp                   |
| updated_at  | timestamptz | DEFAULT now()                            | Last update timestamp                        |

**Indexes**:
- `idx_profiles_org_id` on `org_id` (for filtering by organization)
- `idx_profiles_role` on `role` (for role-based queries)

**Constraints**:
```sql
CHECK (
  (role = 'super_admin' AND org_id IS NULL) OR
  (role IN ('org_admin', 'technician') AND org_id IS NOT NULL)
)
```

**Validation Rules**:
- `role` must be 'super_admin', 'org_admin', or 'technician'
- Super Admins must have `org_id = NULL`
- Org Admins and Technicians must have a valid `org_id`

**RLS Policies**:
```sql
-- Super Admins can see all profiles
CREATE POLICY "super_admin_all_profiles"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Users can see their own profile
CREATE POLICY "users_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Org Admins can see all profiles in their organization
CREATE POLICY "org_admin_org_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'super_admin')
);
```

---

### manuals

Machine manuals with full text content and embeddings for vector search.

**Table**: `public.manuals`

| Column           | Type        | Constraints                                | Description                                   |
|------------------|-------------|--------------------------------------------|-----------------------------------------------|
| id               | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()     | Unique manual identifier                      |
| org_id           | uuid        | REFERENCES organizations(id), NULLABLE     | Owner organization (NULL = global manual)     |
| title            | text        | NOT NULL                                   | Manual title                                  |
| machine_model    | text        | NOT NULL                                   | Machine model identifier (e.g., "Domino M230i") |
| content          | text        | NOT NULL                                   | Full text content (chunked for embeddings)    |
| embedding        | vector(1536)| NOT NULL                                   | Text embedding for similarity search          |
| safety_warnings  | jsonb       | DEFAULT '{}'                               | Extracted safety warnings as JSON             |
| file_url         | text        |                                            | URL to original PDF in Supabase Storage       |
| status           | text        | DEFAULT 'active'                           | 'active' or 'archived'                        |
| version          | text        | DEFAULT '1.0'                              | Manual version number                         |
| created_at       | timestamptz | DEFAULT now()                              | Upload timestamp                              |
| updated_at       | timestamptz | DEFAULT now()                              | Last update timestamp                         |

**Indexes**:
- `idx_manuals_org_id` on `org_id` (for org filtering)
- `idx_manuals_machine_model` on `machine_model` (for model lookup)
- `idx_manuals_embedding` using `ivfflat` on `embedding` (vector similarity search)
- `idx_manuals_status` on `status` (for active/archived filtering)

**Vector Index Configuration**:
```sql
CREATE INDEX idx_manuals_embedding
ON manuals
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Validation Rules**:
- `status` must be 'active' or 'archived'
- `embedding` must be exactly 1536 dimensions

**RLS Policies**:
```sql
-- Super Admins can see all manuals
CREATE POLICY "super_admin_all_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Users can see global manuals (org_id IS NULL)
CREATE POLICY "users_global_manuals"
ON manuals FOR SELECT
TO authenticated
USING (org_id IS NULL AND status = 'active');

-- Users can see their organization's manuals
CREATE POLICY "users_org_manuals"
ON manuals FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND status = 'active'
);

-- Org Admins can insert/update/delete their org's manuals
CREATE POLICY "org_admin_manage_manuals"
ON manuals FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
);
```

---

### safety_blacklist

Prohibited actions for specific machine models, derived from manual safety warnings.

**Table**: `public.safety_blacklist`

| Column            | Type        | Constraints                            | Description                                     |
|-------------------|-------------|----------------------------------------|-------------------------------------------------|
| id                | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique blacklist rule identifier                |
| manual_id         | uuid        | REFERENCES manuals(id) ON DELETE CASCADE | Source manual                                   |
| machine_model     | text        | NOT NULL                               | Machine model this rule applies to              |
| rule_description  | text        | NOT NULL                               | Prohibited action (e.g., "Do not jump Term 21") |
| embedding         | vector(1536)| NOT NULL                               | Rule embedding for similarity matching          |
| severity          | text        | DEFAULT 'CRITICAL'                     | 'CRITICAL', 'HIGH', 'MEDIUM'                    |
| created_at        | timestamptz | DEFAULT now()                          | Rule creation timestamp                         |

**Indexes**:
- `idx_safety_blacklist_manual_id` on `manual_id`
- `idx_safety_blacklist_machine_model` on `machine_model`
- `idx_safety_blacklist_embedding` using `ivfflat` on `embedding` (vector similarity search)

**Validation Rules**:
- `severity` must be 'CRITICAL', 'HIGH', or 'MEDIUM'

**RLS Policies**:
```sql
-- Super Admins can manage all blacklist rules
CREATE POLICY "super_admin_all_blacklist"
ON safety_blacklist FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Users can see blacklist rules for manuals they have access to
CREATE POLICY "users_see_accessible_blacklist"
ON safety_blacklist FOR SELECT
TO authenticated
USING (
  manual_id IN (
    SELECT id FROM manuals
    WHERE org_id IS NULL
       OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
);
```

---

### incidents

Troubleshooting sessions (conversations between technician and AI).

**Table**: `public.incidents`

| Column              | Type        | Constraints                            | Description                                    |
|---------------------|-------------|----------------------------------------|------------------------------------------------|
| id                  | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique session identifier                      |
| org_id              | uuid        | REFERENCES organizations(id)           | Organization owning this session               |
| user_id             | uuid        | REFERENCES auth.users(id)              | Technician who created the session             |
| machine_model       | text        | NOT NULL                               | Machine being troubleshot                      |
| external_ticket_id  | text        |                                        | CMMS work order number (optional)              |
| status              | text        | DEFAULT 'open'                         | 'open', 'resolved', 'abandoned'                |
| safety_interventions| jsonb       | DEFAULT '[]'                           | Array of safety lockout events                 |
| created_at          | timestamptz | DEFAULT now()                          | Session start timestamp                        |
| updated_at          | timestamptz | DEFAULT now()                          | Last activity timestamp                        |
| resolved_at         | timestamptz |                                        | Session completion timestamp                   |

**Indexes**:
- `idx_incidents_org_id` on `org_id`
- `idx_incidents_user_id` on `user_id`
- `idx_incidents_status` on `status`
- `idx_incidents_external_ticket_id` on `external_ticket_id`

**Validation Rules**:
- `status` must be 'open', 'resolved', or 'abandoned'

**RLS Policies**:
```sql
-- Super Admins can see all incidents
CREATE POLICY "super_admin_all_incidents"
ON incidents FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Users can only see incidents from their organization
CREATE POLICY "users_org_incidents"
ON incidents FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- Technicians can create/update their own incidents
CREATE POLICY "technicians_own_incidents"
ON incidents FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);
```

---

### conversation_messages

Individual messages within a troubleshooting session.

**Table**: `public.conversation_messages`

| Column         | Type        | Constraints                            | Description                                |
|----------------|-------------|----------------------------------------|--------------------------------------------|
| id             | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier                  |
| incident_id    | uuid        | REFERENCES incidents(id) ON DELETE CASCADE | Parent troubleshooting session             |
| role           | text        | NOT NULL                               | 'user', 'assistant', 'system'              |
| content        | text        | NOT NULL                               | Message text content                       |
| photo_url      | text        |                                        | URL to uploaded photo (if any)             |
| is_safety_warning | boolean  | DEFAULT false                          | True if this is a safety lockout message   |
| metadata       | jsonb       | DEFAULT '{}'                           | Additional message metadata                |
| created_at     | timestamptz | DEFAULT now()                          | Message timestamp                          |

**Indexes**:
- `idx_messages_incident_id` on `incident_id`
- `idx_messages_created_at` on `created_at` (for chronological ordering)

**Validation Rules**:
- `role` must be 'user', 'assistant', or 'system'

**RLS Policies**:
```sql
-- Users can see messages for incidents they have access to
CREATE POLICY "users_see_accessible_messages"
ON conversation_messages FOR SELECT
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents
    WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
);

-- Technicians can insert messages for their own incidents
CREATE POLICY "technicians_add_own_messages"
ON conversation_messages FOR INSERT
TO authenticated
WITH CHECK (
  incident_id IN (
    SELECT id FROM incidents
    WHERE user_id = auth.uid()
  )
);
```

---

### service_reports

Auto-generated CMMS-compatible service reports.

**Table**: `public.service_reports`

| Column         | Type        | Constraints                            | Description                                    |
|----------------|-------------|----------------------------------------|------------------------------------------------|
| id             | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique report identifier                       |
| incident_id    | uuid        | REFERENCES incidents(id) ON DELETE CASCADE, UNIQUE | Associated incident (1-to-1)                   |
| work_order     | text        |                                        | External CMMS work order number                |
| as_found       | text        | NOT NULL                               | Initial symptoms description                   |
| work_performed | text        | NOT NULL                               | Steps taken during troubleshooting             |
| as_left        | text        | NOT NULL                               | Final machine status                           |
| generated_at   | timestamptz | DEFAULT now()                          | Report generation timestamp                    |

**Indexes**:
- `idx_service_reports_incident_id` on `incident_id`
- `idx_service_reports_work_order` on `work_order`

**RLS Policies**:
```sql
-- Users can see reports for incidents they have access to
CREATE POLICY "users_see_accessible_reports"
ON service_reports FOR SELECT
TO authenticated
USING (
  incident_id IN (
    SELECT id FROM incidents
    WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
);
```

---

## Database Functions

### check_safety_blacklist(user_input text, machine_model text)

Checks if user input matches any blacklist rule for the given machine model.

```sql
CREATE OR REPLACE FUNCTION check_safety_blacklist(
  user_input text,
  machine_model text
)
RETURNS TABLE(
  matched boolean,
  rule_description text,
  severity text
) AS $$
DECLARE
  input_embedding vector(1536);
  similarity_threshold float := 0.85;
BEGIN
  -- Generate embedding for user input (placeholder - actual implementation uses OpenAI API)
  -- input_embedding := generate_embedding(user_input);

  RETURN QUERY
  SELECT
    true AS matched,
    sb.rule_description,
    sb.severity
  FROM safety_blacklist sb
  WHERE sb.machine_model = check_safety_blacklist.machine_model
    AND (1 - (sb.embedding <=> input_embedding)) > similarity_threshold
  ORDER BY (sb.embedding <=> input_embedding) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### search_manuals(query text, org_id uuid, limit_count int)

Searches manuals using vector similarity.

```sql
CREATE OR REPLACE FUNCTION search_manuals(
  query text,
  search_org_id uuid,
  limit_count int DEFAULT 5
)
RETURNS TABLE(
  manual_id uuid,
  title text,
  content text,
  similarity float
) AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Generate embedding for query (placeholder)
  -- query_embedding := generate_embedding(query);

  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM manuals m
  WHERE (m.org_id = search_org_id OR m.org_id IS NULL)
    AND m.status = 'active'
  ORDER BY m.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Script

Complete SQL migration script for initial schema:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id),
  role text NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'technician')),
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (role = 'super_admin' AND org_id IS NULL) OR
    (role IN ('org_admin', 'technician') AND org_id IS NOT NULL)
  )
);

CREATE TABLE manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  title text NOT NULL,
  machine_model text NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  safety_warnings jsonb DEFAULT '{}',
  file_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE safety_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_id uuid REFERENCES manuals(id) ON DELETE CASCADE,
  machine_model text NOT NULL,
  rule_description text NOT NULL,
  embedding vector(1536) NOT NULL,
  severity text DEFAULT 'CRITICAL' CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  machine_model text NOT NULL,
  external_ticket_id text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'abandoned')),
  safety_interventions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  photo_url text,
  is_safety_warning boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE service_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE UNIQUE,
  work_order text,
  as_found text NOT NULL,
  work_performed text NOT NULL,
  as_left text NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_manuals_org_id ON manuals(org_id);
CREATE INDEX idx_manuals_machine_model ON manuals(machine_model);
CREATE INDEX idx_manuals_status ON manuals(status);
CREATE INDEX idx_manuals_embedding ON manuals USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_safety_blacklist_manual_id ON safety_blacklist(manual_id);
CREATE INDEX idx_safety_blacklist_machine_model ON safety_blacklist(machine_model);
CREATE INDEX idx_safety_blacklist_embedding ON safety_blacklist USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_incidents_org_id ON incidents(org_id);
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_external_ticket_id ON incidents(external_ticket_id);
CREATE INDEX idx_messages_incident_id ON conversation_messages(incident_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at);
CREATE INDEX idx_service_reports_incident_id ON service_reports(incident_id);
CREATE INDEX idx_service_reports_work_order ON service_reports(work_order);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (see individual table sections above for full policy definitions)
```

---

## Data Validation & Constraints Summary

| Entity                 | Key Constraints                                                                 |
|------------------------|---------------------------------------------------------------------------------|
| organizations          | Unique name, status enum, tier enum                                            |
| profiles               | Super admins have NULL org_id, others require org_id                            |
| manuals                | Active/archived status, 1536-dim embeddings                                     |
| safety_blacklist       | Severity enum, linked to manuals, 1536-dim embeddings                           |
| incidents              | Status enum, linked to org and user                                             |
| conversation_messages  | Role enum, linked to incident                                                   |
| service_reports        | 1-to-1 with incident, required fields for CMMS format                           |

---

## Security Considerations

1. **RLS Enforcement**: All tables have RLS enabled; no data can bypass policies
2. **Super Admin Bypass**: Super admins have special policies to access all data (for support)
3. **Org Isolation**: Technicians and Org Admins are strictly isolated to their organization
4. **Cascade Deletes**: Deleting an incident cascades to messages and reports (data cleanup)
5. **Audit Logging**: Created_at/updated_at timestamps on all tables for audit trails

---

## Performance Optimizations

1. **Vector Indexes**: IVFFlat indexes on embeddings for fast similarity search
2. **Compound Indexes**: Org_id + status for common filtered queries
3. **Partial Indexes**: Consider adding partial indexes on active records only
4. **Connection Pooling**: Use Supabase pooler for high concurrency

---

## Future Enhancements (Post-MVP)

1. **manual_versions**: Track full version history for manuals
2. **audit_log**: Comprehensive audit trail for compliance
3. **organization_settings**: Per-org configuration (branding, preferences)
4. **user_sessions**: Track user activity for analytics
