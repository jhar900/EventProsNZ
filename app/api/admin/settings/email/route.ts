import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const emailSettingsSchema = z.object({
  email_provider: z.enum(['resend', 'brevo', 'smtp', 'sendgrid']),
  from_email: z.string().email(),
  resend_api_key: z.string().optional(),
  brevo_api_key: z.string().optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().min(1).max(65535).optional(),
  smtp_secure: z.boolean().optional(),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),
  sendgrid_api_key: z.string().optional(),
});

// GET /api/admin/settings/email - Get email settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, return empty settings or fetch from environment variables
    // In a production app, you'd store these in a database table
    const settings = {
      email_provider: process.env.EMAIL_PROVIDER || 'resend',
      from_email: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || '',
      resend_api_key: process.env.RESEND_API_KEY ? '***' : '',
      brevo_api_key: process.env.BREVO_API_KEY ? '***' : '',
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      smtp_secure: process.env.SMTP_SECURE === 'true',
      smtp_user: process.env.SMTP_USER || '',
      smtp_password: process.env.SMTP_PASSWORD ? '***' : '',
      sendgrid_api_key: process.env.SENDGRID_API_KEY ? '***' : '',
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/email - Update email settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = emailSettingsSchema.parse(body);

    // In a production app, you'd save these to a database table
    // For now, we'll just return the validated data
    // Note: API keys should be stored securely and never returned in full
    const settings = {
      ...validatedData,
      // Mask sensitive fields
      resend_api_key: validatedData.resend_api_key
        ? '***' + validatedData.resend_api_key.slice(-4)
        : undefined,
      brevo_api_key: validatedData.brevo_api_key
        ? '***' + validatedData.brevo_api_key.slice(-4)
        : undefined,
      smtp_password: validatedData.smtp_password
        ? '***' + validatedData.smtp_password.slice(-4)
        : undefined,
      sendgrid_api_key: validatedData.sendgrid_api_key
        ? '***' + validatedData.sendgrid_api_key.slice(-4)
        : undefined,
    };

    return NextResponse.json({
      settings,
      message: 'Email settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
