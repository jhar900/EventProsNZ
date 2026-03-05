import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255),
  subject: z.string().min(1, 'Subject is required').max(500),
  html_body: z.string().min(1, 'HTML body is required'),
  text_body: z.string().optional(),
  description: z.string().optional(),
  trigger_action: z.string().min(1, 'Trigger action is required'),
  is_active: z.boolean().default(true),
  variables: z.array(z.string()).default([]),
});

// GET /api/admin/email-templates - Get all email templates
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

    // Get all templates (admins can see all, including inactive)
    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/email-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create a new email template
export async function POST(request: NextRequest) {
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
    const validatedData = emailTemplateSchema.parse(body);

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A template with this slug already exists' },
        { status: 400 }
      );
    }

    // Insert new template
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        ...validatedData,
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/admin/email-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
