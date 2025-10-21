'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Document } from '@/types/documents';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Link,
  Plus,
  Trash2,
  FileText,
  Calendar,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

interface DocumentIntegrationProps {
  document: Document;
  onLinkToInquiry: (documentId: string, inquiryId: string) => Promise<void>;
  onLinkToEvent: (documentId: string, eventId: string) => Promise<void>;
  onLinkToContact: (documentId: string, contactId: string) => Promise<void>;
  onUnlink: (
    documentId: string,
    linkType: string,
    linkId: string
  ) => Promise<void>;
}

interface DocumentLink {
  id: string;
  type: 'inquiry' | 'event' | 'contact';
  title: string;
  description: string;
  created_at: string;
}

export function DocumentIntegration({
  document,
  onLinkToInquiry,
  onLinkToEvent,
  onLinkToContact,
  onUnlink,
}: DocumentIntegrationProps) {
  const [links, setLinks] = useState<DocumentLink[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'inquiry' | 'event' | 'contact'>(
    'inquiry'
  );
  const [linkId, setLinkId] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  // Mock data - in real implementation, this would come from props or API
  const mockLinks: DocumentLink[] = [
    {
      id: '1',
      type: 'inquiry',
      title: 'Wedding Photography Inquiry',
      description: 'Client inquiry for wedding photography services',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'event',
      title: 'Summer Wedding 2024',
      description: 'Main event for wedding photography',
      created_at: '2024-01-20T14:00:00Z',
    },
    {
      id: '3',
      type: 'contact',
      title: 'John & Jane Smith',
      description: 'Wedding couple contact information',
      created_at: '2024-01-10T09:15:00Z',
    },
  ];

  useEffect(() => {
    setLinks(mockLinks);
  }, []);

  const handleLinkDocument = async () => {
    if (!linkId || !linkTitle) return;

    try {
      const newLink: DocumentLink = {
        id: Date.now().toString(),
        type: linkType,
        title: linkTitle,
        description: linkDescription,
        created_at: new Date().toISOString(),
      };

      setLinks(prev => [newLink, ...prev]);
      setIsLinkDialogOpen(false);
      setLinkId('');
      setLinkTitle('');
      setLinkDescription('');

      // Call appropriate linking function
      switch (linkType) {
        case 'inquiry':
          await onLinkToInquiry(document.id, linkId);
          break;
        case 'event':
          await onLinkToEvent(document.id, linkId);
          break;
        case 'contact':
          await onLinkToContact(document.id, linkId);
          break;
      }
    } catch (error) {
      console.error('Failed to link document:', error);
    }
  };

  const handleUnlink = async (linkId: string, linkType: string) => {
    try {
      setLinks(prev => prev.filter(link => link.id !== linkId));
      await onUnlink(document.id, linkType, linkId);
    } catch (error) {
      console.error('Failed to unlink document:', error);
    }
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <MessageSquare className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'contact':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getLinkTypeLabel = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'Inquiry';
      case 'event':
        return 'Event';
      case 'contact':
        return 'Contact';
      default:
        return 'Unknown';
    }
  };

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-green-100 text-green-800';
      case 'contact':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link className="h-6 w-6" />
            Document Integration
          </h2>
          <p className="text-gray-600">
            Link this document to inquiries, events, and contacts
          </p>
        </div>
        <Button onClick={() => setIsLinkDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Link Document
        </Button>
      </div>

      {/* Document Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.document_name}
          </CardTitle>
          <CardDescription>
            {document.document_category || 'Uncategorized'} •{' '}
            {document.mime_type}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Created: {formatDate(document.created_at)}</span>
            <span>Updated: {formatDate(document.updated_at)}</span>
            {document.is_public && <Badge variant="outline">Public</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Linked Items ({links.length})</h3>
        {links.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No links yet
              </h3>
              <p className="text-gray-500 text-center">
                Link this document to inquiries, events, or contacts to get
                started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getLinkIcon(link.type)}
                      <div>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getLinkTypeColor(link.type)}>
                        {getLinkTypeLabel(link.type)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlink(link.id, link.type)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Linked: {formatDate(link.created_at)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`/${link.type}s/${link.id}`, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View {getLinkTypeLabel(link.type)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Link Document
            </DialogTitle>
            <DialogDescription>
              Link this document to an inquiry, event, or contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-type">Link Type</Label>
              <Select
                value={linkType}
                onValueChange={value => setLinkType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="link-id">ID</Label>
              <Input
                id="link-id"
                value={linkId}
                onChange={e => setLinkId(e.target.value)}
                placeholder="Enter ID"
              />
            </div>
            <div>
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
            <div>
              <Label htmlFor="link-description">Description (Optional)</Label>
              <Textarea
                id="link-description"
                value={linkDescription}
                onChange={e => setLinkDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkDocument}
              disabled={!linkId || !linkTitle}
              className="flex-1"
            >
              Link Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
