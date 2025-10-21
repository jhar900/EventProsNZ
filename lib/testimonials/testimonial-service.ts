import { createClient } from '@/lib/supabase/client';

export interface Testimonial {
  id: string;
  contractor_id: string;
  event_manager_id: string;
  inquiry_id: string;
  rating: number;
  review_text: string;
  is_verified: boolean;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    profile_photo_url?: string;
  };
  event_manager?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  inquiry?: {
    id: string;
    subject: string;
    status: string;
    created_at: string;
  };
  response?: {
    id: string;
    response_text: string;
    is_approved: boolean;
    is_public: boolean;
    created_at: string;
  };
}

export interface TestimonialResponse {
  id: string;
  testimonial_id: string;
  contractor_id: string;
  response_text: string;
  is_approved: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingSummary {
  contractor_id: string;
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  last_updated: string;
}

export interface TestimonialFilters {
  contractor_id?: string;
  event_manager_id?: string;
  is_approved?: boolean;
  is_public?: boolean;
  rating?: number;
  page?: number;
  limit?: number;
}

export interface CreateTestimonialData {
  contractor_id: string;
  inquiry_id: string;
  rating: number;
  review_text: string;
}

export interface UpdateTestimonialData {
  rating?: number;
  review_text?: string;
}

export interface ModerationData {
  testimonial_id: string;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_notes?: string;
}

export interface ResponseData {
  response_text: string;
}

export class TestimonialService {
  private supabase = createClient();

  async createTestimonial(data: CreateTestimonialData): Promise<Testimonial> {
    const response = await fetch('/api/testimonials/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create testimonial');
    }

    const result = await response.json();
    return result.testimonial;
  }

  async getTestimonials(filters: TestimonialFilters = {}): Promise<{
    testimonials: Testimonial[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/testimonials?${params}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch testimonials');
    }

    return await response.json();
  }

  async getTestimonial(id: string): Promise<{
    testimonial: Testimonial;
    response: TestimonialResponse | null;
  }> {
    const response = await fetch(`/api/testimonials/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch testimonial');
    }

    return await response.json();
  }

  async updateTestimonial(
    id: string,
    data: UpdateTestimonialData
  ): Promise<Testimonial> {
    const response = await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update testimonial');
    }

    const result = await response.json();
    return result.testimonial;
  }

  async deleteTestimonial(id: string): Promise<void> {
    const response = await fetch(`/api/testimonials/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete testimonial');
    }
  }

  async getTestimonialsForDisplay(contractorId: string): Promise<{
    testimonials: Testimonial[];
    rating_summary: RatingSummary;
  }> {
    const response = await fetch(
      `/api/testimonials/display?contractor_id=${contractorId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || 'Failed to fetch testimonials for display'
      );
    }

    return await response.json();
  }

  async getRatingSummary(contractorId: string): Promise<RatingSummary> {
    const response = await fetch(
      `/api/testimonials/display/summary?contractor_id=${contractorId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch rating summary');
    }

    const result = await response.json();
    return result.rating_summary;
  }

  async checkEligibility(contractorId: string): Promise<{
    eligible: boolean;
    inquiry_id?: string;
    contractor_name?: string;
    reason?: string;
  }> {
    const response = await fetch(
      `/api/testimonials/create/eligibility?contractor_id=${contractorId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check eligibility');
    }

    return await response.json();
  }

  async moderateTestimonial(data: ModerationData): Promise<void> {
    const response = await fetch('/api/testimonials/moderation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to moderate testimonial');
    }
  }

  async approveTestimonial(
    id: string,
    isApproved: boolean,
    isPublic?: boolean
  ): Promise<Testimonial> {
    const response = await fetch(`/api/testimonials/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_approved: isApproved,
        is_public: isPublic,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve testimonial');
    }

    const result = await response.json();
    return result.testimonial;
  }

  async createResponse(
    testimonialId: string,
    data: ResponseData
  ): Promise<TestimonialResponse> {
    const response = await fetch(
      `/api/testimonials/${testimonialId}/response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create response');
    }

    const result = await response.json();
    return result.response;
  }

  async getResponse(
    testimonialId: string
  ): Promise<TestimonialResponse | null> {
    const response = await fetch(`/api/testimonials/${testimonialId}/response`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch response');
    }

    const result = await response.json();
    return result.response;
  }

  async updateResponse(
    id: string,
    data: Partial<ResponseData & { is_approved?: boolean; is_public?: boolean }>
  ): Promise<TestimonialResponse> {
    const response = await fetch(`/api/testimonials/response/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update response');
    }

    const result = await response.json();
    return result.response;
  }

  async updateRatingSummary(contractorId: string): Promise<RatingSummary> {
    const response = await fetch('/api/testimonials/rating/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractor_id: contractorId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update rating summary');
    }

    const result = await response.json();
    return result.rating_summary;
  }
}

export const testimonialService = new TestimonialService();
