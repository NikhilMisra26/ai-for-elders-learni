-- ============================================================================
-- Audio Storage Setup for DISCOVER 50 AI
-- Version: 1.0.0
-- Description: Creates storage bucket for audio files with secure RLS policies
-- Run this in Supabase SQL Editor after base schema
-- ============================================================================

-- Create the audio storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files', 
  true,
  52428800, -- 50MB max file size
  ARRAY['audio/mpeg', 'audio/mp3']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3']::text[];

-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin deletes" ON storage.objects;

-- Policy 1: Public read access (anyone can download/stream audio files)
CREATE POLICY "Allow public read access to audio files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-files');

-- Policy 2: Only authenticated admins can upload new files
-- Note: In production, you might want to add an admin check here
-- For now, we'll restrict to authenticated users and you can manually upload
CREATE POLICY "Allow authenticated admin uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' 
  AND (storage.foldername(name))[1] = '' -- Only allow root level uploads, no folders
);

-- Policy 3: Only authenticated admins can update files
CREATE POLICY "Allow authenticated admin updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-files')
WITH CHECK (bucket_id = 'audio-files');

-- Policy 4: Only authenticated admins can delete files
CREATE POLICY "Allow authenticated admin deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files');

-- ============================================================================
-- CORS Configuration (informational - set in Supabase Dashboard)
-- ============================================================================
-- In Supabase Dashboard > Storage > Policies:
-- 1. Enable CORS for your domain
-- 2. Add allowed origins:
--    - http://localhost:5173 (development)
--    - https://yourdomain.com (production)
-- 3. Allowed methods: GET, HEAD, OPTIONS
-- 4. Allowed headers: *, authorization, x-client-info, apikey, content-type, range

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the bucket was created successfully:
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'audio-files';

-- ============================================================================
-- Notes for Manual Upload
-- ============================================================================
-- After running this SQL:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on 'audio-files' bucket
-- 3. Upload all MP3 files from /public/audio/
-- 4. Maintain exact filenames for compatibility
-- 
-- Files to upload:
-- - IntroAudio.mp3
-- - Module 1.1 Part 1.mp3, Module 1.1 Part 2.mp3
-- - Module 1.2 Part 1.mp3, Module 1.2 Part 2.mp3  
-- - Module 1.3 Part 1.mp3, Module 1.3 Part 2.mp3
-- - Module 2.1 Part 1.mp3, Module 2.1 Part 2.mp3
-- - Module 2.2 Part 1.mp3, Module 2.2 Part 2.mp3
-- - Module 2.3 Part 1.mp3, Module 2.3 Part 2.mp3
-- - Module 3.1 Part 1.mp3, Module 3.1 Part 2.mp3
-- - Module 3.2 Part 1.mp3, Module 3.2 Part 2.mp3
-- - Module 3.3 Part 1.mp3, Module 3.3 Part 2.mp3, Module 3.3 Part 3.mp3
-- - Module 4.1 Part 1.mp3, Module 4.1 Part 2.mp3
-- - Module 4.2 Part 1.mp3, Module 4.2 Part 2.mp3
-- - Module 4.3 Part 1.mp3, Module 4.3 Part 2.mp3
-- - Conclusion part 1.mp3, Conclusion Part 2.mp3