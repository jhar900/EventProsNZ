-- Enable RLS on feature request categories, tags, and tag assignments tables
-- This migration addresses security warnings from Supabase database linter

-- Enable RLS on feature_request_categories
ALTER TABLE feature_request_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_request_tags
ALTER TABLE feature_request_tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_request_tag_assignments
ALTER TABLE feature_request_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public can view active categories" ON feature_request_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON feature_request_categories;

DROP POLICY IF EXISTS "Authenticated users can view tags" ON feature_request_tags;
DROP POLICY IF EXISTS "Public can view tags" ON feature_request_tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON feature_request_tags;

DROP POLICY IF EXISTS "Users can view tag assignments" ON feature_request_tag_assignments;
DROP POLICY IF EXISTS "Authenticated users can create tag assignments" ON feature_request_tag_assignments;
DROP POLICY IF EXISTS "Authenticated users can create tag assignments for their requests" ON feature_request_tag_assignments;
DROP POLICY IF EXISTS "Admins can manage tag assignments" ON feature_request_tag_assignments;

-- Feature Request Categories Policies
-- Categories are public data (read-only for non-admins) as per API route design
CREATE POLICY "Public can view active categories" ON feature_request_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON feature_request_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Feature Request Tags Policies
-- Tags are public data (can be viewed by anyone when joined with feature requests)
-- The /api/feature-requests/tags endpoint requires auth, but tags themselves are public metadata
CREATE POLICY "Public can view tags" ON feature_request_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON feature_request_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Feature Request Tag Assignments Policies
-- Tag assignments can be viewed by anyone (for displaying tags on feature requests)
-- Authenticated users can create assignments only for their own feature requests
-- Only admins can delete or modify assignments
CREATE POLICY "Users can view tag assignments" ON feature_request_tag_assignments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tag assignments for their requests" ON feature_request_tag_assignments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM feature_requests
      WHERE id = feature_request_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tag assignments" ON feature_request_tag_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

