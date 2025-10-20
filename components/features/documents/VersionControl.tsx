'use client';

import React, { useState, useEffect } from 'react';
import { DocumentVersion } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Plus,
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  ArrowUp,
} from 'lucide-react';

interface VersionControlProps {
  documentId: string;
  versions: DocumentVersion[];
  onVersionCreate: (file: File, changeSummary?: string) => Promise<void>;
  onVersionDownload: (versionId: string) => Promise<void>;
  onVersionPreview: (versionId: string) => Promise<void>;
}

export function VersionControl({
  documentId,
  versions,
  onVersionCreate,
  onVersionDownload,
  onVersionPreview,
}: VersionControlProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      await onVersionCreate(selectedFile, changeSummary);
      setIsCreateDialogOpen(false);
      setSelectedFile(null);
      setChangeSummary('');
    } catch (error) {
      console.error('Failed to create version:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (versionId: string) => {
    try {
      await onVersionDownload(versionId);
    } catch (error) {
      console.error('Failed to download version:', error);
    }
  };

  const handlePreview = async (versionId: string) => {
    try {
      await onVersionPreview(versionId);
    } catch (error) {
      console.error('Failed to preview version:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Version History
          </h2>
          <p className="text-gray-600">
            Manage document versions and track changes
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Version
        </Button>
      </div>

      {!versions || versions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No versions yet
            </h3>
            <p className="text-gray-500 text-center">
              Create the first version of this document to start tracking
              changes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card
              key={version.id}
              className={index === 0 ? 'border-blue-200 bg-blue-50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <CardTitle className="text-lg">
                        Version {version.version_number}
                        {index === 0 && (
                          <Badge variant="default" className="ml-2">
                            Latest
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(version.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                {version.change_summary && (
                  <CardDescription className="text-sm">
                    {version.change_summary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(version.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Created by user</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{formatFileSize(version.file_size)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Version Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              Create New Version
            </DialogTitle>
            <DialogDescription>
              Upload a new version of this document with optional change summary
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-file">Select File</Label>
              <Input
                id="version-file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
              />
              {selectedFile && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-gray-500">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="change-summary">Change Summary (Optional)</Label>
              <Textarea
                id="change-summary"
                value={changeSummary}
                onChange={e => setChangeSummary(e.target.value)}
                placeholder="Describe what changed in this version..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVersion}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
