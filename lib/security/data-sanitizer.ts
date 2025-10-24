import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  stripHtml?: boolean;
}

export class DataSanitizer {
  private defaultOptions: SanitizationOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'width', 'height'],
    },
    maxLength: 10000,
    stripHtml: false,
  };

  sanitizeString(input: string, options?: SanitizationOptions): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const config = { ...this.defaultOptions, ...options };

    // Trim whitespace
    let sanitized = input.trim();

    // Check length
    if (config.maxLength && sanitized.length > config.maxLength) {
      sanitized = sanitized.substring(0, config.maxLength);
    }

    // Strip HTML if requested
    if (config.stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Sanitize HTML
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: config.allowedTags,
        ALLOWED_ATTR: config.allowedAttributes,
      });
    }

    return sanitized;
  }

  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Basic email validation and sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();

    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    const sanitized = url.trim();

    // Basic URL validation
    try {
      const urlObj = new URL(sanitized);
      // Only allow http and https protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error('Invalid URL protocol');
      }
      return sanitized;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  sanitizeJson(input: any): any {
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return this.sanitizeObject(parsed);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    }

    if (typeof input === 'object' && input !== null) {
      return this.sanitizeObject(input);
    }

    return input;
  }

  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    return obj;
  }

  sanitizeTrialEmailData(data: any): any {
    return {
      userId: this.sanitizeString(data.userId),
      email: this.sanitizeEmail(data.email),
      firstName: this.sanitizeString(data.firstName),
      lastName: this.sanitizeString(data.lastName),
      trialDay: Math.max(0, Math.min(14, parseInt(data.trialDay) || 0)),
      daysRemaining: Math.max(
        0,
        Math.min(14, parseInt(data.daysRemaining) || 0)
      ),
      conversionLikelihood: Math.max(
        0,
        Math.min(1, parseFloat(data.conversionLikelihood) || 0)
      ),
      featureUsage: this.sanitizeObject(data.featureUsage),
      platformEngagement: this.sanitizeObject(data.platformEngagement),
    };
  }

  sanitizeTrialAnalyticsData(data: any): any {
    return {
      userId: this.sanitizeString(data.userId),
      trialDay: Math.max(0, Math.min(14, parseInt(data.trialDay) || 0)),
      featureUsage: this.sanitizeObject(data.featureUsage),
      platformEngagement: this.sanitizeObject(data.platformEngagement),
    };
  }

  sanitizeTrialConversionData(data: any): any {
    return {
      userId: this.sanitizeString(data.userId),
      conversionStatus: this.sanitizeString(data.conversionStatus),
      conversionTier: this.sanitizeString(data.conversionTier),
      conversionReason: this.sanitizeString(data.conversionReason),
    };
  }

  validateTrialEmailType(emailType: string): boolean {
    const validTypes = ['day_2_optimization', 'day_7_checkin', 'day_12_ending'];
    return validTypes.includes(emailType);
  }

  validateTrialConversionStatus(status: string): boolean {
    const validStatuses = ['active', 'converted', 'expired', 'cancelled'];
    return validStatuses.includes(status);
  }

  validateTrialTier(tier: string): boolean {
    const validTiers = ['free', 'showcase', 'spotlight'];
    return validTiers.includes(tier);
  }

  sanitizeSearchParams(params: URLSearchParams): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      const sanitizedKey = this.sanitizeString(key);
      const sanitizedValue = this.sanitizeString(value);

      if (sanitizedKey && sanitizedValue) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }

    return sanitized;
  }
}
