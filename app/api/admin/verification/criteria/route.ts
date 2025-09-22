import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CriterionSchema = z.object({
  user_type: z.enum(['event_manager', 'contractor']),
  criteria_name: z.string().min(1, 'Criteria name is required'),
  description: z.string().min(1, 'Description is required'),
  is_required: z.boolean(),
  validation_rule: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get verification criteria
    const { data: criteria, error: criteriaError } = await supabase
      .from('verification_criteria')
      .select('*')
      .order('user_type', { ascending: true })
      .order('is_required', { ascending: false });

    if (criteriaError) {
      console.error('Error fetching verification criteria:', criteriaError);
      return NextResponse.json(
        { error: 'Failed to fetch verification criteria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      criteria: criteria || [],
    });
  } catch (error) {
    console.error('Error in verification criteria API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const {
      user_type,
      criteria_name,
      description,
      is_required,
      validation_rule,
    } = CriterionSchema.parse(body);

    // Create verification criterion
    const { data: criterion, error: criterionError } = await supabase
      .from('verification_criteria')
      .insert({
        user_type,
        criteria_name,
        description,
        is_required,
        validation_rule: validation_rule || null,
      })
      .select()
      .single();

    if (criterionError) {
      console.error('Error creating verification criterion:', criterionError);
      return NextResponse.json(
        { error: 'Failed to create verification criterion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      criterion,
    });
  } catch (error) {
    console.error('Error in create verification criterion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
