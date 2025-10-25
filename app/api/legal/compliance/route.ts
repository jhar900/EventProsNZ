import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get all compliance status records
    const { data: compliance, error } = await supabase
      .from('compliance_status')
      .select('*')
      .order('type');

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch compliance status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: compliance || [],
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
