import { supabaseAdmin } from '@/lib/supabase/server';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { SimpleEmailService } from '@/lib/email/simple-email-service';

/**
 * Send a welcome email to a newly registered user
 * This function is designed to be called during registration and will not throw errors
 * to prevent blocking the registration process
 *
 * Uses SimpleEmailService which supports:
 * - Resend (recommended - 3,000 emails/month free)
 * - Brevo (300 emails/day free)
 * - SMTP (Gmail, Outlook, custom)
 */
export async function sendWelcomeEmail(params: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'event_manager' | 'contractor' | 'admin';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, firstName, lastName, role } = params;

    // Get the Welcome Email template by name
    const templateManager = new EmailTemplateManager();
    const templates = await templateManager.getTemplates({ isActive: true });
    const welcomeTemplate = templates.find(
      t => t.name.toLowerCase() === 'welcome email'
    );

    if (!welcomeTemplate) {
      console.warn('Welcome email template not found');
      return { success: false, error: 'Template not found' };
    }

    // Prepare template variables
    const templateVariables = {
      firstName: firstName || 'User',
      lastName: lastName || '',
      email: email,
      userType: role,
      company: 'EventProsNZ',
      date: new Date().toLocaleDateString(),
    };

    // Render template
    const renderedTemplate = await templateManager.renderTemplate(
      welcomeTemplate.id,
      templateVariables
    );

    // Send email using SimpleEmailService (supports Resend, Brevo, SMTP)
    const emailResponse = await SimpleEmailService.sendEmail({
      to: email,
      subject: renderedTemplate.subject,
      html: renderedTemplate.html,
      text: renderedTemplate.text,
      from:
        process.env.RESEND_FROM_EMAIL ||
        process.env.BREVO_FROM_EMAIL ||
        process.env.SMTP_FROM_EMAIL ||
        process.env.EMAIL_FROM,
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      console.error('Failed to send welcome email:', emailResponse.error);
      return { success: false, error: emailResponse.error };
    }

    // Log email communication if email_communications table exists
    try {
      await supabaseAdmin.from('email_communications').insert({
        user_id: userId,
        email_type: 'welcome',
        template_id: welcomeTemplate.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Failed to log email communication:', logError);
    }

    return { success: true };
  } catch (error) {
    // Log error but don't throw - we don't want to block registration
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
