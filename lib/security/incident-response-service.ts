import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface SecurityIncident {
  id: string;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed';
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  reported_by: string;
  assigned_to?: string;
  affected_systems: string[];
  impact_assessment: string;
  root_cause?: string;
  remediation_steps: string[];
  lessons_learned?: string;
}

export interface IncidentResponse {
  id: string;
  incident_id: string;
  response_type: 'automatic' | 'manual';
  action_taken: string;
  timestamp: Date;
  performed_by: string;
  success: boolean;
  details: any;
}

export interface BreachNotification {
  id: string;
  incident_id: string;
  notification_type: 'internal' | 'external' | 'regulatory';
  recipients: string[];
  sent_at: Date;
  content: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  avgResolutionTime: number;
  breachNotifications: number;
}

export class IncidentResponseService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Create security incident
   */
  async createIncident(
    incidentType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    reportedBy: string,
    affectedSystems: string[] = [],
    impactAssessment: string = ''
  ): Promise<SecurityIncident> {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const incident: SecurityIncident = {
      id: incidentId,
      incident_type: incidentType,
      description,
      severity,
      status: 'reported',
      created_at: new Date(),
      updated_at: new Date(),
      reported_by: reportedBy,
      affected_systems: affectedSystems,
      impact_assessment: impactAssessment,
      remediation_steps: [],
    };

    await this.supabase.from('security_incidents').insert({
      id: incident.id,
      incident_type: incident.incident_type,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      created_at: incident.created_at.toISOString(),
      updated_at: incident.updated_at.toISOString(),
      reported_by: incident.reported_by,
      affected_systems: incident.affected_systems,
      impact_assessment: incident.impact_assessment,
      remediation_steps: incident.remediation_steps,
    });

    // Log incident creation
    await this.auditLogger.logEvent({
      action: 'security_incident_created',
      resource: 'incident_response',
      resourceId: incidentId,
      details: { incidentType, severity, affectedSystems },
    });

    // Trigger automatic response if critical
    if (severity === 'critical') {
      await this.triggerAutomaticResponse(incident);
    }

    return incident;
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed',
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    await this.supabase
      .from('security_incidents')
      .update(updateData)
      .eq('id', incidentId);

    // Log status update
    await this.auditLogger.logEvent({
      action: 'incident_status_updated',
      resource: 'incident_response',
      resourceId: incidentId,
      details: { status, updatedBy, notes },
    });
  }

  /**
   * Assign incident
   */
  async assignIncident(
    incidentId: string,
    assignedTo: string,
    assignedBy: string
  ): Promise<void> {
    await this.supabase
      .from('security_incidents')
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    // Log assignment
    await this.auditLogger.logEvent({
      action: 'incident_assigned',
      resource: 'incident_response',
      resourceId: incidentId,
      details: { assignedTo, assignedBy },
    });
  }

  /**
   * Add remediation step
   */
  async addRemediationStep(
    incidentId: string,
    step: string,
    addedBy: string
  ): Promise<void> {
    // Get current remediation steps
    const { data: incident } = await this.supabase
      .from('security_incidents')
      .select('remediation_steps')
      .eq('id', incidentId)
      .single();

    if (incident) {
      const steps = incident.remediation_steps || [];
      steps.push(step);

      await this.supabase
        .from('security_incidents')
        .update({
          remediation_steps: steps,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      // Log remediation step
      await this.auditLogger.logEvent({
        action: 'remediation_step_added',
        resource: 'incident_response',
        resourceId: incidentId,
        details: { step, addedBy },
      });
    }
  }

  /**
   * Record incident response
   */
  async recordResponse(
    incidentId: string,
    responseType: 'automatic' | 'manual',
    actionTaken: string,
    performedBy: string,
    success: boolean,
    details: any = {}
  ): Promise<IncidentResponse> {
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response: IncidentResponse = {
      id: responseId,
      incident_id: incidentId,
      response_type: responseType,
      action_taken: actionTaken,
      timestamp: new Date(),
      performed_by: performedBy,
      success,
      details,
    };

    await this.supabase.from('incident_responses').insert({
      id: response.id,
      incident_id: response.incident_id,
      response_type: response.response_type,
      action_taken: response.action_taken,
      timestamp: response.timestamp.toISOString(),
      performed_by: response.performed_by,
      success: response.success,
      details: response.details,
    });

    // Log response
    await this.auditLogger.logEvent({
      action: 'incident_response_recorded',
      resource: 'incident_response',
      resourceId: incidentId,
      details: { responseType, actionTaken, success },
    });

    return response;
  }

  /**
   * Trigger automatic response
   */
  private async triggerAutomaticResponse(
    incident: SecurityIncident
  ): Promise<void> {
    const responses = [
      'Isolated affected systems',
      'Blocked suspicious IP addresses',
      'Enabled additional monitoring',
      'Notified security team',
    ];

    for (const response of responses) {
      await this.recordResponse(
        incident.id,
        'automatic',
        response,
        'system',
        true,
        { triggered: true }
      );
    }

    // Send breach notification if data breach
    if (
      incident.incident_type.includes('breach') ||
      incident.incident_type.includes('data')
    ) {
      await this.sendBreachNotification(incident);
    }
  }

  /**
   * Send breach notification
   */
  async sendBreachNotification(
    incident: SecurityIncident
  ): Promise<BreachNotification> {
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: BreachNotification = {
      id: notificationId,
      incident_id: incident.id,
      notification_type: 'internal',
      recipients: ['security@eventpros.co.nz', 'admin@eventpros.co.nz'],
      sent_at: new Date(),
      content: this.generateBreachNotificationContent(incident),
      status: 'pending',
    };

    await this.supabase.from('breach_notifications').insert({
      id: notification.id,
      incident_id: notification.incident_id,
      notification_type: notification.notification_type,
      recipients: notification.recipients,
      sent_at: notification.sent_at.toISOString(),
      content: notification.content,
      status: notification.status,
    });

    // Send notification (simplified)
    await this.sendNotification(notification);

    // Update status
    await this.supabase
      .from('breach_notifications')
      .update({ status: 'sent' })
      .eq('id', notification.id);

    return notification;
  }

  /**
   * Generate breach notification content
   */
  private generateBreachNotificationContent(
    incident: SecurityIncident
  ): string {
    return `
SECURITY INCIDENT NOTIFICATION

Incident ID: ${incident.id}
Type: ${incident.incident_type}
Severity: ${incident.severity.toUpperCase()}
Reported: ${incident.created_at.toISOString()}

Description:
${incident.description}

Affected Systems:
${incident.affected_systems.join(', ')}

Impact Assessment:
${incident.impact_assessment}

This is an automated notification. Please investigate immediately.

EventPros Security Team
    `.trim();
  }

  /**
   * Send notification (simplified)
   */
  private async sendNotification(
    notification: BreachNotification
  ): Promise<void> {
    // In practice, this would integrate with email/SMS services
    console.log('Sending breach notification:', {
      id: notification.id,
      recipients: notification.recipients,
      content: notification.content,
    });
  }

  /**
   * Get incident metrics
   */
  async getIncidentMetrics(): Promise<IncidentMetrics> {
    const { data: incidents } = await this.supabase
      .from('security_incidents')
      .select('severity, status, created_at, resolved_at')
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: notifications } = await this.supabase
      .from('breach_notifications')
      .select('count')
      .eq('status', 'sent');

    const totalIncidents = incidents?.length || 0;
    const openIncidents =
      incidents?.filter(
        i => i.status === 'reported' || i.status === 'investigating'
      ).length || 0;
    const resolvedIncidents =
      incidents?.filter(i => i.status === 'resolved' || i.status === 'closed')
        .length || 0;
    const criticalIncidents =
      incidents?.filter(i => i.severity === 'critical').length || 0;

    // Calculate average resolution time
    const resolvedWithTimes =
      incidents?.filter(i => i.status === 'resolved' && i.resolved_at) || [];
    let avgResolutionTime = 0;

    if (resolvedWithTimes.length > 0) {
      const totalResolutionTime = resolvedWithTimes.reduce((sum, incident) => {
        const created = new Date(incident.created_at).getTime();
        const resolved = new Date(incident.resolved_at).getTime();
        return sum + (resolved - created);
      }, 0);

      avgResolutionTime =
        totalResolutionTime / resolvedWithTimes.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      criticalIncidents,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      breachNotifications: notifications?.count || 0,
    };
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<SecurityIncident[]> {
    const { data, error } = await this.supabase
      .from('security_incidents')
      .select('*')
      .in('status', ['reported', 'investigating', 'contained'])
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(incident => ({
      id: incident.id,
      incident_type: incident.incident_type,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      created_at: new Date(incident.created_at),
      updated_at: new Date(incident.updated_at),
      resolved_at: incident.resolved_at
        ? new Date(incident.resolved_at)
        : undefined,
      reported_by: incident.reported_by,
      assigned_to: incident.assigned_to,
      affected_systems: incident.affected_systems,
      impact_assessment: incident.impact_assessment,
      root_cause: incident.root_cause,
      remediation_steps: incident.remediation_steps,
      lessons_learned: incident.lessons_learned,
    }));
  }

  /**
   * Close incident
   */
  async closeIncident(
    incidentId: string,
    closedBy: string,
    rootCause?: string,
    lessonsLearned?: string
  ): Promise<void> {
    const updateData: any = {
      status: 'closed',
      updated_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    };

    if (rootCause) {
      updateData.root_cause = rootCause;
    }

    if (lessonsLearned) {
      updateData.lessons_learned = lessonsLearned;
    }

    await this.supabase
      .from('security_incidents')
      .update(updateData)
      .eq('id', incidentId);

    // Log closure
    await this.auditLogger.logEvent({
      action: 'incident_closed',
      resource: 'incident_response',
      resourceId: incidentId,
      details: { closedBy, rootCause, lessonsLearned },
    });
  }

  /**
   * Get incident timeline
   */
  async getIncidentTimeline(incidentId: string): Promise<any[]> {
    const { data: responses } = await this.supabase
      .from('incident_responses')
      .select('*')
      .eq('incident_id', incidentId)
      .order('timestamp', { ascending: true });

    return responses || [];
  }
}
