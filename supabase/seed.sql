-- TechGuard AI Seed Data
-- Run this after applying migrations to populate the database with test data

-- 1. Create Organizations
INSERT INTO organizations (id, name, status, subscription_tier) VALUES
('a0000000-0000-0000-0000-000000000001', 'TechnoCorp Industries', 'active', 'enterprise'),
('b0000000-0000-0000-0000-000000000002', 'Global Manufacturing', 'active', 'professional'),
('c0000000-0000-0000-0000-000000000003', 'SmallShop Repairs', 'suspended', 'basic');

-- 2. Create Users (Profiles)
-- Note: These user IDs must match auth.users IDs. 
-- In a real seed, we can't easily insert into auth.users directly via SQL comfortably without hashing passwords.
-- Typically, we use a script (T151) that calls Supabase Auth API.
-- This SQL file is for "post-auth" profile population assuming users exist, OR just placeholders.
-- FOR MVP DEV: We often assume the developer registers users via the UI.
-- But we can insert dummy profiles if we assume auth.users exist.

-- SKIPPING profile insertion here as it requires matching Auth IDs. 
-- See `scripts/seed-data.ts` for the actual seeding logic.

-- 3. Create Sample Manuals (Global)
INSERT INTO manuals (id, title, machine_model, content, embedding, status, version) VALUES
(
    gen_random_uuid(), 
    'Domino M230i Service Manual (Basic)', 
    'Domino M230i', 
    'Safety Warning: Do not jump terminal 29 to 21. This bypasses the safety interlock and causes immediate crush hazard.
     To replace the printhead: 1. Disconnect power. 2. Loosen retention screw. 3. Slide out head.',
    '[0.01, 0.02, 0.03]', -- Mock embedding
    'active', 
    '1.0'
);

-- 4. Create Safety Blacklist Rules (Derived from manual)
INSERT INTO safety_blacklist (machine_model, rule_description, severity, embedding) VALUES
(
    'Domino M230i',
    'Do not jump terminal 29 to terminal 21 (Bypass Safety Interlock)',
    'CRITICAL',
    '[0.05, 0.02, 0.08]' -- Mock embedding (similarity matching handles real ones)
);
