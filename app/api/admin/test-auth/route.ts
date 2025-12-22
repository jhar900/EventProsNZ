import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);

    return NextResponse.json({
      success: authResult.success,
      hasToken: !!request.headers.get('x-admin-token'),
      tokenValue: request.headers.get('x-admin-token'),
      expectedToken:
        process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros',
      tokensMatch:
        request.headers.get('x-admin-token') ===
        (process.env.ADMIN_ACCESS_TOKEN || 'admin-secure-token-2024-eventpros'),
      userId: authResult.user?.id,
      error: authResult.response
        ? await authResult.response
            .json()
            .catch(() => ({ error: 'Unknown error' }))
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
