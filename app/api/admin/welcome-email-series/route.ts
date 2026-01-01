import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  email_key: z.string().min(1, 'Email key is required'),
  status: z.enum(['active', 'paused', 'draft']),
});

// GET /api/admin/welcome-email-series - Get all welcome email series configuration
export async function GET(request: NextRequest) {
  try {
    // Check for admin token header first (development bypass)
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV === 'development' ||
      request.url.includes('localhost');

    let user: any;

    // If admin token is provided and matches, or we're in development, allow access
    if (adminToken === expectedToken || isDevelopment) {
      // In development, try to get user but don't fail if not found
      const { supabase } = createClient(request);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      user = session?.user;
    } else {
      // Normal authentication flow
      const { supabase } = createClient(request);

      // Try to get user from session first (better cookie handling)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        user = session.user;
      } else {
        // Fallback to getUser (reads from cookies)
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data: series, error } = await supabaseAdmin
      .from('welcome_email_series')
      .select('*')
      .order('delay_hours', { ascending: true });

    if (error) {
      console.error('Error fetching welcome email series:', error);
      return NextResponse.json(
        { error: 'Failed to fetch welcome email series' },
        { status: 500 }
      );
    }

    return NextResponse.json({ series: series || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/welcome-email-series:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/welcome-email-series - Update status of a welcome email
export async function PATCH(request: NextRequest) {
  try {
    // Check for admin token header first (development bypass)
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken =
      process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros';
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV === 'development' ||
      request.url.includes('localhost');

    let user: any;

    // If admin token is provided and matches, or we're in development, allow access
    if (adminToken === expectedToken || isDevelopment) {
      // In development, try to get user but don't fail if not found
      const { supabase } = createClient(request);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      user = session?.user;
    } else {
      // Normal authentication flow
      const { supabase } = createClient(request);

      // Try to get user from session first (better cookie handling)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        user = session.user;
      } else {
        // Fallback to getUser (reads from cookies)
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Update the status
    const { data: updated, error } = await supabaseAdmin
      .from('welcome_email_series')
      .update({ status: validatedData.status })
      .eq('email_key', validatedData.email_key)
      .select()
      .single();

    if (error) {
      console.error('Error updating welcome email series status:', error);
      return NextResponse.json(
        { error: 'Failed to update email status' },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PATCH /api/admin/welcome-email-series:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
