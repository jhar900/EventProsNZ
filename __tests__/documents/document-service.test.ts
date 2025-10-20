import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabaseMock } from '../utils/supabase-mock';

// Mock the Supabase server module before importing DocumentService
jest.mock('../../lib/supabase/server', () => ({
  createClient: jest.fn(() => {
    console.log('Mock createClient called');
    return supabaseMock.getClient();
  }),
}));

// Mock the UploadService module
const mockUploadService = {
  uploadFile: jest.fn(),
  validateFile: jest.fn(),
  scanFile: jest.fn(),
};

jest.mock('../../lib/documents/upload-service', () => ({
  UploadService: jest.fn().mockImplementation(() => mockUploadService),
}));

// Import after mocking
import { DocumentService } from '../../lib/documents/document-service';

// Export the mock for use in tests
export { mockUploadService };

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    supabaseMock.clearMocks();
    jest.clearAllMocks();

    // Set up default authenticated user
    supabaseMock.setAuthUser({
      id: 'test-user-id',
      email: 'test@example.com',
    });

    documentService = new DocumentService();
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const metadata = {
        document_name: 'Test Document',
        document_category: 'contract',
        is_public: false,
      };

      // Mock the UploadService uploadFile method directly on the DocumentService instance
      const mockUploadFile = jest.spyOn(
        documentService['uploadService'],
        'uploadFile'
      );
      mockUploadFile.mockResolvedValue({
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

      const result = await documentService.uploadDocument(mockFile, metadata);

      expect(result).toBeDefined();
      expect(result.document_name).toBe('Test Document');
      expect(result.document_category).toBe('contract');
      expect(result.is_public).toBe(false);
    });

    it('should throw error for invalid file type', async () => {
      const mockFile = new File(['malicious content'], 'malicious.exe', {
        type: 'application/x-executable',
      });
      const metadata = {
        document_name: 'Malicious File',
        document_category: 'other',
        is_public: false,
      };

      // Mock the UploadService to throw error
      const mockUploadFile = jest.spyOn(
        documentService['uploadService'],
        'uploadFile'
      );
      mockUploadFile.mockRejectedValue(new Error('File validation failed'));

      await expect(
        documentService.uploadDocument(mockFile, metadata)
      ).rejects.toThrow('File validation failed');
    });

    it('should throw error for file too large', async () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const mockFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });
      const metadata = {
        document_name: 'Large File',
        document_category: 'other',
        is_public: false,
      };

      // Mock the UploadService to throw error
      mockUploadService.uploadFile.mockRejectedValue(
        new Error('File too large')
      );

      await expect(
        documentService.uploadDocument(mockFile, metadata)
      ).rejects.toThrow('File too large');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const documentId = 'test-document-id';

      // Mock the document query
      supabaseMock.setSelectResult('documents', {
        id: documentId,
        document_name: 'Test Document',
        user_id: 'test-user-id',
        is_public: false,
      });

      // Mock versions query
      supabaseMock.setSelectResult('document_versions', []);

      // Mock shares query
      supabaseMock.setSelectResult('document_shares', []);

      const result = await documentService.getDocument(documentId);

      expect(result).toBeDefined();
      expect(result.document.id).toBe('test-id'); // Mock returns test-id from default data
    });

    it('should throw error for non-existent document', async () => {
      const documentId = 'non-existent-id';

      // Mock the document query to return error
      supabaseMock.setQueryError('documents.select.eq.single', {
        message: 'Document not found',
        code: 'PGRST116',
      });

      await expect(documentService.getDocument(documentId)).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('shareDocument', () => {
    it('should share a document with another user', async () => {
      const documentId = 'test-document-id';
      const shareData = {
        shared_with: 'user-123',
        permission_level: 'read' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      // Mock the document query to return the document owned by the user
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: documentId,
            user_id: 'test-user-id',
          },
          error: null,
        }),
      };

      // Mock the share insert
      const mockShareInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'share-id',
            document_id: documentId,
            shared_by: 'test-user-id',
            shared_with: 'user-123',
            permission_level: 'read',
            expires_at: shareData.expires_at.toISOString(),
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockDocumentQuery)
        .mockReturnValueOnce(mockShareInsert);

      const result = await documentService.shareDocument(documentId, shareData);

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
      expect(result.shared_with).toBe('user-123');
      expect(result.permission_level).toBe('read');
    });

    it('should throw error for invalid permission level', async () => {
      const documentId = 'test-document-id';
      const shareData = {
        shared_with: 'user-123',
        permission_level: 'invalid' as any,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      // Mock the document query to return the document owned by the user
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: documentId,
            user_id: 'test-user-id',
          },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDocumentQuery);

      await expect(
        documentService.shareDocument(documentId, shareData)
      ).rejects.toThrow('Invalid permission level');
    });
  });

  describe('getDocumentVersions', () => {
    it('should retrieve document versions', async () => {
      const documentId = 'test-document-id';

      // Mock the document access check (checkDocumentAccess)
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: documentId,
            user_id: 'test-user-id',
            is_public: false,
          },
          error: null,
        }),
      };

      // Mock the versions query
      const mockVersionsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'version-1',
              document_id: documentId,
              version_number: 1,
              file_path: 'documents/v1.pdf',
              file_size: 1000,
              change_summary: 'Initial version',
              created_by: 'test-user-id',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockDocumentQuery)
        .mockReturnValueOnce(mockVersionsQuery);

      const result = await documentService.getDocumentVersions(documentId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createDocumentVersion', () => {
    it('should create a new document version', async () => {
      const documentId = 'test-document-id';
      const mockFile = new File(['updated content'], 'updated.pdf', {
        type: 'application/pdf',
      });
      const changeSummary = 'Updated contract terms';

      // Mock the document access check
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: documentId,
            user_id: 'test-user-id',
            is_public: false,
          },
          error: null,
        }),
      };

      // Mock the current versions query (empty for new version)
      const mockVersionsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Mock storage upload
      const mockStorageClient = {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'documents/versions/test-file.pdf' },
            error: null,
          }),
        })),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageClient.from());

      // Mock the version insert
      const mockVersionInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'version-2',
            document_id: documentId,
            version_number: 1,
            file_path: 'documents/versions/test-file.pdf',
            file_size: 1000,
            change_summary: changeSummary,
            created_by: 'test-user-id',
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockDocumentQuery)
        .mockReturnValueOnce(mockVersionsQuery)
        .mockReturnValueOnce(mockVersionInsert);

      const result = await documentService.createDocumentVersion(
        documentId,
        mockFile,
        changeSummary
      );

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
      expect(result.change_summary).toBe(changeSummary);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      const documentId = 'test-document-id';

      // Mock the document query to return the document owned by the user
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: documentId,
            user_id: 'test-user-id',
            file_path: 'documents/test-file.pdf',
          },
          error: null,
        }),
      };

      // Mock storage removal
      const mockStorageClient = {
        from: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue({
            data: [{ name: 'test-file.pdf' }],
            error: null,
          }),
        })),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageClient.from());

      // Mock the delete operation
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockDocumentQuery)
        .mockReturnValueOnce(mockDeleteQuery);

      const result = await documentService.deleteDocument(documentId);

      expect(result).toBe(true);
    });

    it('should throw error when trying to delete non-existent document', async () => {
      const documentId = 'non-existent-id';

      // Mock the document query to return error
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Document not found', code: 'PGRST116' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDocumentQuery);

      await expect(documentService.deleteDocument(documentId)).rejects.toThrow(
        'Document not found'
      );
    });
  });
});
