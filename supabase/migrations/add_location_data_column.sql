-- Add location_data column to events table to store full location object with coordinates
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Add comment to document the column purpose
COMMENT ON COLUMN events.location_data IS 'Stores full location object including coordinates, placeId, city, region, country, etc.';
