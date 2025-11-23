-- Create contractor_onboarding_status table if it doesn't exist
-- This is a safety migration in case 006_contractor_onboarding_tables.sql wasn't run

CREATE TABLE IF NOT EXISTS contractor_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step1_completed BOOLEAN DEFAULT FALSE,
  step2_completed BOOLEAN DEFAULT FALSE,
  step3_completed BOOLEAN DEFAULT FALSE,
  step4_completed BOOLEAN DEFAULT FALSE,
  is_submitted BOOLEAN DEFAULT FALSE,
  submission_date TIMESTAMP WITH TIME ZONE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_status_user_id ON contractor_onboarding_status(user_id);

-- Enable RLS if not already enabled
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Users can view their own onboarding status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contractor_onboarding_status' 
    AND policyname = 'Users can view their own onboarding status'
  ) THEN
    CREATE POLICY "Users can view their own onboarding status" ON contractor_onboarding_status
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own onboarding status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contractor_onboarding_status' 
    AND policyname = 'Users can insert their own onboarding status'
  ) THEN
    CREATE POLICY "Users can insert their own onboarding status" ON contractor_onboarding_status
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own onboarding status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contractor_onboarding_status' 
    AND policyname = 'Users can update their own onboarding status'
  ) THEN
    CREATE POLICY "Users can update their own onboarding status" ON contractor_onboarding_status
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Admins can view all onboarding status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contractor_onboarding_status' 
    AND policyname = 'Admins can view all onboarding status'
  ) THEN
    CREATE POLICY "Admins can view all onboarding status" ON contractor_onboarding_status
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
  END IF;

  -- Admins can update onboarding status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contractor_onboarding_status' 
    AND policyname = 'Admins can update onboarding status'
  ) THEN
    CREATE POLICY "Admins can update onboarding status" ON contractor_onboarding_status
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_contractor_onboarding_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contractor_onboarding_status_updated_at ON contractor_onboarding_status;
CREATE TRIGGER update_contractor_onboarding_status_updated_at 
  BEFORE UPDATE ON contractor_onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_onboarding_status_updated_at();




