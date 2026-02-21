-- Add system message support to enquiry_messages
-- Allows automated messages (e.g., team member added notifications) alongside user messages

-- Add is_system column
ALTER TABLE public.enquiry_messages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Add metadata JSONB column for actionable system messages (e.g., event invitations)
ALTER TABLE public.enquiry_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Drop ALL existing CHECK constraints on response_type (handles any auto-generated name)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.enquiry_messages'::regclass
      AND con.contype = 'c'
      AND att.attname = 'response_type'
  LOOP
    EXECUTE format('ALTER TABLE public.enquiry_messages DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Recreate with 'system' included
ALTER TABLE public.enquiry_messages
ADD CONSTRAINT enquiry_messages_response_type_check
CHECK (response_type IN ('reply', 'quote', 'decline', 'follow_up', 'clarification', 'system'));
