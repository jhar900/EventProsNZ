-- Advanced Search and Filtering Tables
-- Story 3.2: Advanced Search & Filtering

-- Create SearchHistory table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SavedSearch table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ContractorFavorite table
CREATE TABLE IF NOT EXISTS contractor_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user-contractor pairs
    UNIQUE(user_id, contractor_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_search_query ON search_history USING gin(to_tsvector('english', search_query));

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_name ON saved_searches(name);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at);

CREATE INDEX IF NOT EXISTS idx_contractor_favorites_user_id ON contractor_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_favorites_contractor_id ON contractor_favorites(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_favorites_created_at ON contractor_favorites(created_at);

-- Create full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_search ON business_profiles USING gin(
    to_tsvector('english', 
        COALESCE(company_name, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(array_to_string(service_categories, ' '), '')
    )
);

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(bio, '')
    )
);

CREATE INDEX IF NOT EXISTS idx_services_search ON services USING gin(
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(category, '')
    )
);

-- Enable RLS on new tables
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for saved_searches
CREATE POLICY "Users can view their own saved searches" ON saved_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" ON saved_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" ON saved_searches
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for contractor_favorites
CREATE POLICY "Users can view their own favorites" ON contractor_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON contractor_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON contractor_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to clean up old search history (keep last 100 searches per user)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep only the last 100 search history entries per user
    DELETE FROM search_history 
    WHERE user_id = NEW.user_id 
    AND id NOT IN (
        SELECT id 
        FROM search_history 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 100
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up old search history
DROP TRIGGER IF EXISTS trigger_cleanup_search_history ON search_history;
CREATE TRIGGER trigger_cleanup_search_history
    AFTER INSERT ON search_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_search_history();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for saved_searches updated_at
DROP TRIGGER IF EXISTS trigger_update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER trigger_update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for search analytics
CREATE OR REPLACE VIEW search_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(result_count) as avg_results_per_search,
    COUNT(*) FILTER (WHERE result_count = 0) as zero_result_searches,
    COUNT(*) FILTER (WHERE result_count > 0) as successful_searches
FROM search_history
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant permissions for the analytics view
GRANT SELECT ON search_analytics TO authenticated;

-- Create function for full-text search across contractors
CREATE OR REPLACE FUNCTION search_contractors(
    search_query TEXT DEFAULT '',
    service_types TEXT[] DEFAULT NULL,
    location_filter TEXT DEFAULT '',
    radius_km INTEGER DEFAULT NULL,
    regions TEXT[] DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    rating_min DECIMAL DEFAULT NULL,
    response_time_filter TEXT DEFAULT NULL,
    has_portfolio BOOLEAN DEFAULT NULL,
    sort_by TEXT DEFAULT 'relevance',
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
    contractor_id UUID,
    company_name TEXT,
    description TEXT,
    location TEXT,
    service_categories TEXT[],
    average_rating DECIMAL,
    review_count INTEGER,
    is_verified BOOLEAN,
    subscription_tier TEXT,
    price_range_min DECIMAL,
    price_range_max DECIMAL,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as contractor_id,
        bp.company_name,
        bp.description,
        COALESCE(bp.location, p.location) as location,
        bp.service_categories,
        bp.average_rating,
        bp.review_count,
        bp.is_verified,
        bp.subscription_tier::TEXT,
        MIN(s.price_range_min) as price_range_min,
        MAX(s.price_range_max) as price_range_max,
        CASE 
            WHEN search_query = '' THEN 1.0
            ELSE ts_rank(
                to_tsvector('english', 
                    COALESCE(bp.company_name, '') || ' ' || 
                    COALESCE(bp.description, '') || ' ' || 
                    COALESCE(p.first_name, '') || ' ' || 
                    COALESCE(p.last_name, '') || ' ' || 
                    COALESCE(array_to_string(bp.service_categories, ' '), '')
                ),
                plainto_tsquery('english', search_query)
            )
        END as relevance_score
    FROM users u
    INNER JOIN profiles p ON u.id = p.user_id
    INNER JOIN business_profiles bp ON u.id = bp.user_id
    LEFT JOIN services s ON bp.id = s.business_profile_id
    WHERE u.role = 'contractor'
    AND u.is_verified = true
    AND (search_query = '' OR to_tsvector('english', 
        COALESCE(bp.company_name, '') || ' ' || 
        COALESCE(bp.description, '') || ' ' || 
        COALESCE(p.first_name, '') || ' ' || 
        COALESCE(p.last_name, '') || ' ' || 
        COALESCE(array_to_string(bp.service_categories, ' '), '')
    ) @@ plainto_tsquery('english', search_query))
    AND (service_types IS NULL OR bp.service_categories && service_types)
    AND (location_filter = '' OR 
         COALESCE(bp.location, p.location) ILIKE '%' || location_filter || '%' OR
         bp.service_areas && ARRAY[location_filter])
    AND (rating_min IS NULL OR bp.average_rating >= rating_min)
    AND (price_min IS NULL OR s.price_range_min >= price_min)
    AND (price_max IS NULL OR s.price_range_max <= price_max)
    GROUP BY u.id, bp.company_name, bp.description, bp.location, p.location, 
             bp.service_categories, bp.average_rating, bp.review_count, 
             bp.is_verified, bp.subscription_tier, search_query
    ORDER BY 
        CASE sort_by
            WHEN 'rating' THEN bp.average_rating
            WHEN 'price_low' THEN MIN(s.price_range_min)
            WHEN 'price_high' THEN MAX(s.price_range_max)
            WHEN 'newest' THEN u.created_at
            ELSE relevance_score
        END DESC,
        bp.review_count DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_contractors TO authenticated;
