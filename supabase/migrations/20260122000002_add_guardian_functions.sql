-- Guardian Agent Database Functions
-- Migration: 20260122000002_add_guardian_functions.sql
-- Purpose: Create database functions for Guardian Agent safety checks

-- Function: match_safety_blacklist
-- Purpose: Find dangerous procedures similar to user's query using vector similarity
-- Used by Guardian Agent to detect dangerous intent

CREATE OR REPLACE FUNCTION match_safety_blacklist(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 1,
  org_id_filter text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  action_description text,
  risk_description text,
  severity text,
  required_action text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id::text,
    sb.action_description,
    sb.risk_description,
    sb.severity,
    sb.required_action,
    1 - (sb.embedding <=> query_embedding) AS similarity
  FROM safety_blacklist sb
  WHERE
    -- Filter by organization (org-specific rules) OR global rules
    (sb.org_id = org_id_filter OR sb.org_id IS NULL)
    -- Only return matches above threshold
    AND 1 - (sb.embedding <=> query_embedding) >= match_threshold
    -- Only active rules
    AND sb.status = 'active'
  ORDER BY sb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION match_safety_blacklist IS 'Guardian Agent function: Find dangerous procedures similar to user query using vector similarity';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_safety_blacklist TO authenticated;
GRANT EXECUTE ON FUNCTION match_safety_blacklist TO anon;
