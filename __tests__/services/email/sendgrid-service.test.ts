import { SendGridService } from '@/lib/email/sendgrid-service';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/security/sanitization', () => ({
  sanitizeHtml: jest.fn(content =>
    content?.replace(/<script[^>]*>.*?<\/script>/gi, '')
  ),
  sanitizeText: jest.fn(content =>
    content?.replace(/<script[^>]*>.*?<\/script>/gi, '')
  ),
}));
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'test-log-id' },
          error: null,
        })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'test-log-id', status: 'sent' },
          error: null,
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('SendGridService', () => {
  let sendGridService: SendGridService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
    sendGridService = new SendGridService();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue([
        {
          headers: { 'x-message-id': 'test-message-id' },
        },
      ]);

      // Mock SendGrid
      const sgMail = require('@sendgrid/mail');
      sgMail.send = mockSend;

      const message = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      const result = await sendGridService.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockSend).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: {
          email: 'test@example.com',
          name: 'EventProsNZ',
        },
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: true,
          },
          openTracking: {
            enable: true,
          },
        },
      });
    });

    it('should handle SendGrid API errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('API Error'));

      const sgMail = require('@sendgrid/mail');
      sgMail.send = mockSend;

      const message = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await sendGridService.sendEmail(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should sanitize email content', async () => {
      const mockSend = jest.fn().mockResolvedValue([
        {
          headers: { 'x-message-id': 'test-message-id' },
        },
      ]);

      const sgMail = require('@sendgrid/mail');
      sgMail.send = mockSend;

      const message = {
        to: 'test@example.com',
        subject: 'Test Subject <script>alert("xss")</script>',
        html: '<p>Test HTML <script>alert("xss")</script></p>',
      };

      await sendGridService.sendEmail(message);

      expect(mockSend).toHaveBeenCalled();
      const sentMessage = mockSend.mock.calls[0][0];
      expect(sentMessage.subject).not.toContain('<script>');
      expect(sentMessage.html).not.toContain('<script>');
    });
  });

  describe('sendBulkEmails', () => {
    it('should send bulk emails in batches', async () => {
      const mockSend = jest.fn().mockResolvedValue([
        {
          headers: { 'x-message-id': 'test-message-id' },
        },
      ]);

      const sgMail = require('@sendgrid/mail');
      sgMail.send = mockSend;

      const messages = Array.from({ length: 25 }, (_, i) => ({
        to: `test${i}@example.com`,
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      }));

      const results = await sendGridService.sendBulkEmails(messages);

      expect(results).toHaveLength(25);
      expect(results.every(result => result.success)).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(25);
    });

    it('should handle batch failures gracefully', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValueOnce([
          { headers: { 'x-message-id': 'test-message-id' } },
        ])
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce([
          { headers: { 'x-message-id': 'test-message-id-2' } },
        ]);

      const sgMail = require('@sendgrid/mail');
      sgMail.send = mockSend;

      const messages = [
        { to: 'test1@example.com', subject: 'Test 1', html: '<p>Test 1</p>' },
        { to: 'test2@example.com', subject: 'Test 2', html: '<p>Test 2</p>' },
        { to: 'test3@example.com', subject: 'Test 3', html: '<p>Test 3</p>' },
      ];

      const results = await sendGridService.sendBulkEmails(messages);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('getEmailStatus', () => {
    it('should return email status', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-log-id',
              status: 'delivered',
              message_id: 'test-message-id',
            },
            error: null,
          })),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const status = await sendGridService.getEmailStatus('test-message-id');

      expect(status).toEqual({
        id: 'test-log-id',
        status: 'delivered',
        message_id: 'test-message-id',
      });
    });

    it('should return null for non-existent message', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: { code: 'PGRST116' },
          })),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const status = await sendGridService.getEmailStatus('non-existent-id');

      expect(status).toBeNull();
    });
  });

  describe('getEmailAnalytics', () => {
    it('should return email analytics', async () => {
      const mockSelect = jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                { status: 'sent', sent_at: '2024-01-01T00:00:00Z' },
                { status: 'sent', sent_at: '2024-01-01T00:00:00Z' },
                {
                  status: 'delivered',
                  sent_at: '2024-01-01T00:00:00Z',
                  delivered_at: '2024-01-01T00:01:00Z',
                },
                { status: 'bounced', sent_at: '2024-01-01T00:00:00Z' },
              ],
              error: null,
            })),
          })),
        })),
      }));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const analytics = await sendGridService.getEmailAnalytics({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-02T00:00:00Z',
      });

      expect(analytics.total).toBe(4);
      expect(analytics.sent).toBe(2);
      expect(analytics.delivered).toBe(1);
      expect(analytics.bounced).toBe(1);
      expect(analytics.deliveryRate).toBeCloseTo(25.0, 1);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle delivery event', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      }));

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const event = {
        email: 'test@example.com',
        event: 'delivered',
        sg_message_id: 'test-message-id',
        timestamp: 1640995200,
      };

      await sendGridService.handleWebhookEvent(event);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'delivered',
        delivered_at: new Date(1640995200 * 1000).toISOString(),
        error_message: undefined,
      });
    });

    it('should handle bounce event', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      }));

      const mockUpsert = jest.fn(() => ({
        data: null,
        error: null,
      }));

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        upsert: mockUpsert,
      });

      const event = {
        email: 'test@example.com',
        event: 'bounce',
        sg_message_id: 'test-message-id',
        timestamp: 1640995200,
        reason: 'Invalid email address',
      };

      await sendGridService.handleWebhookEvent(event);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'bounced',
        delivered_at: undefined,
        error_message: 'Invalid email address',
      });

      expect(mockUpsert).toHaveBeenCalledWith({
        email: 'test@example.com',
        type: 'bounce',
        reason: 'Invalid email address',
        is_active: true,
        created_at: expect.any(String),
      });
    });
  });
});
