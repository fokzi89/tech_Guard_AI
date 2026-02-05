-- Fix Guardian Agent database schema
-- 1. Add missing required_action column to safety_blacklist table
-- 2. Drop old check_safety_blacklist function(s)
-- 3. Create the check_safety_blacklist function that the Guardian Agent expects

-- Step 1: Add required_action column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'safety_blacklist' AND column_name = 'required_action'
  ) THEN
    ALTER TABLE safety_blacklist
    ADD COLUMN required_action text DEFAULT 'disconnect_power'
    CHECK (required_action IN ('disconnect_power', 'lockout_tagout', 'ppe_required'));
  END IF;
END $$;

-- Step 2: Drop all existing check_safety_blacklist functions
DROP FUNCTION IF EXISTS check_safety_blacklist(text, text);
DROP FUNCTION IF EXISTS check_safety_blacklist(vector, text, float, int);

-- Step 3: Create the check_safety_blacklist function
-- This function performs vector similarity search on the safety_blacklist table
CREATE OR REPLACE FUNCTION check_safety_blacklist(
  query_embedding vector(1536),
  filter_machine_model text,
  match_threshold float DEFAULT 0.85,
  match_count int DEFAULT 1
)
RETURNS TABLE(
  id uuid,
  rule_description text,
  machine_model text,
  severity text,
  required_action text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id,
    sb.rule_description,
    sb.machine_model,
    sb.severity,
    sb.required_action,
    (1 - (sb.embedding <=> query_embedding))::float AS similarity
  FROM safety_blacklist sb
  WHERE sb.machine_model = filter_machine_model
    AND (1 - (sb.embedding <=> query_embedding)) >= match_threshold
  ORDER BY (sb.embedding <=> query_embedding) ASC
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_safety_blacklist TO authenticated;

-- Verify the function works by testing with a dummy embedding
-- This should return no results but shouldn't error
SELECT * FROM check_safety_blacklist(
  array_fill(0, ARRAY[1536])::vector(1536),
  'test_machine',
  0.8,
  1
);
