-- Create contractor_notification_preferences table
CREATE TABLE IF NOT EXISTS contractor_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    job_alerts BOOLEAN DEFAULT TRUE,
    application_updates BOOLEAN DEFAULT TRUE,
    new_job_matches BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    instant_alerts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contractor_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contractor_notification_preferences_contractor_id ON contractor_notification_preferences(contractor_id);

-- Create updated_at trigger
CREATE TRIGGER update_contractor_notification_preferences_updated_at 
    BEFORE UPDATE ON contractor_notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE contractor_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own notification preferences
CREATE POLICY "Contractors can view their notification preferences" ON contractor_notification_preferences
    FOR SELECT USING (contractor_id = auth.uid());

-- Contractors can create their notification preferences
CREATE POLICY "Contractors can create their notification preferences" ON contractor_notification_preferences
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

-- Contractors can update their notification preferences
CREATE POLICY "Contractors can update their notification preferences" ON contractor_notification_preferences
    FOR UPDATE USING (contractor_id = auth.uid());

-- Admins can view all notification preferences
CREATE POLICY "Admins can view all notification preferences" ON contractor_notification_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE contractor_notification_preferences IS 'Contractor notification preferences for job alerts and updates';
COMMENT ON COLUMN contractor_notification_preferences.contractor_id IS 'ID of the contractor user';
COMMENT ON COLUMN contractor_notification_preferences.email_notifications IS 'Whether to receive email notifications';
COMMENT ON COLUMN contractor_notification_preferences.sms_notifications IS 'Whether to receive SMS notifications';
COMMENT ON COLUMN contractor_notification_preferences.push_notifications IS 'Whether to receive push notifications';
COMMENT ON COLUMN contractor_notification_preferences.job_alerts IS 'Whether to receive job alerts';
COMMENT ON COLUMN contractor_notification_preferences.application_updates IS 'Whether to receive application status updates';
COMMENT ON COLUMN contractor_notification_preferences.new_job_matches IS 'Whether to receive new job match notifications';
COMMENT ON COLUMN contractor_notification_preferences.weekly_digest IS 'Whether to receive weekly digest emails';
COMMENT ON COLUMN contractor_notification_preferences.instant_alerts IS 'Whether to receive instant alerts for high-priority jobs';
