import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch documents for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { supabase } = createClient(request);

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let user = session?.user;

    // Fallback: Try to get user ID from header
    if (!user) {
      const userIdFromHeader = request.headers.get('x-user-id');
      if (userIdFromHeader) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    if (event.user_id !== user.id && (user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to view this event' },
        { status: 403 }
      );
    }

    // Fetch documents for the event
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('event_documents')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch documents',
          details: documentsError.message,
        },
        { status: 500 }
      );
    }

    // Fetch uploaded_by user profile information
    const uploadedByIds = [
      ...new Set(
        (documents || []).map((d: any) => d.uploaded_by).filter(Boolean)
      ),
    ];

    const uploadedByUsers: Record<string, any> = {};
    if (uploadedByIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select(
          `
          id,
          email,
          role,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .in('id', uploadedByIds);

      if (users) {
        for (const u of users) {
          const profile = Array.isArray(u.profiles)
            ? u.profiles[0]
            : u.profiles;
          uploadedByUsers[u.id] = {
            email: u.email,
            role: u.role || 'event_manager',
            name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                u.email
              : u.email,
            avatar_url: profile?.avatar_url || null,
          };
        }
      }
    }

    // Fetch sharing information for each document
    const documentIds = (documents || []).map((d: any) => d.id);
    const sharedWithInfo: Record<string, any> = {};

    if (documentIds.length > 0) {
      // Fetch team member shares
      // We need to get event_team_members.id to match with EditDocumentModal
      // First get the team_members.id from event_documents_team_members
      const { data: teamMemberShares } = await supabaseAdmin
        .from('event_documents_team_members')
        .select(
          `
          document_id,
          team_member_id,
          team_members:team_member_id (
            id,
            role,
            team_member_id,
            users:team_member_id (
              id,
              email,
              profiles (
                first_name,
                last_name,
                avatar_url
              )
            )
          )
        `
        )
        .in('document_id', documentIds);

      // Fetch contractor shares
      const { data: contractorShares } = await supabaseAdmin
        .from('event_documents_contractors')
        .select(
          `
          document_id,
          business_profiles:contractor_id (
            id,
            company_name,
            user_id,
            users:user_id (
              id,
              email,
              profiles (
                first_name,
                last_name,
                avatar_url
              )
            )
          )
        `
        )
        .in('document_id', documentIds);

      // Process team member shares
      if (teamMemberShares && teamMemberShares.length > 0) {
        // Get all team_member_ids (which are team_members.id)
        const teamMemberIds = teamMemberShares.map(
          (s: any) => s.team_member_id
        );

        // Find corresponding event_team_members.id for each team_member.id
        const { data: eventTeamMembers } = await supabaseAdmin
          .from('event_team_members')
          .select('id, team_member_id')
          .eq('event_id', eventId)
          .in('team_member_id', teamMemberIds);

        // Create a map from team_member_id (team_members.id) to event_team_members.id
        const teamMemberIdToEventTeamMemberId = new Map<string, string>();
        if (eventTeamMembers) {
          eventTeamMembers.forEach((etm: any) => {
            teamMemberIdToEventTeamMemberId.set(etm.team_member_id, etm.id);
          });
        }

        for (const share of teamMemberShares) {
          if (!sharedWithInfo[share.document_id]) {
            sharedWithInfo[share.document_id] = {
              team_members: [],
              contractors: [],
            };
          }
          const teamMember = share.team_members;
          const user = teamMember?.users;
          const profile = Array.isArray(user?.profiles)
            ? user.profiles[0]
            : user?.profiles;

          if (teamMember && user) {
            // Use event_team_members.id for matching in EditDocumentModal
            const eventTeamMemberId = teamMemberIdToEventTeamMemberId.get(
              share.team_member_id
            );
            sharedWithInfo[share.document_id].team_members.push({
              id: eventTeamMemberId || teamMember.id, // Use event_team_members.id if available, fallback to team_members.id
              name: profile
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                  user.email
                : user.email,
              role: teamMember.role || 'Team Member',
              avatar_url: profile?.avatar_url || null,
            });
          }
        }
      }

      // Process contractor shares
      if (contractorShares) {
        for (const share of contractorShares) {
          if (!sharedWithInfo[share.document_id]) {
            sharedWithInfo[share.document_id] = {
              team_members: [],
              contractors: [],
            };
          }
          const businessProfile = share.business_profiles;
          if (businessProfile) {
            const user = businessProfile.users;
            const profile = Array.isArray(user?.profiles)
              ? user.profiles[0]
              : user?.profiles;

            const contractorName = profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                user?.email ||
                'Unknown'
              : user?.email || 'Unknown';

            sharedWithInfo[share.document_id].contractors.push({
              id: businessProfile.id,
              company_name: businessProfile.company_name || 'Unknown',
              name: contractorName,
              avatar_url: profile?.avatar_url || null,
            });
          }
        }
      }
    }

    // Add uploaded_by information and map mime_type to file_type for compatibility
    const documentsWithNames = (documents || []).map((doc: any) => {
      const uploader = uploadedByUsers[doc.uploaded_by];
      const sharing = sharedWithInfo[doc.id] || {
        team_members: [],
        contractors: [],
      };

      return {
        ...doc,
        file_type: doc.mime_type || doc.file_type || 'application/octet-stream',
        file_path: doc.file_path, // Include file_path for preview
        uploaded_by_name: uploader?.name || uploader?.email || null,
        uploaded_by_email: uploader?.email || null,
        uploaded_by_role: uploader?.role || null,
        uploaded_by_avatar_url: uploader?.avatar_url || null,
        shared_with: {
          all_team_members: doc.share_with_all_team_members || false,
          all_contractors: doc.share_with_all_contractors || false,
          team_members: sharing.team_members,
          contractors: sharing.contractors,
        },
      };
    });

    return NextResponse.json({
      success: true,
      documents: documentsWithNames,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/documents:', error);
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

// POST: Upload a new document for an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentName || documentName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${userId}-${Date.now()}.${fileExt}`;
    const filePath = `event-documents/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('event-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Create document record
    const documentData: any = {
      event_id: eventId,
      name: documentName.trim(),
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      share_with_all_team_members: shareWithAllTeamMembers,
      share_with_all_contractors: shareWithAllContractors,
      uploaded_by: userId,
    };

    const { data: document, error: documentError } = await supabaseAdmin
      .from('event_documents')
      .insert(documentData)
      .select()
      .single();

    if (documentError) {
      console.error('Error creating document record:', documentError);
      // Try to delete the uploaded file if document creation fails
      await supabaseAdmin.storage.from('event-documents').remove([filePath]);
      return NextResponse.json(
        {
          error: 'Failed to create document record',
          details: documentError.message,
        },
        { status: 500 }
      );
    }

    // Handle team member shares (only if not sharing with all)
    if (!shareWithAllTeamMembers && teamMemberIds.length > 0) {
      // The IDs should be event_team_members.id
      // event_team_members.team_member_id is already team_members.id (not user id)
      const { data: eventTeamMembers } = await supabaseAdmin
        .from('event_team_members')
        .select('id, team_member_id')
        .eq('event_id', eventId)
        .in('id', teamMemberIds);

      if (eventTeamMembers && eventTeamMembers.length > 0) {
        // event_team_members.team_member_id is already team_members.id, use it directly
        const teamMemberShares = eventTeamMembers.map((etm: any) => ({
          document_id: document.id,
          team_member_id: etm.team_member_id, // This is already team_members.id
        }));

        const { error: teamMemberError } = await supabaseAdmin
          .from('event_documents_team_members')
          .insert(teamMemberShares);

        if (teamMemberError) {
          console.error('Error sharing with team members:', teamMemberError);
          // Don't fail the whole request, just log it
        }
      }
    }

    // Handle contractor shares (only if not sharing with all)
    if (!shareWithAllContractors && contractorIds.length > 0) {
      const contractorShares = contractorIds.map((contractorId: string) => ({
        document_id: document.id,
        contractor_id: contractorId,
      }));

      const { error: contractorError } = await supabaseAdmin
        .from('event_documents_contractors')
        .insert(contractorShares);

      if (contractorError) {
        console.error('Error sharing with contractors:', contractorError);
        // Don't fail the whole request, just log it
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        uploaded_by_name: userData.email,
      },
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/documents:', error);
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
