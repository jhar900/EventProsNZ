-- Create faq-images storage bucket for FAQ section images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'faq-images',
  'faq-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Public read access
CREATE POLICY "FAQ images are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'faq-images');

-- Only admins can upload FAQ images
CREATE POLICY "Admins can upload FAQ images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'faq-images'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update FAQ images
CREATE POLICY "Admins can update FAQ images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'faq-images'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete FAQ images
CREATE POLICY "Admins can delete FAQ images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'faq-images'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
