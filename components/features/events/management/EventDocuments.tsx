'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Download, Trash2, Eye, Calendar, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UploadDocumentModal } from './UploadDocumentModal';
import { EditDocumentModal } from './EditDocumentModal';

interface EventDocumentsProps {
  eventId: string;
}

export interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  file_path?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
  uploaded_by_role?: string;
  uploaded_by_avatar_url?: string | null;
  shared_with?: {
    all_team_members: boolean;
    all_contractors: boolean;
    team_members: Array<{
      id: string;
      name: string;
      role: string;
      avatar_url?: string | null;
    }>;
    contractors: Array<{
      id: string;
      company_name: string;
      name?: string;
      avatar_url?: string | null;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export function EventDocuments({ eventId }: EventDocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [hoveredDocument, setHoveredDocument] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nameElementRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (eventId && user?.id) {
      loadDocuments();
    }
  }, [eventId, user?.id]);

  const loadDocuments = async () => {
    if (!user?.id || !eventId) {
      return;
    }

    try {
      setIsLoading(true);
      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(`/api/events/${eventId}/documents`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return '📁';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation'))
      return '📈';
    if (fileType.includes('text/')) return '📄';
    return '📁';
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const updatePreviewPosition = (documentId: string) => {
    const element = nameElementRefs.current.get(documentId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPreviewPosition({
        x: rect.left,
        y: rect.bottom + 8,
      });
    }
  };

  const handleDocumentHover = async (document: Document) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Update position immediately
    updatePreviewPosition(document.id);

    // Set a small delay before showing preview
    hoverTimeoutRef.current = setTimeout(async () => {
      setHoveredDocument(document.id);
      setPreviewLoading(true);
      setPreviewUrl(null);
      updatePreviewPosition(document.id);

      try {
        const headers: HeadersInit = {
          'x-user-id': user?.id || '',
        };

        const response = await fetch(
          `/api/events/${eventId}/documents/${document.id}/preview`,
          {
            method: 'GET',
            headers,
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.preview_url) {
            setPreviewUrl(data.preview_url);
          }
        }
      } catch (error) {
        console.error('Error loading preview:', error);
      } finally {
        setPreviewLoading(false);
      }
    }, 300); // 300ms delay
  };

  const handleDocumentLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredDocument(null);
    setPreviewUrl(null);
    setPreviewLoading(false);
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const isPDF = (fileType: string) => {
    return fileType.includes('pdf');
  };

  const handlePreview = async (document: Document) => {
    if (!user?.id) {
      toast.error('You must be logged in to preview documents');
      return;
    }

    try {
      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(
        `/api/events/${eventId}/documents/${document.id}/preview`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get preview URL');
      }

      const data = await response.json();
      if (data.success && data.preview_url) {
        window.open(data.preview_url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Preview not available for this document');
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      toast.error('Failed to open document preview');
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!user?.id) {
      toast.error('You must be logged in to download documents');
      return;
    }

    try {
      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(
        `/api/events/${eventId}/documents/${doc.id}/preview`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      if (data.success && data.preview_url) {
        // Fetch the file as a blob
        const fileResponse = await fetch(data.preview_url);
        const blob = await fileResponse.blob();

        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.name;
        window.document.body.appendChild(link);
        link.click();

        // Clean up
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Download started');
      } else {
        toast.error('Download not available for this document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    if (
      !confirm(
        `Are you sure you want to delete "${document.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to delete documents');
      return;
    }

    try {
      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(
        `/api/events/${eventId}/documents/${document.id}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }

      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete document. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Update preview position on scroll/resize
  useEffect(() => {
    if (!hoveredDocument) return;

    const updatePosition = () => {
      updatePreviewPosition(hoveredDocument);
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredDocument]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hoveredDoc = documents.find(d => d.id === hoveredDocument);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Documents</CardTitle>
              <CardDescription>
                Manage documents and files for this event
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowUploadModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No documents yet. Upload your first document to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0">Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Shared With</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(document => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium pl-0">
                      <div
                        ref={el => {
                          if (el) {
                            nameElementRefs.current.set(document.id, el);
                          } else {
                            nameElementRefs.current.delete(document.id);
                          }
                        }}
                        className="flex items-center gap-2 relative"
                        onMouseEnter={() => handleDocumentHover(document)}
                        onMouseLeave={handleDocumentLeave}
                      >
                        <span className="text-lg">
                          {getFileIcon(document.file_type)}
                        </span>
                        <span className="cursor-pointer hover:text-blue-600 transition-colors">
                          {document.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative group inline-block">
                        <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-110">
                          {document.uploaded_by_avatar_url &&
                          document.uploaded_by_avatar_url.trim() ? (
                            <AvatarImage
                              src={document.uploaded_by_avatar_url}
                              alt={document.uploaded_by_name || 'User'}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                            {getInitials(
                              document.uploaded_by_name ||
                                document.uploaded_by_email ||
                                'Unknown'
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {/* Hover Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform group-hover:scale-100 scale-95">
                          <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
                            <div className="font-medium">
                              {document.uploaded_by_name || 'Unknown'}
                            </div>
                            {document.uploaded_by_role && (
                              <div className="text-gray-300 text-xs mt-0.5 capitalize">
                                {document.uploaded_by_role.replace('_', ' ')}
                              </div>
                            )}
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 text-sm">
                        {document.shared_with?.all_team_members &&
                        document.shared_with?.all_contractors ? (
                          <Badge variant="secondary" className="w-fit text-xs">
                            Everyone
                          </Badge>
                        ) : (
                          <>
                            {document.shared_with?.all_team_members ? (
                              <Badge
                                variant="secondary"
                                className="w-fit text-xs"
                              >
                                All Team Members
                              </Badge>
                            ) : document.shared_with?.team_members &&
                              document.shared_with.team_members.length > 0 ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                {document.shared_with.team_members.map(tm => (
                                  <div
                                    key={tm.id}
                                    className="relative group inline-block"
                                  >
                                    <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-110">
                                      {tm.avatar_url && tm.avatar_url.trim() ? (
                                        <AvatarImage
                                          src={tm.avatar_url}
                                          alt={tm.name}
                                        />
                                      ) : null}
                                      <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                        {getInitials(tm.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    {/* Hover Tooltip */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform group-hover:scale-100 scale-95">
                                      <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
                                        <div className="font-medium">
                                          {tm.name}
                                        </div>
                                        <div className="text-gray-300 text-xs mt-0.5">
                                          {tm.role}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {document.shared_with?.all_contractors ? (
                              <Badge
                                variant="secondary"
                                className="w-fit text-xs"
                              >
                                All Contractors
                              </Badge>
                            ) : document.shared_with?.contractors &&
                              document.shared_with.contractors.length > 0 ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                {document.shared_with.contractors.map(
                                  contractor => (
                                    <div
                                      key={contractor.id}
                                      className="relative group inline-block"
                                    >
                                      <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-110">
                                        {contractor.avatar_url &&
                                        contractor.avatar_url.trim() ? (
                                          <AvatarImage
                                            src={contractor.avatar_url}
                                            alt={
                                              contractor.name ||
                                              contractor.company_name
                                            }
                                          />
                                        ) : null}
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                          {getInitials(
                                            contractor.name ||
                                              contractor.company_name
                                          )}
                                        </AvatarFallback>
                                      </Avatar>
                                      {/* Hover Tooltip */}
                                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform group-hover:scale-100 scale-95">
                                        <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
                                          <div className="font-medium">
                                            {contractor.name || 'Unknown'}
                                          </div>
                                          <div className="text-gray-300 text-xs mt-0.5">
                                            {contractor.company_name}
                                          </div>
                                          {/* Arrow */}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : null}
                            {!document.shared_with?.all_team_members &&
                              !document.shared_with?.all_contractors &&
                              (!document.shared_with?.team_members ||
                                document.shared_with.team_members.length ===
                                  0) &&
                              (!document.shared_with?.contractors ||
                                document.shared_with.contractors.length ===
                                  0) && (
                                <span className="text-muted-foreground text-xs">
                                  Not shared
                                </span>
                              )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(document.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(document)}
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDocument(document);
                            setShowEditModal(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(document)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          eventId={eventId}
          onSuccess={() => {
            loadDocuments();
          }}
        />

        <EditDocumentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDocument(null);
          }}
          eventId={eventId}
          document={editingDocument}
          onSuccess={() => {
            loadDocuments();
          }}
        />
      </Card>

      {/* Preview Tooltip - Rendered outside card with fixed positioning to prevent overflow */}
      {hoveredDocument && hoveredDoc && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 max-w-md">
            {previewLoading ? (
              <div className="flex items-center justify-center w-64 h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : previewUrl &&
              (isImage(hoveredDoc.file_type) || isPDF(hoveredDoc.file_type)) ? (
              <div className="max-w-md">
                {isImage(hoveredDoc.file_type) ? (
                  <img
                    src={previewUrl}
                    alt={hoveredDoc.name}
                    className="max-w-full max-h-96 rounded object-contain"
                    onError={() => setPreviewUrl(null)}
                  />
                ) : (
                  <div className="w-64 h-96">
                    <iframe
                      src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full rounded border-0"
                      title={hoveredDoc.name}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center w-64">
                <div className="text-sm text-muted-foreground">
                  Preview not available
                </div>
              </div>
            )}
            {/* Arrow */}
            <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white" />
          </div>
        </div>
      )}
    </>
  );
}
