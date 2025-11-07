-- Add response_type column to enquiry_messages table
-- This allows us to categorize responses (reply, quote, decline, follow_up, clarification)

-- Add response_type column with default value
ALTER TABLE public.enquiry_messages 
ADD COLUMN IF NOT EXISTS response_type TEXT DEFAULT 'reply' CHECK (response_type IN ('reply', 'quote', 'decline', 'follow_up', 'clarification'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_enquiry_messages_response_type ON public.enquiry_messages(response_type);

-- Add comment
COMMENT ON COLUMN public.enquiry_messages.response_type IS 'Type of response: reply, quote, decline, follow_up, or clarification';

