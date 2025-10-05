import { Database } from './database';

// Base types from database
export type Inquiry = Database['public']['Tables']['inquiries']['Row'];
export type InquiryInsert = Database['public']['Tables']['inquiries']['Insert'];
export type InquiryUpdate = Database['public']['Tables']['inquiries']['Update'];

// Extended inquiry types
export interface InquiryData {
  contractor_id: string;
  event_id?: string;
  inquiry_type: InquiryType;
  subject: string;
  message: string;
  event_details?: EventDetails;
  priority?: InquiryPriority;
}

export interface EventDetails {
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  duration_hours?: number;
  attendee_count?: number;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  budget_total?: number;
  special_requirements?: string;
  service_requirements?: ServiceRequirement[];
}

export interface ServiceRequirement {
  category: string;
  type: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimated_budget?: number;
  is_required: boolean;
}

export interface InquiryResponse {
  id: string;
  inquiry_id: string;
  responder_id: string;
  response_type: ResponseType;
  message: string;
  attachments?: any[];
  is_template: boolean;
  created_at: string;
}

export interface InquiryTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_content: string;
  template_type: TemplateType;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface InquiryNotification {
  id: string;
  inquiry_id: string;
  user_id: string;
  notification_type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface InquiryAnalytics {
  total_inquiries: number;
  status_counts: {
    sent: number;
    viewed: number;
    responded: number;
    quoted: number;
  };
  response_time_avg: number;
  conversion_rate: number;
  popular_services: Array<{
    service: string;
    count: number;
  }>;
}

export interface InquiryFilters {
  user_id?: string;
  status?: InquiryStatus;
  inquiry_type?: InquiryType;
  priority?: InquiryPriority;
  date_from?: string;
  date_to?: string;
  contractor_id?: string;
  event_manager_id?: string;
  page?: number;
  limit?: number;
}

// Enums
export const INQUIRY_TYPES = {
  GENERAL: 'general',
  QUOTE_REQUEST: 'quote_request',
  AVAILABILITY: 'availability',
  SERVICE_INQUIRY: 'service_inquiry',
  FOLLOW_UP: 'follow_up',
} as const;

export type InquiryType = (typeof INQUIRY_TYPES)[keyof typeof INQUIRY_TYPES];

export const INQUIRY_STATUS = {
  SENT: 'sent',
  VIEWED: 'viewed',
  RESPONDED: 'responded',
  QUOTED: 'quoted',
  CLOSED: 'closed',
} as const;

export type InquiryStatus =
  (typeof INQUIRY_STATUS)[keyof typeof INQUIRY_STATUS];

export const INQUIRY_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type InquiryPriority =
  (typeof INQUIRY_PRIORITY)[keyof typeof INQUIRY_PRIORITY];

export const RESPONSE_TYPES = {
  REPLY: 'reply',
  QUOTE: 'quote',
  DECLINE: 'decline',
  FOLLOW_UP: 'follow_up',
  CLARIFICATION: 'clarification',
} as const;

export type ResponseType = (typeof RESPONSE_TYPES)[keyof typeof RESPONSE_TYPES];

export const TEMPLATE_TYPES = {
  GENERAL: 'general',
  QUOTE_RESPONSE: 'quote_response',
  DECLINE_RESPONSE: 'decline_response',
  FOLLOW_UP: 'follow_up',
  WELCOME: 'welcome',
} as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[keyof typeof TEMPLATE_TYPES];

export const NOTIFICATION_TYPES = {
  NEW_INQUIRY: 'new_inquiry',
  INQUIRY_RESPONSE: 'inquiry_response',
  INQUIRY_STATUS_UPDATE: 'inquiry_status_update',
  REMINDER: 'reminder',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// API Request/Response types
export interface CreateInquiryRequest {
  contractor_id: string;
  event_id?: string;
  inquiry_type: InquiryType;
  subject: string;
  message: string;
  event_details?: EventDetails;
  priority?: InquiryPriority;
}

export interface UpdateInquiryRequest {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  subject?: string;
  message?: string;
}

export interface GetInquiriesRequest {
  user_id?: string;
  status?: InquiryStatus;
  inquiry_type?: InquiryType;
  priority?: InquiryPriority;
  page?: number;
  limit?: number;
}

export interface SendInquiryRequest {
  contractor_id: string;
  event_id?: string;
  inquiry_type: InquiryType;
  subject: string;
  message: string;
  event_details?: EventDetails;
  priority?: InquiryPriority;
}

export interface BulkSendInquiryRequest {
  contractor_ids: string[];
  inquiry_data: InquiryData;
}

export interface UpdateInquiryStatusRequest {
  status: InquiryStatus;
  reason?: string;
}

export interface CreateInquiryTemplateRequest {
  template_name: string;
  template_content: string;
  template_type: TemplateType;
  is_public?: boolean;
}

export interface UpdateInquiryTemplateRequest {
  template_name?: string;
  template_content?: string;
  is_public?: boolean;
}

export interface GetInquiryTemplatesRequest {
  user_id?: string;
  template_type?: TemplateType;
  is_public?: boolean;
}

export interface SendInquiryNotificationRequest {
  inquiry_id: string;
  notification_type: NotificationType;
}

export interface GetInquiryHistoryRequest {
  user_id: string;
  date_from?: string;
  date_to?: string;
  status?: InquiryStatus;
}

export interface ExportInquiriesRequest {
  user_id: string;
  format?: 'csv' | 'xlsx' | 'pdf';
  date_from?: string;
  date_to?: string;
  filters?: InquiryFilters;
}

// Response types
export interface InquiryResponse {
  inquiry: Inquiry;
  success: boolean;
  message?: string;
}

export interface InquiryListResponse {
  inquiries: Inquiry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface InquiryDetailResponse {
  inquiry: Inquiry;
  responses: InquiryResponse[];
  success: boolean;
}

export interface InquiryStatusResponse {
  inquiries: Inquiry[];
  status_counts: {
    sent: number;
    viewed: number;
    responded: number;
    quoted: number;
  };
  success: boolean;
}

export interface InquiryNotificationResponse {
  notification: InquiryNotification;
  success: boolean;
}

export interface InquiryNotificationListResponse {
  notifications: InquiryNotification[];
  success: boolean;
}

export interface InquiryHistoryResponse {
  inquiries: Inquiry[];
  analytics: InquiryAnalytics;
  success: boolean;
}

export interface InquiryTemplateResponse {
  template: InquiryTemplate;
  success: boolean;
}

export interface InquiryTemplateListResponse {
  templates: InquiryTemplate[];
  success: boolean;
}

export interface InquiryExportResponse {
  export_data: Blob;
  success: boolean;
  filename: string;
}

// Store types
export interface InquiryStore {
  inquiries: Inquiry[];
  currentInquiry: Inquiry | null;
  templates: InquiryTemplate[];
  notifications: InquiryNotification[];
  filters: InquiryFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  createInquiry: (inquiryData: InquiryData) => Promise<void>;
  sendInquiry: (inquiryId: string) => Promise<void>;
  updateInquiryStatus: (
    inquiryId: string,
    status: InquiryStatus
  ) => Promise<void>;
  loadInquiries: (filters?: InquiryFilters) => Promise<void>;
  loadTemplates: (userId: string) => Promise<void>;
  createTemplate: (templateData: CreateInquiryTemplateRequest) => Promise<void>;
  applyTemplate: (
    templateId: string,
    inquiryData: InquiryData
  ) => Promise<InquiryData>;
  sendNotification: (
    inquiryId: string,
    notificationType: NotificationType
  ) => Promise<void>;
  exportInquiries: (format: string, filters?: InquiryFilters) => Promise<Blob>;
  clearError: () => void;
}
