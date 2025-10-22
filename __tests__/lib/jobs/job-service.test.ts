import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server');
const MockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('JobService', () => {
  let jobService: JobService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
          order: jest.fn(() => ({
            range: jest.fn(),
          })),
        })),
      })),
    };

    MockedCreateClient.mockReturnValue(mockSupabase);
    jobService = new JobService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('creates a job successfully', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockJob,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const jobData = {
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager' as const,
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      const result = await jobService.createJob(jobData, 'user-1');

      expect(result).toEqual(mockJob);
      expect(mockInsert).toHaveBeenCalledWith({
        ...jobData,
        posted_by_user_id: 'user-1',
        status: 'active',
      });
    });

    it('handles creation error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const jobData = {
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager' as const,
        service_category: 'catering',
        location: 'Auckland, New Zealand',
        is_remote: false,
      };

      await expect(jobService.createJob(jobData, 'user-1')).rejects.toThrow(
        'Failed to create job: Database error'
      );
    });
  });

  describe('updateJob', () => {
    it('updates a job successfully', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'Updated Job',
        description: 'Updated description',
        job_type: 'event_manager',
        service_category: 'catering',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock ownership check
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { posted_by_user_id: 'user-1' },
            error: null,
          }),
        }),
      });

      // Mock update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockJob,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation(table => {
        if (table === 'jobs') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        return {};
      });

      const updateData = {
        title: 'Updated Job',
        description: 'Updated description',
      };

      const result = await jobService.updateJob('job-1', updateData, 'user-1');

      expect(result).toEqual(mockJob);
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
    });

    it('handles unauthorized update', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock ownership check - different user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { posted_by_user_id: 'user-2' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const updateData = {
        title: 'Updated Job',
      };

      await expect(
        jobService.updateJob('job-1', updateData, 'user-1')
      ).rejects.toThrow('Unauthorized to update this job');
    });
  });

  describe('deleteJob', () => {
    it('deletes a job successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock ownership check
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { posted_by_user_id: 'user-1' },
            error: null,
          }),
        }),
      });

      // Mock delete
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation(table => {
        if (table === 'jobs') {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
        return {};
      });

      await jobService.deleteJob('job-1', 'user-1');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('handles unauthorized deletion', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock ownership check - different user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { posted_by_user_id: 'user-2' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(jobService.deleteJob('job-1', 'user-1')).rejects.toThrow(
        'Unauthorized to delete this job'
      );
    });
  });

  describe('getJob', () => {
    it('retrieves a job successfully', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'Test Job',
        description: 'Test description',
        job_type: 'event_manager',
        service_category: 'catering',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        posted_by_user: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        event: null,
        applications: [],
        analytics: {
          view_count: 10,
          application_count: 2,
          recent_views: 1,
        },
      };

      // Mock for job query
      const mockJobSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockJob,
            error: null,
          }),
        }),
      });

      // Mock for applications query
      const mockApplicationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Setup from mock to return different mocks for different tables
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return { select: mockJobSelect };
        } else if (table === 'job_applications') {
          return { select: mockApplicationsSelect };
        }
        return { select: jest.fn() };
      });

      const result = await jobService.getJob('job-1');

      expect(result).toHaveProperty('id', mockJob.id);
      expect(result).toHaveProperty('title', mockJob.title);
      expect(result).toHaveProperty('applications');
      expect(result).toHaveProperty('analytics');
      expect(result?.applications).toEqual([]);
      expect(result?.analytics.recent_views).toBe(0);
    });

    it('returns null for non-existent job', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await jobService.getJob('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getJobs', () => {
    it('retrieves jobs with pagination', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Test Job 1',
          description: 'Test description 1',
          job_type: 'event_manager',
          service_category: 'catering',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'job-2',
          title: 'Test Job 2',
          description: 'Test description 2',
          job_type: 'event_manager',
          service_category: 'photography',
          status: 'active',
          created_at: '2024-01-16T10:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockJobs,
              error: null,
              count: 2,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await jobService.getJobs({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('trackJobView', () => {
    it('tracks job view successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await jobService.trackJobView(
        'job-1',
        'user-1',
        '192.168.1.1',
        'Mozilla/5.0',
        'https://example.com'
      );

      expect(mockInsert).toHaveBeenCalledWith({
        job_id: 'job-1',
        viewer_user_id: 'user-1',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        referrer: 'https://example.com',
      });
    });

    it('handles tracking error gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Tracking error' },
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      // Should not throw error
      await expect(
        jobService.trackJobView('job-1', 'user-1')
      ).resolves.toBeUndefined();
    });
  });
});
