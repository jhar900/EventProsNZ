import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateCriterionSchema = z.object({
  user_type: z.enum(['event_manager', 'contractor']).optional(),
  criteria_name: z.string().min(1, 'Criteria name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  is_required: z.boolean().optional(),
  validation_rule: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const updateData = UpdateCriterionSchema.parse(body);

    // Update verification criterion
    const { data: criterion, error: criterionError } = await supabase
      .from('verification_criteria')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (criterionError) {
      return NextResponse.json(
        { error: 'Failed to update verification criterion' },
        { status: 500 }
      );
    }

    if (!criterion) {
      return NextResponse.json(
        { error: 'Verification criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      criterion,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete verification criterion
    const { error: criterionError } = await supabase
      .from('verification_criteria')
      .delete()
      .eq('id', id);

    if (criterionError) {
      return NextResponse.json(
        { error: 'Failed to delete verification criterion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
