-- Migration: Create job application activity tracking table
-- Description: Track status changes and messages for job applications

-- Create job_application_activity table
CREATE TABLE IF NOT EXISTS job_application_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'message_sent', 'application_submitted')),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_value TEXT,
    new_value TEXT,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_application_activity_application_id ON job_application_activity(application_id);
CREATE INDEX IF NOT EXISTS idx_job_application_activity_actor_id ON job_application_activity(actor_id);
CREATE INDEX IF NOT EXISTS idx_job_application_activity_created_at ON job_application_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_job_application_activity_type ON job_application_activity(activity_type);

-- Add RLS policies
ALTER TABLE job_application_activity ENABLE ROW LEVEL SECURITY;

-- Contractors can view activity for their own applications
CREATE POLICY "Contractors can view activity for their applications" ON job_application_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications
            WHERE job_applications.id = job_application_activity.application_id
            AND job_applications.contractor_id = auth.uid()
        )
    );

-- Job posters can view activity for applications to their jobs
CREATE POLICY "Job posters can view activity for applications to their jobs" ON job_application_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications
            JOIN jobs ON jobs.id = job_applications.job_id
            WHERE job_applications.id = job_application_activity.application_id
            AND jobs.posted_by_user_id = auth.uid()
        )
    );

-- Allow inserts for authenticated users (activity logging)
CREATE POLICY "Authenticated users can insert activity" ON job_application_activity
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON job_application_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE job_application_activity IS 'Activity log for job applications (status changes, messages)';
COMMENT ON COLUMN job_application_activity.activity_type IS 'Type of activity: status_change, message_sent, application_submitted';
COMMENT ON COLUMN job_application_activity.actor_id IS 'User who performed the action';
COMMENT ON COLUMN job_application_activity.old_value IS 'Previous value (for status changes)';
COMMENT ON COLUMN job_application_activity.new_value IS 'New value (for status changes)';
COMMENT ON COLUMN job_application_activity.message IS 'Message content (for message_sent activity)';
