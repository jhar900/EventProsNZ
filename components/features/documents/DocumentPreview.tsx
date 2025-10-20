'use client';

import React, { useState, useEffect } from 'react';
import { Document, PreviewData } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Eye,
  Download,
  ExternalLink,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Loader2,
} from 'lucide-react';

interface DocumentPreviewProps {
  document: Document;
  onDownload: (documentId: string) => Promise<void>;
  onPreview: (documentId: string) => Promise<PreviewData>;
}

export function DocumentPreview({
  document,
  onDownload,
  onPreview,
}: DocumentPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (mimeType.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (mimeType.includes('zip') || mimeType.includes('rar'))
      return <Archive className="h-6 w-6" />;
    if (mimeType.includes('text/') || mimeType.includes('code/'))
      return <Code className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word Document';
    if (mimeType.includes('excel')) return 'Excel Spreadsheet';
    if (mimeType.includes('powerpoint')) return 'PowerPoint Presentation';
    if (mimeType.includes('text/')) return 'Text File';
    if (mimeType.includes('zip')) return 'ZIP Archive';
    if (mimeType.includes('rar')) return 'RAR Archive';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const preview = await onPreview(document.id);
      setPreviewData(preview);
      setIsPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await onDownload(document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const canPreview = (mimeType: string) => {
    return (
      mimeType.startsWith('image/') ||
      mimeType.includes('pdf') ||
      mimeType.includes('text/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/')
    );
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(document.mime_type)}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">
                  {document.document_name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {getFileTypeLabel(document.mime_type)} •{' '}
                  {formatFileSize(document.file_size)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {document.document_category && (
                <Badge variant="secondary" className="text-xs">
                  {document.document_category}
                </Badge>
              )}
              {document.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>Created: {formatDate(document.created_at)}</p>
              <p>Updated: {formatDate(document.updated_at)}</p>
            </div>

            <div className="flex items-center gap-2">
              {canPreview(document.mime_type) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  Preview
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon(document.mime_type)}
              {document.document_name}
            </DialogTitle>
            <DialogDescription>
              {getFileTypeLabel(document.mime_type)} •{' '}
              {formatFileSize(document.file_size)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewData ? (
              <div className="w-full">
                {document.mime_type.startsWith('image/') && (
                  <img
                    src={previewData.preview_url}
                    alt={document.document_name}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                )}
                {document.mime_type.includes('pdf') && (
                  <iframe
                    src={previewData.preview_url}
                    className="w-full h-[60vh] border-0"
                    title={document.document_name}
                  />
                )}
                {document.mime_type.startsWith('video/') && (
                  <video
                    src={previewData.preview_url}
                    controls
                    className="w-full h-auto max-h-[60vh]"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {document.mime_type.startsWith('audio/') && (
                  <audio
                    src={previewData.preview_url}
                    controls
                    className="w-full"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                )}
                {document.mime_type.includes('text/') && (
                  <iframe
                    src={previewData.preview_url}
                    className="w-full h-[60vh] border-0"
                    title={document.document_name}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading preview...</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(previewData?.preview_url, '_blank')}
                disabled={!previewData}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
