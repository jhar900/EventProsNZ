import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
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
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const user = authResult.user;

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
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const user = authResult.user;

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
