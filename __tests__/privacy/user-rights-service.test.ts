import { UserRightsService } from '@/lib/privacy/user-rights-service';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockRightsRequest, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockRightsRequest, error: null })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [mockRightsRequest], error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockRightsRequest, error: null }))
          }))
        }))
      }))
    })
  }
}));

// Mock DataEncryptionService
jest.mock('@/lib/security/data-encryption-service');

const mockRightsRequest = {
  id: 'request-id',
  user_id: 'user-123',
  request_type: 'access',
  status: 'pending',
  request_data: { subject: 'Data access request' },
  response_data: null,
  created_at: '2024-01-15T10:00:00Z',
  processed_at: null,
  expires_at: '2024-02-14T10:00:00Z',
  notes: null,
  created_by: 'user-123',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockDataSubjectRights = {
  id: 'rights-id',
  user_id: 'user-123',
  right_type: 'access',
  status: 'active',
  granted_at: '2024-01-15T10:00:00Z',
  expires_at: null,
  conditions: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'admin'
};

const mockUserData = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe'
  },
  events: [],
  inquiries: [],
  payments: [],
  collectedAt: '2024-01-15T10:00:00Z'
};

describe('UserRightsService', () => {
  let service: UserRightsService;
  let mockSupabase: any;
  let mockEncryptionService: jest.Mocked<DataEncryptionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserRightsService();
    mockSupabase = require('@/lib/supabase/client').supabase;
    mockEncryptionService = new DataEncryptionService() as jest.Mocked<DataEncryptionService>;
  });

  describe('createRightsRequest', () => {
    it('should create a new user rights request', async () => {
      const requestData = {
        userId: 'user-123',
        requestType: 'access' as const,
        status: 'pending' as const,
        expiresAt: new Date('2024-02-14'),
        createdBy: 'user-123'
      };

      const result = await service.createRightsRequest(requestData);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
      expect(result).toEqual(expect.objectContaining({
        id: 'request-id',
        userId: 'user-123',
        requestType: 'access'
      }));
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const requestData = {
        userId: 'user-123',
        requestType: 'access' as const,
        status: 'pending' as const,
        expiresAt: new Date(),
        createdBy: 'user-123'
      };

      await expect(service.createRightsRequest(requestData))
        .rejects.toThrow('Failed to create user rights request');
    });
  });

  describe('getRightsRequest', () => {
    it('should get a rights request by ID', async () => {
      const result = await service.getRightsRequest('request-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
      expect(result).toEqual(expect.objectContaining({
        id: 'request-id',
        userId: 'user-123'
      }));
    });

    it('should return null when request not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await service.getRightsRequest('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserRightsRequests', () => {
    it('should get all rights requests for a user', async () => {
      const result = await service.getUserRightsRequests('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        userId: 'user-123'
      }));
    });

    it('should handle pagination', async () => {
      const result = await service.getUserRightsRequests('user-123', 10, 20);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateRightsRequestStatus', () => {
    it('should update request status', async () => {
      const result = await service.updateRightsRequestStatus(
        'request-id',
        'completed',
        { data: 'processed' },
        'Request completed'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
      expect(result).toEqual(expect.objectContaining({
        id: 'request-id'
      }));
    });

    it('should set processed_at when status is completed', async () => {
      await service.updateRightsRequestStatus('request-id', 'completed');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_rights_requests');
    });
  });

  describe('grantDataSubjectRights', () => {
    it('should grant data subject rights to a user', async () => {
      const rightsData = {
        userId: 'user-123',
        rightType: 'access' as const,
        status: 'active' as const,
        grantedAt: new Date(),
        createdBy: 'admin'
      };

      const result = await service.grantDataSubjectRights(rightsData);

      expect(mockSupabase.from).toHaveBeenCalledWith('data_subject_rights');
      expect(result).toEqual(expect.objectContaining({
        id: 'rights-id',
        userId: 'user-123'
      }));
    });
  });

  describe('getDataSubjectRights', () => {
    it('should get data subject rights for a user', async () => {
      const result = await service.getDataSubjectRights('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('data_subject_rights');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        userId: 'user-123',
        status: 'active'
      }));
    });
  });

  describe('revokeDataSubjectRights', () => {
    it('should revoke data subject rights', async () => {
      const result = await service.revokeDataSubjectRights('rights-id', 'User requested');

      expect(mockSupabase.from).toHaveBeenCalledWith('data_subject_rights');
      expect(result).toEqual(expect.objectContaining({
        id: 'rights-id',
        status: 'revoked'
      }));
    });
  });

  describe('processDataAccessRequest', () => {
    it('should process data access request', async () => {
      jest.spyOn(service, 'collectUserData').mockResolvedValueOnce(mockUserData);
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      const result = await service.processDataAccessRequest('request-id', 'user-123');

      expect(result).toEqual(mockUserData);
    });

    it('should handle processing errors', async () => {
      jest.spyOn(service, 'collectUserData').mockRejectedValueOnce(new Error('Collection failed'));
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      await expect(service.processDataAccessRequest('request-id', 'user-123'))
        .rejects.toThrow('Failed to process data access request');
    });
  });

  describe('processDataRectificationRequest', () => {
    it('should process data rectification request', async () => {
      const rectificationData = {
        first_name: 'Jane',
        last_name: 'Smith'
      };

      mockSupabase.from().update().eq.mockResolvedValueOnce({ error: null });
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      const result = await service.processDataRectificationRequest(
        'request-id',
        'user-123',
        rectificationData
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });

    it('should handle rectification errors', async () => {
      mockSupabase.from().update().eq.mockResolvedValueOnce({ error: { message: 'Update failed' } });
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      await expect(service.processDataRectificationRequest('request-id', 'user-123', {}))
        .rejects.toThrow('Failed to process data rectification request');
    });
  });

  describe('processDataErasureRequest', () => {
    it('should process data erasure request', async () => {
      mockSupabase.from().update().eq.mockResolvedValueOnce({ error: null });
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      const result = await service.processDataErasureRequest('request-id', 'user-123');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });

    it('should handle erasure errors', async () => {
      mockSupabase.from().update().eq.mockResolvedValueOnce({ error: { message: 'Update failed' } });
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      await expect(service.processDataErasureRequest('request-id', 'user-123'))
        .rejects.toThrow('Failed to process data erasure request');
    });
  });

  describe('processDataPortabilityRequest', () => {
    it('should process data portability request', async () => {
      jest.spyOn(service, 'collectUserData').mockResolvedValueOnce(mockUserData);
      jest.spyOn(service, 'formatUserData').mockReturnValueOnce('formatted-data');
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      const result = await service.processDataPortabilityRequest('request-id', 'user-123', 'json');

      expect(result).toBe('formatted-data');
    });

    it('should handle portability errors', async () => {
      jest.spyOn(service, 'collectUserData').mockRejectedValueOnce(new Error('Collection failed'));
      jest.spyOn(service, 'updateRightsRequestStatus').mockResolvedValueOnce(mockRightsRequest as any);

      await expect(service.processDataPortabilityRequest('request-id', 'user-123', 'json'))
        .rejects.toThrow('Failed to process data portability request');
    });
  });

  describe('getRightsAnalytics', () => {
    it('should get user rights analytics', async () => {
      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockRightsRequest],
        error: null
      });

      const result = await service.getRightsAnalytics('month');

      expect(result).toEqual(expect.objectContaining({
        totalRequests: 1,
        requestsByType: expect.any(Object),
        requestsByStatus: expect.any(Object),
        averageProcessingTime: expect.any(Number),
        completionRate: expect.any(Number)
      }));
    });
  });

  describe('collectUserData', () => {
    it('should collect user data from multiple tables', async () => {
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockUserData.user, error: null })
        .mockResolvedValueOnce({ data: mockUserData.events, error: null })
        .mockResolvedValueOnce({ data: mockUserData.inquiries, error: null })
        .mockResolvedValueOnce({ data: mockUserData.payments, error: null });

      const result = await service.collectUserData('user-123');

      expect(result).toEqual(expect.objectContaining({
        user: mockUserData.user,
        events: mockUserData.events,
        inquiries: mockUserData.inquiries,
        payments: mockUserData.payments
      }));
    });

    it('should handle collection errors', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(service.collectUserData('nonexistent-user'))
        .rejects.toThrow('Failed to collect user data');
    });
  });

  describe('formatUserData', () => {
    it('should format data as JSON', () => {
      const result = service.formatUserData(mockUserData, 'json');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(expect.objectContaining({
        user: mockUserData.user
      }));
    });

    it('should format data as CSV', () => {
      const result = service.formatUserData(mockUserData, 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('User Data');
    });

    it('should format data as XML', () => {
      const result = service.formatUserData(mockUserData, 'xml');

      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml');
      expect(result).toContain('<userData>');
    });
  });

  describe('convertToCSV', () => {
    it('should convert data to CSV format', () => {
      const result = service['convertToCSV'](mockUserData);

      expect(typeof result).toBe('string');
      expect(result).toContain('User Data');
      expect(result).toContain('Events Data');
    });
  });

  describe('convertToXML', () => {
    it('should convert data to XML format', () => {
      const result = service['convertToXML'](mockUserData);

      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml');
      expect(result).toContain('<userData>');
      expect(result).toContain('<user>');
    });
  });

  describe('getStartDate', () => {
    it('should return correct start date for different timeframes', () => {
      const now = new Date();
      
      const dayStart = service['getStartDate']('day');
      const weekStart = service['getStartDate']('week');
      const monthStart = service['getStartDate']('month');
      const yearStart = service['getStartDate']('year');

      expect(dayStart.getTime()).toBeLessThan(now.getTime());
      expect(weekStart.getTime()).toBeLessThan(now.getTime());
      expect(monthStart.getTime()).toBeLessThan(now.getTime());
      expect(yearStart.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('mapToUserRightsRequest', () => {
    it('should map database record to UserRightsRequest', () => {
      const result = service['mapToUserRightsRequest'](mockRightsRequest);

      expect(result).toEqual(expect.objectContaining({
        id: 'request-id',
        userId: 'user-123',
        requestType: 'access',
        status: 'pending',
        requestedAt: expect.any(Date),
        expiresAt: expect.any(Date)
      }));
    });
  });

  describe('mapToDataSubjectRights', () => {
    it('should map database record to DataSubjectRights', () => {
      const result = service['mapToDataSubjectRights'](mockDataSubjectRights);

      expect(result).toEqual(expect.objectContaining({
        id: 'rights-id',
        userId: 'user-123',
        rightType: 'access',
        status: 'active',
        grantedAt: expect.any(Date)
      }));
    });
  });
});
