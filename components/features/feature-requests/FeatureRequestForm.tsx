'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Send, Upload, File } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureRequestCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface FeatureRequestFormData {
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  is_public: boolean;
  attachment?: File;
}

interface FeatureRequestFormProps {
  initialData?: Partial<FeatureRequestFormData>;
  onSave?: (data: FeatureRequestFormData) => void;
  onSubmit?: (data: FeatureRequestFormData, attachment?: File | null) => void;
  isEditing?: boolean;
  isLoading?: boolean;
  showCard?: boolean;
  showCategory?: boolean;
  showPriority?: boolean;
  strictValidation?: boolean;
}

export default function FeatureRequestForm({
  initialData,
  onSave,
  onSubmit,
  isEditing = false,
  isLoading = false,
  showCard = true,
  showCategory = true,
  showPriority = true,
  strictValidation = true,
}: FeatureRequestFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FeatureRequestFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || (showCategory ? '' : ''),
    priority: initialData?.priority || (showPriority ? 'medium' : 'medium'),
    tags: initialData?.tags || [],
    is_public: initialData?.is_public ?? true,
  });

  const [categories, setCategories] = useState<FeatureRequestCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );

  // Load categories on mount (only if category field is shown)
  useEffect(() => {
    if (!showCategory) return;

    const loadCategories = async () => {
      try {
        const response = await fetch('/api/feature-requests/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to load categories:', response.status);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Don't show toast for category loading errors - it's not critical
      }
    };

    loadCategories();
  }, [showCategory]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (strictValidation && formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (strictValidation && formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    if (showCategory && !formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        onSave(formData);
      } else {
        // Save to localStorage as draft
        const drafts = JSON.parse(
          localStorage.getItem('feature_request_drafts') || '[]'
        );
        const draft = {
          ...formData,
          id: Date.now().toString(),
          saved_at: new Date().toISOString(),
        };
        drafts.push(draft);
        localStorage.setItem('feature_request_drafts', JSON.stringify(drafts));
        toast.success('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare submission data - only include category if shown
      const submissionData: any = {
        title: formData.title,
        description: formData.description,
        is_public: formData.is_public,
        ...(showCategory && formData.category_id
          ? { category_id: formData.category_id }
          : {}),
        // Priority is no longer used - always default to 'medium' in the backend
      };

      if (onSubmit) {
        await onSubmit(submissionData as FeatureRequestFormData, attachment);
        // Reset form after successful submission
        setFormData({
          title: '',
          description: '',
          category_id: '',
          priority: 'medium',
          tags: [],
          is_public: true,
        });
        setAttachment(null);
        setAttachmentPreview(null);
        setErrors({});
      } else {
        // Create FormData to handle file upload
        const formDataToSend = new FormData();
        formDataToSend.append('title', submissionData.title);
        formDataToSend.append('description', submissionData.description);
        formDataToSend.append('is_public', String(submissionData.is_public));
        if (submissionData.category_id) {
          formDataToSend.append('category_id', submissionData.category_id);
        }
        if (attachment) {
          formDataToSend.append('attachment', attachment);
        }

        const response = await fetch('/api/feature-requests', {
          method: 'POST',
          body: formDataToSend,
        });

        if (response.ok) {
          const featureRequest = await response.json();
          toast.success('Feature request submitted successfully');
          router.push(`/feature-requests/${featureRequest.id}`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to submit feature request');
        }
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast.error('Failed to submit feature request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={e =>
            setFormData(prev => ({ ...prev, title: e.target.value }))
          }
          placeholder="Brief, descriptive title for your feature request"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        <p className="text-sm text-gray-500">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          placeholder="Provide a detailed description of your feature request. Include use cases, benefits, and any specific requirements."
          rows={8}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
        <p className="text-sm text-gray-500">
          {formData.description.length}/5000 characters
        </p>
      </div>

      {/* Category */}
      {showCategory && (
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category_id}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, category_id: value }))
            }
          >
            <SelectTrigger
              className={errors.category_id ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-sm text-red-500">{errors.category_id}</p>
          )}
        </div>
      )}

      {/* Priority */}
      {showPriority && (
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Attachment */}
      <div className="space-y-2">
        <Label htmlFor="attachment">Attachment (Optional)</Label>
        <div className="flex items-center gap-4">
          <label
            htmlFor="attachment"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Choose File</span>
          </label>
          <input
            type="file"
            id="attachment"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('File size must be less than 10MB');
                  return;
                }
                setAttachment(file);
                // Create preview for images
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setAttachmentPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                } else {
                  setAttachmentPreview(null);
                }
              }
            }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          {attachment && (
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{attachment.name}</span>
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setAttachmentPreview(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {attachmentPreview && (
          <div className="mt-2">
            <img
              src={attachmentPreview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded border border-gray-300"
            />
          </div>
        )}
        <p className="text-sm text-gray-500">
          Supported formats: Images, PDF, Word documents, Text files (Max 10MB)
        </p>
      </div>

      {/* Public/Private */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={e =>
              setFormData(prev => ({ ...prev, is_public: e.target.checked }))
            }
            className="rounded"
          />
          <Label htmlFor="is_public">Make this request public</Label>
        </div>
        <p className="text-sm text-gray-500">
          Public requests can be viewed and voted on by other users
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting
            ? 'Submitting...'
            : isEditing
              ? 'Update Request'
              : 'Submit Request'}
        </Button>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Feature Request' : 'Submit Feature Request'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update your feature request details below.'
              : 'Help us improve the platform by submitting your feature request. Please provide detailed information about what you would like to see implemented.'}
          </CardDescription>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return <div className="w-full">{formContent}</div>;
}
