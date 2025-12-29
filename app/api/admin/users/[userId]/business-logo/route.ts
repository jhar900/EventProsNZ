import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify user has a business profile
    const { data: businessProfile, error: businessProfileError } =
      await adminSupabase
        .from('business_profiles')
        .select('id, user_id')
        .eq('user_id', userId)
        .single();

    if (businessProfileError || !businessProfile) {
      console.error(
        'Business profile verification error:',
        businessProfileError
      );
      return NextResponse.json(
        {
          error:
            'Business profile not found. Please create a business profile first.',
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `business-logos/${fileName}`;

    // Upload file to Supabase Storage
    console.log('Uploading business logo to path:', filePath);
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('portfolio-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from('portfolio-photos').getPublicUrl(filePath);

    // Update business profile with new logo URL
    console.log('Updating business profile with logo URL:', publicUrl);
    const { error: updateError } = await adminSupabase
      .from('business_profiles')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Business profile update error:', updateError);
      // If update fails, clean up the uploaded file
      await adminSupabase.storage.from('portfolio-photos').remove([filePath]);
      return NextResponse.json(
        {
          error: 'Failed to update business profile',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('Business profile updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Business logo uploaded successfully',
      logo_url: publicUrl,
    });
  } catch (error) {
    console.error('Business logo upload error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get current logo URL from business profile
    const { data: businessProfile, error: currentProfileError } =
      await adminSupabase
        .from('business_profiles')
        .select('logo_url')
        .eq('user_id', userId)
        .single();

    if (currentProfileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    if (!businessProfile.logo_url) {
      return NextResponse.json({ error: 'No logo to delete' }, { status: 404 });
    }

    // Extract file path from URL
    const url = new URL(businessProfile.logo_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // Get 'business-logos/filename.ext'

    // Delete file from storage
    const { error: deleteError } = await adminSupabase.storage
      .from('portfolio-photos')
      .remove([filePath]);

    if (deleteError) {
      console.error('File deletion error:', deleteError);
      // Continue with profile update even if file deletion fails
    }

    // Update business profile to remove logo URL
    const { error: updateError } = await adminSupabase
      .from('business_profiles')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Failed to update business profile',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business logo deleted successfully',
    });
  } catch (error) {
    console.error('Business logo delete error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
