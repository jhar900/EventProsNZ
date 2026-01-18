-- Migration: Create event_documents table and related junction tables
-- This table stores documents/files for events with sharing capabilities
-- Uses the same pattern as 20250201_create_event_tasks_tables.sql

-- Helper function to check if a user owns an event (for use in storage policies)
-- Uses dynamic SQL to avoid column validation at function creation time
CREATE OR REPLACE FUNCTION is_event_owner_by_id(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.events WHERE id = $1 AND user_id = $2)')
  USING event_uuid, user_uuid
  INTO result;
  RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create event_documents table
CREATE TABLE IF NOT EXISTS public.event_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  share_with_all_team_members BOOLEAN DEFAULT FALSE NOT NULL,
  share_with_all_contractors BOOLEAN DEFAULT FALSE NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create junction table for document sharing with team members
CREATE TABLE IF NOT EXISTS public.event_documents_team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.event_documents(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_document_team_member UNIQUE (document_id, team_member_id)
);

-- Create junction table for document sharing with contractors
-- Using business_profiles since contractors are identified by their business profile
CREATE TABLE IF NOT EXISTS public.event_documents_contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.event_documents(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_document_contractor UNIQUE (document_id, contractor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_documents_event_id ON public.event_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_uploaded_by ON public.event_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_documents_created_at ON public.event_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_event_documents_mime_type ON public.event_documents(mime_type);

CREATE INDEX IF NOT EXISTS idx_event_documents_team_members_document ON public.event_documents_team_members(document_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_team_members_team_member ON public.event_documents_team_members(team_member_id);

CREATE INDEX IF NOT EXISTS idx_event_documents_contractors_document ON public.event_documents_contractors(document_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_contractors_contractor ON public.event_documents_contractors(contractor_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_event_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER event_documents_updated_at_trigger
  BEFORE UPDATE ON public.event_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_event_documents_updated_at();

-- Enable RLS
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_documents_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_documents_contractors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_documents
-- Event managers can view documents for their events
CREATE POLICY "Event managers can view their event documents" ON public.event_documents
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Team members can view documents shared with them or all team members
CREATE POLICY "Team members can view shared documents" ON public.event_documents
  FOR SELECT USING (
    share_with_all_team_members = TRUE
    OR id IN (
      SELECT document_id FROM public.event_documents_team_members
      WHERE team_member_id IN (
        SELECT id FROM public.team_members WHERE team_member_id = auth.uid()
      )
    )
  );

-- Contractors can view documents shared with them or all contractors
CREATE POLICY "Contractors can view shared documents" ON public.event_documents
  FOR SELECT USING (
    share_with_all_contractors = TRUE
    OR id IN (
      SELECT document_id FROM public.event_documents_contractors
      WHERE contractor_id IN (
        SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Event managers can create documents for their events
CREATE POLICY "Event managers can create documents for their events" ON public.event_documents
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    ) AND
    uploaded_by = auth.uid()
  );

-- Event managers can update documents for their events
CREATE POLICY "Event managers can update their event documents" ON public.event_documents
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event managers can delete documents for their events
CREATE POLICY "Event managers can delete their event documents" ON public.event_documents
  FOR DELETE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for event_documents_team_members
CREATE POLICY "Event managers can view document team member shares" ON public.event_documents_team_members
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM public.event_documents 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- Team members can view their own shares
CREATE POLICY "Team members can view their document shares" ON public.event_documents_team_members
  FOR SELECT USING (
    team_member_id IN (
      SELECT id FROM public.team_members WHERE team_member_id = auth.uid()
    )
  );

CREATE POLICY "Event managers can manage document team member shares" ON public.event_documents_team_members
  FOR ALL USING (
    document_id IN (
      SELECT id FROM public.event_documents 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for event_documents_contractors
CREATE POLICY "Event managers can view document contractor shares" ON public.event_documents_contractors
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM public.event_documents 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- Contractors can view their own shares
CREATE POLICY "Contractors can view their document shares" ON public.event_documents_contractors
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event managers can manage document contractor shares" ON public.event_documents_contractors
  FOR ALL USING (
    document_id IN (
      SELECT id FROM public.event_documents 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- Create event-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-documents',
  'event-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for event-documents bucket
-- Event managers can upload documents (path format: event-documents/{eventId}/{userId}-{timestamp}.{ext})
CREATE POLICY "Event managers can upload event documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-documents' 
  AND is_event_owner_by_id((split_part(name, '/', 2))::UUID, auth.uid())
);

-- Event managers can update their event documents
CREATE POLICY "Event managers can update their event documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-documents' 
  AND is_event_owner_by_id((split_part(name, '/', 2))::UUID, auth.uid())
);

-- Event managers can delete their event documents
CREATE POLICY "Event managers can delete their event documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-documents' 
  AND is_event_owner_by_id((split_part(name, '/', 2))::UUID, auth.uid())
);

-- Event managers, team members, and contractors can read documents they have access to
CREATE POLICY "Authorized users can read event documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-documents'
  AND (
    -- Event manager owns the event
    is_event_owner_by_id((split_part(name, '/', 2))::UUID, auth.uid())
    OR
    -- Document is shared with all team members and user is a team member
    EXISTS (
      SELECT 1 FROM public.event_documents ed
      JOIN public.team_members tm ON tm.team_member_id = auth.uid()
      WHERE ed.file_path = name
      AND ed.share_with_all_team_members = TRUE
      AND ed.event_id::text = split_part(name, '/', 2)
    )
    OR
    -- Document is shared with specific team member
    EXISTS (
      SELECT 1 FROM public.event_documents ed
      JOIN public.event_documents_team_members edtm ON ed.id = edtm.document_id
      JOIN public.team_members tm ON edtm.team_member_id = tm.id
      WHERE ed.file_path = name
      AND tm.team_member_id = auth.uid()
    )
    OR
    -- Document is shared with all contractors and user is a contractor
    EXISTS (
      SELECT 1 FROM public.event_documents ed
      JOIN public.business_profiles bp ON bp.user_id = auth.uid()
      WHERE ed.file_path = name
      AND ed.share_with_all_contractors = TRUE
      AND ed.event_id::text = split_part(name, '/', 2)
    )
    OR
    -- Document is shared with specific contractor
    EXISTS (
      SELECT 1 FROM public.event_documents ed
      JOIN public.event_documents_contractors edc ON ed.id = edc.document_id
      JOIN public.business_profiles bp ON edc.contractor_id = bp.id
      WHERE ed.file_path = name
      AND bp.user_id = auth.uid()
    )
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.event_documents IS 'Documents and files associated with events';
COMMENT ON COLUMN public.event_documents.event_id IS 'The event this document belongs to';
COMMENT ON COLUMN public.event_documents.name IS 'Document name/title';
COMMENT ON COLUMN public.event_documents.file_path IS 'Path to the file in Supabase Storage';
COMMENT ON COLUMN public.event_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.event_documents.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN public.event_documents.share_with_all_team_members IS 'Whether this document is shared with all team members';
COMMENT ON COLUMN public.event_documents.share_with_all_contractors IS 'Whether this document is shared with all contractors';
COMMENT ON COLUMN public.event_documents.uploaded_by IS 'User who uploaded the document';
COMMENT ON TABLE public.event_documents_team_members IS 'Junction table linking documents to team members they are shared with';
COMMENT ON TABLE public.event_documents_contractors IS 'Junction table linking documents to contractors they are shared with';

