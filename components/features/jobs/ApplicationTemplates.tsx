'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '20',
      });

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

  const handleCreateTemplate = async () => {
    try {
      if (onTemplateCreate) {
        onTemplateCreate(formData);
      } else {
        if (!user?.id) {
          setError('You must be logged in to create templates');
          return;
        }

        // Prepare request body - ensure all required fields are present
        const requestBody: {
          name: string;
          cover_letter_template: string;
          service_categories?: string[];
          is_public: boolean;
          description?: string;
        } = {
          name: formData.name.trim(),
          cover_letter_template: formData.cover_letter_template.trim(),
          is_public: formData.is_public || false,
        };

        // Only include optional fields if they have values
        if (formData.service_categories.length > 0) {
          requestBody.service_categories = formData.service_categories;
        }
        if (formData.description && formData.description.trim()) {
          requestBody.description = formData.description.trim();
        }

        console.log(
          '[ApplicationTemplates] Creating template with body:',
          requestBody
        );

        const response = await fetch('/api/applications/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        // Read response body only once
        let responseData: any = {};
        try {
          const text = await response.text();
          responseData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error(
            '[ApplicationTemplates] Failed to parse response:',
            parseError
          );
          responseData = {};
        }

        if (!response.ok) {
          console.error('[ApplicationTemplates] API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });

          // Build detailed error message
          let errorMessage = `Failed to create template (${response.status})`;

          if (responseData.errors?.length > 0) {
            errorMessage = responseData.errors
              .map((e: any) => `${e.field}: ${e.message}`)
              .join(', ');
          } else if (responseData.error) {
            errorMessage = responseData.error;
            if (responseData.errorCode) {
              errorMessage += ` (code: ${responseData.errorCode})`;
            }
            if (responseData.errorDetails) {
              errorMessage += ` - ${responseData.errorDetails}`;
            }
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }

          throw new Error(errorMessage);
        }

        const data = responseData;
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

        // Prepare request body - ensure all required fields are present
        const requestBody: {
          name: string;
          cover_letter_template: string;
          service_categories?: string[];
          is_public: boolean;
          description?: string;
        } = {
          name: formData.name.trim(),
          cover_letter_template: formData.cover_letter_template.trim(),
          is_public: formData.is_public || false,
        };

        // Only include optional fields if they have values
        if (formData.service_categories.length > 0) {
          requestBody.service_categories = formData.service_categories;
        }
        if (formData.description && formData.description.trim()) {
          requestBody.description = formData.description.trim();
        }

        console.log(
          '[ApplicationTemplates] Updating template with body:',
          requestBody
        );

        const response = await fetch(
          `/api/applications/templates/${editingTemplate.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            credentials: 'include',
            body: JSON.stringify(requestBody),
          }
        );

        // Read response body only once
        let responseData: any = {};
        try {
          const text = await response.text();
          responseData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error(
            '[ApplicationTemplates] Failed to parse response:',
            parseError
          );
          responseData = {};
        }

        if (!response.ok) {
          console.error('[ApplicationTemplates] API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });

          // Build detailed error message
          let errorMessage = `Failed to update template (${response.status})`;

          if (responseData.errors?.length > 0) {
            errorMessage = responseData.errors
              .map((e: any) => `${e.field}: ${e.message}`)
              .join(', ');
          } else if (responseData.error) {
            errorMessage = responseData.error;
            if (responseData.errorCode) {
              errorMessage += ` (code: ${responseData.errorCode})`;
            }
            if (responseData.errorDetails) {
              errorMessage += ` - ${responseData.errorDetails}`;
            }
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }

          throw new Error(errorMessage);
        }

        const data = responseData;
        setTemplates(prev =>
          prev.map(t => (t.id === editingTemplate.id ? data.template : t))
        );
        setEditingTemplate(null);
        setShowCreateForm(false);
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
        if (!user?.id) {
          setError('You must be logged in to delete templates');
          return;
        }

        const response = await fetch(
          `/api/applications/templates/${templateId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            credentials: 'include',
          }
        );

        // Read response body only once
        let responseData: any = {};
        try {
          const text = await response.text();
          responseData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error(
            '[ApplicationTemplates] Failed to parse response:',
            parseError
          );
          responseData = {};
        }

        if (!response.ok) {
          console.error('[ApplicationTemplates] API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });

          // Build detailed error message
          let errorMessage = `Failed to delete template (${response.status})`;

          if (responseData.error) {
            errorMessage = responseData.error;
            if (responseData.errorCode) {
              errorMessage += ` (code: ${responseData.errorCode})`;
            }
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }

          throw new Error(errorMessage);
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

      {/* Create/Edit Form Modal */}
      <Dialog
        open={showCreateForm}
        onOpenChange={open => {
          if (!open) {
            cancelEditing();
          } else {
            setShowCreateForm(true);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              {/* Name */}
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

            {/* Cover Letter Template */}
            <div className="space-y-2">
              <Label htmlFor="cover_letter_template">
                Cover Letter Template * (minimum 50 characters)
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
              {formData.cover_letter_template && (
                <p className="text-sm text-gray-500">
                  {formData.cover_letter_template.trim().length}/50 characters
                  {formData.cover_letter_template.trim().length < 50 && (
                    <span className="text-red-600 ml-2">
                      (minimum 50 characters required)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button
                onClick={
                  editingTemplate ? handleUpdateTemplate : handleCreateTemplate
                }
                disabled={
                  !formData.name ||
                  !formData.cover_letter_template ||
                  formData.cover_letter_template.trim().length < 50
                }
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          {templates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <DocumentIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No templates found
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first template to get started
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Template
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
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
