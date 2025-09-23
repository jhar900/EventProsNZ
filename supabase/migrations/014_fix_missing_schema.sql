-- Fix missing schema elements for production deployment
-- This migration ensures all required tables and columns exist

-- Ensure service_areas column exists in business_profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS service_areas TEXT[];

-- Ensure performance_metrics table exists
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    metric_data JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance_metrics if they don't exist
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

-- Enable RLS for performance_metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_metrics (admin only)
CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Ensure other missing columns exist
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS nzbn TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;
