import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current privacy policy
    const { data: privacy, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('type', 'privacy_policy')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch privacy policy' },
        { status: 500 }
      );
    }

    if (!privacy) {
      return NextResponse.json(
        { error: 'Privacy policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: privacy.id,
        title: privacy.title,
        content: privacy.content,
        version: privacy.version,
        effective_date: privacy.effective_date,
        last_updated: privacy.updated_at,
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
