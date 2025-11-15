-- Create service_categories table for managing contractor service categories
-- This table stores the available service categories that contractors can choose from

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON public.service_categories(name);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON public.service_categories(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read active categories
CREATE POLICY "Allow authenticated users to read active service categories"
  ON public.service_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow only admins to read all categories (including inactive)
CREATE POLICY "Allow admins to read all service categories"
  ON public.service_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow only admins to insert, update, and delete
CREATE POLICY "Allow admins to manage service categories"
  ON public.service_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert some default service categories
INSERT INTO public.service_categories (name, description, is_active) VALUES
  ('Catering', 'Food and beverage services for events', true),
  ('Photography', 'Event photography and videography services', true),
  ('Venue', 'Event venue rental and management', true),
  ('Entertainment', 'Live entertainment, music, and performers', true),
  ('Decorations', 'Event decoration and styling services', true),
  ('Flowers', 'Floral arrangements and decoration', true),
  ('Lighting', 'Event lighting and sound equipment', true),
  ('Transportation', 'Event transportation services', true),
  ('Security', 'Event security and crowd management', true),
  ('Planning', 'Event planning and coordination services', true)
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.service_categories IS 'Available service categories that contractors can select from';
COMMENT ON COLUMN public.service_categories.name IS 'Name of the service category';
COMMENT ON COLUMN public.service_categories.description IS 'Description of what this service category includes';
COMMENT ON COLUMN public.service_categories.is_active IS 'Whether this category is active and available for selection';

