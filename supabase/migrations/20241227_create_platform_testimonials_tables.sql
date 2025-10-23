-- Create platform_testimonials table for platform testimonials system
CREATE TABLE IF NOT EXISTS platform_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL CHECK (length(feedback) <= 2000),
    category TEXT NOT NULL CHECK (category IN ('event_manager', 'contractor')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Create platform_testimonial_moderation table for moderation tracking
CREATE TABLE IF NOT EXISTS platform_testimonial_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES platform_testimonials(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    notes TEXT CHECK (length(notes) <= 1000),
    moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_verification table for user verification status
CREATE TABLE IF NOT EXISTS user_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'phone', 'identity', 'business')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_testimonial_analytics table for analytics tracking
CREATE TABLE IF NOT EXISTS platform_testimonial_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES platform_testimonials(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0.00,
    rating_impact DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_user_id ON platform_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_status ON platform_testimonials(status);
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_category ON platform_testimonials(category);
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_rating ON platform_testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_is_public ON platform_testimonials(is_public);
CREATE INDEX IF NOT EXISTS idx_platform_testimonials_created_at ON platform_testimonials(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_testimonial_moderation_testimonial_id ON platform_testimonial_moderation(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_platform_testimonial_moderation_moderator_id ON platform_testimonial_moderation(moderator_id);
CREATE INDEX IF NOT EXISTS idx_platform_testimonial_moderation_status ON platform_testimonial_moderation(status);

CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON user_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_type ON user_verification(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verification_status ON user_verification(status);

CREATE INDEX IF NOT EXISTS idx_platform_testimonial_analytics_testimonial_id ON platform_testimonial_analytics(testimonial_id);

-- Create updated_at triggers
CREATE TRIGGER update_platform_testimonials_updated_at 
    BEFORE UPDATE ON platform_testimonials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verification_updated_at 
    BEFORE UPDATE ON user_verification 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE platform_testimonials ENABLE ROW LEVEL SECURITY;

-- Users can view their own testimonials
CREATE POLICY "Users can view their own platform testimonials" ON platform_testimonials
    FOR SELECT USING (user_id = auth.uid());

-- Users can create platform testimonials
CREATE POLICY "Users can create platform testimonials" ON platform_testimonials
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own testimonials
CREATE POLICY "Users can update their own platform testimonials" ON platform_testimonials
    FOR UPDATE USING (user_id = auth.uid());

-- Public testimonials can be viewed by anyone
CREATE POLICY "Public platform testimonials are viewable by all" ON platform_testimonials
    FOR SELECT USING (is_public = true AND status = 'approved');

-- Admins can view all platform testimonials
CREATE POLICY "Admins can view all platform testimonials" ON platform_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for platform_testimonial_moderation
ALTER TABLE platform_testimonial_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view moderation records" ON platform_testimonial_moderation
    FOR SELECT USING (moderator_id = auth.uid());

CREATE POLICY "Admins can view all moderation records" ON platform_testimonial_moderation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for user_verification
ALTER TABLE user_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification status" ON user_verification
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all verification records" ON user_verification
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for platform_testimonial_analytics
ALTER TABLE platform_testimonial_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are viewable by admins" ON platform_testimonial_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE platform_testimonials IS 'Platform testimonials from users about their experience with Event Pros NZ';
COMMENT ON COLUMN platform_testimonials.user_id IS 'ID of the user writing the testimonial';
COMMENT ON COLUMN platform_testimonials.rating IS 'Rating from 1 to 5 stars for platform experience';
COMMENT ON COLUMN platform_testimonials.feedback IS 'Text content of the testimonial (max 2000 chars)';
COMMENT ON COLUMN platform_testimonials.category IS 'User category: event_manager or contractor';
COMMENT ON COLUMN platform_testimonials.status IS 'Moderation status: pending, approved, rejected, flagged';
COMMENT ON COLUMN platform_testimonials.is_verified IS 'Whether the testimonial is from a verified user';
COMMENT ON COLUMN platform_testimonials.is_public IS 'Whether the testimonial is publicly visible';

COMMENT ON TABLE platform_testimonial_moderation IS 'Moderation records for platform testimonials';
COMMENT ON TABLE user_verification IS 'User verification status for testimonial authenticity';
COMMENT ON TABLE platform_testimonial_analytics IS 'Analytics data for platform testimonials';
