import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
