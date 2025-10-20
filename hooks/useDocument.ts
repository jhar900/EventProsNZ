import { useState, useEffect } from 'react';
import {
  Document,
  DocumentShare,
  DocumentFilters,
  DocumentListResponse,
} from '@/types/documents';
import { DocumentService } from '@/lib/documents/document-service';
import { ShareService } from '@/lib/documents/share-service';

const documentService = new DocumentService();
const shareService = new ShareService();

export function useDocument() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<DocumentShare[]>([]);
  const [sharedByMe, setSharedByMe] = useState<DocumentShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async (
    filters?: DocumentFilters,
    page = 1,
    limit = 20
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await documentService.getDocuments(filters, page, limit);
      setDocuments(result.documents);

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedDocuments = async () => {
    try {
      const [sharedWithMeData, sharedByMeData] = await Promise.all([
        shareService.getSharedWithMe(),
        shareService.getSharedByMe(),
      ]);

      setSharedWithMe(sharedWithMeData);
      setSharedByMe(sharedByMeData);
    } catch (err) {
      console.error('Failed to load shared documents:', err);
    }
  };

  const uploadDocument = async (file: File, metadata: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const document = await documentService.uploadFile(file, metadata);
      setDocuments(prev => [document, ...prev]);

      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      // Also remove from shared documents if it was shared
      setSharedByMe(prev =>
        prev.filter(share => share.document_id !== documentId)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const shareDocument = async (documentId: string, shareData: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const share = await shareService.shareDocument(documentId, shareData);
      setSharedByMe(prev => [share, ...prev]);

      return share;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Share failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchDocuments = async (query: string, filters?: DocumentFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await documentService.searchDocuments(query, filters);
      setDocuments(results);

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocument = async (documentId: string, updates: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedDocument = await documentService.updateDocument(
        documentId,
        updates
      );
      setDocuments(prev =>
        prev.map(doc => (doc.id === documentId ? updatedDocument : doc))
      );

      return updatedDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await shareService.revokeShare(shareId);
      setSharedByMe(prev => prev.filter(share => share.id !== shareId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Revoke failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    documents,
    sharedWithMe,
    sharedByMe,
    isLoading,
    error,

    // Actions
    loadDocuments,
    loadSharedDocuments,
    uploadDocument,
    deleteDocument,
    shareDocument,
    searchDocuments,
    updateDocument,
    revokeShare,
    clearError,
  };
}
