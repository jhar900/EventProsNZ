import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; serviceId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId, serviceId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const businessProfileId = businessProfile.id;

    // Verify the service belongs to this business profile
    const { data: existingService, error: checkError } = await adminSupabase
      .from('services')
      .select('business_profile_id')
      .eq('id', serviceId)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (existingService.business_profile_id !== businessProfileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the service
    const { error: deleteError } = await adminSupabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in DELETE /api/admin/users/[userId]/services/[serviceId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
