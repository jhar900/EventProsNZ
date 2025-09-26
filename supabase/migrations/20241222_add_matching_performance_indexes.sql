-- Add performance indexes for contractor matching optimization
-- This migration adds composite indexes to improve query performance for large datasets

-- Index for contractor matching queries
CREATE INDEX IF NOT EXISTS idx_contractors_matching 
ON users(role, is_verified) 
INCLUDE (id);

-- Index for contractor performance scoring
CREATE INDEX IF NOT EXISTS idx_contractor_performance_score 
ON contractor_performance(contractor_id, overall_performance_score);

-- Index for contractor availability queries
CREATE INDEX IF NOT EXISTS idx_contractor_availability_date 
ON contractor_availability(contractor_id, event_date, is_available);

-- Index for business profile service areas
CREATE INDEX IF NOT EXISTS idx_business_profiles_service_areas 
ON business_profiles USING GIN(service_areas);

-- Index for business profile subscription tier
CREATE INDEX IF NOT EXISTS idx_business_profiles_subscription 
ON business_profiles(subscription_tier, is_verified);

-- Index for services pricing range
CREATE INDEX IF NOT EXISTS idx_services_pricing 
ON services(user_id, price_range_min, price_range_max) 
WHERE is_visible = true;

-- Index for matching analytics queries
CREATE INDEX IF NOT EXISTS idx_matching_analytics_event 
ON matching_analytics(event_id, created_at);

-- Index for contractor matches queries
CREATE INDEX IF NOT EXISTS idx_contractor_matches_event 
ON contractor_matches(event_id, overall_score DESC);

-- Index for contractor matches contractor
CREATE INDEX IF NOT EXISTS idx_contractor_matches_contractor 
ON contractor_matches(contractor_id, created_at);

-- Add comments for documentation
COMMENT ON INDEX idx_contractors_matching IS 'Optimizes contractor queries with role and verification filters';
COMMENT ON INDEX idx_contractor_performance_score IS 'Optimizes performance score lookups for matching';
COMMENT ON INDEX idx_contractor_availability_date IS 'Optimizes availability checks by contractor and date';
COMMENT ON INDEX idx_business_profiles_service_areas IS 'Optimizes service area matching using GIN index';
COMMENT ON INDEX idx_business_profiles_subscription IS 'Optimizes premium contractor filtering';
COMMENT ON INDEX idx_services_pricing IS 'Optimizes pricing compatibility calculations';
COMMENT ON INDEX idx_matching_analytics_event IS 'Optimizes analytics queries by event';
COMMENT ON INDEX idx_contractor_matches_event IS 'Optimizes match retrieval by event and score';
COMMENT ON INDEX idx_contractor_matches_contractor IS 'Optimizes contractor match history queries';
