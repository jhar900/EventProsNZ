import { supabaseAdmin } from '@/lib/supabase/server';
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
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: `${baseUrl}/auth/verify-email`,
        },
      });

    // Build verification URL from the generated link
    let verificationUrl: string;
    if (linkError || !linkData) {
      console.error('Failed to generate verification link:', linkError);
      return {
        success: false,
        error: 'Failed to generate verification link',
      };
    } else {
      // Use the action_link from Supabase if available
      verificationUrl =
        linkData.properties?.action_link ||
        (linkData.properties?.hashed_token
          ? `${baseUrl}/auth/verify-email?token=${linkData.properties.hashed_token}`
          : `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}`);
    }

    // Create styled email HTML matching the team invitation email design
    const emailSubject = 'Verify your email address - Event Pros NZ';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Event Pros NZ</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>Thank you for signing up for Event Pros NZ! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This verification link will expire in 24 hours.</p>
            <p style="font-size: 14px; color: #6b7280;">If you didn't create an account with Event Pros NZ, you can safely ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Event Pros NZ. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    const emailText = `
Event Pros NZ - Verify Your Email Address

Hi ${firstName || 'there'},

Thank you for signing up for Event Pros NZ! To complete your registration and start using your account, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Event Pros NZ, you can safely ignore this email.

© ${new Date().getFullYear()} Event Pros NZ. All rights reserved.
    `;

    // Use verified domain email for Resend
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const isTestEmail =
      resendFromEmail === 'onboarding@resend.dev' ||
      resendFromEmail?.includes('@resend.dev');

    const fromEmail = isTestEmail
      ? 'no-reply@eventpros.co.nz'
      : resendFromEmail || 'no-reply@eventpros.co.nz';

    // Send email using SimpleEmailService (supports Resend, Brevo, SMTP)
    const emailResponse = await SimpleEmailService.sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      from: fromEmail,
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
