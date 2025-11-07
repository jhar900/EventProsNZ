-- Add sender_id column to enquiries table
-- This allows us to track who sent the enquiry, especially important for contractor-to-contractor enquiries

-- Add sender_id column
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_enquiries_sender_id ON public.enquiries(sender_id);

-- Add comment
COMMENT ON COLUMN public.enquiries.sender_id IS 'ID of the user who sent the enquiry (event manager or contractor)';

-- Backfill existing enquiries by trying to get sender from enquiry_messages
-- For enquiries with messages, set sender_id from the first message
UPDATE public.enquiries e
SET sender_id = (
  SELECT sender_id 
  FROM public.enquiry_messages em
  WHERE em.enquiry_id = e.id
  ORDER BY em.created_at ASC
  LIMIT 1
)
WHERE e.sender_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM public.enquiry_messages em
  WHERE em.enquiry_id = e.id
);

-- For enquiries with events but no messages, set sender_id from event.user_id
-- The events table uses user_id to reference the event manager (not event_manager_id)
UPDATE public.enquiries e
SET sender_id = (
  SELECT user_id
  FROM public.events ev
  WHERE ev.id = e.event_id
)
WHERE e.sender_id IS NULL
AND e.event_id IS NOT NULL
AND EXISTS (
  SELECT 1
  FROM public.events ev
  WHERE ev.id = e.event_id
  AND ev.user_id IS NOT NULL
);

