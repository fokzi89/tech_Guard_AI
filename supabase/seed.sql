-- TechGuard AI Seed Data
-- Date: 2026-01-19
-- Description: Test data for local development
-- NOTE: This seed data creates test users with password 'test1234'

-- ============================================================================
-- TEST ORGANIZATIONS
-- ============================================================================

-- Insert test organizations
INSERT INTO organizations (id, name, status, subscription_tier, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TechGuard AI (Platform Owner)', 'active', 'enterprise', now()),
  ('22222222-2222-2222-2222-222222222222', 'ACME Industrial', 'active', 'professional', now()),
  ('33333333-3333-3333-3333-333333333333', 'Global Manufacturing Co', 'active', 'basic', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST USERS (via Supabase Auth)
-- ============================================================================

-- NOTE: In actual Supabase Auth, users are created via the signup API
-- This is a simplified seed for local development
-- Password for all test users: 'test1234' (hashed with bcrypt)

-- The following users should be created via Supabase Auth UI or API:
-- 1. Super Admin: admin@techguard.ai
-- 2. ACME Org Admin: orgadmin@acme.com
-- 3. ACME Technician: tech1@acme.com
-- 4. Global Manufacturing Org Admin: admin@globalmanuf.com
-- 5. Global Manufacturing Technician: tech1@globalmanuf.com

-- For local development, you can create these users manually via:
-- 1. Supabase Studio (http://localhost:54323)
-- 2. Supabase CLI: supabase auth signup
-- 3. API: POST /auth/v1/signup

-- After creating auth users, link them to profiles:

-- Super Admin Profile
-- INSERT INTO profiles (id, org_id, role, full_name) VALUES
--   ('super-admin-uuid', NULL, 'super_admin', 'System Administrator');

-- ACME Industrial Profiles
-- INSERT INTO profiles (id, org_id, role, full_name) VALUES
--   ('acme-admin-uuid', '22222222-2222-2222-2222-222222222222', 'org_admin', 'Jane Smith'),
--   ('acme-tech1-uuid', '22222222-2222-2222-2222-222222222222', 'technician', 'John Technician');

-- Global Manufacturing Profiles
-- INSERT INTO profiles (id, org_id, role, full_name) VALUES
--   ('global-admin-uuid', '33333333-3333-3333-3333-333333333333', 'org_admin', 'Bob Manager'),
--   ('global-tech1-uuid', '33333333-3333-3333-3333-333333333333', 'technician', 'Alice Field Tech');

-- ============================================================================
-- SAMPLE MANUAL (GLOBAL - ACCESSIBLE TO ALL ORGS)
-- ============================================================================

-- Sample manual for Domino M230i printer
-- NOTE: In production, embeddings would be generated via OpenAI API
-- This uses a placeholder zero vector for local development

INSERT INTO manuals (
  id,
  org_id,
  title,
  machine_model,
  content,
  embedding,
  safety_warnings,
  status,
  version,
  created_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  NULL, -- Global manual
  'Domino M230i Service Manual',
  'Domino M230i',
  'Domino M230i Continuous Inkjet Printer - Service Manual

SAFETY WARNINGS:
- CRITICAL: Do not connect Internal 0V (Terminal 21) to External 24V (Terminal 29). This will damage the power supply and create a fire hazard.
- Always disconnect main power before servicing internal components.
- Use proper lockout/tagout procedures when performing maintenance.

POWER SUPPLY:
Terminal Block TB1:
- Terminal 19: External 24V Input
- Terminal 20: External 0V (Ground)
- Terminal 21: Internal 0V (Isolated Ground)
- Terminal 29: External 24V Return

TROUBLESHOOTING:
Power-On Issues:
1. Check main power switch at rear panel (should be in ON position)
2. Verify incoming voltage at TB1: Expected 24VDC ±10%
3. If voltage is present but printer won''t power on, check main fuse F1 on power supply board
4. Replace fuse only with same rating: 5A fast-blow (Part# DOM-F1-5A)

Print Head Temperature:
Normal operating range: 45-55°C
Check via Service Menu > Diagnostics > Temperature
If temperature exceeds 60°C, clean heat sink and verify fan operation

Common Error Codes:
E101: Power supply fault - Check input voltage
E205: Print head temperature - Clean heat sink
E404: Communication error - Check cable connections',
  array_fill(0, ARRAY[1536])::vector, -- Placeholder embedding (all zeros)
  '{
    "critical": [
      "Do not connect Internal 0V (Terminal 21) to External 24V (Terminal 29)"
    ],
    "high": [
      "Always disconnect main power before servicing internal components",
      "Use proper lockout/tagout procedures"
    ]
  }'::jsonb,
  'active',
  '2.1',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE SAFETY BLACKLIST RULES
-- ============================================================================

-- Critical safety rule: Terminal jump
INSERT INTO safety_blacklist (
  id,
  manual_id,
  machine_model,
  rule_description,
  embedding,
  severity,
  created_at
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  'Domino M230i',
  'Do not connect Internal 0V (Terminal 21) to External 24V (Terminal 29). This will damage the power supply and create a fire hazard.',
  array_fill(0, ARRAY[1536])::vector, -- Placeholder embedding
  'CRITICAL',
  now()
) ON CONFLICT (id) DO NOTHING;

-- High severity rule: Power disconnect
INSERT INTO safety_blacklist (
  id,
  manual_id,
  machine_model,
  rule_description,
  embedding,
  severity,
  created_at
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  'Domino M230i',
  'Always disconnect main power before servicing internal components. Failure to do so may result in electric shock.',
  array_fill(0, ARRAY[1536])::vector, -- Placeholder embedding
  'HIGH',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE INCIDENT (TROUBLESHOOTING SESSION)
-- ============================================================================

-- NOTE: This requires actual user IDs from Supabase Auth
-- Uncomment and update after creating test users

-- Sample troubleshooting session for ACME Industrial
-- INSERT INTO incidents (
--   id,
--   org_id,
--   user_id,
--   machine_model,
--   external_ticket_id,
--   status,
--   safety_interventions,
--   created_at
-- ) VALUES (
--   '77777777-7777-7777-7777-777777777777',
--   '22222222-2222-2222-2222-222222222222',
--   'acme-tech1-uuid', -- Replace with actual user UUID
--   'Domino M230i',
--   'WO-12345',
--   'resolved',
--   '[]',
--   now() - interval '2 hours'
-- );

-- Sample conversation messages
-- INSERT INTO conversation_messages (incident_id, role, content, created_at) VALUES
--   ('77777777-7777-7777-7777-777777777777', 'user', 'The printer won''t power on. What should I check first?', now() - interval '2 hours'),
--   ('77777777-7777-7777-7777-777777777777', 'assistant', 'Let''s troubleshoot the power issue step by step:\n\n1. Check the main power switch at the rear panel. Make sure it''s in the ON position.\n2. Verify incoming voltage at terminal block TB1. You should see 24VDC ±10% (21.6V to 26.4V).\n\nDo you have a multimeter to check the voltage?', now() - interval '2 hours' + interval '30 seconds'),
--   ('77777777-7777-7777-7777-777777777777', 'user', 'I checked the voltage at TB1 and it''s 23.8V, which seems good.', now() - interval '2 hours' + interval '2 minutes'),
--   ('77777777-7777-7777-7777-777777777777', 'assistant', 'Good! The voltage is within spec. Next, check the main fuse F1 on the power supply board. A blown fuse is a common cause of no power issues.\n\nReference: Domino M230i Service Manual, Page 45', now() - interval '2 hours' + interval '2 minutes' + interval '30 seconds'),
--   ('77777777-7777-7777-7777-777777777777', 'user', 'Found it! The fuse F1 is blown. I replaced it and the printer powers on now!', now() - interval '2 hours' + interval '5 minutes');

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================

-- Organizations created: 3
-- Manuals created: 1 (global Domino M230i manual)
-- Safety blacklist rules: 2
-- Users: Must be created via Supabase Auth (see comments above)
-- Sample incident: Commented out (requires actual user IDs)

-- To create test users:
-- 1. Start Supabase: supabase start
-- 2. Open Studio: http://localhost:54323
-- 3. Go to Authentication > Users > Add User
-- 4. Create users with emails listed above
-- 5. Copy user UUIDs and update profile inserts
-- 6. Re-run seed: supabase db reset

SELECT 'TechGuard AI seed data loaded successfully!' as message;
SELECT 'Organizations: ' || count(*)::text FROM organizations WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
) as organizations;
SELECT 'Global manuals: ' || count(*)::text FROM manuals WHERE org_id IS NULL as global_manuals;
SELECT 'Safety rules: ' || count(*)::text FROM safety_blacklist as safety_rules;
