import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current cookie policy
    const { data: cookies, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('type', 'cookie_policy')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch cookie policy' },
        { status: 500 }
      );
    }

    if (!cookies) {
      return NextResponse.json(
        { error: 'Cookie policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cookies.id,
        title: cookies.title,
        content: cookies.content,
        version: cookies.version,
        effective_date: cookies.effective_date,
        last_updated: cookies.updated_at,
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
