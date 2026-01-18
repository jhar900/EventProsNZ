-- Add logo_url column to events table for event logo images

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.events.logo_url IS 'URL of the event logo image stored in Supabase Storage';

-- Create event-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-logos',
  'event-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for event-logos bucket
-- Users can upload event logos (path format: event-logos/event-{userId}-{timestamp}.{ext})
-- Extract filename from path and parse userId from it
CREATE POLICY "Users can upload event logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-logos' 
  AND auth.uid()::text = (regexp_split_to_array(split_part(name, '/', 2), '-'))[2]
);

-- Users can update their own event logos
CREATE POLICY "Users can update their own event logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-logos' 
  AND auth.uid()::text = (regexp_split_to_array(split_part(name, '/', 2), '-'))[2]
);

-- Users can delete their own event logos
CREATE POLICY "Users can delete their own event logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-logos' 
  AND auth.uid()::text = (regexp_split_to_array(split_part(name, '/', 2), '-'))[2]
);

-- Event logos are publicly readable
CREATE POLICY "Event logos are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'event-logos');

