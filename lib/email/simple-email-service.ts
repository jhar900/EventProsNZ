/**
 * Simple Email Service
 * Supports multiple free email providers:
 * - SMTP (via nodemailer) - Gmail, Outlook, custom SMTP
 * - Resend (free tier: 3,000 emails/month)
 * - Brevo (free tier: 300 emails/day)
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SimpleEmailService {
  /**
   * Send email using the configured provider
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // Try providers in order of preference
    // 1. Resend (if API key is set)
    if (process.env.RESEND_API_KEY) {
      return this.sendViaResend(options);
    }

    // 2. Brevo/Sendinblue (if API key is set)
    if (process.env.BREVO_API_KEY) {
      try {
        // Use dynamic path to prevent webpack from analyzing at build time
        const brevoPath = './providers/brevo';
        const brevoModule = await import(brevoPath);
        return brevoModule.sendViaBrevo(options);
      } catch (error: any) {
        return {
          success: false,
          error: 'Brevo provider not available',
        };
      }
    }

    // 3. SMTP (if SMTP config is set)
    if (process.env.SMTP_HOST) {
      try {
        // Use dynamic path to prevent webpack from analyzing at build time
        const smtpPath = './providers/smtp';
        const smtpModule = await import(smtpPath);
        return smtpModule.sendViaSMTP(options);
      } catch (error: any) {
        return {
          success: false,
          error: 'SMTP provider not available',
        };
      }
    }

    // 4. Fallback: Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email (not sent - no provider configured):', {
        to: options.to,
        subject: options.subject,
      });
      return { success: true, messageId: 'dev-mode' };
    }

    return {
      success: false,
      error: 'No email provider configured',
    };
  }

  /**
   * Send via Resend (free tier: 3,000 emails/month)
   * Install: npm install resend
   */
  private static async sendViaResend(
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const fromEmail =
        options.from ||
        process.env.RESEND_FROM_EMAIL ||
        'onboarding@resend.dev';

      const result = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Failed to send via Resend',
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send via Resend',
      };
    }
  }
}
