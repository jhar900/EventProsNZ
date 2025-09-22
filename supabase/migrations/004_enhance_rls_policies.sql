-- Enhance Row Level Security policies
-- This migration adds additional RLS policies for better security

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Enhanced user policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies for user management
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enhanced event policies
DROP POLICY IF EXISTS "Events are viewable by owner" ON public.events;
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;

CREATE POLICY "Events are viewable by owner" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- Allow contractors to view events for job applications
CREATE POLICY "Contractors can view events for applications" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.user_id = auth.uid() AND bp.role = 'contractor'
    )
  );

-- Enhanced job policies
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Event owners can manage their jobs" ON public.jobs;

CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Event owners can manage their jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Enhanced enquiry policies
DROP POLICY IF EXISTS "Enquiries follow event permissions" ON public.enquiries;

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

-- Enhanced testimonial policies
DROP POLICY IF EXISTS "Testimonials are viewable by everyone" ON public.testimonials;
DROP POLICY IF EXISTS "Event owners can create testimonials" ON public.testimonials;

CREATE POLICY "Testimonials are viewable by everyone" ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY "Event owners can create testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can update own testimonials" ON public.testimonials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Enhanced subscription policies
DROP POLICY IF EXISTS "Subscriptions are private to users" ON public.subscriptions;

CREATE POLICY "Subscriptions are private to users" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enhanced portfolio policies
DROP POLICY IF EXISTS "Portfolio items are viewable by everyone" ON public.portfolio_items;
DROP POLICY IF EXISTS "Business owners can manage their portfolio" ON public.portfolio_items;

CREATE POLICY "Portfolio items are viewable by everyone" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their portfolio" ON public.portfolio_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = business_profile_id AND bp.user_id = auth.uid()
    )
  );

-- Add policies for event_service_assignments
CREATE POLICY "Event service assignments follow event permissions" ON public.event_service_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_services es
      JOIN public.events e ON es.event_id = e.id
      WHERE es.id = event_service_id AND e.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = contractor_id AND bp.user_id = auth.uid()
    )
  );
