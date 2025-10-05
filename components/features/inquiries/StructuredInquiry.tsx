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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useInquiry } from '@/hooks/useInquiry';
import { InquiryForm } from './InquiryForm';
import { InquiryStatus } from './InquiryStatus';
import { InquiryHistory } from './InquiryHistory';
import { TemplateResponses } from './TemplateResponses';
import { InquiryValidation } from './InquiryValidation';
import {
  Inquiry,
  InquiryStatus as InquiryStatusType,
  INQUIRY_STATUS,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

interface StructuredInquiryProps {
  contractorId?: string;
  eventId?: string;
  initialInquiry?: Inquiry;
  onInquirySent?: (inquiry: Inquiry) => void;
  onInquiryUpdated?: (inquiry: Inquiry) => void;
  className?: string;
}

export function StructuredInquiry({
  contractorId,
  eventId,
  initialInquiry,
  onInquirySent,
  onInquiryUpdated,
  className = '',
}: StructuredInquiryProps) {
  const [activeTab, setActiveTab] = useState('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    inquiries,
    currentInquiry,
    templates,
    notifications,
    filters,
    isLoading: storeLoading,
    error: storeError,
    createInquiry,
    sendInquiry,
    updateInquiryStatus,
    loadInquiries,
    loadTemplates,
    clearError,
  } = useInquiry();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadInquiries(filters), loadTemplates()]);
      } catch (err) {
        setError('Failed to load inquiry data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadInquiries, loadTemplates, filters]);

  // Handle inquiry creation
  const handleCreateInquiry = async (inquiryData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const inquiry = await createInquiry(inquiryData);

      if (onInquirySent) {
        onInquirySent(inquiry);
      }

      setSuccess('Inquiry created successfully');
      setActiveTab('status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inquiry');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle inquiry sending
  const handleSendInquiry = async (inquiryId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await sendInquiry(inquiryId);

      if (onInquirySent) {
        const updatedInquiry = inquiries.find(i => i.id === inquiryId);
        if (updatedInquiry && onInquiryUpdated) {
          onInquiryUpdated(updatedInquiry);
        }
      }

      setSuccess('Inquiry sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (
    inquiryId: string,
    status: InquiryStatusType
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await updateInquiryStatus(inquiryId, status);

      if (onInquiryUpdated) {
        const updatedInquiry = inquiries.find(i => i.id === inquiryId);
        if (updatedInquiry) {
          onInquiryUpdated(updatedInquiry);
        }
      }

      setSuccess('Inquiry status updated successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update inquiry status'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: InquiryStatusType) => {
    switch (status) {
      case INQUIRY_STATUS.SENT:
        return <Send className="h-4 w-4" />;
      case INQUIRY_STATUS.VIEWED:
        return <Clock className="h-4 w-4" />;
      case INQUIRY_STATUS.RESPONDED:
        return <CheckCircle className="h-4 w-4" />;
      case INQUIRY_STATUS.QUOTED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: InquiryStatusType) => {
    switch (status) {
      case INQUIRY_STATUS.SENT:
        return 'bg-blue-100 text-blue-800';
      case INQUIRY_STATUS.VIEWED:
        return 'bg-yellow-100 text-yellow-800';
      case INQUIRY_STATUS.RESPONDED:
        return 'bg-green-100 text-green-800';
      case INQUIRY_STATUS.QUOTED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (storeLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inquiry system...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Structured Inquiry System
          </CardTitle>
          <CardDescription>
            Send structured inquiries to contractors with event details and
            track responses
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              clearError();
            }}
            className="ml-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuccess(null)}
            className="ml-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="form">Create Inquiry</TabsTrigger>
          <TabsTrigger value="status">Status Tracking</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <InquiryForm
            contractorId={contractorId}
            eventId={eventId}
            initialInquiry={initialInquiry}
            onSubmit={handleCreateInquiry}
            isLoading={isLoading}
            templates={templates}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <InquiryStatus
            inquiries={inquiries}
            onStatusUpdate={handleStatusUpdate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <InquiryHistory
            inquiries={inquiries}
            filters={filters}
            onFiltersChange={newFilters => {
              // Update filters and reload
              loadInquiries(newFilters);
            }}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateResponses
            templates={templates}
            onTemplateSelect={template => {
              // Switch to form tab with template applied
              setActiveTab('form');
            }}
          />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <InquiryValidation
            onValidationComplete={(isValid, errors) => {
              if (isValid) {
                setSuccess('Inquiry data is valid');
              } else {
                setError(`Validation failed: ${errors.join(', ')}`);
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
