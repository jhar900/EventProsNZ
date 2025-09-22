'use client';

import { useState } from 'react';

interface OnboardingTutorialProps {
  onComplete: () => void;
  isLoading: boolean;
}

const tutorialSteps = [
  {
    title: 'Welcome to EventProsNZ!',
    content:
      'EventProsNZ is your one-stop platform for managing events and connecting with professional contractors.',
    icon: '🎉',
  },
  {
    title: 'Find Contractors',
    content:
      'Browse our directory of verified contractors for catering, photography, entertainment, and more.',
    icon: '🔍',
  },
  {
    title: 'Create Events',
    content:
      'Set up your events with all the details and requirements to get accurate quotes from contractors.',
    icon: '📅',
  },
  {
    title: 'Manage Everything',
    content:
      'Keep track of all your events, contractor communications, and bookings in one place.',
    icon: '📊',
  },
  {
    title: 'Get Started',
    content:
      "You're all set! Start by creating your first event or browsing available contractors.",
    icon: '🚀',
  },
];

export function OnboardingTutorial({
  onComplete,
  isLoading,
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Platform Tutorial
        </h2>
        <p className="text-gray-600">
          Let's take a quick tour of what you can do on EventProsNZ
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{currentTutorial.icon}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {currentTutorial.title}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {currentTutorial.content}
          </p>
        </div>

        <div className="flex justify-center space-x-2">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="space-x-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === tutorialSteps.length - 1
                ? 'Get Started'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Quick Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Complete your profile to get better contractor matches</li>
          <li>
            • Be specific about your event requirements for accurate quotes
          </li>
          <li>• Check contractor reviews and portfolios before booking</li>
          <li>• Use the messaging system to communicate with contractors</li>
        </ul>
      </div>
    </div>
  );
}
