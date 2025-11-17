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
          const response = await fetch('/api/events/drafts', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              eventData,
              stepNumber: currentStep,
            }),
          });

          const data = await response.json();

          if (!data.success) {
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

          const response = await fetch('/api/events', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              ...eventData,
              serviceRequirements,
              budgetPlan,
              isDraft: false,
            }),
          });

          const data = await response.json();

          if (data.success) {
            // Reset wizard after successful submission
            get().resetWizard();
            return data;
          } else {
            set({ validationErrors: data.errors || [] });
            throw new Error(data.message || 'Failed to create event');
          }
        } catch (error) {
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
