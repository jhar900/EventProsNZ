'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';

interface EventTasksProps {
  eventId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  team_members?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  }>;
  contractors?: Array<{
    id: string;
    company_name: string;
    user_id: string;
  }>;
}

export function EventTasks({ eventId }: EventTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (eventId && user?.id) {
      loadTasks();
    }
  }, [eventId, user?.id]);

  const loadTasks = async () => {
    if (!user?.id || !eventId) {
      return;
    }

    try {
      setIsLoading(true);
      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
      return;
    }

    try {
      const headers: HeadersInit = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/events/${eventId}/tasks/${task.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete task';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Tasks</CardTitle>
            <CardDescription>
              Manage tasks and to-dos for this event
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddTaskModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No tasks yet. Create your first task to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1 capitalize">
                        {task.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const allAssignments: Array<{
                          id: string;
                          name: string;
                          role?: string;
                          avatar_url?: string | null;
                          type: 'team_member' | 'contractor';
                        }> = [];

                        if (task.team_members && task.team_members.length > 0) {
                          allAssignments.push(
                            ...task.team_members.map(tm => ({
                              id: tm.id,
                              name: tm.name,
                              role: tm.role,
                              avatar_url: tm.avatar_url,
                              type: 'team_member' as const,
                            }))
                          );
                        }
                        if (task.contractors && task.contractors.length > 0) {
                          allAssignments.push(
                            ...task.contractors.map(c => ({
                              id: c.id,
                              name: c.company_name,
                              role: 'Contractor',
                              avatar_url: null,
                              type: 'contractor' as const,
                            }))
                          );
                        }

                        if (allAssignments.length === 0) {
                          return (
                            <span className="text-muted-foreground text-sm">
                              Unassigned
                            </span>
                          );
                        }

                        return allAssignments.map((assignment, index) => (
                          <div
                            key={`${assignment.type}-${assignment.id}-${index}`}
                            className="relative group"
                          >
                            <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-110">
                              {assignment.avatar_url &&
                              assignment.avatar_url.trim() ? (
                                <AvatarImage
                                  src={assignment.avatar_url}
                                  alt={assignment.name}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                {getInitials(assignment.name)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Hover Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform group-hover:scale-100 scale-95">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
                                <div className="font-medium">
                                  {assignment.name}
                                </div>
                                {assignment.role && (
                                  <div className="text-gray-300 text-xs mt-0.5">
                                    {assignment.role}
                                  </div>
                                )}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        eventId={eventId}
        onSuccess={() => {
          loadTasks();
        }}
      />

      <EditTaskModal
        isOpen={showEditTaskModal}
        onClose={() => {
          setShowEditTaskModal(false);
          setSelectedTask(null);
        }}
        eventId={eventId}
        task={selectedTask}
        onSuccess={() => {
          loadTasks();
          setShowEditTaskModal(false);
          setSelectedTask(null);
        }}
      />
    </Card>
  );
}
