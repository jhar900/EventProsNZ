-- Create application_templates table for job application templates
CREATE TABLE IF NOT EXISTS application_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) <= 100),
    description TEXT CHECK (length(description) <= 500),
    cover_letter_template TEXT NOT NULL CHECK (length(cover_letter_template) <= 2000),
    service_categories TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_application_templates_created_by_user_id ON application_templates(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_application_templates_is_public ON application_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_application_templates_service_categories ON application_templates USING GIN(service_categories);
CREATE INDEX IF NOT EXISTS idx_application_templates_created_at ON application_templates(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_application_templates_updated_at 
    BEFORE UPDATE ON application_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE application_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own templates" ON application_templates
    FOR SELECT USING (created_by_user_id = auth.uid());

-- Users can create templates
CREATE POLICY "Users can create templates" ON application_templates
    FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" ON application_templates
    FOR UPDATE USING (created_by_user_id = auth.uid());

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" ON application_templates
    FOR DELETE USING (created_by_user_id = auth.uid());

-- Public templates are viewable by all authenticated users
CREATE POLICY "Public templates are viewable by all" ON application_templates
    FOR SELECT USING (is_public = true);

-- Admins can view all templates
CREATE POLICY "Admins can view all templates" ON application_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE application_templates IS 'Job application templates for contractors';
COMMENT ON COLUMN application_templates.name IS 'Template name (max 100 chars)';
COMMENT ON COLUMN application_templates.description IS 'Template description (max 500 chars)';
COMMENT ON COLUMN application_templates.cover_letter_template IS 'Template cover letter content (max 2000 chars)';
COMMENT ON COLUMN application_templates.service_categories IS 'Service categories this template applies to';
COMMENT ON COLUMN application_templates.is_public IS 'Whether template is public for all users';
COMMENT ON COLUMN application_templates.created_by_user_id IS 'ID of the user who created the template';
COMMENT ON COLUMN application_templates.usage_count IS 'Number of times this template has been used';
