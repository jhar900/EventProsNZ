import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS and get count of submitted requests
    const { count, error: countError } = await supabaseAdmin
      .from('feature_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted');

    console.log('Feature requests count query result:', {
      count,
      countError: countError?.message,
    });

    if (countError) {
      console.error(
        'Error fetching submitted feature requests count:',
        countError
      );
      return NextResponse.json(
        { error: 'Failed to fetch count', details: countError.message },
        { status: 500 }
      );
    }

    const finalCount = count || 0;
    console.log('Returning count:', finalCount);
    return NextResponse.json({ count: finalCount });
  } catch (error) {
    console.error('Error in GET /api/admin/feature-requests/count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
