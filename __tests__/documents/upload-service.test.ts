import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabaseMock } from '../utils/supabase-mock';

// Mock the Supabase server module
jest.mock('../../lib/supabase/server', () => ({
  createClient: jest.fn(() => supabaseMock.getClient()),
}));

import { UploadService } from '../../lib/documents/upload-service';

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeEach(() => {
    supabaseMock.clearMocks();

    // Set up default authenticated user
    supabaseMock.setAuthUser({
      id: 'test-user-id',
      email: 'test@example.com',
    });

    // Set up mock data for upload
    supabaseMock.setInsertResult('documents', {
      id: 'test-document-id',
      document_name: 'Test Document',
      document_category: 'contract',
      is_public: false,
      user_id: 'test-user-id',
      file_path: 'documents/test-file.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
      document_type: 'application/pdf',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });

    // Create the service AFTER setting up mocks
    uploadService = new UploadService();
  });

  describe('validateFile', () => {
    it('should validate PDF files', async () => {
      const mockFile = new File(['pdf content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.file_type).toBe('application/pdf');
    });

    it('should validate image files', async () => {
      const mockFile = new File(['image content'], 'image.jpg', {
        type: 'image/jpeg',
      });

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.file_type).toBe('image/jpeg');
    });

    it('should reject executable files', async () => {
      const mockFile = new File(['executable content'], 'malicious.exe', {
        type: 'application/x-executable',
      });

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Executable files are not allowed');
    });

    it('should reject files with double extensions', async () => {
      const mockFile = new File(['malicious content'], 'document.pdf.exe', {
        type: 'application/pdf',
      });

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Double file extensions are not allowed');
    });

    it('should reject files with suspicious names', async () => {
      const mockFile = new File(
        ['malicious content'],
        'document<script>alert("xss")</script>.pdf',
        { type: 'application/pdf' }
      );

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Filename contains suspicious characters'
      );
    });

    it('should reject files that are too large', async () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const mockFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadService.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum limit');
    });
  });

  describe('scanFile', () => {
    it('should scan file for security threats', async () => {
      const mockFile = new File(['clean content'], 'test-document.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadService.scanFile(mockFile);

      expect(result).toBeDefined();
      expect(result.clean).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('should detect suspicious content', async () => {
      const suspiciousContent = 'eval(' + 'alert("xss")' + ')';
      const mockFile = new File([suspiciousContent], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadService.scanFile(mockFile);

      expect(result.clean).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });
  });

  describe('uploadFile', () => {
    it('should upload a valid file successfully', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });
      const metadata = {
        document_name: 'Test Document',
        document_category: 'contract',
      };

      const result = await uploadService.uploadFile(mockFile, metadata);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-document-id');
      expect(result.document_name).toBe('Test Document');
      expect(result.file_path).toBe('documents/test-file.pdf');
    });

    it('should throw error for invalid file', async () => {
      const mockFile = new File(['malicious content'], 'malicious.exe', {
        type: 'application/x-executable',
      });
      const metadata = {
        document_name: 'Malicious File',
        document_category: 'other',
      };

      await expect(
        uploadService.uploadFile(mockFile, metadata)
      ).rejects.toThrow('File validation failed');
    });
  });

  describe('getFileUrl', () => {
    it('should generate a signed URL for file access', async () => {
      const filePath = 'documents/test-document.pdf';

      const result = await uploadService.getFileUrl(filePath);

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.expires_at).toBeDefined();
    });
  });
});
