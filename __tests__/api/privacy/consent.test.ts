import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/privacy/consent/route';
import { ConsentManagementService } from '@/lib/privacy/consent-management-service';

// Mock ConsentManagementService
jest.mock('@/lib/privacy/consent-management-service');
jest.mock('@/lib/middleware/security-middleware');
jest.mock('@/lib/rate-limiting');
jest.mock('@/lib/cache/cache-middleware');

const mockConsentService = {
  getUserConsents: jest.fn(),
  getConsentsByType: jest.fn(),
  getAllConsents: jest.fn(),
  createConsent: jest.fn(),
  updateConsent: jest.fn(),
  grantConsent: jest.fn(),
  withdrawConsent: jest.fn(),
} as jest.Mocked<ConsentManagementService>;

const mockConsent = {
  id: 'consent-1',
  userId: 'user-123',
  consentType: 'marketing',
  purpose: 'Send promotional emails',
  legalBasis: 'consent',
  dataCategories: ['email', 'name'],
  retentionPeriod: 365,
  isRequired: false,
  canWithdraw: true,
  status: 'active',
  grantedAt: new Date('2024-01-15'),
  expiresAt: new Date('2025-01-15'),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'user-123',
};

describe('/api/privacy/consent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should get user consents', async () => {
      mockConsentService.getUserConsents.mockResolvedValueOnce([mockConsent]);

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?userId=user-123'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockConsent]);
    });

    it('should get consents by type', async () => {
      mockConsentService.getConsentsByType.mockResolvedValueOnce([mockConsent]);

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?consentType=marketing'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockConsent]);
    });

    it('should get all consents', async () => {
      mockConsentService.getAllConsents.mockResolvedValueOnce([mockConsent]);

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockConsent]);
    });

    it('should filter consents by status', async () => {
      mockConsentService.getUserConsents.mockResolvedValueOnce([mockConsent]);

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?userId=user-123&status=active'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockConsent]);
    });

    it('should return 400 for invalid parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?status=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('should return 500 for service errors', async () => {
      mockConsentService.getUserConsents.mockRejectedValueOnce(
        new Error('Service error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?userId=user-123'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get consent data');
    });
  });

  describe('POST', () => {
    it('should create a new consent', async () => {
      mockConsentService.createConsent.mockResolvedValueOnce(mockConsent);

      const requestBody = {
        userId: 'user-123',
        consentType: 'marketing',
        purpose: 'Send promotional emails',
        legalBasis: 'consent',
        dataCategories: ['email', 'name'],
        retentionPeriod: 365,
        isRequired: false,
        canWithdraw: true,
        expiresAt: '2025-01-15T00:00:00Z',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'user-123',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConsent);
    });

    it('should grant existing consent', async () => {
      mockConsentService.grantConsent.mockResolvedValueOnce(mockConsent);

      const requestBody = {
        consentId: 'consent-1',
        grantedAt: '2024-01-15T10:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-action': 'grant',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConsent);
    });

    it('should return 400 for invalid request data', async () => {
      const requestBody = {
        userId: '', // Invalid: empty userId
        consentType: 'marketing',
        purpose: 'Send promotional emails',
        legalBasis: 'consent',
        dataCategories: ['email'],
        retentionPeriod: 365,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 500 for service errors', async () => {
      mockConsentService.createConsent.mockRejectedValueOnce(
        new Error('Service error')
      );

      const requestBody = {
        userId: 'user-123',
        consentType: 'marketing',
        purpose: 'Send promotional emails',
        legalBasis: 'consent',
        dataCategories: ['email'],
        retentionPeriod: 365,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process consent request');
    });
  });

  describe('PUT', () => {
    it('should update consent information', async () => {
      mockConsentService.updateConsent.mockResolvedValueOnce(mockConsent);

      const requestBody = {
        status: 'withdrawn',
        purpose: 'Updated purpose',
        retentionPeriod: 730,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'admin',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConsent);
    });

    it('should return 400 when consent ID is missing', async () => {
      const requestBody = {
        status: 'withdrawn',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Consent ID is required');
    });

    it('should return 404 when consent not found', async () => {
      mockConsentService.updateConsent.mockResolvedValueOnce(null);

      const requestBody = {
        status: 'withdrawn',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=nonexistent',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Consent not found');
    });

    it('should return 400 for invalid request data', async () => {
      const requestBody = {
        status: 'invalid', // Invalid status
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 500 for service errors', async () => {
      mockConsentService.updateConsent.mockRejectedValueOnce(
        new Error('Service error')
      );

      const requestBody = {
        status: 'withdrawn',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update consent');
    });
  });

  describe('DELETE', () => {
    it('should withdraw consent', async () => {
      mockConsentService.withdrawConsent.mockResolvedValueOnce(mockConsent);

      const requestBody = {
        reason: 'User requested withdrawal',
        withdrawnAt: '2024-01-15T10:00:00Z',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConsent);
    });

    it('should return 400 when consent ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Consent ID is required');
    });

    it('should return 404 when consent not found', async () => {
      mockConsentService.withdrawConsent.mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=nonexistent',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Consent not found');
    });

    it('should return 400 for invalid request data', async () => {
      const requestBody = {
        reason: 'x'.repeat(501), // Too long
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 500 for service errors', async () => {
      mockConsentService.withdrawConsent.mockRejectedValueOnce(
        new Error('Service error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/consent?id=consent-1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to withdraw consent');
    });
  });
});
