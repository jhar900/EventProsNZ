// Import the proper mock
import { createFinalSupabaseMock } from '../../mocks/supabase-final-mock';

// Mock Supabase client
const mockSupabase = createFinalSupabaseMock();

// Mock the Supabase server module before any imports
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

import { NextRequest } from 'next/server';
import { GET as notesGET, POST as notesPOST } from '@/app/api/crm/notes/route';

describe('CRM Notes API - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  describe('GET /api/crm/notes', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/crm/notes');
      const response = await notesGET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return notes for authenticated user', async () => {
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
              id: 'note-1',
              contact_id: 'contact-1',
              note_type: 'general',
              note_content: 'This is a general note about the contact.',
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

      const request = new NextRequest('http://localhost:3000/api/crm/notes');
      const response = await notesGET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.notes).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('POST /api/crm/notes', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/crm/notes', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: '550e8400-e29b-41d4-a716-446655440000',
          note_type: 'general',
          note_content: 'This is a general note about the contact.',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await notesPOST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should create note for authenticated user', async () => {
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

      // Mock the database calls - the mock will handle the method chaining automatically

      const request = new NextRequest('http://localhost:3000/api/crm/notes', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: '550e8400-e29b-41d4-a716-446655440000',
          note_type: 'general',
          note_content: 'This is a general note about the contact.',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await notesPOST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.note.id).toBe('test-id');
      expect(data.note.note_type).toBe('general');
    });
  });
});
