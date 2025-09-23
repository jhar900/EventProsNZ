export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'event_manager' | 'contractor' | 'admin';
          is_verified: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'event_manager' | 'contractor' | 'admin';
          is_verified?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'event_manager' | 'contractor' | 'admin';
          is_verified?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          address: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          address?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          description: string | null;
          website: string | null;
          location: string | null;
          service_categories: string[];
          average_rating: number;
          review_count: number;
          is_verified: boolean;
          subscription_tier: 'essential' | 'professional' | 'enterprise';
          business_address: string | null;
          nzbn: string | null;
          service_areas: string[] | null;
          social_links: any | null;
          verification_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          description?: string | null;
          website?: string | null;
          location?: string | null;
          service_categories?: string[];
          average_rating?: number;
          review_count?: number;
          is_verified?: boolean;
          subscription_tier?: 'essential' | 'professional' | 'enterprise';
          business_address?: string | null;
          nzbn?: string | null;
          service_areas?: string[] | null;
          social_links?: any | null;
          verification_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          description?: string | null;
          website?: string | null;
          location?: string | null;
          service_categories?: string[];
          average_rating?: number;
          review_count?: number;
          is_verified?: boolean;
          subscription_tier?: 'essential' | 'professional' | 'enterprise';
          business_address?: string | null;
          nzbn?: string | null;
          service_areas?: string[] | null;
          social_links?: any | null;
          verification_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          event_manager_id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          budget_min: number | null;
          budget_max: number | null;
          event_type: string | null;
          duration_hours: number | null;
          attendee_count: number | null;
          budget_total: number | null;
          location_data: any | null;
          special_requirements: string | null;
          status:
            | 'draft'
            | 'planning'
            | 'confirmed'
            | 'in_progress'
            | 'completed'
            | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_manager_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          location?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          event_type?: string | null;
          duration_hours?: number | null;
          attendee_count?: number | null;
          budget_total?: number | null;
          location_data?: any | null;
          special_requirements?: string | null;
          status?:
            | 'draft'
            | 'planning'
            | 'confirmed'
            | 'in_progress'
            | 'completed'
            | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_manager_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          location?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          event_type?: string | null;
          duration_hours?: number | null;
          attendee_count?: number | null;
          budget_total?: number | null;
          location_data?: any | null;
          special_requirements?: string | null;
          status?:
            | 'draft'
            | 'planning'
            | 'confirmed'
            | 'in_progress'
            | 'completed'
            | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      enquiries: {
        Row: {
          id: string;
          event_id: string;
          contractor_id: string;
          message: string;
          status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contractor_id: string;
          message: string;
          status?: 'pending' | 'accepted' | 'declined' | 'withdrawn';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contractor_id?: string;
          message?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'withdrawn';
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          event_manager_id: string;
          title: string;
          description: string;
          requirements: string | null;
          budget_min: number | null;
          budget_max: number | null;
          deadline: string | null;
          status: 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_manager_id: string;
          title: string;
          description: string;
          requirements?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_manager_id?: string;
          title?: string;
          description?: string;
          requirements?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      testimonials: {
        Row: {
          id: string;
          contractor_id: string;
          event_manager_id: string;
          rating: number;
          comment: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          event_manager_id: string;
          rating: number;
          comment?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          event_manager_id?: string;
          rating?: number;
          comment?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          service_type: string;
          description: string | null;
          price_range_min: number | null;
          price_range_max: number | null;
          availability: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type: string;
          description?: string | null;
          price_range_min?: number | null;
          price_range_max?: number | null;
          availability?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_type?: string;
          description?: string | null;
          price_range_min?: number | null;
          price_range_max?: number | null;
          availability?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolio: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          video_url: string | null;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contractor_testimonials: {
        Row: {
          id: string;
          contractor_id: string;
          client_name: string;
          client_email: string | null;
          rating: number | null;
          comment: string | null;
          event_title: string | null;
          event_date: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          client_name: string;
          client_email?: string | null;
          rating?: number | null;
          comment?: string | null;
          event_title?: string | null;
          event_date?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          client_name?: string;
          client_email?: string | null;
          rating?: number | null;
          comment?: string | null;
          event_title?: string | null;
          event_date?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      contractor_onboarding_status: {
        Row: {
          id: string;
          user_id: string;
          step1_completed: boolean;
          step2_completed: boolean;
          step3_completed: boolean;
          step4_completed: boolean;
          is_submitted: boolean;
          submission_date: string | null;
          approval_status: 'pending' | 'approved' | 'rejected';
          approval_date: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          step1_completed?: boolean;
          step2_completed?: boolean;
          step3_completed?: boolean;
          step4_completed?: boolean;
          is_submitted?: boolean;
          submission_date?: string | null;
          approval_status?: 'pending' | 'approved' | 'rejected';
          approval_date?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          step1_completed?: boolean;
          step2_completed?: boolean;
          step3_completed?: boolean;
          step4_completed?: boolean;
          is_submitted?: boolean;
          submission_date?: string | null;
          approval_status?: 'pending' | 'approved' | 'rejected';
          approval_date?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_templates: {
        Row: {
          id: string;
          name: string;
          event_type: string;
          template_data: any;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_type: string;
          template_data: any;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_type?: string;
          template_data?: any;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_versions: {
        Row: {
          id: string;
          event_id: string;
          version_number: number;
          changes: any;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          version_number: number;
          changes: any;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          version_number?: number;
          changes?: any;
          created_by?: string | null;
          created_at?: string;
        };
      };
      event_drafts: {
        Row: {
          id: string;
          user_id: string;
          event_data: any;
          step_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_data: any;
          step_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_data?: any;
          step_number?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_service_requirements: {
        Row: {
          id: string;
          event_id: string;
          service_category: string;
          service_type: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high';
          estimated_budget: number | null;
          is_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          service_category: string;
          service_type: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          estimated_budget?: number | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          service_category?: string;
          service_type?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          estimated_budget?: number | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_contractor_matches: {
        Row: {
          id: string;
          event_id: string;
          contractor_id: string;
          service_requirement_id: string | null;
          match_score: number;
          status: 'pending' | 'contacted' | 'interested' | 'declined' | 'hired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contractor_id: string;
          service_requirement_id?: string | null;
          match_score?: number;
          status?:
            | 'pending'
            | 'contacted'
            | 'interested'
            | 'declined'
            | 'hired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contractor_id?: string;
          service_requirement_id?: string | null;
          match_score?: number;
          status?:
            | 'pending'
            | 'contacted'
            | 'interested'
            | 'declined'
            | 'hired';
          created_at?: string;
          updated_at?: string;
        };
      };
      event_notifications: {
        Row: {
          id: string;
          event_id: string;
          contractor_id: string;
          notification_type:
            | 'event_created'
            | 'event_updated'
            | 'event_cancelled'
            | 'service_requirement_added'
            | 'service_requirement_updated';
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contractor_id: string;
          notification_type:
            | 'event_created'
            | 'event_updated'
            | 'event_cancelled'
            | 'service_requirement_added'
            | 'service_requirement_updated';
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          contractor_id?: string;
          notification_type?:
            | 'event_created'
            | 'event_updated'
            | 'event_cancelled'
            | 'service_requirement_added'
            | 'service_requirement_updated';
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Enums: {
      user_role: 'event_manager' | 'contractor' | 'admin';
      event_status:
        | 'planning'
        | 'confirmed'
        | 'in_progress'
        | 'completed'
        | 'cancelled';
      job_status: 'open' | 'in_progress' | 'completed' | 'cancelled';
      subscription_tier: 'essential' | 'professional' | 'enterprise';
      enquiry_status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
    };
  };
}
