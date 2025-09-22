-- Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'resubmit')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_queue table
CREATE TABLE IF NOT EXISTS verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    priority INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_admin_id ON verification_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_queue_user_id ON verification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_priority ON verification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_verification_queue_submitted_at ON verification_queue(submitted_at);

-- Enable RLS on verification tables
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for verification_queue
CREATE POLICY "Admins can view verification queue" ON verification_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage verification queue" ON verification_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add verification_date column to business_profiles if it doesn't exist
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Create function to automatically add users to verification queue
CREATE OR REPLACE FUNCTION add_user_to_verification_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add contractors to verification queue (event managers get auto-approved)
    IF NEW.role = 'contractor' THEN
        INSERT INTO verification_queue (user_id, status, priority)
        VALUES (NEW.id, 'pending', 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add new contractors to verification queue
DROP TRIGGER IF EXISTS trigger_add_user_to_verification_queue ON users;
CREATE TRIGGER trigger_add_user_to_verification_queue
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_verification_queue();

-- Create function to update verification queue when user is approved/rejected
CREATE OR REPLACE FUNCTION update_verification_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Update verification queue when user verification status changes
    IF TG_OP = 'UPDATE' AND OLD.is_verified != NEW.is_verified THEN
        UPDATE verification_queue 
        SET 
            status = CASE 
                WHEN NEW.is_verified THEN 'approved' 
                ELSE 'rejected' 
            END,
            reviewed_at = NOW(),
            admin_id = (
                SELECT admin_id 
                FROM verification_logs 
                WHERE user_id = NEW.id 
                ORDER BY created_at DESC 
                LIMIT 1
            )
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update verification queue
DROP TRIGGER IF EXISTS trigger_update_verification_queue ON users;
CREATE TRIGGER trigger_update_verification_queue
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_queue();

-- Insert existing contractors into verification queue if they're not verified
INSERT INTO verification_queue (user_id, status, priority)
SELECT id, 
       CASE WHEN is_verified THEN 'approved' ELSE 'pending' END,
       0
FROM users 
WHERE role = 'contractor'
AND id NOT IN (SELECT user_id FROM verification_queue);

-- Create view for verification analytics
CREATE OR REPLACE VIEW verification_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE is_verified = false) as pending_users,
    COUNT(*) FILTER (WHERE role = 'contractor') as contractors,
    COUNT(*) FILTER (WHERE role = 'event_manager') as event_managers,
    ROUND(
        (COUNT(*) FILTER (WHERE is_verified = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as verification_rate
FROM users
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant permissions for the analytics view
GRANT SELECT ON verification_analytics TO authenticated;
