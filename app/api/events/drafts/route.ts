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
        placeId: z.string().optional(),
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

    // Parse and validate request body
    const body = await request.json();
    console.log('Draft save request body:', JSON.stringify(body, null, 2));

    const validationResult = saveDraftSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
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

    const draftData = validationResult.data;

    // Check if user already has a draft
    const { data: existingDraft, error: checkError } = await supabase
      .from('event_drafts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let draft;

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, message: 'Failed to validate draft' },
        { status: 500 }
      );
    }

    if (existingDraft) {
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
        return NextResponse.json(
          { success: false, message: 'Failed to update draft' },
          { status: 500 }
        );
      }

      draft = updatedDraft;
    } else {
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
        return NextResponse.json(
          { success: false, message: 'Failed to create draft' },
          { status: 500 }
        );
      }

      draft = newDraft;
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
