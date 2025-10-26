import { DataExportService } from '@/lib/privacy/data-export-service';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockExportRecord, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockExportRecord, error: null })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [mockExportRecord], error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockExportRecord, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })
  }
}));

// Mock DataEncryptionService
jest.mock('@/lib/security/data-encryption-service');

const mockExportRecord = {
  id: 'export-id',
  user_id: 'user-123',
  format: 'json',
  status: 'completed',
  file_path: '/exports/user-123_20240115.json',
  file_size: 1024,
  expires_at: '2024-01-22T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_by: 'user-123'
};

const mockUserData = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    created_at: '2024-01-01T00:00:00Z'
  },
  events: [
    {
      id: 'event-1',
      title: 'Test Event',
      description: 'A test event',
      date: '2024-01-15T10:00:00Z'
    }
  ],
  inquiries: [
    {
      id: 'inquiry-1',
      subject: 'Test Inquiry',
      message: 'This is a test inquiry',
      created_at: '2024-01-10T10:00:00Z'
    }
  ],
  payments: [
    {
      id: 'payment-1',
      amount: 100.00,
      currency: 'USD',
      status: 'completed',
      created_at: '2024-01-12T10:00:00Z'
    }
  ],
  collectedAt: '2024-01-15T10:00:00Z'
};

describe('DataExportService', () => {
  let service: DataExportService;
  let mockSupabase: any;
  let mockEncryptionService: jest.Mocked<DataEncryptionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DataExportService();
    mockSupabase = require('@/lib/supabase/client').supabase;
    mockEncryptionService = new DataEncryptionService() as jest.Mocked<DataEncryptionService>;
  });

  describe('createExportRequest', () => {
    it('should create a new export request', async () => {
      const exportData = {
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        filePath: '/exports/user-123.json',
        expiresAt: new Date('2024-01-22'),
        createdBy: 'user-123'
      };

      const result = await service.createExportRequest(exportData);

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports');
      expect(result).toEqual(expect.objectContaining({
        id: 'export-id',
        userId: 'user-123',
        format: 'json'
      }));
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const exportData = {
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        filePath: '/exports/user-123.json',
        expiresAt: new Date(),
        createdBy: 'user-123'
      };

      await expect(service.createExportRequest(exportData))
        .rejects.toThrow('Failed to create export request');
    });
  });

  describe('getExportRequest', () => {
    it('should get an export request by ID', async () => {
      const result = await service.getExportRequest('export-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports');
      expect(result).toEqual(expect.objectContaining({
        id: 'export-id',
        userId: 'user-123'
      }));
    });

    it('should return null when export not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await service.getExportRequest('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('processExportRequest', () => {
    it('should process an export request', async () => {
      // Mock the collectUserData method
      jest.spyOn(service, 'collectUserData').mockResolvedValueOnce(mockUserData);
      jest.spyOn(service, 'generateExportFile').mockResolvedValueOnce('exported-data');
      jest.spyOn(service, 'updateExportStatus').mockResolvedValueOnce(mockExportRecord);

      const result = await service.processExportRequest('export-id');

      expect(result).toEqual(expect.objectContaining({
        id: 'export-id',
        status: 'completed'
      }));
    });

    it('should handle processing errors', async () => {
      jest.spyOn(service, 'collectUserData').mockRejectedValueOnce(new Error('Collection failed'));

      await expect(service.processExportRequest('export-id'))
        .rejects.toThrow('Failed to process export request');
    });
  });

  describe('collectUserData', () => {
    it('should collect user data from multiple tables', async () => {
      // Mock multiple Supabase calls
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

  describe('generateExportFile', () => {
    it('should generate JSON export file', async () => {
      const result = await service.generateExportFile(mockUserData, 'json');

      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should generate CSV export file', async () => {
      const result = await service.generateExportFile(mockUserData, 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('User Data');
    });

    it('should generate XML export file', async () => {
      const result = await service.generateExportFile(mockUserData, 'xml');

      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml');
      expect(result).toContain('<userData>');
    });

    it('should throw error for unsupported format', async () => {
      await expect(service.generateExportFile(mockUserData, 'unsupported' as any))
        .rejects.toThrow('Unsupported export format');
    });
  });

  describe('formatUserData', () => {
    it('should format data as JSON', () => {
      const result = service.formatUserData(mockUserData, 'json');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(expect.objectContaining({
        user: mockUserData.user,
        events: mockUserData.events
      }));
    });

    it('should format data as CSV', () => {
      const result = service.formatUserData(mockUserData, 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('User Data');
      expect(result).toContain('Events Data');
    });

    it('should format data as XML', () => {
      const result = service.formatUserData(mockUserData, 'xml');

      expect(typeof result).toBe('string');
      expect(result).toContain('<?xml');
      expect(result).toContain('<userData>');
    });
  });

  describe('updateExportStatus', () => {
    it('should update export status', async () => {
      const result = await service.updateExportStatus('export-id', 'completed', {
        fileSize: 1024,
        filePath: '/exports/user-123.json'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports');
      expect(result).toEqual(expect.objectContaining({
        id: 'export-id'
      }));
    });
  });

  describe('getUserExports', () => {
    it('should get exports for a user', async () => {
      const result = await service.getUserExports('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        userId: 'user-123'
      }));
    });
  });

  describe('deleteExpiredExports', () => {
    it('should delete expired exports', async () => {
      mockSupabase.from().select().lt.mockResolvedValueOnce({
        data: [mockExportRecord],
        error: null
      });

      const result = await service.deleteExpiredExports();

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports');
      expect(result).toBe(1);
    });
  });

  describe('getExportAnalytics', () => {
    it('should get export analytics', async () => {
      mockSupabase.from().select().gte.mockResolvedValueOnce({
        data: [mockExportRecord],
        error: null
      });

      const result = await service.getExportAnalytics('month');

      expect(result).toEqual(expect.objectContaining({
        totalExports: 1,
        exportsByFormat: expect.any(Object),
        exportsByStatus: expect.any(Object),
        averageFileSize: expect.any(Number)
      }));
    });
  });

  describe('validateExportRequest', () => {
    it('should validate export request data', () => {
      const validData = {
        userId: 'user-123',
        format: 'json',
        status: 'pending',
        filePath: '/exports/user-123.json',
        expiresAt: new Date(),
        createdBy: 'user-123'
      };

      const result = service.validateExportRequest(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = {
        userId: '',
        format: 'invalid',
        status: 'invalid',
        filePath: '',
        expiresAt: new Date('2020-01-01'), // Past date
        createdBy: ''
      };

      const result = service.validateExportRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('encryptExportFile', () => {
    it('should encrypt export file', async () => {
      const testData = 'sensitive data';
      const encryptedData = 'encrypted-data';

      mockEncryptionService.encrypt.mockResolvedValueOnce(encryptedData);

      const result = await service.encryptExportFile(testData);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(testData);
      expect(result).toBe(encryptedData);
    });
  });

  describe('decryptExportFile', () => {
    it('should decrypt export file', async () => {
      const encryptedData = 'encrypted-data';
      const decryptedData = 'decrypted-data';

      mockEncryptionService.decrypt.mockResolvedValueOnce(decryptedData);

      const result = await service.decryptExportFile(encryptedData);

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedData);
      expect(result).toBe(decryptedData);
    });
  });
});
