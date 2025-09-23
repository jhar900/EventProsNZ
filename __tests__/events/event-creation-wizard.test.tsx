import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventCreationWizard } from '@/components/features/events/EventCreationWizard';
import { useEventCreationStore } from '@/stores/event-creation';

// Mock the store
jest.mock('@/stores/event-creation', () => ({
  useEventCreationStore: jest.fn(),
  useEventData: jest.fn(),
  useServiceRequirements: jest.fn(),
  useBudgetPlan: jest.fn(),
  useValidationErrors: jest.fn(),
  useIsLoading: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the API calls
global.fetch = jest.fn();

describe('EventCreationWizard', () => {
  const mockStore = {
    currentStep: 1,
    eventData: {},
    serviceRequirements: [],
    budgetPlan: { totalBudget: 0, breakdown: {}, recommendations: [] },
    contractorMatches: [],
    templates: [],
    drafts: [],
    isDraft: true,
    isLoading: false,
    validationErrors: [],
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    goToStep: jest.fn(),
    updateEventData: jest.fn(),
    addServiceRequirement: jest.fn(),
    removeServiceRequirement: jest.fn(),
    updateServiceRequirement: jest.fn(),
    updateBudgetPlan: jest.fn(),
    loadTemplates: jest.fn(),
    loadDrafts: jest.fn(),
    saveDraft: jest.fn(),
    submitEvent: jest.fn(),
    validateStep: jest.fn(),
    clearValidationErrors: jest.fn(),
    resetWizard: jest.fn(),
    loadTemplate: jest.fn(),
  };

  beforeEach(() => {
    (useEventCreationStore as jest.Mock).mockReturnValue(mockStore);
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wizard with initial step', () => {
    render(<EventCreationWizard />);

    expect(screen.getByText('Create Your Event')).toBeInTheDocument();
    expect(screen.getByText('Event Basics')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tell us about your event - what, when, where, and how many people.'
      )
    ).toBeInTheDocument();
  });

  it('shows progress bar with correct steps', () => {
    render(<EventCreationWizard />);

    expect(screen.getByText('Event Basics')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('navigates to next step when Next button is clicked', async () => {
    mockStore.validateStep.mockReturnValue(true);

    render(<EventCreationWizard />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockStore.validateStep).toHaveBeenCalledWith(1);
    expect(mockStore.nextStep).toHaveBeenCalled();
  });

  it('does not navigate when validation fails', () => {
    mockStore.validateStep.mockReturnValue(false);

    render(<EventCreationWizard />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockStore.validateStep).toHaveBeenCalledWith(1);
    expect(mockStore.nextStep).not.toHaveBeenCalled();
  });

  it('shows validation errors when they exist', () => {
    mockStore.validationErrors = [
      { field: 'title', message: 'Event title is required' },
      { field: 'eventDate', message: 'Event date is required' },
    ];

    render(<EventCreationWizard />);

    expect(screen.getByText('Event title is required')).toBeInTheDocument();
    expect(screen.getByText('Event date is required')).toBeInTheDocument();
  });

  it('saves draft when Save Draft button is clicked', async () => {
    render(<EventCreationWizard />);

    const saveDraftButton = screen.getByText('Save Draft');
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(mockStore.saveDraft).toHaveBeenCalled();
    });
  });

  it('shows loading state when submitting', () => {
    mockStore.isLoading = true;

    render(<EventCreationWizard />);

    expect(screen.getByText('Creating event...')).toBeInTheDocument();
  });

  it('shows template selector when Use Template button is clicked', () => {
    render(<EventCreationWizard />);

    const useTemplateButton = screen.getByText('Use Template');
    fireEvent.click(useTemplateButton);

    // The template modal should be shown
    expect(screen.getByText('Choose an Event Template')).toBeInTheDocument();
  });

  it('calls onComplete when event is successfully submitted', async () => {
    const mockOnComplete = jest.fn();
    mockStore.submitEvent.mockResolvedValue({ event: { id: '123' } });
    mockStore.currentStep = 4;

    render(<EventCreationWizard onComplete={mockOnComplete} />);

    const createEventButton = screen.getByText('Create Event');
    fireEvent.click(createEventButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('123');
    });
  });
});
