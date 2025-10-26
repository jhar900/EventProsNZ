import { ConsentManagementService } from '@/lib/privacy/consent-management-service';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockConsentRecord, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockConsentRecord, error: null })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [mockConsentRecord], error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockConsentRecord, error: null }))
          }))
        }))
      }))
    })
  }
}));

const mockConsentRecord = {
  id: 'consent-id',
  user_id: 'user-123',
  consent_type: 'marketing',
  purpose: 'Send promotional emails',
  legal_basis: 'consent',
  data_categories: ['email', 'name'],
  retention_period: 365,
  is_required: false,
  can_withdraw: true,
  status: 'active',
  granted_at: '2024-01-15T10:00:00Z',
  expires_at: '2025-01-15T10:00:00Z',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'user-123'
};

const mockAnalyticsRecord = {
  total_consents: 100,
  active_consents: 85,
  withdrawn_consents: 15,
  consent_rate: 85.0,
  consents_by_type: {
    marketing: 30,
    analytics: 25,
    functional: 20,
    necessary: 10
  },
  consents_by_status: {
    active: 85,
    withdrawn: 15
  },
  average_retention_period: 365,
  recent_consents: [mockConsentRecord]
};

describe('ConsentManagementService', () => {
  let service: ConsentManagementService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConsentManagementService();
    mockSupabase = require('@/lib/supabase/client').supabase;
  });

  describe('createConsent', () => {
    it('should create a new consent record', async () => {
      const consentData = {
        userId: 'user-123',
        consentType: 'marketing',
        purpose: 'Send promotional emails',
        legalBasis: 'consent',
        dataCategories: ['email', 'name'],
        retentionPeriod: 365,
        isRequired: false,
        canWithdraw: true,
        expiresAt: new Date('2025-01-15'),
        createdBy: 'user-123'
      };

      const result = await service.createConsent(consentData);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id',
        userId: 'user-123',
        consentType: 'marketing'
      }));
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const consentData = {
        userId: 'user-123',
        consentType: 'marketing',
        purpose: 'Test purpose',
        legalBasis: 'consent',
        dataCategories: ['email'],
        retentionPeriod: 365,
        createdBy: 'user-123'
      };

      await expect(service.createConsent(consentData))
        .rejects.toThrow('Failed to create consent');
    });
  });

  describe('getConsent', () => {
    it('should get a consent record by ID', async () => {
      const result = await service.getConsent('consent-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id',
        userId: 'user-123'
      }));
    });

    it('should return null when consent not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await service.getConsent('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserConsents', () => {
    it('should get all consents for a user', async () => {
      const result = await service.getUserConsents('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'consent-id',
        userId: 'user-123'
      }));
    });

    it('should handle empty results', async () => {
      mockSupabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await service.getUserConsents('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateConsent', () => {
    it('should update a consent record', async () => {
      const updateData = {
        purpose: 'Updated purpose',
        retentionPeriod: 730,
        updatedBy: 'admin'
      };

      const result = await service.updateConsent('consent-id', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id'
      }));
    });

    it('should throw error when update fails', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const updateData = { purpose: 'Updated purpose' };

      await expect(service.updateConsent('consent-id', updateData))
        .rejects.toThrow('Failed to update consent');
    });
  });

  describe('grantConsent', () => {
    it('should grant consent for a user', async () => {
      const result = await service.grantConsent(
        'consent-id',
        new Date(),
        '192.168.1.1',
        'Mozilla/5.0...'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id',
        status: 'active'
      }));
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw consent', async () => {
      const result = await service.withdrawConsent(
        'consent-id',
        'User requested withdrawal',
        new Date()
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id',
        status: 'withdrawn'
      }));
    });
  });

  describe('getConsentsByType', () => {
    it('should get consents by type', async () => {
      const result = await service.getConsentsByType('marketing');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        consentType: 'marketing'
      }));
    });
  });

  describe('getAllConsents', () => {
    it('should get all consents with pagination', async () => {
      const result = await service.getAllConsents(10, 0);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toHaveLength(1);
    });
  });

  describe('collectConsentData', () => {
    it('should collect consent data for analytics', async () => {
      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockConsentRecord],
        error: null
      });

      const result = await service.collectConsentData('month');

      expect(result).toEqual(expect.objectContaining({
        totalConsents: 1,
        activeConsents: 1,
        withdrawnConsents: 0
      }));
    });
  });

  describe('getConsentAnalytics', () => {
    it('should get consent analytics', async () => {
      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockConsentRecord],
        error: null
      });

      const result = await service.getConsentAnalytics('month');

      expect(result).toEqual(expect.objectContaining({
        totalConsents: 1,
        activeConsents: 1,
        consentRate: expect.any(Number)
      }));
    });
  });

  describe('validateConsent', () => {
    it('should validate consent requirements', () => {
      const consentData = {
        userId: 'user-123',
        consentType: 'marketing',
        purpose: 'Send emails',
        legalBasis: 'consent',
        dataCategories: ['email'],
        retentionPeriod: 365,
        createdBy: 'user-123'
      };

      const result = service.validateConsent(consentData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
      const consentData = {
        userId: '',
        consentType: '',
        purpose: '',
        legalBasis: '',
        dataCategories: [],
        retentionPeriod: -1,
        createdBy: ''
      };

      const result = service.validateConsent(consentData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkConsentExpiry', () => {
    it('should check for expired consents', async () => {
      mockSupabase.from().select().eq().lt.mockResolvedValueOnce({
        data: [mockConsentRecord],
        error: null
      });

      const result = await service.checkConsentExpiry();

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toHaveLength(1);
    });
  });

  describe('renewConsent', () => {
    it('should renew an expired consent', async () => {
      const result = await service.renewConsent(
        'consent-id',
        new Date('2025-12-31'),
        'admin'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toEqual(expect.objectContaining({
        id: 'consent-id'
      }));
    });
  });

  describe('getConsentHistory', () => {
    it('should get consent history for a user', async () => {
      const result = await service.getConsentHistory('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_consents');
      expect(result).toHaveLength(1);
    });
  });

  describe('exportConsentData', () => {
    it('should export consent data in specified format', async () => {
      mockSupabase.from().select().eq.mockResolvedValueOnce({
        data: [mockConsentRecord],
        error: null
      });

      const result = await service.exportConsentData('user-123', 'json');

      expect(result).toContain('user-123');
      expect(typeof result).toBe('string');
    });
  });
});
