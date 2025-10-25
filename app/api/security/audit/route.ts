import { NextRequest, NextResponse } from 'next/server';
import { SecurityAuditService } from '@/lib/security/security-audit-service';
import { withSecurity } from '@/lib/security/security-middleware';

export async function GET(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const severity = searchParams.get('severity');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '100');

      const auditService = new SecurityAuditService();
      const audits = await auditService.getSecurityAudits(
        severity || undefined,
        status || undefined,
        limit
      );

      return NextResponse.json({
        success: true,
        audits,
        count: audits.length,
      });
    } catch (error) {
      console.error('Audit retrieval error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve audit logs' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const { eventType, details, severity = 'medium' } = await req.json();

      if (!eventType) {
        return NextResponse.json(
          { success: false, message: 'Event type is required' },
          { status: 400 }
        );
      }

      const auditService = new SecurityAuditService();
      const audit = await auditService.createAudit(
        eventType,
        details,
        severity
      );

      return NextResponse.json({
        success: true,
        audit,
      });
    } catch (error) {
      console.error('Audit creation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create audit entry' },
        { status: 500 }
      );
    }
  });
}
