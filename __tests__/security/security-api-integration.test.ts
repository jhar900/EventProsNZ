import { NextRequest } from 'next/server';
import { POST as encryptHandler } from '@/app/api/security/encrypt/route';
import { POST as decryptHandler } from '@/app/api/security/decrypt/route';
import {
  GET as auditGetHandler,
  POST as auditPostHandler,
} from '@/app/api/security/audit/route';
import {
  GET as incidentGetHandler,
  POST as incidentPostHandler,
} from '@/app/api/security/incident/route';
import { GET as statusHandler } from '@/app/api/security/status/route';
import { POST as scanHandler } from '@/app/api/security/scan/route';

// Mock the security services
jest.mock('@/lib/security/data-encryption-service');
jest.mock('@/lib/security/security-audit-service');
jest.mock('@/lib/security/incident-response-service');
jest.mock('@/lib/security/api-security-service');
jest.mock('@/lib/security/security-middleware');

// Mock the withSecurity middleware to bypass security checks for testing
jest.mock('@/lib/security/security-middleware', () => ({
  withSecurity: (req: NextRequest, handler: () => Promise<Response>) =>
    handler(),
}));

describe('Security API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/security/encrypt', () => {
    it('should encrypt data successfully', async () => {
      const mockEncrypt = jest.fn().mockResolvedValue({
        encrypted: 'encrypted-data',
        keyId: 'key-123',
        algorithm: 'AES-256-GCM',
      });

      const {
        DataEncryptionService,
      } = require('@/lib/security/data-encryption-service');
      DataEncryptionService.mockImplementation(() => ({
        encrypt: mockEncrypt,
        logEncryptionOperation: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/encrypt',
        {
          method: 'POST',
          body: JSON.stringify({
            data: 'sensitive-data',
            keyType: 'data',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await encryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.encrypted).toBeDefined();
      expect(mockEncrypt).toHaveBeenCalledWith('sensitive-data', 'data');
    });

    it('should return 400 for missing data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/security/encrypt',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await encryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Data is required');
    });

    it('should handle encryption errors', async () => {
      const mockEncrypt = jest
        .fn()
        .mockRejectedValue(new Error('Encryption failed'));

      const {
        DataEncryptionService,
      } = require('@/lib/security/data-encryption-service');
      DataEncryptionService.mockImplementation(() => ({
        encrypt: mockEncrypt,
        logEncryptionOperation: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/encrypt',
        {
          method: 'POST',
          body: JSON.stringify({
            data: 'sensitive-data',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await encryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Encryption failed');
    });
  });

  describe('POST /api/security/decrypt', () => {
    it('should decrypt data successfully', async () => {
      const mockDecrypt = jest.fn().mockResolvedValue('decrypted-data');

      const {
        DataEncryptionService,
      } = require('@/lib/security/data-encryption-service');
      DataEncryptionService.mockImplementation(() => ({
        decrypt: mockDecrypt,
        logEncryptionOperation: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/decrypt',
        {
          method: 'POST',
          body: JSON.stringify({
            encrypted: {
              data: 'encrypted-data',
              keyId: 'key-123',
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await decryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBe('decrypted-data');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should return 400 for missing encrypted data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/security/decrypt',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await decryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Encrypted data is required');
    });
  });

  describe('GET /api/security/audit', () => {
    it('should retrieve audit logs successfully', async () => {
      const mockAudits = [
        {
          id: '1',
          eventType: 'login',
          details: 'User login',
          severity: 'low',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockGetAudits = jest.fn().mockResolvedValue(mockAudits);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        getSecurityAudits: mockGetAudits,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/audit'
      );

      const response = await auditGetHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.audits).toEqual(mockAudits);
      expect(data.count).toBe(1);
    });

    it('should filter audit logs by severity', async () => {
      const mockGetAudits = jest.fn().mockResolvedValue([]);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        getSecurityAudits: mockGetAudits,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/audit?severity=high'
      );

      const response = await auditGetHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGetAudits).toHaveBeenCalledWith('high', undefined, 100);
    });
  });

  describe('POST /api/security/audit', () => {
    it('should create audit entry successfully', async () => {
      const mockAudit = {
        id: '1',
        eventType: 'security_scan',
        details: 'Vulnerability scan completed',
        severity: 'medium',
        createdAt: new Date().toISOString(),
      };

      const mockCreateAudit = jest.fn().mockResolvedValue(mockAudit);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        createAudit: mockCreateAudit,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/audit',
        {
          method: 'POST',
          body: JSON.stringify({
            eventType: 'security_scan',
            details: 'Vulnerability scan completed',
            severity: 'medium',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await auditPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.audit).toEqual(mockAudit);
      expect(mockCreateAudit).toHaveBeenCalledWith(
        'security_scan',
        'Vulnerability scan completed',
        'medium'
      );
    });

    it('should return 400 for missing event type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/security/audit',
        {
          method: 'POST',
          body: JSON.stringify({
            details: 'Some details',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await auditPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event type is required');
    });
  });

  describe('POST /api/security/incident', () => {
    it('should create incident successfully', async () => {
      const mockIncident = {
        id: '1',
        incidentType: 'data_breach',
        description: 'Suspected data breach',
        severity: 'high',
        status: 'open',
        reportedBy: 'admin@example.com',
        createdAt: new Date().toISOString(),
      };

      const mockCreateIncident = jest.fn().mockResolvedValue(mockIncident);

      const {
        IncidentResponseService,
      } = require('@/lib/security/incident-response-service');
      IncidentResponseService.mockImplementation(() => ({
        createIncident: mockCreateIncident,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/incident',
        {
          method: 'POST',
          body: JSON.stringify({
            incidentType: 'data_breach',
            description: 'Suspected data breach',
            severity: 'high',
            reportedBy: 'admin@example.com',
            affectedSystems: ['database'],
            impactAssessment: 'High impact',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await incidentPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incident).toEqual(mockIncident);
      expect(mockCreateIncident).toHaveBeenCalledWith(
        'data_breach',
        'Suspected data breach',
        'high',
        'admin@example.com',
        ['database'],
        'High impact'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/security/incident',
        {
          method: 'POST',
          body: JSON.stringify({
            incidentType: 'data_breach',
            // Missing description, severity, reportedBy
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await incidentPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Required fields missing');
    });
  });

  describe('GET /api/security/incident', () => {
    it('should retrieve active incidents successfully', async () => {
      const mockIncidents = [
        {
          id: '1',
          incidentType: 'data_breach',
          description: 'Suspected data breach',
          severity: 'high',
          status: 'open',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockGetActiveIncidents = jest.fn().mockResolvedValue(mockIncidents);

      const {
        IncidentResponseService,
      } = require('@/lib/security/incident-response-service');
      IncidentResponseService.mockImplementation(() => ({
        getActiveIncidents: mockGetActiveIncidents,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/incident'
      );

      const response = await incidentGetHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incidents).toEqual(mockIncidents);
      expect(data.count).toBe(1);
    });
  });

  describe('GET /api/security/status', () => {
    it('should retrieve security status successfully', async () => {
      const mockAuditReport = {
        complianceScore: 95,
        openIssues: 2,
        criticalIssues: 0,
        lastScanDate: new Date().toISOString(),
      };

      const mockIncidentMetrics = {
        activeIncidents: 1,
        resolvedIncidents: 5,
        averageResolutionTime: '2 hours',
      };

      const mockApiStatus = {
        rateLimitStatus: 'normal',
        blockedRequests: 0,
        suspiciousActivity: false,
      };

      const mockGenerateReport = jest.fn().mockResolvedValue(mockAuditReport);
      const mockGetIncidentMetrics = jest
        .fn()
        .mockResolvedValue(mockIncidentMetrics);
      const mockGetSecurityStatus = jest.fn().mockResolvedValue(mockApiStatus);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      const {
        IncidentResponseService,
      } = require('@/lib/security/incident-response-service');
      const {
        APISecurityService,
      } = require('@/lib/security/api-security-service');

      SecurityAuditService.mockImplementation(() => ({
        generateSecurityReport: mockGenerateReport,
      }));

      IncidentResponseService.mockImplementation(() => ({
        getIncidentMetrics: mockGetIncidentMetrics,
      }));

      APISecurityService.mockImplementation(() => ({
        initialize: mockInitialize,
        getSecurityStatus: mockGetSecurityStatus,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/status'
      );

      const response = await statusHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBeDefined();
      expect(data.status.overall).toBeDefined();
      expect(data.status.audits).toEqual(mockAuditReport);
      expect(data.status.incidents).toEqual(mockIncidentMetrics);
      expect(data.status.api).toEqual(mockApiStatus);
    });
  });

  describe('POST /api/security/scan', () => {
    it('should initiate security scan successfully', async () => {
      const mockScan = {
        id: 'scan-123',
        scanType: 'vulnerability',
        target: 'application',
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      const mockRunVulnerabilityScan = jest.fn().mockResolvedValue(mockScan);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        runVulnerabilityScan: mockRunVulnerabilityScan,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/scan',
        {
          method: 'POST',
          body: JSON.stringify({
            scanType: 'vulnerability',
            target: 'application',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await scanHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.scan).toEqual(mockScan);
      expect(data.message).toBe('Security scan initiated');
      expect(mockRunVulnerabilityScan).toHaveBeenCalledWith(
        'vulnerability',
        'application'
      );
    });

    it('should use default scan parameters', async () => {
      const mockScan = {
        id: 'scan-123',
        scanType: 'vulnerability',
        target: 'application',
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      const mockRunVulnerabilityScan = jest.fn().mockResolvedValue(mockScan);

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        runVulnerabilityScan: mockRunVulnerabilityScan,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/scan',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await scanHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRunVulnerabilityScan).toHaveBeenCalledWith(
        'vulnerability',
        'application'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', async () => {
      const mockInitialize = jest
        .fn()
        .mockRejectedValue(new Error('Service initialization failed'));

      const {
        APISecurityService,
      } = require('@/lib/security/api-security-service');
      APISecurityService.mockImplementation(() => ({
        initialize: mockInitialize,
        getSecurityStatus: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/status'
      );

      const response = await statusHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve security status');
    });

    it('should handle audit service errors', async () => {
      const mockGetAudits = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const {
        SecurityAuditService,
      } = require('@/lib/security/security-audit-service');
      SecurityAuditService.mockImplementation(() => ({
        getSecurityAudits: mockGetAudits,
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/audit'
      );

      const response = await auditGetHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve audit logs');
    });
  });

  describe('Performance Tests', () => {
    it('should handle encryption operations within acceptable time', async () => {
      const mockEncrypt = jest.fn().mockImplementation(async () => {
        // Simulate encryption processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          encrypted: 'encrypted-data',
          keyId: 'key-123',
          algorithm: 'AES-256-GCM',
        };
      });

      const {
        DataEncryptionService,
      } = require('@/lib/security/data-encryption-service');
      DataEncryptionService.mockImplementation(() => ({
        encrypt: mockEncrypt,
        logEncryptionOperation: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/encrypt',
        {
          method: 'POST',
          body: JSON.stringify({
            data: 'test-data',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const startTime = Date.now();
      const response = await encryptHandler(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large data encryption', async () => {
      const largeData = 'x'.repeat(10000); // 10KB of data
      const mockEncrypt = jest.fn().mockResolvedValue({
        encrypted: 'encrypted-large-data',
        keyId: 'key-123',
        algorithm: 'AES-256-GCM',
      });

      const {
        DataEncryptionService,
      } = require('@/lib/security/data-encryption-service');
      DataEncryptionService.mockImplementation(() => ({
        encrypt: mockEncrypt,
        logEncryptionOperation: jest.fn(),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/security/encrypt',
        {
          method: 'POST',
          body: JSON.stringify({
            data: largeData,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await encryptHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEncrypt).toHaveBeenCalledWith(largeData, 'data');
    });
  });
});
