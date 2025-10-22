import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/jobs/[id]/route';
import { GET as getJobs } from '@/app/api/jobs/route';

// Mock the job service
jest.mock('@/lib/jobs/job-service', () => ({
  JobService: jest.fn().mockImplementation(() => ({
    getJob: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    trackJobView: jest.fn(),
  })),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

describe('/api/jobs/[id]', () => {
  const mockJob = {
    id: 'job-1',
    title: 'Test Job',
    description: 'Test Description',
    job_type: 'event_manager',
    service_category: 'photography',
    budget_range_min: 1000,
    budget_range_max: 2000,
    location: 'Auckland',
    is_remote: false,
    status: 'active',
    posted_by_user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/jobs/[id]', () => {
    it('returns job successfully', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJob.mockResolvedValue(mockJob);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1');
      const response = await GET(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toEqual(mockJob);
    });

    it('returns 404 when job not found', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJob.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1');
      const response = await GET(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job not found');
    });

    it('handles errors gracefully', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJob.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1');
      const response = await GET(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });

    it('tracks job view when user is authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJob.mockResolvedValue(mockJob);
      mockJobService.trackJobView.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
          referer: 'https://example.com',
        },
      });

      await GET(request, { params: { id: 'job-1' } });

      expect(mockJobService.trackJobView).toHaveBeenCalledWith(
        'job-1',
        'user-1',
        '192.168.1.1',
        'Mozilla/5.0',
        'https://example.com'
      );
    });
  });

  describe('PUT /api/jobs/[id]', () => {
    it('updates job successfully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.updateJob.mockResolvedValue(mockJob);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Job Title',
          description: 'Updated Description',
        }),
      });

      const response = await PUT(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toEqual(mockJob);
    });

    it('returns 401 when user is not authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Job' }),
      });

      const response = await PUT(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('validates request data', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'A', // Too short
          description: 'B', // Too short
        }),
      });

      const response = await PUT(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request data');
      expect(data.errors).toHaveLength(2);
    });
  });

  describe('DELETE /api/jobs/[id]', () => {
    it('deletes job successfully', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.deleteJob.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Job deleted successfully');
    });

    it('returns 401 when user is not authenticated', async () => {
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const request = new NextRequest('http://localhost:3000/api/jobs/job-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });
  });
});

describe('/api/jobs', () => {
  describe('GET /api/jobs', () => {
    it('returns jobs successfully', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJobs.mockResolvedValue({
        jobs: [mockJob],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await getJobs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.jobs).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    it('handles search parameters', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.searchJobs.mockResolvedValue({
        jobs: [mockJob],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs?q=photographer&service_category=photography'
      );
      const response = await getJobs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('validates query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/jobs?page=invalid&limit=invalid'
      );
      const response = await getJobs(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request parameters');
    });

    it('handles errors gracefully', async () => {
      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobService = new JobService();
      mockJobService.getJobs.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await getJobs(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });
});
