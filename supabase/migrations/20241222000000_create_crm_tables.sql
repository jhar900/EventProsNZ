-- Create CRM tables for basic CRM functionality
-- This migration creates the necessary tables for contact management, interactions, messages, notes, reminders, and timeline

-- Create contact_type enum
CREATE TYPE contact_type AS ENUM ('contractor', 'event_manager', 'client', 'vendor', 'other');

-- Create relationship_status enum
CREATE TYPE relationship_status AS ENUM ('active', 'inactive', 'blocked', 'archived');

-- Create note_type enum
CREATE TYPE note_type AS ENUM ('general', 'meeting', 'call', 'email', 'follow_up', 'important');

-- Create reminder_type enum
CREATE TYPE reminder_type AS ENUM ('call', 'email', 'meeting', 'follow_up', 'deadline', 'other');

-- Create interaction_type enum
CREATE TYPE interaction_type AS ENUM ('inquiry', 'response', 'call', 'email', 'meeting', 'note', 'reminder', 'status_change');

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_type contact_type NOT NULL,
    relationship_status relationship_status DEFAULT 'active',
    last_interaction TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- Create contact_notes table
CREATE TABLE IF NOT EXISTS contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL CHECK (length(note_content) <= 2000),
    note_type note_type DEFAULT 'general',
    tags TEXT[],
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_reminders table
CREATE TABLE IF NOT EXISTS contact_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_message TEXT CHECK (length(reminder_message) <= 500),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_interactions table
CREATE TABLE IF NOT EXISTS contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    interaction_data JSONB,
    interaction_notes TEXT CHECK (length(interaction_notes) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_messages table for message tracking
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('inquiry', 'response', 'follow_up', 'general')),
    message_content TEXT NOT NULL CHECK (length(message_content) <= 2000),
    message_data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_status ON contacts(relationship_status);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_note_type ON contact_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_contact_notes_is_important ON contact_notes(is_important);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON contact_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_reminders_contact_id ON contact_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_reminders_user_id ON contact_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_reminders_reminder_type ON contact_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_contact_reminders_reminder_date ON contact_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_contact_reminders_is_completed ON contact_reminders(is_completed);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_user_id ON contact_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_interaction_type ON contact_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_created_at ON contact_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_contact_id ON contact_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_message_type ON contact_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_notes_updated_at 
    BEFORE UPDATE ON contact_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view their own contacts" ON contacts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own contacts" ON contacts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts" ON contacts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts" ON contacts
    FOR DELETE USING (user_id = auth.uid());

-- Contact notes policies
CREATE POLICY "Users can view notes for their contacts" ON contact_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create notes for their contacts" ON contact_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update notes for their contacts" ON contact_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete notes for their contacts" ON contact_notes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- Contact reminders policies
CREATE POLICY "Users can view reminders for their contacts" ON contact_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_reminders.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reminders for their contacts" ON contact_reminders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_reminders.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reminders for their contacts" ON contact_reminders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_reminders.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reminders for their contacts" ON contact_reminders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_reminders.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- Contact interactions policies
CREATE POLICY "Users can view interactions for their contacts" ON contact_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_interactions.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create interactions for their contacts" ON contact_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_interactions.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- Contact messages policies
CREATE POLICY "Users can view messages for their contacts" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_messages.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their contacts" ON contact_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_messages.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages for their contacts" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_messages.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- Create function to increment contact interaction count
CREATE OR REPLACE FUNCTION increment_contact_interaction_count(contact_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE contacts 
    SET 
        last_interaction = NOW(),
        interaction_count = interaction_count + 1
    WHERE contacts.id = contact_id 
    AND contacts.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE contacts IS 'CRM contacts linking users to their business relationships';
COMMENT ON COLUMN contacts.user_id IS 'ID of the user who owns this contact';
COMMENT ON COLUMN contacts.contact_user_id IS 'ID of the user being tracked as a contact';
COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: contractor, event_manager, client, vendor, other';
COMMENT ON COLUMN contacts.relationship_status IS 'Status of the relationship: active, inactive, blocked, archived';
COMMENT ON COLUMN contacts.last_interaction IS 'Timestamp of the most recent interaction';
COMMENT ON COLUMN contacts.interaction_count IS 'Total number of interactions with this contact';

COMMENT ON TABLE contact_notes IS 'Notes and tags for contacts';
COMMENT ON TABLE contact_reminders IS 'Follow-up reminders and scheduling for contacts';
COMMENT ON TABLE contact_interactions IS 'Interaction history for contacts';
COMMENT ON TABLE contact_messages IS 'Message tracking and conversation threads for contacts';
