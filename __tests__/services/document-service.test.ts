import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabaseMock } from '../utils/supabase-mock';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => supabaseMock.getClient()),
}));

// Import after mocking
import { documentService } from '@/lib/documents/document-service';

describe('Document Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock.clearMocks();
  });

  describe('createDocument', () => {
    it('should create a new document', async () => {
      const mockDocument = {
        id: 'doc-1',
        document_name: 'Test Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      supabaseMock.setInsertResult('documents', mockDocument);

      const result = await documentService.createDocument({
        document_name: 'Test Document',
        document_type: 'application/pdf',
        file_size: 1024,
        file_path: 'documents/test.pdf',
        user_id: 'user-1',
      });

      expect(result).toEqual(mockDocument);
    });

    it('should handle creation errors', async () => {
      supabaseMock.setQueryError('documents.insert', {
        message: 'Database error',
        code: 'PGRST301',
      });

      await expect(
        documentService.createDocument({
          document_name: 'Test Document',
          document_type: 'application/pdf',
          file_size: 1024,
          file_path: 'documents/test.pdf',
          user_id: 'user-1',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument = {
        id: 'doc-1',
        document_name: 'Test Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      supabaseMock.setSelectResult('documents', mockDocument);

      const result = await documentService.getDocument('doc-1');

      expect(result).toEqual(mockDocument);
    });

    it('should return null for non-existent document', async () => {
      supabaseMock.setSelectResult('documents', null);

      const result = await documentService.getDocument('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listDocuments', () => {
    it('should list documents for a user', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          document_name: 'Test Document 1',
          document_type: 'application/pdf',
          file_size: 1024,
          created_at: '2024-01-01T00:00:00Z',
          is_public: false,
        },
        {
          id: 'doc-2',
          document_name: 'Test Document 2',
          document_type: 'application/pdf',
          file_size: 2048,
          created_at: '2024-01-02T00:00:00Z',
          is_public: true,
        },
      ];

      supabaseMock.setSelectResult('documents', mockDocuments);

      const result = await documentService.listDocuments('user-1');

      expect(result).toEqual(mockDocuments);
    });

    it('should handle empty document list', async () => {
      supabaseMock.setSelectResult('documents', []);

      const result = await documentService.listDocuments('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateDocument', () => {
    it('should update a document', async () => {
      const mockUpdatedDocument = {
        id: 'doc-1',
        document_name: 'Updated Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      supabaseMock.setUpdateResult('documents', mockUpdatedDocument);

      const result = await documentService.updateDocument('doc-1', {
        document_name: 'Updated Document',
      });

      expect(result).toEqual(mockUpdatedDocument);
    });

    it('should handle update errors', async () => {
      supabaseMock.setQueryError('documents.update', {
        message: 'Update failed',
        code: 'PGRST301',
      });

      await expect(
        documentService.updateDocument('doc-1', {
          document_name: 'Updated Document',
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      supabaseMock.setDeleteResult('documents', { id: 'doc-1' });

      const result = await documentService.deleteDocument('doc-1');

      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      supabaseMock.setQueryError('documents.delete', {
        message: 'Deletion failed',
        code: 'PGRST301',
      });

      await expect(documentService.deleteDocument('doc-1')).rejects.toThrow(
        'Deletion failed'
      );
    });
  });

  describe('searchDocuments', () => {
    it('should search documents by name', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          document_name: 'Test Document',
          document_type: 'application/pdf',
          file_size: 1024,
          created_at: '2024-01-01T00:00:00Z',
          is_public: false,
        },
      ];

      supabaseMock.setSelectResult('documents', mockDocuments);

      const result = await documentService.searchDocuments('user-1', 'Test');

      expect(result).toEqual(mockDocuments);
    });

    it('should handle search with no results', async () => {
      supabaseMock.setSelectResult('documents', []);

      const result = await documentService.searchDocuments(
        'user-1',
        'Nonexistent'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentVersions', () => {
    it('should get document versions', async () => {
      const mockVersions = [
        {
          id: 'version-1',
          document_id: 'doc-1',
          version_number: 1,
          file_path: 'documents/test-v1.pdf',
          created_at: '2024-01-01T00:00:00Z',
          change_summary: 'Initial version',
        },
        {
          id: 'version-2',
          document_id: 'doc-1',
          version_number: 2,
          file_path: 'documents/test-v2.pdf',
          created_at: '2024-01-02T00:00:00Z',
          change_summary: 'Updated content',
        },
      ];

      supabaseMock.setSelectResult('document_versions', mockVersions);

      const result = await documentService.getDocumentVersions('doc-1');

      expect(result).toEqual(mockVersions);
    });
  });

  describe('createDocumentVersion', () => {
    it('should create a new document version', async () => {
      const mockVersion = {
        id: 'version-1',
        document_id: 'doc-1',
        version_number: 1,
        file_path: 'documents/test-v1.pdf',
        created_at: '2024-01-01T00:00:00Z',
        change_summary: 'Initial version',
      };

      supabaseMock.setInsertResult('document_versions', mockVersion);

      const result = await documentService.createDocumentVersion({
        document_id: 'doc-1',
        file_path: 'documents/test-v1.pdf',
        change_summary: 'Initial version',
      });

      expect(result).toEqual(mockVersion);
    });
  });
});
