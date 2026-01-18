import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PUT: Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: eventId, taskId } = params;
    const { supabase } = createClient(request);
    const body = await request.json();
    const {
      title,
      description,
      due_date,
      status,
      priority,
      team_member_ids,
      contractor_ids,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

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
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Verify task exists and belongs to the event
    const { data: existingTask, error: taskError } = await supabaseAdmin
      .from('event_tasks')
      .select('id, event_id')
      .eq('id', taskId)
      .eq('event_id', eventId)
      .single();

    if (taskError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update the task
    const taskData: any = {
      title: title.trim(),
      description: description || null,
      due_date: due_date || null,
      status: status || 'todo',
      priority: priority || 'medium',
    };

    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('event_tasks')
      .update(taskData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update task',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Handle team member assignments
    // First, delete existing assignments
    await supabaseAdmin
      .from('event_tasks_team_members')
      .delete()
      .eq('task_id', taskId);

    // Then add new assignments if provided
    if (Array.isArray(team_member_ids) && team_member_ids.length > 0) {
      // Verify team members belong to the event
      const { data: eventTeamMembers } = await supabaseAdmin
        .from('event_team_members')
        .select('id, team_member_id')
        .eq('event_id', eventId)
        .in('id', team_member_ids);

      // If not found, try as team_member_id directly
      let validTeamMemberIds: string[] = [];
      if (eventTeamMembers && eventTeamMembers.length > 0) {
        validTeamMemberIds = eventTeamMembers.map(
          (etm: any) => etm.team_member_id
        );
      } else {
        const { data: directTeamMembers } = await supabaseAdmin
          .from('event_team_members')
          .select('team_member_id')
          .eq('event_id', eventId)
          .in('team_member_id', team_member_ids);

        if (directTeamMembers) {
          validTeamMemberIds = directTeamMembers.map(
            (etm: any) => etm.team_member_id
          );
        }
      }

      if (validTeamMemberIds.length > 0) {
        const teamMemberAssignments = validTeamMemberIds.map(
          (teamMemberId: string) => ({
            task_id: taskId,
            team_member_id: teamMemberId,
          })
        );

        const { error: teamMemberError } = await supabaseAdmin
          .from('event_tasks_team_members')
          .insert(teamMemberAssignments);

        if (teamMemberError) {
          console.error('Error assigning team members:', teamMemberError);
        }
      }
    }

    // Handle contractor assignments
    // First, delete existing assignments
    await supabaseAdmin
      .from('event_tasks_contractors')
      .delete()
      .eq('task_id', taskId);

    // Then add new assignments if provided
    if (Array.isArray(contractor_ids) && contractor_ids.length > 0) {
      const contractorAssignments = contractor_ids.map(
        (contractorId: string) => ({
          task_id: taskId,
          contractor_id: contractorId,
        })
      );

      const { error: contractorError } = await supabaseAdmin
        .from('event_tasks_contractors')
        .insert(contractorAssignments);

      if (contractorError) {
        console.error('Error assigning contractors:', contractorError);
      }
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/events/[id]/tasks/[taskId]:', error);
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

// DELETE: Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: eventId, taskId } = params;
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
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Verify task exists and belongs to the event
    const { data: existingTask, error: taskError } = await supabaseAdmin
      .from('event_tasks')
      .select('id, event_id')
      .eq('id', taskId)
      .eq('event_id', eventId)
      .single();

    if (taskError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete the task (cascade will handle junction tables)
    const { error: deleteError } = await supabaseAdmin
      .from('event_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete task',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]/tasks/[taskId]:', error);
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
