import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'planned',
    'in_development',
    'completed',
    'rejected',
  ]),
  admin_notes: z.string().optional(),
});

// PUT /api/admin/feature-requests/{id}/status - Update feature request status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const user = authResult.user;
    // Use admin client to bypass RLS for admin operations
    const supabase = supabaseAdmin;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Get current feature request with full details
    const { data: currentRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, status, user_id, title, description')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check if status actually changed
    const statusChanged = currentRequest.status !== validatedData.status;

    // Update the feature request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('feature_requests')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature request status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Add status change to history
    const { error: historyError } = await supabase
      .from('feature_request_status_history')
      .insert({
        feature_request_id: params.id,
        status: validatedData.status,
        changed_by: user.id,
        comments: validatedData.admin_notes || null,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error adding status history:', historyError);
      // Don't fail the request if history logging fails
    }

    // If status changed to completed, update completion date
    if (validatedData.status === 'completed') {
      await supabase
        .from('feature_requests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', params.id);
    }

    // If status changed to rejected, update rejection date
    if (validatedData.status === 'rejected') {
      await supabase
        .from('feature_requests')
        .update({ rejected_at: new Date().toISOString() })
        .eq('id', params.id);
    }

    // Send email notification to feature request creator if status changed
    if (statusChanged && currentRequest.user_id) {
      try {
        // Fetch user email and profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentRequest.user_id)
          .single();

        if (!userError && userData?.email) {
          // Fetch user profile for name
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', currentRequest.user_id)
            .single();

          const firstName = profile?.first_name || 'User';
          const userName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
              userData.email
            : userData.email;

          // Helper function to escape HTML
          const escapeHtml = (text: string) => {
            const map: { [key: string]: string } = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#039;',
            };
            return text.replace(/[&<>"']/g, m => map[m]);
          };

          // Format status for display
          const statusLabels: { [key: string]: string } = {
            submitted: 'Submitted',
            planned: 'Planned',
            in_development: 'In Development',
            completed: 'Completed',
            rejected: 'Rejected',
          };

          const statusLabel =
            statusLabels[validatedData.status] || validatedData.status;
          const oldStatusLabel =
            statusLabels[currentRequest.status] || currentRequest.status;

          // Format date in NZ timezone
          const nzDate = new Date().toLocaleString('en-NZ', {
            timeZone: 'Pacific/Auckland',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          // Prepare email content
          const escapedUserName = escapeHtml(userName);
          const escapedTitle = escapeHtml(currentRequest.title);
          const escapedDescription = escapeHtml(
            currentRequest.description || 'No description provided'
          );
          const escapedAdminNotes = validatedData.admin_notes
            ? escapeHtml(validatedData.admin_notes)
            : '';

          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const featureRequestUrl = `${appUrl}/feature-requests/${params.id}`;

          const emailSubject = `Your Feature Request Status Updated: ${currentRequest.title}`;

          const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f18d30 0%, #f4a855 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #f18d30; }
            .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: 600; margin: 5px 0; }
            .status-submitted { background-color: #e3f2fd; color: #1976d2; }
            .status-planned { background-color: #e8f5e9; color: #2e7d32; }
            .status-in_development { background-color: #f3e5f5; color: #7b1fa2; }
            .status-completed { background-color: #e8f5e9; color: #1b5e20; }
            .status-rejected { background-color: #ffebee; color: #c62828; }
            .button { display: inline-block; background: linear-gradient(135deg, #f18d30 0%, #f4a855 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; }
            .description { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Feature Request Status Updated</h2>
            </div>
            <div class="content">
              <p>Hi ${escapedUserName},</p>
              
              <p>Your feature request status has been updated:</p>
              
              <div class="field">
                <div class="label">Feature Request:</div>
                <div class="value">${escapedTitle}</div>
              </div>
              
              <div class="field">
                <div class="label">Previous Status:</div>
                <div class="value">
                  <span class="status-badge status-${currentRequest.status}">${oldStatusLabel}</span>
                </div>
              </div>
              
              <div class="field">
                <div class="label">New Status:</div>
                <div class="value">
                  <span class="status-badge status-${validatedData.status}">${statusLabel}</span>
                </div>
              </div>
              
              ${
                validatedData.admin_notes
                  ? `
              <div class="field">
                <div class="label">Admin Notes:</div>
                <div class="value">${escapedAdminNotes}</div>
              </div>
              `
                  : ''
              }
              
              <div class="field">
                <div class="label">Updated At (NZ Time):</div>
                <div class="value">${escapeHtml(nzDate)}</div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${featureRequestUrl}" class="button">View Feature Request</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

          const emailText = `
Feature Request Status Updated

Hi ${userName},

Your feature request status has been updated:

Feature Request: ${currentRequest.title}
Previous Status: ${oldStatusLabel}
New Status: ${statusLabel}
${validatedData.admin_notes ? `Admin Notes: ${validatedData.admin_notes}\n` : ''}
Updated At (NZ Time): ${nzDate}

View your feature request: ${featureRequestUrl}
      `.trim();

          // Send email notification
          const { SimpleEmailService } = await import(
            '@/lib/email/simple-email-service'
          );

          const result = await SimpleEmailService.sendEmail({
            to: userData.email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
            from: 'no-reply@eventpros.co.nz',
            fromName: 'EventProsNZ',
          });

          if (result.success) {
            console.log(
              'Feature request status update email sent successfully',
              {
                messageId: result.messageId,
                userId: currentRequest.user_id,
                featureRequestId: params.id,
                newStatus: validatedData.status,
              }
            );
          } else {
            console.error(
              'Failed to send feature request status update email:',
              result.error
            );
          }
        }
      } catch (emailError: any) {
        // Log error but don't fail the request
        console.error(
          'Failed to send feature request status update email:',
          emailError?.message || emailError
        );
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/admin/feature-requests/[id]/status:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
