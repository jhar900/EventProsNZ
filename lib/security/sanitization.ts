import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The content to sanitize
 * @returns Sanitized content
 */
export function sanitizeHtml(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Configure DOMPurify with strict settings
  const config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  };

  return DOMPurify.sanitize(content, config);
}

/**
 * Sanitizes plain text content by removing HTML tags and encoding special characters
 * @param content - The content to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags and encode special characters
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;') // Encode ampersands
    .replace(/</g, '&lt;') // Encode less than
    .replace(/>/g, '&gt;') // Encode greater than
    .replace(/"/g, '&quot;') // Encode double quotes
    .replace(/'/g, '&#x27;') // Encode single quotes
    .replace(/\//g, '&#x2F;'); // Encode forward slashes
}

/**
 * Validates and sanitizes job description content
 * @param description - The job description to sanitize
 * @returns Sanitized job description
 */
export function sanitizeJobDescription(description: string): string {
  return sanitizeText(description);
}

/**
 * Validates and sanitizes special requirements content
 * @param requirements - The special requirements to sanitize
 * @returns Sanitized special requirements
 */
export function sanitizeSpecialRequirements(requirements: string): string {
  return sanitizeText(requirements);
}

/**
 * Validates file upload security
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeToExtension: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      'docx',
    ],
  };

  if (extension && mimeToExtension[file.type]) {
    if (!mimeToExtension[file.type].includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} does not match MIME type ${file.type}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes filename to prevent directory traversal attacks
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 255); // Limit filename length
}
