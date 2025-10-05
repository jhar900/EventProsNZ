import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  UpdateInquiryTemplateRequest,
  InquiryTemplateResponse,
} from '@/types/inquiries';

// Validation schemas
const updateTemplateSchema = z.object({
  template_name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name too long')
    .optional(),
  template_content: z
    .string()
    .min(1, 'Template content is required')
    .max(5000, 'Template content too long')
    .optional(),
  is_public: z.boolean().optional(),
});

// PUT /api/inquiries/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const templateId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Get current template
    const { data: currentTemplate, error: templateError } = await supabase
      .from('inquiry_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !currentTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Get user role and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check update permissions
    const canUpdate =
      userProfile.role === 'admin' || currentTemplate.user_id === user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Update template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('inquiry_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) {
      console.error('Template update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update template' },
        { status: 500 }
      );
    }

    const response: InquiryTemplateResponse = {
      template: updatedTemplate,
      success: true,
      message: 'Template updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/inquiries/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const templateId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current template
    const { data: currentTemplate, error: templateError } = await supabase
      .from('inquiry_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !currentTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Get user role and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check delete permissions
    const canDelete =
      userProfile.role === 'admin' || currentTemplate.user_id === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('inquiry_templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Template deletion error:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
