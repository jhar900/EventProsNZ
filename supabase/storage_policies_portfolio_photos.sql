-- Storage policies for portfolio-photos bucket
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tyzyldvtvzxbmuomwftj/sql

-- Allow authenticated users to upload their own portfolio photos
CREATE POLICY "Users can upload their own portfolio photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to upload any portfolio photos
CREATE POLICY "Service role can upload portfolio photos"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'portfolio-photos');

-- Allow public read access to portfolio photos
CREATE POLICY "Public can view portfolio photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portfolio-photos');

-- Allow users to update their own portfolio photos
CREATE POLICY "Users can update their own portfolio photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portfolio-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own portfolio photos
CREATE POLICY "Users can delete their own portfolio photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
