import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/legal/contact/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(),
};

describe('/api/legal/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('POST /api/legal/contact', () => {
    it('creates legal inquiry successfully', async () => {
      const inquiryData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Legal Question',
        message: 'I have a question about the terms of service.',
        type: 'legal',
      };

      const mockInquiry = {
        id: 'inquiry-1',
        ...inquiryData,
        status: 'pending',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockInquiry,
              error: null,
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: inquiryData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Legal inquiry submitted successfully');
      expect(data.data.id).toBe(mockInquiry.id);
      expect(data.data.status).toBe('pending');
    });

    it('validates required fields', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        subject: '',
        message: 'Short',
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('validates email format', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This is a valid message with enough characters.',
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('validates message length', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Short',
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('defaults type to general when not provided', async () => {
      const inquiryData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'General Question',
        message: 'This is a general inquiry about the platform.',
      };

      const mockInquiry = {
        id: 'inquiry-1',
        ...inquiryData,
        type: 'general',
        status: 'pending',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockInquiry,
              error: null,
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: inquiryData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 500 when database error occurs', async () => {
      const inquiryData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Legal Question',
        message: 'I have a question about the terms of service.',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: inquiryData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to submit inquiry');
    });

    it('returns 500 when unexpected error occurs', async () => {
      const inquiryData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Legal Question',
        message: 'I have a question about the terms of service.',
      };

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { req } = createMocks({
        method: 'POST',
        body: inquiryData,
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
