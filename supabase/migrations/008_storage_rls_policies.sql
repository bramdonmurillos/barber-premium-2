-- Migration 008: Storage RLS Policies
-- Adds Row Level Security policies for Storage buckets
-- Run this in Supabase Dashboard > SQL Editor

-- =====================================================
-- Storage RLS policies for barberos-fotos bucket
-- =====================================================

-- Public read access (bucket is public, but explicit policy needed for RLS)
CREATE POLICY "Public can view barber photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'barberos-fotos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload barber photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'barberos-fotos');

-- Authenticated users can update (replace) their uploads
CREATE POLICY "Authenticated users can update barber photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'barberos-fotos')
WITH CHECK (bucket_id = 'barberos-fotos');

-- Authenticated users can delete photos
CREATE POLICY "Authenticated users can delete barber photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'barberos-fotos');

-- =====================================================
-- Storage RLS policies for sedes-fotos bucket
-- =====================================================

CREATE POLICY "Public can view sede photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'sedes-fotos');

CREATE POLICY "Authenticated users can upload sede photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sedes-fotos');

CREATE POLICY "Authenticated users can update sede photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'sedes-fotos')
WITH CHECK (bucket_id = 'sedes-fotos');

CREATE POLICY "Authenticated users can delete sede photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'sedes-fotos');
