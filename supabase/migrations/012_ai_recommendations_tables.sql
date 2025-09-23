-- AI Recommendations Tables Migration
-- This migration creates the necessary tables for AI-powered service recommendations

-- User preferences for AI recommendations
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL,
    preference_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation feedback for learning
CREATE TABLE recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service recommendations cache
CREATE TABLE service_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_name TEXT NOT NULL,
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_required BOOLEAN DEFAULT FALSE,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI learning data
CREATE TABLE ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    service_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'select', 'deselect', 'feedback_positive', 'feedback_negative', 'book', 'complete')),
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing data
CREATE TABLE ai_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service patterns for AI learning
CREATE TABLE service_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    service_combination TEXT NOT NULL,
    success_rate DECIMAL(3,2) NOT NULL CHECK (success_rate >= 0 AND success_rate <= 1),
    average_rating DECIMAL(3,2) NOT NULL CHECK (average_rating >= 1 AND average_rating <= 5),
    sample_size INTEGER NOT NULL CHECK (sample_size > 0),
    confidence_level DECIMAL(3,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning insights for AI recommendations
CREATE TABLE learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type TEXT NOT NULL CHECK (insight_type IN ('service_combination', 'budget_optimization', 'timeline_insight', 'vendor_performance')),
    event_type TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX idx_recommendation_feedback_recommendation_id ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_service_recommendations_event_type ON service_recommendations(event_type);
CREATE INDEX idx_service_recommendations_category ON service_recommendations(service_category);
CREATE INDEX idx_ai_learning_data_user_id ON ai_learning_data(user_id);
CREATE INDEX idx_ai_learning_data_event_type ON ai_learning_data(event_type);
CREATE INDEX idx_ai_learning_data_action ON ai_learning_data(action);
CREATE INDEX idx_ai_ab_tests_active ON ai_ab_tests(is_active);
CREATE INDEX idx_service_patterns_event_type ON service_patterns(event_type);
CREATE INDEX idx_service_patterns_combination ON service_patterns(service_combination);
CREATE INDEX idx_service_patterns_success_rate ON service_patterns(success_rate);
CREATE INDEX idx_learning_insights_type ON learning_insights(insight_type);
CREATE INDEX idx_learning_insights_event_type ON learning_insights(event_type);
CREATE INDEX idx_learning_insights_user_id ON learning_insights(user_id);
CREATE INDEX idx_learning_insights_confidence ON learning_insights(confidence);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Recommendation feedback policies
CREATE POLICY "Users can view their own feedback" ON recommendation_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON recommendation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service recommendations policies (read-only for users)
CREATE POLICY "Anyone can view service recommendations" ON service_recommendations
    FOR SELECT USING (true);

-- AI learning data policies
CREATE POLICY "Users can view their own learning data" ON ai_learning_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning data" ON ai_learning_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- A/B testing policies (admin only)
CREATE POLICY "Admins can manage A/B tests" ON ai_ab_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Service patterns policies (read-only for users, admin can manage)
CREATE POLICY "Anyone can view service patterns" ON service_patterns
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage service patterns" ON service_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Learning insights policies
CREATE POLICY "Users can view their own insights" ON learning_insights
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own insights" ON learning_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all insights" ON learning_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insert some sample service recommendations
INSERT INTO service_recommendations (event_type, service_category, service_name, priority, confidence_score, is_required, description, estimated_cost) VALUES
('wedding', 'Photography', 'Wedding Photography', 5, 0.95, true, 'Professional wedding photography services', 3000.00),
('wedding', 'Catering', 'Wedding Catering', 5, 0.90, true, 'Full-service wedding catering', 5000.00),
('wedding', 'Venue', 'Wedding Venue', 5, 0.85, true, 'Wedding ceremony and reception venue', 4000.00),
('wedding', 'Music', 'Wedding DJ', 4, 0.80, false, 'Professional wedding DJ services', 800.00),
('wedding', 'Flowers', 'Wedding Flowers', 4, 0.75, false, 'Bridal bouquets and venue decorations', 1200.00),
('corporate', 'Catering', 'Corporate Catering', 4, 0.85, true, 'Professional corporate event catering', 2500.00),
('corporate', 'Venue', 'Conference Venue', 4, 0.80, true, 'Conference and meeting facilities', 2000.00),
('corporate', 'AV Equipment', 'Audio Visual Setup', 3, 0.70, false, 'Professional AV equipment and setup', 1500.00),
('birthday', 'Catering', 'Birthday Party Catering', 3, 0.75, false, 'Birthday party food and beverages', 800.00),
('birthday', 'Entertainment', 'Party Entertainment', 3, 0.65, false, 'Birthday party entertainment and activities', 600.00);
