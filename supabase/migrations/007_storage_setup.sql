-- Migration 007: Supabase Storage Setup
-- Sets up storage buckets and adds storage path columns

-- =====================================================
-- IMPORTANT: Storage Bucket Creation
-- =====================================================
-- Storage buckets MUST be created via Supabase Dashboard or API
-- This migration provides the configuration and instructions
--
-- To create the buckets:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket: "barberos-fotos"
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 3. Create bucket: "sedes-fotos"
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Or use Supabase CLI:
-- ```
-- supabase storage buckets create barberos-fotos --public
-- supabase storage buckets create sedes-fotos --public
-- ```

-- =====================================================
-- 1. Add storage path columns to barberos table
-- =====================================================

ALTER TABLE barberos
ADD COLUMN IF NOT EXISTS foto_storage_path TEXT;

COMMENT ON COLUMN barberos.foto_storage_path IS 'Path to barber photo in Supabase Storage (barberos-fotos bucket)';

-- Create index for storage path lookups
CREATE INDEX IF NOT EXISTS idx_barberos_foto_storage_path 
ON barberos(foto_storage_path) 
WHERE foto_storage_path IS NOT NULL;

-- =====================================================
-- 2. Add storage path columns to sedes table
-- =====================================================

ALTER TABLE sedes
ADD COLUMN IF NOT EXISTS foto_storage_path TEXT;

COMMENT ON COLUMN sedes.foto_storage_path IS 'Path to sede photo in Supabase Storage (sedes-fotos bucket)';

-- Create index for storage path lookups
CREATE INDEX IF NOT EXISTS idx_sedes_foto_storage_path 
ON sedes(foto_storage_path) 
WHERE foto_storage_path IS NOT NULL;

-- =====================================================
-- 3. Storage RLS Policies (SQL Reference)
-- =====================================================
-- Note: Storage policies are managed separately from database policies
-- These would be created via Supabase Dashboard > Storage > Policies
--
-- For barberos-fotos bucket:
-- 
-- Policy: "Admins can upload barber photos"
-- Operation: INSERT
-- Check:
-- EXISTS (
--   SELECT 1 FROM barberos
--   JOIN sedes ON barberos.sede_id = sedes.id
--   WHERE barberos.id::text = (storage.foldername(name))[2]
--   AND is_sede_admin(sedes.id)
-- )
--
-- Policy: "Admins can update barber photos"
-- Operation: UPDATE
-- Check: Same as above
--
-- Policy: "Admins can delete barber photos"
-- Operation: DELETE
-- Check: Same as above
--
-- Policy: "Public can view barber photos"
-- Operation: SELECT
-- Check: true (bucket is public)
--
-- For sedes-fotos bucket:
--
-- Policy: "Admins can upload sede photos"
-- Operation: INSERT
-- Check:
-- EXISTS (
--   SELECT 1 FROM sedes
--   WHERE sedes.id::text = (storage.foldername(name))[2]
--   AND is_sede_admin(sedes.id)
-- )
--
-- Policy: "Admins can update sede photos"
-- Operation: UPDATE
-- Check: Same as above
--
-- Policy: "Admins can delete sede photos"
-- Operation: DELETE
-- Check: Same as above
--
-- Policy: "Public can view sede photos"
-- Operation: SELECT
-- Check: true (bucket is public)

-- =====================================================
-- 4. Helper function to generate storage URL
-- =====================================================

CREATE OR REPLACE FUNCTION get_storage_public_url(
  bucket_name TEXT,
  storage_path TEXT
)
RETURNS TEXT AS $$
BEGIN
  IF storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return the public URL format for Supabase Storage
  -- This will need to be replaced with actual Supabase project URL
  RETURN format(
    'https://%s.supabase.co/storage/v1/object/public/%s/%s',
    current_setting('app.supabase_project_id', true),
    bucket_name,
    storage_path
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_storage_public_url IS 'Generates public URL for a file in Supabase Storage';

-- =====================================================
-- 5. Function to cleanup orphaned storage files
-- =====================================================
-- This function can be called periodically to clean up files
-- that no longer have database references

CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS TABLE(bucket TEXT, path TEXT) AS $$
BEGIN
  -- This is a placeholder - actual implementation would require
  -- the pg_net extension or a Supabase Edge Function
  -- to interact with the Storage API
  
  RAISE NOTICE 'Storage cleanup should be implemented as a Supabase Edge Function';
  RAISE NOTICE 'Check for barberos.foto_storage_path and sedes.foto_storage_path values';
  RAISE NOTICE 'that exist in Storage but not in the database';
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_orphaned_storage_files IS 'Placeholder for storage cleanup - implement as Edge Function';

-- =====================================================
-- 6. Migration instructions for developers
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'Migration 007: Storage Setup Complete';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: You must create Storage buckets manually:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Create bucket "barberos-fotos" (public, 5MB limit)';
  RAISE NOTICE '2. Create bucket "sedes-fotos" (public, 5MB limit)';
  RAISE NOTICE '';
  RAISE NOTICE 'Via Supabase Dashboard:';
  RAISE NOTICE '  Storage > New Bucket > Configure settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Via Supabase CLI:';
  RAISE NOTICE '  supabase storage buckets create barberos-fotos --public';
  RAISE NOTICE '  supabase storage buckets create sedes-fotos --public';
  RAISE NOTICE '';
  RAISE NOTICE 'Then configure Storage RLS policies as documented above.';
  RAISE NOTICE '======================================================';
END $$;

-- =====================================================
-- Migration complete
-- =====================================================
-- Database columns for storage paths are ready
-- Storage buckets must be created manually
-- RLS policies for storage must be configured in Dashboard
