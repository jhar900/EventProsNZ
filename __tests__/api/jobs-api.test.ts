import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/jobs/route';
import { JobService } from '@/lib/jobs/job-service';

// Mock the JobService
jest.mock('@/lib/jobs/job-service', () => ({
  JobService: jest.fn().mockImplementation(() => ({
    getJobs: jest.fn(),
    createJob: jest.fn(),
  })),
}));

// Mock Supabase
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('/api/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/jobs', () => {
    it('returns jobs successfully', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const mockJobs = [
        {
          id: 'job-1',
          title: 'Test Job',
          description: 'Test description',
          job_type: 'event_manager',
          service_category: 'catering',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const mockGetJobs = jest.fn().mockResolvedValue({
        jobs: mockJobs,
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobServiceInstance = new JobService();
      mockJobServiceInstance.getJobs = mockGetJobs;

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.jobs).toEqual(mockJobs);
      expect(mockGetJobs).toHaveBeenCalled();
    });

    it('handles authentication error', async () => {
      // Mock auth error
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('handles invalid query parameters', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/jobs?page=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid query parameters');
    });

    it('handles service error', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const mockGetJobs = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobServiceInstance = new JobService();
      mockJobServiceInstance.getJobs = mockGetJobs;

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST /api/jobs', () => {
    it('creates job successfully', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const mockJob = {
        id: 'job-1',
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockCreateJob = jest.fn().mockResolvedValue(mockJob);

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobServiceInstance = new JobService();
      mockJobServiceInstance.createJob = mockCreateJob;

      const requestBody = {
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toEqual(mockJob);
      expect(mockCreateJob).toHaveBeenCalledWith(requestBody, 'user-1');
    });

    it('handles validation error', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const requestBody = {
        title: '', // Invalid: empty title
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request data');
      expect(data.errors).toBeDefined();
    });

    it('handles authentication error', async () => {
      // Mock auth error
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const requestBody = {
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('handles service error', async () => {
      // Mock successful authentication
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const mockCreateJob = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const { JobService } = require('@/lib/jobs/job-service');
      const mockJobServiceInstance = new JobService();
      mockJobServiceInstance.createJob = mockCreateJob;

      const requestBody = {
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });
});
