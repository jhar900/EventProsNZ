-- Create inquiries table for contractor contact system
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (length(subject) <= 200),
    message TEXT NOT NULL CHECK (length(message) <= 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
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

-- Add comments
COMMENT ON TABLE inquiries IS 'Inquiries sent from event managers to contractors';
COMMENT ON COLUMN inquiries.contractor_id IS 'ID of the contractor being contacted';
COMMENT ON COLUMN inquiries.event_manager_id IS 'ID of the event manager sending the inquiry';
COMMENT ON COLUMN inquiries.subject IS 'Subject line of the inquiry (max 200 chars)';
COMMENT ON COLUMN inquiries.message IS 'Message content of the inquiry (max 2000 chars)';
COMMENT ON COLUMN inquiries.status IS 'Status of the inquiry: pending, responded, or closed';
