import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current terms of service
    const { data: terms, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('type', 'terms_of_service')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch terms of service' },
        { status: 500 }
      );
    }

    if (!terms) {
      return NextResponse.json(
        { error: 'Terms of service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: terms.id,
        title: terms.title,
        content: terms.content,
        version: terms.version,
        effective_date: terms.effective_date,
        last_updated: terms.updated_at,
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
