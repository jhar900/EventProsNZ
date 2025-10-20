import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabaseMock } from '../utils/supabase-mock';

// Mock Supabase using the utility
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => supabaseMock.getClient(),
}));

// Mock UploadService
const mockUploadService = {
  uploadFile: jest.fn(),
};

jest.mock('../../lib/documents/upload-service', () => ({
  UploadService: jest.fn().mockImplementation(() => mockUploadService),
}));

// Import after mocking
import { DocumentService } from '../../lib/documents/document-service';
import { UploadService } from '../../lib/documents/upload-service';

describe('DocumentService - Simple Tests', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = new DocumentService();
    supabaseMock.clearMocks();
    jest.clearAllMocks();

    // Set up authenticated user
    supabaseMock.setAuthUser({
      id: 'test-user-id',
      email: 'test@example.com',
    });
  });

  describe('Basic Functionality', () => {
    it('should create DocumentService instance', () => {
      expect(documentService).toBeDefined();
      expect(documentService).toBeInstanceOf(DocumentService);
    });

    it('should have uploadDocument method', () => {
      expect(typeof documentService.uploadDocument).toBe('function');
    });

    it('should have getDocument method', () => {
      expect(typeof documentService.getDocument).toBe('function');
    });

    it('should have shareDocument method', () => {
      expect(typeof documentService.shareDocument).toBe('function');
    });

    it('should have getDocumentVersions method', () => {
      expect(typeof documentService.getDocumentVersions).toBe('function');
    });

    it('should have createDocumentVersion method', () => {
      expect(typeof documentService.createDocumentVersion).toBe('function');
    });

    it('should have deleteDocument method', () => {
      expect(typeof documentService.deleteDocument).toBe('function');
    });
  });

  describe('Upload Document with Mock', () => {
    it('should upload a document successfully with mocked UploadService', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const metadata = {
        document_name: 'Test Document',
        document_category: 'contract',
        is_public: false,
      };

      // Mock the UploadService response
      const mockDocument = {
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
      };

      // Mock the uploadFile method directly on the instance
      const uploadServiceInstance = (documentService as any).uploadService;
      jest
        .spyOn(uploadServiceInstance, 'uploadFile')
        .mockResolvedValue(mockDocument);

      const result = await documentService.uploadDocument(mockFile, metadata);

      expect(result).toBeDefined();
      expect(result.document_name).toBe('Test Document');
      expect(result.document_category).toBe('contract');
      expect(result.is_public).toBe(false);
      expect(uploadServiceInstance.uploadFile).toHaveBeenCalledWith(
        mockFile,
        metadata
      );
    });
  });

  describe('Get Document with Mock', () => {
    it('should retrieve a document by ID', async () => {
      const documentId = 'test-document-id';

      // Mock the database responses
      const mockDocument = {
        id: 'test-document-id',
        document_name: 'Test Document',
        user_id: 'test-user-id',
        is_public: false,
      };

      const mockVersions = [];
      const mockShares = [];

      // Mock the Supabase responses using supabaseMock
      supabaseMock.setSelectResult('documents', mockDocument);
      supabaseMock.setSelectResult('document_versions', mockVersions);
      supabaseMock.setSelectResult('document_shares', mockShares);

      console.log('Mock data set for documents:', mockDocument);

      const result = await documentService.getDocument(documentId);

      console.log('Result received:', result);

      expect(result).toBeDefined();
      expect(result.document.id).toBe(documentId);
      expect(result.versions).toEqual(mockVersions);
      expect(result.shares).toEqual(mockShares);
    });
  });
});
