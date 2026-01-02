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
          facebook_url: string | null;
          instagram_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          youtube_url: string | null;
          tiktok_url: string | null;
          verification_date: string | null;
          logo_url: string | null;
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
          facebook_url?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          youtube_url?: string | null;
          tiktok_url?: string | null;
          verification_date?: string | null;
          logo_url?: string | null;
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
          facebook_url?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          youtube_url?: string | null;
          tiktok_url?: string | null;
          verification_date?: string | null;
          logo_url?: string | null;
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
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
          billing_cycle: 'monthly' | 'yearly' | '2year';
          price: number;
          start_date: string;
          end_date: string | null;
          trial_end_date: string | null;
          promotional_code: string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          status?: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
          billing_cycle?: 'monthly' | 'yearly' | '2year';
          price: number;
          start_date?: string;
          end_date?: string | null;
          trial_end_date?: string | null;
          promotional_code?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'essential' | 'showcase' | 'spotlight';
          status?: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
          billing_cycle?: 'monthly' | 'yearly' | '2year';
          price?: number;
          start_date?: string;
          end_date?: string | null;
          trial_end_date?: string | null;
          promotional_code?: string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      promotional_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          tier_applicable: ('essential' | 'showcase' | 'spotlight')[];
          usage_limit: number | null;
          usage_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          tier_applicable?: ('essential' | 'showcase' | 'spotlight')[];
          usage_limit?: number | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: 'percentage' | 'fixed_amount';
          discount_value?: number;
          tier_applicable?: ('essential' | 'showcase' | 'spotlight')[];
          usage_limit?: number | null;
          usage_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      subscription_features: {
        Row: {
          id: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          feature_name: string;
          feature_description: string | null;
          is_included: boolean;
          limit_value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          feature_name: string;
          feature_description?: string | null;
          is_included?: boolean;
          limit_value?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tier?: 'essential' | 'showcase' | 'spotlight';
          feature_name?: string;
          feature_description?: string | null;
          is_included?: boolean;
          limit_value?: number | null;
          created_at?: string;
        };
      };
      subscription_pricing: {
        Row: {
          id: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          billing_cycle: 'monthly' | 'yearly' | '2year';
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tier: 'essential' | 'showcase' | 'spotlight';
          billing_cycle: 'monthly' | 'yearly' | '2year';
          price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tier?: 'essential' | 'showcase' | 'spotlight';
          billing_cycle?: 'monthly' | 'yearly' | '2year';
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_analytics: {
        Row: {
          id: string;
          subscription_id: string;
          event_type: string;
          event_data: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          event_type: string;
          event_data?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          event_type?: string;
          event_data?: any | null;
          created_at?: string;
        };
      };
      inquiries: {
        Row: {
          id: string;
          contractor_id: string;
          event_manager_id: string;
          event_id: string | null;
          inquiry_type: 'general' | 'quote_request' | 'availability' | 'custom';
          subject: string;
          message: string;
          event_details: any | null;
          status: 'sent' | 'viewed' | 'responded' | 'quoted' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          event_manager_id: string;
          event_id?: string | null;
          inquiry_type?:
            | 'general'
            | 'quote_request'
            | 'availability'
            | 'custom';
          subject: string;
          message: string;
          event_details?: any | null;
          status?: 'sent' | 'viewed' | 'responded' | 'quoted' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          event_manager_id?: string;
          event_id?: string | null;
          inquiry_type?:
            | 'general'
            | 'quote_request'
            | 'availability'
            | 'custom';
          subject?: string;
          message?: string;
          event_details?: any | null;
          status?: 'sent' | 'viewed' | 'responded' | 'quoted' | 'closed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
        };
      };
      inquiry_responses: {
        Row: {
          id: string;
          inquiry_id: string;
          responder_id: string;
          response_type: 'reply' | 'quote' | 'decline' | 'question';
          message: string;
          attachments: any | null;
          is_template: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          responder_id: string;
          response_type?: 'reply' | 'quote' | 'decline' | 'question';
          message: string;
          attachments?: any | null;
          is_template?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          inquiry_id?: string;
          responder_id?: string;
          response_type?: 'reply' | 'quote' | 'decline' | 'question';
          message?: string;
          attachments?: any | null;
          is_template?: boolean;
          created_at?: string;
        };
      };
      inquiry_templates: {
        Row: {
          id: string;
          user_id: string;
          template_name: string;
          template_content: string;
          template_type:
            | 'general'
            | 'quote_request'
            | 'availability'
            | 'follow_up';
          is_public: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_name: string;
          template_content: string;
          template_type?:
            | 'general'
            | 'quote_request'
            | 'availability'
            | 'follow_up';
          is_public?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_name?: string;
          template_content?: string;
          template_type?:
            | 'general'
            | 'quote_request'
            | 'availability'
            | 'follow_up';
          is_public?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inquiry_notifications: {
        Row: {
          id: string;
          inquiry_id: string;
          recipient_id: string;
          notification_type:
            | 'new_inquiry'
            | 'inquiry_response'
            | 'status_update'
            | 'reminder';
          subject: string;
          message: string;
          is_read: boolean;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          recipient_id: string;
          notification_type:
            | 'new_inquiry'
            | 'inquiry_response'
            | 'status_update'
            | 'reminder';
          subject: string;
          message: string;
          is_read?: boolean;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          inquiry_id?: string;
          recipient_id?: string;
          notification_type?:
            | 'new_inquiry'
            | 'inquiry_response'
            | 'status_update'
            | 'reminder';
          subject?: string;
          message?: string;
          is_read?: boolean;
          sent_at?: string;
          read_at?: string | null;
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
      subscription_tier: 'essential' | 'showcase' | 'spotlight';
      subscription_status:
        | 'active'
        | 'inactive'
        | 'cancelled'
        | 'expired'
        | 'trial';
      billing_cycle: 'monthly' | 'yearly' | '2year';
      discount_type: 'percentage' | 'fixed_amount';
      enquiry_status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
    };
    jobs: {
      Row: {
        id: string;
        title: string;
        description: string;
        job_type: 'event_manager' | 'contractor_internal';
        service_category: string;
        budget_range_min: number | null;
        budget_range_max: number | null;
        location: string;
        coordinates: any | null;
        is_remote: boolean;
        status: 'active' | 'filled' | 'completed' | 'cancelled';
        posted_by_user_id: string;
        event_id: string | null;
        special_requirements: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        response_preferences: 'email' | 'phone' | 'platform' | null;
        timeline_start_date: string | null;
        timeline_end_date: string | null;
        view_count: number;
        application_count: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        title: string;
        description: string;
        job_type: 'event_manager' | 'contractor_internal';
        service_category: string;
        budget_range_min?: number | null;
        budget_range_max?: number | null;
        location: string;
        coordinates?: any | null;
        is_remote?: boolean;
        status?: 'active' | 'filled' | 'completed' | 'cancelled';
        posted_by_user_id: string;
        event_id?: string | null;
        special_requirements?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        response_preferences?: 'email' | 'phone' | 'platform' | null;
        timeline_start_date?: string | null;
        timeline_end_date?: string | null;
        view_count?: number;
        application_count?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        title?: string;
        description?: string;
        job_type?: 'event_manager' | 'contractor_internal';
        service_category?: string;
        budget_range_min?: number | null;
        budget_range_max?: number | null;
        location?: string;
        coordinates?: any | null;
        is_remote?: boolean;
        status?: 'active' | 'filled' | 'completed' | 'cancelled';
        posted_by_user_id?: string;
        event_id?: string | null;
        special_requirements?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        response_preferences?: 'email' | 'phone' | 'platform' | null;
        timeline_start_date?: string | null;
        timeline_end_date?: string | null;
        view_count?: number;
        application_count?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
    job_applications: {
      Row: {
        id: string;
        job_id: string;
        contractor_id: string;
        application_message: string;
        status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
        attachments: any;
        proposed_budget: number | null;
        availability_start_date: string | null;
        availability_end_date: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        job_id: string;
        contractor_id: string;
        application_message: string;
        status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
        attachments?: any;
        proposed_budget?: number | null;
        availability_start_date?: string | null;
        availability_end_date?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        job_id?: string;
        contractor_id?: string;
        application_message?: string;
        status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
        attachments?: any;
        proposed_budget?: number | null;
        availability_start_date?: string | null;
        availability_end_date?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    job_analytics: {
      Row: {
        id: string;
        job_id: string;
        view_date: string;
        viewer_user_id: string | null;
        ip_address: string | null;
        user_agent: string | null;
        referrer: string | null;
      };
      Insert: {
        id?: string;
        job_id: string;
        view_date?: string;
        viewer_user_id?: string | null;
        ip_address?: string | null;
        user_agent?: string | null;
        referrer?: string | null;
      };
      Update: {
        id?: string;
        job_id?: string;
        view_date?: string;
        viewer_user_id?: string | null;
        ip_address?: string | null;
        user_agent?: string | null;
        referrer?: string | null;
      };
    };
    feature_request_categories: {
      Row: {
        id: string;
        name: string;
        description: string | null;
        color: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        description?: string | null;
        color?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        description?: string | null;
        color?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    feature_request_tags: {
      Row: {
        id: string;
        name: string;
        usage_count: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        usage_count?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        usage_count?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
    feature_requests: {
      Row: {
        id: string;
        user_id: string;
        title: string;
        description: string;
        category_id: string | null;
        status:
          | 'submitted'
          | 'under_review'
          | 'planned'
          | 'in_development'
          | 'completed'
          | 'rejected';
        priority: 'low' | 'medium' | 'high' | 'urgent';
        vote_count: number;
        view_count: number;
        is_public: boolean;
        is_featured: boolean;
        admin_notes: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        title: string;
        description: string;
        category_id?: string | null;
        status?:
          | 'submitted'
          | 'under_review'
          | 'planned'
          | 'in_development'
          | 'completed'
          | 'rejected';
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        vote_count?: number;
        view_count?: number;
        is_public?: boolean;
        is_featured?: boolean;
        admin_notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        title?: string;
        description?: string;
        category_id?: string | null;
        status?:
          | 'submitted'
          | 'under_review'
          | 'planned'
          | 'in_development'
          | 'completed'
          | 'rejected';
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        vote_count?: number;
        view_count?: number;
        is_public?: boolean;
        is_featured?: boolean;
        admin_notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    feature_request_tag_assignments: {
      Row: {
        id: string;
        feature_request_id: string;
        tag_id: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        feature_request_id: string;
        tag_id: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        feature_request_id?: string;
        tag_id?: string;
        created_at?: string;
      };
    };
    feature_request_votes: {
      Row: {
        id: string;
        feature_request_id: string;
        user_id: string;
        vote_type: 'upvote' | 'downvote';
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        feature_request_id: string;
        user_id: string;
        vote_type: 'upvote' | 'downvote';
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        feature_request_id?: string;
        user_id?: string;
        vote_type?: 'upvote' | 'downvote';
        created_at?: string;
        updated_at?: string;
      };
    };
    feature_request_status_history: {
      Row: {
        id: string;
        feature_request_id: string;
        status: string;
        changed_by: string;
        comments: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        feature_request_id: string;
        status: string;
        changed_by: string;
        comments?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        feature_request_id?: string;
        status?: string;
        changed_by?: string;
        comments?: string | null;
        created_at?: string;
      };
    };
    feature_request_comments: {
      Row: {
        id: string;
        feature_request_id: string;
        user_id: string;
        content: string;
        is_admin_comment: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        feature_request_id: string;
        user_id: string;
        content: string;
        is_admin_comment?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        feature_request_id?: string;
        user_id?: string;
        content?: string;
        is_admin_comment?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}
