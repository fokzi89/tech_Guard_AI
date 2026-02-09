-- Create a view to join incidents with profile information
-- This allows fetching session data with technician details in a single query

CREATE OR REPLACE VIEW incidents_with_profiles AS
SELECT
  i.id,
  i.org_id,
  i.user_id,
  i.machine_model,
  i.external_ticket_id,
  i.status,
  i.safety_interventions,
  i.created_at,
  i.updated_at,
  i.resolved_at,
  -- Embed profile information as a JSON object
  jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'email', (SELECT email FROM auth.users WHERE id = p.id),
    'role', p.role,
    'org_id', p.org_id
  ) AS technician
FROM incidents i
LEFT JOIN profiles p ON i.user_id = p.id;

-- Add comment explaining the view
COMMENT ON VIEW incidents_with_profiles IS
  'Incidents joined with technician profile information for efficient querying. '
  'Includes email from auth.users and profile data from profiles table.';

-- Grant access to authenticated users (RLS will still apply through base tables)
GRANT SELECT ON incidents_with_profiles TO authenticated;
