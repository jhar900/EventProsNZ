import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ProfileCompletionService } from '@/lib/onboarding/profile-completion';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header (client-side sends this)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      // Fallback: try to get user from auth using middleware client
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Use service role client for the completion check
      const completionService = new ProfileCompletionService(supabaseAdmin);
      const status = await completionService.getProfileCompletionStatus(
        user.id
      );
      return NextResponse.json({
        success: true,
        status,
      });
    }

    // Use service role client to ensure we can access contractor_onboarding_status
    const completionService = new ProfileCompletionService(supabaseAdmin);
    const status = await completionService.getProfileCompletionStatus(userId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check profile completion status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const completionService = new ProfileCompletionService();
    await completionService.updateProfileCompletionStatus(user.id);

    return NextResponse.json({
      success: true,
      message: 'Profile completion status updated',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update profile completion status',
      },
      { status: 500 }
    );
  }
}
