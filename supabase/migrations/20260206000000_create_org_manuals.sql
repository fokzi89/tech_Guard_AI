-- Create org_manuals table
CREATE TABLE org_manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  title text NOT NULL,
  storage_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text DEFAULT 'application/pdf',
  machine_model text,
  version text,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'active', 'error', 'archived')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_org_manuals_org_id ON org_manuals(org_id);
CREATE INDEX idx_org_manuals_status ON org_manuals(status);
CREATE INDEX idx_org_manuals_machine_model ON org_manuals(machine_model);

-- Enable RLS
ALTER TABLE org_manuals ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_org_manuals_updated_at
BEFORE UPDATE ON org_manuals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Policies

-- Org Admins can manage their organization's manuals
CREATE POLICY "org_admin_manage_org_manuals"
ON org_manuals FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
);

-- Users can view their organization's manuals
CREATE POLICY "users_view_org_manuals"
ON org_manuals FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- Super Admins can manage all
CREATE POLICY "super_admin_manage_all_org_manuals"
ON org_manuals FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Link existing manuals (chunks) to org_manuals
ALTER TABLE manuals 
ADD COLUMN org_manual_id uuid REFERENCES org_manuals(id) ON DELETE CASCADE;

CREATE INDEX idx_manuals_org_manual_id ON manuals(org_manual_id);

-- Comments
COMMENT ON TABLE org_manuals IS 'Metadata for uploaded PDF manuals, acting as parent for chunked content in manuals table';
