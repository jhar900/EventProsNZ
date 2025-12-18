import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    console.log('Received user ID for business logo upload:', userId);

    // Use supabaseAdmin which bypasses RLS and has full access
    // Verify user has a business profile
    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
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

    // Upload file to Supabase Storage using admin client (bypasses RLS)
    console.log('Uploading business logo to path:', filePath);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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
    } = supabaseAdmin.storage.from('portfolio-photos').getPublicUrl(filePath);

    // Update business profile with new logo URL
    console.log('Updating business profile with logo URL:', publicUrl);
    const { error: updateError } = await supabaseAdmin
      .from('business_profiles')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Business profile update error:', updateError);
      // If update fails, clean up the uploaded file
      await supabaseAdmin.storage.from('portfolio-photos').remove([filePath]);
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
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Use supabaseAdmin which bypasses RLS and has full access
    // Get current logo URL from business profile
    const { data: businessProfile, error: currentProfileError } =
      await supabaseAdmin
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
    const { error: deleteError } = await supabaseAdmin.storage
      .from('portfolio-photos')
      .remove([filePath]);

    if (deleteError) {
      console.error('File deletion error:', deleteError);
      // Continue with profile update even if file deletion fails
    }

    // Update business profile to remove logo URL
    const { error: updateError } = await supabaseAdmin
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
    console.error('Business logo deletion error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
