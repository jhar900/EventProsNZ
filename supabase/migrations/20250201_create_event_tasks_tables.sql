-- Migration: Create event_tasks table and related junction tables
-- This table stores tasks for events with assignments to team members and contractors

-- Create task_status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create task_priority enum
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create event_tasks table
CREATE TABLE IF NOT EXISTS public.event_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status task_status DEFAULT 'todo' NOT NULL,
  priority task_priority DEFAULT 'medium' NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_completed_date CHECK (
    (status = 'completed' AND completed_date IS NOT NULL) OR
    (status != 'completed' AND completed_date IS NULL) OR
    completed_date IS NULL
  )
);

-- Create junction table for task assignments to team members
CREATE TABLE IF NOT EXISTS public.event_tasks_team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.event_tasks(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_task_team_member UNIQUE (task_id, team_member_id)
);

-- Create junction table for task assignments to contractors
-- Using business_profiles since contractors are identified by their business profile
CREATE TABLE IF NOT EXISTS public.event_tasks_contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.event_tasks(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_task_contractor UNIQUE (task_id, contractor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON public.event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_status ON public.event_tasks(status);
CREATE INDEX IF NOT EXISTS idx_event_tasks_priority ON public.event_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_event_tasks_due_date ON public.event_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_event_tasks_created_by ON public.event_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_event_tasks_created_at ON public.event_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_event_tasks_team_members_task ON public.event_tasks_team_members(task_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_team_members_team_member ON public.event_tasks_team_members(team_member_id);

CREATE INDEX IF NOT EXISTS idx_event_tasks_contractors_task ON public.event_tasks_contractors(task_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_contractors_contractor ON public.event_tasks_contractors(contractor_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_event_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER event_tasks_updated_at_trigger
  BEFORE UPDATE ON public.event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_event_tasks_updated_at();

-- Auto-set completed_date when status changes to 'completed'
CREATE OR REPLACE FUNCTION set_task_completed_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_date = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_date = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting completed_date
CREATE TRIGGER event_tasks_completed_date_trigger
  BEFORE INSERT OR UPDATE ON public.event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_completed_date();

-- Enable RLS
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks_contractors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_tasks
-- Event managers can view tasks for their events
CREATE POLICY "Event managers can view their event tasks" ON public.event_tasks
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event managers can create tasks for their events
CREATE POLICY "Event managers can create tasks for their events" ON public.event_tasks
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    ) AND
    created_by = auth.uid()
  );

-- Event managers can update tasks for their events
CREATE POLICY "Event managers can update their event tasks" ON public.event_tasks
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Event managers can delete tasks for their events
CREATE POLICY "Event managers can delete their event tasks" ON public.event_tasks
  FOR DELETE USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for event_tasks_team_members
CREATE POLICY "Event managers can view task team member assignments" ON public.event_tasks_team_members
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.event_tasks 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event managers can manage task team member assignments" ON public.event_tasks_team_members
  FOR ALL USING (
    task_id IN (
      SELECT id FROM public.event_tasks 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for event_tasks_contractors
CREATE POLICY "Event managers can view task contractor assignments" ON public.event_tasks_contractors
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.event_tasks 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event managers can manage task contractor assignments" ON public.event_tasks_contractors
  FOR ALL USING (
    task_id IN (
      SELECT id FROM public.event_tasks 
      WHERE event_id IN (
        SELECT id FROM public.events WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.event_tasks IS 'Tasks associated with events';
COMMENT ON COLUMN public.event_tasks.event_id IS 'The event this task belongs to';
COMMENT ON COLUMN public.event_tasks.title IS 'Task title/name';
COMMENT ON COLUMN public.event_tasks.description IS 'Optional detailed description of the task';
COMMENT ON COLUMN public.event_tasks.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN public.event_tasks.status IS 'Current status of the task';
COMMENT ON COLUMN public.event_tasks.priority IS 'Priority level of the task';
COMMENT ON COLUMN public.event_tasks.completed_date IS 'Date when the task was marked as completed';
COMMENT ON COLUMN public.event_tasks.created_by IS 'User who created the task';
COMMENT ON TABLE public.event_tasks_team_members IS 'Junction table linking tasks to assigned team members';
COMMENT ON TABLE public.event_tasks_contractors IS 'Junction table linking tasks to assigned contractors';

