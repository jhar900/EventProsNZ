'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Edit,
  Eye,
  Save,
  Copy,
  Trash2,
  Plus,
  Settings,
  Palette,
  Type,
  Image,
  Code,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  userType: 'event_manager' | 'contractor' | 'both';
  category: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplateCustomizerProps {
  templateId?: string;
  onTemplateSaved?: (template: EmailTemplate) => void;
}

export function EmailTemplateCustomizer({
  templateId,
  onTemplateSaved,
}: EmailTemplateCustomizerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    userType: 'both' as 'event_manager' | 'contractor' | 'both',
    category: '',
    variables: [] as string[],
  });

  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Welcome Email Template',
        subject: 'Welcome to EventProsNZ, {{firstName}}!',
        htmlContent:
          '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining EventProsNZ...</p>',
        textContent:
          'Welcome {{firstName}}!\n\nThank you for joining EventProsNZ...',
        userType: 'both',
        category: 'welcome',
        variables: ['firstName', 'lastName', 'email'],
        isActive: true,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
      },
      {
        id: '2',
        name: 'Job Application Confirmation',
        subject: 'Application received for {{jobTitle}}',
        htmlContent:
          '<h2>Application Confirmed</h2><p>Your application for {{jobTitle}} has been received...</p>',
        textContent:
          'Application Confirmed\n\nYour application for {{jobTitle}} has been received...',
        userType: 'contractor',
        category: 'job_application',
        variables: ['jobTitle', 'companyName', 'applicationDate'],
        isActive: true,
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
      },
      {
        id: '3',
        name: 'Event Creation Notification',
        subject: 'Your event {{eventName}} has been created',
        htmlContent:
          '<h2>Event Created Successfully</h2><p>Your event {{eventName}} has been created...</p>',
        textContent:
          'Event Created Successfully\n\nYour event {{eventName}} has been created...',
        userType: 'event_manager',
        category: 'event',
        variables: ['eventName', 'eventDate', 'eventLocation'],
        isActive: true,
        createdAt: '2024-01-12',
        updatedAt: '2024-01-19',
      },
    ];

    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  const handleCreateTemplate = () => {
    setFormData({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      userType: 'both',
      category: '',
      variables: [],
    });
    setSelectedTemplate(null);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      userType: template.userType,
      category: template.category,
      variables: template.variables,
    });
    setSelectedTemplate(template);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData: EmailTemplate = {
        id: selectedTemplate?.id || Date.now().toString(),
        name: formData.name,
        subject: formData.subject,
        htmlContent: formData.htmlContent,
        textContent: formData.textContent,
        userType: formData.userType,
        category: formData.category,
        variables: formData.variables,
        isActive: true,
        createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (selectedTemplate) {
        setTemplates(prev =>
          prev.map(t => (t.id === selectedTemplate.id ? templateData : t))
        );
      } else {
        setTemplates(prev => [...prev, templateData]);
      }

      onTemplateSaved?.(templateData);
      setIsEditing(false);
      setSelectedTemplate(null);
      setActiveTab('templates');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
    setActiveTab('preview');
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  const handleContentChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'htmlContent' || field === 'textContent') {
        updated.variables = extractVariables(value);
      }
      return updated;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'welcome':
        return 'bg-blue-100 text-blue-800';
      case 'job_application':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'subscription':
        return 'bg-orange-100 text-orange-800';
      case 'announcement':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Template Customizer</h2>
          <p className="text-muted-foreground">
            Create and customize email templates for different user types
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {template.userType.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant={template.isActive ? 'default' : 'secondary'}
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {template.variables.length} variables
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated:{' '}
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
              <CardDescription>
                {selectedTemplate
                  ? 'Edit existing template'
                  : 'Create new template'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select category</option>
                    <option value="welcome">Welcome</option>
                    <option value="job_application">Job Application</option>
                    <option value="event">Event</option>
                    <option value="subscription">Subscription</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">User Type</label>
                <select
                  value={formData.userType}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      userType: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="both">Both</option>
                  <option value="event_manager">Event Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium">HTML Content</label>
                <textarea
                  value={formData.htmlContent}
                  onChange={e =>
                    handleContentChange('htmlContent', e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md h-32"
                  placeholder="Enter HTML content"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Text Content</label>
                <textarea
                  value={formData.textContent}
                  onChange={e =>
                    handleContentChange('textContent', e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md h-32"
                  placeholder="Enter text content"
                />
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Variables</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Preview of {selectedTemplate.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Subject</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.subject}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">HTML Preview</h4>
                    <div
                      className="border rounded-md p-4 bg-gray-50"
                      dangerouslySetInnerHTML={{
                        __html: selectedTemplate.htmlContent,
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">Text Preview</h4>
                    <pre className="border rounded-md p-4 bg-gray-50 text-sm whitespace-pre-wrap">
                      {selectedTemplate.textContent}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium">Variables</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map(variable => (
                        <Badge key={variable} variant="outline">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
