-- Migration: Create event_team_members table
-- This table links team members to specific events

CREATE TABLE IF NOT EXISTS public.event_team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_event_team_member UNIQUE (event_id, team_member_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_team_members_event ON public.event_team_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_team_members_team_member ON public.event_team_members(team_member_id);

-- Create updated_at trigger (reuse the function from team_members migration)
CREATE TRIGGER event_team_members_updated_at_trigger
  BEFORE UPDATE ON public.event_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.event_team_members IS 'Links team members to specific events';
COMMENT ON COLUMN public.event_team_members.event_id IS 'The event this team member is assigned to';
COMMENT ON COLUMN public.event_team_members.team_member_id IS 'The team member assigned to this event';

