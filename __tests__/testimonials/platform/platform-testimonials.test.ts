import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/testimonials/platform/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  applyRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  testimonialRateLimiter: {},
}));

describe('Platform Testimonials API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock for each test
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('POST /api/testimonials/platform', () => {
    it('should create a platform testimonial successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = {
        role: 'event_manager',
        first_name: 'John',
        last_name: 'Doe',
      };
      const mockTestimonial = {
        id: 'testimonial-123',
        user_id: 'user-123',
        rating: 5,
        feedback: 'Great platform!',
        category: 'event_manager',
        status: 'pending',
        is_verified: true,
        is_public: false,
        created_at: '2024-01-01T00:00:00Z',
        user: mockUserData,
      };

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the database calls in sequence
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'users') {
          // First call: get user data
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          };
        } else if (table === 'platform_testimonials') {
          if (callCount === 2) {
            // Second call: check for existing testimonial
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            };
          } else {
            // Third call: insert testimonial
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockTestimonial,
                error: null,
              }),
            };
          }
        } else if (table === 'user_verification') {
          // Fourth call: check verification
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          };
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/testimonials/platform',
        {
          method: 'POST',
          body: JSON.stringify({
            rating: 5,
            feedback: 'Great platform!',
            category: 'event_manager',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Testimonial submitted successfully');
      expect(data.testimonial).toEqual(mockTestimonial);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/testimonials/platform',
        {
          method: 'POST',
          body: JSON.stringify({
            rating: 5,
            feedback: 'Great platform!',
            category: 'event_manager',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 409 if user already has a testimonial', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = {
        role: 'event_manager',
        first_name: 'John',
        last_name: 'Doe',
      };
      const mockExistingTestimonial = { id: 'existing-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockExistingTestimonial,
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/testimonials/platform',
        {
          method: 'POST',
          body: JSON.stringify({
            rating: 5,
            feedback: 'Great platform!',
            category: 'event_manager',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe(
        'You have already submitted a platform testimonial'
      );
    });
  });

  describe('GET /api/testimonials/platform', () => {
    it('should return platform testimonials successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = { role: 'event_manager' };
      const mockTestimonials = [
        {
          id: 'testimonial-1',
          rating: 5,
          feedback: 'Great platform!',
          category: 'event_manager',
          status: 'approved',
          is_verified: true,
          is_public: true,
          created_at: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-123',
            first_name: 'John',
            last_name: 'Doe',
            profile_photo_url: null,
          },
        },
      ];

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock the database calls
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'users') {
          // First call: get user data
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          };
        } else if (table === 'platform_testimonials') {
          // Second call: get testimonials
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
          };

          // Make eq return itself for chaining, but resolve on the final call
          let eqCallCount = 0;
          mockQuery.eq.mockImplementation(() => {
            eqCallCount++;
            if (eqCallCount >= 2) {
              // Final call - return the data
              return Promise.resolve({
                data: mockTestimonials,
                error: null,
              });
            }
            return mockQuery; // Return self for chaining
          });

          return mockQuery;
        }

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/testimonials/platform'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.testimonials).toEqual(mockTestimonials);
      expect(data.pagination).toBeDefined();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/testimonials/platform'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
