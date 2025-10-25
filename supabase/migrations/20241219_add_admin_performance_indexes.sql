-- Add indexes for admin user search performance
-- This migration addresses performance concerns identified in QA review

-- Index for user search by email, name, and company
CREATE INDEX IF NOT EXISTS idx_users_search_fields 
ON users USING gin(
  to_tsvector('english', 
    COALESCE(email, '') || ' ' || 
    COALESCE((profiles.first_name), '') || ' ' || 
    COALESCE((profiles.last_name), '') || ' ' || 
    COALESCE((business_profiles.company_name), '')
  )
);

-- Index for user role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for user verification status
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(is_verified);

-- Index for user status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Index for user creation date (for date range filtering)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Index for user last login (for activity filtering)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Index for profiles city/state/country (for location filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles USING gin(
  to_tsvector('english', 
    COALESCE(city, '') || ' ' || 
    COALESCE(state, '') || ' ' || 
    COALESCE(country, '')
  )
);

-- Index for business profiles company name
CREATE INDEX IF NOT EXISTS idx_business_profiles_company 
ON business_profiles(company_name);

-- Index for business profiles subscription tier
CREATE INDEX IF NOT EXISTS idx_business_profiles_subscription 
ON business_profiles(subscription_tier);

-- Index for activity logs by user and action (for audit trails)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action 
ON activity_logs(user_id, action);

-- Index for activity logs by timestamp (for audit queries)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at);

-- Index for rate limiting by IP and operation
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_operation 
ON rate_limits(ip_address, operation, created_at);

-- Composite index for complex user queries
CREATE INDEX IF NOT EXISTS idx_users_complex_search 
ON users(role, is_verified, status, created_at) 
WHERE status != 'deleted';

-- Add comments for documentation
COMMENT ON INDEX idx_users_search_fields IS 'Full-text search index for user search functionality';
COMMENT ON INDEX idx_users_complex_search IS 'Composite index for complex admin user queries';
COMMENT ON INDEX idx_rate_limits_ip_operation IS 'Rate limiting index for admin operations';
