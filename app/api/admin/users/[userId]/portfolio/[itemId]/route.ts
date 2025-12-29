import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId, itemId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify the portfolio item belongs to this user
    const { data: existingItem, error: checkError } = await adminSupabase
      .from('portfolio')
      .select('user_id')
      .eq('id', itemId)
      .single();

    if (checkError || !existingItem) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      );
    }

    if (existingItem.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the portfolio item
    const { error: deleteError } = await adminSupabase
      .from('portfolio')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting portfolio item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio item' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in DELETE /api/admin/users/[userId]/portfolio/[itemId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
