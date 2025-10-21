-- Create testimonials table for contractor testimonials system
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL CHECK (length(review_text) <= 2000),
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonial_responses table for contractor responses
CREATE TABLE IF NOT EXISTS testimonial_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL CHECK (length(response_text) <= 2000),
    is_approved BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonial_moderation table for moderation tracking
CREATE TABLE IF NOT EXISTS testimonial_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderation_status TEXT NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderation_notes TEXT CHECK (length(moderation_notes) <= 1000),
    moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonial_ratings table for aggregated ratings
CREATE TABLE IF NOT EXISTS testimonial_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    average_rating DECIMAL(3,2) NOT NULL CHECK (average_rating >= 1.00 AND average_rating <= 5.00),
    total_reviews INTEGER NOT NULL DEFAULT 0,
    rating_breakdown JSONB NOT NULL DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_contractor_id ON testimonials(contractor_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_event_manager_id ON testimonials(event_manager_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_inquiry_id ON testimonials(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_public ON testimonials(is_public);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at);

CREATE INDEX IF NOT EXISTS idx_testimonial_responses_testimonial_id ON testimonial_responses(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_responses_contractor_id ON testimonial_responses(contractor_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_responses_is_approved ON testimonial_responses(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonial_responses_is_public ON testimonial_responses(is_public);

CREATE INDEX IF NOT EXISTS idx_testimonial_moderation_testimonial_id ON testimonial_moderation(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_moderation_moderator_id ON testimonial_moderation(moderator_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_moderation_status ON testimonial_moderation(moderation_status);

CREATE INDEX IF NOT EXISTS idx_testimonial_ratings_contractor_id ON testimonial_ratings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_ratings_average_rating ON testimonial_ratings(average_rating);

-- Create updated_at triggers
CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON testimonials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonial_responses_updated_at 
    BEFORE UPDATE ON testimonial_responses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Contractors can view testimonials about them
CREATE POLICY "Contractors can view their testimonials" ON testimonials
    FOR SELECT USING (contractor_id = auth.uid());

-- Event managers can view testimonials they created
CREATE POLICY "Event managers can view their testimonials" ON testimonials
    FOR SELECT USING (event_manager_id = auth.uid());

-- Event managers can create testimonials (with verification)
CREATE POLICY "Event managers can create testimonials" ON testimonials
    FOR INSERT WITH CHECK (event_manager_id = auth.uid());

-- Event managers can update their own testimonials
CREATE POLICY "Event managers can update their testimonials" ON testimonials
    FOR UPDATE USING (event_manager_id = auth.uid());

-- Public testimonials can be viewed by anyone
CREATE POLICY "Public testimonials are viewable by all" ON testimonials
    FOR SELECT USING (is_public = true);

-- Admins can view all testimonials
CREATE POLICY "Admins can view all testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for testimonial_responses
ALTER TABLE testimonial_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view responses to their testimonials" ON testimonial_responses
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can create responses to their testimonials" ON testimonial_responses
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their responses" ON testimonial_responses
    FOR UPDATE USING (contractor_id = auth.uid());

CREATE POLICY "Public responses are viewable by all" ON testimonial_responses
    FOR SELECT USING (is_public = true);

-- Add RLS policies for testimonial_moderation
ALTER TABLE testimonial_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view moderation records" ON testimonial_moderation
    FOR SELECT USING (moderator_id = auth.uid());

CREATE POLICY "Admins can view all moderation records" ON testimonial_moderation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for testimonial_ratings
ALTER TABLE testimonial_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their ratings" ON testimonial_ratings
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Public ratings are viewable by all" ON testimonial_ratings
    FOR SELECT USING (true);

-- Create function to update testimonial ratings
CREATE OR REPLACE FUNCTION update_testimonial_ratings(contractor_uuid UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
    rating_breakdown JSONB;
BEGIN
    -- Calculate average rating and total count
    SELECT 
        ROUND(AVG(rating)::DECIMAL, 2),
        COUNT(*),
        jsonb_build_object(
            '1', COUNT(*) FILTER (WHERE rating = 1),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '5', COUNT(*) FILTER (WHERE rating = 5)
        )
    INTO avg_rating, total_count, rating_breakdown
    FROM testimonials 
    WHERE contractor_id = contractor_uuid 
    AND is_approved = true 
    AND is_public = true;

    -- Insert or update rating record
    INSERT INTO testimonial_ratings (contractor_id, average_rating, total_reviews, rating_breakdown)
    VALUES (contractor_uuid, COALESCE(avg_rating, 0), COALESCE(total_count, 0), COALESCE(rating_breakdown, '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'))
    ON CONFLICT (contractor_id) 
    DO UPDATE SET 
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        rating_breakdown = EXCLUDED.rating_breakdown,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings when testimonials change
CREATE OR REPLACE FUNCTION trigger_update_testimonial_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ratings for the contractor
    PERFORM update_testimonial_ratings(COALESCE(NEW.contractor_id, OLD.contractor_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_testimonial_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_testimonial_ratings();

-- Add comments
COMMENT ON TABLE testimonials IS 'Testimonials from event managers about contractors';
COMMENT ON COLUMN testimonials.contractor_id IS 'ID of the contractor being reviewed';
COMMENT ON COLUMN testimonials.event_manager_id IS 'ID of the event manager writing the testimonial';
COMMENT ON COLUMN testimonials.inquiry_id IS 'ID of the inquiry that led to this testimonial';
COMMENT ON COLUMN testimonials.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN testimonials.review_text IS 'Text content of the testimonial (max 2000 chars)';
COMMENT ON COLUMN testimonials.is_verified IS 'Whether the testimonial is verified as from actual client';
COMMENT ON COLUMN testimonials.is_approved IS 'Whether the testimonial has been approved for display';
COMMENT ON COLUMN testimonials.is_public IS 'Whether the testimonial is publicly visible';

COMMENT ON TABLE testimonial_responses IS 'Contractor responses to testimonials';
COMMENT ON TABLE testimonial_moderation IS 'Moderation records for testimonials';
COMMENT ON TABLE testimonial_ratings IS 'Aggregated rating data for contractors';
