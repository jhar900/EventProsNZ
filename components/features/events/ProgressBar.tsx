'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  totalSteps?: number;
}

const stepLabels = ['Event Basics', 'Services', 'Budget', 'Review'];

const stepDescriptions = [
  'What, when, where',
  'What you need',
  'How much to spend',
  'Final review',
];

export function ProgressBar({
  currentStep,
  onStepClick,
  totalSteps = 4,
}: ProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isClickable = onStepClick && step <= currentStep;

            return (
              <div key={step} className="flex items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isCompleted &&
                      !isCurrent &&
                      'border-muted-foreground bg-background text-muted-foreground',
                    isClickable && 'cursor-pointer hover:border-primary/50'
                  )}
                  onClick={isClickable ? () => onStepClick(step) : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="ml-3 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {stepLabels[index]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stepDescriptions[index]}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {stepLabels[currentStep - 1]}
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-1">
          {steps.map(step => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;

            return (
              <div
                key={step}
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent &&
                    'bg-primary/20 text-primary border border-primary',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
