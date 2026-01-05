import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
// Email imports use dynamic imports to avoid blocking route registration

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const { email } = validatedData;

    // Check if user exists in our database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (userError) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if user signed up with Google OAuth by checking auth.users
    // We need to check if they have a Google identity provider
    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userData.id);

    if (!authUserError && authUser?.user) {
      // Check if user has Google as an identity provider
      const hasGoogleProvider = authUser.user.identities?.some(
        identity => identity.provider === 'google'
      );

      if (hasGoogleProvider) {
        // User signed up with Google - inform them to use Google login
        return NextResponse.json({
          message:
            'This account was created using Google. Please sign in using the "Sign in with Google" option instead of resetting your password.',
          isGoogleAuth: true,
        });
      }
    }

    // Generate password reset link using Supabase
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${baseUrl}`,
        },
      });

    if (linkError) {
      console.error('Failed to generate password reset link:', linkError);
      // Don't reveal the error to the client for security
      return NextResponse.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Send password reset email (non-blocking - don't fail if email fails)
    // Use async IIFE to avoid blocking route registration and problematic imports
    // Capture variables needed in the async callback
    const resetLinkData = linkData;
    const resetEmail = email;
    const resetUserId = userData.id;
    const resetBaseUrl = baseUrl;

    // Send email asynchronously without importing EmailTemplateManager
    // (which would pull in isomorphic-dompurify/jsdom and cause build issues)
    (async () => {
      try {
        console.log(
          '[Password Reset] Starting email send process for:',
          resetEmail
        );

        // Query templates directly using admin client to bypass RLS
        const { data: templates, error: templatesError } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .eq('is_active', true);

        if (templatesError) {
          console.error(
            '[Password Reset] Error fetching templates:',
            templatesError
          );
          return;
        }

        console.log(
          '[Password Reset] Found templates:',
          templates?.length || 0
        );

        const resetTemplate = templates?.find(
          (t: any) =>
            t.trigger_action === 'password_reset' ||
            t.name.toLowerCase().includes('password reset')
        );

        if (!resetTemplate) {
          console.error(
            '[Password Reset] Template not found. Available templates:',
            templates?.map((t: any) => ({
              name: t.name,
              trigger: t.trigger_action,
            })) || []
          );
          return;
        }

        console.log('[Password Reset] Using template:', resetTemplate.name);

        // Build reset URL from the generated link
        let resetUrl: string;
        if (resetLinkData?.properties?.action_link) {
          resetUrl = resetLinkData.properties.action_link;
          console.log('[Password Reset] Using action_link from Supabase');
        } else if (resetLinkData?.properties?.hashed_token) {
          resetUrl = `${resetBaseUrl}/reset-password?token=${resetLinkData.properties.hashed_token}`;
          console.log('[Password Reset] Constructed URL from hashed_token');
        } else {
          console.error(
            '[Password Reset] No reset link available. LinkData:',
            JSON.stringify(resetLinkData, null, 2)
          );
          return;
        }

        // Get user's first name from profile if available
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('first_name')
          .eq('user_id', resetUserId)
          .maybeSingle();

        const firstName = profile?.first_name || 'User';

        // Prepare template variables
        const templateVariables = {
          user_name: firstName,
          reset_link: resetUrl,
        };

        console.log('[Password Reset] Template variables prepared');

        // Render template directly (we already have the template data)
        const replaceVariables = (
          content: string,
          vars: Record<string, any>
        ): string => {
          if (!content || !vars) return content;
          return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            const value = vars[varName];
            return value !== undefined ? String(value) : match;
          });
        };

        const renderedTemplate = {
          subject: replaceVariables(resetTemplate.subject, templateVariables),
          html: replaceVariables(
            (resetTemplate as any).html_body ||
              (resetTemplate as any).html_content ||
              '',
            templateVariables
          ),
          text: replaceVariables(
            (resetTemplate as any).text_body ||
              (resetTemplate as any).text_content ||
              '',
            templateVariables
          ),
        };

        console.log('[Password Reset] Template rendered successfully');

        // Send email using SimpleEmailService (supports Resend, Brevo, SMTP)
        const { SimpleEmailService } = await import(
          '@/lib/email/simple-email-service'
        );

        // Check if email provider is configured
        const hasEmailProvider =
          process.env.RESEND_API_KEY ||
          process.env.BREVO_API_KEY ||
          process.env.SMTP_HOST;

        if (!hasEmailProvider) {
          console.warn(
            '[Password Reset] No email provider configured. Email will be logged to console in development mode.'
          );
        }

        // Determine from address - use verified domain for Resend
        let fromAddress: string;
        if (process.env.RESEND_API_KEY) {
          // Use verified domain email for Resend
          fromAddress = 'no-reply@eventpros.co.nz';
          console.log(
            '[Password Reset] Using Resend with from address:',
            fromAddress
          );
        } else {
          // Fallback to environment variables or default
          fromAddress =
            process.env.BREVO_FROM_EMAIL ||
            process.env.SMTP_FROM_EMAIL ||
            process.env.EMAIL_FROM ||
            'no-reply@eventpros.co.nz';
        }

        console.log('[Password Reset] Sending email:', {
          to: resetEmail,
          from: fromAddress,
          subject: renderedTemplate.subject,
          hasHtml: !!renderedTemplate.html,
          hasText: !!renderedTemplate.text,
        });

        const emailResponse = await SimpleEmailService.sendEmail({
          to: resetEmail,
          subject: renderedTemplate.subject,
          html: renderedTemplate.html,
          text: renderedTemplate.text,
          from: fromAddress,
          fromName: 'Event Pros NZ',
        });

        console.log('[Password Reset] Email service response:', {
          success: emailResponse.success,
          messageId: emailResponse.messageId,
          error: emailResponse.error,
        });

        if (!emailResponse.success) {
          console.error(
            '[Password Reset] Failed to send email:',
            emailResponse.error
          );
        } else {
          console.log(
            '[Password Reset] Email sent successfully:',
            emailResponse.messageId
          );

          // Log email communication if email_communications table exists
          try {
            await supabaseAdmin.from('email_communications').insert({
              user_id: resetUserId,
              email_type: 'password_reset',
              template_id: resetTemplate.id,
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: {
                recipient: resetEmail,
              },
            });
            console.log('[Password Reset] Email logged to database');
          } catch (logError) {
            // Don't fail if logging fails
            console.warn(
              '[Password Reset] Failed to log email communication:',
              logError
            );
          }
        }
      } catch (emailError) {
        // Log error but don't throw - password reset should succeed even if email fails
        console.error(
          '[Password Reset] Failed to send password reset email during reset request:',
          emailError
        );
        if (emailError instanceof Error) {
          console.error('[Password Reset] Error stack:', emailError.stack);
        }
      }
    })(); // Immediately invoke async function

    return NextResponse.json({
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
