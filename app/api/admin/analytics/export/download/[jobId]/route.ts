import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { jobId } = params;

    // In a real implementation, you would:
    // 1. Verify the job exists and is completed
    // 2. Generate the actual export file
    // 3. Return the file as a download

    // For now, we'll simulate a CSV export
    const csvData = `Date,Users,Revenue,Events,Contractors
2024-12-01,100,5000,25,15
2024-12-02,105,5200,28,16
2024-12-03,110,5400,30,17
2024-12-04,115,5600,32,18
2024-12-05,120,5800,35,19`;

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set(
      'Content-Disposition',
      `attachment; filename="analytics-export-${jobId}.csv"`
    );

    return new NextResponse(csvData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading export file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
