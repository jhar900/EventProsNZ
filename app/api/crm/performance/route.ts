import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { getPerformanceMetrics } from '@/lib/monitoring/performance-metrics';

// GET /api/crm/performance - Get CRM performance metrics
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        return await getPerformanceMetrics(request);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch performance metrics' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
