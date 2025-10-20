import { create } from 'zustand';
import {
  Document,
  DocumentShare,
  DocumentFilters,
  DocumentMetadata,
  ShareData,
} from '@/types/documents';
import { DocumentService } from '@/lib/documents/document-service';
import { ShareService } from '@/lib/documents/share-service';

const documentService = new DocumentService();
const shareService = new ShareService();

interface DocumentStore {
  // State
  documents: Document[];
  currentDocument: Document | null;
  shares: DocumentShare[];
  sharedWithMe: DocumentShare[];
  sharedByMe: DocumentShare[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDocuments: (
    filters?: DocumentFilters,
    page?: number,
    limit?: number
  ) => Promise<void>;
  loadDocument: (id: string) => Promise<void>;
  uploadFile: (file: File, metadata: DocumentMetadata) => Promise<void>;
  shareDocument: (documentId: string, shareData: ShareData) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocument: (
    documentId: string,
    updates: Partial<DocumentMetadata>
  ) => Promise<void>;
  searchDocuments: (query: string, filters?: DocumentFilters) => Promise<void>;
  loadSharedDocuments: () => Promise<void>;
  revokeShare: (shareId: string) => Promise<void>;
  setCurrentDocument: (document: Document | null) => void;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: [],
  currentDocument: null,
  shares: [],
  sharedWithMe: [],
  sharedByMe: [],
  isLoading: false,
  error: null,

  // Load documents
  loadDocuments: async (filters, page = 1, limit = 20) => {
    try {
      set({ isLoading: true, error: null });
      const result = await documentService.getDocuments(filters, page, limit);
      set({ documents: result.documents, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to load documents',
        isLoading: false,
      });
    }
  },

  // Load single document
  loadDocument: async id => {
    try {
      set({ isLoading: true, error: null });
      const result = await documentService.getDocument(id);
      set({
        currentDocument: result.document,
        shares: result.shares,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to load document',
        isLoading: false,
      });
    }
  },

  // Upload file
  uploadFile: async (file, metadata) => {
    try {
      set({ isLoading: true, error: null });
      const document = await documentService.uploadFile(file, metadata);
      set(state => ({
        documents: [document, ...state.documents],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Upload failed',
        isLoading: false,
      });
    }
  },

  // Share document
  shareDocument: async (documentId, shareData) => {
    try {
      set({ isLoading: true, error: null });
      const share = await shareService.shareDocument(documentId, shareData);
      set(state => ({
        sharedByMe: [share, ...state.sharedByMe],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Share failed',
        isLoading: false,
      });
    }
  },

  // Delete document
  deleteDocument: async documentId => {
    try {
      set({ isLoading: true, error: null });
      await documentService.deleteDocument(documentId);
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        sharedByMe: state.sharedByMe.filter(
          share => share.document_id !== documentId
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isLoading: false,
      });
    }
  },

  // Update document
  updateDocument: async (documentId, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedDocument = await documentService.updateDocument(
        documentId,
        updates
      );
      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === documentId ? updatedDocument : doc
        ),
        currentDocument:
          state.currentDocument?.id === documentId
            ? updatedDocument
            : state.currentDocument,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Update failed',
        isLoading: false,
      });
    }
  },

  // Search documents
  searchDocuments: async (query, filters) => {
    try {
      set({ isLoading: true, error: null });
      const results = await documentService.searchDocuments(query, filters);
      set({ documents: results, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
      });
    }
  },

  // Load shared documents
  loadSharedDocuments: async () => {
    try {
      set({ isLoading: true, error: null });
      const [sharedWithMeData, sharedByMeData] = await Promise.all([
        shareService.getSharedWithMe(),
        shareService.getSharedByMe(),
      ]);
      set({
        sharedWithMe: sharedWithMeData,
        sharedByMe: sharedByMeData,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load shared documents',
        isLoading: false,
      });
    }
  },

  // Revoke share
  revokeShare: async shareId => {
    try {
      set({ isLoading: true, error: null });
      await shareService.revokeShare(shareId);
      set(state => ({
        sharedByMe: state.sharedByMe.filter(share => share.id !== shareId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Revoke failed',
        isLoading: false,
      });
    }
  },

  // Set current document
  setCurrentDocument: document => {
    set({ currentDocument: document });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
