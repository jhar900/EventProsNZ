import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PUT: Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id: eventId, documentId } = params;

    // Get user ID from request headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required', details: 'x-user-id header missing' },
        { status: 401 }
      );
    }

    // Verify user exists
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Fetch event to verify ownership
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify user owns the event or is an admin
    if (event.user_id !== userId && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    const eventManagerId = event.user_id;

    // Fetch existing document
    const { data: existingDocument, error: documentError } = await supabaseAdmin
      .from('event_documents')
      .select('*')
      .eq('id', documentId)
      .eq('event_id', eventId)
      .single();

    if (documentError || !existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const documentName = formData.get('name') as string;
    const shareWithAllTeamMembers =
      formData.get('share_with_all_team_members') === 'true';
    const shareWithAllContractors =
      formData.get('share_with_all_contractors') === 'true';

    // Get team member IDs (array)
    const teamMemberIds: string[] = [];
    const teamMemberIdsFormData = formData.getAll('team_member_ids[]');
    teamMemberIdsFormData.forEach(id => {
      if (typeof id === 'string') {
        teamMemberIds.push(id);
      }
    });

    // Get contractor IDs (array)
    const contractorIds: string[] = [];
    const contractorIdsFormData = formData.getAll('contractor_ids[]');
    contractorIdsFormData.forEach(id => {
      if (typeof id === 'string') {
        contractorIds.push(id);
      }
    });

    if (!documentName || documentName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      );
    }

    // Update document record
    const { error: updateError } = await supabaseAdmin
      .from('event_documents')
      .update({
        name: documentName.trim(),
        share_with_all_team_members: shareWithAllTeamMembers,
        share_with_all_contractors: shareWithAllContractors,
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update document',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Delete existing team member shares
    await supabaseAdmin
      .from('event_documents_team_members')
      .delete()
      .eq('document_id', documentId);

    // Delete existing contractor shares
    await supabaseAdmin
      .from('event_documents_contractors')
      .delete()
      .eq('document_id', documentId);

    // Handle team member shares (only if not sharing with all)
    if (!shareWithAllTeamMembers && teamMemberIds.length > 0) {
      console.log('Processing team member shares:', {
        teamMemberIds,
        eventId,
        eventManagerId,
      });

      // The IDs should be event_team_members.id
      // event_team_members.team_member_id is already team_members.id (not user id)
      const { data: eventTeamMembers, error: eventTeamMembersError } =
        await supabaseAdmin
          .from('event_team_members')
          .select('id, team_member_id')
          .eq('event_id', eventId)
          .in('id', teamMemberIds);

      if (eventTeamMembersError) {
        console.error(
          'Error fetching event team members:',
          eventTeamMembersError
        );
        return NextResponse.json(
          {
            error: 'Failed to fetch event team members',
            details: eventTeamMembersError.message,
          },
          { status: 500 }
        );
      }

      if (eventTeamMembers && eventTeamMembers.length > 0) {
        // event_team_members.team_member_id is already team_members.id, use it directly
        const teamMemberShares = eventTeamMembers.map((etm: any) => ({
          document_id: documentId,
          team_member_id: etm.team_member_id, // This is already team_members.id
        }));

        console.log('Inserting team member shares:', teamMemberShares);

        const { error: teamMemberError } = await supabaseAdmin
          .from('event_documents_team_members')
          .insert(teamMemberShares);

        if (teamMemberError) {
          console.error('Error sharing with team members:', teamMemberError);
          return NextResponse.json(
            {
              error: 'Failed to update team member shares',
              details: teamMemberError.message,
            },
            { status: 500 }
          );
        }
        console.log('Successfully inserted team member shares');
      } else {
        console.error(
          'No event team members found with IDs:',
          teamMemberIds,
          'for event:',
          eventId
        );
      }
    }

    // Handle contractor shares (only if not sharing with all)
    if (!shareWithAllContractors && contractorIds.length > 0) {
      const contractorShares = contractorIds.map((contractorId: string) => ({
        document_id: documentId,
        contractor_id: contractorId,
      }));

      const { error: contractorError } = await supabaseAdmin
        .from('event_documents_contractors')
        .insert(contractorShares);

      if (contractorError) {
        console.error('Error sharing with contractors:', contractorError);
      }
    }

    // Fetch updated document
    const { data: updatedDocument } = await supabaseAdmin
      .from('event_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: 'Document updated successfully',
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/events/[id]/documents/[documentId]:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { id: eventId, documentId } = params;

    // Get user ID from request headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required', details: 'x-user-id header missing' },
        { status: 401 }
      );
    }

    // Verify user exists
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Fetch event to verify ownership
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify user owns the event or is an admin
    if (event.user_id !== userId && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Fetch existing document to get file_path
    const { data: existingDocument, error: documentError } = await supabaseAdmin
      .from('event_documents')
      .select('id, event_id, file_path')
      .eq('id', documentId)
      .eq('event_id', eventId)
      .single();

    if (documentError || !existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from storage if file_path exists
    if (existingDocument.file_path) {
      // Extract the path relative to the bucket
      // file_path is stored as "event-documents/${fileName}", but .remove() needs just the path relative to the bucket
      let filePath = existingDocument.file_path;
      if (filePath.startsWith('event-documents/')) {
        // Remove the bucket prefix since .from('event-documents') already specifies the bucket
        filePath = filePath.replace('event-documents/', '');
      }

      const { error: storageError } = await supabaseAdmin.storage
        .from('event-documents')
        .remove([filePath]);

      if (storageError) {
        console.warn(
          'Failed to delete file from storage:',
          storageError.message
        );
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the document record (cascade will handle junction tables)
    const { error: deleteError } = await supabaseAdmin
      .from('event_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete document',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error(
      'Error in DELETE /api/events/[id]/documents/[documentId]:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
