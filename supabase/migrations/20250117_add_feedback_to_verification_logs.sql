-- Migration: Create verification_logs table if it doesn't exist and add feedback column
-- Description: Creates the verification_logs table with all necessary columns including feedback

-- Create verification_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT,
    feedback TEXT,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add feedback column if it doesn't exist (in case table exists but column doesn't)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_logs' AND column_name = 'feedback'
    ) THEN
        ALTER TABLE verification_logs ADD COLUMN feedback TEXT;
    END IF;
END $$;

-- Drop existing constraints if they exist
ALTER TABLE verification_logs 
DROP CONSTRAINT IF EXISTS verification_logs_action_check;

ALTER TABLE verification_logs 
DROP CONSTRAINT IF EXISTS verification_logs_status_check;

-- Recreate the constraints with all possible values
ALTER TABLE verification_logs 
ADD CONSTRAINT verification_logs_action_check 
CHECK (action IN ('approve', 'reject', 'resubmit', 'unapprove'));

ALTER TABLE verification_logs 
ADD CONSTRAINT verification_logs_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'resubmitted'));

-- Make admin_id nullable (it might be null for system actions)
-- Only alter if the column exists and is NOT NULL
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_logs' 
        AND column_name = 'admin_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE verification_logs ALTER COLUMN admin_id DROP NOT NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_admin_id ON verification_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_logs_action ON verification_logs(action);
CREATE INDEX IF NOT EXISTS idx_verification_logs_status ON verification_logs(status);

-- Enable RLS on verification_logs
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Admins can insert verification logs" ON verification_logs;
DROP POLICY IF EXISTS "Admins can update verification logs" ON verification_logs;

-- Create RLS policies for verification_logs
CREATE POLICY "Admins can view all verification logs" ON verification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert verification logs" ON verification_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update verification logs" ON verification_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

