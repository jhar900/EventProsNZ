import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contractors/[id]/contact/route';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock NextRequest.json method
const mockJson = jest.fn();

describe('/api/contractors/[id]/contact', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  const mockContractor = {
    id: 'contractor-123',
    role: 'contractor',
    is_verified: true,
  };

  const mockUserProfile = {
    role: 'event_manager',
  };

  const mockInquiry = {
    id: 'inquiry-123',
    contractor_id: 'contractor-123',
    event_manager_id: 'user-123',
    subject: 'Test Subject',
    message: 'Test Message',
    status: 'pending',
    created_at: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mockJson behavior
    mockJson.mockResolvedValue({
      subject: 'Test Subject',
      message: 'Test Message',
    });
  });

  it('creates inquiry successfully', async () => {
    // Mock authentication
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock contractor verification
    const mockContractorQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockContractor,
        error: null,
      }),
    };

    // Mock user profile check
    const mockUserProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockUserProfile,
        error: null,
      }),
    };

    // Mock recent inquiries check (empty)
    const mockRecentInquiriesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    // Mock inquiry creation
    const mockInquiryQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockInquiry,
        error: null,
      }),
    };

    // Set up the mock chain with call counting
    let usersCallCount = 0;
    let inquiriesCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        usersCallCount++;
        if (usersCallCount === 1) {
          return mockContractorQuery;
        } else {
          return mockUserProfileQuery;
        }
      } else if (table === 'inquiries') {
        inquiriesCallCount++;
        if (inquiriesCallCount === 1) {
          return mockRecentInquiriesQuery;
        } else {
          return mockInquiryQuery;
        }
      }
      return mockUserProfileQuery;
    });

    const request = {
      url: 'http://localhost:3000/api/contractors/contractor-123/contact',
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      json: mockJson,
    } as any;

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.inquiry).toEqual(mockInquiry);
    expect(data.message).toBe('Inquiry sent successfully');
  });

  it('requires authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/contact',
      {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Test Subject',
          message: 'Test Message',
        }),
      }
    );

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('handles contractor not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const mockContractorQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return mockContractorQuery;
      }
      return {
        select: jest.fn(),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/nonexistent/contact',
      {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Test Subject',
          message: 'Test Message',
        }),
      }
    );

    const response = await POST(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Contractor not found');
  });

  it('prevents contractors from contacting themselves', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'contractor-123' } },
      error: null,
    });

    const mockContractorQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockContractor,
        error: null,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return mockContractorQuery;
      }
      return {
        select: jest.fn(),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/contact',
      {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Test Subject',
          message: 'Test Message',
        }),
      }
    );

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot contact yourself');
  });

  it('only allows event managers to send inquiries', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const mockContractorQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockContractor,
        error: null,
      }),
    };

    // Mock user profile with contractor role
    const mockUserProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'contractor' },
        error: null,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return mockContractorQuery;
      }
      return mockUserProfileQuery;
    });

    const request = new NextRequest(
      'http://localhost:3000/api/contractors/contractor-123/contact',
      {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Test Subject',
          message: 'Test Message',
        }),
      }
    );

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only event managers can send inquiries');
  });

  it('validates required fields', async () => {
    // Set up mock for empty subject
    mockJson.mockResolvedValueOnce({ subject: '', message: 'Test Message' });

    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    let usersCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        usersCallCount++;
        if (usersCallCount === 1) {
          // First call: contractor verification
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockContractor,
              error: null,
            }),
          };
        } else {
          // Second call: user profile check
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = {
      url: 'http://localhost:3000/api/contractors/contractor-123/contact',
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      json: mockJson,
    } as any;

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Subject and message are required');
  });

  it('validates field length limits', async () => {
    // Set up mock for long subject
    mockJson.mockResolvedValueOnce({
      subject: 'a'.repeat(201),
      message: 'Test Message',
    });

    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    let usersCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        usersCallCount++;
        if (usersCallCount === 1) {
          // First call: contractor verification
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockContractor,
              error: null,
            }),
          };
        } else {
          // Second call: user profile check
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          };
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = {
      url: 'http://localhost:3000/api/contractors/contractor-123/contact',
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      json: mockJson,
    } as any;

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Subject must be 200 characters or less');
  });

  it('prevents spam by limiting inquiries per day', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    let usersCallCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        usersCallCount++;
        if (usersCallCount === 1) {
          // First call: contractor verification
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockContractor,
              error: null,
            }),
          };
        } else {
          // Second call: user profile check
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          };
        }
      } else if (table === 'inquiries') {
        // Mock recent inquiries (existing inquiry found)
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'existing-inquiry' }],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const request = {
      url: 'http://localhost:3000/api/contractors/contractor-123/contact',
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      json: mockJson,
    } as any;

    const response = await POST(request, { params: { id: 'contractor-123' } });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe(
      'You can only send one inquiry per day to the same contractor'
    );
  });

  it('handles missing contractor ID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/contractors//contact',
      {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Test Subject',
          message: 'Test Message',
        }),
      }
    );

    const response = await POST(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Contractor ID is required');
  });
});
