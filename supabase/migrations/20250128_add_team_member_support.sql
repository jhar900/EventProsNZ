-- Migration: Add team member support
-- This migration creates tables for team member relationships
-- Team membership is treated as a relationship, not a user role
-- Team members keep their primary role (event_manager/contractor) in users.role

-- 1. Create team member status enum (for the relationship status)
CREATE TYPE team_member_status AS ENUM ('invited', 'onboarding', 'active', 'inactive', 'removed');

-- 2. Create team_members relationship table
-- This links event managers to their team members
-- Note: team members keep their primary role (event_manager/contractor) in users.role
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- The team member's role (e.g., "Event Coordinator", "Assistant", "Manager")
  status team_member_status DEFAULT 'invited',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_team_member_per_manager UNIQUE (event_manager_id, team_member_id),
  CONSTRAINT team_member_cannot_be_own_manager CHECK (event_manager_id != team_member_id)
);

-- 3. Create indexes for performance
CREATE INDEX idx_team_members_event_manager ON public.team_members(event_manager_id);
CREATE INDEX idx_team_members_team_member ON public.team_members(team_member_id);
CREATE INDEX idx_team_members_status ON public.team_members(status);
CREATE INDEX idx_team_members_role ON public.team_members(role);

-- 4. Create function to prevent admins from being team members
CREATE OR REPLACE FUNCTION prevent_admin_as_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the team member is an admin
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.team_member_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admins cannot be team members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create updated_at trigger for team_members
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Create trigger to prevent admins from being team members
CREATE TRIGGER prevent_admin_team_member
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_as_team_member();

-- 6. Create team_member_invitations table for pending invites
-- This stores invitations before the user accepts and creates an account
CREATE TABLE public.team_member_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- The team member's role (e.g., "Event Coordinator")
  invite_token TEXT UNIQUE NOT NULL,
  status team_member_status DEFAULT 'invited',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for team_member_invitations
CREATE INDEX idx_team_member_invitations_token ON public.team_member_invitations(invite_token);
CREATE INDEX idx_team_member_invitations_email ON public.team_member_invitations(email);
CREATE INDEX idx_team_member_invitations_event_manager ON public.team_member_invitations(event_manager_id);
CREATE INDEX idx_team_member_invitations_status ON public.team_member_invitations(status);

-- 8. Create updated_at trigger for team_member_invitations
CREATE TRIGGER team_member_invitations_updated_at
  BEFORE UPDATE ON public.team_member_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- 9. Add comments for documentation
COMMENT ON TABLE public.team_members IS 'Relationship table linking event managers to their team members. Team members keep their primary role (event_manager/contractor) in users.role';
COMMENT ON COLUMN public.team_members.role IS 'The team member''s role within the team (e.g., "Event Coordinator", "Assistant") - different from users.role';
COMMENT ON COLUMN public.team_members.status IS 'Current status of the team member relationship';
COMMENT ON TABLE public.team_member_invitations IS 'Stores pending team member invitations before user accepts and creates account';

