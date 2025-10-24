import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/email/job-application/route';

// Mock dependencies
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
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

jest.mock('@/lib/email/sendgrid-service', () => ({
  SendGridService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(() =>
      Promise.resolve({
        success: true,
        messageId: 'test-message-id',
      })
    ),
  })),
}));

jest.mock('@/lib/email/email-template-manager', () => ({
  EmailTemplateManager: jest.fn().mockImplementation(() => ({
    getTemplate: jest.fn(() =>
      Promise.resolve({
        id: 'job-confirmation-template',
        name: 'Job Application Confirmation',
        subject: 'Application received for {{jobTitle}}',
        html_content: '<h2>Application Confirmed</h2>',
        text_content: 'Application Confirmed',
        variables: ['jobTitle', 'companyName'],
      })
    ),
    renderTemplate: jest.fn(() =>
      Promise.resolve({
        subject: 'Application received for Software Engineer',
        html: '<h2>Application Confirmed</h2>',
        text: 'Application Confirmed',
      })
    ),
  })),
}));

describe('Job Application Emails API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/email/job-application', () => {
    it('should send job application confirmation email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
      };
      const mockApplication = {
        id: 'app-123',
        job_id: 'job-123',
        created_at: '2024-01-20T10:00:00Z',
        jobs: {
          title: 'Software Engineer',
          company_name: 'Tech Corp',
          location: 'Auckland',
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock application query
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockApplication,
        error: null,
      });

      // Mock user query
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application',
        {
          method: 'POST',
          body: JSON.stringify({
            applicationId: 'app-123',
            userId: 'user-123',
            jobId: 'job-123',
            emailType: 'confirmation',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.messageId).toBe('test-message-id');
    });

    it('should send job application status update email', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
      };
      const mockApplication = {
        id: 'app-123',
        job_id: 'job-123',
        created_at: '2024-01-20T10:00:00Z',
        jobs: {
          title: 'Software Engineer',
          company_name: 'Tech Corp',
          location: 'Auckland',
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockApplication,
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application',
        {
          method: 'POST',
          body: JSON.stringify({
            applicationId: 'app-123',
            userId: 'user-123',
            jobId: 'job-123',
            emailType: 'status_update',
            status: 'under_review',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application',
        {
          method: 'POST',
          body: JSON.stringify({
            applicationId: 'app-123',
            // Missing userId and jobId
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe(
        'Application ID, User ID, and Job ID are required'
      );
    });

    it('should return 404 for application not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

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
          data: null,
          error: new Error('Application not found'),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application',
        {
          method: 'POST',
          body: JSON.stringify({
            applicationId: 'app-123',
            userId: 'user-123',
            jobId: 'job-123',
          }),
        }
      );

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Application not found');
    });
  });

  describe('GET /api/email/job-application', () => {
    it('should fetch job application emails successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockJobEmails = [
        {
          id: 'email-1',
          user_id: 'user-123',
          email_type: 'job_application_confirmation',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().like().order.mockResolvedValue({
        data: mockJobEmails,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application?userId=user-123'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.jobEmails).toHaveLength(1);
    });

    it('should filter by application ID when provided', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockJobEmails = [
        {
          id: 'email-1',
          user_id: 'user-123',
          email_type: 'job_application_confirmation',
          status: 'sent',
          sent_at: '2024-01-20T10:00:00Z',
          metadata: { application_id: 'app-123' },
        },
      ];

      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = createClient();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().like().order.mockResolvedValue({
        data: mockJobEmails,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/email/job-application?userId=user-123&applicationId=app-123'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });
});
