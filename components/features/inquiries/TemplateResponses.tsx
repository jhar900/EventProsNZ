'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Star,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { InquiryTemplate, TEMPLATE_TYPES } from '@/types/inquiries';

interface TemplateResponsesProps {
  templates: InquiryTemplate[];
  onTemplateSelect?: (template: InquiryTemplate) => void;
  onTemplateCreate?: (template: Partial<InquiryTemplate>) => Promise<void>;
  onTemplateUpdate?: (
    templateId: string,
    template: Partial<InquiryTemplate>
  ) => Promise<void>;
  onTemplateDelete?: (templateId: string) => Promise<void>;
}

export function TemplateResponses({
  templates = [],
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
}: TemplateResponsesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<InquiryTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = (templates || []).filter(template => {
    const matchesSearch =
      !searchTerm ||
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.template_content
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === 'all' || template.template_type === selectedType;

    return matchesSearch && matchesType;
  });

  // Get template type color
  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case TEMPLATE_TYPES.GENERAL:
        return 'bg-blue-100 text-blue-800';
      case TEMPLATE_TYPES.QUOTE_RESPONSE:
        return 'bg-green-100 text-green-800';
      case TEMPLATE_TYPES.DECLINE_RESPONSE:
        return 'bg-red-100 text-red-800';
      case TEMPLATE_TYPES.FOLLOW_UP:
        return 'bg-yellow-100 text-yellow-800';
      case TEMPLATE_TYPES.WELCOME:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle template creation
  const handleCreateTemplate = async (
    templateData: Partial<InquiryTemplate>
  ) => {
    if (!onTemplateCreate) return;

    try {
      setIsCreating(true);
      await onTemplateCreate(templateData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle template update
  const handleUpdateTemplate = async (
    templateId: string,
    templateData: Partial<InquiryTemplate>
  ) => {
    if (!onTemplateUpdate) return;

    try {
      setIsUpdating(true);
      await onTemplateUpdate(templateId, templateData);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!onTemplateDelete) return;

    try {
      setIsDeleting(templateId);
      await onTemplateDelete(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Copy template content
  const handleCopyTemplate = (template: InquiryTemplate) => {
    navigator.clipboard.writeText(template.template_content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Response Templates
              </CardTitle>
              <CardDescription>
                Create and manage templates for common inquiry responses
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Template Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              onSubmit={handleCreateTemplate}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Template Form */}
      {editingTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              template={editingTemplate}
              onSubmit={data => handleUpdateTemplate(editingTemplate.id, data)}
              onCancel={() => setEditingTemplate(null)}
              isLoading={isUpdating}
            />
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No templates found matching your criteria.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {template.template_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        className={getTemplateTypeColor(template.template_type)}
                      >
                        {template.template_type}
                      </Badge>
                      {template.is_public && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={isDeleting === template.id}
                    >
                      {isDeleting === template.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {template.template_content}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Used {template.usage_count} times
                    </div>
                    <div>
                      {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTemplateSelect?.(template)}
                      className="flex-1"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Template Form Component
interface TemplateFormProps {
  template?: InquiryTemplate;
  onSubmit: (data: Partial<InquiryTemplate>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function TemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
}: TemplateFormProps) {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    template_content: template?.template_content || '',
    template_type: template?.template_type || TEMPLATE_TYPES.GENERAL,
    is_public: template?.is_public || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template_name">Template Name</Label>
        <Input
          id="template_name"
          value={formData.template_name}
          onChange={e =>
            setFormData(prev => ({ ...prev, template_name: e.target.value }))
          }
          placeholder="Enter template name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_type">Template Type</Label>
        <Select
          value={formData.template_type}
          onValueChange={value =>
            setFormData(prev => ({ ...prev, template_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {key
                  .replace('_', ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_content">Template Content</Label>
        <Textarea
          id="template_content"
          value={formData.template_content}
          onChange={e =>
            setFormData(prev => ({ ...prev, template_content: e.target.value }))
          }
          placeholder="Enter template content"
          rows={6}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={e =>
            setFormData(prev => ({ ...prev, is_public: e.target.checked }))
          }
        />
        <Label htmlFor="is_public">Make this template public</Label>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : template
              ? 'Update Template'
              : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
