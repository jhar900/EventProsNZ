-- Document Sharing System Migration
-- Creates tables for document sharing, version control, and access permissions

-- Create ENUM types for document sharing
CREATE TYPE permission_level AS ENUM ('view', 'comment', 'edit', 'admin');
CREATE TYPE access_type AS ENUM ('view', 'comment', 'edit', 'admin');

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    document_category TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document shares table
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    permission_level permission_level NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document versions table
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access table
CREATE TABLE document_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    access_type access_type NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Document categories table
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT UNIQUE NOT NULL,
    category_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_category ON documents(document_category);
CREATE INDEX idx_documents_public ON documents(is_public);
CREATE INDEX idx_documents_created_at ON documents(created_at);

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX idx_document_shares_active ON document_shares(is_active);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_number ON document_versions(version_number);

CREATE INDEX idx_document_access_document_id ON document_access(document_id);
CREATE INDEX idx_document_access_user_id ON document_access(user_id);
CREATE INDEX idx_document_access_active ON document_access(is_active);

-- Create RLS policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- Documents RLS policies
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public documents" ON documents
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view shared documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_shares 
            WHERE document_shares.document_id = documents.id 
            AND document_shares.shared_with = auth.uid() 
            AND document_shares.is_active = true
        )
    );

CREATE POLICY "Users can create documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Document shares RLS policies
CREATE POLICY "Users can view shares they created" ON document_shares
    FOR SELECT USING (auth.uid() = shared_by);

CREATE POLICY "Users can view shares with them" ON document_shares
    FOR SELECT USING (auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their documents" ON document_shares
    FOR INSERT WITH CHECK (
        auth.uid() = shared_by AND
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_shares.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shares they created" ON document_shares
    FOR UPDATE USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created" ON document_shares
    FOR DELETE USING (auth.uid() = shared_by);

-- Document versions RLS policies
CREATE POLICY "Users can view versions of accessible documents" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_versions.document_id 
            AND (
                documents.user_id = auth.uid() OR
                documents.is_public = true OR
                EXISTS (
                    SELECT 1 FROM document_shares 
                    WHERE document_shares.document_id = documents.id 
                    AND document_shares.shared_with = auth.uid() 
                    AND document_shares.is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can create versions for their documents" ON document_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_versions.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Document access RLS policies
CREATE POLICY "Users can view access records for accessible documents" ON document_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_access.document_id 
            AND (
                documents.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM document_shares 
                    WHERE document_shares.document_id = documents.id 
                    AND document_shares.shared_with = auth.uid() 
                    AND document_shares.is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can create access records for their documents" ON document_access
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_access.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update access records for their documents" ON document_access
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_access.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete access records for their documents" ON document_access
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_access.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Document categories RLS policies
CREATE POLICY "Users can view all categories" ON document_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can create categories" ON document_categories
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update categories they created" ON document_categories
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete categories they created" ON document_categories
    FOR DELETE USING (auth.uid() = created_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default document categories
INSERT INTO document_categories (category_name, category_description, created_by) VALUES
('Contracts', 'Legal documents and contracts', NULL),
('Event Planning', 'Event planning documents and timelines', NULL),
('Invoices', 'Financial documents and invoices', NULL),
('Photos', 'Event photos and media', NULL),
('Presentations', 'Presentations and slides', NULL),
('Reports', 'Analytics and reports', NULL),
('Templates', 'Document templates', NULL),
('Other', 'Miscellaneous documents', NULL);
