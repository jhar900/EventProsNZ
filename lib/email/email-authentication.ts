import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface SPFRecord {
  domain: string;
  record: string;
  isValid: boolean;
  lastChecked: string;
  errors?: string[];
}

export interface DKIMRecord {
  domain: string;
  selector: string;
  publicKey: string;
  isValid: boolean;
  lastChecked: string;
  errors?: string[];
}

export interface DMARCRecord {
  domain: string;
  policy: 'none' | 'quarantine' | 'reject';
  percentage: number;
  rua: string;
  ruf: string;
  isValid: boolean;
  lastChecked: string;
  errors?: string[];
}

export interface AuthenticationStatus {
  domain: string;
  spf: SPFRecord;
  dkim: DKIMRecord;
  dmarc: DMARCRecord;
  overallStatus: 'pass' | 'fail' | 'partial';
  lastChecked: string;
}

export interface AuthenticationRecommendation {
  type: 'spf' | 'dkim' | 'dmarc';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
}

export class EmailAuthenticationService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Validate SPF record for a domain
   */
  async validateSPFRecord(domain: string): Promise<SPFRecord> {
    try {
      // In a real implementation, you would query DNS records
      // For now, we'll simulate the validation
      const spfRecord = await this.getSPFRecord(domain);

      const validation = this.validateSPFSyntax(spfRecord);

      const record: SPFRecord = {
        domain,
        record: spfRecord,
        isValid: validation.isValid,
        lastChecked: new Date().toISOString(),
        errors: validation.errors,
      };

      // Store validation result
      await this.storeAuthenticationResult('spf', domain, record);

      return record;
    } catch (error) {
      console.error('Error validating SPF record:', error);
      throw error;
    }
  }

  /**
   * Validate DKIM record for a domain
   */
  async validateDKIMRecord(
    domain: string,
    selector: string = 'default'
  ): Promise<DKIMRecord> {
    try {
      // In a real implementation, you would query DNS records
      const dkimRecord = await this.getDKIMRecord(domain, selector);

      const validation = this.validateDKIMSyntax(dkimRecord);

      const record: DKIMRecord = {
        domain,
        selector,
        publicKey: dkimRecord,
        isValid: validation.isValid,
        lastChecked: new Date().toISOString(),
        errors: validation.errors,
      };

      // Store validation result
      await this.storeAuthenticationResult('dkim', domain, record);

      return record;
    } catch (error) {
      console.error('Error validating DKIM record:', error);
      throw error;
    }
  }

  /**
   * Validate DMARC record for a domain
   */
  async validateDMARCRecord(domain: string): Promise<DMARCRecord> {
    try {
      // In a real implementation, you would query DNS records
      const dmarcRecord = await this.getDMARCRecord(domain);

      const validation = this.validateDMARCSyntax(dmarcRecord);

      const record: DMARCRecord = {
        domain,
        policy: validation.policy,
        percentage: validation.percentage,
        rua: validation.rua,
        ruf: validation.ruf,
        isValid: validation.isValid,
        lastChecked: new Date().toISOString(),
        errors: validation.errors,
      };

      // Store validation result
      await this.storeAuthenticationResult('dmarc', domain, record);

      return record;
    } catch (error) {
      console.error('Error validating DMARC record:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive authentication status for a domain
   */
  async getAuthenticationStatus(domain: string): Promise<AuthenticationStatus> {
    try {
      const [spf, dkim, dmarc] = await Promise.all([
        this.validateSPFRecord(domain),
        this.validateDKIMRecord(domain),
        this.validateDMARCRecord(domain),
      ]);

      const overallStatus = this.calculateOverallStatus(spf, dkim, dmarc);

      const status: AuthenticationStatus = {
        domain,
        spf,
        dkim,
        dmarc,
        overallStatus,
        lastChecked: new Date().toISOString(),
      };

      // Store overall status
      await this.storeAuthenticationResult('overall', domain, status);

      return status;
    } catch (error) {
      console.error('Error getting authentication status:', error);
      throw error;
    }
  }

  /**
   * Get authentication recommendations
   */
  async getAuthenticationRecommendations(
    domain: string
  ): Promise<AuthenticationRecommendation[]> {
    try {
      const status = await this.getAuthenticationStatus(domain);
      const recommendations: AuthenticationRecommendation[] = [];

      // SPF recommendations
      if (!status.spf.isValid) {
        recommendations.push({
          type: 'spf',
          priority: 'high',
          title: 'SPF Record Missing or Invalid',
          description:
            'SPF record is missing or has syntax errors, which can affect email deliverability.',
          action:
            'Add or fix SPF record: v=spf1 include:_spf.sendgrid.net ~all',
          expectedImpact: 'Improve email authentication and reduce spam score.',
        });
      }

      // DKIM recommendations
      if (!status.dkim.isValid) {
        recommendations.push({
          type: 'dkim',
          priority: 'high',
          title: 'DKIM Record Missing or Invalid',
          description:
            'DKIM record is missing or has syntax errors, which can affect email authentication.',
          action:
            'Add or fix DKIM record with proper public key from SendGrid.',
          expectedImpact: 'Improve email authentication and reduce spam score.',
        });
      }

      // DMARC recommendations
      if (!status.dmarc.isValid) {
        recommendations.push({
          type: 'dmarc',
          priority: 'critical',
          title: 'DMARC Record Missing or Invalid',
          description:
            'DMARC record is missing or has syntax errors, which can affect email authentication and deliverability.',
          action:
            'Add or fix DMARC record: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
          expectedImpact:
            'Improve email authentication, reduce spam score, and protect against spoofing.',
        });
      }

      // Policy recommendations
      if (status.dmarc.isValid && status.dmarc.policy === 'none') {
        recommendations.push({
          type: 'dmarc',
          priority: 'medium',
          title: 'DMARC Policy Too Lenient',
          description:
            'DMARC policy is set to "none" which provides minimal protection.',
          action:
            'Consider upgrading to "quarantine" or "reject" policy for better protection.',
          expectedImpact:
            'Improve email security and reduce spoofing attempts.',
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting authentication recommendations:', error);
      throw error;
    }
  }

  /**
   * Get SPF record from DNS
   */
  private async getSPFRecord(domain: string): Promise<string> {
    // In a real implementation, you would query DNS records
    // For now, we'll return a mock record
    return `v=spf1 include:_spf.sendgrid.net ~all`;
  }

  /**
   * Get DKIM record from DNS
   */
  private async getDKIMRecord(
    domain: string,
    selector: string
  ): Promise<string> {
    // In a real implementation, you would query DNS records
    // For now, we'll return a mock record
    return `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`;
  }

  /**
   * Get DMARC record from DNS
   */
  private async getDMARCRecord(domain: string): Promise<string> {
    // In a real implementation, you would query DNS records
    // For now, we'll return a mock record
    return `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}`;
  }

  /**
   * Validate SPF syntax
   */
  private validateSPFSyntax(record: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!record.startsWith('v=spf1')) {
      errors.push('SPF record must start with "v=spf1"');
    }

    if (!record.includes('include:_spf.sendgrid.net')) {
      errors.push('SPF record should include SendGrid SPF record');
    }

    if (!record.includes('~all') && !record.includes('-all')) {
      errors.push('SPF record should end with "~all" or "-all"');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate DKIM syntax
   */
  private validateDKIMSyntax(record: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!record.startsWith('v=DKIM1')) {
      errors.push('DKIM record must start with "v=DKIM1"');
    }

    if (!record.includes('k=rsa')) {
      errors.push('DKIM record should specify key type as "k=rsa"');
    }

    if (!record.includes('p=')) {
      errors.push('DKIM record must include public key "p="');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate DMARC syntax
   */
  private validateDMARCSyntax(record: string): {
    isValid: boolean;
    errors: string[];
    policy: 'none' | 'quarantine' | 'reject';
    percentage: number;
    rua: string;
    ruf: string;
  } {
    const errors: string[] = [];

    if (!record.startsWith('v=DMARC1')) {
      errors.push('DMARC record must start with "v=DMARC1"');
    }

    const policyMatch = record.match(/p=([^;]+)/);
    const policy = policyMatch
      ? (policyMatch[1] as 'none' | 'quarantine' | 'reject')
      : 'none';

    const percentageMatch = record.match(/pct=(\d+)/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 100;

    const ruaMatch = record.match(/rua=([^;]+)/);
    const rua = ruaMatch ? ruaMatch[1] : '';

    const rufMatch = record.match(/ruf=([^;]+)/);
    const ruf = rufMatch ? rufMatch[1] : '';

    if (!policy || !['none', 'quarantine', 'reject'].includes(policy)) {
      errors.push(
        'DMARC record must specify valid policy (none, quarantine, or reject)'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      policy,
      percentage,
      rua,
      ruf,
    };
  }

  /**
   * Calculate overall authentication status
   */
  private calculateOverallStatus(
    spf: SPFRecord,
    dkim: DKIMRecord,
    dmarc: DMARCRecord
  ): 'pass' | 'fail' | 'partial' {
    const validCount = [spf.isValid, dkim.isValid, dmarc.isValid].filter(
      Boolean
    ).length;

    if (validCount === 3) return 'pass';
    if (validCount === 0) return 'fail';
    return 'partial';
  }

  /**
   * Store authentication result
   */
  private async storeAuthenticationResult(
    type: string,
    domain: string,
    result: any
  ): Promise<void> {
    try {
      await this.supabase.from('email_authentication').upsert({
        domain,
        type,
        result,
        last_checked: new Date().toISOString(),
      });

      // Log audit event
      await this.auditLogger.logEvent({
        action: 'email_authentication_checked',
        details: {
          domain,
          type,
          isValid: result.isValid || result.overallStatus === 'pass',
        },
      });
    } catch (error) {
      console.error('Error storing authentication result:', error);
    }
  }

  /**
   * Get authentication history for a domain
   */
  async getAuthenticationHistory(
    domain: string,
    days: number = 30
  ): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('email_authentication')
        .select('*')
        .eq('domain', domain)
        .gte('last_checked', startDate.toISOString())
        .order('last_checked', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch authentication history: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching authentication history:', error);
      throw error;
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthenticationStats(): Promise<{
    totalDomains: number;
    fullyAuthenticated: number;
    partiallyAuthenticated: number;
    notAuthenticated: number;
    spfValid: number;
    dkimValid: number;
    dmarcValid: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('email_authentication')
        .select('*')
        .eq('type', 'overall');

      if (error) {
        throw new Error(
          `Failed to fetch authentication stats: ${error.message}`
        );
      }

      const stats = {
        totalDomains: data.length,
        fullyAuthenticated: 0,
        partiallyAuthenticated: 0,
        notAuthenticated: 0,
        spfValid: 0,
        dkimValid: 0,
        dmarcValid: 0,
      };

      data.forEach(record => {
        const result = record.result;
        if (result.overallStatus === 'pass') stats.fullyAuthenticated++;
        else if (result.overallStatus === 'partial')
          stats.partiallyAuthenticated++;
        else stats.notAuthenticated++;

        if (result.spf?.isValid) stats.spfValid++;
        if (result.dkim?.isValid) stats.dkimValid++;
        if (result.dmarc?.isValid) stats.dmarcValid++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching authentication stats:', error);
      throw error;
    }
  }
}
