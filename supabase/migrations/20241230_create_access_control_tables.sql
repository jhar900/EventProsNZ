-- Access Control Tables Migration
-- This migration creates all the necessary tables for the access control and permissions system

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table (Many-to-many relationship between users and roles)
CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- User Permissions Table (Direct permission assignments)
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by TEXT NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, permission_id)
);

-- Admin Actions Table (for audit logging)
CREATE TABLE IF NOT EXISTS admin_actions (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Suspicious Activities Table
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT REFERENCES auth.users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive'))
);

-- Access Reviews Table
CREATE TABLE IF NOT EXISTS access_reviews (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL REFERENCES auth.users(id),
    user_id TEXT NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- MFA Settings Table
CREATE TABLE IF NOT EXISTS mfa_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT false,
    sms_phone TEXT,
    sms_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    recovery_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- MFA Attempts Table
CREATE TABLE IF NOT EXISTS mfa_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'sms', 'backup_code')),
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Access Permissions Table
CREATE TABLE IF NOT EXISTS file_access_permissions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin', 'none')),
    granted_by TEXT NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- API Access Tokens Table
CREATE TABLE IF NOT EXISTS api_access_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_status ON suspicious_activities(status);
CREATE INDEX IF NOT EXISTS idx_access_reviews_reviewer_id ON access_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_access_reviews_user_id ON access_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_access_reviews_status ON access_reviews(status);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_id ON mfa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_created_at ON mfa_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_file_id ON file_access_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_user_id ON file_access_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_role_id ON file_access_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_api_access_tokens_user_id ON api_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_access_tokens_active ON api_access_tokens(is_active);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Roles: Admin can manage, users can read their own roles
CREATE POLICY "Admin can manage roles" ON roles
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can read roles" ON roles
    FOR SELECT USING (true);

-- Permissions: Admin can manage, users can read
CREATE POLICY "Admin can manage permissions" ON permissions
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can read permissions" ON permissions
    FOR SELECT USING (true);

-- User Roles: Users can read their own, admin can manage all
CREATE POLICY "Users can read own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage user roles" ON user_roles
    FOR ALL USING (auth.role() = 'admin');

-- User Permissions: Users can read their own, admin can manage all
CREATE POLICY "Users can read own permissions" ON user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage user permissions" ON user_permissions
    FOR ALL USING (auth.role() = 'admin');

-- Admin Actions: Admin only
CREATE POLICY "Admin only access to admin_actions" ON admin_actions
    FOR ALL USING (auth.role() = 'admin');

-- Suspicious Activities: Admin only
CREATE POLICY "Admin only access to suspicious_activities" ON suspicious_activities
    FOR ALL USING (auth.role() = 'admin');

-- Access Reviews: Admin and assigned reviewers
CREATE POLICY "Admin can manage access reviews" ON access_reviews
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Reviewers can manage assigned reviews" ON access_reviews
    FOR ALL USING (auth.uid() = reviewer_id);

-- MFA Settings: Users can manage their own
CREATE POLICY "Users can manage own MFA settings" ON mfa_settings
    FOR ALL USING (auth.uid() = user_id);

-- MFA Attempts: Users can read their own, admin can read all
CREATE POLICY "Users can read own MFA attempts" ON mfa_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all MFA attempts" ON mfa_attempts
    FOR SELECT USING (auth.role() = 'admin');

-- File Access Permissions: Users can read their own, admin can manage all
CREATE POLICY "Users can read own file permissions" ON file_access_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage file permissions" ON file_access_permissions
    FOR ALL USING (auth.role() = 'admin');

-- API Access Tokens: Users can manage their own, admin can manage all
CREATE POLICY "Users can manage own API tokens" ON api_access_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all API tokens" ON api_access_tokens
    FOR ALL USING (auth.role() = 'admin');

-- Insert default roles
INSERT INTO roles (id, name, description, permissions, is_active) VALUES
('admin', 'Administrator', 'Full system access', ARRAY['*'], true),
('event_manager', 'Event Manager', 'Can manage events and contractors', ARRAY['events:read', 'events:write', 'contractors:read', 'contractors:write', 'inquiries:read', 'inquiries:write'], true),
('contractor', 'Contractor', 'Can manage profile and respond to inquiries', ARRAY['profile:read', 'profile:write', 'inquiries:read', 'inquiries:write'], true),
('viewer', 'Viewer', 'Read-only access', ARRAY['events:read', 'contractors:read'], true);

-- Insert default permissions
INSERT INTO permissions (id, name, resource, action, description) VALUES
('users:read', 'Read Users', 'users', 'read', 'View user information'),
('users:write', 'Write Users', 'users', 'write', 'Create and update users'),
('users:delete', 'Delete Users', 'users', 'delete', 'Delete users'),
('events:read', 'Read Events', 'events', 'read', 'View events'),
('events:write', 'Write Events', 'events', 'write', 'Create and update events'),
('events:delete', 'Delete Events', 'events', 'delete', 'Delete events'),
('contractors:read', 'Read Contractors', 'contractors', 'read', 'View contractor profiles'),
('contractors:write', 'Write Contractors', 'contractors', 'write', 'Create and update contractor profiles'),
('contractors:delete', 'Delete Contractors', 'contractors', 'delete', 'Delete contractor profiles'),
('inquiries:read', 'Read Inquiries', 'inquiries', 'read', 'View inquiries'),
('inquiries:write', 'Write Inquiries', 'inquiries', 'write', 'Create and update inquiries'),
('inquiries:delete', 'Delete Inquiries', 'inquiries', 'delete', 'Delete inquiries'),
('admin:read', 'Admin Read', 'admin', 'read', 'Access admin functions'),
('admin:write', 'Admin Write', 'admin', 'write', 'Modify admin settings'),
('files:read', 'Read Files', 'files', 'read', 'View files'),
('files:write', 'Write Files', 'files', 'write', 'Upload and modify files'),
('files:delete', 'Delete Files', 'files', 'delete', 'Delete files'),
('analytics:read', 'Read Analytics', 'analytics', 'read', 'View analytics data'),
('settings:read', 'Read Settings', 'settings', 'read', 'View system settings'),
('settings:write', 'Write Settings', 'settings', 'write', 'Modify system settings');

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id_param TEXT,
    permission_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check if user has the permission directly
    SELECT EXISTS(
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = user_id_param
        AND p.name = permission_name
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO has_permission;
    
    -- If not found, check through roles
    IF NOT has_permission THEN
        SELECT EXISTS(
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = user_id_param
            AND (r.permissions @> ARRAY[permission_name] OR r.permissions @> ARRAY['*'])
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_id_param TEXT)
RETURNS TABLE(role_name TEXT, role_description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param TEXT)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
    -- Direct permissions
    RETURN QUERY
    SELECT p.name, p.resource, p.action
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_id_param
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
    
    UNION
    
    -- Role-based permissions
    SELECT p.name, p.resource, p.action
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN permissions p ON p.name = ANY(r.permissions)
    WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND (r.permissions @> ARRAY[p.name] OR r.permissions @> ARRAY['*']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
