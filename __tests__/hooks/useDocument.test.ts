import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { supabaseMock } from '../utils/supabase-mock';

// Mock the document service
jest.mock('@/lib/documents/document-service', () => ({
  documentService: {
    createDocument: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn(),
    searchDocuments: jest.fn(),
    getDocumentVersions: jest.fn(),
    createDocumentVersion: jest.fn(),
  },
}));

jest.mock('@/lib/documents/upload-service', () => ({
  uploadService: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  },
}));

jest.mock('@/lib/documents/share-service', () => ({
  shareService: {
    shareDocument: jest.fn(),
    getDocumentShares: jest.fn(),
    revokeShare: jest.fn(),
  },
}));

// Import after mocking
import { useDocument } from '@/hooks/useDocument';
import { documentService } from '@/lib/documents/document-service';
import { uploadService } from '@/lib/documents/upload-service';
import { shareService } from '@/lib/documents/share-service';

describe('useDocument Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock.clearMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDocument());

      expect(result.current.documents).toEqual([]);
      expect(result.current.versions).toEqual([]);
      expect(result.current.permissions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadDocuments', () => {
    it('should load documents successfully', async () => {
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

      (documentService.listDocuments as jest.Mock).mockResolvedValue(
        mockDocuments
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.loadDocuments('user-1');
      });

      expect(result.current.documents).toEqual(mockDocuments);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load documents';
      (documentService.listDocuments as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.loadDocuments('user-1');
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const mockUploadResult = {
        path: 'documents/test.pdf',
        publicUrl: 'https://example.com/test.pdf',
      };
      const mockDocument = {
        id: 'doc-1',
        document_name: 'test.pdf',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      (uploadService.uploadFile as jest.Mock).mockResolvedValue(
        mockUploadResult
      );
      (documentService.createDocument as jest.Mock).mockResolvedValue(
        mockDocument
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.uploadFile(mockFile, 'user-1');
      });

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(documentService.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          document_name: 'test.pdf',
          document_type: 'application/pdf',
          file_path: 'documents/test.pdf',
          user_id: 'user-1',
        })
      );
      expect(result.current.documents).toContain(mockDocument);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const errorMessage = 'Upload failed';

      (uploadService.uploadFile as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.uploadFile(mockFile, 'user-1');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
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

      (documentService.deleteDocument as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useDocument());

      // Set initial documents
      act(() => {
        result.current.documents = mockDocuments;
      });

      await act(async () => {
        await result.current.deleteDocument('doc-1');
      });

      expect(documentService.deleteDocument).toHaveBeenCalledWith('doc-1');
      expect(result.current.documents).toEqual([]);
    });

    it('should handle deletion errors', async () => {
      const errorMessage = 'Deletion failed';
      (documentService.deleteDocument as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.deleteDocument('doc-1');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('shareDocument', () => {
    it('should share a document successfully', async () => {
      const mockShareResult = {
        id: 'share-1',
        document_id: 'doc-1',
        shared_with: 'user-2',
        permission: 'read',
        created_at: '2024-01-01T00:00:00Z',
      };

      (shareService.shareDocument as jest.Mock).mockResolvedValue(
        mockShareResult
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.shareDocument('doc-1', 'user-2', 'read');
      });

      expect(shareService.shareDocument).toHaveBeenCalledWith({
        document_id: 'doc-1',
        shared_with: 'user-2',
        permission: 'read',
      });
      expect(result.current.permissions).toContain(mockShareResult);
    });

    it('should handle sharing errors', async () => {
      const errorMessage = 'Sharing failed';
      (shareService.shareDocument as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.shareDocument('doc-1', 'user-2', 'read');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission successfully', async () => {
      const mockPermissions = [
        {
          id: 'share-1',
          document_id: 'doc-1',
          shared_with: 'user-2',
          permission: 'read',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (shareService.revokeShare as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useDocument());

      // Set initial permissions
      act(() => {
        result.current.permissions = mockPermissions;
      });

      await act(async () => {
        await result.current.revokePermission('share-1');
      });

      expect(shareService.revokeShare).toHaveBeenCalledWith('share-1');
      expect(result.current.permissions).toEqual([]);
    });
  });

  describe('createVersion', () => {
    it('should create a document version successfully', async () => {
      const mockFile = new File(['updated content'], 'updated.pdf', {
        type: 'application/pdf',
      });
      const mockVersion = {
        id: 'version-1',
        document_id: 'doc-1',
        version_number: 1,
        file_path: 'documents/updated.pdf',
        created_at: '2024-01-01T00:00:00Z',
        change_summary: 'Updated content',
      };

      (documentService.createDocumentVersion as jest.Mock).mockResolvedValue(
        mockVersion
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.createVersion(
          'doc-1',
          mockFile,
          'Updated content'
        );
      });

      expect(documentService.createDocumentVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          document_id: 'doc-1',
          change_summary: 'Updated content',
        })
      );
      expect(result.current.versions).toContain(mockVersion);
    });
  });

  describe('getDocumentVersions', () => {
    it('should get document versions successfully', async () => {
      const mockVersions = [
        {
          id: 'version-1',
          document_id: 'doc-1',
          version_number: 1,
          file_path: 'documents/test-v1.pdf',
          created_at: '2024-01-01T00:00:00Z',
          change_summary: 'Initial version',
        },
      ];

      (documentService.getDocumentVersions as jest.Mock).mockResolvedValue(
        mockVersions
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.getDocumentVersions('doc-1');
      });

      expect(documentService.getDocumentVersions).toHaveBeenCalledWith('doc-1');
      expect(result.current.versions).toEqual(mockVersions);
    });
  });

  describe('searchDocuments', () => {
    it('should search documents successfully', async () => {
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

      (documentService.searchDocuments as jest.Mock).mockResolvedValue(
        mockDocuments
      );

      const { result } = renderHook(() => useDocument());

      await act(async () => {
        await result.current.searchDocuments('user-1', 'Test');
      });

      expect(documentService.searchDocuments).toHaveBeenCalledWith(
        'user-1',
        'Test'
      );
      expect(result.current.documents).toEqual(mockDocuments);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useDocument());

      // Set an error
      act(() => {
        result.current.error = 'Some error';
      });

      expect(result.current.error).toBe('Some error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
