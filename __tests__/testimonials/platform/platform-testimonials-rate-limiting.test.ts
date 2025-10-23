import { NextRequest } from 'next/server';
import { POST } from '@/app/api/testimonials/platform/route';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit, testimonialRateLimiter } from '@/lib/rate-limiting';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  applyRateLimit: jest.fn(),
  testimonialRateLimiter: {},
}));

describe('Platform Testimonials Rate Limiting', () => {
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

  describe('Rate Limiting Tests', () => {
    it('should allow request when rate limit is not exceeded', async () => {
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

      // Mock rate limiting to allow the request
      (applyRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
      });

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
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            };
          } else {
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
      expect(applyRateLimit).toHaveBeenCalledWith(
        request,
        testimonialRateLimiter
      );
    });

    it('should block request when rate limit is exceeded', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Mock rate limiting to block the request
      (applyRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        response: new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
      });

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
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

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(applyRateLimit).toHaveBeenCalledWith(
        request,
        testimonialRateLimiter
      );
    });

    it('should apply rate limiting before authentication', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Mock rate limiting to block the request
      (applyRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        response: new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
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

      // Verify rate limiting was applied before any database calls
      expect(applyRateLimit).toHaveBeenCalledWith(
        request,
        testimonialRateLimiter
      );
      expect(response.status).toBe(429);

      // Verify no database calls were made when rate limited
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should use correct rate limiter configuration', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Mock rate limiting to allow the request
      (applyRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
      });

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database calls to return early
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      }));

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

      await POST(request);

      // Verify the correct rate limiter was used
      expect(applyRateLimit).toHaveBeenCalledWith(
        request,
        testimonialRateLimiter
      );
    });
  });
});
