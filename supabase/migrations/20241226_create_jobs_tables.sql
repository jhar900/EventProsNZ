-- Create jobs table for event manager job postings
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) <= 5000),
    job_type TEXT NOT NULL CHECK (job_type IN ('event_manager', 'contractor_internal')),
    service_category TEXT NOT NULL CHECK (length(service_category) <= 100),
    budget_range_min DECIMAL(10,2) CHECK (budget_range_min >= 0),
    budget_range_max DECIMAL(10,2) CHECK (budget_range_max >= 0),
    location TEXT NOT NULL CHECK (length(location) <= 200),
    coordinates JSONB, -- {lat: number, lng: number}
    is_remote BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filled', 'completed', 'cancelled')),
    posted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    special_requirements TEXT CHECK (length(special_requirements) <= 2000),
    contact_email TEXT CHECK (length(contact_email) <= 255),
    contact_phone TEXT CHECK (length(contact_phone) <= 50),
    response_preferences TEXT CHECK (response_preferences IN ('email', 'phone', 'platform')),
    timeline_start_date DATE,
    timeline_end_date DATE,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table for contractor applications
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL CHECK (length(cover_letter) <= 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of file paths/URLs
    proposed_budget DECIMAL(10,2) CHECK (proposed_budget >= 0),
    availability_start_date DATE,
    availability_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_analytics table for tracking job performance
CREATE TABLE IF NOT EXISTS job_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    view_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_user_id ON jobs(posted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_service_category ON jobs(service_category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_budget_range ON jobs(budget_range_min, budget_range_max);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_event_id ON jobs(event_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_contractor_id ON job_applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_job_analytics_job_id ON job_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_job_analytics_view_date ON job_analytics(view_date);
CREATE INDEX IF NOT EXISTS idx_job_analytics_viewer_user_id ON job_analytics(viewer_user_id);

-- Create updated_at triggers
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Job posters can view their own jobs
CREATE POLICY "Job posters can view their jobs" ON jobs
    FOR SELECT USING (posted_by_user_id = auth.uid());

-- Job posters can create jobs
CREATE POLICY "Job posters can create jobs" ON jobs
    FOR INSERT WITH CHECK (posted_by_user_id = auth.uid());

-- Job posters can update their own jobs
CREATE POLICY "Job posters can update their jobs" ON jobs
    FOR UPDATE USING (posted_by_user_id = auth.uid());

-- Job posters can delete their own jobs
CREATE POLICY "Job posters can delete their jobs" ON jobs
    FOR DELETE USING (posted_by_user_id = auth.uid());

-- Active jobs are viewable by all authenticated users
CREATE POLICY "Active jobs are viewable by all" ON jobs
    FOR SELECT USING (status = 'active');

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add RLS policies for job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own applications
CREATE POLICY "Contractors can view their applications" ON job_applications
    FOR SELECT USING (contractor_id = auth.uid());

-- Contractors can create applications
CREATE POLICY "Contractors can create applications" ON job_applications
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

-- Contractors can update their own applications
CREATE POLICY "Contractors can update their applications" ON job_applications
    FOR UPDATE USING (contractor_id = auth.uid());

-- Job posters can view applications to their jobs
CREATE POLICY "Job posters can view applications to their jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.posted_by_user_id = auth.uid()
        )
    );

-- Job posters can update applications to their jobs
CREATE POLICY "Job posters can update applications to their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.posted_by_user_id = auth.uid()
        )
    );

-- Add RLS policies for job_analytics
ALTER TABLE job_analytics ENABLE ROW LEVEL SECURITY;

-- Job posters can view analytics for their jobs
CREATE POLICY "Job posters can view their job analytics" ON job_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_analytics.job_id 
            AND jobs.posted_by_user_id = auth.uid()
        )
    );

-- Create function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count(job_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs 
    SET application_count = (
        SELECT COUNT(*) 
        FROM job_applications 
        WHERE job_id = job_uuid
    )
    WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update application count when applications change
CREATE OR REPLACE FUNCTION trigger_update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update application count for the job
    PERFORM update_job_application_count(COALESCE(NEW.job_id, OLD.job_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_application_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_job_application_count();

-- Create function to update job view count
CREATE OR REPLACE FUNCTION update_job_view_count(job_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs 
    SET view_count = (
        SELECT COUNT(*) 
        FROM job_analytics 
        WHERE job_id = job_uuid
    )
    WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update view count when analytics change
CREATE OR REPLACE FUNCTION trigger_update_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update view count for the job
    PERFORM update_job_view_count(COALESCE(NEW.job_id, OLD.job_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_view_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON job_analytics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_job_view_count();

-- Add comments
COMMENT ON TABLE jobs IS 'Job postings by event managers';
COMMENT ON COLUMN jobs.title IS 'Job title (max 200 chars)';
COMMENT ON COLUMN jobs.description IS 'Job description (max 5000 chars)';
COMMENT ON COLUMN jobs.job_type IS 'Type of job: event_manager or contractor_internal';
COMMENT ON COLUMN jobs.service_category IS 'Service category for the job';
COMMENT ON COLUMN jobs.budget_range_min IS 'Minimum budget for the job';
COMMENT ON COLUMN jobs.budget_range_max IS 'Maximum budget for the job';
COMMENT ON COLUMN jobs.location IS 'Job location (max 200 chars)';
COMMENT ON COLUMN jobs.coordinates IS 'Geographic coordinates for the job';
COMMENT ON COLUMN jobs.is_remote IS 'Whether the job can be done remotely';
COMMENT ON COLUMN jobs.status IS 'Job status: active, filled, completed, cancelled';
COMMENT ON COLUMN jobs.posted_by_user_id IS 'ID of the user who posted the job';
COMMENT ON COLUMN jobs.event_id IS 'ID of the related event (if any)';
COMMENT ON COLUMN jobs.special_requirements IS 'Special requirements for the job (max 2000 chars)';
COMMENT ON COLUMN jobs.contact_email IS 'Contact email for responses';
COMMENT ON COLUMN jobs.contact_phone IS 'Contact phone for responses';
COMMENT ON COLUMN jobs.response_preferences IS 'Preferred response method';
COMMENT ON COLUMN jobs.timeline_start_date IS 'Job start date';
COMMENT ON COLUMN jobs.timeline_end_date IS 'Job end date';
COMMENT ON COLUMN jobs.view_count IS 'Number of times the job has been viewed';
COMMENT ON COLUMN jobs.application_count IS 'Number of applications received';

COMMENT ON TABLE job_applications IS 'Contractor applications to jobs';
COMMENT ON TABLE job_analytics IS 'Analytics data for job views';
