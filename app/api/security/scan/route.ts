import { NextRequest, NextResponse } from 'next/server';
import { SecurityAuditService } from '@/lib/security/security-audit-service';
import { withSecurity } from '@/lib/security/security-middleware';

export async function POST(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const { scanType = 'vulnerability', target = 'application' } =
        await req.json();

      const auditService = new SecurityAuditService();
      const scan = await auditService.runVulnerabilityScan(scanType, target);

      return NextResponse.json({
        success: true,
        scan,
        message: 'Security scan initiated',
      });
    } catch (error) {
      console.error('Security scan error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to initiate security scan' },
        { status: 500 }
      );
    }
  });
}
