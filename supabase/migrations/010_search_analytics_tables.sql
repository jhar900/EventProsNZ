-- Search Analytics and Optimization Tables
-- Story 3.4: Search Analytics & Optimization

-- Create SearchQuery table for detailed query tracking
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    clicked_result_id UUID REFERENCES users(id),
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SearchFilter table for filter usage tracking
CREATE TABLE IF NOT EXISTS search_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filter_type TEXT NOT NULL,
    filter_value TEXT NOT NULL,
    search_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SearchClick table for click-through tracking
CREATE TABLE IF NOT EXISTS search_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query_id UUID REFERENCES search_queries(id),
    click_position INTEGER,
    click_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SearchSession table for session tracking
CREATE TABLE IF NOT EXISTS search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_queries INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    session_duration INTEGER DEFAULT 0 -- in seconds
);

-- Create ABTest table for A/B testing
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    test_type TEXT NOT NULL,
    control_config JSONB DEFAULT '{}',
    variant_config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ABTestResult table for test results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant TEXT NOT NULL CHECK (variant IN ('control', 'variant')),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PerformanceMetrics table for performance tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries USING gin(to_tsvector('english', query));
CREATE INDEX IF NOT EXISTS idx_search_queries_session_id ON search_queries(session_id);

CREATE INDEX IF NOT EXISTS idx_search_filters_user_id ON search_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_search_filters_filter_type ON search_filters(filter_type);
CREATE INDEX IF NOT EXISTS idx_search_filters_created_at ON search_filters(created_at);
CREATE INDEX IF NOT EXISTS idx_search_filters_session_id ON search_filters(search_session_id);

CREATE INDEX IF NOT EXISTS idx_search_clicks_user_id ON search_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_contractor_id ON search_clicks(contractor_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_query_id ON search_clicks(search_query_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_timestamp ON search_clicks(click_timestamp);

CREATE INDEX IF NOT EXISTS idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_start ON search_sessions(session_start);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ab_test_results(variant);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

-- Enable RLS on new tables
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_queries
CREATE POLICY "Users can view their own search queries" ON search_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search queries" ON search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for search_filters
CREATE POLICY "Users can view their own search filters" ON search_filters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search filters" ON search_filters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for search_clicks
CREATE POLICY "Users can view their own search clicks" ON search_clicks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search clicks" ON search_clicks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for search_sessions
CREATE POLICY "Users can view their own search sessions" ON search_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search sessions" ON search_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search sessions" ON search_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for ab_tests (admin only)
CREATE POLICY "Admins can view all ab tests" ON ab_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert ab tests" ON ab_tests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update ab tests" ON ab_tests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for ab_test_results
CREATE POLICY "Users can view their own ab test results" ON ab_test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ab test results" ON ab_test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for performance_metrics (admin only)
CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ab_tests updated_at
DROP TRIGGER IF EXISTS trigger_update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER trigger_update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create analytics views for common queries
CREATE OR REPLACE VIEW search_analytics_daily AS
SELECT 
    DATE_TRUNC('day', sq.created_at) as date,
    COUNT(*) as total_queries,
    COUNT(DISTINCT sq.user_id) as unique_users,
    AVG(sq.result_count) as avg_results_per_query,
    COUNT(*) FILTER (WHERE sq.result_count = 0) as zero_result_queries,
    COUNT(*) FILTER (WHERE sq.result_count > 0) as successful_queries,
    COUNT(sc.id) as total_clicks,
    CASE 
        WHEN COUNT(*) > 0 THEN COUNT(sc.id)::DECIMAL / COUNT(*)::DECIMAL * 100
        ELSE 0
    END as click_through_rate
FROM search_queries sq
LEFT JOIN search_clicks sc ON sq.id = sc.search_query_id
GROUP BY DATE_TRUNC('day', sq.created_at)
ORDER BY date DESC;

-- Create view for filter usage analytics
CREATE OR REPLACE VIEW filter_usage_analytics AS
SELECT 
    sf.filter_type,
    sf.filter_value,
    COUNT(*) as usage_count,
    COUNT(DISTINCT sf.user_id) as unique_users,
    DATE_TRUNC('day', sf.created_at) as date
FROM search_filters sf
GROUP BY sf.filter_type, sf.filter_value, DATE_TRUNC('day', sf.created_at)
ORDER BY date DESC, usage_count DESC;

-- Create view for trending search terms
CREATE OR REPLACE VIEW trending_search_terms AS
SELECT 
    sq.query,
    COUNT(*) as search_count,
    COUNT(DISTINCT sq.user_id) as unique_users,
    AVG(sq.result_count) as avg_results,
    DATE_TRUNC('day', sq.created_at) as date
FROM search_queries sq
WHERE sq.query != ''
GROUP BY sq.query, DATE_TRUNC('day', sq.created_at)
ORDER BY date DESC, search_count DESC;

-- Create view for click-through analytics
CREATE OR REPLACE VIEW click_through_analytics AS
SELECT 
    sq.query,
    sc.click_position,
    COUNT(*) as click_count,
    COUNT(DISTINCT sc.user_id) as unique_users,
    DATE_TRUNC('day', sc.click_timestamp) as date
FROM search_clicks sc
LEFT JOIN search_queries sq ON sc.search_query_id = sq.id
GROUP BY sq.query, sc.click_position, DATE_TRUNC('day', sc.click_timestamp)
ORDER BY date DESC, click_count DESC;

-- Grant permissions for the analytics views
GRANT SELECT ON search_analytics_daily TO authenticated;
GRANT SELECT ON filter_usage_analytics TO authenticated;
GRANT SELECT ON trending_search_terms TO authenticated;
GRANT SELECT ON click_through_analytics TO authenticated;

-- Create function to clean up old analytics data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up old search queries (keep last 90 days)
    DELETE FROM search_queries 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old search filters (keep last 90 days)
    DELETE FROM search_filters 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old search clicks (keep last 90 days)
    DELETE FROM search_clicks 
    WHERE click_timestamp < NOW() - INTERVAL '90 days';
    
    -- Clean up old search sessions (keep last 90 days)
    DELETE FROM search_sessions 
    WHERE session_start < NOW() - INTERVAL '90 days';
    
    -- Clean up old performance metrics (keep last 30 days)
    DELETE FROM performance_metrics 
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up old analytics data (runs daily)
-- Note: This would typically be set up as a scheduled job in production

-- Create database functions for analytics queries
CREATE OR REPLACE FUNCTION get_search_query_analytics(
    date_filter TEXT DEFAULT '',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    unique_users BIGINT,
    avg_results DECIMAL,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            sq.query,
            COUNT(*) as search_count,
            COUNT(DISTINCT sq.user_id) as unique_users,
            AVG(sq.result_count) as avg_results,
            DATE_TRUNC(''day'', sq.created_at)::DATE as date
        FROM search_queries sq
        WHERE 1=1 %s
        GROUP BY sq.query, DATE_TRUNC(''day'', sq.created_at)
        ORDER BY search_count DESC
        LIMIT %s
    ', date_filter, limit_count);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_filter_usage_patterns(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    filter_type TEXT,
    filter_value TEXT,
    usage_count BIGINT,
    unique_users BIGINT,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            sf.filter_type,
            sf.filter_value,
            COUNT(*) as usage_count,
            COUNT(DISTINCT sf.user_id) as unique_users,
            DATE_TRUNC(''day'', sf.created_at)::DATE as date
        FROM search_filters sf
        WHERE 1=1 %s
        GROUP BY sf.filter_type, sf.filter_value, DATE_TRUNC(''day'', sf.created_at)
        ORDER BY usage_count DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ctr_metrics(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    total_searches BIGINT,
    total_clicks BIGINT,
    click_through_rate DECIMAL,
    avg_click_position DECIMAL,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            COUNT(DISTINCT sq.id) as total_searches,
            COUNT(sc.id) as total_clicks,
            CASE 
                WHEN COUNT(DISTINCT sq.id) > 0 THEN 
                    (COUNT(sc.id)::DECIMAL / COUNT(DISTINCT sq.id)::DECIMAL) * 100
                ELSE 0
            END as click_through_rate,
            AVG(sc.click_position) as avg_click_position,
            DATE_TRUNC(''day'', sq.created_at)::DATE as date
        FROM search_queries sq
        LEFT JOIN search_clicks sc ON sq.id = sc.search_query_id
        WHERE 1=1 %s
        GROUP BY DATE_TRUNC(''day'', sq.created_at)
        ORDER BY date DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_trending_services(
    date_filter TEXT DEFAULT '',
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    service_category TEXT,
    search_count BIGINT,
    unique_users BIGINT,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            unnest(bp.service_categories) as service_category,
            COUNT(*) as search_count,
            COUNT(DISTINCT sq.user_id) as unique_users,
            DATE_TRUNC(''day'', sq.created_at)::DATE as date
        FROM search_queries sq
        JOIN users u ON sq.user_id = u.id
        JOIN business_profiles bp ON u.id = bp.user_id
        WHERE 1=1 %s
        GROUP BY unnest(bp.service_categories), DATE_TRUNC(''day'', sq.created_at)
        ORDER BY search_count DESC
        LIMIT %s
    ', date_filter, limit_count);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_behavior_metrics(
    date_filter TEXT DEFAULT '',
    user_segment_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    avg_session_duration DECIMAL,
    avg_queries_per_session DECIMAL,
    avg_clicks_per_session DECIMAL,
    bounce_rate DECIMAL,
    return_visitor_rate DECIMAL,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            AVG(ss.session_duration) as avg_session_duration,
            AVG(ss.total_queries) as avg_queries_per_session,
            AVG(ss.total_clicks) as avg_clicks_per_session,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(*) FILTER (WHERE ss.total_clicks = 0)::DECIMAL / COUNT(*)::DECIMAL) * 100
                ELSE 0
            END as bounce_rate,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(*) FILTER (WHERE ss.total_queries > 1)::DECIMAL / COUNT(*)::DECIMAL) * 100
                ELSE 0
            END as return_visitor_rate,
            DATE_TRUNC(''day'', ss.session_start)::DATE as date
        FROM search_sessions ss
        WHERE 1=1 %s
        GROUP BY DATE_TRUNC(''day'', ss.session_start)
        ORDER BY date DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_journeys(
    date_filter TEXT DEFAULT '',
    user_segment_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    user_id UUID,
    session_count BIGINT,
    total_queries BIGINT,
    total_clicks BIGINT,
    avg_session_duration DECIMAL,
    journey_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            ss.user_id,
            COUNT(*) as session_count,
            SUM(ss.total_queries) as total_queries,
            SUM(ss.total_clicks) as total_clicks,
            AVG(ss.session_duration) as avg_session_duration,
            CASE 
                WHEN AVG(ss.total_clicks) > 2 THEN ''high_engagement''
                WHEN AVG(ss.total_clicks) > 0 THEN ''medium_engagement''
                ELSE ''low_engagement''
            END as journey_type
        FROM search_sessions ss
        WHERE 1=1 %s
        GROUP BY ss.user_id
        ORDER BY total_queries DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_engagement_metrics(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    daily_active_users BIGINT,
    weekly_active_users BIGINT,
    monthly_active_users BIGINT,
    avg_queries_per_user DECIMAL,
    avg_clicks_per_user DECIMAL,
    engagement_score DECIMAL,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            COUNT(DISTINCT sq.user_id) as daily_active_users,
            COUNT(DISTINCT sq.user_id) FILTER (WHERE sq.created_at >= NOW() - INTERVAL ''7 days'') as weekly_active_users,
            COUNT(DISTINCT sq.user_id) FILTER (WHERE sq.created_at >= NOW() - INTERVAL ''30 days'') as monthly_active_users,
            AVG(user_queries.query_count) as avg_queries_per_user,
            AVG(user_clicks.click_count) as avg_clicks_per_user,
            CASE 
                WHEN COUNT(DISTINCT sq.user_id) > 0 THEN 
                    (AVG(user_queries.query_count) + AVG(user_clicks.click_count)) / 2
                ELSE 0
            END as engagement_score,
            DATE_TRUNC(''day'', sq.created_at)::DATE as date
        FROM search_queries sq
        LEFT JOIN (
            SELECT user_id, COUNT(*) as query_count
            FROM search_queries
            GROUP BY user_id
        ) user_queries ON sq.user_id = user_queries.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as click_count
            FROM search_clicks
            GROUP BY user_id
        ) user_clicks ON sq.user_id = user_clicks.user_id
        WHERE 1=1 %s
        GROUP BY DATE_TRUNC(''day'', sq.created_at)
        ORDER BY date DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_activity(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    user_id UUID,
    activity_date DATE,
    queries_count BIGINT,
    clicks_count BIGINT,
    sessions_count BIGINT,
    activity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            sq.user_id,
            DATE_TRUNC(''day'', sq.created_at)::DATE as activity_date,
            COUNT(DISTINCT sq.id) as queries_count,
            COUNT(DISTINCT sc.id) as clicks_count,
            COUNT(DISTINCT ss.id) as sessions_count,
            (COUNT(DISTINCT sq.id) + COUNT(DISTINCT sc.id) + COUNT(DISTINCT ss.id)) as activity_score
        FROM search_queries sq
        LEFT JOIN search_clicks sc ON sq.user_id = sc.user_id AND DATE_TRUNC(''day'', sq.created_at) = DATE_TRUNC(''day'', sc.click_timestamp)
        LEFT JOIN search_sessions ss ON sq.user_id = ss.user_id AND DATE_TRUNC(''day'', sq.created_at) = DATE_TRUNC(''day'', ss.session_start)
        WHERE 1=1 %s
        GROUP BY sq.user_id, DATE_TRUNC(''day'', sq.created_at)
        ORDER BY activity_score DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_performance_alerts(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    alert_type TEXT,
    alert_message TEXT,
    metric_value DECIMAL,
    threshold_value DECIMAL,
    severity TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            CASE 
                WHEN pm.metric_name = ''response_time'' AND pm.metric_value > 2000 THEN ''slow_response''
                WHEN pm.metric_name = ''error_rate'' AND pm.metric_value > 5 THEN ''high_error_rate''
                WHEN pm.metric_name = ''throughput'' AND pm.metric_value < 10 THEN ''low_throughput''
                ELSE ''normal''
            END as alert_type,
            CASE 
                WHEN pm.metric_name = ''response_time'' AND pm.metric_value > 2000 THEN ''Search response time exceeds 2 seconds''
                WHEN pm.metric_name = ''error_rate'' AND pm.metric_value > 5 THEN ''Error rate exceeds 5%%''
                WHEN pm.metric_name = ''throughput'' AND pm.metric_value < 10 THEN ''Throughput below 10 requests/second''
                ELSE ''No issues detected''
            END as alert_message,
            pm.metric_value,
            CASE 
                WHEN pm.metric_name = ''response_time'' THEN 2000
                WHEN pm.metric_name = ''error_rate'' THEN 5
                WHEN pm.metric_name = ''throughput'' THEN 10
                ELSE 0
            END as threshold_value,
            CASE 
                WHEN pm.metric_name = ''response_time'' AND pm.metric_value > 5000 THEN ''critical''
                WHEN pm.metric_name = ''error_rate'' AND pm.metric_value > 10 THEN ''critical''
                WHEN pm.metric_name = ''response_time'' AND pm.metric_value > 2000 THEN ''warning''
                WHEN pm.metric_name = ''error_rate'' AND pm.metric_value > 5 THEN ''warning''
                ELSE ''info''
            END as severity,
            pm.recorded_at
        FROM performance_metrics pm
        WHERE 1=1 %s
        AND (
            (pm.metric_name = ''response_time'' AND pm.metric_value > 2000) OR
            (pm.metric_name = ''error_rate'' AND pm.metric_value > 5) OR
            (pm.metric_name = ''throughput'' AND pm.metric_value < 10)
        )
        ORDER BY pm.recorded_at DESC
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_scroll_optimization_recommendations(
    date_filter TEXT DEFAULT ''
)
RETURNS TABLE (
    recommendation_type TEXT,
    recommendation_message TEXT,
    current_value DECIMAL,
    target_value DECIMAL,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            CASE 
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 1000 THEN ''reduce_load_time''
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 50 THEN ''improve_scroll_depth''
                WHEN pm.metric_name = ''items_per_page'' AND pm.metric_value < 10 THEN ''increase_page_size''
                ELSE ''optimize_performance''
            END as recommendation_type,
            CASE 
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 1000 THEN ''Consider implementing virtual scrolling or pagination to reduce load time''
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 50 THEN ''Improve content relevance to increase user engagement and scroll depth''
                WHEN pm.metric_name = ''items_per_page'' AND pm.metric_value < 10 THEN ''Increase items per page to reduce API calls and improve user experience''
                ELSE ''Monitor performance metrics and optimize as needed''
            END as recommendation_message,
            pm.metric_value as current_value,
            CASE 
                WHEN pm.metric_name = ''load_time'' THEN 500
                WHEN pm.metric_name = ''scroll_depth'' THEN 75
                WHEN pm.metric_name = ''items_per_page'' THEN 20
                ELSE pm.metric_value
            END as target_value,
            CASE 
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 2000 THEN ''high''
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 25 THEN ''high''
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 1000 THEN ''medium''
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 50 THEN ''medium''
                ELSE ''low''
            END as priority
        FROM performance_metrics pm
        WHERE pm.metric_type = ''infinite_scroll''
        AND 1=1 %s
        ORDER BY 
            CASE 
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 2000 THEN 1
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 25 THEN 2
                WHEN pm.metric_name = ''load_time'' AND pm.metric_value > 1000 THEN 3
                WHEN pm.metric_name = ''scroll_depth'' AND pm.metric_value < 50 THEN 4
                ELSE 5
            END
    ', date_filter);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION get_search_query_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_filter_usage_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION get_ctr_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_services TO authenticated;
GRANT EXECUTE ON FUNCTION get_behavior_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journeys TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION get_scroll_optimization_recommendations TO authenticated;
