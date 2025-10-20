'use client';

import React, { useState, useRef } from 'react';
import { UploadService } from '@/lib/documents/upload-service';
import { DocumentMetadata } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const uploadService = new UploadService();

interface FileUploadProps {
  onUpload: (file: File, metadata: DocumentMetadata) => Promise<void>;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentCategory, setDocumentCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Contracts',
    'Event Planning',
    'Invoices',
    'Photos',
    'Presentations',
    'Reports',
    'Templates',
    'Other',
  ];

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDocumentName(file.name);
    setError(null);
    setValidationResult(null);

    try {
      const validation = await uploadService.validateFile(file);
      setValidationResult(validation);

      if (!validation.valid) {
        setError(
          `File validation failed: ${validation.security_scan.threats_detected.join(', ')}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !validationResult?.valid) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const metadata: DocumentMetadata = {
        document_name: documentName,
        document_category: documentCategory || undefined,
        is_public: isPublic,
      };

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(selectedFile, metadata);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setDocumentName('');
        setDocumentCategory('');
        setIsPublic(false);
        setValidationResult(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentCategory('');
    setIsPublic(false);
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    return uploadService.formatFileSize(bytes);
  };

  const getFileIcon = (mimeType: string) => {
    return uploadService.getFileIcon(mimeType);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload and share documents securely. Max file size:{' '}
          {formatFileSize(uploadService.getMaxFileSize())}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Choose a file to upload</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={uploadService.getAllowedFileTypes().join(',')}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  validationResult.valid
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {validationResult.valid
                    ? 'File is valid and safe to upload'
                    : `Validation failed: ${validationResult.security_scan.threats_detected.join(', ')}`}
                </span>
              </div>
            )}

            {/* Document Details */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  value={documentName}
                  onChange={e => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="document-category">Category</Label>
                <Select
                  value={documentCategory}
                  onValueChange={setDocumentCategory}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={isUploading}
                />
                <Label htmlFor="is-public">Make this document public</Label>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={
                  !validationResult?.valid || !documentName || isUploading
                }
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
