import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  GetEventTemplatesRequest,
  CreateEventTemplateRequest,
  EventTemplateResponse,
  EVENT_TYPES,
} from '@/types/events';

// Validation schemas
const getTemplatesSchema = z.object({
  eventType: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
});

const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Name too long'),
  eventType: z.enum(Object.values(EVENT_TYPES) as [string, ...string[]]),
  templateData: z.object({
    serviceRequirements: z.array(
      z.object({
        category: z.string(),
        type: z.string(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']),
        estimatedBudget: z.number().min(0).optional(),
        isRequired: z.boolean(),
      })
    ),
    budgetBreakdown: z.record(z.number().min(0).max(100)),
    defaultSettings: z
      .object({
        durationHours: z.number().min(1).max(168).optional(),
        attendeeCount: z.number().min(1).max(10000).optional(),
      })
      .optional(),
  }),
  isPublic: z.boolean().optional().default(false),
});

// GET /api/events/templates - Get event templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { eventType, isPublic } = validationResult.data;

    // Build query
    let query = supabase
      .from('event_templates')
      .select(
        `
        *,
        profiles!event_templates_created_by_fkey (
          first_name,
          last_name
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (isPublic !== undefined) {
      if (isPublic) {
        // Show public templates
        query = query.eq('is_public', true);
      } else {
        // Show user's own templates
        query = query.eq('created_by', user.id);
      }
    } else {
      // Show both public templates and user's own templates
      query = query.or(`is_public.eq.true,created_by.eq.${user.id}`);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const response: EventTemplateResponse = {
      templates: templates || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/events/templates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/templates - Create a new event template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Check if template name already exists for this user
    const { data: existingTemplate, error: checkError } = await supabase
      .from('event_templates')
      .select('id')
      .eq('name', templateData.name)
      .eq('created_by', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing template:', checkError);
      return NextResponse.json(
        { success: false, message: 'Failed to validate template' },
        { status: 500 }
      );
    }

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template name already exists' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('event_templates')
      .insert({
        name: templateData.name,
        event_type: templateData.eventType,
        template_data: templateData.templateData,
        is_public: templateData.isPublic,
        created_by: user.id,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return NextResponse.json(
        { success: false, message: 'Failed to create template' },
        { status: 500 }
      );
    }

    const response: EventTemplateResponse = {
      templates: [template],
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events/templates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
