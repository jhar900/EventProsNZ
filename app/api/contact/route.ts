import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contactFormRateLimit } from '@/lib/rate-limiting';
import {
  validateCSRFToken,
  getCSRFTokenFromRequest,
  getSessionIdFromRequest,
  createCSRFToken,
} from '@/lib/csrf';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  csrfToken: z.string().optional(), // CSRF token for form submissions
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactFormRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = contactFormSchema.parse(body);

    // Validate CSRF token
    const sessionId = getSessionIdFromRequest(request);
    const csrfToken =
      getCSRFTokenFromRequest(request) || validatedData.csrfToken;

    if (!csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid or missing CSRF token. Please refresh the page and try again.',
        },
        { status: 403 }
      );
    }

    // Helper function to escape HTML
    const escapeHtml = (text: string): string => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    };

    // Format date in NZ timezone
    const nzDate = new Date().toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Escape user-provided content for HTML
    const escapedName = escapeHtml(validatedData.name);
    const escapedEmail = escapeHtml(validatedData.email);
    const escapedPhone = escapeHtml(validatedData.phone || 'Not provided');
    const escapedCompany = escapeHtml(validatedData.company || 'Not provided');
    const escapedMessage = escapeHtml(validatedData.message);

    // Prepare email content
    const emailSubject = `New Contact Form Submission from ${validatedData.name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f18d30 0%, #f4a855 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #f18d30; }
          .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
          .message { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${escapedName}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${escapedEmail}</div>
            </div>
            <div class="field">
              <div class="label">Phone:</div>
              <div class="value">${escapedPhone}</div>
            </div>
            <div class="field">
              <div class="label">Company:</div>
              <div class="value">${escapedCompany}</div>
            </div>
            <div class="field">
              <div class="label">Submitted At (NZ Time):</div>
              <div class="value">${escapeHtml(nzDate)}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="value message">${escapedMessage}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
New Contact Form Submission

Name: ${validatedData.name}
Email: ${validatedData.email}
Phone: ${validatedData.phone || 'Not provided'}
Company: ${validatedData.company || 'Not provided'}
Submitted At (NZ Time): ${nzDate}

Message:
${validatedData.message}
    `.trim();

    // Send email notification (supports multiple free providers)
    try {
      const { SimpleEmailService } = await import(
        '@/lib/email/simple-email-service'
      );

      const result = await SimpleEmailService.sendEmail({
        to: 'jason@eventpros.co.nz',
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        from: 'no-reply@eventpros.co.nz',
        fromName: 'EventProsNZ Contact Form',
        replyTo: validatedData.email,
      });

      if (result.success) {
        console.log('Contact form email sent successfully', {
          messageId: result.messageId,
        });
      } else {
        console.error('Failed to send contact form email:', result.error);
      }
    } catch (emailError: any) {
      // Log error but don't fail the request
      console.error(
        'Failed to send contact form email:',
        emailError?.message || emailError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you for your message. We'll get back to you within 24 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit contact form. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const csrfToken = createCSRFToken(sessionId);

  return NextResponse.json(
    {
      message: 'Contact API endpoint',
      csrfToken,
    },
    { status: 200 }
  );
}
