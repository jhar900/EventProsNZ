import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  slug: z.string().min(1, 'Slug is required').max(255).optional(),
  subject: z.string().min(1, 'Subject is required').max(500).optional(),
  html_body: z.string().min(1, 'HTML body is required').optional(),
  text_body: z.string().optional(),
  description: z.string().optional(),
  trigger_action: z.string().min(1, 'Trigger action is required').optional(),
  is_active: z.boolean().optional(),
  variables: z.array(z.string()).optional(),
});

// GET /api/admin/email-templates/[id] - Get a specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { id } = params;

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in GET /api/admin/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-templates/[id] - Update an email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { id } = params;
    const body = await request.json();
    const validatedData = emailTemplateSchema.parse(body);

    // If slug is being updated, check if it conflicts with another template
    if (validatedData.slug) {
      const { data: existing } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .eq('slug', validatedData.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'A template with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update template
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update({
        ...validatedData,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/admin/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-templates/[id] - Delete an email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { id } = params;

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email template deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
