import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiting';
import { headers } from 'next/headers';

// Rate limiting configuration for sending trial emails
const sendTrialEmailRateLimiter = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  message: 'Too many trial email send requests, please try again later',
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, sendTrialEmailRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, email_type, scheduled_date } = body;

    // Validate input
    if (!user_id || !email_type) {
      return NextResponse.json(
        { error: 'user_id and email_type are required' },
        { status: 400 }
      );
    }

    // Check if user can send email for this user
    if (user_id !== user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get user data for email content
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        email,
        profiles!inner(first_name, last_name)
      `
      )
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate email content based on type
    const emailContent = generateTrialEmailContent(
      email_type,
      userData.profiles.first_name,
      userData.profiles.last_name
    );

    // Create or update trial email
    const { data: email, error } = await supabase
      .from('trial_emails')
      .upsert({
        user_id,
        email_type,
        scheduled_date: scheduled_date || new Date().toISOString(),
        email_status: 'pending',
        email_content: emailContent,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create/update trial email: ${error.message}`);
    }

    // TODO: Integrate with SendGrid to actually send the email
    // For now, we'll just mark it as sent
    const { error: updateError } = await supabase
      .from('trial_emails')
      .update({
        email_status: 'sent',
        sent_date: new Date().toISOString(),
      })
      .eq('id', email.id);

    if (updateError) {
      throw new Error(`Failed to update email status: ${updateError.message}`);
    }

    const response = NextResponse.json({
      email: {
        ...email,
        email_status: 'sent',
        sent_date: new Date().toISOString(),
      },
      success: true,
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send trial email' },
      { status: 500 }
    );
  }
}

function generateTrialEmailContent(
  emailType: string,
  firstName: string,
  lastName: string
) {
  const baseContent = {
    to: `${firstName} ${lastName}`,
    subject: '',
    html: '',
    text: '',
  };

  switch (emailType) {
    case 'day_2_optimization':
      return {
        ...baseContent,
        subject: 'Optimize Your Profile - Day 2 of Your Trial',
        html: `
          <h1>Hi ${firstName}!</h1>
          <p>Welcome to day 2 of your EventProsNZ trial! Here are some tips to optimize your profile:</p>
          <ul>
            <li>Add a professional profile photo</li>
            <li>Complete your bio section</li>
            <li>Add your service categories</li>
            <li>Upload portfolio items</li>
          </ul>
          <p>These optimizations will help you get more visibility and inquiries.</p>
          <p>Best regards,<br>The EventProsNZ Team</p>
        `,
        text: `Hi ${firstName}! Welcome to day 2 of your EventProsNZ trial! Here are some tips to optimize your profile: Add a professional profile photo, complete your bio section, add your service categories, and upload portfolio items. These optimizations will help you get more visibility and inquiries. Best regards, The EventProsNZ Team`,
      };

    case 'day_7_checkin':
      return {
        ...baseContent,
        subject: 'How is your trial going? - Day 7 Check-in',
        html: `
          <h1>Hi ${firstName}!</h1>
          <p>You're halfway through your trial! How has your experience been so far?</p>
          <p>We'd love to hear your feedback and help you make the most of the platform.</p>
          <p>Some features you might want to explore:</p>
          <ul>
            <li>Advanced search filters</li>
            <li>Contractor matching system</li>
            <li>Portfolio management</li>
            <li>Analytics dashboard</li>
          </ul>
          <p>Feel free to reach out if you have any questions!</p>
          <p>Best regards,<br>The EventProsNZ Team</p>
        `,
        text: `Hi ${firstName}! You're halfway through your trial! How has your experience been so far? We'd love to hear your feedback and help you make the most of the platform. Some features you might want to explore: Advanced search filters, Contractor matching system, Portfolio management, Analytics dashboard. Feel free to reach out if you have any questions! Best regards, The EventProsNZ Team`,
      };

    case 'day_12_ending':
      return {
        ...baseContent,
        subject: "Your trial ends soon - Don't miss out!",
        html: `
          <h1>Hi ${firstName}!</h1>
          <p>Your trial ends in 2 days! We hope you've enjoyed using EventProsNZ.</p>
          <p>To continue getting the most out of the platform, consider upgrading to a paid plan:</p>
          <ul>
            <li><strong>Showcase Plan:</strong> Enhanced visibility and features</li>
            <li><strong>Spotlight Plan:</strong> Premium features and priority support</li>
          </ul>
          <p>Upgrade now to keep your profile active and continue growing your business!</p>
          <p>Best regards,<br>The EventProsNZ Team</p>
        `,
        text: `Hi ${firstName}! Your trial ends in 2 days! We hope you've enjoyed using EventProsNZ. To continue getting the most out of the platform, consider upgrading to a paid plan: Showcase Plan (Enhanced visibility and features) or Spotlight Plan (Premium features and priority support). Upgrade now to keep your profile active and continue growing your business! Best regards, The EventProsNZ Team`,
      };

    default:
      return baseContent;
  }
}
