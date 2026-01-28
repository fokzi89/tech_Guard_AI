-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('manuals', 'manuals', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('safety-proofs', 'safety-proofs', false);

-- Policy: Manuals - Org Admins can upload to their org folder
-- Path convention: org_id/filename
CREATE POLICY "Org Admins can upload manuals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manuals' AND
  (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid()) AND
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'super_admin')
);

-- Policy: Manuals - Users can view manuals they have access to
-- This is tricky to map identically to RLS on `manuals` table without complex joins.
-- Simplified: If user belongs to the org in the path.
CREATE POLICY "Users can view org manuals"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'manuals' AND
  (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
);

-- Policy: Manuals - Super Admin can view all
CREATE POLICY "Super Admin view all manuals"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'manuals' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Policy: Safety Proofs - Users can upload their own proofs
CREATE POLICY "Users upload safety proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'safety-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Safety Proofs - Users view own proofs
CREATE POLICY "Users view own safety proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'safety-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
