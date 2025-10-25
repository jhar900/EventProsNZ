import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const cookieConsentSchema = z.object({
  consent_data: z.object({
    essential: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    functional: z.boolean(),
  }),
  timestamp: z.string().datetime(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = cookieConsentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { consent_data, timestamp, ip_address, user_agent } =
      validationResult.data;
    const supabase = createClient();

    // Get client IP and user agent from request
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      ip_address ||
      'unknown';
    const clientUserAgent =
      request.headers.get('user-agent') || user_agent || 'unknown';

    // Insert cookie consent record
    const { data: consent, error } = await supabase
      .from('cookie_consent')
      .insert({
        consent_data,
        ip_address: clientIP,
        user_agent: clientUserAgent,
      })
      .select()
      .single();

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to save cookie consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cookie consent saved successfully',
      data: {
        id: consent.id,
        consent_data: consent.consent_data,
        created_at: consent.created_at,
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the latest cookie consent for the user
    const { data: consent, error } = await supabase
      .from('cookie_consent')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch cookie consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: consent || null,
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
