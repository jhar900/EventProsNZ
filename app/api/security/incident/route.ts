import { NextRequest, NextResponse } from 'next/server';
import { IncidentResponseService } from '@/lib/security/incident-response-service';
import { withSecurity } from '@/lib/security/security-middleware';

export async function POST(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const {
        incidentType,
        description,
        severity,
        reportedBy,
        affectedSystems = [],
        impactAssessment = '',
      } = await req.json();

      if (!incidentType || !description || !severity || !reportedBy) {
        return NextResponse.json(
          { success: false, message: 'Required fields missing' },
          { status: 400 }
        );
      }

      const incidentService = new IncidentResponseService();
      const incident = await incidentService.createIncident(
        incidentType,
        description,
        severity,
        reportedBy,
        affectedSystems,
        impactAssessment
      );

      return NextResponse.json({
        success: true,
        incident,
      });
    } catch (error) {
      console.error('Incident creation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create incident' },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return withSecurity(req, async () => {
    try {
      const incidentService = new IncidentResponseService();
      const incidents = await incidentService.getActiveIncidents();

      return NextResponse.json({
        success: true,
        incidents,
        count: incidents.length,
      });
    } catch (error) {
      console.error('Incident retrieval error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve incidents' },
        { status: 500 }
      );
    }
  });
}
