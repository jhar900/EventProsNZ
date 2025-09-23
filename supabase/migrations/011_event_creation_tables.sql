-- Create event_templates table
CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_versions table for change tracking
CREATE TABLE IF NOT EXISTS event_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_drafts table for draft management
CREATE TABLE IF NOT EXISTS event_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_data JSONB NOT NULL,
    step_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_service_requirements table
CREATE TABLE IF NOT EXISTS event_service_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_budget DECIMAL(10,2),
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_contractor_matches table
CREATE TABLE IF NOT EXISTS event_contractor_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_requirement_id UUID REFERENCES event_service_requirements(id) ON DELETE CASCADE,
    match_score DECIMAL(3,2) DEFAULT 0.0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'interested', 'declined', 'hired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_notifications table for change notifications
CREATE TABLE IF NOT EXISTS event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('event_created', 'event_updated', 'event_cancelled', 'service_requirement_added', 'service_requirement_updated')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS attendee_count INTEGER,
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_templates_event_type ON event_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_event_templates_is_public ON event_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_event_templates_created_by ON event_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_event_versions_event_id ON event_versions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_versions_version_number ON event_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_event_versions_created_at ON event_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_event_drafts_user_id ON event_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_event_drafts_updated_at ON event_drafts(updated_at);

CREATE INDEX IF NOT EXISTS idx_event_service_requirements_event_id ON event_service_requirements(event_id);
CREATE INDEX IF NOT EXISTS idx_event_service_requirements_service_category ON event_service_requirements(service_category);

CREATE INDEX IF NOT EXISTS idx_event_contractor_matches_event_id ON event_contractor_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contractor_matches_contractor_id ON event_contractor_matches(contractor_id);
CREATE INDEX IF NOT EXISTS idx_event_contractor_matches_status ON event_contractor_matches(status);

CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_contractor_id ON event_notifications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_is_read ON event_notifications(is_read);

-- Enable RLS on all new tables
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contractor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_templates
CREATE POLICY "Users can view public templates" ON event_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON event_templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create templates" ON event_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON event_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON event_templates
    FOR DELETE USING (created_by = auth.uid());

-- Create RLS policies for event_versions
CREATE POLICY "Users can view versions for their events" ON event_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_versions.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for their events" ON event_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_versions.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

-- Create RLS policies for event_drafts
CREATE POLICY "Users can manage their own drafts" ON event_drafts
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for event_service_requirements
CREATE POLICY "Users can manage service requirements for their events" ON event_service_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_service_requirements.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

-- Create RLS policies for event_contractor_matches
CREATE POLICY "Event managers can view matches for their events" ON event_contractor_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_contractor_matches.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can view their matches" ON event_contractor_matches
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Event managers can create matches" ON event_contractor_matches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_contractor_matches.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can update their match status" ON event_contractor_matches
    FOR UPDATE USING (contractor_id = auth.uid());

-- Create RLS policies for event_notifications
CREATE POLICY "Users can view their notifications" ON event_notifications
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Event managers can create notifications" ON event_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_notifications.event_id 
            AND events.event_manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their notification read status" ON event_notifications
    FOR UPDATE USING (contractor_id = auth.uid());

-- Create function to automatically create version when event is updated
CREATE OR REPLACE FUNCTION create_event_version()
RETURNS TRIGGER AS $$
DECLARE
    version_num INTEGER;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO version_num 
    FROM event_versions 
    WHERE event_id = NEW.id;
    
    -- Create version record
    INSERT INTO event_versions (event_id, version_number, changes, created_by)
    VALUES (
        NEW.id, 
        version_num, 
        jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW),
            'changed_fields', (
                SELECT jsonb_object_agg(key, value)
                FROM jsonb_each(row_to_json(NEW)::jsonb)
                WHERE key != 'updated_at' 
                AND (row_to_json(NEW)::jsonb->key) IS DISTINCT FROM (row_to_json(OLD)::jsonb->key)
            )
        ),
        NEW.event_manager_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create versions when events are updated
DROP TRIGGER IF EXISTS trigger_create_event_version ON events;
CREATE TRIGGER trigger_create_event_version
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_event_version();

-- Create function to notify contractors when event is updated
CREATE OR REPLACE FUNCTION notify_contractors_on_event_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all contractors who have matches for this event
    INSERT INTO event_notifications (event_id, contractor_id, notification_type, message)
    SELECT 
        NEW.id,
        ecm.contractor_id,
        'event_updated',
        'Event "' || NEW.title || '" has been updated. Please review the changes.'
    FROM event_contractor_matches ecm
    WHERE ecm.event_id = NEW.id
    AND ecm.status IN ('pending', 'contacted', 'interested');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify contractors on event updates
DROP TRIGGER IF EXISTS trigger_notify_contractors_on_event_change ON events;
CREATE TRIGGER trigger_notify_contractors_on_event_change
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION notify_contractors_on_event_change();

-- Insert default event templates
INSERT INTO event_templates (name, event_type, template_data, is_public) VALUES
('Classic Wedding', 'wedding', '{
    "service_requirements": [
        {"category": "catering", "type": "full_service", "priority": "high", "estimated_budget": 5000},
        {"category": "photography", "type": "wedding_photography", "priority": "high", "estimated_budget": 3000},
        {"category": "music", "type": "live_band", "priority": "medium", "estimated_budget": 2000},
        {"category": "decorations", "type": "floral_arrangements", "priority": "medium", "estimated_budget": 1500},
        {"category": "venue", "type": "reception_venue", "priority": "high", "estimated_budget": 4000}
    ],
    "budget_breakdown": {
        "catering": 0.35,
        "venue": 0.25,
        "photography": 0.15,
        "music": 0.10,
        "decorations": 0.10,
        "other": 0.05
    }
}', true),

('Corporate Conference', 'corporate', '{
    "service_requirements": [
        {"category": "venue", "type": "conference_center", "priority": "high", "estimated_budget": 8000},
        {"category": "catering", "type": "corporate_catering", "priority": "high", "estimated_budget": 4000},
        {"category": "av_equipment", "type": "presentation_equipment", "priority": "high", "estimated_budget": 2000},
        {"category": "transportation", "type": "shuttle_service", "priority": "medium", "estimated_budget": 1500}
    ],
    "budget_breakdown": {
        "venue": 0.45,
        "catering": 0.25,
        "av_equipment": 0.15,
        "transportation": 0.10,
        "other": 0.05
    }
}', true),

('Birthday Party', 'party', '{
    "service_requirements": [
        {"category": "catering", "type": "party_catering", "priority": "high", "estimated_budget": 800},
        {"category": "entertainment", "type": "dj_service", "priority": "medium", "estimated_budget": 500},
        {"category": "decorations", "type": "party_decorations", "priority": "medium", "estimated_budget": 300},
        {"category": "cake", "type": "birthday_cake", "priority": "high", "estimated_budget": 200}
    ],
    "budget_breakdown": {
        "catering": 0.40,
        "entertainment": 0.25,
        "decorations": 0.20,
        "cake": 0.10,
        "other": 0.05
    }
}', true);
