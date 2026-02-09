-- Fix search_manuals and check_safety_blacklist functions to accept embedding vectors directly
-- The original functions expected text but never generated embeddings
-- This updates them to accept the embeddings from the application layer

-- Fix check_safety_blacklist function
DROP FUNCTION IF EXISTS check_safety_blacklist(text, text);

CREATE OR REPLACE FUNCTION check_safety_blacklist(
  input_embedding vector(1536),
  machine_model text
)
RETURNS TABLE(
  matched boolean,
  rule_id uuid,
  rule_description text,
  severity text,
  similarity float
) AS $$
DECLARE
  similarity_threshold float := 0.85;
BEGIN
  RETURN QUERY
  SELECT
    true AS matched,
    sb.id AS rule_id,
    sb.rule_description,
    sb.severity,
    (1 - (sb.embedding <=> input_embedding))::float AS similarity
  FROM safety_blacklist sb
  WHERE sb.machine_model = check_safety_blacklist.machine_model
    AND (1 - (sb.embedding <=> input_embedding)) > similarity_threshold
  ORDER BY (sb.embedding <=> input_embedding) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix search_manuals function
DROP FUNCTION IF EXISTS search_manuals(text, uuid, int);

CREATE OR REPLACE FUNCTION search_manuals(
  query_embedding vector(1536),
  search_org_id uuid,
  limit_count int DEFAULT 5
)
RETURNS TABLE(
  manual_id uuid,
  title text,
  machine_model text,
  content text,
  similarity float,
  safety_warnings jsonb,
  version text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS manual_id,
    m.title,
    m.machine_model,
    m.content,
    (1 - (m.embedding <=> query_embedding))::float AS similarity,
    m.safety_warnings,
    m.version
  FROM manuals m
  WHERE (m.org_id = search_org_id OR m.org_id IS NULL)
    AND m.status = 'active'
  ORDER BY m.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
