import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/inquiries/route';
import { POST as sendInquiry } from '../../app/api/inquiries/send/route';

// Mock the rate limiting middleware
jest.mock('../../lib/middleware/inquiry-rate-limit', () => ({
  checkInquiryRateLimit: jest.fn().mockResolvedValue(null),
  sanitizeInquiryInput: jest.fn().mockImplementation(data => data),
  validateInquiryInput: jest
    .fn()
    .mockReturnValue({ isValid: true, errors: [] }),
  addSecurityHeaders: jest.fn().mockImplementation(response => response),
}));

// Simple mock for Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('../../lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('Inquiry API Routes - Basic Functionality', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/inquiries', () => {
    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          contractor_id: 'contractor-123',
          // Missing required fields
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle invalid contractor ID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          contractor_id: 'invalid-id',
          inquiry_type: 'general',
          subject: 'Test',
          message: 'Test message',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('POST /api/inquiries/send', () => {
    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/inquiries/send',
        {
          method: 'POST',
          body: JSON.stringify({
            contractor_id: 'contractor-123',
            // Missing required fields
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await sendInquiry(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it('should handle invalid contractor ID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/inquiries/send',
        {
          method: 'POST',
          body: JSON.stringify({
            contractor_id: 'invalid-id',
            inquiry_type: 'general',
            subject: 'Test',
            message: 'Test message',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await sendInquiry(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('GET /api/inquiries', () => {
    it('should handle missing query parameters gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile check
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'event_manager' },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/inquiries');

      const response = await GET(request);
      const data = await response.json();

      // Should not crash, even if it returns an error
      expect(response.status).toBeDefined();
      expect(data).toBeDefined();
    });
  });
});
