-- Create FAQs table for the site-wide FAQ section
-- Categories: general, contractors, event_managers
-- Supports rich text answers (HTML), optional image (Supabase Storage), optional YouTube video URL
-- Manual drag-to-reorder via display_order

CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'contractors', 'event_managers')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_faqs_active ON faqs(is_active);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage faqs" ON faqs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
