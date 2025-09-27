import { z } from 'zod';

/**
 * Comprehensive input validation schemas for event management
 * Provides protection against SQL injection and malicious input
 */

// Event status enum
export const EventStatusSchema = z.enum([
  'draft',
  'planning',
  'confirmed',
  'completed',
  'cancelled',
]);

// Milestone status enum
export const MilestoneStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

// Event type enum
export const EventTypeSchema = z.enum([
  'wedding',
  'corporate',
  'party',
  'conference',
  'birthday',
  'anniversary',
  'other',
]);

// User role enum
export const UserRoleSchema = z.enum(['event_manager', 'contractor', 'admin']);

// Base event validation schema
export const EventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters'),

  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional(),

  event_type: EventTypeSchema,

  event_date: z
    .string()
    .datetime('Invalid date format')
    .refine(date => {
      const eventDate = new Date(date);
      const now = new Date();
      return eventDate > now;
    }, 'Event date must be in the future'),

  duration_hours: z
    .number()
    .min(0.5, 'Duration must be at least 30 minutes')
    .max(48, 'Duration cannot exceed 48 hours')
    .positive('Duration must be positive'),

  attendee_count: z
    .number()
    .int('Attendee count must be an integer')
    .min(1, 'Must have at least 1 attendee')
    .max(10000, 'Attendee count cannot exceed 10,000'),

  location: z.object({
    address: z
      .string()
      .min(1, 'Address is required')
      .max(500, 'Address must be less than 500 characters')
      .trim(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(100, 'City must be less than 100 characters')
      .trim(),
    region: z
      .string()
      .max(100, 'Region must be less than 100 characters')
      .trim()
      .optional(),
    country: z
      .string()
      .min(1, 'Country is required')
      .max(100, 'Country must be less than 100 characters')
      .trim(),
    coordinates: z
      .object({
        lat: z
          .number()
          .min(-90, 'Latitude must be between -90 and 90')
          .max(90, 'Latitude must be between -90 and 90'),
        lng: z
          .number()
          .min(-180, 'Longitude must be between -180 and 180')
          .max(180, 'Longitude must be between -180 and 180'),
      })
      .optional(),
  }),

  budget_total: z
    .number()
    .min(0, 'Budget must be positive')
    .max(1000000, 'Budget cannot exceed $1,000,000')
    .optional(),

  status: EventStatusSchema.default('draft'),
});

// Event status update schema
export const EventStatusUpdateSchema = z.object({
  status: EventStatusSchema,
  reason: z
    .string()
    .max(500, 'Reason must be less than 500 characters')
    .trim()
    .optional(),
});

// Event version schema
export const EventVersionSchema = z.object({
  changes: z.record(z.any()).refine(changes => {
    // Validate that changes object is not empty
    return Object.keys(changes).length > 0;
  }, 'Changes object cannot be empty'),

  reason: z
    .string()
    .max(500, 'Reason must be less than 500 characters')
    .trim()
    .optional(),
});

// Event milestone schema
export const EventMilestoneSchema = z.object({
  milestone_name: z
    .string()
    .min(1, 'Milestone name is required')
    .max(255, 'Milestone name must be less than 255 characters')
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?()]+$/,
      'Milestone name contains invalid characters'
    ),

  milestone_date: z.string().datetime('Invalid date format'),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),

  status: MilestoneStatusSchema.default('pending'),
});

// Event notification schema
export const EventNotificationSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID format'),

  notification_type: z
    .string()
    .min(1, 'Notification type is required')
    .max(100, 'Notification type must be less than 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Notification type contains invalid characters'),

  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?()@#$%&*+=<>:;'"()]+$/,
      'Message contains invalid characters'
    ),
});

// Event duplication schema
export const EventDuplicationSchema = z.object({
  new_title: z
    .string()
    .min(1, 'New title is required')
    .max(255, 'New title must be less than 255 characters')
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?()]+$/,
      'New title contains invalid characters'
    ),

  new_date: z
    .string()
    .datetime('Invalid date format')
    .refine(date => {
      const eventDate = new Date(date);
      const now = new Date();
      return eventDate > now;
    }, 'New event date must be in the future'),

  changes: z.record(z.any()).optional(),
});

// Event completion schema
export const EventCompletionSchema = z.object({
  completion_data: z.record(z.any()).refine(data => {
    return Object.keys(data).length > 0;
  }, 'Completion data cannot be empty'),

  feedback: z
    .string()
    .max(2000, 'Feedback must be less than 2000 characters')
    .trim()
    .optional(),
});

// Event feedback schema
export const EventFeedbackSchema = z.object({
  contractor_id: z.string().uuid('Invalid contractor ID format'),

  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),

  feedback: z
    .string()
    .max(2000, 'Feedback must be less than 2000 characters')
    .trim()
    .optional(),
});

// Dashboard query schema
export const DashboardQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),

  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),

  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
});

// Search query schema
export const SearchQuerySchema = z.object({
  q: z
    .string()
    .max(255, 'Search query must be less than 255 characters')
    .trim()
    .optional(),

  status: EventStatusSchema.optional(),

  event_type: EventTypeSchema.optional(),

  date_from: z.string().datetime('Invalid date format').optional(),

  date_to: z.string().datetime('Invalid date format').optional(),

  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
});

// Input sanitization utilities
export class InputSanitizer {
  /**
   * Sanitize text input to prevent XSS and injection attacks
   * @param input - The input string to sanitize
   * @returns Sanitized string
   */
  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/['"]/g, '') // Remove quotes that could break SQL
      .replace(/[;\\]/g, '') // Remove semicolons and backslashes
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Sanitize HTML content
   * @param input - The HTML string to sanitize
   * @returns Sanitized HTML string
   */
  static sanitizeHtml(input: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, ''); // Remove data: protocol
  }

  /**
   * Validate and sanitize email address
   * @param email - The email to validate
   * @returns Sanitized email or null if invalid
   */
  static sanitizeEmail(email: string): string | null {
    const sanitized = this.sanitizeText(email).toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailRegex.test(sanitized)) {
      return sanitized;
    }

    return null;
  }

  /**
   * Validate and sanitize URL
   * @param url - The URL to validate
   * @returns Sanitized URL or null if invalid
   */
  static sanitizeUrl(url: string): string | null {
    const sanitized = this.sanitizeText(url);

    try {
      const urlObj = new URL(sanitized);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }

      return urlObj.toString();
    } catch {
      return null;
    }
  }
}

/**
 * Validation error formatter
 * @param error - Zod error object
 * @returns Formatted error messages
 */
export function formatValidationErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
  code: string;
}> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Generic validation wrapper for API endpoints
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | {
      success: false;
      errors: Array<{ field: string; message: string; code: string }>;
    } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatValidationErrors(error),
      };
    }
    throw error;
  }
}
