import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { SaveEventDraftRequest, EventDraftResponse } from '@/types/events';

// Validation schemas
const saveDraftSchema = z.object({
  eventData: z.object({
    eventType: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    eventDate: z.string().optional(),
    durationHours: z.number().optional(),
    attendeeCount: z.number().optional(),
    location: z
      .object({
        address: z.string(),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        placeId: z
          .union([z.string(), z.number()])
          .transform(val => String(val))
          .optional()
          .nullable(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    specialRequirements: z.string().optional(),
    serviceRequirements: z
      .array(
        z.object({
          category: z.string(),
          type: z.string(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']),
          estimatedBudget: z.number().min(0).optional(),
          isRequired: z.boolean(),
        })
      )
      .optional(),
    budgetPlan: z
      .object({
        totalBudget: z.number().min(0),
        breakdown: z.record(
          z.object({
            amount: z.number().min(0),
            percentage: z.number().min(0).max(100),
          })
        ),
        recommendations: z
          .array(
            z.object({
              category: z.string(),
              suggestedAmount: z.number().min(0),
              reason: z.string(),
              confidence: z.number().min(0).max(1),
            })
          )
          .optional()
          .default([]),
      })
      .optional(),
  }),
  stepNumber: z.number().min(1).max(4),
});

// POST /api/events/drafts - Save event draft
export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/events/drafts START ===');

    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');
    console.log('User ID from header:', userId);

    let supabase;
    if (userId) {
      console.log('Using service role client with userId from header');
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
    } else {
      console.log('Using middleware client for cookie-based auth');
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      console.log('Auth result:', { userId: user?.id, authError });

      if (authError || !user) {
        console.error('Auth failed:', authError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: authError?.message,
          },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      userId = user.id;
    }

    console.log('Authentication successful, userId:', userId);

    // Parse and validate request body
    const body = await request.json();
    console.log('Draft save request body:', JSON.stringify(body, null, 2));

    const validationResult = saveDraftSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error);
      const errors = validationResult.error?.errors || [];
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: errors.map(err => ({
            field: err.path?.join('.') || 'unknown',
            message: err.message || 'Validation error',
          })),
        },
        { status: 400 }
      );
    }

    const draftData = validationResult.data;

    // Check if user already has a draft
    console.log('Checking for existing draft for userId:', userId);
    const { data: existingDraft, error: checkError } = await supabase
      .from('event_drafts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Draft check result:', { existingDraft, checkError });

    let draft;

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking draft:', checkError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to validate draft',
          error: checkError.message,
          code: checkError.code,
        },
        { status: 500 }
      );
    }

    if (existingDraft) {
      console.log('Updating existing draft:', existingDraft.id);
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('event_drafts')
        .update({
          event_data: draftData.eventData,
          step_number: draftData.stepNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating draft:', updateError);
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to update draft',
            error: updateError.message,
            details: updateError.details,
            code: updateError.code,
          },
          { status: 500 }
        );
      }

      draft = updatedDraft;
      console.log('Draft updated successfully');
    } else {
      console.log('Creating new draft');
      // Create new draft
      const { data: newDraft, error: createError } = await supabase
        .from('event_drafts')
        .insert({
          user_id: userId,
          event_data: draftData.eventData,
          step_number: draftData.stepNumber,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating draft:', createError);
        console.error('Draft error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
        });
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to create draft',
            error: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
          },
          { status: 500 }
        );
      }

      draft = newDraft;
      console.log('Draft created successfully');
    }

    const response: EventDraftResponse = {
      draft,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/events/drafts:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// GET /api/events/drafts - Get user's event drafts
export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      userId = user.id;
    }

    // Get user's drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('event_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (draftsError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch drafts' },
        { status: 500 }
      );
    }

    const response: EventDraftResponse = {
      draft: drafts?.[0] || null, // Return the most recent draft
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/drafts - Delete user's event draft
export async function DELETE(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    if (userId) {
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      userId = user.id;
    }

    // Delete user's draft
    const { error: deleteError } = await supabase
      .from('event_drafts')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
