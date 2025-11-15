'use client';

import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { CheckCircle, AlertCircle } from 'lucide-react';
import EmailEditor from './EmailEditor';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  html_body: string;
  text_body?: string;
  description?: string;
  trigger_action: string;
  is_active: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

const TRIGGER_ACTIONS = [
  { value: 'user_registration', label: 'User Registration' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'email_verification', label: 'Email Verification' },
  { value: 'inquiry_received', label: 'Inquiry Received' },
  { value: 'inquiry_response', label: 'Inquiry Response' },
  { value: 'job_posted', label: 'Job Posted' },
  { value: 'job_application', label: 'Job Application' },
  { value: 'contractor_verified', label: 'Contractor Verified' },
  { value: 'subscription_upgrade', label: 'Subscription Upgrade' },
  { value: 'subscription_downgrade', label: 'Subscription Downgrade' },
];

export default function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    slug: '',
    subject: '',
    html_body: '',
    text_body: '',
    description: '',
    trigger_action: 'user_registration',
    is_active: true,
    variables: [] as string[],
  });

  const [editTemplate, setEditTemplate] = useState<Partial<EmailTemplate>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/email-templates', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load email templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (
      !newTemplate.name ||
      !newTemplate.slug ||
      !newTemplate.subject ||
      !newTemplate.html_body
    ) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create template');
      }

      setSuccess('Email template created successfully!');
      setIsAdding(false);
      setNewTemplate({
        name: '',
        slug: '',
        subject: '',
        html_body: '',
        text_body: '',
        description: '',
        trigger_action: 'user_registration',
        is_active: true,
        variables: [],
      });
      await loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create template'
      );
    }
  };

  const startEdit = (template: EmailTemplate) => {
    setEditTemplate({ ...template });
    setEditingId(template.id);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTemplate({});
  };

  const handleUpdate = async (id: string) => {
    if (
      !editTemplate.name ||
      !editTemplate.subject ||
      !editTemplate.html_body
    ) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editTemplate),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update template');
      }

      setSuccess('Email template updated successfully!');
      setEditingId(null);
      setEditTemplate({});
      await loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update template'
      );
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete template');
      }

      setSuccess('Email template deleted successfully!');
      await loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete template'
      );
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Extract variables from HTML content
  const extractVariables = (html: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = html.matchAll(variableRegex);
    const variables = new Set<string>();
    for (const match of matches) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  // Update variables when HTML body changes
  const handleHtmlBodyChange = (
    html: string,
    isNew: boolean,
    templateId?: string
  ) => {
    const extractedVars = extractVariables(html);
    if (isNew) {
      setNewTemplate({
        ...newTemplate,
        html_body: html,
        variables: extractedVars,
      });
    } else if (templateId) {
      setEditTemplate({
        ...editTemplate,
        html_body: html,
        variables: extractedVars,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage email templates that are triggered by different user actions
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setError(null);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Add Template Form */}
      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Add New Email Template
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={e => {
                    setNewTemplate({
                      ...newTemplate,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={newTemplate.slug}
                  onChange={e =>
                    setNewTemplate({ ...newTemplate, slug: e.target.value })
                  }
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Action *
              </label>
              <select
                value={newTemplate.trigger_action}
                onChange={e =>
                  setNewTemplate({
                    ...newTemplate,
                    trigger_action: e.target.value,
                  })
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                {TRIGGER_ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={newTemplate.subject}
                onChange={e =>
                  setNewTemplate({ ...newTemplate, subject: e.target.value })
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <EmailEditor
                value={newTemplate.html_body}
                onChange={html => handleHtmlBodyChange(html, true)}
                variables={newTemplate.variables || []}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Body (Plain text version)
              </label>
              <textarea
                value={newTemplate.text_body}
                onChange={e =>
                  setNewTemplate({ ...newTemplate, text_body: e.target.value })
                }
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTemplate.description}
                onChange={e =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newTemplate.is_active}
                onChange={e =>
                  setNewTemplate({
                    ...newTemplate,
                    is_active: e.target.checked,
                  })
                }
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Active (template will be used)
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTemplate({
                    name: '',
                    slug: '',
                    subject: '',
                    html_body: '',
                    text_body: '',
                    description: '',
                    trigger_action: 'user_registration',
                    is_active: true,
                    variables: [],
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                Add Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No email templates found. Create your first template to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {editingId === template.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={editTemplate.name || ''}
                          onChange={e =>
                            setEditTemplate({
                              ...editTemplate,
                              name: e.target.value,
                            })
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slug *
                        </label>
                        <input
                          type="text"
                          value={editTemplate.slug || ''}
                          onChange={e =>
                            setEditTemplate({
                              ...editTemplate,
                              slug: e.target.value,
                            })
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trigger Action *
                      </label>
                      <select
                        value={editTemplate.trigger_action || ''}
                        onChange={e =>
                          setEditTemplate({
                            ...editTemplate,
                            trigger_action: e.target.value,
                          })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      >
                        {TRIGGER_ACTIONS.map(action => (
                          <option key={action.value} value={action.value}>
                            {action.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={editTemplate.subject || ''}
                        onChange={e =>
                          setEditTemplate({
                            ...editTemplate,
                            subject: e.target.value,
                          })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <EmailEditor
                        value={editTemplate.html_body || ''}
                        onChange={html =>
                          handleHtmlBodyChange(
                            html,
                            false,
                            editingId || undefined
                          )
                        }
                        variables={editTemplate.variables || []}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Body
                      </label>
                      <textarea
                        value={editTemplate.text_body || ''}
                        onChange={e =>
                          setEditTemplate({
                            ...editTemplate,
                            text_body: e.target.value,
                          })
                        }
                        rows={4}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editTemplate.description || ''}
                        onChange={e =>
                          setEditTemplate({
                            ...editTemplate,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editTemplate.is_active ?? true}
                        onChange={e =>
                          setEditTemplate({
                            ...editTemplate,
                            is_active: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Active
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(template.id)}
                        className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-sm font-medium text-gray-900">
                          {template.name}
                        </h5>
                        {!template.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {TRIGGER_ACTIONS.find(
                            a => a.value === template.trigger_action
                          )?.label || template.trigger_action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Subject:</strong> {template.subject}
                      </p>
                      {template.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {template.description}
                        </p>
                      )}
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Variables: {template.variables.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingId(template.id)}
                        className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Preview template"
                        aria-label="Preview template"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(template)}
                        className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Edit template"
                        aria-label="Edit template"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id, template.name)}
                        className="p-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        title="Delete template"
                        aria-label="Delete template"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {viewingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Template Preview
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingId(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {(() => {
                const template = templates.find(t => t.id === viewingId);
                if (!template) return null;
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </h4>
                      <p className="text-sm text-gray-900">
                        {template.subject}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        HTML Preview
                      </h4>
                      <div
                        className="border border-gray-200 rounded-md p-4 bg-white"
                        dangerouslySetInnerHTML={{ __html: template.html_body }}
                      />
                    </div>
                    {template.text_body && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Text Version
                        </h4>
                        <pre className="border border-gray-200 rounded-md p-4 bg-gray-50 text-sm whitespace-pre-wrap">
                          {template.text_body}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
