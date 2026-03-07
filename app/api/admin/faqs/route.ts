import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const { supabase } = authResult;

    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ faqs: data || [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: 'question, answer, and category are required' },
        { status: 400 }
      );
    }

    if (!['general', 'contractors', 'event_managers'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Get max display_order for category
    const { data: maxOrderData } = await supabase
      .from('faqs')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder =
      maxOrderData && maxOrderData.length > 0
        ? maxOrderData[0].display_order + 1
        : 0;

    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question,
        answer,
        category,
        is_active: is_active ?? true,
        image_url: image_url || null,
        video_url: video_url || null,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ faq: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
