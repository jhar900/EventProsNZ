import { renderHook, act } from '@testing-library/react';
import { useAdmin } from '@/hooks/useAdmin';

// Mock fetch
global.fetch = jest.fn();

describe('useAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useAdmin());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user@example.com',
          role: 'admin',
          is_verified: true,
          status: 'active',
          last_login: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: mockUsers,
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchUsers();
      });

      expect(response).toEqual({
        users: mockUsers,
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch users error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchUsers();
      });

      expect(response).toBe(null);
      expect(result.current.error).toBe('API Error');
    });

    it('should fetch users with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [], total: 0, limit: 50, offset: 0 }),
      });

      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.fetchUsers({
          role: 'admin',
          status: 'active',
          search: 'test',
          page: 1,
          limit: 25,
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users?role=admin&status=active&search=test&page=1&limit=25'
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        role: 'admin',
        is_verified: true,
        status: 'suspended',
        last_login: '2024-01-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.updateUserStatus('1', 'suspended');
      });

      expect(response).toEqual({ success: true, user: mockUser });
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/1/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' }),
      });
    });
  });

  describe('fetchVerificationQueue', () => {
    it('should fetch verification queue successfully', async () => {
      const mockVerifications = [
        {
          id: '1',
          email: 'contractor@example.com',
          role: 'contractor',
          is_verified: false,
          created_at: '2024-01-01T00:00:00Z',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '123-456-7890',
            address: '123 Main St',
          },
          business_profiles: {
            company_name: 'Test Company',
            business_address: '123 Business St',
            nzbn: '123456789',
            description: 'Test description',
            service_areas: ['Auckland'],
            is_verified: false,
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          verifications: mockVerifications,
          total: 1,
        }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchVerificationQueue();
      });

      expect(response).toEqual({
        verifications: mockVerifications,
        total: 1,
      });
    });
  });

  describe('approveVerification', () => {
    it('should approve verification successfully', async () => {
      const mockVerification = {
        id: '1',
        email: 'contractor@example.com',
        role: 'contractor',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, verification: mockVerification }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.approveVerification(
          '1',
          'All documents verified'
        );
      });

      expect(response).toEqual({
        success: true,
        verification: mockVerification,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/verification/1/approve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'All documents verified' }),
        }
      );
    });
  });

  describe('rejectVerification', () => {
    it('should reject verification successfully', async () => {
      const mockVerification = {
        id: '1',
        email: 'contractor@example.com',
        role: 'contractor',
        is_verified: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, verification: mockVerification }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.rejectVerification(
          '1',
          'Incomplete documentation',
          'Please provide additional business registration documents'
        );
      });

      expect(response).toEqual({
        success: true,
        verification: mockVerification,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/verification/1/reject',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Incomplete documentation',
            feedback:
              'Please provide additional business registration documents',
          }),
        }
      );
    });
  });

  describe('fetchAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockAnalytics = {
        metrics: {
          totalUsers: 100,
          newUsers: 10,
          totalContractors: 50,
          verifiedContractors: 40,
          totalEventManagers: 50,
          verificationRate: 80,
        },
        trends: {
          userGrowth: [1, 2, 3, 4, 5, 6, 7],
          verificationTrend: 5,
        },
        period: '7d',
        dateRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-08T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAnalytics,
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchAnalytics('7d');
      });

      expect(response).toEqual(mockAnalytics);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/analytics?period=7d'
      );
    });

    it('should fetch analytics with custom date range', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAdmin());

      await act(async () => {
        await result.current.fetchAnalytics(
          'custom',
          '2024-01-01',
          '2024-01-31'
        );
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/analytics?period=custom&date_from=2024-01-01&date_to=2024-01-31'
      );
    });
  });

  describe('fetchSystemHealth', () => {
    it('should fetch system health successfully', async () => {
      const mockHealth = {
        health: {
          status: 'healthy',
          database: {
            status: 'healthy',
            responseTime: 50,
          },
          metrics: {
            totalUsers: 100,
            activeUsers: 80,
            totalContractors: 50,
            pendingVerifications: 5,
          },
          alerts: [],
          recentErrors: [],
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockHealth,
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchSystemHealth();
      });

      expect(response).toEqual(mockHealth);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/system?type=health'
      );
    });
  });

  describe('exportReport', () => {
    it('should export report successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.exportReport('users', 'csv');
      });

      expect(response).toEqual(mockBlob);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/reports?type=users&format=csv'
      );
    });
  });

  describe('error handling', () => {
    it('should handle API errors consistently', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchUsers();
      });

      expect(response).toBe(null);
      expect(result.current.error).toBe('Unauthorized');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAdmin());

      let response;
      await act(async () => {
        response = await result.current.fetchUsers();
      });

      expect(response).toBe(null);
      expect(result.current.error).toBe('Network error');
    });
  });
});
