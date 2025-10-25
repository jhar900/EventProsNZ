-- Legal Compliance Tables Migration
-- This migration creates tables for legal document management, inquiries, and compliance tracking

-- Legal Documents Table
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'other')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Inquiries Table
CREATE TABLE IF NOT EXISTS legal_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('legal', 'privacy', 'general')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    response TEXT,
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cookie Consent Table
CREATE TABLE IF NOT EXISTS cookie_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    consent_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Document Versions Table
CREATE TABLE IF NOT EXISTS legal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    changes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Status Table
CREATE TABLE IF NOT EXISTS compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('gdpr', 'ccpa', 'accessibility', 'cookie', 'other')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'pending', 'under_review')),
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_check TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    checked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_documents_type_status ON legal_documents(type, status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective_date ON legal_documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_legal_inquiries_status ON legal_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_legal_inquiries_type ON legal_inquiries(type);
CREATE INDEX IF NOT EXISTS idx_legal_inquiries_created_at ON legal_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_user_id ON cookie_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_created_at ON cookie_consent(created_at);
CREATE INDEX IF NOT EXISTS idx_legal_versions_document_id ON legal_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_type ON compliance_status(type);
CREATE INDEX IF NOT EXISTS idx_compliance_status_status ON compliance_status(status);

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_status ENABLE ROW LEVEL SECURITY;

-- Legal Documents Policies
CREATE POLICY "Legal documents are publicly readable" ON legal_documents
    FOR SELECT USING (status = 'active');

CREATE POLICY "Only admins can manage legal documents" ON legal_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Legal Inquiries Policies
CREATE POLICY "Users can create legal inquiries" ON legal_inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries" ON legal_inquiries
    FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all inquiries" ON legal_inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update inquiries" ON legal_inquiries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Cookie Consent Policies
CREATE POLICY "Users can manage their own cookie consent" ON cookie_consent
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anonymous users can create cookie consent" ON cookie_consent
    FOR INSERT WITH CHECK (user_id IS NULL);

-- Legal Versions Policies
CREATE POLICY "Legal versions are readable by admins" ON legal_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can manage legal versions" ON legal_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Compliance Status Policies
CREATE POLICY "Compliance status is readable by admins" ON compliance_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can manage compliance status" ON compliance_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_legal_documents_updated_at 
    BEFORE UPDATE ON legal_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_inquiries_updated_at 
    BEFORE UPDATE ON legal_inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_consent_updated_at 
    BEFORE UPDATE ON cookie_consent 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_status_updated_at 
    BEFORE UPDATE ON compliance_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial legal documents
INSERT INTO legal_documents (type, title, content, version, status, effective_date) VALUES
('terms_of_service', 'Terms of Service v1.0', 'Initial terms of service content...', '1.0', 'active', NOW()),
('privacy_policy', 'Privacy Policy v1.0', 'Initial privacy policy content...', '1.0', 'active', NOW()),
('cookie_policy', 'Cookie Policy v1.0', 'Initial cookie policy content...', '1.0', 'active', NOW())
ON CONFLICT DO NOTHING;

-- Insert initial compliance status
INSERT INTO compliance_status (type, status, last_checked, next_check) VALUES
('gdpr', 'compliant', NOW(), NOW() + INTERVAL '3 months'),
('ccpa', 'compliant', NOW(), NOW() + INTERVAL '3 months'),
('accessibility', 'compliant', NOW(), NOW() + INTERVAL '6 months'),
('cookie', 'compliant', NOW(), NOW() + INTERVAL '1 month')
ON CONFLICT DO NOTHING;
