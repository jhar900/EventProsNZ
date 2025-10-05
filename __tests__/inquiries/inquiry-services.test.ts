import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InquiryService } from '../../lib/inquiries/inquiry-service';
import { NotificationService } from '../../lib/inquiries/notification-service';
import { TemplateService } from '../../lib/inquiries/template-service';
import { ValidationService } from '../../lib/inquiries/validation-service';
import { AnalyticsService } from '../../lib/inquiries/analytics-service';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          range: jest.fn(),
        })),
      })),
      order: jest.fn(() => ({
        range: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('../../lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Inquiry Services', () => {
  let inquiryService: InquiryService;
  let notificationService: NotificationService;
  let templateService: TemplateService;
  let validationService: ValidationService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    inquiryService = new InquiryService();
    notificationService = new NotificationService();
    templateService = new TemplateService();
    validationService = new ValidationService();
    analyticsService = new AnalyticsService();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  const mockInquiry = {
    id: 'inquiry-123',
    contractor_id: 'contractor-123',
    event_manager_id: 'manager-123',
    subject: 'Test Inquiry',
    message: 'Test message',
    status: 'sent',
    inquiry_type: 'general',
    priority: 'medium',
    event_id: 'event-123',
    event_details: {
      event_date: '2024-12-25',
      budget_total: 5000,
      attendee_count: 100,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inquiryService', () => {
    describe('createInquiry', () => {
      it('should create a new inquiry successfully', async () => {
        const inquiryData = {
          contractor_id: 'contractor-123',
          event_id: 'event-123',
          inquiry_type: 'general',
          subject: 'Test Inquiry',
          message: 'Test message',
          event_details: {
            event_date: '2024-12-25',
            budget_total: 5000,
          },
          priority: 'medium',
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, inquiry: mockInquiry }),
        });

        const result = await inquiryService.createInquiry(inquiryData);

        expect(result).toEqual(mockInquiry);
        expect(global.fetch).toHaveBeenCalledWith('/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inquiryData),
        });
      });

      it('should handle creation errors', async () => {
        const inquiryData = {
          contractor_id: 'contractor-123',
          inquiry_type: 'general',
          subject: 'Test Inquiry',
          message: 'Test message',
          priority: 'medium',
        };

        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: 'Database error' }),
        });

        await expect(inquiryService.createInquiry(inquiryData)).rejects.toThrow(
          'Database error'
        );
      });
    });

    describe('getInquiries', () => {
      it('should fetch inquiries with pagination', async () => {
        const filters = {
          user_id: 'user-123',
          status: 'sent',
          page: 1,
          limit: 10,
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              inquiries: [mockInquiry],
              total: 1,
              page: 1,
              limit: 10,
            }),
        });

        const result = await inquiryService.getInquiries(filters);

        expect(result.success).toBe(true);
        expect(result.inquiries).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should apply filters correctly', async () => {
        const filters = {
          user_id: 'user-123',
          status: 'sent',
          inquiry_type: 'general',
          priority: 'medium',
          page: 1,
          limit: 10,
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              inquiries: [mockInquiry],
              total: 1,
              page: 1,
              limit: 10,
            }),
        });

        const result = await inquiryService.getInquiries(filters);

        expect(result.success).toBe(true);
        expect(result.inquiries).toHaveLength(1);
      });
    });

    describe('updateInquiryStatus', () => {
      it('should update inquiry status successfully', async () => {
        const inquiryId = 'inquiry-123';
        const status = 'responded';
        const reason = 'Customer responded';

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              inquiry: { ...mockInquiry, status },
            }),
        });

        const result = await inquiryService.updateInquiryStatus(
          inquiryId,
          status,
          reason
        );

        expect(result).toBeDefined();
        expect(result.status).toBe('responded');
      });

      it('should handle update errors', async () => {
        const inquiryId = 'inquiry-123';
        const status = 'responded';

        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: 'Update failed' }),
        });

        await expect(
          inquiryService.updateInquiryStatus(inquiryId, status)
        ).rejects.toThrow('Update failed');
      });
    });
  });

  describe('notificationService', () => {
    describe('sendInquiryNotification', () => {
      it('should send notification successfully', async () => {
        const notificationData = {
          inquiry_id: 'inquiry-123',
          recipient_id: 'contractor-123',
          notification_type: 'new_inquiry',
          subject: 'New Inquiry Received',
          message: 'You have received a new inquiry',
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              notification: {
                id: 'notification-123',
                ...notificationData,
                created_at: '2024-01-01T00:00:00Z',
              },
            }),
        });

        const result = await notificationService.sendNotification(
          notificationData.inquiry_id,
          notificationData.notification_type
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('notification-123');
      });

      it('should handle notification errors', async () => {
        const notificationData = {
          inquiry_id: 'inquiry-123',
          recipient_id: 'contractor-123',
          notification_type: 'new_inquiry',
          subject: 'New Inquiry Received',
          message: 'You have received a new inquiry',
        };

        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: 'Notification failed' }),
        });

        await expect(
          notificationService.sendNotification(
            notificationData.inquiry_id,
            notificationData.notification_type
          )
        ).rejects.toThrow('Notification failed');
      });
    });

    describe('getNotifications', () => {
      it('should fetch notifications for user', async () => {
        const userId = 'user-123';
        const mockNotifications = [
          {
            id: 'notification-1',
            inquiry_id: 'inquiry-123',
            recipient_id: 'user-123',
            notification_type: 'new_inquiry',
            subject: 'New Inquiry',
            message: 'You have a new inquiry',
            created_at: '2024-01-01T00:00:00Z',
          },
        ];

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              notifications: mockNotifications,
            }),
        });

        const result = await notificationService.getNotifications(userId);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('notification-1');
      });
    });
  });

  describe('templateService', () => {
    describe('createTemplate', () => {
      it('should create template successfully', async () => {
        const templateData = {
          template_name: 'General Inquiry',
          template_content: 'Hello, I am interested in your services...',
          template_type: 'general',
          is_public: false,
        };

        const mockTemplate = {
          id: 'template-123',
          user_id: 'user-123',
          ...templateData,
          usage_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              template: mockTemplate,
            }),
        });

        const result = await templateService.createTemplate(templateData);

        expect(result).toBeDefined();
        expect(result.id).toBe('template-123');
      });

      it('should handle template creation errors', async () => {
        const templateData = {
          template_name: 'General Inquiry',
          template_content: 'Hello, I am interested in your services...',
          template_type: 'general',
          is_public: false,
        };

        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: 'Template creation failed' }),
        });

        await expect(
          templateService.createTemplate(templateData)
        ).rejects.toThrow('Template creation failed');
      });
    });

    describe('getTemplates', () => {
      it('should fetch templates for user', async () => {
        const userId = 'user-123';
        const mockTemplates = [
          {
            id: 'template-1',
            user_id: 'user-123',
            template_name: 'General Inquiry',
            template_content: 'Hello, I am interested in your services...',
            template_type: 'general',
            is_public: false,
            usage_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              templates: mockTemplates,
            }),
        });

        const result = await templateService.getTemplates({ user_id: userId });

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('template-1');
      });
    });

    describe('applyTemplate', () => {
      it('should apply template to inquiry data', async () => {
        const templateId = 'template-123';
        const inquiryData = {
          contractor_id: 'contractor-123',
          inquiry_type: 'general',
          subject: '',
          message: '',
          priority: 'medium',
        };

        const mockTemplate = {
          id: 'template-123',
          template_name: 'General Inquiry',
          template_content: JSON.stringify({
            subject: 'General Inquiry',
            message:
              'Hello, I am interested in your services for [EVENT_TYPE] on [EVENT_DATE].',
          }),
          template_type: 'general',
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              template: mockTemplate,
            }),
        });

        const result = await templateService.applyTemplate(
          templateId,
          inquiryData
        );

        expect(result).toBeDefined();
        expect(result.subject).toBeDefined();
        expect(result.message).toContain(
          'Hello, I am interested in your services'
        );
      });
    });
  });

  describe('validationService', () => {
    describe('validateInquiryData', () => {
      it('should validate inquiry data successfully', async () => {
        const inquiryData = {
          contractor_id: 'contractor-123',
          inquiry_type: 'general',
          subject: 'Test Inquiry',
          message: 'Test message content',
          priority: 'medium',
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              isValid: true,
              errors: [],
              warnings: [],
              suggestions: [],
            }),
        });

        const result = await validationService.validateInquiry(inquiryData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return validation errors for invalid data', async () => {
        const inquiryData = {
          contractor_id: '',
          inquiry_type: 'invalid_type',
          subject: '',
          message: '',
          priority: 'invalid_priority',
        };

        // Mock failed validation response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              isValid: false,
              errors: [
                {
                  field: 'contractor_id',
                  message: 'Contractor ID is required',
                  severity: 'error',
                },
                {
                  field: 'subject',
                  message: 'Subject is required',
                  severity: 'error',
                },
                {
                  field: 'message',
                  message: 'Message is required',
                  severity: 'error',
                },
              ],
              warnings: [],
              suggestions: [],
            }),
        });

        const result = await validationService.validateInquiry(inquiryData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toBe('Contractor ID is required');
      });

      it('should validate event details when provided', async () => {
        const inquiryData = {
          contractor_id: 'contractor-123',
          inquiry_type: 'general',
          subject: 'Test Inquiry',
          message: 'Test message',
          priority: 'medium',
          event_details: {
            event_date: '2024-12-25',
            budget_total: 5000,
            attendee_count: 100,
          },
        };

        // Mock successful validation response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              isValid: true,
              errors: [],
              warnings: [],
              suggestions: [],
            }),
        });

        const result = await validationService.validateInquiry(inquiryData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate event details errors', async () => {
        const inquiryData = {
          contractor_id: 'contractor-123',
          inquiry_type: 'general',
          subject: 'Test Inquiry',
          message: 'Test message',
          priority: 'medium',
          event_details: {
            event_date: 'invalid-date',
            budget_total: -1000,
            attendee_count: -10,
          },
        };

        // Mock failed validation response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              isValid: false,
              errors: [
                {
                  field: 'event_details.event_date',
                  message: 'Invalid date format',
                  severity: 'error',
                },
                {
                  field: 'event_details.budget_total',
                  message: 'Budget must be positive',
                  severity: 'error',
                },
                {
                  field: 'event_details.attendee_count',
                  message: 'Attendee count must be positive',
                  severity: 'error',
                },
              ],
              warnings: [],
              suggestions: [],
            }),
        });

        const result = await validationService.validateInquiry(inquiryData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('analyticsService', () => {
    describe('getInquiryAnalytics', () => {
      it('should fetch inquiry analytics', async () => {
        const userId = 'user-123';
        const dateRange = {
          from: '2024-01-01',
          to: '2024-12-31',
        };

        const mockAnalytics = {
          total_inquiries: 50,
          sent_inquiries: 30,
          viewed_inquiries: 25,
          responded_inquiries: 20,
          quoted_inquiries: 15,
          response_rate: 0.67,
          average_response_time: 2.5,
          top_contractors: [
            { contractor_id: 'contractor-1', inquiry_count: 10 },
            { contractor_id: 'contractor-2', inquiry_count: 8 },
          ],
          monthly_trends: [
            { month: '2024-01', count: 5 },
            { month: '2024-02', count: 8 },
          ],
        };

        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockAnalytics),
        });

        const result = await analyticsService.getInquiryAnalytics({
          user_id: userId,
          date_from: dateRange.from,
          date_to: dateRange.to,
        });

        expect(result).toBeDefined();
        expect(result.total_inquiries).toBe(50);
      });

      it('should handle analytics errors', async () => {
        const userId = 'user-123';
        const dateRange = {
          from: '2024-01-01',
          to: '2024-12-31',
        };

        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: 'Analytics fetch failed' }),
        });

        await expect(
          analyticsService.getInquiryAnalytics({
            user_id: userId,
            date_from: dateRange.from,
            date_to: dateRange.to,
          })
        ).rejects.toThrow('Analytics fetch failed');
      });
    });

    // Note: exportInquiries method doesn't exist in AnalyticsService
  });
});
