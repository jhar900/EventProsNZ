'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const systemSettingsSchema = z.object({
  site_name: z
    .string()
    .min(1, 'Site name is required')
    .max(100, 'Site name too long'),
  site_description: z.string().max(500, 'Description too long'),
  maintenance_mode: z.boolean(),
  registration_enabled: z.boolean(),
  email_verification_required: z.boolean(),
  max_file_upload_size: z.number().min(1).max(100),
  session_timeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
  max_users_per_page: z.number().min(10).max(1000),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface AdminSystemSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

export default function AdminSystemSettings({
  onSuccess,
  onError,
}: AdminSystemSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettingsFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings/system', {
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });
      const result = await response.json();

      if (response.ok) {
        setSettings(result.settings);
        reset(result.settings);
      } else {
        throw new Error(result.error || 'Failed to load system settings');
      }
    } catch (err) {
      // Error handling is done by the component state
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onSubmit = async (data: SystemSettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update system settings');
      }

      setSettings(result.settings);
      onSuccess?.(result.settings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update system settings';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          System Settings
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              General Configuration
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="site_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Site Name
                </label>
                <input
                  {...register('site_name')}
                  type="text"
                  id="site_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.site_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.site_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="max_file_upload_size"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max File Upload Size (MB)
                </label>
                <input
                  {...register('max_file_upload_size', { valueAsNumber: true })}
                  type="number"
                  id="max_file_upload_size"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.max_file_upload_size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_file_upload_size.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="site_description"
                className="block text-sm font-medium text-gray-700"
              >
                Site Description
              </label>
              <textarea
                {...register('site_description')}
                id="site_description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              {errors.site_description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.site_description.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              User Management
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...register('registration_enabled')}
                  type="checkbox"
                  id="registration_enabled"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="registration_enabled"
                  className="ml-2 text-sm text-gray-700"
                >
                  Allow new user registration
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('email_verification_required')}
                  type="checkbox"
                  id="email_verification_required"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="email_verification_required"
                  className="ml-2 text-sm text-gray-700"
                >
                  Require email verification for new accounts
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              System Behavior
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="session_timeout"
                  className="block text-sm font-medium text-gray-700"
                >
                  Session Timeout (minutes)
                </label>
                <input
                  {...register('session_timeout', { valueAsNumber: true })}
                  type="number"
                  id="session_timeout"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.session_timeout && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.session_timeout.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="max_users_per_page"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Users Per Page
                </label>
                <input
                  {...register('max_users_per_page', { valueAsNumber: true })}
                  type="number"
                  id="max_users_per_page"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                {errors.max_users_per_page && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.max_users_per_page.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <input
                  {...register('maintenance_mode')}
                  type="checkbox"
                  id="maintenance_mode"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="maintenance_mode"
                  className="ml-2 text-sm text-gray-700"
                >
                  Enable maintenance mode (site will be unavailable to users)
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        </form>

        {/* Service Categories Management Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <ServiceCategoriesManager />
        </div>
      </div>
    </div>
  );
}

// Service Categories Management Component
function ServiceCategoriesManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editCategory, setEditCategory] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/service-categories', {
        credentials: 'include',
      });
      const result = await response.json();

      if (response.ok) {
        setCategories(result.categories || []);
      } else {
        throw new Error(result.error || 'Failed to load service categories');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load service categories'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCategory),
      });

      const result = await response.json();

      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        setIsAdding(false);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to create category');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create category'
      );
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch('/api/admin/service-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...editCategory }),
      });

      const result = await response.json();

      if (response.ok) {
        setEditingId(null);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to update category');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update category'
      );
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/service-categories?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        await loadCategories();
      } else {
        throw new Error(result.error || 'Failed to delete category');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete category'
      );
    }
  };

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setEditCategory({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory({ name: '', description: '', is_active: true });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-md font-medium text-gray-900">
            Service Categories
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Manage service categories that contractors can choose from
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Add New Category Form */}
      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">
            Add New Category
          </h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={e =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="e.g., Catering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={newCategory.description}
                onChange={e =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                placeholder="Brief description of this service category"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewCategory({ name: '', description: '' });
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
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No service categories found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map(category => (
              <div
                key={category.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={editCategory.name}
                        onChange={e =>
                          setEditCategory({
                            ...editCategory,
                            name: e.target.value,
                          })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editCategory.description}
                        onChange={e =>
                          setEditCategory({
                            ...editCategory,
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
                        checked={editCategory.is_active}
                        onChange={e =>
                          setEditCategory({
                            ...editCategory,
                            is_active: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Active (available for selection)
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(category.id)}
                        className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-sm font-medium text-gray-900">
                          {category.name}
                        </h5>
                        {!category.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Edit category"
                        aria-label="Edit category"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id, category.name)}
                        className="p-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        title="Delete category"
                        aria-label="Delete category"
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
    </div>
  );
}
