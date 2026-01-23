/**
 * Create Storage Bucket for Safety Verification Photos
 *
 * This bucket stores photos uploaded during the Isolation Protocol verification.
 * Photos are used by vision models to verify safety isolation (power disconnection, lockout/tagout).
 */

-- Create storage bucket for safety photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'safety-photos',
  'safety-photos',
  true, -- Public bucket (photos are non-sensitive, just equipment photos)
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy: Users can upload photos for their own organization's incidents
CREATE POLICY "Users can upload safety photos for their org's incidents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'safety-photos'
  AND (
    -- Check that the incident belongs to the user's organization
    EXISTS (
      SELECT 1
      FROM incidents i
      INNER JOIN profiles p ON p.org_id = i.org_id
      WHERE p.id = auth.uid()
      AND i.id::text = (storage.foldername(name))[1] -- Extract incident ID from path
    )
  )
);

-- Create RLS policy: Users can view photos from their organization's incidents
CREATE POLICY "Users can view safety photos from their org's incidents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'safety-photos'
  AND (
    -- Check that the incident belongs to the user's organization
    EXISTS (
      SELECT 1
      FROM incidents i
      INNER JOIN profiles p ON p.org_id = i.org_id
      WHERE p.id = auth.uid()
      AND i.id::text = (storage.foldername(name))[1] -- Extract incident ID from path
    )
  )
);

-- Create RLS policy: Super admins can access all photos (for support/debugging)
CREATE POLICY "Super admins can access all safety photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'safety-photos'
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Create index for faster incident lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_incidents_org_id ON incidents(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);

COMMENT ON POLICY "Users can upload safety photos for their org's incidents" ON storage.objects IS
'Allows authenticated users to upload safety verification photos for incidents belonging to their organization';

COMMENT ON POLICY "Users can view safety photos from their org's incidents" ON storage.objects IS
'Allows authenticated users to view safety verification photos from their organization''s incidents';

COMMENT ON POLICY "Super admins can access all safety photos" ON storage.objects IS
'Allows super admins to access all safety photos across all organizations for support purposes';
