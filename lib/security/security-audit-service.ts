import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface SecurityAudit {
  id: string;
  event_type: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  resolved_at?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

export interface VulnerabilityScan {
  id: string;
  scan_type: string;
  target: string;
  vulnerabilities: Vulnerability[];
  scan_date: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve_id?: string;
  cvss_score?: number;
  affected_components: string[];
  remediation: string;
  references: string[];
}

export interface SecurityReport {
  totalAudits: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  vulnerabilityCount: number;
  complianceScore: number;
  lastScanDate: Date;
}

export class SecurityAuditService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Create security audit entry
   */
  async createAudit(
    eventType: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<SecurityAudit> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const audit: SecurityAudit = {
      id: auditId,
      event_type: eventType,
      details,
      severity,
      created_at: new Date(),
      status: 'open',
    };

    await this.supabase.from('security_audit').insert({
      id: audit.id,
      event_type: audit.event_type,
      details: audit.details,
      severity: audit.severity,
      created_at: audit.created_at.toISOString(),
      status: audit.status,
    });

    // Log audit creation
    await this.auditLogger.logEvent({
      action: 'security_audit_created',
      resource: 'security_audit',
      resourceId: auditId,
      details: { eventType, severity },
    });

    return audit;
  }

  /**
   * Get security audits
   */
  async getSecurityAudits(
    severity?: string,
    status?: string,
    limit: number = 100
  ): Promise<SecurityAudit[]> {
    let query = this.supabase
      .from('security_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map(audit => ({
      id: audit.id,
      event_type: audit.event_type,
      details: audit.details,
      severity: audit.severity,
      created_at: new Date(audit.created_at),
      resolved_at: audit.resolved_at ? new Date(audit.resolved_at) : undefined,
      status: audit.status,
    }));
  }

  /**
   * Update audit status
   */
  async updateAuditStatus(
    auditId: string,
    status: 'open' | 'investigating' | 'resolved' | 'false_positive',
    resolution?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    await this.supabase
      .from('security_audit')
      .update(updateData)
      .eq('id', auditId);

    // Log status update
    await this.auditLogger.logEvent({
      action: 'security_audit_status_updated',
      resource: 'security_audit',
      resourceId: auditId,
      details: { status, resolution },
    });
  }

  /**
   * Run vulnerability scan
   */
  async runVulnerabilityScan(
    scanType: string,
    target: string
  ): Promise<VulnerabilityScan> {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const scan: VulnerabilityScan = {
      id: scanId,
      scan_type: scanType,
      target,
      vulnerabilities: [],
      scan_date: new Date(),
      status: 'pending',
    };

    // Store scan record
    await this.supabase.from('vulnerability_scans').insert({
      id: scan.id,
      scan_type: scan.scan_type,
      target: scan.target,
      vulnerabilities: scan.vulnerabilities,
      scan_date: scan.scan_date.toISOString(),
      status: scan.status,
    });

    // Start scan process (simplified)
    await this.performVulnerabilityScan(scan);

    return scan;
  }

  /**
   * Perform vulnerability scan
   */
  private async performVulnerabilityScan(
    scan: VulnerabilityScan
  ): Promise<void> {
    try {
      // Update status to running
      await this.supabase
        .from('vulnerability_scans')
        .update({ status: 'running' })
        .eq('id', scan.id);

      // Simulate vulnerability detection
      const vulnerabilities = await this.detectVulnerabilities(scan.target);

      scan.vulnerabilities = vulnerabilities;
      scan.status = 'completed';

      // Update scan with results
      await this.supabase
        .from('vulnerability_scans')
        .update({
          vulnerabilities: scan.vulnerabilities,
          status: scan.status,
        })
        .eq('id', scan.id);

      // Create audit entries for critical vulnerabilities
      for (const vuln of vulnerabilities) {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          await this.createAudit(
            'vulnerability_detected',
            {
              vulnerability: vuln,
              scanId: scan.id,
            },
            vuln.severity
          );
        }
      }
    } catch (error) {
      scan.status = 'failed';
      await this.supabase
        .from('vulnerability_scans')
        .update({ status: 'failed' })
        .eq('id', scan.id);
    }
  }

  /**
   * Detect vulnerabilities (simplified implementation)
   */
  private async detectVulnerabilities(
    target: string
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Simulate common vulnerability checks
    const commonVulns = [
      {
        title: 'SQL Injection Vulnerability',
        description: 'Potential SQL injection in database queries',
        severity: 'high' as const,
        cve_id: 'CVE-2023-1234',
        cvss_score: 8.5,
        affected_components: ['database', 'api'],
        remediation: 'Use parameterized queries',
        references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
      },
      {
        title: 'Cross-Site Scripting (XSS)',
        description: 'Unescaped user input in HTML output',
        severity: 'medium' as const,
        cve_id: 'CVE-2023-1235',
        cvss_score: 6.1,
        affected_components: ['frontend', 'api'],
        remediation: 'Sanitize and escape user input',
        references: ['https://owasp.org/www-community/attacks/xss/'],
      },
      {
        title: 'Insecure Direct Object Reference',
        description: 'Direct access to resources without authorization',
        severity: 'medium' as const,
        cve_id: 'CVE-2023-1236',
        cvss_score: 5.3,
        affected_components: ['api', 'database'],
        remediation: 'Implement proper authorization checks',
        references: [
          'https://owasp.org/www-community/attacks/Insecure_Direct_Object_References',
        ],
      },
    ];

    // Randomly select vulnerabilities for demo
    const numVulns = Math.floor(Math.random() * 3);
    for (let i = 0; i < numVulns; i++) {
      const vuln = commonVulns[Math.floor(Math.random() * commonVulns.length)];
      vulnerabilities.push({
        id: `vuln_${Date.now()}_${i}`,
        ...vuln,
      });
    }

    return vulnerabilities;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(): Promise<SecurityReport> {
    const { data: audits } = await this.supabase
      .from('security_audit')
      .select('severity, status, created_at')
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: scans } = await this.supabase
      .from('vulnerability_scans')
      .select('scan_date, status')
      .eq('status', 'completed')
      .order('scan_date', { ascending: false })
      .limit(1);

    const totalAudits = audits?.length || 0;
    const openIssues = audits?.filter(a => a.status === 'open').length || 0;
    const resolvedIssues =
      audits?.filter(a => a.status === 'resolved').length || 0;
    const criticalIssues =
      audits?.filter(a => a.severity === 'critical').length || 0;

    const vulnerabilityCount =
      audits?.filter(a => a.event_type === 'vulnerability_detected').length ||
      0;

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(audits || []);

    const lastScanDate =
      scans && scans.length > 0 ? new Date(scans[0].scan_date) : new Date();

    return {
      totalAudits,
      openIssues,
      resolvedIssues,
      criticalIssues,
      vulnerabilityCount,
      complianceScore,
      lastScanDate,
    };
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(audits: any[]): number {
    const totalAudits = audits.length;
    if (totalAudits === 0) return 100;

    const criticalIssues = audits.filter(a => a.severity === 'critical').length;
    const highIssues = audits.filter(a => a.severity === 'high').length;
    const mediumIssues = audits.filter(a => a.severity === 'medium').length;
    const lowIssues = audits.filter(a => a.severity === 'low').length;

    // Weighted scoring
    const score = Math.max(
      0,
      100 -
        criticalIssues * 20 -
        highIssues * 10 -
        mediumIssues * 5 -
        lowIssues * 1
    );
    return Math.round(score);
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(limit: number = 50): Promise<SecurityAudit[]> {
    return await this.getSecurityAudits(undefined, 'open', limit);
  }

  /**
   * Resolve security issue
   */
  async resolveSecurityIssue(
    auditId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    await this.updateAuditStatus(auditId, 'resolved', resolution);

    // Log resolution
    await this.auditLogger.logEvent({
      action: 'security_issue_resolved',
      resource: 'security_audit',
      resourceId: auditId,
      details: { resolution, resolvedBy },
    });
  }

  /**
   * Monitor security metrics
   */
  async monitorSecurityMetrics(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    openIssues: number;
    avgResolutionTime: number;
  }> {
    const { data: events } = await this.supabase
      .from('security_audit')
      .select('severity, status, created_at, resolved_at')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const totalEvents = events?.length || 0;
    const criticalEvents =
      events?.filter(e => e.severity === 'critical').length || 0;
    const openIssues = events?.filter(e => e.status === 'open').length || 0;

    // Calculate average resolution time
    const resolvedEvents =
      events?.filter(e => e.status === 'resolved' && e.resolved_at) || [];
    let avgResolutionTime = 0;

    if (resolvedEvents.length > 0) {
      const totalResolutionTime = resolvedEvents.reduce((sum, event) => {
        const created = new Date(event.created_at).getTime();
        const resolved = new Date(event.resolved_at).getTime();
        return sum + (resolved - created);
      }, 0);

      avgResolutionTime =
        totalResolutionTime / resolvedEvents.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      totalEvents,
      criticalEvents,
      openIssues,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
    };
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldAudits(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await this.supabase
      .from('security_audit')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    // Log cleanup
    await this.auditLogger.logEvent({
      action: 'security_audit_cleanup',
      resource: 'security_audit',
      details: { retentionDays, cutoffDate: cutoffDate.toISOString() },
    });
  }
}
