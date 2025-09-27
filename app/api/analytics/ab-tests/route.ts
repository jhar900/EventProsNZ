import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateABTestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  test_type: z.enum([
    'search_algorithm',
    'filter_presentation',
    'result_ranking',
    'ui_ux',
    'performance',
  ]),
  control_config: z.record(z.any()).default({}),
  variant_config: z.record(z.any()).default({}),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all A/B tests
    const { data: tests, error: testsError } = await supabase
      .from('ab_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (testsError) {
      return NextResponse.json(
        { error: 'Failed to fetch A/B tests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tests: tests || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateABTestSchema.parse(body);

    // Create new A/B test
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .insert([
        {
          name: validatedData.name,
          description: validatedData.description,
          test_type: validatedData.test_type,
          control_config: validatedData.control_config,
          variant_config: validatedData.variant_config,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (testError) {
      return NextResponse.json(
        { error: 'Failed to create A/B test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      test: test,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
