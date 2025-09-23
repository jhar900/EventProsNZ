import { renderHook, act } from '@testing-library/react';
import { useEventCreationStore } from '@/stores/event-creation';
import { EVENT_TYPES, SERVICE_CATEGORIES } from '@/types/events';

// Mock fetch
global.fetch = jest.fn();

describe('useEventCreationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useEventCreationStore());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.eventData).toEqual({
      eventType: '',
      title: '',
      description: '',
      eventDate: '',
      durationHours: undefined,
      attendeeCount: undefined,
      location: {
        address: '',
        coordinates: { lat: 0, lng: 0 },
      },
      specialRequirements: '',
      serviceRequirements: [],
      budgetPlan: {
        totalBudget: 0,
        breakdown: {},
        recommendations: [],
      },
      isDraft: true,
    });
    expect(result.current.serviceRequirements).toEqual([]);
    expect(result.current.budgetPlan).toEqual({
      totalBudget: 0,
      breakdown: {},
      recommendations: [],
    });
    expect(result.current.isDraft).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.validationErrors).toEqual([]);
  });

  it('updates event data correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    act(() => {
      result.current.updateEventData({
        title: 'Test Event',
        eventType: EVENT_TYPES.WEDDING,
      });
    });

    expect(result.current.eventData.title).toBe('Test Event');
    expect(result.current.eventData.eventType).toBe(EVENT_TYPES.WEDDING);
  });

  it('navigates to next step correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Mock validateStep to return true
    result.current.validateStep = jest.fn().mockReturnValue(true);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('navigates to previous step correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // First go to step 2
    act(() => {
      result.current.nextStep();
    });

    // Then go back to step 1
    act(() => {
      result.current.previousStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('does not go below step 1', () => {
    const { result } = renderHook(() => useEventCreationStore());

    act(() => {
      result.current.previousStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('does not go above step 4', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Go to step 4
    act(() => {
      result.current.goToStep(4);
    });

    // Try to go to next step
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(4);
  });

  it('adds service requirements correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    const serviceRequirement = {
      category: SERVICE_CATEGORIES.CATERING,
      type: 'Full Service Catering',
      description: 'Complete catering service',
      priority: 'high' as const,
      estimatedBudget: 5000,
      isRequired: true,
    };

    act(() => {
      result.current.addServiceRequirement(serviceRequirement);
    });

    expect(result.current.serviceRequirements).toHaveLength(1);
    expect(result.current.serviceRequirements[0]).toMatchObject(
      serviceRequirement
    );
    expect(result.current.serviceRequirements[0].id).toBeDefined();
  });

  it('removes service requirements correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    const serviceRequirement = {
      id: 'test-id',
      category: SERVICE_CATEGORIES.CATERING,
      type: 'Full Service Catering',
      description: 'Complete catering service',
      priority: 'high' as const,
      estimatedBudget: 5000,
      isRequired: true,
    };

    // Add requirement
    act(() => {
      result.current.addServiceRequirement(serviceRequirement);
    });

    expect(result.current.serviceRequirements).toHaveLength(1);

    // Get the actual ID that was generated
    const actualId = result.current.serviceRequirements[0].id;

    // Remove requirement using the actual ID
    act(() => {
      result.current.removeServiceRequirement(actualId);
    });

    expect(result.current.serviceRequirements).toHaveLength(0);
  });

  it('updates service requirements correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    const serviceRequirement = {
      id: 'test-id',
      category: SERVICE_CATEGORIES.CATERING,
      type: 'Full Service Catering',
      description: 'Complete catering service',
      priority: 'high' as const,
      estimatedBudget: 5000,
      isRequired: true,
    };

    // Add requirement
    act(() => {
      result.current.addServiceRequirement(serviceRequirement);
    });

    // Get the actual ID that was generated
    const actualId = result.current.serviceRequirements[0].id;

    // Update requirement using the actual ID
    act(() => {
      result.current.updateServiceRequirement(actualId, {
        estimatedBudget: 6000,
        priority: 'medium',
      });
    });

    expect(result.current.serviceRequirements[0].estimatedBudget).toBe(6000);
    expect(result.current.serviceRequirements[0].priority).toBe('medium');
  });

  it('updates budget plan correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    const budgetPlan = {
      totalBudget: 10000,
      breakdown: {
        catering: { amount: 5000, percentage: 50 },
        photography: { amount: 3000, percentage: 30 },
      },
      recommendations: [],
    };

    act(() => {
      result.current.updateBudgetPlan(budgetPlan);
    });

    expect(result.current.budgetPlan).toEqual(budgetPlan);
  });

  it('validates step 1 correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Reset the store first
    act(() => {
      result.current.resetWizard();
    });

    // Empty data should fail validation
    let isValid = result.current.validateStep(1);
    expect(isValid).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);

    // Add required data
    act(() => {
      result.current.updateEventData({
        eventType: EVENT_TYPES.WEDDING,
        title: 'Test Wedding',
        eventDate: '2024-12-25T18:00:00Z',
        location: {
          address: 'Auckland, New Zealand',
          coordinates: { lat: -36.8485, lng: 174.7633 },
        },
      });
    });

    // Should pass validation now
    isValid = result.current.validateStep(1);
    expect(isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('validates step 2 correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Reset the store first
    act(() => {
      result.current.resetWizard();
    });

    // No service requirements should fail validation
    let isValid = result.current.validateStep(2);
    expect(isValid).toBe(false);
    expect(result.current.validationErrors).toContainEqual({
      field: 'serviceRequirements',
      message: 'At least one service requirement is needed',
    });

    // Add service requirement
    act(() => {
      result.current.addServiceRequirement({
        category: SERVICE_CATEGORIES.CATERING,
        type: 'Full Service Catering',
        priority: 'high',
        isRequired: true,
      });
    });

    // Should pass validation now
    isValid = result.current.validateStep(2);
    expect(isValid).toBe(true);
  });

  it('validates step 3 correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Reset the store first
    act(() => {
      result.current.resetWizard();
    });

    // No budget should fail validation
    let isValid = result.current.validateStep(3);
    expect(isValid).toBe(false);
    expect(result.current.validationErrors).toContainEqual({
      field: 'budgetPlan',
      message: 'Total budget must be greater than 0',
    });

    // Add budget
    act(() => {
      result.current.updateBudgetPlan({
        totalBudget: 10000,
        breakdown: {},
        recommendations: [],
      });
    });

    // Should pass validation now
    isValid = result.current.validateStep(3);
    expect(isValid).toBe(true);
  });

  it('saves draft correctly', async () => {
    const { result } = renderHook(() => useEventCreationStore());

    act(() => {
      result.current.updateEventData({
        title: 'Test Event',
        eventType: EVENT_TYPES.WEDDING,
      });
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/events/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventData: result.current.eventData,
        stepNumber: result.current.currentStep,
      }),
    });
  });

  it('loads templates correctly', async () => {
    const { result } = renderHook(() => useEventCreationStore());

    const mockTemplates = [
      { id: '1', name: 'Wedding Template', event_type: 'wedding' },
      { id: '2', name: 'Corporate Template', event_type: 'corporate' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true, templates: mockTemplates }),
    });

    await act(async () => {
      await result.current.loadTemplates();
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(global.fetch).toHaveBeenCalledWith('/api/events/templates?');
  });

  it('resets wizard correctly', () => {
    const { result } = renderHook(() => useEventCreationStore());

    // Modify state
    act(() => {
      result.current.updateEventData({ title: 'Test Event' });
      result.current.addServiceRequirement({
        category: SERVICE_CATEGORIES.CATERING,
        type: 'Test Service',
        priority: 'high',
        isRequired: true,
      });
      result.current.goToStep(3);
    });

    // Reset
    act(() => {
      result.current.resetWizard();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.eventData.title).toBe('');
    expect(result.current.serviceRequirements).toHaveLength(0);
    expect(result.current.budgetPlan.totalBudget).toBe(0);
  });
});
