import { NextRequest } from 'next/server';
import {
  GET as messagesGET,
  POST as messagesPOST,
} from '@/app/api/crm/messages/route';

// Import the proper mock
import { createFinalSupabaseMock } from '../../mocks/supabase-final-mock';

// Mock Supabase client
const mockSupabase = createFinalSupabaseMock();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('CRM Messages API - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  describe('GET /api/crm/messages', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/crm/messages');
      const response = await messagesGET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return messages for authenticated user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock the database calls
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'message-1',
              contact_id: 'contact-1',
              message_type: 'inquiry',
              message_content: 'Hello, I am interested in your services.',
              created_at: '2024-12-22T10:00:00Z',
            },
          ],
          error: null,
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 1,
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // Main query
        .mockReturnValueOnce(mockCountQuery); // Count query

      const request = new NextRequest('http://localhost:3000/api/crm/messages');
      const response = await messagesGET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.messages).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('POST /api/crm/messages', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/crm/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_id: '550e8400-e29b-41d4-a716-446655440000',
            message_type: 'inquiry',
            message_content: 'Hello, I am interested in your services.',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await messagesPOST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should create message for authenticated user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock the database calls
      const mockContactCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: '550e8400-e29b-41d4-a716-446655440000',
                  user_id: 'test-user-id',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockCreate = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-message-id',
                user_id: 'test-user-id',
                contact_id: '550e8400-e29b-41d4-a716-446655440000',
                message_type: 'inquiry',
                message_content: 'Hello, I am interested in your services.',
                created_at: '2024-12-22T10:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockContactCheck) // Check contact exists
        .mockReturnValueOnce(mockCreate); // Create message

      const request = new NextRequest(
        'http://localhost:3000/api/crm/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_id: '550e8400-e29b-41d4-a716-446655440000',
            message_type: 'inquiry',
            message_content: 'Hello, I am interested in your services.',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await messagesPOST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message.id).toBe('new-message-id');
      expect(data.message.message_type).toBe('inquiry');
    });
  });
});
