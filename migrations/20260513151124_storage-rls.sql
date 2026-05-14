-- Enable RLS on storage.objects (no-op if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing default policies on the modules bucket
DROP POLICY IF EXISTS storage_objects_owner_select ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_insert ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_update ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_delete ON storage.objects;

-- Authenticated users can upload their own files into the modules bucket
CREATE POLICY modules_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket = 'modules'
    AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  );

-- Authenticated users can read their own files
CREATE POLICY modules_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket = 'modules'
    AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  );

-- Authenticated users can delete their own files
CREATE POLICY modules_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket = 'modules'
    AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  );

-- Public read for the modules bucket (files are accessible via public URL)
CREATE POLICY modules_public_read ON storage.objects
  FOR SELECT TO anon
  USING (bucket = 'modules');
