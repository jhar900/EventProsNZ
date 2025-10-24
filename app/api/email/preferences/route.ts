import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Get user email preferences
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('email_type', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch email preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || [],
    });
  } catch (error) {
    console.error('Get email preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId = user.id, preferences = [] } = body;

    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        {
          error: 'Preferences array is required',
        },
        { status: 400 }
      );
    }

    // Validate preferences structure
    for (const preference of preferences) {
      if (!preference.email_type || typeof preference.enabled !== 'boolean') {
        return NextResponse.json(
          {
            error: 'Invalid preference structure',
          },
          { status: 400 }
        );
      }
    }

    // Update or insert preferences
    const preferenceUpdates = preferences.map(preference => ({
      user_id: userId,
      email_type: preference.email_type,
      enabled: preference.enabled,
      frequency: preference.frequency || 'immediate',
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('email_preferences')
      .upsert(preferenceUpdates, {
        onConflict: 'user_id,email_type',
      });

    if (upsertError) {
      return NextResponse.json(
        {
          error: 'Failed to update email preferences',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      updatedCount: preferences.length,
    });
  } catch (error) {
    console.error('Update email preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId = user.id,
      emailType,
      enabled = true,
      frequency = 'immediate',
    } = body;

    if (!emailType) {
      return NextResponse.json(
        {
          error: 'Email type is required',
        },
        { status: 400 }
      );
    }

    // Create or update single preference
    const { error: upsertError } = await supabase
      .from('email_preferences')
      .upsert(
        {
          user_id: userId,
          email_type: emailType,
          enabled: enabled,
          frequency: frequency,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,email_type',
        }
      );

    if (upsertError) {
      return NextResponse.json(
        {
          error: 'Failed to update email preference',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email preference updated successfully',
    });
  } catch (error) {
    console.error('Update single email preference error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
