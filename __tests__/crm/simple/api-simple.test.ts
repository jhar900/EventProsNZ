import { NextRequest } from 'next/server';
import {
  GET as contactsGET,
  POST as contactsPOST,
} from '@/app/api/crm/contacts/route';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('CRM API Routes - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/crm/contacts', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/crm/contacts');
      const response = await contactsGET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return contacts for authenticated user', async () => {
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
              id: 'contact-1',
              user_id: 'test-user-id',
              contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
              contact_type: 'contractor',
              relationship_status: 'active',
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

      const request = new NextRequest('http://localhost:3000/api/crm/contacts');
      const response = await contactsGET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.contacts).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('POST /api/crm/contacts', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
            contact_type: 'contractor',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await contactsPOST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should create contact for authenticated user', async () => {
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
      const mockExistingCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockUserCheck = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '550e8400-e29b-41d4-a716-446655440000' },
              error: null,
            }),
          }),
        }),
      };

      const mockCreate = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-contact-id',
                user_id: 'test-user-id',
                contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
                contact_type: 'contractor',
                relationship_status: 'active',
                created_at: '2024-12-22T10:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockExistingCheck) // Check existing contact
        .mockReturnValueOnce(mockUserCheck) // Check user exists
        .mockReturnValueOnce(mockCreate); // Create contact

      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
            contact_type: 'contractor',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await contactsPOST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.contact.id).toBe('new-contact-id');
      expect(data.contact.contact_type).toBe('contractor');
    });
  });
});
