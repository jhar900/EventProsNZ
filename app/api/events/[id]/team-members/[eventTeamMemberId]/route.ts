import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Get tasks assigned to a team member for an event
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { id: string; eventTeamMemberId: string };
  }
) {
  try {
    const { id: eventId, eventTeamMemberId } = params;

    // Verify the event team member exists and get their team_member_id
    const { data: eventTeamMember, error: eventTeamMemberError } =
      await supabaseAdmin
        .from('event_team_members')
        .select('id, event_id, team_member_id')
        .eq('id', eventTeamMemberId)
        .eq('event_id', eventId)
        .single();

    if (eventTeamMemberError || !eventTeamMember) {
      return NextResponse.json(
        { error: 'Event team member not found' },
        { status: 404 }
      );
    }

    // Get all tasks for this event
    const { data: eventTasks, error: tasksError } = await supabaseAdmin
      .from('event_tasks')
      .select('id, title')
      .eq('event_id', eventId);

    let assignedTasks: any[] = [];

    if (!tasksError && eventTasks && eventTasks.length > 0) {
      const taskIds = eventTasks.map((task: any) => task.id);

      // Check if any tasks are assigned to this team member
      const { data: taskAssignments, error: assignmentsError } =
        await supabaseAdmin
          .from('event_tasks_team_members')
          .select('task_id')
          .in('task_id', taskIds)
          .eq('team_member_id', eventTeamMember.team_member_id);

      if (!assignmentsError && taskAssignments && taskAssignments.length > 0) {
        // Get the full task details for assigned tasks
        const assignedTaskIds = taskAssignments.map((ta: any) => ta.task_id);
        assignedTasks = eventTasks.filter((task: any) =>
          assignedTaskIds.includes(task.id)
        );
      }
    }

    return NextResponse.json({
      success: true,
      tasks: assignedTasks,
    });
  } catch (error) {
    console.error(
      'Error in GET /api/events/[id]/team-members/[eventTeamMemberId]:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a team member from an event
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { id: string; eventTeamMemberId: string };
  }
) {
  try {
    const { id: eventId, eventTeamMemberId } = params;
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

    // Verify the event team member exists and belongs to this event
    const { data: eventTeamMember, error: eventTeamMemberError } =
      await supabaseAdmin
        .from('event_team_members')
        .select('id, event_id, team_member_id')
        .eq('id', eventTeamMemberId)
        .eq('event_id', eventId)
        .single();

    if (eventTeamMemberError || !eventTeamMember) {
      return NextResponse.json(
        { error: 'Event team member not found' },
        { status: 404 }
      );
    }

    // Check if this team member has any tasks assigned to them for this event
    // First, get all tasks for this event
    const { data: eventTasks, error: tasksError } = await supabaseAdmin
      .from('event_tasks')
      .select('id, title')
      .eq('event_id', eventId);

    let assignedTasks: any[] = [];

    if (!tasksError && eventTasks && eventTasks.length > 0) {
      const taskIds = eventTasks.map((task: any) => task.id);

      // Check if any tasks are assigned to this team member
      const { data: taskAssignments, error: assignmentsError } =
        await supabaseAdmin
          .from('event_tasks_team_members')
          .select('task_id')
          .in('task_id', taskIds)
          .eq('team_member_id', eventTeamMember.team_member_id);

      if (!assignmentsError && taskAssignments && taskAssignments.length > 0) {
        // Get the full task details for assigned tasks
        const assignedTaskIds = taskAssignments.map((ta: any) => ta.task_id);
        assignedTasks = eventTasks.filter((task: any) =>
          assignedTaskIds.includes(task.id)
        );
      }
    }

    // If there are assigned tasks, remove the team member's assignments
    if (assignedTasks.length > 0) {
      const taskIds = assignedTasks.map((task: any) => task.id);

      // Remove task assignments for this team member
      const { error: removeAssignmentsError } = await supabaseAdmin
        .from('event_tasks_team_members')
        .delete()
        .in('task_id', taskIds)
        .eq('team_member_id', eventTeamMember.team_member_id);

      if (removeAssignmentsError) {
        console.error(
          'Error removing task assignments:',
          removeAssignmentsError
        );
        // Continue with deletion even if assignment removal fails
      }
    }

    // Delete the event team member
    const { error: deleteError } = await supabaseAdmin
      .from('event_team_members')
      .delete()
      .eq('id', eventTeamMemberId);

    if (deleteError) {
      console.error('Error deleting event team member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove team member from event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team member removed from event successfully',
    });
  } catch (error) {
    console.error(
      'Error in DELETE /api/events/[id]/team-members/[eventTeamMemberId]:',
      error
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
