import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { question, answer, category, is_active, image_url, video_url } =
      body;

    if (
      category &&
      !['general', 'contractors', 'event_managers'].includes(category)
    ) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;
    if (image_url !== undefined) updates.image_url = image_url || null;
    if (video_url !== undefined) updates.video_url = video_url || null;

    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ faq: data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const { supabase } = authResult;

    const { error } = await supabase.from('faqs').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
