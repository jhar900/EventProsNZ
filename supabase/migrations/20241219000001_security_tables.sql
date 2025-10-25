-- Security Tables Migration
-- This migration creates all the necessary tables for the security system

-- Encryption Keys Table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id TEXT PRIMARY KEY,
    key_type TEXT NOT NULL,
    key_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Secure Sessions Table
CREATE TABLE IF NOT EXISTS secure_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Password Policies Table
CREATE TABLE IF NOT EXISTS password_policies (
    id TEXT PRIMARY KEY,
    policy_type TEXT NOT NULL,
    requirements JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password History Table
CREATE TABLE IF NOT EXISTS password_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Breaches Table
CREATE TABLE IF NOT EXISTS password_breaches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    breach_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false
);

-- API Rate Limits Table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    limit INTEGER NOT NULL,
    window INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Requests Table
CREATE TABLE IF NOT EXISTS api_requests (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    user_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time INTEGER,
    status_code INTEGER,
    request_size INTEGER,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT
);

-- Database Access Controls Table
CREATE TABLE IF NOT EXISTS database_access_controls (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_role TEXT NOT NULL,
    conditions TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Audit Logs Table
CREATE TABLE IF NOT EXISTS database_audit_logs (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Backups Table
CREATE TABLE IF NOT EXISTS database_backups (
    id TEXT PRIMARY KEY,
    backup_name TEXT NOT NULL,
    backup_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_encrypted BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending'
);

-- File Security Scans Table
CREATE TABLE IF NOT EXISTS file_security_scans (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    scan_status TEXT NOT NULL,
    threat_level TEXT NOT NULL,
    scan_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Quarantine Table
CREATE TABLE IF NOT EXISTS file_quarantine (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    quarantine_reason TEXT NOT NULL,
    threat_detected TEXT NOT NULL,
    quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- File Access Controls Table
CREATE TABLE IF NOT EXISTS file_access_controls (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_level TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Audit Table
CREATE TABLE IF NOT EXISTS security_audit (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    details JSONB,
    severity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'open'
);

-- Security Incidents Table
CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'reported',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    reported_by TEXT NOT NULL,
    assigned_to TEXT,
    affected_systems TEXT[],
    impact_assessment TEXT,
    root_cause TEXT,
    remediation_steps TEXT[],
    lessons_learned TEXT
);

-- Incident Responses Table
CREATE TABLE IF NOT EXISTS incident_responses (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    response_type TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    details JSONB
);

-- Breach Notifications Table
CREATE TABLE IF NOT EXISTS breach_notifications (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    recipients TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- Vulnerability Scans Table
CREATE TABLE IF NOT EXISTS vulnerability_scans (
    id TEXT PRIMARY KEY,
    scan_type TEXT NOT NULL,
    target TEXT NOT NULL,
    vulnerabilities JSONB,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- Database Connections Table (for monitoring)
CREATE TABLE IF NOT EXISTS database_connections (
    id TEXT PRIMARY KEY,
    connection_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Performance Table (for monitoring)
CREATE TABLE IF NOT EXISTS database_performance (
    id TEXT PRIMARY KEY,
    slow_query_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Encryption Table (for configuration)
CREATE TABLE IF NOT EXISTS database_encryption (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database Audit Config Table
CREATE TABLE IF NOT EXISTS database_audit_config (
    id TEXT PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encryption_keys_type_active ON encryption_keys(key_type, is_active);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_user_id ON secure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_token ON secure_sessions(token);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_active ON secure_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_breaches_user_id ON password_breaches(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_ip_address ON api_requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON api_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_database_audit_logs_table ON database_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_database_audit_logs_timestamp ON database_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_file_security_scans_file_id ON file_security_scans(file_id);
CREATE INDEX IF NOT EXISTS idx_file_quarantine_file_id ON file_quarantine(file_id);
CREATE INDEX IF NOT EXISTS idx_file_quarantine_active ON file_quarantine(is_active);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_status ON security_audit(status);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_responses_incident_id ON incident_responses(incident_id);
CREATE INDEX IF NOT EXISTS idx_breach_notifications_incident_id ON breach_notifications(incident_id);

-- Enable Row Level Security on sensitive tables
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin-only access
CREATE POLICY "Admin only access to encryption_keys" ON encryption_keys
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to secure_sessions" ON secure_sessions
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to password_history" ON password_history
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to password_breaches" ON password_breaches
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to database_audit_logs" ON database_audit_logs
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to file_access_controls" ON file_access_controls
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to security_audit" ON security_audit
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to security_incidents" ON security_incidents
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to incident_responses" ON incident_responses
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin only access to breach_notifications" ON breach_notifications
    FOR ALL USING (auth.role() = 'admin');

-- Insert default security configurations
INSERT INTO password_policies (id, policy_type, requirements, is_active) VALUES
('default_policy', 'default', '{
    "minLength": 12,
    "maxLength": 128,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": true,
    "forbiddenPatterns": ["password", "123456", "qwerty", "admin"],
    "maxRepeatedChars": 3,
    "passwordHistory": 5,
    "expirationDays": 90
}', true);

INSERT INTO database_encryption (id, type, enabled) VALUES
('encryption_at_rest', 'at_rest', true);

INSERT INTO database_audit_config (id, enabled) VALUES
('audit_logging', true);

-- Insert default API rate limits
INSERT INTO api_rate_limits (id, endpoint, limit, window) VALUES
('auth_rate_limit', '/api/auth/*', 5, 900),
('api_rate_limit', '/api/*', 100, 900),
('search_rate_limit', '/api/search/*', 30, 60),
('upload_rate_limit', '/api/upload/*', 10, 900);
