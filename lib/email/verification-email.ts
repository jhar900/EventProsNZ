import { supabaseAdmin } from '@/lib/supabase/server';
import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { SimpleEmailService } from '@/lib/email/simple-email-service';

/**
 * Send an email verification email to a newly registered user
 * This function is designed to be called during registration and will not throw errors
 * to prevent blocking the registration process
 *
 * Uses SimpleEmailService which supports:
 * - Resend (recommended - 3,000 emails/month free)
 * - Brevo (300 emails/day free)
 * - SMTP (Gmail, Outlook, custom)
 */
export async function sendVerificationEmail(params: {
  userId: string;
  email: string;
  firstName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, firstName } = params;

    // Generate email verification link using Supabase
    // Use invite type to generate a verification link for existing user
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: `${baseUrl}/auth/verify-email`,
        },
      });

    // Get the Email Verification template
    const templateManager = new EmailTemplateManager();
    const templates = await templateManager.getTemplates({ isActive: true });
    const verificationTemplate = templates.find(
      (t: any) =>
        (t as any).trigger_action === 'email_verification' ||
        t.name.toLowerCase().includes('verification')
    );

    if (!verificationTemplate) {
      console.warn('Email verification template not found');
      return { success: false, error: 'Template not found' };
    }

    // Build verification URL from the generated link
    // Extract the verification URL from Supabase's response
    let verificationUrl: string;
    if (linkError || !linkData) {
      console.error('Failed to generate verification link:', linkError);
      // Fallback: construct a basic verification URL
      // In production, you'd want to properly generate and store the token
      verificationUrl = `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}`;
    } else {
      // Use the action_link from Supabase if available, otherwise construct from token
      verificationUrl =
        linkData.properties?.action_link ||
        (linkData.properties?.hashed_token
          ? `${baseUrl}/auth/verify-email?token=${linkData.properties.hashed_token}`
          : `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}`);
    }

    // Prepare template variables
    const templateVariables = {
      firstName: firstName || 'User',
      verificationUrl: verificationUrl,
      email: email,
      privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/privacy`,
      helpUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/help`,
    };

    // Render template
    const renderedTemplate = await templateManager.renderTemplate(
      verificationTemplate.id,
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
        process.env.EMAIL_FROM ||
        'no-reply@eventpros.co.nz',
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      console.error('Failed to send verification email:', emailResponse.error);
      return {
        success: false,
        error: emailResponse.error || 'Failed to send verification email',
      };
    }

    // Log email communication if email_communications table exists
    try {
      await supabaseAdmin.from('email_communications').insert({
        user_id: userId,
        email_type: 'email_verification',
        template_id: verificationTemplate.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          recipient: email,
        },
      });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Failed to log email communication:', logError);
    }

    return { success: true };
  } catch (error) {
    // Log error but don't throw - we don't want to block registration
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
