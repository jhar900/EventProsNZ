'use client';

import React, { useState, useEffect } from 'react';
import { Document, DocumentShare, DocumentFilters } from '@/types/documents';
import { DocumentService } from '@/lib/documents/document-service';
import { ShareService } from '@/lib/documents/share-service';
import { FileUpload } from './FileUpload';
import { DocumentList } from './DocumentList';
import { DocumentFilters as DocumentFiltersComponent } from './DocumentFilters';
import { DocumentSearch } from './DocumentSearch';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Filter, Share2, FileText } from 'lucide-react';

const documentService = new DocumentService();
const shareService = new ShareService();

export function DocumentSharing() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<DocumentShare[]>([]);
  const [sharedByMe, setSharedByMe] = useState<DocumentShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-documents');

  useEffect(() => {
    loadDocuments();
    loadSharedDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await documentService.getDocuments(filters, 1, 50);
      setDocuments(result.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
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

  const handleFileUpload = async (file: File, metadata: any) => {
    try {
      setIsLoading(true);
      await documentService.uploadFile(file, metadata);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setSearchQuery(query);
      if (query.trim()) {
        const results = await documentService.searchDocuments(query, filters);
        setDocuments(results);
      } else {
        await loadDocuments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDocumentShare = async (documentId: string, shareData: any) => {
    try {
      await shareService.shareDocument(documentId, shareData);
      await loadSharedDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Share failed');
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Sharing</h1>
          <p className="text-gray-600">
            Manage and share your documents securely
          </p>
        </div>
        <FileUpload onUpload={handleFileUpload} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <DocumentSearch onSearch={handleSearch} />
        </div>
        <DocumentFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger
            value="shared-with-me"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Shared with Me ({sharedWithMe.length})
          </TabsTrigger>
          <TabsTrigger value="shared-by-me" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Shared by Me ({sharedByMe.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-documents" className="mt-6">
          <DocumentList
            documents={documents}
            onDelete={handleDocumentDelete}
            onShare={handleDocumentShare}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="shared-with-me" className="mt-6">
          <div className="space-y-4">
            {sharedWithMe.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Share2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No shared documents
                  </h3>
                  <p className="text-gray-500 text-center">
                    Documents shared with you will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              sharedWithMe.map(share => (
                <Card key={share.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {share.document?.document_name}
                    </CardTitle>
                    <CardDescription>
                      Shared by {share.shared_by_user?.email} •{' '}
                      {share.permission_level} access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {share.document?.document_type} •{' '}
                        {share.document?.file_size} bytes
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="shared-by-me" className="mt-6">
          <div className="space-y-4">
            {sharedByMe.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No shared documents
                  </h3>
                  <p className="text-gray-500 text-center">
                    Documents you've shared will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              sharedByMe.map(share => (
                <Card key={share.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {share.document?.document_name}
                    </CardTitle>
                    <CardDescription>
                      Shared with {share.shared_with_user?.email} •{' '}
                      {share.permission_level} access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {share.document?.document_type} •{' '}
                        {share.document?.file_size} bytes
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
