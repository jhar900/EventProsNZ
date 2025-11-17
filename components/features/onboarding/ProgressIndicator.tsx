'use client';

interface Step {
  id: number;
  title: string;
  component: string;
}

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex justify-between">
        {steps.map(step => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              step.id <= currentStep ? 'text-orange-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id < currentStep
                  ? 'bg-orange-600 text-white'
                  : step.id === currentStep
                    ? 'bg-orange-100 text-orange-600 border-2 border-orange-600'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <span className="text-xs mt-2 text-center max-w-20">
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
