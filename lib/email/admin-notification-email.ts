import { supabaseAdmin } from '@/lib/supabase/server';
import { SimpleEmailService } from '@/lib/email/simple-email-service';

/**
 * Send a notification email to admin users when a new user signs up
 * This function is designed to be called during registration and will not throw errors
 * to prevent blocking the registration process
 *
 * Uses SimpleEmailService which supports:
 * - Resend (recommended - 3,000 emails/month free)
 * - Brevo (300 emails/day free)
 * - SMTP (Gmail, Outlook, custom)
 */
export async function sendAdminNotificationEmail(params: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'event_manager' | 'contractor' | 'admin';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, firstName, lastName, role } = params;

    // Get all admin users from the database
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .not('email', 'is', null);

    if (adminError) {
      console.error('Failed to fetch admin users:', adminError);
      return { success: false, error: 'Failed to fetch admin users' };
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found to send notification');
      return { success: false, error: 'No admin users found' };
    }

    // Extract admin email addresses
    const adminEmails = adminUsers
      .map(admin => admin.email)
      .filter(
        (email): email is string => email !== null && email !== undefined
      );

    if (adminEmails.length === 0) {
      console.warn('No valid admin email addresses found');
      return { success: false, error: 'No valid admin email addresses' };
    }

    // Format user name
    const fullName = `${firstName} ${lastName}`.trim() || 'User';
    const signupDate = new Date().toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // Create email subject
    const subject = `New User Registration: ${fullName} (${role})`;

    // Create HTML email content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Registration</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New User Registration</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">A new user has registered on EventProsNZ:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #555; width: 140px;">Name:</td>
          <td style="padding: 8px 0; color: #333;">${fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
          <td style="padding: 8px 0; color: #333;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #555;">Role:</td>
          <td style="padding: 8px 0; color: #333;">
            <span style="display: inline-block; padding: 4px 12px; background: ${
              role === 'contractor'
                ? '#e3f2fd'
                : role === 'event_manager'
                  ? '#f3e5f5'
                  : '#fff3e0'
            }; color: ${
              role === 'contractor'
                ? '#1976d2'
                : role === 'event_manager'
                  ? '#7b1fa2'
                  : '#e65100'
            }; border-radius: 12px; font-size: 14px; font-weight: 500; text-transform: capitalize;">
              ${role.replace('_', ' ')}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #555;">User ID:</td>
          <td style="padding: 8px 0; color: #666; font-family: monospace; font-size: 13px;">${userId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #555;">Signup Date:</td>
          <td style="padding: 8px 0; color: #333;">${signupDate}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/users/${userId}" 
         style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
        View User Profile
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/users" 
         style="display: inline-block; background: #f8f9fa; color: #667eea; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; border: 1px solid #e0e0e0;">
        View All Users
      </a>
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>This is an automated notification from EventProsNZ</p>
  </div>
</body>
</html>
    `.trim();

    // Create plain text version
    const text = `
New User Registration

A new user has registered on EventProsNZ:

Name: ${fullName}
Email: ${email}
Role: ${role.replace('_', ' ')}
User ID: ${userId}
Signup Date: ${signupDate}

View User Profile: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/users/${userId}
View All Users: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/users

This is an automated notification from EventProsNZ
    `.trim();

    // Send email to all admin users using SimpleEmailService (prioritizes Resend if configured)
    const emailResponse = await SimpleEmailService.sendEmail({
      to: adminEmails,
      subject,
      html,
      text,
      from:
        process.env.RESEND_FROM_EMAIL ||
        process.env.BREVO_FROM_EMAIL ||
        process.env.SMTP_FROM_EMAIL ||
        process.env.EMAIL_FROM,
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      console.error(
        'Failed to send admin notification email:',
        emailResponse.error
      );
      return { success: false, error: emailResponse.error };
    }

    // Log email communication if email_communications table exists
    try {
      await supabaseAdmin.from('email_communications').insert({
        user_id: userId,
        email_type: 'admin_notification',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn(
        'Failed to log admin notification email communication:',
        logError
      );
    }

    return { success: true };
  } catch (error) {
    // Log error but don't throw - we don't want to block registration
    console.error('Error sending admin notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
