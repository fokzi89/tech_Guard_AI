-- Add invite_tokens table for managing user invitations
-- Date: 2026-01-20

CREATE TABLE invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('org_admin', 'technician')),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Index for quick token lookups
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_invite_tokens_email ON invite_tokens(email);
CREATE INDEX idx_invite_tokens_org_id ON invite_tokens(org_id);

-- Enable RLS
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Super admins can see all invite tokens
CREATE POLICY "super_admin_all_invite_tokens"
ON invite_tokens FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Org admins can manage invite tokens for their organization
CREATE POLICY "org_admin_manage_invite_tokens"
ON invite_tokens FOR ALL
TO authenticated
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
);

-- Anyone can read valid invite tokens (needed for signup flow)
CREATE POLICY "anyone_read_valid_tokens"
ON invite_tokens FOR SELECT
TO anon
USING (
  used = false
  AND expires_at > now()
);

COMMENT ON TABLE invite_tokens IS 'Invitation tokens for org_admin and technician registration';
