-- Create email_communications table
-- This table logs all emails sent through the platform for admin tracking and auditing

CREATE TABLE IF NOT EXISTS email_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_type VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_communications_user_id ON email_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_communications_email_type ON email_communications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_communications_status ON email_communications(status);
CREATE INDEX IF NOT EXISTS idx_email_communications_sent_at ON email_communications(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_communications_template_id ON email_communications(template_id);

-- Enable RLS
ALTER TABLE email_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow admins to view all email communications
CREATE POLICY "Admins can view all email communications"
  ON email_communications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow system to insert email communications (for logging)
-- This is needed for API routes that log emails
CREATE POLICY "System can insert email communications"
  ON email_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to manage email communications
CREATE POLICY "Admins can manage email communications"
  ON email_communications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

