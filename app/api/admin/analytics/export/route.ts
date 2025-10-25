import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      format,
      dateRange,
      includeCharts,
      includeRawData,
      compression,
      emailNotification,
      emailAddress,
    } = body;

    // Create export job
    const exportJob = {
      id: `export_${Date.now()}`,
      name: `Analytics Export - ${new Date().toLocaleDateString()}`,
      type: format,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      options: {
        dateRange,
        includeCharts,
        includeRawData,
        compression,
        emailNotification,
        emailAddress,
      },
    };

    // Store export job in database (simulated)
    // In a real implementation, you would store this in your database
    console.log('Export job created:', exportJob);

    // Simulate processing
    setTimeout(() => {
      // Update job status to completed
      console.log('Export job completed:', exportJob.id);
    }, 5000);

    return NextResponse.json(exportJob);
  } catch (error) {
    console.error('Error creating export job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Return export jobs (simulated)
    const exportJobs = [
      {
        id: 'export_1',
        name: 'Analytics Export - Dec 19, 2024',
        type: 'csv',
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        downloadUrl: '/api/admin/analytics/export/download/export_1',
        size: 1024 * 1024, // 1MB
      },
      {
        id: 'export_2',
        name: 'Analytics Export - Dec 18, 2024',
        type: 'pdf',
        status: 'processing',
        progress: 75,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'export_3',
        name: 'Analytics Export - Dec 17, 2024',
        type: 'excel',
        status: 'failed',
        progress: 0,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        error: 'Export failed due to data processing error',
      },
    ];

    return NextResponse.json(exportJobs);
  } catch (error) {
    console.error('Error fetching export jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
