-- ============================================================================
-- Audio Metadata Table (Optional)
-- Version: 1.0.0
-- Description: Track audio file metadata and usage statistics
-- Run this after audio_storage_setup.sql if you want metadata tracking
-- ============================================================================

-- Create audio metadata table for tracking and analytics
CREATE TABLE IF NOT EXISTS public.audio_metadata (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename         text NOT NULL UNIQUE,
  original_name    text NOT NULL,
  file_size        bigint NOT NULL,
  duration_seconds numeric,
  mime_type        text NOT NULL DEFAULT 'audio/mpeg',
  storage_path     text NOT NULL,
  checksum         text, -- For file integrity verification
  play_count       bigint NOT NULL DEFAULT 0,
  last_played_at   timestamptz,
  uploaded_at      timestamptz NOT NULL DEFAULT now(),
  uploaded_by      uuid REFERENCES auth.users(id),
  is_active        boolean NOT NULL DEFAULT true,
  metadata         jsonb, -- Additional metadata like bitrate, sample rate, etc.
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "audio_metadata_public_read" ON public.audio_metadata;
DROP POLICY IF EXISTS "audio_metadata_admin_all" ON public.audio_metadata;

-- Anyone can read metadata for active files
CREATE POLICY "audio_metadata_public_read"
ON public.audio_metadata
FOR SELECT
USING (is_active = true);

-- Only authenticated users can modify (for admin use)
CREATE POLICY "audio_metadata_admin_all"
ON public.audio_metadata
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_metadata_filename ON public.audio_metadata (filename);
CREATE INDEX IF NOT EXISTS idx_audio_metadata_active ON public.audio_metadata (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audio_metadata_play_count ON public.audio_metadata (play_count DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_audio_metadata_updated_at ON public.audio_metadata;
CREATE TRIGGER update_audio_metadata_updated_at
  BEFORE UPDATE ON public.audio_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Function to increment play count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_audio_play_count(audio_filename text)
RETURNS void AS $$
BEGIN
  UPDATE public.audio_metadata
  SET 
    play_count = play_count + 1,
    last_played_at = now()
  WHERE filename = audio_filename AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get audio URL with metadata
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_audio_info(audio_filename text)
RETURNS TABLE (
  url text,
  duration numeric,
  file_size bigint,
  play_count bigint
) AS $$
DECLARE
  base_url text;
BEGIN
  -- Get the Supabase project URL (you'll need to set this)
  base_url := current_setting('app.settings.supabase_url', true);
  
  RETURN QUERY
  SELECT 
    COALESCE(base_url || '/storage/v1/object/public/audio-files/' || am.filename, '') as url,
    am.duration_seconds as duration,
    am.file_size,
    am.play_count
  FROM public.audio_metadata am
  WHERE am.filename = audio_filename AND am.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Initial data population (run after uploading files)
-- ============================================================================
-- This will be populated by the upload script or manually
-- Example insert for reference:
/*
INSERT INTO public.audio_metadata (filename, original_name, file_size, storage_path) VALUES
  ('IntroAudio.mp3', 'IntroAudio.mp3', 1024000, 'IntroAudio.mp3'),
  ('Module 1.1 Part 1.mp3', 'Module 1.1 Part 1.mp3', 2048000, 'Module 1.1 Part 1.mp3'),
  -- ... add other files
ON CONFLICT (filename) DO NOTHING;
*/

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to check the table was created:
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'audio_metadata';