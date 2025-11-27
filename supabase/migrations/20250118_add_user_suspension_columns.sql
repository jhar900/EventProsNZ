-- Migration: Add user suspension columns
-- Description: Adds suspension_reason, suspended_at, and suspended_by columns to users table

-- Add suspension_reason column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'suspension_reason'
    ) THEN
        ALTER TABLE users ADD COLUMN suspension_reason TEXT;
    END IF;
END $$;

-- Add suspended_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'suspended_at'
    ) THEN
        ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add suspended_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'suspended_by'
    ) THEN
        ALTER TABLE users ADD COLUMN suspended_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure status column exists (in case migration 008 wasn't run)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    END IF;
END $$;

-- Create index for suspended_by for better query performance
CREATE INDEX IF NOT EXISTS idx_users_suspended_by ON users(suspended_by) WHERE suspended_by IS NOT NULL;

-- Create index for suspended_at for better query performance
CREATE INDEX IF NOT EXISTS idx_users_suspended_at ON users(suspended_at) WHERE suspended_at IS NOT NULL;

