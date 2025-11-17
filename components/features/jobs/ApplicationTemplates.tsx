'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { JOB_SERVICE_CATEGORIES } from '@/types/jobs';

interface ApplicationTemplate {
  id: string;
  name: string;
  description?: string;
  cover_letter_template: string;
  service_categories: string[];
  is_public: boolean;
  created_by_user_id: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface ApplicationTemplatesProps {
  onTemplateSelect?: (template: ApplicationTemplate) => void;
  onTemplateCreate?: (
    template: Omit<
      ApplicationTemplate,
      'id' | 'created_at' | 'updated_at' | 'usage_count'
    >
  ) => void;
  onTemplateUpdate?: (template: ApplicationTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
  className?: string;
}

export function ApplicationTemplates({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  className = '',
}: ApplicationTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ApplicationTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cover_letter_template: '',
    service_categories: [] as string[],
    is_public: false,
  });

  // Load templates on mount and when filters change
  useEffect(() => {
    loadTemplates();
  }, [serviceCategoryFilter, showPublicOnly, user?.id]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (serviceCategoryFilter) {
        params.append('service_category', serviceCategoryFilter);
      }

      if (showPublicOnly) {
        params.append('is_public', 'true');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/applications/templates?${params}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        // Don't throw error, just show empty state
        setTemplates([]);
        setError(null); // Clear any previous errors
        return;
      }

      const data = await response.json();

      // Handle both success: true and success: false cases
      if (data.success === false) {
        setTemplates([]);
        setError(null); // Clear any previous errors
        return;
      }

      setTemplates(data.templates || []);
      setError(null); // Clear any errors on success
    } catch (error) {
      console.error('Error loading templates:', error);
      // Set empty state instead of error state
      setTemplates([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleServiceCategoryFilter = (category: string) => {
    setServiceCategoryFilter(category === 'all' ? '' : category);
  };

  const handleCreateTemplate = async () => {
    try {
      if (onTemplateCreate) {
        onTemplateCreate(formData);
      } else {
        if (!user?.id) {
          setError('You must be logged in to create templates');
          return;
        }

        const response = await fetch('/api/applications/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to create template');
        }

        const data = await response.json();
        setTemplates(prev => [data.template, ...prev]);
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create template'
      );
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      if (onTemplateUpdate) {
        onTemplateUpdate({ ...editingTemplate, ...formData });
      } else {
        if (!user?.id) {
          setError('You must be logged in to update templates');
          return;
        }

        const response = await fetch(
          `/api/applications/templates/${editingTemplate.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            credentials: 'include',
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update template');
        }

        const data = await response.json();
        setTemplates(prev =>
          prev.map(t => (t.id === editingTemplate.id ? data.template : t))
        );
        setEditingTemplate(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating template:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update template'
      );
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      if (onTemplateDelete) {
        onTemplateDelete(templateId);
      } else {
        const response = await fetch(
          `/api/applications/templates/${templateId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete template');
        }

        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete template'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cover_letter_template: '',
      service_categories: [],
      is_public: false,
    });
  };

  const startEditing = (template: ApplicationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      cover_letter_template: template.cover_letter_template,
      service_categories: template.service_categories,
      is_public: template.is_public,
    });
    setShowCreateForm(true);
  };

  const cancelEditing = () => {
    setEditingTemplate(null);
    setShowCreateForm(false);
    resetForm();
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.cover_letter_template.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Application Templates
          </h2>
          <p className="text-gray-600 mt-1">
            Create and manage templates for job applications
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Template</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Service Category Filter */}
          <div className="space-y-2">
            <Label>Service Category</Label>
            <Select
              value={serviceCategoryFilter || undefined}
              onValueChange={handleServiceCategoryFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Public Only Filter */}
          <div className="space-y-2">
            <Label>Show Public Only</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public-only"
                checked={showPublicOnly}
                onCheckedChange={checked =>
                  setShowPublicOnly(checked as boolean)
                }
              />
              <Label htmlFor="public-only" className="text-sm">
                Show only public templates
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <Button variant="ghost" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter template name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this template"
                />
              </div>
            </div>

            {/* Cover Letter Template */}
            <div className="space-y-2">
              <Label htmlFor="cover_letter_template">
                Cover Letter Template *
              </Label>
              <Textarea
                id="cover_letter_template"
                value={formData.cover_letter_template}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    cover_letter_template: e.target.value,
                  }))
                }
                placeholder="Enter your cover letter template. Use placeholders like {job_title}, {company_name}, etc."
                className="min-h-[200px]"
              />
              <p className="text-sm text-gray-500">
                Use placeholders like {'{job_title}'}, {'{company_name}'},{' '}
                {'{your_name}'} for dynamic content
              </p>
            </div>

            {/* Service Categories */}
            <div className="space-y-2">
              <Label>Service Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(JOB_SERVICE_CATEGORIES).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${key}`}
                      checked={formData.service_categories.includes(value)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            service_categories: [
                              ...prev.service_categories,
                              value,
                            ],
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            service_categories: prev.service_categories.filter(
                              cat => cat !== value
                            ),
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`category-${key}`} className="text-sm">
                      {value.replace('_', ' ').toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Template */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={checked =>
                  setFormData(prev => ({
                    ...prev,
                    is_public: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="is_public" className="text-sm">
                Make this template public for other users
              </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button
                onClick={
                  editingTemplate ? handleUpdateTemplate : handleCreateTemplate
                }
                disabled={!formData.name || !formData.cover_letter_template}
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading templates</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTemplates} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Templates Grid */}
      {!isLoading && !error && (
        <>
          {filteredTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <DocumentIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No templates found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || serviceCategoryFilter
                    ? 'Try adjusting your search criteria'
                    : 'Create your first template to get started'}
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Template
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {template.is_public && (
                          <Badge variant="secondary" className="text-xs">
                            <UsersIcon className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Service Categories */}
                    {template.service_categories.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Categories:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.service_categories.map(category => (
                            <Badge
                              key={category}
                              variant="outline"
                              className="text-xs"
                            >
                              {category.replace('_', ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter Preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Template Preview:
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {template.cover_letter_template}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="h-4 w-4" />
                        <span>{template.usage_count} uses</span>
                      </div>
                      <div className="text-xs">
                        {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTemplateSelect?.(template)}
                        className="flex-1"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(template)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
