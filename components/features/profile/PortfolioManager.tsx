'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Image, Video, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  video_platform: z.enum(['youtube', 'vimeo']).optional(),
  event_date: z.string().optional(),
  is_visible: z.boolean().default(true),
});

type PortfolioItemForm = z.infer<typeof portfolioItemSchema>;

interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  video_platform?: 'youtube' | 'vimeo';
  event_date?: string;
  is_visible: boolean;
  created_at: string;
}

interface PortfolioManagerProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function PortfolioManager({
  userId: propUserId,
  onSuccess,
  onError,
}: PortfolioManagerProps) {
  const { user } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    if (!targetUserId) return; // Guard clause

    try {
      setIsFetching(true);
      setError(null);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/portfolio`
        : '/api/profile/me/portfolio';

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': targetUserId,
      };

      const response = await fetch(apiEndpoint, {
        credentials: 'include',
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio || []);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to load portfolio';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load portfolio';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    // Only fetch portfolio if user ID is available
    if (!targetUserId) {
      setIsFetching(false);
      return;
    }
    fetchPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, propUserId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PortfolioItemForm>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      title: '',
      description: '',
      image_url: '',
      video_url: '',
      video_platform: undefined,
      event_date: '',
      is_visible: true,
    },
  });

  const watchedVideoUrl = watch('video_url');

  const onSubmit = async (data: PortfolioItemForm) => {
    if (!targetUserId) {
      setError('User ID is required');
      return;
    }

    try {
      setIsLoading(true);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/portfolio`
        : '/api/profile/me/portfolio';

      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { ...data, id: editingItem.id } : data;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': targetUserId,
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedPortfolio = editingItem
          ? portfolio.map(p =>
              p.id === editingItem.id ? result.portfolio_item : p
            )
          : [...portfolio, result.portfolio_item];
        setPortfolio(updatedPortfolio);
        onSuccess?.('Portfolio item saved successfully!');
        reset();
        setEditingItem(null);
        setIsFormOpen(false);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to save portfolio item';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save portfolio item';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setValue('title', item.title);
    setValue('description', item.description || '');
    setValue('image_url', item.image_url || '');
    setValue('video_url', item.video_url || '');
    setValue('video_platform', item.video_platform);
    setValue('event_date', item.event_date || '');
    setValue('is_visible', item.is_visible);
    setIsFormOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!targetUserId) {
      setError('User ID is required');
      return;
    }

    if (!confirm('Are you sure you want to delete this portfolio item?'))
      return;

    try {
      setIsLoading(true);
      setError(null);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/portfolio/${itemId}`
        : `/api/profile/me/portfolio/${itemId}`;

      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'x-user-id': targetUserId,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const updatedPortfolio = portfolio.filter(p => p.id !== itemId);
        setPortfolio(updatedPortfolio);
        onSuccess?.('Portfolio item deleted successfully!');
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || 'Failed to delete portfolio item';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete portfolio item';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/upload/portfolio-photo', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setValue('image_url', result.url);
        onSuccess?.('Image uploaded successfully!');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to upload image';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const validateVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;

    if (youtubeRegex.test(url)) {
      setValue('video_platform', 'youtube');
      return true;
    } else if (vimeoRegex.test(url)) {
      setValue('video_platform', 'vimeo');
      return true;
    }
    return false;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Portfolio</CardTitle>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No portfolio items added yet.</p>
              <p className="text-sm">
                Click &quot;Add Portfolio Item&quot; to showcase your work.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map(item => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-3">
                    {item.image_url && (
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {item.video_url && (
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        {item.video_platform === 'youtube' ? (
                          <Video className="h-8 w-8 text-red-500" />
                        ) : (
                          <Video className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        {!item.is_visible && (
                          <Badge variant="secondary" className="text-xs">
                            Hidden
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.event_date)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Item Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Wedding Photography - Sarah & John"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe this portfolio item..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  {...register('event_date')}
                />
              </div>

              <div>
                <Label>Image Upload</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Image className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </span>
                    </Button>
                  </Label>
                  <span className="text-sm text-gray-500">
                    JPG, PNG or WebP. Max 5MB.
                  </span>
                </div>
                {watch('image_url') && (
                  <div className="mt-2">
                    <img
                      src={watch('image_url')}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="video_url">Video URL (YouTube or Vimeo)</Label>
                <Input
                  id="video_url"
                  {...register('video_url')}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={e => {
                    register('video_url').onChange(e);
                    if (e.target.value) {
                      validateVideoUrl(e.target.value);
                    }
                  }}
                />
                {watchedVideoUrl && !validateVideoUrl(watchedVideoUrl) && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter a valid YouTube or Vimeo URL
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_visible"
                  {...register('is_visible')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_visible">
                  Make this portfolio item visible to event managers
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading
                    ? 'Saving...'
                    : editingItem
                      ? 'Update Item'
                      : 'Add Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
