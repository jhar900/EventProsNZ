import { POST } from '@/app/api/email/send/route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Create a comprehensive mock that supports all Supabase query methods
const createMockQuery = () => {
  const mockQuery = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    upsert: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    lt: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    or: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(),
    data: [],
    error: null,
  };
  return mockQuery;
};

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));
jest.mock('@/lib/email/sendgrid-service');
jest.mock('@/lib/email/email-template-manager');
jest.mock('@/lib/email/email-queue-manager');
jest.mock('@/lib/email/error-handler');
jest.mock('@/lib/rate-limiting');
jest.mock('@/lib/security/csrf-protection');
jest.mock('@/lib/security/sanitization');
jest.mock('@/lib/security/audit-logger');

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  rateLimit: jest.fn(() => ({
    allowed: true,
    headers: {},
  })),
}));

// Mock CSRF protection
jest.mock('@/lib/security/csrf-protection', () => ({
  withCSRFProtection: (handler: any) => handler,
}));

// Mock data sanitizer
jest.mock('@/lib/security/sanitization', () => ({
  sanitizeHtml: jest.fn(content => content),
  sanitizeText: jest.fn(content => content),
}));

// Mock audit logger
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

// Mock email services
jest.mock('@/lib/email/sendgrid-service', () => ({
  SendGridService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
  })),
}));

// Mock the template manager methods directly
jest.mock('@/lib/email/email-template-manager', () => {
  const mockTemplateManager = {
    getTemplate: jest.fn(),
    validateTemplateVariables: jest.fn(),
    renderTemplate: jest.fn(),
  };

  return {
    EmailTemplateManager: jest.fn(() => mockTemplateManager),
  };
});

jest.mock('@/lib/email/email-queue-manager', () => ({
  EmailQueueManager: jest.fn().mockImplementation(() => ({
    addToQueue: jest.fn(() => Promise.resolve('test-queue-id')),
  })),
}));

jest.mock('@/lib/email/error-handler', () => ({
  EmailErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
}));

describe('/api/email/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default Supabase mock for user quota check
    const mockUserQuery = createMockQuery();
    mockUserQuery.single.mockResolvedValue({
      data: {
        role: 'user',
        email_quota: 100,
        emails_sent_today: 0,
      },
      error: null,
    });

    // Set up default Supabase mock for quota update
    const mockUpdateQuery = createMockQuery();
    mockUpdateQuery.eq.mockResolvedValue({
      data: null,
      error: null,
    });

    // Reset and configure the from mock for each test
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return mockUserQuery;
      }
      return mockUpdateQuery;
    });
  });

  describe('POST', () => {
    it('should send email successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.queueId).toBe('test-queue-id');
    });

    it('should send template-based email', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      // Mock the template manager methods
      const {
        EmailTemplateManager,
      } = require('@/lib/email/email-template-manager');
      const mockTemplateManager = new EmailTemplateManager();
      mockTemplateManager.getTemplate.mockResolvedValue({
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Hello {{firstName}}!',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
      });
      mockTemplateManager.validateTemplateVariables.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockTemplateManager.renderTemplate.mockResolvedValue({
        subject: 'Hello John!',
        html: '<p>Hello John!</p>',
        text: 'Hello John!',
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject', // Add subject to satisfy validation
          templateId: 'test-template-id',
          variables: { firstName: 'John' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle missing required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          // Missing subject and content
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle invalid email address', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const { sanitizeHtml } = require('@/lib/security/sanitization');
      sanitizeHtml.mockReturnValue('<p>Test HTML</p>');

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'invalid-email',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email address');
    });

    it('should handle email quota exceeded', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      // Override the default mock for this test to simulate quota exceeded
      const mockUserQuery = createMockQuery();
      mockUserQuery.single.mockResolvedValue({
        data: {
          role: 'user',
          email_quota: 100,
          emails_sent_today: 100, // Quota exceeded
        },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return mockUserQuery;
        }
        return createMockQuery();
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Daily email quota exceeded');
    });

    it('should handle template not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      const EmailTemplateManager =
        require('@/lib/email/email-template-manager').EmailTemplateManager;
      const mockTemplateManager = new EmailTemplateManager();
      mockTemplateManager.getTemplate.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject', // Add subject to satisfy validation
          templateId: 'non-existent-template',
          variables: { firstName: 'John' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });

    it('should handle template validation errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      // Mock the template manager methods
      const {
        EmailTemplateManager,
      } = require('@/lib/email/email-template-manager');
      const mockTemplateManager = new EmailTemplateManager();
      mockTemplateManager.getTemplate.mockResolvedValue({
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Hello {{firstName}}!',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
      });
      mockTemplateManager.validateTemplateVariables.mockReturnValue({
        isValid: false,
        errors: ['Required variable firstName is missing'],
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject', // Add subject to satisfy validation
          templateId: 'test-template-id',
          variables: {}, // Missing required variable
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Template validation failed');
      expect(data.details).toContain('Required variable firstName is missing');
    });

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/rate-limiting');
      rateLimit.mockReturnValue({
        allowed: false,
        message: 'Too many requests',
        headers: { 'Retry-After': '60' },
      });

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });

    it('should handle server errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      });

      // Ensure rate limiting allows the request
      const { rateLimit } = require('@/lib/rate-limiting');
      rateLimit.mockReturnValue({
        allowed: true,
        headers: {},
      });

      // Mock the queue manager to throw an error
      const EmailQueueManager =
        require('@/lib/email/email-queue-manager').EmailQueueManager;
      const mockQueueManager = new EmailQueueManager();
      mockQueueManager.addToQueue.mockRejectedValue(new Error('Queue error'));

      // Ensure the mock is applied to the instance
      jest.mocked(EmailQueueManager).mockImplementation(() => mockQueueManager);

      const request = new NextRequest('http://localhost:3000/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      console.log('Server errors test response:', {
        status: response.status,
        data,
      });
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send email');
    });
  });
});
