-- Add event management tables for status tracking, milestones, and feedback

-- Create event_milestones table
CREATE TABLE IF NOT EXISTS event_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status milestone_status DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestone_status enum
DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create event_feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS event_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  previous_status event_status,
  new_status event_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_milestones_event_id ON event_milestones(event_id);
CREATE INDEX IF NOT EXISTS idx_event_milestones_status ON event_milestones(status);
CREATE INDEX IF NOT EXISTS idx_event_milestones_date ON event_milestones(milestone_date);

CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_contractor_id ON event_feedback(contractor_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_rating ON event_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_event_status_history_event_id ON event_status_history(event_id);
CREATE INDEX IF NOT EXISTS idx_event_status_history_new_status ON event_status_history(new_status);
CREATE INDEX IF NOT EXISTS idx_event_status_history_created_at ON event_status_history(created_at);

-- Add RLS policies
ALTER TABLE event_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_status_history ENABLE ROW LEVEL SECURITY;

-- Event milestones policies
CREATE POLICY "Event managers can view their event milestones" ON event_milestones
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    )
  );

CREATE POLICY "Event managers can manage their event milestones" ON event_milestones
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    )
  );

-- Event feedback policies
CREATE POLICY "Users can view feedback for their events" ON event_feedback
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    ) OR contractor_id = auth.uid()
  );

CREATE POLICY "Contractors can create feedback for events they participated in" ON event_feedback
  FOR INSERT WITH CHECK (
    contractor_id = auth.uid() AND
    event_id IN (
      SELECT id FROM events WHERE event_manager_id != auth.uid()
    )
  );

-- Event status history policies
CREATE POLICY "Event managers can view their event status history" ON event_status_history
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    )
  );

CREATE POLICY "Event managers can create status history records" ON event_status_history
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE event_manager_id = auth.uid()
    ) AND changed_by = auth.uid()
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_milestones_updated_at
  BEFORE UPDATE ON event_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

