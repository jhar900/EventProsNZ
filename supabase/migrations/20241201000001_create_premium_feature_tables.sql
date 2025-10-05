-- Create feature_access table
CREATE TABLE IF NOT EXISTS feature_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    tier_required TEXT NOT NULL CHECK (tier_required IN ('essential', 'showcase', 'spotlight')),
    is_accessible BOOLEAN DEFAULT FALSE,
    access_granted_at TIMESTAMP WITH TIME ZONE,
    access_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_profile_urls table
CREATE TABLE IF NOT EXISTS custom_profile_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    custom_url TEXT UNIQUE NOT NULL,
    tier_required TEXT DEFAULT 'spotlight' CHECK (tier_required IN ('essential', 'showcase', 'spotlight')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spotlight_features table
CREATE TABLE IF NOT EXISTS spotlight_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,
    feature_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create early_access_features table
CREATE TABLE IF NOT EXISTS early_access_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT NOT NULL,
    feature_description TEXT,
    tier_required TEXT NOT NULL CHECK (tier_required IN ('essential', 'showcase', 'spotlight')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create early_access_requests table
CREATE TABLE IF NOT EXISTS early_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'standard' CHECK (priority IN ('standard', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_views table for analytics
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_feature_name ON feature_access(feature_name);
CREATE INDEX IF NOT EXISTS idx_custom_profile_urls_user_id ON custom_profile_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_profile_urls_custom_url ON custom_profile_urls(custom_url);
CREATE INDEX IF NOT EXISTS idx_spotlight_features_user_id ON spotlight_features(user_id);
CREATE INDEX IF NOT EXISTS idx_early_access_requests_user_id ON early_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_contractor_id ON profile_views(contractor_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at);

-- Create RLS policies
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_profile_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlight_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Feature access policies
CREATE POLICY "Users can view their own feature access" ON feature_access
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature access" ON feature_access
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature access" ON feature_access
    FOR UPDATE USING (auth.uid() = user_id);

-- Custom profile URLs policies
CREATE POLICY "Users can view their own custom URLs" ON custom_profile_urls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom URLs" ON custom_profile_urls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom URLs" ON custom_profile_urls
    FOR UPDATE USING (auth.uid() = user_id);

-- Spotlight features policies
CREATE POLICY "Users can view their own spotlight features" ON spotlight_features
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotlight features" ON spotlight_features
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotlight features" ON spotlight_features
    FOR UPDATE USING (auth.uid() = user_id);

-- Early access features policies (public read)
CREATE POLICY "Anyone can view early access features" ON early_access_features
    FOR SELECT USING (true);

-- Early access requests policies
CREATE POLICY "Users can view their own early access requests" ON early_access_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own early access requests" ON early_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Profile views policies
CREATE POLICY "Anyone can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Contractors can view their own profile views" ON profile_views
    FOR SELECT USING (auth.uid() = contractor_id);

-- Create functions for feature access checking
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    required_tier TEXT;
BEGIN
    -- Get user's current subscription tier
    SELECT tier INTO user_tier
    FROM subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trial')
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no subscription, default to essential
    IF user_tier IS NULL THEN
        user_tier := 'essential';
    END IF;

    -- Get required tier for the feature
    SELECT tier_required INTO required_tier
    FROM subscription_features
    WHERE feature_name = has_feature_access.feature_name
    AND is_included = true
    LIMIT 1;

    -- If feature not found, deny access
    IF required_tier IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check tier hierarchy
    RETURN CASE
        WHEN user_tier = 'spotlight' THEN TRUE
        WHEN user_tier = 'showcase' AND required_tier IN ('essential', 'showcase') THEN TRUE
        WHEN user_tier = 'essential' AND required_tier = 'essential' THEN TRUE
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user subscription features
CREATE OR REPLACE FUNCTION get_user_subscription_features(user_uuid UUID)
RETURNS TABLE(
    feature_name TEXT,
    feature_description TEXT,
    is_included BOOLEAN,
    limit_value INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sf.feature_name,
        sf.feature_description,
        sf.is_included,
        sf.limit_value
    FROM subscription_features sf
    WHERE sf.tier = (
        SELECT tier
        FROM subscriptions
        WHERE user_id = user_uuid
        AND status IN ('active', 'trial')
        ORDER BY created_at DESC
        LIMIT 1
    )
    AND sf.is_included = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
