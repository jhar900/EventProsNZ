import { Database } from './database';

// Base types from database
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type EventTemplate =
  Database['public']['Tables']['event_templates']['Row'];
export type EventTemplateInsert =
  Database['public']['Tables']['event_templates']['Insert'];
export type EventTemplateUpdate =
  Database['public']['Tables']['event_templates']['Update'];

export type EventVersion =
  Database['public']['Tables']['event_versions']['Row'];
export type EventVersionInsert =
  Database['public']['Tables']['event_versions']['Insert'];

export type EventDraft = Database['public']['Tables']['event_drafts']['Row'];
export type EventDraftInsert =
  Database['public']['Tables']['event_drafts']['Insert'];
export type EventDraftUpdate =
  Database['public']['Tables']['event_drafts']['Update'];

export type EventServiceRequirement =
  Database['public']['Tables']['event_service_requirements']['Row'];
export type EventServiceRequirementInsert =
  Database['public']['Tables']['event_service_requirements']['Insert'];
export type EventServiceRequirementUpdate =
  Database['public']['Tables']['event_service_requirements']['Update'];

export type EventContractorMatch =
  Database['public']['Tables']['event_contractor_matches']['Row'];
export type EventContractorMatchInsert =
  Database['public']['Tables']['event_contractor_matches']['Insert'];
export type EventContractorMatchUpdate =
  Database['public']['Tables']['event_contractor_matches']['Update'];

export type EventNotification =
  Database['public']['Tables']['event_notifications']['Row'];
export type EventNotificationInsert =
  Database['public']['Tables']['event_notifications']['Insert'];
export type EventNotificationUpdate =
  Database['public']['Tables']['event_notifications']['Update'];

// Extended types for the wizard
export interface EventCreationWizardState {
  currentStep: number;
  eventData: Partial<Event>;
  serviceRequirements: ServiceRequirement[];
  budgetPlan: BudgetPlan;
  contractorMatches: ContractorMatch[];
  isDraft: boolean;
  validationErrors: ValidationError[];
  nextStep: () => void;
  previousStep: () => void;
  updateEventData: (data: Partial<Event>) => void;
  saveDraft: () => Promise<void>;
  submitEvent: () => Promise<void>;
}

export interface ServiceRequirement {
  id?: string;
  category: string;
  type: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedBudget?: number;
  isRequired: boolean;
}

export interface BudgetPlan {
  totalBudget: number;
  breakdown: {
    [category: string]: {
      amount: number;
      percentage: number;
    };
  };
  recommendations: BudgetRecommendation[];
}

export interface BudgetRecommendation {
  category: string;
  suggestedAmount: number;
  reason: string;
  confidence: number; // 0-1
}

export interface ContractorMatch {
  contractorId: string;
  contractorName: string;
  serviceCategory: string;
  matchScore: number;
  estimatedPrice: {
    min: number;
    max: number;
  };
  availability: boolean;
  rating: number;
  reviewCount: number;
}

export interface ValidationError {
  field: string;
  message: string;
  step?: number;
}

export interface EventLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  city?: string;
  region?: string;
  country?: string;
  toBeConfirmed?: boolean;
}

export interface EventFormData {
  // Step 1: Event Basics
  eventType: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  additionalDates?: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
  }>;
  durationHours?: number;
  attendeeCount?: number;
  location: EventLocation;
  specialRequirements?: string;
  logoUrl?: string;

  // Step 2: Service Requirements
  serviceRequirements: ServiceRequirement[];

  // Step 3: Budget Planning
  budgetPlan: BudgetPlan;

  // Step 4: Review
  isDraft: boolean;
}

export interface EventTemplateData {
  serviceRequirements: ServiceRequirement[];
  budgetBreakdown: {
    [category: string]: number; // percentage
  };
  defaultSettings?: {
    durationHours?: number;
    attendeeCount?: number;
  };
}

export interface EventCreationResponse {
  event: Event;
  success: boolean;
  message?: string;
  errors?: ValidationError[];
}

export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventTemplateResponse {
  templates: EventTemplate[];
  success: boolean;
}

export interface EventDraftResponse {
  draft: EventDraft;
  success: boolean;
}

export interface EventVersionResponse {
  versions: EventVersion[];
  success: boolean;
}

export interface EventMatchingResponse {
  matches: ContractorMatch[];
  success: boolean;
}

export interface EventNotificationResponse {
  notifications: EventNotification[];
  success: boolean;
}

// Wizard step types
export type WizardStep = 1 | 2 | 3 | 4;

export interface StepValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface EventCreationStore {
  currentStep: number;
  eventData: Partial<Event>;
  serviceRequirements: ServiceRequirement[];
  budgetPlan: BudgetPlan;
  contractorMatches: ContractorMatch[];
  templates: EventTemplate[];
  drafts: EventDraft[];
  isDraft: boolean;
  isLoading: boolean;
  validationErrors: ValidationError[];
  nextStep: () => void;
  previousStep: () => void;
  updateEventData: (data: Partial<Event>) => void;
  addServiceRequirement: (requirement: ServiceRequirement) => void;
  removeServiceRequirement: (id: string) => void;
  updateBudgetPlan: (plan: BudgetPlan) => void;
  loadTemplates: (eventType?: string) => Promise<void>;
  loadDrafts: () => Promise<void>;
  saveDraft: () => Promise<void>;
  submitEvent: () => Promise<void>;
  validateStep: (step: number) => boolean;
}

// API request/response types
export interface CreateEventRequest {
  eventType: string;
  title: string;
  description?: string;
  eventDate: string;
  durationHours?: number;
  attendeeCount?: number;
  location: EventLocation;
  specialRequirements?: string;
  logoUrl?: string;
  serviceRequirements: ServiceRequirement[];
  budgetPlan: BudgetPlan;
  isDraft?: boolean;
}

export interface UpdateEventRequest {
  eventType?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  durationHours?: number;
  attendeeCount?: number;
  location?: EventLocation;
  specialRequirements?: string;
  logoUrl?: string;
  serviceRequirements?: ServiceRequirement[];
  budgetPlan?: BudgetPlan;
  status?: Event['status'];
}

export interface GetEventsRequest {
  userId?: string;
  status?: Event['status'];
  page?: number;
  limit?: number;
  eventType?: string;
}

export interface GetEventTemplatesRequest {
  eventType?: string;
  isPublic?: boolean;
}

export interface CreateEventTemplateRequest {
  name: string;
  eventType: string;
  templateData: EventTemplateData;
  isPublic?: boolean;
}

export interface SaveEventDraftRequest {
  eventData: Partial<EventFormData>;
  stepNumber: number;
}

export interface GetEventVersionsRequest {
  eventId: string;
}

export interface GetEventMatchingRequest {
  eventId: string;
  serviceCategory?: string;
}

export interface GetEventNotificationsRequest {
  eventId?: string;
  contractorId?: string;
  isRead?: boolean;
}

// Event types enum
export const EVENT_TYPES = {
  WEDDING: 'wedding',
  CORPORATE: 'corporate',
  PARTY: 'party',
  CONFERENCE: 'conference',
  SEMINAR: 'seminar',
  WORKSHOP: 'workshop',
  EXHIBITION: 'exhibition',
  CONCERT: 'concert',
  FESTIVAL: 'festival',
  SPORTS: 'sports',
  CHARITY: 'charity',
  OTHER: 'other',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Service categories enum
export const SERVICE_CATEGORIES = {
  CATERING: 'catering',
  PHOTOGRAPHY: 'photography',
  MUSIC: 'music',
  DECORATIONS: 'decorations',
  VENUE: 'venue',
  ENTERTAINMENT: 'entertainment',
  TRANSPORTATION: 'transportation',
  AV_EQUIPMENT: 'av_equipment',
  SECURITY: 'security',
  CLEANING: 'cleaning',
  FLOWERS: 'flowers',
  CAKE: 'cake',
  OTHER: 'other',
} as const;

export type ServiceCategory =
  (typeof SERVICE_CATEGORIES)[keyof typeof SERVICE_CATEGORIES];

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type PriorityLevel =
  (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS];

// Event status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
