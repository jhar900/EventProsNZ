import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const serviceId = params.id;

    // Get business profile ID for this user to verify ownership
    const { data: businessProfile, error: profileError } = await supabaseAdmin
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
    const { data: existingService, error: checkError } = await supabaseAdmin
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

    // Delete service
    const { error: deleteError } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete service', details: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/profile/me/services/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
