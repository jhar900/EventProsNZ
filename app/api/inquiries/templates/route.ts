import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  GetInquiryTemplatesRequest,
  InquiryTemplateResponse,
  InquiryTemplateListResponse,
  TEMPLATE_TYPES,
} from '@/types/inquiries';

// Validation schemas
const createTemplateSchema = z.object({
  template_name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name too long'),
  template_content: z
    .string()
    .min(1, 'Template content is required')
    .max(5000, 'Template content too long'),
  template_type: z.enum(Object.values(TEMPLATE_TYPES) as [string, ...string[]]),
  is_public: z.boolean().optional().default(false),
});

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

const getTemplatesSchema = z.object({
  user_id: z.string().uuid().optional(),
  template_type: z
    .enum(Object.values(TEMPLATE_TYPES) as [string, ...string[]])
    .optional(),
  is_public: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// POST /api/inquiries/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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
    const validationResult = createTemplateSchema.safeParse(body);

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

    const templateData = validationResult.data;

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('inquiry_templates')
      .insert({
        user_id: user.id,
        template_name: templateData.template_name,
        template_content: templateData.template_content,
        template_type: templateData.template_type,
        is_public: templateData.is_public,
        usage_count: 0,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Template creation error:', templateError);
      return NextResponse.json(
        { success: false, message: 'Failed to create template' },
        { status: 500 }
      );
    }

    const response: InquiryTemplateResponse = {
      template,
      success: true,
      message: 'Template created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries/templates - Get templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getTemplatesSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { user_id, template_type, is_public, page, limit } =
      validationResult.data;
    const offset = (page - 1) * limit;

    // Get user role to determine access
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

    // Build query
    let query = supabase
      .from('inquiry_templates')
      .select(
        `
        *,
        user:user_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (user_id) {
      // Check if user can access the requested user's templates
      const canAccess = userProfile.role === 'admin' || user.id === user_id;

      if (!canAccess) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
      query = query.eq('user_id', user_id);
    } else {
      // Show user's own templates and public templates
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    }

    if (template_type) {
      query = query.eq('template_type', template_type);
    }

    if (is_public !== undefined) {
      query = query.eq('is_public', is_public);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      console.error('Templates fetch error:', templatesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const response: InquiryTemplateListResponse = {
      templates: templates || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
