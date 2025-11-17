import { z } from 'zod';

// Phone number validation for New Zealand
const nzPhoneRegex = /^(\+64|0)[2-9]\d{7,9}$/;

// Email validation
const emailSchema = z.string().email('Invalid email format');

// Phone validation for New Zealand
export const phoneSchema = z
  .string()
  .min(8, 'Phone number must be at least 8 characters')
  .max(15, 'Phone number must be less than 15 characters')
  .regex(nzPhoneRegex, 'Please enter a valid New Zealand phone number');

// Address validation
export const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(200, 'Address must be less than 200 characters');

// Personal information validation
export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: phoneSchema,
  address: addressSchema,
});

// Business information validation
export const businessInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Your position/role is required'),
  business_address: addressSchema,
  nzbn: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required'),
  social_links: z
    .object({
      website: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});

// Contact information validation
export const contactInfoSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
});

export class ValidationService {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    try {
      emailSchema.parse(email);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0].message };
      }
      return { isValid: false, error: 'Invalid email format' };
    }
  }

  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    try {
      phoneSchema.parse(phone);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0].message };
      }
      return { isValid: false, error: 'Invalid phone number format' };
    }
  }

  static validateAddress(address: string): {
    isValid: boolean;
    error?: string;
  } {
    try {
      addressSchema.parse(address);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0].message };
      }
      return { isValid: false, error: 'Invalid address format' };
    }
  }

  static validatePersonalInfo(data: any): {
    isValid: boolean;
    errors?: Record<string, string>;
  } {
    try {
      personalInfoSchema.parse(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  static validateBusinessInfo(data: any): {
    isValid: boolean;
    errors?: Record<string, string>;
  } {
    try {
      businessInfoSchema.parse(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  static validateContactInfo(data: any): {
    isValid: boolean;
    errors?: Record<string, string>;
  } {
    try {
      contactInfoSchema.parse(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format New Zealand phone numbers
    if (cleaned.startsWith('64')) {
      // International format: +64 21 123 4567
      return `+64 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.startsWith('0')) {
      // National format: 021 123 4567
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return phone; // Return original if format is not recognized
  }

  static validateNZBN(nzbn: string): { isValid: boolean; error?: string } {
    // NZBN is 13 digits
    const cleaned = nzbn.replace(/\D/g, '');

    if (cleaned.length !== 13) {
      return { isValid: false, error: 'NZBN must be 13 digits' };
    }

    // Basic NZBN validation (simplified)
    if (!/^\d{13}$/.test(cleaned)) {
      return { isValid: false, error: 'NZBN must contain only digits' };
    }

    return { isValid: true };
  }
}
