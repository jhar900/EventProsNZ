'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServiceRequirementsStep } from './ServiceRequirementsStep';
import { BudgetPlanningStep } from './BudgetPlanningStep';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { useEventCreationStore } from '@/stores/event-creation';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdvancedPlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess?: () => void;
}

export function AdvancedPlanningModal({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: AdvancedPlanningModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'services' | 'budget'>(
    'services'
  );
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const { updateEvent, isLoading, validationErrors, loadEventData } =
    useEventCreationStore();

  // Load event data when modal opens
  useEffect(() => {
    if (open && eventId && user?.id) {
      setIsLoadingEvent(true);
      loadEventData(eventId, user.id)
        .then(() => {
          setIsLoadingEvent(false);
        })
        .catch(err => {
          console.error('Error loading event data:', err);
          setIsLoadingEvent(false);
        });
    }
  }, [open, eventId, user?.id, loadEventData]);

  const handleSave = async () => {
    if (!user?.id || !eventId) return;

    try {
      const result = await updateEvent(eventId, user.id);
      if (result?.success) {
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving advanced planning:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Planning</DialogTitle>
        </DialogHeader>

        {isLoadingEvent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading event data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setCurrentStep('services')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  currentStep === 'services'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Service Requirements
              </button>
              <button
                onClick={() => setCurrentStep('budget')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  currentStep === 'budget'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Budget Planning
              </button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 'services'
                    ? 'Service Requirements'
                    : 'Budget Planning'}
                </CardTitle>
                <CardDescription>
                  {currentStep === 'services'
                    ? "What services do you need? We'll help you find the right contractors."
                    : "Set your budget and we'll provide intelligent recommendations."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 'services' ? (
                  <ServiceRequirementsStep />
                ) : (
                  <BudgetPlanningStep />
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {currentStep === 'budget' && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('services')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                {currentStep === 'services' && (
                  <Button
                    onClick={() => setCurrentStep('budget')}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
