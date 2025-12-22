import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();

    // Get total tokens count
    const { count: totalTokens, error: totalError } = await supabase
      .from('api_access_tokens')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total tokens count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch total tokens count' },
        { status: 500 }
      );
    }

    // Get active tokens count
    const { count: activeTokens, error: activeError } = await supabase
      .from('api_access_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (activeError) {
      console.error('Error fetching active tokens count:', activeError);
      return NextResponse.json(
        { error: 'Failed to fetch active tokens count' },
        { status: 500 }
      );
    }

    // Get expired tokens count
    const { count: expiredTokens, error: expiredError } = await supabase
      .from('api_access_tokens')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    if (expiredError) {
      console.error('Error fetching expired tokens count:', expiredError);
      return NextResponse.json(
        { error: 'Failed to fetch expired tokens count' },
        { status: 500 }
      );
    }

    // Get API usage stats (this would typically come from a separate analytics table)
    // For now, we'll return placeholder values
    const stats = {
      total_tokens: totalTokens || 0,
      active_tokens: activeTokens || 0,
      expired_tokens: expiredTokens || 0,
      total_requests: 0, // Would come from analytics
      rate_limited_requests: 0, // Would come from analytics
    };

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('Error in API tokens stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
