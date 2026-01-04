-- Create job-attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-attachments',
  'job-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for job-attachments bucket
-- Users can upload files to their own job application folders
CREATE POLICY "Users can upload job application attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'job-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[3]
);

-- Users can update their own uploaded files
CREATE POLICY "Users can update their own job application attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'job-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[3]
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their own job application attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'job-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[3]
);

-- Job attachments are publicly readable (for job creators to view applications)
CREATE POLICY "Job attachments are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'job-attachments');


