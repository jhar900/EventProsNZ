import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  cover_letter_template: z.string().min(50).max(2000),
  service_categories: z.array(z.string()).optional().default([]),
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
    // Try to get user ID from header first (sent by client)
    const userId = request.headers.get('x-user-id');

    let supabase;
    let user = null;

    if (userId) {
      // Use service role client if we have user ID from header
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      supabase = supabaseAdmin;
      // Fetch user data if needed
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      if (userData) {
        user = { id: userData.id };
      }
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user: authUser },
      } = await middlewareSupabase.auth.getUser();
      supabase = middlewareSupabase;
      user = authUser;
    }

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

    // If user is authenticated, show only their templates
    if (user?.id) {
      query = query.eq('created_by_user_id', user.id);
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
    // Get user ID from header (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for database operations
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const supabase = supabaseAdmin;

    // Parse request body
    const body = await request.json();

    // Validate request body
    console.log('[POST /api/applications/templates] Request body:', body);
    console.log('[POST /api/applications/templates] User ID:', userId);

    const validationResult = createTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(
        '[POST /api/applications/templates] Validation error:',
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

    const insertData = {
      ...validationResult.data,
      created_by_user_id: userId,
    };
    console.log('[POST /api/applications/templates] Insert data:', insertData);

    const { data: template, error } = await supabase
      .from('application_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/applications/templates] Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
      });

      // Return more detailed error information
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create template: ${error.message}`,
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
