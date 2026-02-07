import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import {
  Job,
  JobInsert,
  JobUpdate,
  JobApplication,
  JobApplicationInsert,
  JobApplicationUpdate,
  JobAnalytics,
  JobAnalyticsInsert,
  JobWithDetails,
  JobApplicationWithDetails,
  JobFilters,
  JobSearchParams,
  JobAnalyticsData,
  CreateJobRequest,
  UpdateJobRequest,
  CreateJobApplicationRequest,
  UpdateJobApplicationRequest,
  GetJobsRequest,
  GetJobApplicationsRequest,
} from '@/types/jobs';

export class JobService {
  private _supabase: ReturnType<typeof createClient> | null = null;

  // Lazy getter: initialize supabase client on first access, not during construction
  private get supabase(): ReturnType<typeof createClient> {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  async createJob(jobData: CreateJobRequest, userId: string): Promise<Job> {
    try {
      const jobInsert: JobInsert = {
        ...jobData,
        posted_by_user_id: userId,
        status: 'active',
      };

      const { data: job, error } = await this.supabase
        .from('jobs')
        .insert(jobInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`);
      }

      return job;
    } catch (error) {
      console.error('Create job error:', error);
      throw error;
    }
  }

  async updateJob(
    jobId: string,
    jobData: UpdateJobRequest,
    userId: string
  ): Promise<Job> {
    try {
      // Verify ownership
      const { data: existingJob, error: fetchError } = await this.supabase
        .from('jobs')
        .select('posted_by_user_id')
        .eq('id', jobId)
        .single();

      if (fetchError || !existingJob) {
        throw new Error('Job not found');
      }

      if (existingJob.posted_by_user_id !== userId) {
        throw new Error('Unauthorized to update this job');
      }

      const { data: job, error } = await this.supabase
        .from('jobs')
        .update(jobData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`);
      }

      return job;
    } catch (error) {
      console.error('Update job error:', error);
      throw error;
    }
  }

  async deleteJob(jobId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: existingJob, error: fetchError } = await this.supabase
        .from('jobs')
        .select('posted_by_user_id')
        .eq('id', jobId)
        .single();

      if (fetchError || !existingJob) {
        throw new Error('Job not found');
      }

      if (existingJob.posted_by_user_id !== userId) {
        throw new Error('Unauthorized to delete this job');
      }

      const { error } = await this.supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        throw new Error(`Failed to delete job: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete job error:', error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<JobWithDetails | null> {
    try {
      const { data: job, error } = await this.supabase
        .from('jobs')
        .select(
          `
          *,
          posted_by_user:users!jobs_posted_by_user_id_fkey(
            id,
            email,
            profiles(
              first_name,
              last_name,
              phone,
              avatar_url,
              bio
            ),
            business_profiles(
              company_name,
              description,
              location,
              website,
              logo_url
            )
          ),
          contact_person:users!jobs_contact_person_id_fkey(
            id,
            email,
            profiles(
              first_name,
              last_name,
              phone,
              avatar_url
            )
          ),
          event:events!jobs_event_id_fkey(
            id,
            title,
            event_type,
            event_date,
            location
          )
        `
        )
        .eq('id', jobId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw new Error(`Failed to fetch job: ${error.message}`);
      }

      // Get applications for this job
      const { data: applications } = await this.supabase
        .from('job_applications')
        .select(
          `
          *,
          contractor:users!job_applications_contractor_id_fkey(
            id,
            first_name,
            last_name,
            company_name,
            profile_photo_url,
            average_rating,
            review_count
          )
        `
        )
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      // Transform contact_person data to flatten the nested profile
      let contactPersonFlat = undefined;
      if (job.contact_person) {
        const cp = job.contact_person;
        const profile = Array.isArray(cp.profiles)
          ? cp.profiles[0]
          : cp.profiles;
        contactPersonFlat = {
          id: cp.id,
          email: cp.email,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
        };
      }

      return {
        ...job,
        contact_person: contactPersonFlat,
        applications: applications || [],
        analytics: {
          view_count: job.view_count || 0,
          application_count: job.application_count || 0,
          recent_views: 0, // This would need to be calculated separately
        },
      };
    } catch (error) {
      console.error('Get job error:', error);
      throw error;
    }
  }

  async getJobs(filters: GetJobsRequest = {}): Promise<{
    jobs: JobWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      const {
        job_type,
        service_category,
        location,
        budget_min,
        budget_max,
        is_remote,
        status = 'active',
        posted_by_user_id,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = filters;

      const offset = (page - 1) * limit;

      // Fetch jobs - only select needed fields for better performance
      // We'll enrich the data with user/event info separately if needed
      let query = this.supabase
        .from('jobs')
        .select(
          'id, title, description, job_type, service_category, location, coordinates, is_remote, budget_range_min, budget_range_max, status, special_requirements, contact_email, contact_phone, contact_person_id, response_preferences, timeline_start_date, timeline_end_date, event_id, posted_by_user_id, view_count, application_count, created_at, updated_at',
          { count: 'exact' }
        );

      // Apply filters
      if (job_type) {
        query = query.eq('job_type', job_type);
      }
      if (service_category) {
        query = query.eq('service_category', service_category);
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (budget_min !== undefined) {
        query = query.gte('budget_range_min', budget_min);
      }
      if (budget_max !== undefined) {
        query = query.lte('budget_range_max', budget_max);
      }
      if (is_remote !== undefined) {
        query = query.eq('is_remote', is_remote);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (posted_by_user_id) {
        query = query.eq('posted_by_user_id', posted_by_user_id);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: jobs, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      // If we have jobs, fetch the actual application counts
      let jobsWithCounts = jobs || [];
      if (jobsWithCounts.length > 0) {
        const jobIds = jobsWithCounts.map(job => job.id);

        // Count applications for each job - use admin client to bypass RLS
        const { data: applicationCounts, error: countError } =
          await supabaseAdmin
            .from('job_applications')
            .select('job_id')
            .in('job_id', jobIds);

        if (!countError && applicationCounts) {
          // Create a map of job_id to application count
          const countMap = applicationCounts.reduce(
            (acc, app) => {
              acc[app.job_id] = (acc[app.job_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          // Update jobs with actual application counts
          jobsWithCounts = jobsWithCounts.map(job => ({
            ...job,
            application_count: countMap[job.id] || 0,
          }));
        }
      }

      return {
        jobs: jobsWithCounts,
        total,
        page,
        limit,
        total_pages,
      };
    } catch (error) {
      console.error('Get jobs error:', error);
      throw error;
    }
  }

  async searchJobs(searchParams: JobSearchParams): Promise<{
    jobs: JobWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      const {
        q,
        job_type,
        service_category,
        location,
        budget_min,
        budget_max,
        is_remote,
        status = 'active',
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 20,
      } = searchParams;

      const offset = (page - 1) * limit;

      // Fetch jobs - only select needed fields for better performance
      // We'll enrich the data with user/event info separately if needed
      let query = this.supabase
        .from('jobs')
        .select(
          'id, title, description, job_type, service_category, location, coordinates, is_remote, budget_range_min, budget_range_max, status, special_requirements, contact_email, contact_phone, contact_person_id, response_preferences, timeline_start_date, timeline_end_date, event_id, posted_by_user_id, view_count, application_count, created_at, updated_at',
          { count: 'exact' }
        );

      // Apply text search
      if (q) {
        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`
        );
      }

      // Apply filters
      if (job_type) {
        query = query.eq('job_type', job_type);
      }
      if (service_category) {
        query = query.eq('service_category', service_category);
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (budget_min !== undefined) {
        query = query.gte('budget_range_min', budget_min);
      }
      if (budget_max !== undefined) {
        query = query.lte('budget_range_max', budget_max);
      }
      if (is_remote !== undefined) {
        query = query.eq('is_remote', is_remote);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: jobs, error, count } = await query;

      if (error) {
        throw new Error(`Failed to search jobs: ${error.message}`);
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        jobs: jobs || [],
        total,
        page,
        limit,
        total_pages,
      };
    } catch (error) {
      console.error('Search jobs error:', error);
      throw error;
    }
  }

  async createJobApplication(
    applicationData: CreateJobApplicationRequest,
    contractorId: string
  ): Promise<JobApplication> {
    try {
      const applicationInsert: JobApplicationInsert = {
        job_id: applicationData.job_id,
        application_message: applicationData.application_message,
        proposed_budget: applicationData.proposed_budget ?? null,
        attachments: applicationData.attachments || [],
        contractor_id: contractorId,
        status: 'pending',
      };

      const { data: application, error } = await this.supabase
        .from('job_applications')
        .insert(applicationInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create job application: ${error.message}`);
      }

      return application;
    } catch (error) {
      console.error('Create job application error:', error);
      throw error;
    }
  }

  async updateJobApplication(
    applicationId: string,
    applicationData: UpdateJobApplicationRequest,
    userId: string
  ): Promise<JobApplication> {
    try {
      // Verify ownership or job ownership
      const { data: existingApplication, error: fetchError } =
        await this.supabase
          .from('job_applications')
          .select(
            `
          contractor_id,
          job:jobs!job_applications_job_id_fkey(posted_by_user_id)
        `
          )
          .eq('id', applicationId)
          .single();

      if (fetchError || !existingApplication) {
        throw new Error('Application not found');
      }

      const isContractor = existingApplication.contractor_id === userId;
      const isJobPoster = existingApplication.job?.posted_by_user_id === userId;

      if (!isContractor && !isJobPoster) {
        throw new Error('Unauthorized to update this application');
      }

      const { data: application, error } = await this.supabase
        .from('job_applications')
        .update(applicationData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }

      return application;
    } catch (error) {
      console.error('Update job application error:', error);
      throw error;
    }
  }

  async deleteJobApplication(
    applicationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify ownership - only the contractor who submitted can delete
      const { data: existingApplication, error: fetchError } =
        await this.supabase
          .from('job_applications')
          .select('contractor_id, status')
          .eq('id', applicationId)
          .single();

      if (fetchError || !existingApplication) {
        throw new Error('Application not found');
      }

      if (existingApplication.contractor_id !== userId) {
        throw new Error('Unauthorized to delete this application');
      }

      // Only allow deleting pending applications
      if (existingApplication.status !== 'pending') {
        throw new Error('Can only delete pending applications');
      }

      const { error } = await this.supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        throw new Error(`Failed to delete application: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete job application error:', error);
      throw error;
    }
  }

  async getJobApplications(filters: GetJobApplicationsRequest = {}): Promise<{
    applications: JobApplicationWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      const { job_id, contractor_id, status, page = 1, limit = 20 } = filters;

      const offset = (page - 1) * limit;

      // Fetch applications with job details
      let query = this.supabase.from('job_applications').select(
        `
          *,
          job:jobs!job_applications_job_id_fkey(
            id,
            title,
            status
          )
        `,
        { count: 'exact' }
      );

      // Apply filters
      if (job_id) {
        query = query.eq('job_id', job_id);
      }
      if (contractor_id) {
        query = query.eq('contractor_id', contractor_id);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: applications, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch job applications: ${error.message}`);
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        applications: applications || [],
        total,
        page,
        limit,
        total_pages,
      };
    } catch (error) {
      console.error('Get job applications error:', error);
      throw error;
    }
  }

  async trackJobView(
    jobId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    try {
      const analyticsInsert: JobAnalyticsInsert = {
        job_id: jobId,
        viewer_user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      };

      const { error } = await this.supabase
        .from('job_analytics')
        .insert(analyticsInsert);

      if (error) {
        console.error('Failed to track job view:', error);
        // Don't throw error for analytics tracking failures
      }
    } catch (error) {
      console.error('Track job view error:', error);
      // Don't throw error for analytics tracking failures
    }
  }

  async getJobAnalytics(
    jobId: string,
    userId: string
  ): Promise<JobAnalyticsData> {
    try {
      // Verify ownership
      const { data: job, error: jobError } = await this.supabase
        .from('jobs')
        .select('posted_by_user_id')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        throw new Error('Job not found');
      }

      if (job.posted_by_user_id !== userId) {
        throw new Error('Unauthorized to view analytics for this job');
      }

      // Get analytics data
      const { data: analytics, error } = await this.supabase
        .from('job_analytics')
        .select('*')
        .eq('job_id', jobId)
        .order('view_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch job analytics: ${error.message}`);
      }

      // Calculate analytics
      const total_views = analytics?.length || 0;
      const unique_viewers = new Set(
        analytics?.map(a => a.viewer_user_id).filter(Boolean)
      ).size;
      const applications_received = job.application_count || 0;
      const conversion_rate =
        total_views > 0 ? (applications_received / total_views) * 100 : 0;

      // Group views by date
      const viewsByDate =
        analytics?.reduce(
          (acc, view) => {
            const date = new Date(view.view_date).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const views_by_date = Object.entries(viewsByDate).map(
        ([date, views]) => ({
          date,
          views,
        })
      );

      // Get top locations (this would need more sophisticated analysis)
      const top_locations =
        analytics?.reduce(
          (acc, view) => {
            // This is a simplified version - in reality you'd need to analyze IP addresses
            const location = 'Unknown'; // Would need geolocation service
            acc[location] = (acc[location] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const top_locations_array = Object.entries(top_locations).map(
        ([location, views]) => ({
          location,
          views,
        })
      );

      return {
        total_views,
        unique_viewers,
        applications_received,
        views_by_date: views_by_date,
        top_locations: top_locations_array,
        conversion_rate,
      };
    } catch (error) {
      console.error('Get job analytics error:', error);
      throw error;
    }
  }

  async getUserJobs(
    userId: string,
    filters: Omit<GetJobsRequest, 'posted_by_user_id'> = {}
  ): Promise<{
    jobs: JobWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    return this.getJobs({
      ...filters,
      posted_by_user_id: userId,
    });
  }

  async getUserApplications(
    userId: string,
    filters: Omit<GetJobApplicationsRequest, 'contractor_id'> = {}
  ): Promise<{
    applications: JobApplicationWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    return this.getJobApplications({
      ...filters,
      contractor_id: userId,
    });
  }
}
