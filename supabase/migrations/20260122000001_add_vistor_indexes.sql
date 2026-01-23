-- Add indexes to vistor table for quick lookups
-- Migration: 20260122000001_add_vistor_indexes.sql

-- Create index on email column for fast email lookups
CREATE INDEX IF NOT EXISTS idx_vistor_email
ON public.vistor(email);

-- Create index on org_name column for fast organization lookups
CREATE INDEX IF NOT EXISTS idx_vistor_org_name
ON public.vistor(org_name);

-- Create composite index on (email, org_name) for combined lookups
-- This is the most important index for the duplicate check query
CREATE INDEX IF NOT EXISTS idx_vistor_email_org_name
ON public.vistor(email, org_name);

-- Create index on created_at for sorting/filtering by registration date
CREATE INDEX IF NOT EXISTS idx_vistor_created_at
ON public.vistor(created_at DESC);

-- Create index on is_active for filtering active/inactive visitors
CREATE INDEX IF NOT EXISTS idx_vistor_is_active
ON public.vistor(is_active);

-- Add comment to explain the indexes
COMMENT ON INDEX idx_vistor_email IS 'Index for fast email lookups';
COMMENT ON INDEX idx_vistor_org_name IS 'Index for fast organization name lookups';
COMMENT ON INDEX idx_vistor_email_org_name IS 'Composite index for duplicate detection (email + org_name)';
COMMENT ON INDEX idx_vistor_created_at IS 'Index for sorting by registration date';
COMMENT ON INDEX idx_vistor_is_active IS 'Index for filtering active/inactive visitors';
