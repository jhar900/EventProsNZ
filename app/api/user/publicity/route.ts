import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Get business profile for this user
    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .select('community_goals, questions')
        .eq('user_id', userId)
        .single();

    if (businessProfileError) {
      // If profile not found, return null instead of error
      if (businessProfileError.code === 'PGRST116') {
        return NextResponse.json({ publicity: null });
      }

      // If columns don't exist, return default values
      if (
        businessProfileError.message?.includes('community_goals') ||
        businessProfileError.message?.includes('questions') ||
        businessProfileError.message?.includes('column')
      ) {
        return NextResponse.json({
          publicity: {
            community_goals: '',
            questions: '',
          },
        });
      }

      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: businessProfileError.message,
        },
        { status: 404 }
      );
    }

    if (!businessProfile) {
      return NextResponse.json({ publicity: null });
    }

    return NextResponse.json({
      publicity: {
        community_goals: businessProfile.community_goals || '',
        questions: businessProfile.questions || '',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/publicity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
