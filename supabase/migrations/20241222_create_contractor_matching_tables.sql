-- Create contractor matching tables for intelligent contractor matching system

-- ContractorMatch table for storing matching results
CREATE TABLE IF NOT EXISTS contractor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2) NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  availability_score DECIMAL(3,2) NOT NULL CHECK (availability_score >= 0 AND availability_score <= 1),
  budget_score DECIMAL(3,2) NOT NULL CHECK (budget_score >= 0 AND budget_score <= 1),
  location_score DECIMAL(3,2) NOT NULL CHECK (location_score >= 0 AND location_score <= 1),
  performance_score DECIMAL(3,2) NOT NULL CHECK (performance_score >= 0 AND performance_score <= 1),
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  is_premium BOOLEAN DEFAULT FALSE,
  match_algorithm TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, contractor_id)
);

-- MatchingAnalytics table for storing matching analytics
CREATE TABLE IF NOT EXISTS matching_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  matching_algorithm TEXT NOT NULL,
  total_contractors INTEGER NOT NULL,
  matching_contractors INTEGER NOT NULL,
  premium_contractors INTEGER NOT NULL,
  average_score DECIMAL(3,2) NOT NULL,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ContractorAvailability table for tracking availability
CREATE TABLE IF NOT EXISTS contractor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id, event_date, start_time)
);

-- ContractorPerformance table for tracking performance metrics
CREATE TABLE IF NOT EXISTS contractor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_time_hours DECIMAL(5,2),
  reliability_score DECIMAL(3,2) CHECK (reliability_score >= 0 AND reliability_score <= 1),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 1),
  overall_performance_score DECIMAL(3,2) CHECK (overall_performance_score >= 0 AND overall_performance_score <= 1),
  total_projects INTEGER DEFAULT 0,
  successful_projects INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_matches_event_id ON contractor_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_contractor_matches_contractor_id ON contractor_matches(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_matches_overall_score ON contractor_matches(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_matches_is_premium ON contractor_matches(is_premium);
CREATE INDEX IF NOT EXISTS idx_matching_analytics_event_id ON matching_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_contractor_availability_contractor_id ON contractor_availability(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_availability_event_date ON contractor_availability(event_date);
CREATE INDEX IF NOT EXISTS idx_contractor_performance_contractor_id ON contractor_performance(contractor_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contractor_matches_updated_at 
  BEFORE UPDATE ON contractor_matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_availability_updated_at 
  BEFORE UPDATE ON contractor_availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_performance_updated_at 
  BEFORE UPDATE ON contractor_performance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE contractor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_performance ENABLE ROW LEVEL SECURITY;

-- Contractor matches policies
CREATE POLICY "Users can view contractor matches for their events" ON contractor_matches
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can view contractor matches for their contractor profile" ON contractor_matches
  FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "System can insert contractor matches" ON contractor_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update contractor matches" ON contractor_matches
  FOR UPDATE USING (true);

-- Matching analytics policies
CREATE POLICY "Users can view matching analytics for their events" ON matching_analytics
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    )
  );

CREATE POLICY "System can insert matching analytics" ON matching_analytics
  FOR INSERT WITH CHECK (true);

-- Contractor availability policies
CREATE POLICY "Contractors can manage their availability" ON contractor_availability
  FOR ALL USING (contractor_id = auth.uid());

CREATE POLICY "Event managers can view contractor availability" ON contractor_availability
  FOR SELECT USING (true);

-- Contractor performance policies
CREATE POLICY "Contractors can view their performance" ON contractor_performance
  FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "System can manage contractor performance" ON contractor_performance
  FOR ALL USING (true);
