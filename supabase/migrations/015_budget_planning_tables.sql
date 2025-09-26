-- Budget Planning Tables Migration
-- Create budget_recommendations table
CREATE TABLE budget_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    service_category TEXT NOT NULL,
    recommended_amount DECIMAL(10,2) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    pricing_source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_data table
CREATE TABLE pricing_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    location JSONB,
    price_min DECIMAL(10,2) NOT NULL,
    price_max DECIMAL(10,2) NOT NULL,
    price_average DECIMAL(10,2) NOT NULL,
    seasonal_multiplier DECIMAL(3,2) DEFAULT 1.0,
    location_multiplier DECIMAL(3,2) DEFAULT 1.0,
    data_source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_tracking table
CREATE TABLE budget_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL,
    actual_cost DECIMAL(10,2),
    variance DECIMAL(10,2),
    tracking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package_deals table
CREATE TABLE package_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    service_categories TEXT[] NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    savings DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applied_packages table
CREATE TABLE applied_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    package_id UUID REFERENCES package_deals(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, package_id)
);

-- Create service_budget_breakdown table
CREATE TABLE service_budget_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL,
    adjustment_reason TEXT,
    package_applied BOOLEAN DEFAULT FALSE,
    package_id UUID REFERENCES package_deals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_feedback table for recommendation feedback
CREATE TABLE budget_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID REFERENCES budget_recommendations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'accurate', 'inaccurate')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_budget_recommendations_event_type ON budget_recommendations(event_type);
CREATE INDEX idx_budget_recommendations_service_category ON budget_recommendations(service_category);
CREATE INDEX idx_pricing_data_service_type ON pricing_data(service_type);
CREATE INDEX idx_budget_tracking_event_id ON budget_tracking(event_id);
CREATE INDEX idx_package_deals_event_type ON package_deals(event_type);
CREATE INDEX idx_package_deals_is_active ON package_deals(is_active);
CREATE INDEX idx_applied_packages_event_id ON applied_packages(event_id);
CREATE INDEX idx_budget_feedback_recommendation_id ON budget_feedback(recommendation_id);
CREATE INDEX idx_budget_feedback_user_id ON budget_feedback(user_id);
CREATE INDEX idx_service_budget_breakdown_event_id ON service_budget_breakdown(event_id);
CREATE INDEX idx_service_budget_breakdown_service_category ON service_budget_breakdown(service_category);

-- Enable RLS
ALTER TABLE budget_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_budget_breakdown ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view budget recommendations" ON budget_recommendations FOR SELECT USING (true);
CREATE POLICY "Anyone can view pricing data" ON pricing_data FOR SELECT USING (true);
CREATE POLICY "Users can view their own budget tracking" ON budget_tracking FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = budget_tracking.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own budget tracking" ON budget_tracking FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = budget_tracking.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Anyone can view active package deals" ON package_deals FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view applied packages for their events" ON applied_packages FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = applied_packages.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Users can apply packages to their events" ON applied_packages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = applied_packages.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Users can view their own feedback" ON budget_feedback FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create feedback" ON budget_feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage service breakdown for their events" ON service_budget_breakdown FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = service_budget_breakdown.event_id AND events.user_id = auth.uid())
);

-- Insert sample budget recommendations data
INSERT INTO budget_recommendations (event_type, service_category, recommended_amount, confidence_score, pricing_source) VALUES
-- Wedding recommendations
('wedding', 'catering', 5000.00, 0.85, 'industry_average'),
('wedding', 'venue', 4000.00, 0.90, 'industry_average'),
('wedding', 'photography', 3000.00, 0.80, 'industry_average'),
('wedding', 'music', 2000.00, 0.75, 'industry_average'),
('wedding', 'decorations', 1500.00, 0.70, 'industry_average'),
('wedding', 'flowers', 1200.00, 0.75, 'industry_average'),
('wedding', 'transportation', 800.00, 0.65, 'industry_average'),

-- Corporate event recommendations
('corporate', 'venue', 8000.00, 0.90, 'industry_average'),
('corporate', 'catering', 4000.00, 0.85, 'industry_average'),
('corporate', 'av_equipment', 2000.00, 0.80, 'industry_average'),
('corporate', 'transportation', 1500.00, 0.70, 'industry_average'),
('corporate', 'speakers', 3000.00, 0.75, 'industry_average'),

-- Birthday party recommendations
('party', 'catering', 800.00, 0.80, 'industry_average'),
('party', 'entertainment', 500.00, 0.75, 'industry_average'),
('party', 'decorations', 300.00, 0.70, 'industry_average'),
('party', 'cake', 200.00, 0.85, 'industry_average'),
('party', 'venue', 400.00, 0.75, 'industry_average');

-- Insert sample pricing data
INSERT INTO pricing_data (service_type, location, price_min, price_max, price_average, seasonal_multiplier, location_multiplier, data_source) VALUES
('catering', '{"region": "Auckland"}', 50.00, 150.00, 85.00, 1.2, 1.1, 'contractor_data'),
('catering', '{"region": "Wellington"}', 45.00, 140.00, 80.00, 1.1, 1.0, 'contractor_data'),
('catering', '{"region": "Christchurch"}', 40.00, 130.00, 75.00, 1.0, 0.9, 'contractor_data'),
('venue', '{"region": "Auckland"}', 2000.00, 8000.00, 4000.00, 1.3, 1.2, 'venue_data'),
('venue', '{"region": "Wellington"}', 1500.00, 6000.00, 3500.00, 1.2, 1.0, 'venue_data'),
('venue', '{"region": "Christchurch"}', 1200.00, 5000.00, 3000.00, 1.1, 0.9, 'venue_data'),
('photography', '{"region": "Auckland"}', 1500.00, 5000.00, 3000.00, 1.1, 1.1, 'contractor_data'),
('photography', '{"region": "Wellington"}', 1200.00, 4000.00, 2500.00, 1.0, 1.0, 'contractor_data'),
('photography', '{"region": "Christchurch"}', 1000.00, 3500.00, 2200.00, 0.9, 0.9, 'contractor_data'),
('music', '{"region": "Auckland"}', 800.00, 3000.00, 1800.00, 1.2, 1.1, 'contractor_data'),
('music', '{"region": "Wellington"}', 700.00, 2500.00, 1500.00, 1.1, 1.0, 'contractor_data'),
('music', '{"region": "Christchurch"}', 600.00, 2000.00, 1300.00, 1.0, 0.9, 'contractor_data');

-- Insert sample package deals
INSERT INTO package_deals (name, description, event_type, service_categories, base_price, discount_percentage, final_price, savings) VALUES
('Wedding Essentials Package', 'Complete wedding package with catering, venue, and photography', 'wedding', ARRAY['catering', 'venue', 'photography'], 12000.00, 15.00, 10200.00, 1800.00),
('Corporate Conference Package', 'Full conference package with venue, catering, and AV equipment', 'corporate', ARRAY['venue', 'catering', 'av_equipment'], 14000.00, 20.00, 11200.00, 2800.00),
('Birthday Party Package', 'Complete birthday party with catering, entertainment, and decorations', 'party', ARRAY['catering', 'entertainment', 'decorations'], 1500.00, 10.00, 1350.00, 150.00),
('Premium Wedding Package', 'Luxury wedding package with all services', 'wedding', ARRAY['catering', 'venue', 'photography', 'music', 'decorations', 'flowers'], 20000.00, 25.00, 15000.00, 5000.00);
