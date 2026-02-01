'use client';

import React, { useEffect, useState } from 'react';
import { useEventCreationStore } from '@/stores/event-creation';
import { useAuth } from '@/hooks/useAuth';
import { ProgressBar } from './ProgressBar';
import { EventBasicsStep } from './EventBasicsStep';
import { ServiceRequirementsStep } from './ServiceRequirementsStep';
import { BudgetPlanningStep } from './BudgetPlanningStep';
import { EventReviewStep } from './EventReviewStep';
import { EventTemplates } from './EventTemplates';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EventCreationWizardProps {
  initialEventData?: any;
  eventId?: string;
  isEditMode?: boolean;
  onComplete?: (eventId: string) => void;
  onCancel?: () => void;
}

export function EventCreationWizard({
  initialEventData,
  eventId,
  isEditMode = false,
  onComplete,
  onCancel,
}: EventCreationWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentStep,
    eventData,
    isLoading,
    validationErrors,
    hasTimeErrors,
    nextStep,
    previousStep,
    goToStep,
    saveDraft,
    submitEvent,
    updateEvent,
    validateStep,
    clearValidationErrors,
    loadDrafts,
    resetWizard,
    setIsEditMode,
  } = useEventCreationStore();

  // Set edit mode in store when component mounts or isEditMode changes
  useEffect(() => {
    setIsEditMode(isEditMode);
  }, [isEditMode, setIsEditMode]);

  const [showTemplates, setShowTemplates] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load drafts on mount (only for new events, not edit mode)
  useEffect(() => {
    if (user?.id && !isEditMode) {
      loadDrafts(user.id);
    }
  }, [loadDrafts, user?.id, isEditMode]);

  // Auto-save draft every 30 seconds (only for new events, not edit mode)
  useEffect(() => {
    if (!user?.id || isEditMode) return;
    const interval = setInterval(() => {
      if (eventData.title || eventData.eventType) {
        saveDraft(user.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [eventData, saveDraft, user?.id, isEditMode]);

  // Auto-save when data changes (debounced) - only for new events, not edit mode
  useEffect(() => {
    if (isEditMode) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      if ((eventData.title || eventData.eventType) && user?.id) {
        saveDraft(user.id);
      }
    }, 2000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [eventData, saveDraft, isEditMode, user?.id]);

  const handleCreateEvent = async () => {
    clearValidationErrors();

    // Don't allow proceeding if there are time errors
    if (hasTimeErrors) {
      return;
    }

    // Validate required fields for step 1
    if (!eventData.title || !eventData.title.trim()) {
      return; // Validation will show error
    }
    if (!eventData.eventDate) {
      return; // Validation will show error
    }

    if (validateStep(currentStep, isEditMode)) {
      // Submit/update event directly from step 1, setting status to 'planning'
      try {
        let result: any;
        if (isEditMode && eventId) {
          // Update existing event and set status to 'planning'
          result = await updateEvent(eventId, user?.id, 'planning');
          if (result?.event?.id) {
            if (onComplete) {
              onComplete(result.event.id);
            } else {
              router.push(`/events/${result.event.id}`);
            }
          }
        } else {
          // Create new event with status 'planning'
          result = await submitEvent(user?.id);
          if (result?.event?.id) {
            if (onComplete) {
              onComplete(result.event.id);
            } else {
              router.push(`/events/${result.event.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Error submitting/updating event:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    }
  };

  const handlePrevious = () => {
    clearValidationErrors();
    // If on step 4 (review), go back to step 1 (we're skipping 2 and 3)
    if (currentStep === 4) {
      goToStep(1);
    } else {
      previousStep();
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    // Don't allow saving if there are time errors
    if (hasTimeErrors) {
      return;
    }
    try {
      // In edit mode, use updateEvent instead of saveDraft to properly update the event
      if (isEditMode && eventId) {
        // Keep status as 'draft'
        const result = await updateEvent(eventId, user.id, 'draft');
        console.log('Update event result:', result);
        // Only call onComplete if update was successful
        // This will trigger a reload of the event data to show updated dates
        if (result && result.success && onComplete) {
          // Add a small delay to ensure the database update is complete before reloading
          setTimeout(() => {
            onComplete(eventId);
          }, 500);
        }
      } else {
        // For new events, use saveDraft
        await saveDraft(user.id);
        if (onCancel) {
          onCancel();
        }
      }
    } catch (error) {
      console.error('Error saving draft/updating event:', error);
      // Don't reload if there was an error
    }
  };

  const handleTemplateSelect = () => {
    setShowTemplates(true);
  };

  const handleTemplateClose = () => {
    setShowTemplates(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <EventBasicsStep />;
      case 2:
        return <ServiceRequirementsStep />;
      case 3:
        return <BudgetPlanningStep />;
      case 4:
        return <EventReviewStep />;
      default:
        return <EventBasicsStep />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Event Basics';
      case 2:
        return 'Service Requirements';
      case 3:
        return 'Budget Planning';
      case 4:
        return 'Review & Submit';
      default:
        return 'Event Creation';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'Tell us about your event - what, when, where, and how many people.';
      case 2:
        return "What services do you need? We'll help you find the right contractors.";
      case 3:
        return "Set your budget and we'll provide intelligent recommendations.";
      case 4:
        return 'Review your event details and submit to start finding contractors.';
      default:
        return '';
    }
  };

  if (showTemplates) {
    return (
      <EventTemplates
        onSelect={handleTemplateSelect}
        onClose={handleTemplateClose}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Event' : 'Create Your Event'}
        </h1>
        <p className="text-muted-foreground">
          Tell us about your event - what, when, where, and how many people.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="flex-1">
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Show "Save Draft" or "Update Draft" button */}
              {!isEditMode && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isLoading || hasTimeErrors}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              )}
              {isEditMode && eventData.isDraft && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isLoading || hasTimeErrors}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Update Draft
                </Button>
              )}

              {/* Show "Create Event" or "Update Event" button */}
              <Button
                onClick={handleCreateEvent}
                disabled={
                  isLoading ||
                  hasTimeErrors ||
                  !eventData.title?.trim() ||
                  !eventData.eventDate
                }
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isEditMode && !eventData.isDraft
                  ? 'Update Event'
                  : 'Create Event'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isEditMode
              ? 'Updating event...'
              : eventData.isDraft
                ? 'Saving draft...'
                : 'Creating event...'}
          </div>
        </div>
      )}
    </div>
  );
}
