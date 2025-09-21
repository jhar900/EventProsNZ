-- Initial Database Schema with Performance Optimizations
-- Event Pros NZ - Production Ready Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE user_role AS ENUM ('event_manager', 'contractor', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'planning', 'confirmed', 'completed', 'cancelled');
CREATE TYPE job_status AS ENUM ('active', 'filled', 'completed', 'cancelled');
CREATE TYPE subscription_tier AS ENUM ('essential', 'showcase', 'spotlight');
CREATE TYPE enquiry_status AS ENUM ('pending', 'responded', 'closed', 'archived');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'event_manager',
  is_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'Pacific/Auckland',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business profiles table
CREATE TABLE public.business_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  location TEXT,
  service_categories TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier subscription_tier DEFAULT 'essential',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_multi_day BOOLEAN DEFAULT FALSE,
  location TEXT NOT NULL,
  attendee_count INTEGER NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  status event_status DEFAULT 'draft',
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date > event_date),
  CONSTRAINT valid_multi_day CHECK (is_multi_day = (end_date IS NOT NULL)),
  CONSTRAINT valid_attendee_count CHECK (attendee_count > 0),
  CONSTRAINT valid_duration CHECK (duration_hours > 0),
  CONSTRAINT valid_budget CHECK (budget >= 0)
);

-- Services table
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_price_range CHECK (price_range_min IS NULL OR price_range_max IS NULL OR price_range_min <= price_range_max)
);

-- Event services junction table
CREATE TABLE public.event_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'required',
  budget_allocated DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_event_service UNIQUE (event_id, service_id)
);

-- Event service assignments
CREATE TABLE public.event_service_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_service_id UUID REFERENCES public.event_services(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  CONSTRAINT unique_assignment UNIQUE (event_service_id, contractor_id)
);

-- Enquiries table
CREATE TABLE public.enquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  status enquiry_status DEFAULT 'pending',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enquiry messages
CREATE TABLE public.enquiry_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status job_status DEFAULT 'active',
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_budget_range CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

-- Job applications
CREATE TABLE public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  proposed_budget DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  CONSTRAINT unique_job_application UNIQUE (job_id, contractor_id)
);

-- Testimonials
CREATE TABLE public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_testimonial UNIQUE (event_id, contractor_id)
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio items
CREATE TABLE public.portfolio_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
-- User-related indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_verified ON public.users(is_verified);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_verified ON public.business_profiles(is_verified);
CREATE INDEX idx_business_profiles_tier ON public.business_profiles(subscription_tier);

-- Event-related indexes
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_location ON public.events USING GIN(to_tsvector('english', location));
CREATE INDEX idx_events_created_at ON public.events(created_at);

-- Full-text search indexes
CREATE INDEX idx_events_search ON public.events USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || location)
);

CREATE INDEX idx_business_profiles_search ON public.business_profiles USING GIN(
  to_tsvector('english', company_name || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, ''))
);

-- Service-related indexes
CREATE INDEX idx_services_business_profile_id ON public.services(business_profile_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_available ON public.services(is_available);
CREATE INDEX idx_event_services_event_id ON public.event_services(event_id);
CREATE INDEX idx_event_services_service_id ON public.event_services(service_id);

-- Job-related indexes
CREATE INDEX idx_jobs_event_id ON public.jobs(event_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_deadline ON public.jobs(application_deadline);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_contractor_id ON public.job_applications(contractor_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- Enquiry-related indexes
CREATE INDEX idx_enquiries_event_id ON public.enquiries(event_id);
CREATE INDEX idx_enquiries_contractor_id ON public.enquiries(contractor_id);
CREATE INDEX idx_enquiries_status ON public.enquiries(status);
CREATE INDEX idx_enquiry_messages_enquiry_id ON public.enquiry_messages(enquiry_id);
CREATE INDEX idx_enquiry_messages_sender_id ON public.enquiry_messages(sender_id);

-- Testimonial indexes
CREATE INDEX idx_testimonials_event_id ON public.testimonials(event_id);
CREATE INDEX idx_testimonials_contractor_id ON public.testimonials(contractor_id);
CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Portfolio indexes
CREATE INDEX idx_portfolio_business_profile_id ON public.portfolio_items(business_profile_id);
CREATE INDEX idx_portfolio_category ON public.portfolio_items(category);

-- Composite indexes for common queries
CREATE INDEX idx_events_user_status_date ON public.events(user_id, status, event_date);
CREATE INDEX idx_business_profiles_tier_verified ON public.business_profiles(subscription_tier, is_verified);
CREATE INDEX idx_services_category_available ON public.services(category, is_available);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- Business profiles are viewable by everyone
CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own business profile" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Events are private to their creators
CREATE POLICY "Events are viewable by owner" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Services are viewable by everyone
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = business_profile_id AND bp.user_id = auth.uid()
    )
  );

-- Event services follow event permissions
CREATE POLICY "Event services follow event permissions" ON public.event_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Jobs are viewable by everyone
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Event owners can manage their jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Job applications are viewable by job owner and applicant
CREATE POLICY "Job applications are viewable by job owner and applicant" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      JOIN public.events e ON j.event_id = e.id 
      WHERE j.id = job_id AND e.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = contractor_id AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can create job applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = contractor_id AND bp.user_id = auth.uid()
    )
  );

-- Enquiries follow event permissions
CREATE POLICY "Enquiries follow event permissions" ON public.enquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = contractor_id AND bp.user_id = auth.uid()
    )
  );

-- Enquiry messages follow enquiry permissions
CREATE POLICY "Enquiry messages follow enquiry permissions" ON public.enquiry_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enquiries eq 
      WHERE eq.id = enquiry_id AND (
        EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = eq.event_id AND e.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.business_profiles bp 
          WHERE bp.id = eq.contractor_id AND bp.user_id = auth.uid()
        )
      )
    )
  );

-- Testimonials are viewable by everyone
CREATE POLICY "Testimonials are viewable by everyone" ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY "Event owners can create testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Subscriptions are private to users
CREATE POLICY "Subscriptions are private to users" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Portfolio items are viewable by everyone
CREATE POLICY "Portfolio items are viewable by everyone" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their portfolio" ON public.portfolio_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = business_profile_id AND bp.user_id = auth.uid()
    )
  );

-- Functions for performance monitoring
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_services_updated_at BEFORE UPDATE ON public.event_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update business profile ratings
CREATE OR REPLACE FUNCTION update_business_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.business_profiles
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.testimonials
      WHERE contractor_id = NEW.contractor_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.testimonials
      WHERE contractor_id = NEW.contractor_id
    )
  WHERE id = NEW.contractor_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_profile_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION update_business_profile_rating();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
