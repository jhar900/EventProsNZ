-- Email Infrastructure Migration
-- This migration creates all necessary tables for the email infrastructure system

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    dynamic_template_data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    message_id VARCHAR(255)
);

-- Email suppressions table
CREATE TABLE IF NOT EXISTS email_suppressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'bounce', 'complaint', 'unsubscribe'
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery alerts table
CREATE TABLE IF NOT EXISTS delivery_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'high_bounce_rate', 'low_delivery_rate', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    threshold DECIMAL(10,2),
    current_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false
);

-- Email errors table
CREATE TABLE IF NOT EXISTS email_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'sendgrid_api', 'template_rendering', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false
);

-- Email authentication table
CREATE TABLE IF NOT EXISTS email_authentication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('spf', 'dkim', 'dmarc', 'overall')),
    result JSONB NOT NULL,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain, type)
);

-- Deliverability reports table
CREATE TABLE IF NOT EXISTS deliverability_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    report JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain)
);

-- System alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('error', 'warning', 'info')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    component TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_type ON email_suppressions(type);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_is_active ON email_suppressions(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_alerts_is_resolved ON delivery_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_delivery_alerts_severity ON delivery_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_delivery_alerts_created_at ON delivery_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_email_errors_type ON email_errors(type);
CREATE INDEX IF NOT EXISTS idx_email_errors_severity ON email_errors(severity);
CREATE INDEX IF NOT EXISTS idx_email_errors_is_resolved ON email_errors(is_resolved);
CREATE INDEX IF NOT EXISTS idx_email_errors_created_at ON email_errors(created_at);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_email_authentication_domain ON email_authentication(domain);
CREATE INDEX IF NOT EXISTS idx_email_authentication_type ON email_authentication(type);
CREATE INDEX IF NOT EXISTS idx_email_authentication_last_checked ON email_authentication(last_checked);

CREATE INDEX IF NOT EXISTS idx_deliverability_reports_domain ON deliverability_reports(domain);
CREATE INDEX IF NOT EXISTS idx_deliverability_reports_last_updated ON deliverability_reports(last_updated);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for email_templates updated_at
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add email quota fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_quota INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0;

-- Create function to reset daily email counts
CREATE OR REPLACE FUNCTION reset_daily_email_counts()
RETURNS void AS $$
BEGIN
    UPDATE users SET emails_sent_today = 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get email statistics
CREATE OR REPLACE FUNCTION get_email_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_bounced BIGINT,
    total_complained BIGINT,
    total_failed BIGINT,
    delivery_rate DECIMAL(5,2),
    bounce_rate DECIMAL(5,2),
    complaint_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE status = 'bounced') as total_bounced,
        COUNT(*) FILTER (WHERE status = 'complained') as total_complained,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'delivered')::DECIMAL / COUNT(*)) * 100, 2
        ) as delivery_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'bounced')::DECIMAL / COUNT(*)) * 100, 2
        ) as bounce_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'complained')::DECIMAL / COUNT(*)) * 100, 2
        ) as complaint_rate
    FROM email_logs
    WHERE sent_at >= start_date AND sent_at <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old email data
CREATE OR REPLACE FUNCTION clean_old_email_data(days_to_keep INTEGER DEFAULT 90)
RETURNS void AS $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
    
    -- Clean old email logs
    DELETE FROM email_logs WHERE sent_at < cutoff_date;
    
    -- Clean old email queue items
    DELETE FROM email_queue 
    WHERE created_at < cutoff_date 
    AND status IN ('sent', 'failed', 'cancelled');
    
    -- Clean old email errors
    DELETE FROM email_errors 
    WHERE created_at < cutoff_date 
    AND is_resolved = true;
    
    -- Clean old delivery alerts
    DELETE FROM delivery_alerts 
    WHERE created_at < cutoff_date 
    AND is_resolved = true;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for email tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Users can view active email templates" ON email_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and editors can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'editor')
        )
    );

-- Email logs policies
CREATE POLICY "Users can view their own email logs" ON email_logs
    FOR SELECT USING (
        recipient = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Email queue policies
CREATE POLICY "Users can view their own queued emails" ON email_queue
    FOR SELECT USING (
        recipient = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage email queue" ON email_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Email suppressions policies
CREATE POLICY "Admins can manage email suppressions" ON email_suppressions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Delivery alerts policies
CREATE POLICY "Admins can view delivery alerts" ON delivery_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Email errors policies
CREATE POLICY "Admins can view email errors" ON email_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Email authentication policies
CREATE POLICY "Admins can view email authentication" ON email_authentication
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage email authentication" ON email_authentication
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Deliverability reports policies
CREATE POLICY "Admins can view deliverability reports" ON deliverability_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage deliverability reports" ON deliverability_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- System alerts policies
CREATE POLICY "Admins can view system alerts" ON system_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage system alerts" ON system_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables, created_by) VALUES
(
    'Welcome Email',
    'Welcome to EventProsNZ!',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title></head><body><h1>Welcome {{firstName}}!</h1><p>Thank you for joining EventProsNZ.</p></body></html>',
    'Welcome {{firstName}}!\n\nThank you for joining EventProsNZ.',
    ARRAY['firstName'],
    (SELECT id FROM auth.users WHERE role = 'admin' LIMIT 1)
),
(
    'Trial Reminder',
    'Your trial is ending soon',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Trial Reminder</title></head><body><h1>Hi {{firstName}}!</h1><p>Your trial ends in {{daysRemaining}} days.</p></body></html>',
    'Hi {{firstName}}!\n\nYour trial ends in {{daysRemaining}} days.',
    ARRAY['firstName', 'daysRemaining'],
    (SELECT id FROM auth.users WHERE role = 'admin' LIMIT 1)
);

-- Create a scheduled job to reset daily email counts (this would need to be set up in your cron system)
-- SELECT cron.schedule('reset-daily-email-counts', '0 0 * * *', 'SELECT reset_daily_email_counts();');

-- Create a scheduled job to clean old email data (this would need to be set up in your cron system)
-- SELECT cron.schedule('clean-old-email-data', '0 2 * * 0', 'SELECT clean_old_email_data(90);');
