-- Create trial conversion system tables
-- This migration adds trial conversion tracking, email management, analytics, and recommendations

-- Create trial conversion status enum
CREATE TYPE trial_conversion_status AS ENUM ('active', 'converted', 'expired', 'cancelled');

-- Create trial email type enum
CREATE TYPE trial_email_type AS ENUM ('day_2_optimization', 'day_7_checkin', 'day_12_ending');

-- Create email status enum
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed');

-- Create recommendation type enum
CREATE TYPE recommendation_type AS ENUM ('profile_optimization', 'feature_usage', 'subscription_upgrade', 'support_contact');

-- Create trial conversion table
CREATE TABLE trial_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    conversion_status trial_conversion_status NOT NULL DEFAULT 'active',
    conversion_date TIMESTAMP WITH TIME ZONE,
    conversion_tier subscription_tier,
    conversion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial emails table
CREATE TABLE trial_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type trial_email_type NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    email_status email_status DEFAULT 'pending',
    email_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial analytics table
CREATE TABLE trial_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trial_day INTEGER NOT NULL,
    feature_usage JSONB,
    platform_engagement JSONB,
    conversion_likelihood DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial recommendations table
CREATE TABLE trial_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type recommendation_type NOT NULL,
    recommendation_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial support tickets table
CREATE TABLE trial_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial insights table
CREATE TABLE trial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trial_conversions_user_id ON trial_conversions(user_id);
CREATE INDEX idx_trial_conversions_status ON trial_conversions(conversion_status);
CREATE INDEX idx_trial_conversions_trial_end_date ON trial_conversions(trial_end_date);
CREATE INDEX idx_trial_emails_user_id ON trial_emails(user_id);
CREATE INDEX idx_trial_emails_type ON trial_emails(email_type);
CREATE INDEX idx_trial_emails_status ON trial_emails(email_status);
CREATE INDEX idx_trial_emails_scheduled_date ON trial_emails(scheduled_date);
CREATE INDEX idx_trial_analytics_user_id ON trial_analytics(user_id);
CREATE INDEX idx_trial_analytics_trial_day ON trial_analytics(trial_day);
CREATE INDEX idx_trial_recommendations_user_id ON trial_recommendations(user_id);
CREATE INDEX idx_trial_recommendations_type ON trial_recommendations(recommendation_type);
CREATE INDEX idx_trial_support_tickets_user_id ON trial_support_tickets(user_id);
CREATE INDEX idx_trial_support_tickets_status ON trial_support_tickets(status);
CREATE INDEX idx_trial_insights_user_id ON trial_insights(user_id);
CREATE INDEX idx_trial_insights_type ON trial_insights(insight_type);

-- Create RLS policies
ALTER TABLE trial_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_insights ENABLE ROW LEVEL SECURITY;

-- Trial conversions policies
CREATE POLICY "Users can view their own trial conversions" ON trial_conversions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial conversions" ON trial_conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial conversions" ON trial_conversions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trial conversions" ON trial_conversions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trial emails policies
CREATE POLICY "Users can view their own trial emails" ON trial_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial emails" ON trial_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial emails" ON trial_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trial emails" ON trial_emails
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trial analytics policies
CREATE POLICY "Users can view their own trial analytics" ON trial_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial analytics" ON trial_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trial analytics" ON trial_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trial recommendations policies
CREATE POLICY "Users can view their own trial recommendations" ON trial_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial recommendations" ON trial_recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial recommendations" ON trial_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trial recommendations" ON trial_recommendations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trial support tickets policies
CREATE POLICY "Users can view their own support tickets" ON trial_support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support tickets" ON trial_support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" ON trial_support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets" ON trial_support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trial insights policies
CREATE POLICY "Users can view their own trial insights" ON trial_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trial insights" ON trial_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trial insights" ON trial_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create triggers for updated_at
CREATE TRIGGER update_trial_conversions_updated_at BEFORE UPDATE ON trial_conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_support_tickets_updated_at BEFORE UPDATE ON trial_support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to start trial conversion tracking
CREATE OR REPLACE FUNCTION start_trial_conversion_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Only start trial conversion tracking for contractors with trial subscriptions
    IF NEW.role = 'contractor' AND NEW.status = 'trial' THEN
        INSERT INTO trial_conversions (
            user_id,
            trial_start_date,
            trial_end_date,
            conversion_status
        ) VALUES (
            NEW.user_id,
            NEW.start_date,
            NEW.trial_end_date,
            'active'
        );
        
        -- Schedule trial emails
        INSERT INTO trial_emails (user_id, email_type, scheduled_date) VALUES
        (NEW.user_id, 'day_2_optimization', NEW.start_date + INTERVAL '2 days'),
        (NEW.user_id, 'day_7_checkin', NEW.start_date + INTERVAL '7 days'),
        (NEW.user_id, 'day_12_ending', NEW.start_date + INTERVAL '12 days');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to start trial conversion tracking
CREATE TRIGGER start_trial_conversion_tracking_trigger
    AFTER INSERT ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION start_trial_conversion_tracking();

-- Create function to track trial analytics
CREATE OR REPLACE FUNCTION track_trial_analytics(
    user_uuid UUID,
    trial_day INTEGER,
    feature_usage_data JSONB,
    engagement_data JSONB
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
    conversion_likelihood DECIMAL(3,2);
BEGIN
    -- Calculate conversion likelihood based on engagement
    conversion_likelihood := CASE
        WHEN (engagement_data->>'login_frequency')::INTEGER > 5 THEN 0.8
        WHEN (engagement_data->>'login_frequency')::INTEGER > 3 THEN 0.6
        WHEN (engagement_data->>'login_frequency')::INTEGER > 1 THEN 0.4
        ELSE 0.2
    END;
    
    INSERT INTO trial_analytics (
        user_id,
        trial_day,
        feature_usage,
        platform_engagement,
        conversion_likelihood
    ) VALUES (
        user_uuid,
        trial_day,
        feature_usage_data,
        engagement_data,
        conversion_likelihood
    ) RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ language 'plpgsql';

-- Create function to generate trial recommendations
CREATE OR REPLACE FUNCTION generate_trial_recommendations(user_uuid UUID)
RETURNS TABLE (
    recommendation_id UUID,
    recommendation_type recommendation_type,
    recommendation_data JSONB,
    confidence_score DECIMAL(3,2)
) AS $$
DECLARE
    user_analytics RECORD;
    profile_completion DECIMAL(3,2);
    feature_usage_score DECIMAL(3,2);
BEGIN
    -- Get latest analytics for user
    SELECT * INTO user_analytics
    FROM trial_analytics
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF user_analytics IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate profile completion score
    profile_completion := COALESCE((user_analytics.feature_usage->>'profile_completion')::DECIMAL(3,2), 0.0);
    
    -- Calculate feature usage score
    feature_usage_score := COALESCE((user_analytics.platform_engagement->>'feature_usage_score')::DECIMAL(3,2), 0.0);
    
    -- Generate profile optimization recommendations
    IF profile_completion < 0.7 THEN
        recommendation_id := gen_random_uuid();
        recommendation_type := 'profile_optimization';
        recommendation_data := jsonb_build_object(
            'message', 'Complete your profile to increase visibility',
            'actions', jsonb_build_array(
                'Add profile photo',
                'Complete bio section',
                'Add service categories',
                'Upload portfolio items'
            )
        );
        confidence_score := 0.9;
        RETURN NEXT;
    END IF;
    
    -- Generate feature usage recommendations
    IF feature_usage_score < 0.5 THEN
        recommendation_id := gen_random_uuid();
        recommendation_type := 'feature_usage';
        recommendation_data := jsonb_build_object(
            'message', 'Explore more features to get the most from your trial',
            'actions', jsonb_build_array(
                'Try the search functionality',
                'Upload portfolio items',
                'Complete your business profile',
                'Explore contractor matching'
            )
        );
        confidence_score := 0.8;
        RETURN NEXT;
    END IF;
    
    -- Generate subscription upgrade recommendations
    IF user_analytics.conversion_likelihood > 0.7 THEN
        recommendation_id := gen_random_uuid();
        recommendation_type := 'subscription_upgrade';
        recommendation_data := jsonb_build_object(
            'message', 'You''re getting great value from the platform! Consider upgrading',
            'tier_suggestion', 'showcase',
            'benefits', jsonb_build_array(
                'Priority search visibility',
                'Enhanced profile features',
                'Advanced analytics',
                'Direct contact information'
            )
        );
        confidence_score := user_analytics.conversion_likelihood;
        RETURN NEXT;
    END IF;
END;
$$ language 'plpgsql';

-- Create function to check trial expiration and handle conversions
CREATE OR REPLACE FUNCTION check_trial_expiration_and_conversion()
RETURNS void AS $$
BEGIN
    -- Update expired trials to inactive and mark conversion as expired
    UPDATE subscriptions 
    SET status = 'inactive'
    WHERE status = 'trial' 
    AND trial_end_date < NOW();
    
    -- Update trial conversions for expired trials
    UPDATE trial_conversions
    SET conversion_status = 'expired',
        updated_at = NOW()
    WHERE conversion_status = 'active'
    AND trial_end_date < NOW();
END;
$$ language 'plpgsql';

-- Create function to get trial conversion metrics
CREATE OR REPLACE FUNCTION get_trial_conversion_metrics()
RETURNS TABLE (
    total_trials BIGINT,
    converted_trials BIGINT,
    expired_trials BIGINT,
    conversion_rate DECIMAL(5,2),
    avg_trial_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_trials,
        COUNT(*) FILTER (WHERE conversion_status = 'converted') as converted_trials,
        COUNT(*) FILTER (WHERE conversion_status = 'expired') as expired_trials,
        ROUND(
            (COUNT(*) FILTER (WHERE conversion_status = 'converted')::DECIMAL / 
             NULLIF(COUNT(*), 0)) * 100, 2
        ) as conversion_rate,
        AVG(trial_end_date - trial_start_date) as avg_trial_duration
    FROM trial_conversions;
END;
$$ language 'plpgsql';
