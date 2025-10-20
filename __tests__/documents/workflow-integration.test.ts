import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DocumentService } from '../../lib/documents/document-service';
import { UploadService } from '../../lib/documents/upload-service';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

jest.mock('../../lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Document Workflow Integration Tests', () => {
  let documentService: DocumentService;
  let uploadService: UploadService;

  beforeEach(() => {
    documentService = new DocumentService();
    uploadService = new UploadService();
    jest.clearAllMocks();

    // Set up authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });
  });

  describe('Complete Document Lifecycle', () => {
    it('should handle complete document workflow: upload -> share -> version -> delete', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const metadata = {
        document_name: 'Test Document',
        document_category: 'contract',
        is_public: false,
      };

      // Mock document creation
      const mockDocument = {
        id: 'doc-123',
        document_name: 'Test Document',
        document_category: 'contract',
        is_public: false,
        user_id: 'test-user-id',
        file_path: 'documents/test.pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
        document_type: 'application/pdf',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock share creation
      const mockShare = {
        id: 'share-123',
        document_id: 'doc-123',
        shared_by: 'test-user-id',
        shared_with: 'other-user-id',
        permission_level: 'read',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock version creation
      const mockVersion = {
        id: 'version-123',
        document_id: 'doc-123',
        version_number: 1,
        file_path: 'documents/test-v1.pdf',
        file_size: 1000,
        change_summary: 'Initial version',
        created_by: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock all the database operations
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };

      const mockShareInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockShare,
          error: null,
        }),
      };

      const mockVersionInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockVersion,
          error: null,
        }),
      };

      const mockVersionsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockVersion],
          error: null,
        }),
      };

      const mockSharesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockShare],
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock storage operations
      const mockStorageClient = {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'documents/test.pdf' },
            error: null,
          }),
          remove: jest.fn().mockResolvedValue({
            data: [{ name: 'test.pdf' }],
            error: null,
          }),
        })),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageClient.from());

      // Set up the sequence of mock calls
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // Document creation
        .mockReturnValueOnce(mockDocumentQuery) // Share document check
        .mockReturnValueOnce(mockShareInsert) // Share creation
        .mockReturnValueOnce(mockDocumentQuery) // Version document check
        .mockReturnValueOnce(mockVersionsQuery) // Get current versions
        .mockReturnValueOnce(mockVersionInsert) // Version creation
        .mockReturnValueOnce(mockDocumentQuery) // Delete document check
        .mockReturnValueOnce(mockDeleteQuery); // Document deletion

      // 1. Upload document
      const uploadedDocument = await documentService.uploadDocument(
        mockFile,
        metadata
      );
      expect(uploadedDocument).toBeDefined();
      expect(uploadedDocument.document_name).toBe('Test Document');

      // 2. Share document
      const shareData = {
        shared_with: 'other-user-id',
        permission_level: 'read' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      const sharedDocument = await documentService.shareDocument(
        'doc-123',
        shareData
      );
      expect(sharedDocument).toBeDefined();
      expect(sharedDocument.document_id).toBe('doc-123');

      // 3. Create version
      const versionFile = new File(['updated content'], 'test-v1.pdf', {
        type: 'application/pdf',
      });
      const version = await documentService.createDocumentVersion(
        'doc-123',
        versionFile,
        'Updated contract terms'
      );
      expect(version).toBeDefined();
      expect(version.document_id).toBe('doc-123');

      // 4. Get document with versions and shares
      const documentDetail = await documentService.getDocument('doc-123');
      expect(documentDetail).toBeDefined();
      expect(documentDetail.document.id).toBe('doc-123');
      expect(documentDetail.versions).toHaveLength(1);
      expect(documentDetail.shares).toHaveLength(1);

      // 5. Delete document
      const deleteResult = await documentService.deleteDocument('doc-123');
      expect(deleteResult).toBe(true);
    });
  });

  describe('Large File Upload Workflow', () => {
    it('should handle large file upload with chunked processing', async () => {
      // Create a large file (simulate 15MB)
      const largeContent = 'x'.repeat(15 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large-document.pdf', {
        type: 'application/pdf',
      });

      const metadata = {
        document_name: 'Large Document',
        document_category: 'presentation',
        is_public: false,
      };

      // Mock chunked upload process
      const mockDocument = {
        id: 'large-doc-123',
        document_name: 'Large Document',
        document_category: 'presentation',
        is_public: false,
        user_id: 'test-user-id',
        file_path: 'documents/large-document.pdf',
        file_size: 15 * 1024 * 1024,
        mime_type: 'application/pdf',
        document_type: 'application/pdf',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };

      // Mock storage for chunked upload
      const mockStorageClient = {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'documents/large-document.pdf' },
            error: null,
          }),
          remove: jest.fn().mockResolvedValue({
            data: [{ name: 'chunk' }],
            error: null,
          }),
        })),
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageClient.from());

      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // Initial document creation
        .mockReturnValueOnce(mockUpdateQuery); // Update with final file path

      // Test chunked upload
      const result = await documentService.uploadDocument(largeFile, metadata);
      expect(result).toBeDefined();
      expect(result.document_name).toBe('Large Document');
      expect(result.file_size).toBe(15 * 1024 * 1024);
    });
  });

  describe('Document Security Workflow', () => {
    it('should handle security scanning and validation workflow', async () => {
      // Test with a potentially suspicious file
      const suspiciousFile = new File(
        ['<script>alert("xss")</script>'],
        'suspicious.html',
        {
          type: 'text/html',
        }
      );

      const metadata = {
        document_name: 'Suspicious File',
        document_category: 'other',
        is_public: false,
      };

      // Mock validation to return security threats
      const mockValidation = {
        valid: false,
        file_type: 'text/html',
        errors: ['Filename contains suspicious characters'],
        security_scan: {
          is_safe: false,
          clean: false,
          threats: ['Script injection pattern detected'],
          threats_detected: ['Script injection pattern detected'],
          scan_timestamp: new Date().toISOString(),
        },
      };

      // Mock the UploadService validation
      jest
        .spyOn(uploadService, 'validateFile')
        .mockResolvedValue(mockValidation);

      // Test that suspicious files are rejected
      await expect(
        documentService.uploadDocument(suspiciousFile, metadata)
      ).rejects.toThrow('File validation failed');
    });
  });

  describe('Document Collaboration Workflow', () => {
    it('should handle multi-user document collaboration', async () => {
      const mockFile = new File(
        ['collaborative content'],
        'collaborative.pdf',
        {
          type: 'application/pdf',
        }
      );
      const metadata = {
        document_name: 'Collaborative Document',
        document_category: 'contract',
        is_public: false,
      };

      const mockDocument = {
        id: 'collab-doc-123',
        document_name: 'Collaborative Document',
        user_id: 'owner-user-id',
        is_public: false,
      };

      const mockShare1 = {
        id: 'share-1',
        document_id: 'collab-doc-123',
        shared_with: 'user-1',
        permission_level: 'edit',
        is_active: true,
      };

      const mockShare2 = {
        id: 'share-2',
        document_id: 'collab-doc-123',
        shared_with: 'user-2',
        permission_level: 'read',
        is_active: true,
      };

      // Mock database operations for collaboration
      const mockDocumentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };

      const mockShareInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockShare1,
          error: null,
        }),
      };

      const mockSharesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockShare1, mockShare2],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockDocumentQuery) // Check document ownership
        .mockReturnValueOnce(mockShareInsert) // Share with user 1
        .mockReturnValueOnce(mockDocumentQuery) // Check document ownership
        .mockReturnValueOnce(mockShareInsert) // Share with user 2
        .mockReturnValueOnce(mockSharesQuery); // Get all shares

      // Share with multiple users
      const share1 = await documentService.shareDocument('collab-doc-123', {
        shared_with: 'user-1',
        permission_level: 'edit',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const share2 = await documentService.shareDocument('collab-doc-123', {
        shared_with: 'user-2',
        permission_level: 'read',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(share1).toBeDefined();
      expect(share2).toBeDefined();

      // Get document with all shares
      const documentDetail =
        await documentService.getDocument('collab-doc-123');
      expect(documentDetail.shares).toHaveLength(2);
    });
  });
});
