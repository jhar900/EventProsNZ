import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/events/route';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      order: jest.fn(() => ({
        range: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock the database types
jest.mock('@/types/events', () => ({
  EVENT_TYPES: {
    WEDDING: 'wedding',
    CORPORATE: 'corporate',
    PARTY: 'party',
  },
  EVENT_STATUS: {
    DRAFT: 'draft',
    PLANNING: 'planning',
  },
}));

describe('/api/events', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockEventData = {
    eventType: 'wedding',
    title: 'Test Wedding',
    description: 'A beautiful wedding',
    eventDate: '2024-12-25T18:00:00Z',
    durationHours: 6,
    attendeeCount: 100,
    location: {
      address: 'Auckland, New Zealand',
      coordinates: { lat: -36.8485, lng: 174.7633 },
    },
    serviceRequirements: [
      {
        category: 'catering',
        type: 'full_service',
        priority: 'high',
        estimatedBudget: 5000,
        isRequired: true,
      },
    ],
    budgetPlan: {
      totalBudget: 10000,
      breakdown: {
        catering: { amount: 5000, percentage: 50 },
      },
      recommendations: [],
    },
    isDraft: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/events', () => {
    it('creates a new event successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { role: 'event_manager' },
          error: null,
        });

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: { id: 'event-123', ...mockEventData },
          error: null,
        });

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(mockEventData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.event).toBeDefined();
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(mockEventData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('returns 403 when user is not an event manager', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { role: 'contractor' },
          error: null,
        });

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(mockEventData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Only event managers can create events');
    });

    it('returns 400 when validation fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidData = {
        // Missing required fields
        eventType: 'invalid_type',
        title: '',
      };

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe('GET /api/events', () => {
    it('fetches events successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEvents = [
        { id: 'event-1', title: 'Event 1', event_manager_id: mockUser.id },
        { id: 'event-2', title: 'Event 2', event_manager_id: mockUser.id },
      ];

      mockSupabase.from().select().order().range.mockResolvedValue({
        data: mockEvents,
        error: null,
        count: 2,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events?page=1&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.events).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/events');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('filters events by status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().order().range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/events?status=planning'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
