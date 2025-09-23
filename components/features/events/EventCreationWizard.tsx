'use client';

import React, { useEffect, useState } from 'react';
import { useEventCreationStore } from '@/stores/event-creation';
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
  onComplete?: (eventId: string) => void;
  onCancel?: () => void;
}

export function EventCreationWizard({
  initialEventData,
  onComplete,
  onCancel,
}: EventCreationWizardProps) {
  const router = useRouter();
  const {
    currentStep,
    eventData,
    isLoading,
    validationErrors,
    nextStep,
    previousStep,
    goToStep,
    saveDraft,
    submitEvent,
    validateStep,
    clearValidationErrors,
    loadDrafts,
    resetWizard,
  } = useEventCreationStore();

  const [showTemplates, setShowTemplates] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventData.title || eventData.eventType) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [eventData, saveDraft]);

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      if (eventData.title || eventData.eventType) {
        saveDraft();
      }
    }, 2000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [eventData, saveDraft]);

  const handleNext = async () => {
    clearValidationErrors();

    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        nextStep();
      } else {
        // Final step - submit event
        try {
          const result = await submitEvent();
          if (result?.event?.id) {
            onComplete?.(result.event.id);
            router.push(`/events/${result.event.id}`);
          }
        } catch (error) {
          console.error('Failed to submit event:', error);
        }
      }
    }
  };

  const handlePrevious = () => {
    clearValidationErrors();
    previousStep();
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
    } catch (error) {
      console.error('Failed to save draft:', error);
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
        <h1 className="text-3xl font-bold">Create Your Event</h1>
        <p className="text-muted-foreground">
          Follow our guided process to create your perfect event
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} onStepClick={goToStep} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </div>
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={handleTemplateSelect}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Use Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>

              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {currentStep === 4 ? 'Create Event' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-save indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {currentStep === 4 ? 'Creating event...' : 'Saving draft...'}
          </div>
        </div>
      )}
    </div>
  );
}
