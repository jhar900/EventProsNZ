-- Create map_interactions table for tracking user interactions with map pins and clusters
CREATE TABLE IF NOT EXISTS map_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('click', 'hover', 'select', 'deselect', 'expand', 'collapse')),
    contractor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    map_bounds JSONB,
    zoom_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_map_interactions_user_id ON map_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_map_interactions_contractor_id ON map_interactions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_map_interactions_type ON map_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_map_interactions_created_at ON map_interactions(created_at);

-- Create composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_map_interactions_analytics ON map_interactions(interaction_type, contractor_id, created_at);

-- Add RLS policies
ALTER TABLE map_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON map_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own interactions
CREATE POLICY "Users can insert own interactions" ON map_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can view all interactions
CREATE POLICY "Admins can view all interactions" ON map_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can insert interactions for any user
CREATE POLICY "Admins can insert any interactions" ON map_interactions
    FOR INSERT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE map_interactions IS 'Tracks user interactions with map pins and clusters for analytics';
COMMENT ON COLUMN map_interactions.user_id IS 'User who performed the interaction (NULL for anonymous)';
COMMENT ON COLUMN map_interactions.interaction_type IS 'Type of interaction: click, hover, select, deselect, expand, collapse';
COMMENT ON COLUMN map_interactions.contractor_id IS 'Contractor pin that was interacted with';
COMMENT ON COLUMN map_interactions.map_bounds IS 'Map bounds at time of interaction (JSON)';
COMMENT ON COLUMN map_interactions.zoom_level IS 'Map zoom level at time of interaction';
COMMENT ON COLUMN map_interactions.created_at IS 'Timestamp when interaction occurred';
