-- Create featured_testimonials table for featured testimonial management
CREATE TABLE IF NOT EXISTS featured_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES platform_testimonials(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonial_quality_checks table for quality control
CREATE TABLE IF NOT EXISTS testimonial_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES platform_testimonials(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL CHECK (check_type IN ('profanity', 'spam', 'quality', 'sentiment')),
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create testimonial_export_jobs table for export management
CREATE TABLE IF NOT EXISTS testimonial_export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'pdf', 'json')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    parameters JSONB NOT NULL DEFAULT '{}',
    include_analytics BOOLEAN DEFAULT FALSE,
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_testimonials_testimonial_id ON featured_testimonials(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_featured_testimonials_display_order ON featured_testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_testimonials_is_active ON featured_testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_testimonials_dates ON featured_testimonials(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_testimonial_quality_checks_testimonial_id ON testimonial_quality_checks(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_quality_checks_type ON testimonial_quality_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_testimonial_quality_checks_status ON testimonial_quality_checks(status);

CREATE INDEX IF NOT EXISTS idx_testimonial_export_jobs_user_id ON testimonial_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_export_jobs_status ON testimonial_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_testimonial_export_jobs_type ON testimonial_export_jobs(export_type);

-- Create updated_at triggers
CREATE TRIGGER update_featured_testimonials_updated_at 
    BEFORE UPDATE ON featured_testimonials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for featured_testimonials
ALTER TABLE featured_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage featured testimonials" ON featured_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Public can view active featured testimonials" ON featured_testimonials
    FOR SELECT USING (
        is_active = true 
        AND start_date <= NOW() 
        AND end_date >= NOW()
    );

-- Add RLS policies for testimonial_quality_checks
ALTER TABLE testimonial_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view quality checks" ON testimonial_quality_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can create quality checks" ON testimonial_quality_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for testimonial_export_jobs
ALTER TABLE testimonial_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export jobs" ON testimonial_export_jobs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create export jobs" ON testimonial_export_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all export jobs" ON testimonial_export_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE featured_testimonials IS 'Featured testimonials for homepage display';
COMMENT ON COLUMN featured_testimonials.testimonial_id IS 'ID of the platform testimonial being featured';
COMMENT ON COLUMN featured_testimonials.display_order IS 'Order in which testimonials are displayed';
COMMENT ON COLUMN featured_testimonials.start_date IS 'When the testimonial should start being featured';
COMMENT ON COLUMN featured_testimonials.end_date IS 'When the testimonial should stop being featured';
COMMENT ON COLUMN featured_testimonials.is_active IS 'Whether the testimonial is currently active';

COMMENT ON TABLE testimonial_quality_checks IS 'Quality control checks for testimonials';
COMMENT ON COLUMN testimonial_quality_checks.check_type IS 'Type of quality check performed';
COMMENT ON COLUMN testimonial_quality_checks.status IS 'Result of the quality check';
COMMENT ON COLUMN testimonial_quality_checks.score IS 'Quality score from 0-100';
COMMENT ON COLUMN testimonial_quality_checks.details IS 'Detailed information about the check result';

COMMENT ON TABLE testimonial_export_jobs IS 'Export job tracking for testimonials';
COMMENT ON COLUMN testimonial_export_jobs.export_type IS 'Format of the export (csv, pdf, json)';
COMMENT ON COLUMN testimonial_export_jobs.status IS 'Current status of the export job';
COMMENT ON COLUMN testimonial_export_jobs.parameters IS 'Export parameters and filters';
COMMENT ON COLUMN testimonial_export_jobs.file_url IS 'URL to download the exported file';
COMMENT ON COLUMN testimonial_export_jobs.error_message IS 'Error message if export failed';
