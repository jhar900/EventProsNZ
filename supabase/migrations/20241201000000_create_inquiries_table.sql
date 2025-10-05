-- Create inquiries table for contractor contact system
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'quote_request', 'availability', 'custom')),
    subject TEXT NOT NULL CHECK (length(subject) <= 200),
    message TEXT NOT NULL CHECK (length(message) <= 2000),
    event_details JSONB,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'responded', 'quoted', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_contractor_id ON inquiries(contractor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_event_manager_id ON inquiries(event_manager_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Contractors can view inquiries sent to them
CREATE POLICY "Contractors can view their inquiries" ON inquiries
    FOR SELECT USING (contractor_id = auth.uid());

-- Event managers can view inquiries they sent
CREATE POLICY "Event managers can view their sent inquiries" ON inquiries
    FOR SELECT USING (event_manager_id = auth.uid());

-- Event managers can create inquiries
CREATE POLICY "Event managers can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (event_manager_id = auth.uid());

-- Contractors can update inquiry status
CREATE POLICY "Contractors can update inquiry status" ON inquiries
    FOR UPDATE USING (contractor_id = auth.uid());

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries" ON inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create inquiry_responses table
CREATE TABLE IF NOT EXISTS inquiry_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_type TEXT NOT NULL DEFAULT 'reply' CHECK (response_type IN ('reply', 'quote', 'decline', 'question')),
    message TEXT NOT NULL CHECK (length(message) <= 2000),
    attachments JSONB,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiry_templates table
CREATE TABLE IF NOT EXISTS inquiry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL CHECK (length(template_name) <= 100),
    template_content TEXT NOT NULL CHECK (length(template_content) <= 2000),
    template_type TEXT NOT NULL DEFAULT 'general' CHECK (template_type IN ('general', 'quote_request', 'availability', 'follow_up')),
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiry_notifications table
CREATE TABLE IF NOT EXISTS inquiry_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('new_inquiry', 'inquiry_response', 'status_update', 'reminder')),
    subject TEXT NOT NULL CHECK (length(subject) <= 200),
    message TEXT NOT NULL CHECK (length(message) <= 1000),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_event_id ON inquiries(event_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

CREATE INDEX IF NOT EXISTS idx_inquiry_responses_inquiry_id ON inquiry_responses(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_responder_id ON inquiry_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_created_at ON inquiry_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_user_id ON inquiry_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_templates_template_type ON inquiry_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_inquiry_templates_is_public ON inquiry_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_inquiry_notifications_inquiry_id ON inquiry_notifications(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_notifications_recipient_id ON inquiry_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_notifications_is_read ON inquiry_notifications(is_read);

-- Add RLS policies for inquiry_responses
ALTER TABLE inquiry_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to their inquiries" ON inquiry_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_responses.inquiry_id 
            AND (inquiries.contractor_id = auth.uid() OR inquiries.event_manager_id = auth.uid())
        )
    );

CREATE POLICY "Users can create responses to their inquiries" ON inquiry_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_responses.inquiry_id 
            AND (inquiries.contractor_id = auth.uid() OR inquiries.event_manager_id = auth.uid())
        )
    );

-- Add RLS policies for inquiry_templates
ALTER TABLE inquiry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON inquiry_templates
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own templates" ON inquiry_templates
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON inquiry_templates
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON inquiry_templates
    FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for inquiry_notifications
ALTER TABLE inquiry_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON inquiry_notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON inquiry_notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- Add comments
COMMENT ON TABLE inquiries IS 'Inquiries sent from event managers to contractors';
COMMENT ON COLUMN inquiries.contractor_id IS 'ID of the contractor being contacted';
COMMENT ON COLUMN inquiries.event_manager_id IS 'ID of the event manager sending the inquiry';
COMMENT ON COLUMN inquiries.event_id IS 'ID of the associated event (optional)';
COMMENT ON COLUMN inquiries.inquiry_type IS 'Type of inquiry: general, quote_request, availability, custom';
COMMENT ON COLUMN inquiries.subject IS 'Subject line of the inquiry (max 200 chars)';
COMMENT ON COLUMN inquiries.message IS 'Message content of the inquiry (max 2000 chars)';
COMMENT ON COLUMN inquiries.event_details IS 'JSON object containing event details';
COMMENT ON COLUMN inquiries.status IS 'Status of the inquiry: sent, viewed, responded, quoted, closed';
COMMENT ON COLUMN inquiries.priority IS 'Priority level: low, medium, high, urgent';

COMMENT ON TABLE inquiry_responses IS 'Responses to inquiries from contractors or event managers';
COMMENT ON TABLE inquiry_templates IS 'Template responses for common inquiries';
COMMENT ON TABLE inquiry_notifications IS 'Notifications related to inquiries';
