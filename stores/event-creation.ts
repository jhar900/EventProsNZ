import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  EventCreationStore,
  EventFormData,
  ServiceRequirement,
  BudgetPlan,
  ContractorMatch,
  EventTemplate,
  EventDraft,
  ValidationError,
  EVENT_TYPES,
  SERVICE_CATEGORIES,
  PRIORITY_LEVELS,
} from '@/types/events';

interface EventCreationState {
  // Current wizard state
  currentStep: number;
  eventData: Partial<EventFormData>;
  serviceRequirements: ServiceRequirement[];
  budgetPlan: BudgetPlan;
  contractorMatches: ContractorMatch[];
  templates: EventTemplate[];
  drafts: EventDraft[];
  isDraft: boolean;
  isLoading: boolean;
  validationErrors: ValidationError[];

  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  updateEventData: (data: Partial<EventFormData>) => void;
  addServiceRequirement: (requirement: ServiceRequirement) => void;
  removeServiceRequirement: (id: string) => void;
  updateServiceRequirement: (
    id: string,
    requirement: Partial<ServiceRequirement>
  ) => void;
  updateBudgetPlan: (plan: BudgetPlan) => void;
  loadTemplates: (eventType?: string) => Promise<void>;
  loadDrafts: (userId?: string) => Promise<void>;
  saveDraft: (userId?: string) => Promise<void>;
  submitEvent: (userId?: string) => Promise<void>;
  updateEvent: (eventId: string, userId?: string) => Promise<void>;
  loadEventData: (eventId: string, userId?: string) => Promise<void>;
  validateStep: (step: number) => boolean;
  clearValidationErrors: () => void;
  resetWizard: () => void;
  loadTemplate: (template: EventTemplate) => void;
}

const initialEventData: Partial<EventFormData> = {
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
};

const initialBudgetPlan: BudgetPlan = {
  totalBudget: 0,
  breakdown: {},
  recommendations: [],
};

export const useEventCreationStore = create<EventCreationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      eventData: initialEventData,
      serviceRequirements: [],
      budgetPlan: initialBudgetPlan,
      contractorMatches: [],
      templates: [],
      drafts: [],
      isDraft: true,
      isLoading: false,
      validationErrors: [],

      // Actions
      nextStep: () => {
        const { currentStep, validateStep } = get();
        if (validateStep(currentStep) && currentStep < 4) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (step: number) => {
        if (step >= 1 && step <= 4) {
          set({ currentStep: step });
        }
      },

      updateEventData: (data: Partial<EventFormData>) => {
        set(state => ({
          eventData: { ...state.eventData, ...data },
        }));
      },

      addServiceRequirement: (requirement: ServiceRequirement) => {
        const newRequirement = {
          ...requirement,
          id:
            requirement.id ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set(state => ({
          serviceRequirements: [...state.serviceRequirements, newRequirement],
        }));
      },

      removeServiceRequirement: (id: string) => {
        set(state => ({
          serviceRequirements: state.serviceRequirements.filter(
            req => req.id !== id
          ),
        }));
      },

      updateServiceRequirement: (
        id: string,
        requirement: Partial<ServiceRequirement>
      ) => {
        set(state => ({
          serviceRequirements: state.serviceRequirements.map(req =>
            req.id === id ? { ...req, ...requirement } : req
          ),
        }));
      },

      updateBudgetPlan: (plan: BudgetPlan) => {
        set({ budgetPlan: plan });
      },

      loadTemplates: async (eventType?: string) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          if (eventType) params.append('eventType', eventType);

          const response = await fetch(`/api/events/templates?${params}`);
          const data = await response.json();

          if (data.success) {
            set({ templates: data.templates });
          } else {
          }
        } catch (error) {
        } finally {
          set({ isLoading: false });
        }
      },

      loadDrafts: async (userId?: string) => {
        set({ isLoading: true });
        try {
          const headers: HeadersInit = {};
          if (userId) {
            headers['x-user-id'] = userId;
          }
          const response = await fetch('/api/events/drafts', {
            headers,
            credentials: 'include',
          });
          const data = await response.json();

          if (data.success && data.draft) {
            set({
              drafts: [data.draft],
              eventData: data.draft.event_data,
              currentStep: data.draft.step_number,
            });
          }
        } catch (error) {
        } finally {
          set({ isLoading: false });
        }
      },

      saveDraft: async (userId?: string) => {
        const { eventData, currentStep } = get();
        set({ isLoading: true });

        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (userId) {
            headers['x-user-id'] = userId;
          }
          // Clean up eventData before sending - remove undefined values and ensure proper structure
          const cleanedEventData = {
            ...eventData,
            location:
              eventData.location &&
              (eventData.location.address || eventData.location.coordinates)
                ? {
                    address: eventData.location.address || null,
                    coordinates: eventData.location.coordinates || null,
                    placeId: eventData.location.placeId || null,
                    city: eventData.location.city || null,
                    region: eventData.location.region || null,
                    country: eventData.location.country || null,
                  }
                : null,
            serviceRequirements: eventData.serviceRequirements || null,
            budgetPlan: eventData.budgetPlan || null,
          };

          const response = await fetch('/api/events/drafts', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              eventData: cleanedEventData,
              stepNumber: currentStep,
            }),
          });

          let data;
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
          } catch (parseError) {
            console.error('Failed to parse draft response:', parseError);
            console.error('Response status:', response.status);
            // Don't throw for draft saves - they're not critical
            return;
          }

          if (!response.ok || !data.success) {
            console.warn(
              'Failed to save draft:',
              data.message || data.error || response.statusText
            );
            if (data.errors) {
              console.warn('Validation errors:', data.errors);
            }
            if (data.details) {
              console.warn('Error details:', data.details);
            }
          }
        } catch (error) {
        } finally {
          set({ isLoading: false });
        }
      },

      submitEvent: async (userId?: string) => {
        const { eventData, serviceRequirements, budgetPlan } = get();
        set({ isLoading: true });

        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // Add x-user-id header if provided
          if (userId) {
            headers['x-user-id'] = userId;
          }

          // Clean and prepare payload - only include defined values
          const payload: any = {
            eventType: eventData.eventType,
            title: eventData.title,
            eventDate: eventData.eventDate,
            location: {
              address: eventData.location?.address || '',
              coordinates: {
                lat: eventData.location?.coordinates?.lat ?? 0,
                lng: eventData.location?.coordinates?.lng ?? 0,
              },
            },
            serviceRequirements: serviceRequirements || [],
            budgetPlan: (() => {
              const plan = budgetPlan || {
                totalBudget: 0,
                breakdown: {},
                recommendations: [],
              };

              // Clean breakdown to ensure all values are objects with amount and percentage
              const cleanedBreakdown: Record<
                string,
                { amount: number; percentage: number }
              > = {};
              if (plan.breakdown && typeof plan.breakdown === 'object') {
                Object.entries(plan.breakdown).forEach(([key, value]) => {
                  if (
                    typeof value === 'object' &&
                    value !== null &&
                    'amount' in value &&
                    'percentage' in value
                  ) {
                    cleanedBreakdown[key] = {
                      amount:
                        typeof value.amount === 'number' ? value.amount : 0,
                      percentage:
                        typeof value.percentage === 'number'
                          ? value.percentage
                          : 0,
                    };
                  } else {
                    // Skip invalid entries
                    console.warn(
                      `Skipping invalid breakdown entry for key "${key}":`,
                      value
                    );
                  }
                });
              }

              return {
                totalBudget: plan.totalBudget || 0,
                breakdown: cleanedBreakdown,
                recommendations: plan.recommendations || [],
              };
            })(),
            isDraft: false,
          };

          // Add optional fields only if they have values
          if (eventData.description)
            payload.description = eventData.description;
          if (eventData.durationHours)
            payload.durationHours = eventData.durationHours;
          if (eventData.attendeeCount)
            payload.attendeeCount = eventData.attendeeCount;
          if (eventData.specialRequirements)
            payload.specialRequirements = eventData.specialRequirements;

          // Add optional location fields
          if (eventData.location?.placeId)
            payload.location.placeId = String(eventData.location.placeId);
          if (eventData.location?.city)
            payload.location.city = eventData.location.city;
          if (eventData.location?.region)
            payload.location.region = eventData.location.region;
          if (eventData.location?.country)
            payload.location.country = eventData.location.country;

          const cleanPayload = payload;

          // Validate required fields before sending
          if (!cleanPayload.eventType || cleanPayload.eventType === '') {
            throw new Error('Event type is required');
          }
          if (!cleanPayload.title || cleanPayload.title.trim() === '') {
            throw new Error('Event title is required');
          }
          if (!cleanPayload.eventDate) {
            throw new Error('Event date is required');
          }
          if (
            !cleanPayload.location?.address ||
            cleanPayload.location.address.trim() === ''
          ) {
            throw new Error('Event location is required');
          }
          if (
            cleanPayload.location.coordinates.lat === 0 &&
            cleanPayload.location.coordinates.lng === 0
          ) {
            throw new Error(
              'Please select a valid location from the suggestions'
            );
          }

          console.log(
            'Submitting event with payload:',
            JSON.stringify(cleanPayload, null, 2)
          );

          const response = await fetch('/api/events', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(cleanPayload),
          });

          let data;
          try {
            data = await response.json();
            console.log('Response data:', data);
            if (!response.ok && data.errors) {
              console.error('Validation errors from server:', data.errors);
            }
          } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            const text = await response
              .text()
              .catch(() => 'Unable to read response');
            console.error('Response text:', text);
            throw new Error(
              `Server error: ${response.status} ${response.statusText}`
            );
          }

          if (!response.ok) {
            console.error('Response not OK:', {
              status: response.status,
              statusText: response.statusText,
              data,
            });
            const errors = data.errors || [];
            if (data.error) {
              errors.push({
                field: 'general',
                message: data.error,
              });
            }
            if (data.details) {
              errors.push({
                field: 'general',
                message: `Details: ${data.details}`,
              });
            }
            if (data.hint) {
              errors.push({
                field: 'general',
                message: `Hint: ${data.hint}`,
              });
            }
            set({ validationErrors: errors });
            throw new Error(
              data.message || data.error || `Server error: ${response.status}`
            );
          }

          if (data.success) {
            // Reset wizard after successful submission
            get().resetWizard();
            return data;
          } else {
            const errors = data.errors || [];
            if (data.error) {
              errors.push({
                field: 'general',
                message: data.error,
              });
            }
            set({ validationErrors: errors });
            throw new Error(data.message || 'Failed to create event');
          }
        } catch (error) {
          console.error('Error in submitEvent:', error);
          if (error instanceof Error) {
            // If we don't have validation errors set, add the error message
            const currentErrors = get().validationErrors;
            if (currentErrors.length === 0) {
              set({
                validationErrors: [
                  {
                    field: 'general',
                    message: error.message || 'An unexpected error occurred',
                  },
                ],
              });
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      validateStep: (step: number) => {
        const { eventData, serviceRequirements, budgetPlan } = get();
        const errors: ValidationError[] = [];

        switch (step) {
          case 1:
            if (!eventData.eventType) {
              errors.push({
                field: 'eventType',
                message: 'Event type is required',
              });
            }
            if (!eventData.title?.trim()) {
              errors.push({
                field: 'title',
                message: 'Event title is required',
              });
            }
            if (!eventData.eventDate) {
              errors.push({
                field: 'eventDate',
                message: 'Event date is required',
              });
            }
            if (!eventData.location?.address?.trim()) {
              errors.push({
                field: 'location',
                message: 'Event location is required',
              });
            }
            break;

          case 2:
            if (serviceRequirements.length === 0) {
              errors.push({
                field: 'serviceRequirements',
                message: 'At least one service requirement is needed',
              });
            }
            break;

          case 3:
            if (!budgetPlan.totalBudget || budgetPlan.totalBudget <= 0) {
              errors.push({
                field: 'budgetPlan',
                message: 'Total budget must be greater than 0',
              });
            }
            break;

          case 4:
            // Final validation - all previous steps should be valid
            const step1Valid = get().validateStep(1);
            const step2Valid = get().validateStep(2);
            const step3Valid = get().validateStep(3);

            if (!step1Valid || !step2Valid || !step3Valid) {
              errors.push({
                field: 'general',
                message: 'Please complete all required fields',
              });
            }
            break;
        }

        set({ validationErrors: errors });
        return errors.length === 0;
      },

      clearValidationErrors: () => {
        set({ validationErrors: [] });
      },

      resetWizard: () => {
        set({
          currentStep: 1,
          eventData: initialEventData,
          serviceRequirements: [],
          budgetPlan: initialBudgetPlan,
          contractorMatches: [],
          isDraft: true,
          validationErrors: [],
        });
      },

      loadTemplate: (template: EventTemplate) => {
        const templateData = template.template_data;

        set(state => ({
          eventData: {
            ...state.eventData,
            eventType: template.event_type,
            serviceRequirements: templateData.serviceRequirements || [],
            budgetPlan: {
              totalBudget: 0,
              breakdown: templateData.budgetBreakdown || {},
              recommendations: [],
            },
          },
          serviceRequirements: templateData.serviceRequirements || [],
          budgetPlan: {
            totalBudget: 0,
            breakdown: templateData.budgetBreakdown || {},
            recommendations: [],
          },
        }));
      },

      loadEventData: async (eventId: string, userId?: string) => {
        set({ isLoading: true });
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (userId) {
            headers['x-user-id'] = userId;
          }

          const response = await fetch(`/api/events/${eventId}`, {
            headers,
            credentials: 'include',
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load event');
          }

          const event = data.event;

          // Transform event data to wizard format
          const eventData: Partial<EventFormData> = {
            eventType: event.event_type || '',
            title: event.title || '',
            description: event.description || '',
            eventDate: event.event_date
              ? new Date(event.event_date).toISOString()
              : '',
            durationHours: event.duration_hours || undefined,
            attendeeCount: event.attendee_count || undefined,
            location: event.location
              ? {
                  address: event.location,
                  coordinates: event.location_data?.coordinates || {
                    lat: 0,
                    lng: 0,
                  },
                  placeId: event.location_data?.placeId || null,
                  city: event.location_data?.city || null,
                  region: event.location_data?.region || null,
                  country: event.location_data?.country || null,
                }
              : {
                  address: '',
                  coordinates: { lat: 0, lng: 0 },
                },
            specialRequirements:
              event.requirements || event.special_requirements || '',
            serviceRequirements: [],
            budgetPlan: {
              totalBudget: event.budget || event.budget_total || 0,
              breakdown: {},
              recommendations: [],
            },
            isDraft: event.status === 'draft',
          };

          // Transform service requirements
          const serviceRequirements: ServiceRequirement[] = (
            event.event_service_requirements || []
          ).map((req: any) => ({
            id: req.id,
            category: req.category,
            type: req.type,
            description: req.description || '',
            priority: req.priority || 'medium',
            estimatedBudget: req.estimated_budget || undefined,
            isRequired: req.is_required !== false,
          }));

          set({
            eventData,
            serviceRequirements,
            budgetPlan: eventData.budgetPlan || initialBudgetPlan,
            currentStep: 1,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading event data:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateEvent: async (eventId: string, userId?: string) => {
        const { eventData, serviceRequirements, budgetPlan } = get();
        set({ isLoading: true });

        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (userId) {
            headers['x-user-id'] = userId;
          }

          // Prepare payload similar to submitEvent but for update
          const payload: any = {
            eventType: eventData.eventType,
            title: eventData.title,
            eventDate: eventData.eventDate,
            location: {
              address: eventData.location?.address || '',
              coordinates: {
                lat: eventData.location?.coordinates?.lat ?? 0,
                lng: eventData.location?.coordinates?.lng ?? 0,
              },
            },
            serviceRequirements: serviceRequirements || [],
            budgetPlan: budgetPlan || {
              totalBudget: 0,
              breakdown: {},
              recommendations: [],
            },
          };

          if (eventData.description !== undefined) {
            payload.description = eventData.description;
          }
          if (eventData.durationHours !== undefined) {
            payload.durationHours = eventData.durationHours;
          }
          if (eventData.attendeeCount !== undefined) {
            payload.attendeeCount = eventData.attendeeCount;
          }
          if (eventData.specialRequirements !== undefined) {
            payload.specialRequirements = eventData.specialRequirements;
          }

          const response = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (!response.ok) {
            const errors = data.errors || [];
            if (data.error) {
              errors.push({
                field: 'general',
                message: data.error,
              });
            }
            set({ validationErrors: errors });
            throw new Error(data.message || 'Failed to update event');
          }

          if (data.success) {
            // Reset wizard after successful update
            get().resetWizard();
            // Return in the same format as submitEvent for consistency
            return {
              event: data.event,
              success: true,
            };
          } else {
            const errors = data.errors || [];
            if (data.error) {
              errors.push({
                field: 'general',
                message: data.error,
              });
            }
            set({ validationErrors: errors });
            throw new Error(data.message || 'Failed to update event');
          }
        } catch (error) {
          console.error('Error in updateEvent:', error);
          if (error instanceof Error) {
            const currentErrors = get().validationErrors;
            if (currentErrors.length === 0) {
              set({
                validationErrors: [
                  {
                    field: 'general',
                    message: error.message || 'An unexpected error occurred',
                  },
                ],
              });
            }
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'event-creation-store',
    }
  )
);

// Selectors for common use cases
export const useEventCreationStep = () =>
  useEventCreationStore(state => state.currentStep);
export const useEventData = () =>
  useEventCreationStore(state => state.eventData);
export const useServiceRequirements = () =>
  useEventCreationStore(state => state.serviceRequirements);
export const useBudgetPlan = () =>
  useEventCreationStore(state => state.budgetPlan);
export const useValidationErrors = () =>
  useEventCreationStore(state => state.validationErrors);
export const useIsLoading = () =>
  useEventCreationStore(state => state.isLoading);
