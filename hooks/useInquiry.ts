import { useState, useCallback } from 'react';
import {
  Inquiry,
  InquiryTemplate,
  InquiryNotification,
  InquiryFilters,
  InquiryData,
  CreateInquiryTemplateRequest,
  InquiryStatus as InquiryStatusType,
  NotificationType,
} from '@/types/inquiries';

interface UseInquiryReturn {
  // State
  inquiries: Inquiry[];
  currentInquiry: Inquiry | null;
  templates: InquiryTemplate[];
  notifications: InquiryNotification[];
  filters: InquiryFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  createInquiry: (inquiryData: InquiryData) => Promise<Inquiry>;
  sendInquiry: (inquiryId: string) => Promise<void>;
  updateInquiryStatus: (
    inquiryId: string,
    status: InquiryStatusType
  ) => Promise<void>;
  loadInquiries: (filters?: InquiryFilters) => Promise<void>;
  loadTemplates: (userId: string) => Promise<void>;
  createTemplate: (templateData: CreateInquiryTemplateRequest) => Promise<void>;
  applyTemplate: (
    templateId: string,
    inquiryData: InquiryData
  ) => Promise<InquiryData>;
  sendNotification: (
    inquiryId: string,
    notificationType: NotificationType
  ) => Promise<void>;
  exportInquiries: (format: string, filters?: InquiryFilters) => Promise<Blob>;
  clearError: () => void;
}

export function useInquiry(): UseInquiryReturn {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [currentInquiry, setCurrentInquiry] = useState<Inquiry | null>(null);
  const [templates, setTemplates] = useState<InquiryTemplate[]>([]);
  const [notifications, setNotifications] = useState<InquiryNotification[]>([]);
  const [filters, setFilters] = useState<InquiryFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create inquiry
  const createInquiry = useCallback(
    async (inquiryData: InquiryData): Promise<Inquiry> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inquiryData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create inquiry');
        }

        const result = await response.json();
        const newInquiry = result.inquiry;

        // Add to inquiries list
        setInquiries(prev => [newInquiry, ...prev]);
        setCurrentInquiry(newInquiry);

        return newInquiry;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create inquiry';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Send inquiry
  const sendInquiry = useCallback(async (inquiryId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/inquiries/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inquiry_id: inquiryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send inquiry');
      }

      // Update inquiry status
      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: 'sent' as InquiryStatusType }
            : inquiry
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send inquiry';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update inquiry status
  const updateInquiryStatus = useCallback(
    async (inquiryId: string, status: InquiryStatusType): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/inquiries/${inquiryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || 'Failed to update inquiry status'
          );
        }

        // Update inquiry in list
        setInquiries(prev =>
          prev.map(inquiry =>
            inquiry.id === inquiryId ? { ...inquiry, status } : inquiry
          )
        );

        // Update current inquiry if it's the one being updated
        if (currentInquiry?.id === inquiryId) {
          setCurrentInquiry(prev => (prev ? { ...prev, status } : null));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update inquiry status';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentInquiry]
  );

  // Load inquiries
  const loadInquiries = useCallback(
    async (newFilters?: InquiryFilters): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (newFilters) {
          Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });
        }

        const response = await fetch(
          `/api/inquiries?${queryParams.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load inquiries');
        }

        const result = await response.json();
        setInquiries(result.inquiries || []);
        setFilters(newFilters || {});
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load inquiries';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load templates
  const loadTemplates = useCallback(async (userId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/inquiries/templates?user_id=${userId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load templates');
      }

      const result = await response.json();
      setTemplates(result.templates || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create template
  const createTemplate = useCallback(
    async (templateData: CreateInquiryTemplateRequest): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/inquiries/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create template');
        }

        const result = await response.json();
        const newTemplate = result.template;

        // Add to templates list
        setTemplates(prev => [newTemplate, ...prev]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Apply template
  const applyTemplate = useCallback(
    async (
      templateId: string,
      inquiryData: InquiryData
    ): Promise<InquiryData> => {
      try {
        const template = templates.find(t => t.id === templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        // Parse template content and apply to inquiry data
        const templateData = JSON.parse(template.template_content);

        return {
          ...inquiryData,
          ...templateData,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to apply template';
        setError(errorMessage);
        throw err;
      }
    },
    [templates]
  );

  // Send notification
  const sendNotification = useCallback(
    async (
      inquiryId: string,
      notificationType: NotificationType
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/inquiries/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inquiry_id: inquiryId,
            notification_type: notificationType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send notification');
        }

        const result = await response.json();
        const newNotification = result.notification;

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send notification';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Export inquiries
  const exportInquiries = useCallback(
    async (format: string, exportFilters?: InquiryFilters): Promise<Blob> => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        queryParams.append('format', format);

        if (exportFilters) {
          Object.entries(exportFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });
        }

        const response = await fetch(
          `/api/inquiries/history/export?${queryParams.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to export inquiries');
        }

        return await response.blob();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to export inquiries';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // State
    inquiries,
    currentInquiry,
    templates,
    notifications,
    filters,
    isLoading,
    error,

    // Actions
    createInquiry,
    sendInquiry,
    updateInquiryStatus,
    loadInquiries,
    loadTemplates,
    createTemplate,
    applyTemplate,
    sendNotification,
    exportInquiries,
    clearError,
  };
}
