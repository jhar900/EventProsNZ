import { testimonialService } from '@/lib/testimonials/testimonial-service';

// Mock fetch
global.fetch = jest.fn();

describe('TestimonialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTestimonial', () => {
    it('should create a testimonial successfully', async () => {
      const mockTestimonial = {
        id: 'test-id',
        contractor_id: 'contractor-id',
        event_manager_id: 'manager-id',
        inquiry_id: 'inquiry-id',
        rating: 5,
        review_text: 'Great service!',
        is_verified: true,
        is_approved: false,
        is_public: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonial: mockTestimonial }),
      });

      const result = await testimonialService.createTestimonial({
        contractor_id: 'contractor-id',
        inquiry_id: 'inquiry-id',
        rating: 5,
        review_text: 'Great service!',
      });

      expect(result).toEqual(mockTestimonial);
      expect(global.fetch).toHaveBeenCalledWith('/api/testimonials/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: 'contractor-id',
          inquiry_id: 'inquiry-id',
          rating: 5,
          review_text: 'Great service!',
        }),
      });
    });

    it('should throw error when creation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Creation failed' }),
      });

      await expect(
        testimonialService.createTestimonial({
          contractor_id: 'contractor-id',
          inquiry_id: 'inquiry-id',
          rating: 5,
          review_text: 'Great service!',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getTestimonials', () => {
    it('should fetch testimonials with filters', async () => {
      const mockResponse = {
        testimonials: [
          {
            id: 'test-id',
            contractor_id: 'contractor-id',
            rating: 5,
            review_text: 'Great service!',
            is_approved: true,
            is_public: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await testimonialService.getTestimonials({
        contractor_id: 'contractor-id',
        is_approved: true,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials?contractor_id=contractor-id&is_approved=true&page=1&limit=10'
      );
    });
  });

  describe('getTestimonial', () => {
    it('should fetch a single testimonial', async () => {
      const mockResponse = {
        testimonial: {
          id: 'test-id',
          contractor_id: 'contractor-id',
          rating: 5,
          review_text: 'Great service!',
          is_approved: true,
          is_public: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        response: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await testimonialService.getTestimonial('test-id');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/testimonials/test-id');
    });
  });

  describe('updateTestimonial', () => {
    it('should update a testimonial successfully', async () => {
      const mockTestimonial = {
        id: 'test-id',
        contractor_id: 'contractor-id',
        rating: 4,
        review_text: 'Updated review',
        is_approved: false,
        is_public: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonial: mockTestimonial }),
      });

      const result = await testimonialService.updateTestimonial('test-id', {
        rating: 4,
        review_text: 'Updated review',
      });

      expect(result).toEqual(mockTestimonial);
      expect(global.fetch).toHaveBeenCalledWith('/api/testimonials/test-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 4,
          review_text: 'Updated review',
        }),
      });
    });
  });

  describe('deleteTestimonial', () => {
    it('should delete a testimonial successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await testimonialService.deleteTestimonial('test-id');

      expect(global.fetch).toHaveBeenCalledWith('/api/testimonials/test-id', {
        method: 'DELETE',
      });
    });
  });

  describe('getTestimonialsForDisplay', () => {
    it('should fetch testimonials for display', async () => {
      const mockResponse = {
        testimonials: [
          {
            id: 'test-id',
            contractor_id: 'contractor-id',
            rating: 5,
            review_text: 'Great service!',
            is_approved: true,
            is_public: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        rating_summary: {
          contractor_id: 'contractor-id',
          average_rating: 5.0,
          total_reviews: 1,
          rating_breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
          last_updated: '2024-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result =
        await testimonialService.getTestimonialsForDisplay('contractor-id');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/display?contractor_id=contractor-id'
      );
    });
  });

  describe('getRatingSummary', () => {
    it('should fetch rating summary', async () => {
      const mockSummary = {
        contractor_id: 'contractor-id',
        average_rating: 4.5,
        total_reviews: 10,
        rating_breakdown: { '1': 0, '2': 0, '3': 1, '4': 3, '5': 6 },
        last_updated: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating_summary: mockSummary }),
      });

      const result = await testimonialService.getRatingSummary('contractor-id');

      expect(result).toEqual(mockSummary);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/display/summary?contractor_id=contractor-id'
      );
    });
  });

  describe('checkEligibility', () => {
    it('should check eligibility successfully', async () => {
      const mockEligibility = {
        eligible: true,
        inquiry_id: 'inquiry-id',
        contractor_name: 'Test Contractor',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEligibility,
      });

      const result = await testimonialService.checkEligibility('contractor-id');

      expect(result).toEqual(mockEligibility);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/create/eligibility?contractor_id=contractor-id'
      );
    });
  });

  describe('moderateTestimonial', () => {
    it('should moderate testimonial successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await testimonialService.moderateTestimonial({
        testimonial_id: 'test-id',
        moderation_status: 'approved',
        moderation_notes: 'Looks good',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/moderation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testimonial_id: 'test-id',
            moderation_status: 'approved',
            moderation_notes: 'Looks good',
          }),
        }
      );
    });
  });

  describe('approveTestimonial', () => {
    it('should approve testimonial successfully', async () => {
      const mockTestimonial = {
        id: 'test-id',
        is_approved: true,
        is_public: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testimonial: mockTestimonial }),
      });

      const result = await testimonialService.approveTestimonial(
        'test-id',
        true,
        true
      );

      expect(result).toEqual(mockTestimonial);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/test-id/approve',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_approved: true,
            is_public: true,
          }),
        }
      );
    });
  });

  describe('createResponse', () => {
    it('should create response successfully', async () => {
      const mockResponse = {
        id: 'response-id',
        testimonial_id: 'test-id',
        contractor_id: 'contractor-id',
        response_text: 'Thank you for the feedback!',
        is_approved: false,
        is_public: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: mockResponse }),
      });

      const result = await testimonialService.createResponse('test-id', {
        response_text: 'Thank you for the feedback!',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/test-id/response',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response_text: 'Thank you for the feedback!',
          }),
        }
      );
    });
  });

  describe('updateResponse', () => {
    it('should update response successfully', async () => {
      const mockResponse = {
        id: 'response-id',
        response_text: 'Updated response',
        is_approved: true,
        is_public: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: mockResponse }),
      });

      const result = await testimonialService.updateResponse('response-id', {
        response_text: 'Updated response',
        is_approved: true,
        is_public: true,
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/response/response-id',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response_text: 'Updated response',
            is_approved: true,
            is_public: true,
          }),
        }
      );
    });
  });

  describe('updateRatingSummary', () => {
    it('should update rating summary successfully', async () => {
      const mockSummary = {
        contractor_id: 'contractor-id',
        average_rating: 4.5,
        total_reviews: 10,
        rating_breakdown: { '1': 0, '2': 0, '3': 1, '4': 3, '5': 6 },
        last_updated: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating_summary: mockSummary }),
      });

      const result =
        await testimonialService.updateRatingSummary('contractor-id');

      expect(result).toEqual(mockSummary);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/testimonials/rating/update',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractor_id: 'contractor-id' }),
        }
      );
    });
  });
});
