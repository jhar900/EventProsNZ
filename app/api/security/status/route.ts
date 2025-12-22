import { NextRequest, NextResponse } from 'next/server';
import { SecurityAuditService } from '@/lib/security/security-audit-service';
import { IncidentResponseService } from '@/lib/security/incident-response-service';
import { APISecurityService } from '@/lib/security/api-security-service';
import { withSecurity } from '@/lib/security/security-middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const auditService = new SecurityAuditService();
      const incidentService = new IncidentResponseService();
      const apiSecurityService = new APISecurityService();

      // Initialize API security service
      await apiSecurityService.initialize();

      // Get security metrics
      const [auditReport, incidentMetrics, apiStatus] = await Promise.all([
        auditService.generateSecurityReport(),
        incidentService.getIncidentMetrics(),
        apiSecurityService.getSecurityStatus(),
      ]);

      const securityStatus = {
        overall: {
          complianceScore: auditReport.complianceScore,
          totalIssues: auditReport.openIssues,
          criticalIssues: auditReport.criticalIssues,
          lastScanDate: auditReport.lastScanDate,
        },
        audits: auditReport,
        incidents: incidentMetrics,
        api: apiStatus,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        status: securityStatus,
      });
    } catch (error) {
      console.error('Security status error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve security status' },
        { status: 500 }
      );
    }
  });
}
