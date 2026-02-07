-- Migration: Create event_contractors table
-- This table links contractors to specific events (manual assignments, not algorithmic matches)

-- Create enum for event contractor status
DO $$ BEGIN
  CREATE TYPE event_contractor_status AS ENUM ('invited', 'confirmed', 'declined', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.event_contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status event_contractor_status DEFAULT 'invited' NOT NULL,
  role TEXT, -- e.g., "DJ", "Photographer", "Caterer"
  notes TEXT,
  added_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_event_contractor UNIQUE (event_id, contractor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_contractors_event ON public.event_contractors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contractors_contractor ON public.event_contractors(contractor_id);
CREATE INDEX IF NOT EXISTS idx_event_contractors_status ON public.event_contractors(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_event_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS event_contractors_updated_at_trigger ON public.event_contractors;
CREATE TRIGGER event_contractors_updated_at_trigger
  BEFORE UPDATE ON public.event_contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_event_contractors_updated_at();

-- Enable RLS
ALTER TABLE public.event_contractors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Event owners can manage their event's contractors
CREATE POLICY "Event owners can view their event contractors"
  ON public.event_contractors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_contractors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can insert event contractors"
  ON public.event_contractors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_contractors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can update event contractors"
  ON public.event_contractors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_contractors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can delete event contractors"
  ON public.event_contractors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_contractors.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Contractors can view events they're assigned to
CREATE POLICY "Contractors can view their assignments"
  ON public.event_contractors FOR SELECT
  USING (contractor_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE public.event_contractors IS 'Links contractors to specific events (manual assignments)';
COMMENT ON COLUMN public.event_contractors.event_id IS 'The event this contractor is assigned to';
COMMENT ON COLUMN public.event_contractors.contractor_id IS 'The contractor assigned to this event';
COMMENT ON COLUMN public.event_contractors.status IS 'Assignment status: invited, confirmed, declined, cancelled';
COMMENT ON COLUMN public.event_contractors.role IS 'The contractor role for this event (e.g., DJ, Photographer)';
COMMENT ON COLUMN public.event_contractors.notes IS 'Optional notes about this assignment';
COMMENT ON COLUMN public.event_contractors.added_by IS 'User who added this contractor to the event';
