import { Database } from './database';

// Base types from database
export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export type JobApplication =
  Database['public']['Tables']['job_applications']['Row'];
export type JobApplicationInsert =
  Database['public']['Tables']['job_applications']['Insert'];
export type JobApplicationUpdate =
  Database['public']['Tables']['job_applications']['Update'];

export type JobAnalytics = Database['public']['Tables']['job_analytics']['Row'];
export type JobAnalyticsInsert =
  Database['public']['Tables']['job_analytics']['Insert'];

// Extended types for the job system
export interface JobFormData {
  title: string;
  description: string;
  service_category: string;
  budget_range_min?: number;
  budget_range_max?: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  is_remote: boolean;
  special_requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  response_preferences?: 'email' | 'phone' | 'platform';
  timeline_start_date?: string;
  timeline_end_date?: string;
  event_id?: string;
  // Internal job specific fields
  internal_job_category?: InternalJobCategory;
  skill_requirements?: string[];
  experience_level?: ExperienceLevel;
  payment_terms?: string;
  work_arrangement?: WorkArrangement;
}

export interface JobApplicationFormData {
  cover_letter: string;
  proposed_budget?: number;
  availability_start_date?: string;
  availability_end_date?: string;
  attachments?: string[];
}

export interface JobFilters {
  job_type?: 'event_manager' | 'contractor_internal';
  service_category?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_remote?: boolean;
  status?: JobStatus;
  posted_by_user_id?: string;
  page?: number;
  limit?: number;
}

export interface JobSearchParams {
  q?: string;
  job_type?: 'event_manager' | 'contractor_internal';
  service_category?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_remote?: boolean;
  status?: JobStatus;
  sort_by?: 'created_at' | 'budget_range_min' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobWithDetails extends Job {
  posted_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
    event_type: string;
    event_date: string;
  };
  applications?: JobApplicationWithDetails[];
  analytics?: {
    view_count: number;
    application_count: number;
    recent_views: number;
  };
}

export interface JobApplicationWithDetails extends JobApplication {
  contractor?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    profile_photo_url?: string;
    average_rating: number;
    review_count: number;
  };
  job?: {
    id: string;
    title: string;
    status: JobStatus;
  };
}

export interface JobAnalyticsData {
  total_views: number;
  unique_viewers: number;
  applications_received: number;
  views_by_date: Array<{
    date: string;
    views: number;
  }>;
  top_locations: Array<{
    location: string;
    views: number;
  }>;
  conversion_rate: number;
}

// Job status enum
export const JOB_STATUS = {
  ACTIVE: 'active',
  FILLED: 'filled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// Job type enum
export const JOB_TYPES = {
  EVENT_MANAGER: 'event_manager',
  CONTRACTOR_INTERNAL: 'contractor_internal',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// Internal job type categories
export const INTERNAL_JOB_CATEGORIES = {
  CASUAL_WORK: 'casual_work',
  SUBCONTRACTING: 'subcontracting',
  PARTNERSHIPS: 'partnerships',
} as const;

export type InternalJobCategory =
  (typeof INTERNAL_JOB_CATEGORIES)[keyof typeof INTERNAL_JOB_CATEGORIES];

// Experience levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  INTERMEDIATE: 'intermediate',
  SENIOR: 'senior',
  EXPERT: 'expert',
} as const;

export type ExperienceLevel =
  (typeof EXPERIENCE_LEVELS)[keyof typeof EXPERIENCE_LEVELS];

// Work arrangements
export const WORK_ARRANGEMENTS = {
  REMOTE: 'remote',
  ONSITE: 'onsite',
  HYBRID: 'hybrid',
} as const;

export type WorkArrangement =
  (typeof WORK_ARRANGEMENTS)[keyof typeof WORK_ARRANGEMENTS];

// Service categories enum (reusing from events)
export const JOB_SERVICE_CATEGORIES = {
  CATERING: 'catering',
  PHOTOGRAPHY: 'photography',
  MUSIC: 'music',
  DECORATIONS: 'decorations',
  VENUE: 'venue',
  ENTERTAINMENT: 'entertainment',
  TRANSPORTATION: 'transportation',
  AV_EQUIPMENT: 'av_equipment',
  SECURITY: 'security',
  CLEANING: 'cleaning',
  FLOWERS: 'flowers',
  CAKE: 'cake',
  EVENT_PLANNING: 'event_planning',
  COORDINATION: 'coordination',
  OTHER: 'other',
} as const;

export type JobServiceCategory =
  (typeof JOB_SERVICE_CATEGORIES)[keyof typeof JOB_SERVICE_CATEGORIES];

// Response preferences enum
export const RESPONSE_PREFERENCES = {
  EMAIL: 'email',
  PHONE: 'phone',
  PLATFORM: 'platform',
} as const;

export type ResponsePreference =
  (typeof RESPONSE_PREFERENCES)[keyof typeof RESPONSE_PREFERENCES];

// Application status enum
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// API request/response types
export interface CreateJobRequest {
  title: string;
  description: string;
  job_type?: JobType; // Optional - will be set automatically based on user role
  service_category: JobServiceCategory;
  budget_range_min?: number;
  budget_range_max?: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  is_remote: boolean;
  special_requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  response_preferences?: ResponsePreference;
  timeline_start_date?: string;
  timeline_end_date?: string;
  event_id?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  service_category?: JobServiceCategory;
  budget_range_min?: number;
  budget_range_max?: number;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  is_remote?: boolean;
  special_requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  response_preferences?: ResponsePreference;
  timeline_start_date?: string;
  timeline_end_date?: string;
  status?: JobStatus;
}

export interface CreateJobApplicationRequest {
  job_id: string;
  cover_letter: string;
  proposed_budget?: number;
  availability_start_date?: string;
  availability_end_date?: string;
  attachments?: string[];
}

export interface UpdateJobApplicationRequest {
  cover_letter?: string;
  proposed_budget?: number;
  availability_start_date?: string;
  availability_end_date?: string;
  attachments?: string[];
  status?: ApplicationStatus;
}

export interface GetJobsRequest {
  job_type?: JobType;
  service_category?: JobServiceCategory;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_remote?: boolean;
  status?: JobStatus;
  posted_by_user_id?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'budget_range_min' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface GetJobApplicationsRequest {
  job_id?: string;
  contractor_id?: string;
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}

export interface JobListResponse {
  jobs: JobWithDetails[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface JobApplicationListResponse {
  applications: JobApplicationWithDetails[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface JobAnalyticsResponse {
  analytics: JobAnalyticsData;
  success: boolean;
}

export interface JobCreationResponse {
  job: Job;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export interface JobApplicationResponse {
  application: JobApplication;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Job posting guidelines
export interface JobPostingGuidelines {
  title: {
    min_length: number;
    max_length: number;
    tips: string[];
  };
  description: {
    min_length: number;
    max_length: number;
    tips: string[];
  };
  budget: {
    min_amount: number;
    max_amount: number;
    tips: string[];
  };
  location: {
    required: boolean;
    tips: string[];
  };
  timeline: {
    required: boolean;
    tips: string[];
  };
  contact_info: {
    required: boolean;
    tips: string[];
  };
}

export const JOB_POSTING_GUIDELINES: JobPostingGuidelines = {
  title: {
    min_length: 10,
    max_length: 200,
    tips: [
      'Be specific about the role and requirements',
      'Include the event type or service needed',
      'Use action words to make it engaging',
    ],
  },
  description: {
    min_length: 50,
    max_length: 5000,
    tips: [
      'Provide detailed information about the job',
      'Include specific requirements and expectations',
      'Mention any special considerations or constraints',
      'Be clear about deliverables and timeline',
    ],
  },
  budget: {
    min_amount: 0,
    max_amount: 1000000,
    tips: [
      'Set realistic budget ranges',
      'Consider market rates for the service',
      'Be transparent about budget constraints',
    ],
  },
  location: {
    required: true,
    tips: [
      'Be specific about the location',
      'Include service area if applicable',
      'Mention if remote work is acceptable',
    ],
  },
  timeline: {
    required: true,
    tips: [
      'Provide clear start and end dates',
      'Include any important milestones',
      'Be realistic about timeframes',
    ],
  },
  contact_info: {
    required: true,
    tips: [
      'Provide reliable contact information',
      'Specify preferred communication method',
      'Include business hours if applicable',
    ],
  },
};
