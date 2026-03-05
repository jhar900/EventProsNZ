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

    // For now, return default security settings
    const defaultSettings = {
      password_min_length: 8,
      password_require_special_chars: true,
      password_require_numbers: true,
      password_require_uppercase: true,
      max_login_attempts: 5,
      lockout_duration: 15,
      two_factor_required: false,
      session_security: true,
      ip_whitelist_enabled: false,
      ip_whitelist: '',
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
      message: 'Security settings updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
