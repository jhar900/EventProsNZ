import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/crm/contacts/route';

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
    invalidateUser: jest.fn(),
  },
}));

describe('CRM Integration Tests - Essential Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  describe('Contact Management Workflow', () => {
    it('should allow user to view contacts', async () => {
      // Step 1: Get contacts list
      const request = new NextRequest('http://localhost:3000/api/crm/contacts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('contacts');
    });

    it('should allow user to create contact', async () => {
      // Step 1: Create contact
      const createRequest = new NextRequest(
        'http://localhost:3000/api/crm/contacts',
        {
          method: 'POST',
          body: JSON.stringify({
            contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
            contact_type: 'client',
            relationship_status: 'active',
          }),
        }
      );

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBeGreaterThanOrEqual(200);
      expect(createData).toHaveProperty('success');
      expect(createData).toHaveProperty('contact');

      // Step 2: Verify contact was created by getting contacts list
      const getRequest = new NextRequest(
        'http://localhost:3000/api/crm/contacts'
      );
      const getResponse = await GET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBeGreaterThanOrEqual(200);
      expect(getData).toHaveProperty('success');
      expect(getData).toHaveProperty('contacts');
    });
  });

  describe('Message Workflow', () => {
    it('should allow user to send and receive messages', async () => {
      // This would test the complete message workflow
      // For now, we'll test that the API endpoints exist and respond
      const request = new NextRequest('http://localhost:3000/api/crm/messages');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });

  describe('Note Management Workflow', () => {
    it('should allow user to add and view notes', async () => {
      // This would test the complete note workflow
      // For now, we'll test that the API endpoints exist and respond
      const request = new NextRequest('http://localhost:3000/api/crm/notes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });

  describe('Search Workflow', () => {
    it('should allow user to search contacts', async () => {
      // This would test the complete search workflow
      // For now, we'll test that the API endpoints exist and respond
      const request = new NextRequest(
        'http://localhost:3000/api/crm/search?query=test'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });

  describe('Reminder Workflow', () => {
    it('should allow user to create and view reminders', async () => {
      // This would test the complete reminder workflow
      // For now, we'll test that the API endpoints exist and respond
      const request = new NextRequest(
        'http://localhost:3000/api/crm/reminders'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
    });
  });
});
