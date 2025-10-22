import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/jobs/internal/route';

// Mock the job service
jest.mock('@/lib/jobs/job-service', () => ({
  JobService: jest.fn().mockImplementation(() => ({
    createJob: jest.fn(),
    getJobs: jest.fn(),
    searchJobs: jest.fn(),
  })),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

describe('/api/jobs/internal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/jobs/internal', () => {
    it('creates internal job successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockJob = { id: 'job-1', title: 'Test Job' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_type: 'contractor' },
          error: null,
        });

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.createJob.mockResolvedValue(mockJob);

      const requestBody = {
        title: 'Wedding Photographer',
        description: 'Looking for an experienced wedding photographer',
        internal_job_category: 'casual_work',
        service_category: 'photography',
        skill_requirements: ['Photography', 'Adobe Lightroom'],
        experience_level: 'intermediate',
        payment_terms: '$50-80/hour',
        work_arrangement: 'onsite',
        location: 'Auckland, New Zealand',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toEqual(mockJob);
      expect(mockJobService.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          ...requestBody,
          job_type: 'contractor_internal',
          status: 'active',
        }),
        mockUser.id
      );
    });

    it('returns 401 when user is not authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 403 when user is not a contractor', async () => {
      const mockUser = { id: 'user-1' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_type: 'event_manager' },
          error: null,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Only contractors can post internal jobs');
    });

    it('returns 400 for invalid request data', async () => {
      const mockUser = { id: 'user-1' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { user_type: 'contractor' },
          error: null,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal',
        {
          method: 'POST',
          body: JSON.stringify({
            title: '', // Invalid: empty title
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('GET /api/jobs/internal', () => {
    it('fetches internal jobs successfully', async () => {
      const mockJobs = [
        { id: 'job-1', title: 'Job 1', job_type: 'contractor_internal' },
        { id: 'job-2', title: 'Job 2', job_type: 'contractor_internal' },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock the query builder chain
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from().select.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: mockJobs,
        error: null,
        count: 2,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.jobs).toEqual(mockJobs);
      expect(data.total).toBe(2);
    });

    it('applies filters correctly', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from().select.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal?internal_job_category=casual_work&service_category=photography&budget_min=500&budget_max=1000&location=Auckland&is_remote=true'
      );

      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith(
        'job_type',
        'contractor_internal'
      );
      expect(mockQuery.in).toHaveBeenCalledWith('internal_job_category', [
        'casual_work',
      ]);
      expect(mockQuery.in).toHaveBeenCalledWith('service_category', [
        'photography',
      ]);
      expect(mockQuery.gte).toHaveBeenCalledWith('budget_range_min', 500);
      expect(mockQuery.lte).toHaveBeenCalledWith('budget_range_max', 1000);
      expect(mockQuery.ilike).toHaveBeenCalledWith('location', '%Auckland%');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_remote', true);
    });

    it('handles search query', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from().select.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal?q=photographer'
      );

      await GET(request);

      expect(mockQuery.or).toHaveBeenCalledWith(
        'title.ilike.%photographer%,description.ilike.%photographer%,location.ilike.%photographer%'
      );
    });

    it('returns 400 for invalid parameters', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal?page=invalid&limit=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('handles database errors', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: 0,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/jobs/internal'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch internal jobs: Database error');
    });
  });
});
