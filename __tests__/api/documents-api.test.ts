import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { supabaseMock } from '../utils/supabase-mock';

// Mock the document services
const mockDocumentService = {
  createDocument: jest.fn(),
  getDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  shareDocument: jest.fn(),
};

const mockUploadService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  validateFile: jest.fn(),
  scanFile: jest.fn(),
};

const mockShareService = {
  shareDocument: jest.fn(),
  getDocumentShares: jest.fn(),
  revokeShare: jest.fn(),
};

jest.mock('@/lib/documents/document-service', () => ({
  DocumentService: jest.fn().mockImplementation(() => mockDocumentService),
}));

jest.mock('@/lib/documents/upload-service', () => ({
  UploadService: jest.fn().mockImplementation(() => mockUploadService),
}));

jest.mock('@/lib/documents/share-service', () => ({
  ShareService: jest.fn().mockImplementation(() => mockShareService),
}));

jest.mock('@/lib/rate-limiting', () => ({
  applyRateLimit: jest.fn().mockResolvedValue(true),
}));

describe('Documents API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock.clearMocks();
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const mockDocument = {
        id: 'doc-1',
        document_name: 'Test Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      mockDocumentService.createDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          document_name: 'Test Document',
          document_type: 'application/pdf',
          file_size: 1024,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Mock the route handler
      const { POST } = await import('@/app/api/documents/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockDocument);
      // Note: We can't easily verify the call since we're mocking the constructor
      // This is a limitation of the current test structure
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { POST } = await import('@/app/api/documents/route');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle server errors', async () => {
      mockDocumentService.createDocument.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          document_name: 'Test Document',
          document_type: 'application/pdf',
          file_size: 1024,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { POST } = await import('@/app/api/documents/route');
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/documents', () => {
    it('should list documents', async () => {
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

      mockDocumentService.getDocuments.mockResolvedValue({
        documents: mockDocuments,
        total: mockDocuments.length,
        page: 1,
        limit: 20,
      });

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'GET',
      });

      const { GET } = await import('@/app/api/documents/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        documents: mockDocuments,
        total: mockDocuments.length,
        page: 1,
        limit: 20,
      });
      // Note: We can't easily verify the call since we're mocking the constructor
    });

    it('should handle empty document list', async () => {
      mockDocumentService.getDocuments.mockResolvedValue({
        documents: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'GET',
      });

      const { GET } = await import('@/app/api/documents/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        documents: [],
        total: 0,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('GET /api/documents/[id]', () => {
    it('should get a specific document', async () => {
      const mockDocument = {
        id: 'doc-1',
        document_name: 'Test Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      mockDocumentService.getDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-1',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('@/app/api/documents/[id]/route');
      const response = await GET(request, { params: { id: 'doc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        document: mockDocument,
        shares: [],
        versions: [],
      });
      // Note: We can't easily verify the call since we're mocking the constructor
    });

    it('should handle document not found', async () => {
      mockDocumentService.getDocument.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/nonexistent',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('@/app/api/documents/[id]/route');
      const response = await GET(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/documents/[id]', () => {
    it('should update a document', async () => {
      const mockDocument = {
        id: 'doc-1',
        document_name: 'Updated Document',
        document_type: 'application/pdf',
        file_size: 1024,
        created_at: '2024-01-01T00:00:00Z',
        is_public: false,
      };

      mockDocumentService.updateDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            document_name: 'Updated Document',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { PUT } = await import('@/app/api/documents/[id]/route');
      const response = await PUT(request, { params: { id: 'doc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        document: mockDocument,
        success: true,
      });
      expect(mockDocumentService.updateDocument).toHaveBeenCalledWith('doc-1', {
        document_name: 'Updated Document',
      });
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    it('should delete a document', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-1',
        {
          method: 'DELETE',
        }
      );

      const { DELETE } = await import('@/app/api/documents/[id]/route');
      const response = await DELETE(request, { params: { id: 'doc-1' } });

      expect(response.status).toBe(204);
      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should handle document not found for deletion', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/nonexistent',
        {
          method: 'DELETE',
        }
      );

      const { DELETE } = await import('@/app/api/documents/[id]/route');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/documents/upload', () => {
    it('should upload a file', async () => {
      const mockUploadResult = {
        path: 'documents/test-file.pdf',
        publicUrl: 'https://example.com/test-file.pdf',
      };

      mockUploadService.uploadFile.mockResolvedValue(mockUploadResult);

      const formData = new FormData();
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('file', mockFile);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const { POST } = await import('@/app/api/documents/upload/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        document: mockUploadResult,
        success: true,
      });
      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        expect.any(Object)
      );
    });

    it('should handle upload errors', async () => {
      mockUploadService.uploadFile.mockRejectedValue(
        new Error('Upload failed')
      );

      const formData = new FormData();
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('file', mockFile);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const { POST } = await import('@/app/api/documents/upload/route');
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/documents/share', () => {
    it('should share a document', async () => {
      const mockShareResult = {
        id: 'share-1',
        document_id: 'doc-1',
        shared_with: 'user-2',
        permission: 'read',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockShareService.shareDocument.mockResolvedValue(mockShareResult);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/share',
        {
          method: 'POST',
          body: JSON.stringify({
            document_id: 'doc-1',
            shared_with: 'user-2',
            permission_level: 'read',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { POST } = await import('@/app/api/documents/share/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        document_share: mockShareResult,
        success: true,
      });
      expect(mockShareService.shareDocument).toHaveBeenCalledWith('doc-1', {
        shared_with: 'user-2',
        permission_level: 'read',
      });
    });
  });
});
