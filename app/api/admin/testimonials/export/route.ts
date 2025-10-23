import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const exportTestimonialsSchema = z.object({
  export_type: z.enum(['csv', 'pdf', 'json']),
  parameters: z.object({
    date_range: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
    status_filter: z.array(z.string()).optional(),
    category_filter: z.array(z.string()).optional(),
    rating_filter: z.array(z.number()).optional(),
  }),
  include_analytics: z.boolean().optional(),
});

// POST /api/admin/testimonials/export - Export testimonials
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = exportTestimonialsSchema.parse(body);

    // Create export job record
    const { data: exportJob, error: exportJobError } = await supabase
      .from('testimonial_export_jobs')
      .insert({
        user_id: user.id,
        export_type: validatedData.export_type,
        status: 'pending',
        parameters: validatedData.parameters,
        include_analytics: validatedData.include_analytics || false,
      })
      .select()
      .single();

    if (exportJobError) {
      console.error('Error creating export job:', exportJobError);
      return NextResponse.json(
        { error: 'Failed to create export job' },
        { status: 500 }
      );
    }

    // Start background export process (in a real implementation, this would be queued)
    processExportJob(exportJob.id, validatedData);

    return NextResponse.json({
      message: 'Export job created successfully',
      job_id: exportJob.id,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/testimonials/export:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background function to process export job
async function processExportJob(jobId: string, exportData: any) {
  try {
    const supabase = createClient();

    // Update job status to processing
    await supabase
      .from('testimonial_export_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    // Build query based on parameters
    let query = supabase.from('platform_testimonials').select(`
        id,
        rating,
        feedback,
        category,
        status,
        is_verified,
        is_public,
        created_at,
        approved_at,
        user:users!platform_testimonials_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `);

    // Apply filters
    if (exportData.parameters.date_range) {
      query = query
        .gte('created_at', exportData.parameters.date_range.from)
        .lte('created_at', exportData.parameters.date_range.to);
    }

    if (exportData.parameters.status_filter?.length > 0) {
      query = query.in('status', exportData.parameters.status_filter);
    }

    if (exportData.parameters.category_filter?.length > 0) {
      query = query.in('category', exportData.parameters.category_filter);
    }

    if (exportData.parameters.rating_filter?.length > 0) {
      query = query.in('rating', exportData.parameters.rating_filter);
    }

    const { data: testimonials, error: testimonialsError } = await query;

    if (testimonialsError) {
      throw new Error('Failed to fetch testimonials for export');
    }

    // Generate export file based on type
    let exportContent: string;
    let mimeType: string;
    let fileExtension: string;

    switch (exportData.export_type) {
      case 'csv':
        exportContent = generateCSV(testimonials || []);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        exportContent = JSON.stringify(testimonials || [], null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'pdf':
        // In a real implementation, you would use a PDF library like puppeteer or jsPDF
        exportContent = generatePDF(testimonials || []);
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      default:
        throw new Error('Invalid export type');
    }

    // In a real implementation, you would save the file to cloud storage
    // and get a download URL
    const fileUrl = `https://example.com/exports/testimonials-${jobId}.${fileExtension}`;

    // Update job with completion
    await supabase
      .from('testimonial_export_jobs')
      .update({
        status: 'completed',
        file_url: fileUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Error processing export job:', error);

    // Update job with error
    const supabase = createClient();
    await supabase
      .from('testimonial_export_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

// Generate CSV content
function generateCSV(testimonials: any[]): string {
  const headers = [
    'ID',
    'Rating',
    'Feedback',
    'Category',
    'Status',
    'Verified',
    'Public',
    'Created At',
    'Approved At',
    'User Name',
    'User Email',
  ];

  const rows = testimonials.map(testimonial => [
    testimonial.id,
    testimonial.rating,
    testimonial.feedback.replace(/"/g, '""'), // Escape quotes
    testimonial.category,
    testimonial.status,
    testimonial.is_verified ? 'Yes' : 'No',
    testimonial.is_public ? 'Yes' : 'No',
    testimonial.created_at,
    testimonial.approved_at || '',
    `${testimonial.user?.first_name || ''} ${testimonial.user?.last_name || ''}`.trim(),
    testimonial.user?.email || '',
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Generate PDF content (simplified)
function generatePDF(testimonials: any[]): string {
  // In a real implementation, you would use a PDF library
  // This is a simplified version that returns HTML that could be converted to PDF
  const html = `
    <html>
      <head>
        <title>Testimonials Export</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .testimonial { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
          .header { font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Testimonials Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total testimonials: ${testimonials.length}</p>
        ${testimonials
          .map(
            t => `
          <div class="testimonial">
            <div class="header">${t.user?.first_name} ${t.user?.last_name} - ${t.rating} stars</div>
            <div>${t.feedback}</div>
            <div>Status: ${t.status} | Category: ${t.category} | Verified: ${t.is_verified ? 'Yes' : 'No'}</div>
            <div>Created: ${new Date(t.created_at).toLocaleString()}</div>
          </div>
        `
          )
          .join('')}
      </body>
    </html>
  `;

  return html;
}
