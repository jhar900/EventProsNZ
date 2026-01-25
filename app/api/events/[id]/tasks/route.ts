import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch tasks for an event
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

    // Check if user is admin
    if ((user as any).role === 'admin') {
      // Admins have access to all events
    } else if (event.user_id === user.id) {
      // User owns the event
    } else {
      // Check if user is a team member of this event
      // First, find team_members records where user is a team member
      const { data: teamMemberRecords } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_member_id', user.id)
        .in('status', ['invited', 'active', 'onboarding']);

      const teamMemberIds = teamMemberRecords?.map(tm => tm.id) || [];

      if (teamMemberIds.length > 0) {
        // Check if any of these team members are assigned to this event
        const { data: eventTeamMemberRecords } = await supabaseAdmin
          .from('event_team_members')
          .select('id')
          .eq('event_id', eventId)
          .in('team_member_id', teamMemberIds)
          .limit(1);

        if (!eventTeamMemberRecords || eventTeamMemberRecords.length === 0) {
          return NextResponse.json(
            { error: 'Unauthorized to view this event' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unauthorized to view this event' },
          { status: 403 }
        );
      }
    }

    // Fetch tasks for the event
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('event_tasks')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tasks',
          details: tasksError.message,
        },
        { status: 500 }
      );
    }

    // Fetch team member assignments for all tasks
    const taskIds = (tasks || []).map((t: any) => t.id);
    let teamMemberAssignments: any[] = [];
    let contractorAssignments: any[] = [];

    if (taskIds.length > 0) {
      // Get team member assignments
      const { data: teamMemberData } = await supabaseAdmin
        .from('event_tasks_team_members')
        .select(
          `
          task_id,
          team_member_id,
          team_members:team_member_id (
            id,
            role,
            status,
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
        .in('task_id', taskIds);

      // Get contractor assignments
      const { data: contractorData } = await supabaseAdmin
        .from('event_tasks_contractors')
        .select(
          `
          task_id,
          contractor_id,
          business_profiles:contractor_id (
            id,
            company_name,
            user_id
          )
        `
        )
        .in('task_id', taskIds);

      teamMemberAssignments = teamMemberData || [];
      contractorAssignments = contractorData || [];
    }

    // Transform tasks with assignments
    const tasksWithAssignments = (tasks || []).map((task: any) => {
      const taskTeamMembers = teamMemberAssignments
        .filter((a: any) => a.task_id === task.id)
        .map((a: any) => {
          const teamMember = a.team_members;
          const user = teamMember?.users;
          const profile = Array.isArray(user?.profiles)
            ? user.profiles[0]
            : user?.profiles;

          return {
            id: teamMember?.id,
            name: profile
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : user?.email || 'Unknown',
            email: user?.email,
            role: teamMember?.role,
            avatar_url: profile?.avatar_url || null,
          };
        });

      const taskContractors = contractorAssignments
        .filter((a: any) => a.task_id === task.id)
        .map((a: any) => ({
          id: a.business_profiles?.id,
          company_name: a.business_profiles?.company_name || 'Unknown',
          user_id: a.business_profiles?.user_id,
        }));

      return {
        ...task,
        team_members: taskTeamMembers,
        contractors: taskContractors,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: tasksWithAssignments,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/tasks:', error);
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

// POST: Create a new task for an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { supabase } = createClient(request);
    const body = await request.json();
    const { title, description, due_date, team_member_ids, contractor_ids } =
      body;

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

    // Check if user can modify the event (owner, admin, or team member)
    if (event.user_id !== user.id && (user as any).role !== 'admin') {
      // Check if user is a team member of this event (including invited status)
      const { data: teamMemberRecords } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_member_id', user.id)
        .in('status', ['invited', 'active', 'onboarding']);

      const teamMemberIds = teamMemberRecords?.map(tm => tm.id) || [];

      if (teamMemberIds.length > 0) {
        // Check if any of these team members are assigned to this event
        const { data: eventTeamMemberRecords } = await supabaseAdmin
          .from('event_team_members')
          .select('id')
          .eq('event_id', eventId)
          .in('team_member_id', teamMemberIds)
          .limit(1);

        if (!eventTeamMemberRecords || eventTeamMemberRecords.length === 0) {
          return NextResponse.json(
            { error: 'Unauthorized to modify this event' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unauthorized to modify this event' },
          { status: 403 }
        );
      }
    }

    // Create the task
    const taskData: any = {
      event_id: eventId,
      title: title.trim(),
      description: description || null,
      due_date: due_date || null,
      created_by: user.id,
      status: 'todo',
      priority: 'medium',
    };

    const { data: task, error: taskError } = await supabaseAdmin
      .from('event_tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create task',
          details: taskError.message,
        },
        { status: 500 }
      );
    }

    // Handle team member assignments
    if (Array.isArray(team_member_ids) && team_member_ids.length > 0) {
      // The IDs could be either event_team_members.id or team_member_id
      // First, try to find them as event_team_members.id
      const { data: eventTeamMembers } = await supabaseAdmin
        .from('event_team_members')
        .select('id, team_member_id')
        .eq('event_id', eventId)
        .in('id', team_member_ids);

      // If not found, try as team_member_id directly
      let validTeamMemberIds: string[] = [];
      if (eventTeamMembers && eventTeamMembers.length > 0) {
        // IDs are event_team_members.id, extract team_member_id
        validTeamMemberIds = eventTeamMembers.map(
          (etm: any) => etm.team_member_id
        );
      } else {
        // IDs might be team_member_id directly, verify they belong to the event
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
            task_id: task.id,
            team_member_id: teamMemberId,
          })
        );

        const { error: teamMemberError } = await supabaseAdmin
          .from('event_tasks_team_members')
          .insert(teamMemberAssignments);

        if (teamMemberError) {
          console.error('Error assigning team members:', teamMemberError);
          // Don't fail the whole request, just log it
        }
      }
    }

    // Handle contractor assignments
    if (Array.isArray(contractor_ids) && contractor_ids.length > 0) {
      const contractorAssignments = contractor_ids.map(
        (contractorId: string) => ({
          task_id: task.id,
          contractor_id: contractorId,
        })
      );

      const { error: contractorError } = await supabaseAdmin
        .from('event_tasks_contractors')
        .insert(contractorAssignments);

      if (contractorError) {
        console.error('Error assigning contractors:', contractorError);
        // Don't fail the whole request, just log it
      }
    }

    // Fetch the complete task with assignments
    const { data: completeTask } = await supabaseAdmin
      .from('event_tasks')
      .select('*')
      .eq('id', task.id)
      .single();

    return NextResponse.json({
      success: true,
      task: completeTask,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/tasks:', error);
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
