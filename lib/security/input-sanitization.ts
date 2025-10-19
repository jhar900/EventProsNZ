import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  stripHtml?: boolean;
  allowUrls?: boolean;
}

export class InputSanitizer {
  private options: SanitizationOptions;

  constructor(options: SanitizationOptions = {}) {
    this.options = {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: {
        a: ['href', 'title'],
        img: ['src', 'alt', 'title'],
      },
      maxLength: 10000,
      stripHtml: false,
      allowUrls: true,
      ...options,
    };
  }

  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Trim whitespace
    let sanitized = input.trim();

    // Check length
    if (this.options.maxLength && sanitized.length > this.options.maxLength) {
      sanitized = sanitized.substring(0, this.options.maxLength);
    }

    // Strip HTML if requested
    if (this.options.stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Sanitize HTML
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: this.options.allowedTags,
        ALLOWED_ATTR: this.options.allowedAttributes,
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      });
    }

    // Remove potential XSS vectors
    sanitized = this.removeXSSVectors(sanitized);

    // Handle URLs
    if (!this.options.allowUrls) {
      sanitized = this.removeUrls(sanitized);
    }

    return sanitized;
  }

  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const sanitizedKey = this.sanitizeString(key);
        // Sanitize value
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private removeXSSVectors(input: string): string {
    return input
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload/gi, '')
      .replace(/onerror/gi, '')
      .replace(/onclick/gi, '')
      .replace(/onmouseover/gi, '')
      .replace(/onfocus/gi, '')
      .replace(/onblur/gi, '')
      .replace(/onchange/gi, '')
      .replace(/onsubmit/gi, '')
      .replace(/<script/gi, '&lt;script')
      .replace(/<\/script>/gi, '&lt;/script&gt;')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<\/iframe>/gi, '&lt;/iframe&gt;')
      .replace(/<object/gi, '&lt;object')
      .replace(/<\/object>/gi, '&lt;/object&gt;')
      .replace(/<embed/gi, '&lt;embed')
      .replace(/<\/embed>/gi, '&lt;/embed&gt;');
  }

  private removeUrls(input: string): string {
    return input.replace(/https?:\/\/[^\s]+/g, '[URL]');
  }
}

// Predefined sanitizers for different data types
export const textSanitizer = new InputSanitizer({
  stripHtml: true,
  maxLength: 1000,
  allowUrls: false,
});

export const htmlSanitizer = new InputSanitizer({
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  allowedAttributes: {
    a: ['href', 'title'],
  },
  maxLength: 5000,
  allowUrls: true,
});

export const noteSanitizer = new InputSanitizer({
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  maxLength: 2000,
  allowUrls: true,
});

export const messageSanitizer = new InputSanitizer({
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  maxLength: 1000,
  allowUrls: true,
});

// Validation helpers
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

// SQL injection prevention
export function sanitizeForSQL(input: string): string {
  return input
    .replace(/['"]/g, '')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/union/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .replace(/create/gi, '')
    .replace(/alter/gi, '');
}
