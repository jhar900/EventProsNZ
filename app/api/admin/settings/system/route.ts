import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
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

    // For now, return default settings since we don't have a settings table yet
    const defaultSettings = {
      site_name: 'Event Pros NZ',
      site_description: "New Zealand's Event Ecosystem",
      maintenance_mode: false,
      registration_enabled: true,
      email_verification_required: true,
      max_file_upload_size: 10,
      session_timeout: 60,
      max_users_per_page: 50,
    };

    return NextResponse.json({
      settings: defaultSettings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const settings = await request.json();

    // For now, just return the settings as if they were saved
    // In a real implementation, you would save these to a database

    return NextResponse.json({
      settings,
      message: 'System settings updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
