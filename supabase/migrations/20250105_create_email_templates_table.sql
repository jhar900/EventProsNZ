-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  description TEXT,
  trigger_action VARCHAR(100) NOT NULL, -- e.g., 'user_registration', 'password_reset', 'inquiry_received', etc.
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '[]'::jsonb, -- Available variables for this template (e.g., {{user_name}}, {{reset_link}})
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create index on trigger_action for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_trigger_action ON email_templates(trigger_action);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read active templates
CREATE POLICY "Allow authenticated users to read active email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admins to read all templates
CREATE POLICY "Allow admins to read all email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to insert templates
CREATE POLICY "Allow admins to insert email templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to update templates
CREATE POLICY "Allow admins to update email templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to delete templates
CREATE POLICY "Allow admins to delete email templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert default email templates
INSERT INTO email_templates (name, slug, subject, html_body, text_body, description, trigger_action, variables) VALUES
(
  'Welcome Email',
  'welcome-email',
  'Welcome to Event Pros NZ!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ea580c;">Welcome to Event Pros NZ!</h2>
    <p>Hi {{user_name}},</p>
    <p>Thank you for joining Event Pros NZ! We''re excited to have you on board.</p>
    <p>Get started by completing your profile to connect with event professionals across New Zealand.</p>
    <p><a href="{{app_url}}/profile" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Profile</a></p>
    <p>Best regards,<br>The Event Pros NZ Team</p>
  </div>',
  'Welcome to Event Pros NZ!\n\nHi {{user_name}},\n\nThank you for joining Event Pros NZ! We''re excited to have you on board.\n\nGet started by completing your profile to connect with event professionals across New Zealand.\n\nVisit: {{app_url}}/profile\n\nBest regards,\nThe Event Pros NZ Team',
  'Sent when a new user registers',
  'user_registration',
  '["user_name", "app_url"]'::jsonb
),
(
  'Password Reset',
  'password-reset',
  'Reset Your Password',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ea580c;">Reset Your Password</h2>
    <p>Hi {{user_name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p><a href="{{reset_link}}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
    <p>If you didn''t request this, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
    <p>Best regards,<br>The Event Pros NZ Team</p>
  </div>',
  'Reset Your Password\n\nHi {{user_name}},\n\nWe received a request to reset your password. Visit the link below to create a new password:\n\n{{reset_link}}\n\nIf you didn''t request this, please ignore this email.\n\nThis link will expire in 1 hour.\n\nBest regards,\nThe Event Pros NZ Team',
  'Sent when a user requests a password reset',
  'password_reset',
  '["user_name", "reset_link"]'::jsonb
),
(
  'Inquiry Received',
  'inquiry-received',
  'New Inquiry Received',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ea580c;">New Inquiry Received</h2>
    <p>Hi {{contractor_name}},</p>
    <p>You have received a new inquiry for your services!</p>
    <p><strong>From:</strong> {{sender_name}}<br>
    <strong>Event Type:</strong> {{event_type}}<br>
    <strong>Date:</strong> {{event_date}}<br>
    <strong>Location:</strong> {{event_location}}</p>
    <p><strong>Message:</strong><br>{{message}}</p>
    <p><a href="{{app_url}}/inquiries/{{inquiry_id}}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Inquiry</a></p>
    <p>Best regards,<br>The Event Pros NZ Team</p>
  </div>',
  'New Inquiry Received\n\nHi {{contractor_name}},\n\nYou have received a new inquiry for your services!\n\nFrom: {{sender_name}}\nEvent Type: {{event_type}}\nDate: {{event_date}}\nLocation: {{event_location}}\n\nMessage:\n{{message}}\n\nView inquiry: {{app_url}}/inquiries/{{inquiry_id}}\n\nBest regards,\nThe Event Pros NZ Team',
  'Sent to contractors when they receive a new inquiry',
  'inquiry_received',
  '["contractor_name", "sender_name", "event_type", "event_date", "event_location", "message", "inquiry_id", "app_url"]'::jsonb
),
(
  'Inquiry Response',
  'inquiry-response',
  'Response to Your Inquiry',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ea580c;">Response to Your Inquiry</h2>
    <p>Hi {{sender_name}},</p>
    <p>{{contractor_name}} has responded to your inquiry!</p>
    <p><strong>Response:</strong><br>{{response_message}}</p>
    <p><a href="{{app_url}}/inquiries/{{inquiry_id}}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Response</a></p>
    <p>Best regards,<br>The Event Pros NZ Team</p>
  </div>',
  'Response to Your Inquiry\n\nHi {{sender_name}},\n\n{{contractor_name}} has responded to your inquiry!\n\nResponse:\n{{response_message}}\n\nView response: {{app_url}}/inquiries/{{inquiry_id}}\n\nBest regards,\nThe Event Pros NZ Team',
  'Sent to event managers when a contractor responds to their inquiry',
  'inquiry_response',
  '["sender_name", "contractor_name", "response_message", "inquiry_id", "app_url"]'::jsonb
),
(
  'Account Verification',
  'account-verification',
  'Verify Your Email Address',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ea580c;">Verify Your Email Address</h2>
    <p>Hi {{user_name}},</p>
    <p>Please verify your email address by clicking the button below:</p>
    <p><a href="{{verification_link}}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
    <p>If you didn''t create an account, please ignore this email.</p>
    <p>Best regards,<br>The Event Pros NZ Team</p>
  </div>',
  'Verify Your Email Address\n\nHi {{user_name}},\n\nPlease verify your email address by visiting the link below:\n\n{{verification_link}}\n\nIf you didn''t create an account, please ignore this email.\n\nBest regards,\nThe Event Pros NZ Team',
  'Sent when a user needs to verify their email address',
  'email_verification',
  '["user_name", "verification_link"]'::jsonb
);

