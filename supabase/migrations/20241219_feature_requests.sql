-- Feature Request System Migration
-- Creates tables for feature requests, voting, categories, and tags

-- Feature request categories
CREATE TABLE feature_request_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature request tags
CREATE TABLE feature_request_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature requests
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES feature_request_categories(id),
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_development', 'completed', 'rejected')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  vote_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature request tags junction table
CREATE TABLE feature_request_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES feature_request_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_request_id, tag_id)
);

-- Feature request votes
CREATE TABLE feature_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

-- Feature request status history
CREATE TABLE feature_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature request comments
CREATE TABLE feature_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_admin_comment BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_category_id ON feature_requests(category_id);
CREATE INDEX idx_feature_requests_vote_count ON feature_requests(vote_count DESC);
CREATE INDEX idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX idx_feature_requests_is_featured ON feature_requests(is_featured);

CREATE INDEX idx_feature_request_votes_feature_request_id ON feature_request_votes(feature_request_id);
CREATE INDEX idx_feature_request_votes_user_id ON feature_request_votes(user_id);

CREATE INDEX idx_feature_request_tag_assignments_feature_request_id ON feature_request_tag_assignments(feature_request_id);
CREATE INDEX idx_feature_request_tag_assignments_tag_id ON feature_request_tag_assignments(tag_id);

CREATE INDEX idx_feature_request_status_history_feature_request_id ON feature_request_status_history(feature_request_id);

CREATE INDEX idx_feature_request_comments_feature_request_id ON feature_request_comments(feature_request_id);

-- RLS Policies
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_status_history ENABLE ROW LEVEL SECURITY;

-- Feature requests policies
CREATE POLICY "Users can view public feature requests" ON feature_requests
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own feature requests" ON feature_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature requests" ON feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature requests" ON feature_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feature requests" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Feature request votes policies
CREATE POLICY "Users can view all votes" ON feature_request_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on feature requests" ON feature_request_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON feature_request_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON feature_request_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Feature request comments policies
CREATE POLICY "Users can view all comments" ON feature_request_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert comments" ON feature_request_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON feature_request_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON feature_request_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Feature request status history policies
CREATE POLICY "Users can view status history" ON feature_request_status_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert status history" ON feature_request_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for vote counting
CREATE OR REPLACE FUNCTION update_feature_request_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = NEW.feature_request_id 
      AND vote_type = 'upvote'
    ) - (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = NEW.feature_request_id 
      AND vote_type = 'downvote'
    )
    WHERE id = NEW.feature_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE feature_requests 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = NEW.feature_request_id 
      AND vote_type = 'upvote'
    ) - (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = NEW.feature_request_id 
      AND vote_type = 'downvote'
    )
    WHERE id = NEW.feature_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = OLD.feature_request_id 
      AND vote_type = 'upvote'
    ) - (
      SELECT COUNT(*) 
      FROM feature_request_votes 
      WHERE feature_request_id = OLD.feature_request_id 
      AND vote_type = 'downvote'
    )
    WHERE id = OLD.feature_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for vote counting
CREATE TRIGGER update_vote_count_on_vote_insert
  AFTER INSERT ON feature_request_votes
  FOR EACH ROW EXECUTE FUNCTION update_feature_request_vote_count();

CREATE TRIGGER update_vote_count_on_vote_update
  AFTER UPDATE ON feature_request_votes
  FOR EACH ROW EXECUTE FUNCTION update_feature_request_vote_count();

CREATE TRIGGER update_vote_count_on_vote_delete
  AFTER DELETE ON feature_request_votes
  FOR EACH ROW EXECUTE FUNCTION update_feature_request_vote_count();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_request_tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_request_tags 
    SET usage_count = usage_count - 1 
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag usage count
CREATE TRIGGER update_tag_usage_on_assignment
  AFTER INSERT OR DELETE ON feature_request_tag_assignments
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Insert default categories
INSERT INTO feature_request_categories (name, description, color) VALUES
  ('User Interface', 'Improvements to the user interface and user experience', '#3B82F6'),
  ('Performance', 'Performance optimizations and speed improvements', '#10B981'),
  ('Features', 'New features and functionality requests', '#F59E0B'),
  ('Integration', 'Third-party integrations and API improvements', '#8B5CF6'),
  ('Mobile', 'Mobile app and responsive design improvements', '#EF4444'),
  ('Security', 'Security enhancements and privacy improvements', '#6B7280'),
  ('Analytics', 'Analytics, reporting, and data visualization', '#06B6D4'),
  ('Communication', 'Messaging, notifications, and communication features', '#84CC16'),
  ('Search', 'Search functionality and filtering improvements', '#F97316'),
  ('Other', 'General requests and miscellaneous improvements', '#64748B');

-- Insert default tags
INSERT INTO feature_request_tags (name) VALUES
  ('bug-fix'),
  ('enhancement'),
  ('new-feature'),
  ('ui-improvement'),
  ('performance'),
  ('mobile'),
  ('desktop'),
  ('api'),
  ('integration'),
  ('security'),
  ('analytics'),
  ('notification'),
  ('search'),
  ('filter'),
  ('accessibility');
