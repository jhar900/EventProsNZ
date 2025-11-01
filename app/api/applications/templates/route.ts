import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  cover_letter_template: z.string().min(50).max(2000),
  service_categories: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
});

const getTemplatesSchema = z.object({
  service_category: z.string().optional(),
  is_public: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// GET /api/applications/templates - Get application templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user (optional for public templates)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getTemplatesSchema.parse({
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20,
      is_public: params.is_public ? params.is_public === 'true' : undefined,
    });

    const offset = (parsedParams.page - 1) * parsedParams.limit;

    let query = supabase
      .from('application_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (parsedParams.service_category) {
      query = query.contains('service_categories', [
        parsedParams.service_category,
      ]);
    }

    if (parsedParams.is_public !== undefined) {
      query = query.eq('is_public', parsedParams.is_public);
    }

    // If user is authenticated, show their templates and public templates
    if (user) {
      query = query.or(`created_by_user_id.eq.${user.id},is_public.eq.true`);
    } else {
      // Only show public templates for unauthenticated users
      query = query.eq('is_public', true);
    }

    // Apply pagination
    query = query.range(offset, offset + parsedParams.limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('GET /api/applications/templates error:', error);
      // Return empty results instead of error for better UX
      return NextResponse.json({
        success: true,
        templates: [],
        total: 0,
        page: parsedParams.page,
        limit: parsedParams.limit,
        total_pages: 0,
      });
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / parsedParams.limit);

    return NextResponse.json({
      success: true,
      templates: templates || [],
      total,
      page: parsedParams.page,
      limit: parsedParams.limit,
      total_pages,
    });
  } catch (error) {
    console.error('GET /api/applications/templates error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Return empty results instead of 500 error for better UX
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20;

    return NextResponse.json({
      success: true,
      templates: [],
      total: 0,
      page,
      limit,
      total_pages: 0,
    });
  }
}

// POST /api/applications/templates - Create a new template
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

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createTemplateSchema.safeParse(body);
    if (!validationResult.success) {
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

    const { data: template, error } = await supabase
      .from('application_templates')
      .insert({
        ...validationResult.data,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('POST /api/applications/templates error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
