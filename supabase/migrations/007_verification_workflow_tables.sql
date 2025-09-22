-- Migration: Add verification workflow tables
-- Description: Add tables for user verification workflow, queue management, and admin notifications

-- Create verification_log table for tracking verification actions
CREATE TABLE IF NOT EXISTS verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'resubmit', 'auto_approve')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'resubmitted')),
  reason TEXT,
  feedback TEXT,
  admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_queue table for managing verification queue
CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'resubmitted')),
  priority INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_id UUID REFERENCES users(id),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('event_manager', 'contractor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create admin_notifications table for verification notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('verification_request', 'verification_reminder', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_user_id UUID REFERENCES users(id),
  related_verification_id UUID REFERENCES verification_queue(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create verification_criteria table for storing verification guidelines
CREATE TABLE IF NOT EXISTS verification_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('event_manager', 'contractor')),
  criteria_name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  validation_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_log_user_id ON verification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_admin_id ON verification_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_created_at ON verification_log(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_queue_user_id ON verification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_priority ON verification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_verification_queue_submitted_at ON verification_queue(submitted_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_criteria_user_type ON verification_criteria(user_type);

-- Add RLS policies for verification_log table
ALTER TABLE verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification log" ON verification_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification logs" ON verification_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert verification logs" ON verification_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add RLS policies for verification_queue table
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification queue status" ON verification_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification queue" ON verification_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update verification queue" ON verification_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert verification queue" ON verification_queue
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for admin_notifications table
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own notifications" ON admin_notifications
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admins can update their own notifications" ON admin_notifications
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "System can insert admin notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for verification_criteria table
ALTER TABLE verification_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view verification criteria" ON verification_criteria
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage verification criteria" ON verification_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_verification_queue_updated_at 
  BEFORE UPDATE ON verification_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_criteria_updated_at 
  BEFORE UPDATE ON verification_criteria 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default verification criteria
INSERT INTO verification_criteria (user_type, criteria_name, description, is_required, validation_rule) VALUES
('event_manager', 'profile_complete', 'Profile must be 100% complete', true, 'profile_completion_percentage = 100'),
('event_manager', 'contact_info', 'Valid phone number and address required', true, 'phone IS NOT NULL AND address IS NOT NULL'),
('event_manager', 'email_verified', 'Email address must be verified', true, 'email_confirmed_at IS NOT NULL'),
('contractor', 'business_profile', 'Complete business profile required', true, 'business_profile_complete = true'),
('contractor', 'nzbn_verified', 'Valid NZBN number required', true, 'nzbn IS NOT NULL AND nzbn_length = 13'),
('contractor', 'portfolio_items', 'At least 3 portfolio items required', true, 'portfolio_count >= 3'),
('contractor', 'services_defined', 'At least one service type defined', true, 'services_count >= 1'),
('contractor', 'contact_info', 'Valid business contact information', true, 'business_address IS NOT NULL AND phone IS NOT NULL');

-- Create function to automatically add users to verification queue
CREATE OR REPLACE FUNCTION add_to_verification_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add to queue if user is not already verified and has completed onboarding
  IF NEW.is_verified = FALSE AND OLD.is_verified = FALSE THEN
    -- Check if user has completed their respective onboarding
    IF NEW.role = 'event_manager' THEN
      -- Check if event manager profile is complete
      IF EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = NEW.id 
        AND p.first_name IS NOT NULL 
        AND p.last_name IS NOT NULL 
        AND p.phone IS NOT NULL 
        AND p.address IS NOT NULL
      ) THEN
        INSERT INTO verification_queue (user_id, status, verification_type, priority)
        VALUES (NEW.id, 'pending', 'event_manager', 1)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
    ELSIF NEW.role = 'contractor' THEN
      -- Check if contractor has completed onboarding
      IF EXISTS (
        SELECT 1 FROM contractor_onboarding_status cos
        WHERE cos.user_id = NEW.id 
        AND cos.is_submitted = true
        AND cos.approval_status = 'pending'
      ) THEN
        INSERT INTO verification_queue (user_id, status, verification_type, priority)
        VALUES (NEW.id, 'pending', 'contractor', 2)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add users to verification queue
CREATE TRIGGER trigger_add_to_verification_queue
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION add_to_verification_queue();

-- Create function to send admin notifications for contractor submissions
CREATE OR REPLACE FUNCTION notify_admin_contractor_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to all admins when contractor submits for verification
  IF NEW.verification_type = 'contractor' AND NEW.status = 'pending' THEN
    INSERT INTO admin_notifications (admin_id, type, title, message, related_user_id, related_verification_id)
    SELECT 
      u.id,
      'verification_request',
      'New Contractor Verification Request',
      'A new contractor has submitted their profile for verification.',
      NEW.user_id,
      NEW.id
    FROM users u 
    WHERE u.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify admins of contractor submissions
CREATE TRIGGER trigger_notify_admin_contractor_submission
  AFTER INSERT ON verification_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_contractor_submission();
