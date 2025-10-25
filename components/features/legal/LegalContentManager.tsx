'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Save,
  Eye,
  Edit,
  History,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
} from 'lucide-react';

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  status: 'draft' | 'active' | 'archived';
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

interface LegalContentManagerProps {
  isAdmin?: boolean;
}

export function LegalContentManager({
  isAdmin = false,
}: LegalContentManagerProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<LegalDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = [
    { value: 'terms_of_service', label: 'Terms of Service' },
    { value: 'privacy_policy', label: 'Privacy Policy' },
    { value: 'cookie_policy', label: 'Cookie Policy' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    {
      value: 'archived',
      label: 'Archived',
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/legal/versions');
      const data = await response.json();

      if (data.success) {
        // Flatten the grouped documents
        const allDocuments = Object.values(data.data).flat();
        setDocuments(allDocuments);
      }
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async (documentData: Partial<LegalDocument>) => {
    if (!selectedDocument) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/legal/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedDocument.id,
          ...documentData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        fetchDocuments();
        setError(null);
      } else {
        setError(data.error || 'Failed to save document');
      }
    } catch (err) {
      setError('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newDocument: LegalDocument = {
      id: '',
      type: 'terms_of_service',
      title: '',
      content: '',
      version: '1.0',
      effective_date: new Date().toISOString(),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSelectedDocument(newDocument);
    setIsEditing(true);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You need admin privileges to access the legal content manager.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Legal Content Manager
        </h1>
        <p className="text-gray-600">
          Manage legal documents, versions, and compliance status.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Legal Documents</CardTitle>
                <Button onClick={handleCreateNew} size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No documents found
                  </div>
                ) : (
                  documents.map(doc => (
                    <div
                      key={doc.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedDocument?.id === doc.id
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedDocument(doc);
                        setIsEditing(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{doc.title}</h4>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{doc.type.replace('_', ' ')}</span>
                        <span>v{doc.version}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(doc.updated_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Editor */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {isEditing ? 'Edit Document' : 'View Document'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveDocument(selectedDocument)}
                          disabled={loading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Document Type</Label>
                        <Select
                          value={selectedDocument.type}
                          onValueChange={value =>
                            setSelectedDocument({
                              ...selectedDocument,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={selectedDocument.version}
                          onChange={e =>
                            setSelectedDocument({
                              ...selectedDocument,
                              version: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={selectedDocument.title}
                        onChange={e =>
                          setSelectedDocument({
                            ...selectedDocument,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={selectedDocument.content}
                        onChange={e =>
                          setSelectedDocument({
                            ...selectedDocument,
                            content: e.target.value,
                          })
                        }
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="effective_date">Effective Date</Label>
                        <Input
                          id="effective_date"
                          type="datetime-local"
                          value={selectedDocument.effective_date.slice(0, 16)}
                          onChange={e =>
                            setSelectedDocument({
                              ...selectedDocument,
                              effective_date: new Date(
                                e.target.value
                              ).toISOString(),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={selectedDocument.status}
                          onValueChange={(value: any) =>
                            setSelectedDocument({
                              ...selectedDocument,
                              status: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Document Type</Label>
                        <p className="text-sm text-gray-600 capitalize">
                          {selectedDocument.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <Label>Version</Label>
                        <p className="text-sm text-gray-600">
                          v{selectedDocument.version}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Title</Label>
                      <p className="text-sm text-gray-600">
                        {selectedDocument.title}
                      </p>
                    </div>

                    <div>
                      <Label>Content</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                          {selectedDocument.content}
                        </pre>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Effective Date</Label>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedDocument.effective_date)}
                        </p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedDocument.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedDocument.created_at)}
                        </p>
                      </div>
                      <div>
                        <Label>Last Updated</Label>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedDocument.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Document
                </h3>
                <p className="text-gray-600">
                  Choose a legal document from the list to view or edit it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
