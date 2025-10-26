import { GDPRComplianceService } from '@/lib/privacy/gdpr-compliance-service';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockComplianceRecord, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockComplianceRecord, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockComplianceRecord, error: null }))
          }))
        }))
      }))
    })
  }
}));

// Mock DataEncryptionService
jest.mock('@/lib/security/data-encryption-service');

const mockComplianceRecord = {
  id: 'test-id',
  user_id: 'user-123',
  data_processing_principles: {
    lawfulness: true,
    fairness: true,
    transparency: true,
    purpose_limitation: true,
    data_minimisation: true,
    accuracy: true,
    storage_limitation: true,
    integrity: true,
    confidentiality: true,
    accountability: true
  },
  lawful_basis: {
    consent: true,
    contract: false,
    legal_obligation: false,
    vital_interests: false,
    public_task: false,
    legitimate_interests: true
  },
  data_subject_rights: {
    right_to_be_informed: true,
    right_of_access: true,
    right_to_rectification: true,
    right_to_erasure: true,
    right_to_restrict_processing: true,
    right_to_data_portability: true,
    right_to_object: true,
    rights_related_to_automated_decision_making: true
  },
  compliance_score: 85,
  last_audit_date: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'admin'
};

const mockViolationRecord = {
  id: 'violation-id',
  type: 'data_breach',
  severity: 'high',
  description: 'Unauthorized access to user data',
  affected_data: { user_id: 'user-123', data_type: 'personal_info' },
  detected_at: '2024-01-15T10:00:00Z',
  resolved_at: null,
  created_at: '2024-01-15T10:00:00Z',
  created_by: 'system'
};

describe('GDPRComplianceService', () => {
  let service: GDPRComplianceService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GDPRComplianceService();
    mockSupabase = require('@/lib/supabase/client').supabase;
  });

  describe('createComplianceRecord', () => {
    it('should create a new GDPR compliance record', async () => {
      const complianceData = {
        userId: 'user-123',
        dataProcessingPrinciples: {
          lawfulness: true,
          fairness: true,
          transparency: true,
          purposeLimitation: true,
          dataMinimisation: true,
          accuracy: true,
          storageLimitation: true,
          integrity: true,
          confidentiality: true,
          accountability: true
        },
        lawfulBasis: {
          consent: true,
          contract: false,
          legalObligation: false,
          vitalInterests: false,
          publicTask: false,
          legitimateInterests: true
        },
        dataSubjectRights: {
          rightToBeInformed: true,
          rightOfAccess: true,
          rightToRectification: true,
          rightToErasure: true,
          rightToRestrictProcessing: true,
          rightToDataPortability: true,
          rightToObject: true,
          rightsRelatedToAutomatedDecisionMaking: true
        },
        complianceScore: 85,
        createdBy: 'admin'
      };

      const result = await service.createComplianceRecord(complianceData);

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_compliance');
      expect(result).toEqual(expect.objectContaining({
        id: 'test-id',
        userId: 'user-123',
        complianceScore: 85
      }));
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const complianceData = {
        userId: 'user-123',
        dataProcessingPrinciples: {},
        lawfulBasis: {},
        dataSubjectRights: {},
        complianceScore: 85,
        createdBy: 'admin'
      };

      await expect(service.createComplianceRecord(complianceData))
        .rejects.toThrow('Failed to create GDPR compliance record');
    });
  });

  describe('getComplianceRecord', () => {
    it('should get a compliance record by user ID', async () => {
      const result = await service.getComplianceRecord('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_compliance');
      expect(result).toEqual(expect.objectContaining({
        id: 'test-id',
        userId: 'user-123'
      }));
    });

    it('should return null when record not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await service.getComplianceRecord('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('updateComplianceRecord', () => {
    it('should update a compliance record', async () => {
      const updateData = {
        complianceScore: 90,
        dataProcessingPrinciples: {
          lawfulness: true,
          fairness: true,
          transparency: true,
          purposeLimitation: true,
          dataMinimisation: true,
          accuracy: true,
          storageLimitation: true,
          integrity: true,
          confidentiality: true,
          accountability: true
        }
      };

      const result = await service.updateComplianceRecord('test-id', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_compliance');
      expect(result).toEqual(expect.objectContaining({
        id: 'test-id',
        complianceScore: 90
      }));
    });

    it('should throw error when update fails', async () => {
      mockSupabase.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const updateData = { complianceScore: 90 };

      await expect(service.updateComplianceRecord('test-id', updateData))
        .rejects.toThrow('Failed to update GDPR compliance record');
    });
  });

  describe('logViolation', () => {
    it('should log a GDPR violation', async () => {
      const violationData = {
        type: 'data_breach',
        severity: 'high',
        description: 'Unauthorized access detected',
        affectedData: { user_id: 'user-123' },
        detectedAt: new Date(),
        resolvedAt: null,
        createdBy: 'system'
      };

      const result = await service.logViolation(violationData);

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_violations');
      expect(result).toEqual(expect.objectContaining({
        id: 'violation-id',
        type: 'data_breach',
        severity: 'high'
      }));
    });

    it('should throw error when logging fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Logging failed' }
      });

      const violationData = {
        type: 'data_breach',
        severity: 'high',
        description: 'Test violation',
        affectedData: {},
        detectedAt: new Date(),
        resolvedAt: null,
        createdBy: 'system'
      };

      await expect(service.logViolation(violationData))
        .rejects.toThrow('Failed to log GDPR violation');
    });
  });

  describe('getViolations', () => {
    it('should get violations with filters', async () => {
      mockSupabase.from().select().eq().gte().order().range.mockResolvedValueOnce({
        data: [mockViolationRecord],
        error: null
      });

      const result = await service.getViolations({
        severity: 'high',
        startDate: new Date('2024-01-01'),
        limit: 10,
        offset: 0
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_violations');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'violation-id',
        type: 'data_breach'
      }));
    });
  });

  describe('resolveViolation', () => {
    it('should resolve a violation', async () => {
      const result = await service.resolveViolation('violation-id', 'Resolved by admin');

      expect(mockSupabase.from).toHaveBeenCalledWith('gdpr_violations');
      expect(result).toEqual(expect.objectContaining({
        id: 'violation-id',
        resolvedAt: expect.any(Date)
      }));
    });
  });

  describe('getComplianceAnalytics', () => {
    it('should get compliance analytics', async () => {
      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockComplianceRecord],
        error: null
      });

      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockViolationRecord],
        error: null
      });

      const result = await service.getComplianceAnalytics('month');

      expect(result).toEqual(expect.objectContaining({
        totalRecords: 1,
        averageScore: 85,
        totalViolations: 1,
        violationsByType: expect.any(Object),
        violationsBySeverity: expect.any(Object)
      }));
    });
  });

  describe('detectViolations', () => {
    it('should detect potential violations', async () => {
      const userData = {
        userId: 'user-123',
        dataProcessingActivities: [
          {
            purpose: 'marketing',
            legalBasis: 'consent',
            dataCategories: ['email', 'name'],
            retentionPeriod: 365
          }
        ],
        consentRecords: [
          {
            purpose: 'marketing',
            granted: true,
            grantedAt: new Date('2024-01-01'),
            expiresAt: new Date('2024-12-31')
          }
        ]
      };

      const result = await service.detectViolations(userData);

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: expect.any(String),
          severity: expect.any(String),
          description: expect.any(String)
        })
      ]));
    });
  });

  describe('calculateComplianceScore', () => {
    it('should calculate compliance score correctly', () => {
      const complianceData = {
        dataProcessingPrinciples: {
          lawfulness: true,
          fairness: true,
          transparency: true,
          purposeLimitation: true,
          dataMinimisation: true,
          accuracy: true,
          storageLimitation: true,
          integrity: true,
          confidentiality: true,
          accountability: true
        },
        lawfulBasis: {
          consent: true,
          contract: false,
          legalObligation: false,
          vitalInterests: false,
          publicTask: false,
          legitimateInterests: true
        },
        dataSubjectRights: {
          rightToBeInformed: true,
          rightOfAccess: true,
          rightToRectification: true,
          rightToErasure: true,
          rightToRestrictProcessing: true,
          rightToDataPortability: true,
          rightToObject: true,
          rightsRelatedToAutomatedDecisionMaking: true
        }
      };

      const score = service.calculateComplianceScore(complianceData);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
