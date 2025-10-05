import { InquiryData } from '@/types/inquiries';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  suggestions: Array<{
    field: string;
    message: string;
  }>;
}

export class ValidationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inquiries/validation';
  }

  // Validate inquiry data
  async validateInquiry(inquiryData: InquiryData): Promise<ValidationResult> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate inquiry');
    }

    return await response.json();
  }

  // Validate contractor selection
  async validateContractor(contractorId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/contractor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractor_id: contractorId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate contractor');
    }

    return await response.json();
  }

  // Validate event details
  async validateEventDetails(eventDetails: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/event-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_details: eventDetails }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate event details');
    }

    return await response.json();
  }

  // Validate message content
  async validateMessage(message: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    wordCount: number;
    readabilityScore: number;
  }> {
    const response = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate message');
    }

    return await response.json();
  }

  // Validate budget information
  async validateBudget(
    budget: number,
    eventType: string,
    attendeeCount?: number
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    recommendedRange: {
      min: number;
      max: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        budget,
        event_type: eventType,
        attendee_count: attendeeCount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate budget');
    }

    return await response.json();
  }

  // Validate service requirements
  async validateServiceRequirements(serviceRequirements: any[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/service-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service_requirements: serviceRequirements }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to validate service requirements'
      );
    }

    return await response.json();
  }

  // Validate date and time
  async validateDateTime(
    eventDate: string,
    durationHours?: number
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/datetime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_date: eventDate,
        duration_hours: durationHours,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate date and time');
    }

    return await response.json();
  }

  // Validate location
  async validateLocation(location: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    coordinates?: {
      lat: number;
      lng: number;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate location');
    }

    return await response.json();
  }

  // Get validation rules
  async getValidationRules(): Promise<{
    fieldRules: Record<string, any>;
    businessRules: Record<string, any>;
    customRules: Record<string, any>;
  }> {
    const response = await fetch(`${this.baseUrl}/rules`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch validation rules');
    }

    return await response.json();
  }

  // Validate complete inquiry
  async validateCompleteInquiry(inquiryData: InquiryData): Promise<{
    isValid: boolean;
    score: number;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    warnings: Array<{
      field: string;
      message: string;
    }>;
    suggestions: Array<{
      field: string;
      message: string;
    }>;
    recommendations: Array<{
      field: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to validate complete inquiry'
      );
    }

    return await response.json();
  }
}

// Export singleton instance
export const validationService = new ValidationService();
