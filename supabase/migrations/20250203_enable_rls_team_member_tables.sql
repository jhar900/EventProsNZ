-- Migration: Enable RLS on team member tables
-- Fixes security vulnerability where RLS was not enabled
-- Addresses Supabase security warnings for:
--   - public.team_members
--   - public.team_member_invitations
--   - public.event_team_members

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_member_invitations table
ALTER TABLE public.team_member_invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on event_team_members table
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
-- Event managers can view their team members
CREATE POLICY "Event managers can view their team members" ON public.team_members
  FOR SELECT USING (event_manager_id = auth.uid());

-- Team members can view their own team member records
CREATE POLICY "Team members can view their own records" ON public.team_members
  FOR SELECT USING (team_member_id = auth.uid());

-- Event managers can create team member relationships
CREATE POLICY "Event managers can create team members" ON public.team_members
  FOR INSERT WITH CHECK (event_manager_id = auth.uid());

-- Event managers can update their team members
CREATE POLICY "Event managers can update their team members" ON public.team_members
  FOR UPDATE USING (event_manager_id = auth.uid());

-- Event managers can delete their team members
CREATE POLICY "Event managers can delete their team members" ON public.team_members
  FOR DELETE USING (event_manager_id = auth.uid());

-- RLS Policies for team_member_invitations
-- Event managers can view their invitations
CREATE POLICY "Event managers can view their invitations" ON public.team_member_invitations
  FOR SELECT USING (event_manager_id = auth.uid());

-- Event managers can create invitations
CREATE POLICY "Event managers can create invitations" ON public.team_member_invitations
  FOR INSERT WITH CHECK (event_manager_id = auth.uid());

-- Event managers can update their invitations
CREATE POLICY "Event managers can update their invitations" ON public.team_member_invitations
  FOR UPDATE USING (event_manager_id = auth.uid());

-- Event managers can delete their invitations
CREATE POLICY "Event managers can delete their invitations" ON public.team_member_invitations
  FOR DELETE USING (event_manager_id = auth.uid());

-- RLS Policies for event_team_members
-- Event managers can view team member assignments for their events
CREATE POLICY "Event managers can view event team member assignments" ON public.event_team_members
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Team members can view their own event assignments
CREATE POLICY "Team members can view their event assignments" ON public.event_team_members
  FOR SELECT USING (
    team_member_id IN (
      SELECT id FROM public.team_members WHERE team_member_id = auth.uid()
    )
  );

-- Event managers can create event team member assignments
CREATE POLICY "Event managers can create event team member assignments" ON public.event_team_members
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event managers can update event team member assignments
CREATE POLICY "Event managers can update event team member assignments" ON public.event_team_members
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event managers can delete event team member assignments
CREATE POLICY "Event managers can delete event team member assignments" ON public.event_team_members
  FOR DELETE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

