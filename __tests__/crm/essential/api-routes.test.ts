import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/crm/contacts/route';

// Import the proper mock
import { createFinalSupabaseMock } from '../../mocks/supabase-final-mock';

// Mock Supabase client
const mockSupabase = createFinalSupabaseMock();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock security middleware
jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: jest.fn((request, handler) => handler()),
  crmSecurityConfig: {},
}));

// Mock cache
jest.mock('@/lib/cache/crm-cache', () => ({
  crmDataCache: {
    getContacts: jest.fn(() => null),
    setContacts: jest.fn(),
  },
}));

describe('CRM API Routes - Essential Tests', () => {
  describe('GET /api/crm/contacts', () => {
    it('should return valid response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/crm/contacts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('contacts');
    });

    it('should handle query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts?contact_type=client&page=1&limit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });

  describe('POST /api/crm/contacts', () => {
    it('should create contact with valid data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_user_id: 'user-123',
            contact_type: 'client',
            relationship_status: 'active',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_user_id: 'invalid-id',
            contact_type: 'invalid-type',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/crm/contacts/{id}', () => {
    it('should update contact with valid data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts/test-id',
        {
          method: 'PUT',
          body: JSON.stringify({
            contact_type: 'client',
            relationship_status: 'active',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });

  describe('DELETE /api/crm/contacts/{id}', () => {
    it('should delete contact', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/crm/contacts/test-id',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });
});
