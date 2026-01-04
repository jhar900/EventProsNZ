import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating templates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  cover_letter_template: z.string().min(50).max(2000).optional(),
  service_categories: z.array(z.string()).optional().default([]),
  is_public: z.boolean().optional(),
});

// PUT /api/applications/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params for Next.js 15
    const { id } = await params;

    // Get user ID from header (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('[PUT /api/applications/templates] Request body:', body);
    console.log('[PUT /api/applications/templates] Template ID:', id);
    console.log('[PUT /api/applications/templates] User ID:', userId);

    // Validate request body
    const validationResult = updateTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(
        '[PUT /api/applications/templates] Validation error:',
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors:
            validationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    // Check if template exists and belongs to the user
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('application_templates')
      .select('id, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this template
    if (existingTemplate.created_by_user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (validationResult.data.name !== undefined) {
      updateData.name = validationResult.data.name;
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.cover_letter_template !== undefined) {
      updateData.cover_letter_template =
        validationResult.data.cover_letter_template;
    }
    if (validationResult.data.service_categories !== undefined) {
      updateData.service_categories = validationResult.data.service_categories;
    }
    if (validationResult.data.is_public !== undefined) {
      updateData.is_public = validationResult.data.is_public;
    }

    console.log('[PUT /api/applications/templates] Update data:', updateData);

    // Update template
    const { data: template, error } = await supabaseAdmin
      .from('application_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/applications/templates] Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
      });

      return NextResponse.json(
        {
          success: false,
          error: `Failed to update template: ${error.message}`,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/applications/templates/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params for Next.js 15
    const { id } = await params;

    // Get user ID from header (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if template exists and belongs to the user
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('application_templates')
      .select('id, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this template
    if (existingTemplate.created_by_user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete template
    const { error } = await supabaseAdmin
      .from('application_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        '[DELETE /api/applications/templates] Supabase error:',
        error
      );
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete template: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/applications/templates/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
