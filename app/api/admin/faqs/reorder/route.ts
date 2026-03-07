import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const { supabase } = authResult;

    const body = await request.json();
    const { items } = body as {
      items: { id: string; display_order: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      );
    }

    // Update each FAQ's display_order
    const updates = items.map(({ id, display_order }) =>
      supabase.from('faqs').update({ display_order }).eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
