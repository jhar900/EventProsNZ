import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProfileCompletionService } from '@/lib/onboarding/profile-completion';

export async function GET(request: NextRequest) {
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
    const status = await completionService.getProfileCompletionStatus(user.id);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Profile completion check error:', error);
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
    console.error('Profile completion update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile completion status',
      },
      { status: 500 }
    );
  }
}
