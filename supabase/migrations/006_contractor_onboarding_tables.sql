-- Migration: Add contractor onboarding tables
-- Description: Add tables for contractor business profiles, services, portfolio, and social links

-- Add missing columns to business_profiles table for contractor onboarding
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS nzbn TEXT,
ADD COLUMN IF NOT EXISTS service_areas TEXT[],
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Create services table for contractor services and pricing
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  availability TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio table for contractor portfolio items
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonials table for contractor testimonials
CREATE TABLE IF NOT EXISTS contractor_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  event_title TEXT,
  event_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contractor onboarding status table
CREATE TABLE IF NOT EXISTS contractor_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step1_completed BOOLEAN DEFAULT FALSE,
  step2_completed BOOLEAN DEFAULT FALSE,
  step3_completed BOOLEAN DEFAULT FALSE,
  step4_completed BOOLEAN DEFAULT FALSE,
  is_submitted BOOLEAN DEFAULT FALSE,
  submission_date TIMESTAMP WITH TIME ZONE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_testimonials_contractor_id ON contractor_testimonials(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_status_user_id ON contractor_onboarding_status(user_id);

-- Add RLS policies for services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own services" ON services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for portfolio table
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolio" ON portfolio
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio items" ON portfolio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio items" ON portfolio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items" ON portfolio
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for contractor testimonials table
ALTER TABLE contractor_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their own testimonials" ON contractor_testimonials
  FOR SELECT USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert their own testimonials" ON contractor_testimonials
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own testimonials" ON contractor_testimonials
  FOR UPDATE USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can delete their own testimonials" ON contractor_testimonials
  FOR DELETE USING (auth.uid() = contractor_id);

-- Add RLS policies for contractor onboarding status table
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding status" ON contractor_onboarding_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding status" ON contractor_onboarding_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status" ON contractor_onboarding_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Add admin policies for contractor onboarding status
CREATE POLICY "Admins can view all onboarding status" ON contractor_onboarding_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update onboarding status" ON contractor_onboarding_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_updated_at 
  BEFORE UPDATE ON portfolio 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_testimonials_updated_at 
  BEFORE UPDATE ON contractor_testimonials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractor_onboarding_status_updated_at 
  BEFORE UPDATE ON contractor_onboarding_status 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
