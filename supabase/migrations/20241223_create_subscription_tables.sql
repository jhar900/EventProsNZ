-- Create subscription management tables
-- This migration adds the subscription system with tiers, pricing, trials, and promotional codes

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('essential', 'showcase', 'spotlight');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired', 'trial');

-- Create billing cycle enum
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', '2year');

-- Create discount type enum
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    price DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    promotional_code TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotional codes table
CREATE TABLE promotional_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    tier_applicable subscription_tier[],
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription features table
CREATE TABLE subscription_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier subscription_tier NOT NULL,
    feature_name TEXT NOT NULL,
    feature_description TEXT,
    is_included BOOLEAN DEFAULT TRUE,
    limit_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription pricing table
CREATE TABLE subscription_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier subscription_tier NOT NULL,
    billing_cycle billing_cycle NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tier, billing_cycle)
);

-- Create subscription analytics table
CREATE TABLE subscription_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_trial_end_date ON subscriptions(trial_end_date);
CREATE INDEX idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX idx_promotional_codes_active ON promotional_codes(is_active);
CREATE INDEX idx_subscription_features_tier ON subscription_features(tier);
CREATE INDEX idx_subscription_pricing_tier_cycle ON subscription_pricing(tier, billing_cycle);
CREATE INDEX idx_subscription_analytics_subscription_id ON subscription_analytics(subscription_id);

-- Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Promotional codes policies
CREATE POLICY "Anyone can view active promotional codes" ON promotional_codes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage promotional codes" ON promotional_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscription features policies
CREATE POLICY "Anyone can view subscription features" ON subscription_features
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage subscription features" ON subscription_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscription pricing policies
CREATE POLICY "Anyone can view active pricing" ON subscription_pricing
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage pricing" ON subscription_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscription analytics policies
CREATE POLICY "Users can view their own analytics" ON subscription_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE id = subscription_analytics.subscription_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all analytics" ON subscription_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default subscription features
INSERT INTO subscription_features (tier, feature_name, feature_description, is_included, limit_value) VALUES
-- Essential tier features
('essential', 'Basic Profile', 'Create and manage basic contractor profile', TRUE, NULL),
('essential', 'Portfolio Upload', 'Upload up to 5 portfolio items', TRUE, 5),
('essential', 'Basic Search Visibility', 'Appear in basic contractor searches', TRUE, NULL),
('essential', 'Contact Form', 'Receive inquiries through contact form', TRUE, NULL),
('essential', 'Basic Analytics', 'View basic profile analytics', TRUE, NULL),

-- Showcase tier features
('showcase', 'Enhanced Profile', 'Create and manage enhanced contractor profile with premium features', TRUE, NULL),
('showcase', 'Portfolio Upload', 'Upload up to 20 portfolio items', TRUE, 20),
('showcase', 'Priority Search Visibility', 'Appear at top of search results', TRUE, NULL),
('showcase', 'Direct Contact', 'Direct contact information visible', TRUE, NULL),
('showcase', 'Advanced Analytics', 'View detailed analytics and insights', TRUE, NULL),
('showcase', 'Featured Badge', 'Display featured contractor badge', TRUE, NULL),
('showcase', 'Social Media Integration', 'Link social media profiles', TRUE, NULL),
('showcase', 'Video Portfolio', 'Upload video portfolio items', TRUE, 5),

-- Spotlight tier features
('spotlight', 'Premium Profile', 'Create and manage premium contractor profile with all features', TRUE, NULL),
('spotlight', 'Unlimited Portfolio', 'Upload unlimited portfolio items', TRUE, NULL),
('spotlight', 'Top Search Visibility', 'Appear at very top of search results', TRUE, NULL),
('spotlight', 'Direct Contact', 'Direct contact information visible', TRUE, NULL),
('spotlight', 'Premium Analytics', 'View comprehensive analytics and insights', TRUE, NULL),
('spotlight', 'Premium Badge', 'Display premium contractor badge', TRUE, NULL),
('spotlight', 'Social Media Integration', 'Link social media profiles', TRUE, NULL),
('spotlight', 'Video Portfolio', 'Upload unlimited video portfolio items', TRUE, NULL),
('spotlight', 'Priority Support', 'Priority customer support', TRUE, NULL),
('spotlight', 'Custom Branding', 'Custom profile branding options', TRUE, NULL),
('spotlight', 'Advanced Matching', 'Enhanced contractor matching algorithm', TRUE, NULL);

-- Insert default pricing
INSERT INTO subscription_pricing (tier, billing_cycle, price, is_active) VALUES
-- Essential tier (free)
('essential', 'monthly', 0.00, TRUE),
('essential', 'yearly', 0.00, TRUE),
('essential', '2year', 0.00, TRUE),

-- Showcase tier
('showcase', 'monthly', 29.00, TRUE),
('showcase', 'yearly', 299.00, TRUE),
('showcase', '2year', 499.00, TRUE),

-- Spotlight tier
('spotlight', 'monthly', 69.00, TRUE),
('spotlight', 'yearly', 699.00, TRUE),
('spotlight', '2year', 1199.00, TRUE);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_pricing_updated_at BEFORE UPDATE ON subscription_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to start trial for new contractors
CREATE OR REPLACE FUNCTION start_contractor_trial()
RETURNS TRIGGER AS $$
BEGIN
    -- Only start trial for contractors
    IF NEW.role = 'contractor' THEN
        INSERT INTO subscriptions (
            user_id,
            tier,
            status,
            billing_cycle,
            price,
            trial_end_date
        ) VALUES (
            NEW.id,
            'showcase',
            'trial',
            'monthly',
            0.00,
            NOW() + INTERVAL '14 days'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to start trial for new contractors
CREATE TRIGGER start_contractor_trial_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION start_contractor_trial();

-- Create function to check trial expiration
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS void AS $$
BEGIN
    -- Update expired trials to inactive
    UPDATE subscriptions 
    SET status = 'inactive'
    WHERE status = 'trial' 
    AND trial_end_date < NOW();
END;
$$ language 'plpgsql';

-- Create function to get subscription features for a user
CREATE OR REPLACE FUNCTION get_user_subscription_features(user_uuid UUID)
RETURNS TABLE (
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
    JOIN subscriptions s ON sf.tier = s.tier
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trial')
    AND s.end_date IS NULL OR s.end_date > NOW();
END;
$$ language 'plpgsql';

-- Create function to validate feature access
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM subscription_features sf
        JOIN subscriptions s ON sf.tier = s.tier
        WHERE s.user_id = user_uuid
        AND sf.feature_name = feature_name
        AND sf.is_included = TRUE
        AND s.status IN ('active', 'trial')
        AND (s.end_date IS NULL OR s.end_date > NOW())
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ language 'plpgsql';
