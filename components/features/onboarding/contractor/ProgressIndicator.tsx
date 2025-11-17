'use client';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number;
  status?: {
    step1_completed: boolean;
    step2_completed: boolean;
    step3_completed: boolean;
    step4_completed: boolean;
  } | null;
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  status,
}: ProgressIndicatorProps) {
  console.log(
    'ProgressIndicator - currentStep:',
    currentStep,
    'completedSteps:',
    completedSteps,
    'status:',
    status
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          // Check the actual status value for this step, not the count
          let isCompleted = false;
          if (status) {
            switch (step.id) {
              case 1:
                isCompleted = status.step1_completed && step.id !== currentStep;
                break;
              case 2:
                isCompleted = status.step2_completed && step.id !== currentStep;
                break;
              case 3:
                isCompleted = status.step3_completed && step.id !== currentStep;
                break;
              case 4:
                isCompleted = status.step4_completed && step.id !== currentStep;
                break;
            }
          }

          const isCurrent = currentStep === step.id;
          const isAccessible =
            index === 0 ||
            (status &&
              ((step.id === 2 && status.step1_completed) ||
                (step.id === 3 && status.step2_completed) ||
                (step.id === 4 && status.step3_completed)));

          console.log(
            `Step ${step.id}: isCompleted=${isCompleted} (status.step${step.id}_completed=${status?.[`step${step.id}_completed` as keyof typeof status]})`
          );

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCompleted
                      ? 'bg-green-200'
                      : isCurrent
                        ? 'bg-blue-500 text-white'
                        : isAccessible
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-green-700"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className={isCurrent ? 'text-white' : ''}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-blue-600'
                        : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
