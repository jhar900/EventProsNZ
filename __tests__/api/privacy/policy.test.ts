import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '@/app/api/privacy/policy/route';
import { PrivacyPolicyService } from '@/lib/privacy/privacy-policy-service';

// Mock PrivacyPolicyService
jest.mock('@/lib/privacy/privacy-policy-service');
jest.mock('@/lib/middleware/security-middleware');
jest.mock('@/lib/rate-limiting');
jest.mock('@/lib/cache/cache-middleware');

const mockPrivacyPolicyService = {
  getActivePrivacyPolicy: jest.fn(),
  getPrivacyPolicyByVersion: jest.fn(),
  createPrivacyPolicy: jest.fn(),
  updatePrivacyPolicy: jest.fn(),
} as jest.Mocked<PrivacyPolicyService>;

const mockPolicy = {
  id: 'policy-1',
  title: 'Privacy Policy v2.1',
  content: 'This is our privacy policy...',
  version: '2.1',
  effectiveDate: new Date('2024-01-15'),
  isActive: true,
  dataHandlingProcedures: [
    {
      procedure: 'Data Collection',
      description: 'We collect personal data for service provision',
      legalBasis: 'Contractual necessity',
    },
  ],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'admin',
};

describe('/api/privacy/policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should get active privacy policy', async () => {
      mockPrivacyPolicyService.getActivePrivacyPolicy.mockResolvedValueOnce(
        mockPolicy
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPolicy);
    });

    it('should get privacy policy by version', async () => {
      mockPrivacyPolicyService.getPrivacyPolicyByVersion.mockResolvedValueOnce(
        mockPolicy
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?version=2.1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPolicy);
    });

    it('should return 404 when policy not found', async () => {
      mockPrivacyPolicyService.getActivePrivacyPolicy.mockResolvedValueOnce(
        null
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Privacy policy not found');
    });

    it('should exclude content when includeContent=false', async () => {
      mockPrivacyPolicyService.getActivePrivacyPolicy.mockResolvedValueOnce(
        mockPolicy
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?includeContent=false'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.content).toBeUndefined();
    });

    it('should return 400 for invalid parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?includeContent=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('should return 500 for service errors', async () => {
      mockPrivacyPolicyService.getActivePrivacyPolicy.mockRejectedValueOnce(
        new Error('Service error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get privacy policy');
    });
  });

  describe('POST', () => {
    it('should create a new privacy policy', async () => {
      mockPrivacyPolicyService.createPrivacyPolicy.mockResolvedValueOnce(
        mockPolicy
      );

      const requestBody = {
        title: 'Privacy Policy v2.1',
        content: 'This is our privacy policy...',
        version: '2.1',
        effectiveDate: '2024-01-15T00:00:00Z',
        dataHandlingProcedures: [
          {
            procedure: 'Data Collection',
            description: 'We collect personal data for service provision',
            legalBasis: 'Contractual necessity',
          },
        ],
        isActive: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'admin',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPolicy);
      expect(mockPrivacyPolicyService.createPrivacyPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Privacy Policy v2.1',
          version: '2.1',
          effectiveDate: expect.any(Date),
          createdBy: 'admin',
        })
      );
    });

    it('should return 400 for invalid request data', async () => {
      const requestBody = {
        title: '', // Invalid: empty title
        content: 'This is our privacy policy...',
        version: '2.1',
        effectiveDate: '2024-01-15T00:00:00Z',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy',
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
      mockPrivacyPolicyService.createPrivacyPolicy.mockRejectedValueOnce(
        new Error('Service error')
      );

      const requestBody = {
        title: 'Privacy Policy v2.1',
        content: 'This is our privacy policy...',
        version: '2.1',
        effectiveDate: '2024-01-15T00:00:00Z',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy',
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
      expect(data.error).toBe('Failed to create privacy policy');
    });
  });

  describe('PUT', () => {
    it('should update a privacy policy', async () => {
      mockPrivacyPolicyService.updatePrivacyPolicy.mockResolvedValueOnce(
        mockPolicy
      );

      const requestBody = {
        title: 'Updated Privacy Policy',
        content: 'Updated content...',
        version: '2.2',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?id=policy-1',
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
      expect(data.data).toEqual(mockPolicy);
      expect(mockPrivacyPolicyService.updatePrivacyPolicy).toHaveBeenCalledWith(
        'policy-1',
        expect.objectContaining({
          title: 'Updated Privacy Policy',
          content: 'Updated content...',
          version: '2.2',
          updatedBy: 'admin',
        })
      );
    });

    it('should return 400 when policy ID is missing', async () => {
      const requestBody = {
        title: 'Updated Privacy Policy',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy',
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
      expect(data.error).toBe('Policy ID is required');
    });

    it('should return 404 when policy not found', async () => {
      mockPrivacyPolicyService.updatePrivacyPolicy.mockResolvedValueOnce(null);

      const requestBody = {
        title: 'Updated Privacy Policy',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?id=nonexistent',
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
      expect(data.error).toBe('Privacy policy not found');
    });

    it('should return 400 for invalid request data', async () => {
      const requestBody = {
        title: '', // Invalid: empty title
        version: '2.2',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?id=policy-1',
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
      mockPrivacyPolicyService.updatePrivacyPolicy.mockRejectedValueOnce(
        new Error('Service error')
      );

      const requestBody = {
        title: 'Updated Privacy Policy',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/privacy/policy?id=policy-1',
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
      expect(data.error).toBe('Failed to update privacy policy');
    });
  });
});
