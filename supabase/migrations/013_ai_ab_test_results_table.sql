-- Create ai_ab_test_results table for A/B testing results
CREATE TABLE ai_ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES ai_ab_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    result_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recommendation_requests table for tracking recommendation requests
CREATE TABLE recommendation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    request_data JSONB NOT NULL,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recommendation_interactions table for tracking user interactions
CREATE TABLE recommendation_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'click', 'select', 'deselect', 'convert', 'feedback')),
    interaction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_performance_logs table for tracking API performance
CREATE TABLE api_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time DECIMAL(10,3) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_ab_test_results_test_id ON ai_ab_test_results(test_id);
CREATE INDEX idx_ai_ab_test_results_user_id ON ai_ab_test_results(user_id);
CREATE INDEX idx_ai_ab_test_results_variant ON ai_ab_test_results(variant);
CREATE INDEX idx_ai_ab_test_results_timestamp ON ai_ab_test_results(timestamp);

CREATE INDEX idx_recommendation_requests_user_id ON recommendation_requests(user_id);
CREATE INDEX idx_recommendation_requests_event_type ON recommendation_requests(event_type);
CREATE INDEX idx_recommendation_requests_created_at ON recommendation_requests(created_at);

CREATE INDEX idx_recommendation_interactions_user_id ON recommendation_interactions(user_id);
CREATE INDEX idx_recommendation_interactions_recommendation_id ON recommendation_interactions(recommendation_id);
CREATE INDEX idx_recommendation_interactions_action ON recommendation_interactions(action);
CREATE INDEX idx_recommendation_interactions_created_at ON recommendation_interactions(created_at);

CREATE INDEX idx_api_performance_logs_endpoint ON api_performance_logs(endpoint);
CREATE INDEX idx_api_performance_logs_timestamp ON api_performance_logs(timestamp);
CREATE INDEX idx_api_performance_logs_status_code ON api_performance_logs(status_code);

-- Enable RLS on all tables
ALTER TABLE ai_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_ab_test_results
CREATE POLICY "Users can view their own test results" ON ai_ab_test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test results" ON ai_ab_test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all test results" ON ai_ab_test_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for recommendation_requests
CREATE POLICY "Users can view their own recommendation requests" ON recommendation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation requests" ON recommendation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for recommendation_interactions
CREATE POLICY "Users can view their own interactions" ON recommendation_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON recommendation_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for api_performance_logs (admin only)
CREATE POLICY "Admins can view performance logs" ON api_performance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert performance logs" ON api_performance_logs
    FOR INSERT WITH CHECK (true);
