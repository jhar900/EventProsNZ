'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Eye,
  Link,
  Unlink,
  Sync,
  Calendar,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  feature_request_id?: string;
  feature_request?: {
    title: string;
    status: string;
  };
  project_id?: string;
  project?: {
    name: string;
    status: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  tasks_count: number;
  completed_tasks_count: number;
}

interface IntegrationSettings {
  enabled: boolean;
  auto_create_tasks: boolean;
  sync_status: boolean;
  sync_assignments: boolean;
  webhook_url?: string;
  api_key?: string;
}

export default function ProjectManagementIntegration() {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<IntegrationSettings>({
    enabled: false,
    auto_create_tasks: false,
    sync_status: false,
    sync_assignments: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

  // Form state for creating tasks
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigned_to: '',
    due_date: '',
    feature_request_id: '',
    project_id: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchSettings();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/project-tasks');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/integration-settings'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.settings || settings);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/project-tasks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskForm),
        }
      );

      if (response.ok) {
        toast.success('Task created successfully');
        setShowCreateDialog(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'medium',
          assigned_to: '',
          due_date: '',
          feature_request_id: '',
          project_id: '',
        });
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<ProjectTask>
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/project-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        toast.success('Task updated successfully');
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/project-tasks/${taskId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Task deleted successfully');
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    }
  };

  const handleSyncTasks = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/sync-tasks', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Tasks synchronized successfully');
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sync tasks');
      }
    } catch (err) {
      console.error('Error syncing tasks:', err);
      toast.error('Failed to sync tasks');
    }
  };

  const handleUpdateSettings = async (
    newSettings: Partial<IntegrationSettings>
  ) => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/integration-settings',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        }
      );

      if (response.ok) {
        toast.success('Settings updated successfully');
        setSettings(prev => ({ ...prev, ...newSettings }));
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <GitBranch className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchTasks} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Project Management Integration
              </CardTitle>
              <CardDescription>
                Connect feature requests with project management tools
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleSyncTasks}>
                <Sync className="h-4 w-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-sm text-gray-500">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {tasks.filter(t => t.feature_request_id).length}
              </div>
              <div className="text-sm text-gray-500">Linked to Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>
                    Manage tasks created from feature requests
                  </CardDescription>
                </div>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Project Task</DialogTitle>
                      <DialogDescription>
                        Create a new task from a feature request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                          id="task-title"
                          value={taskForm.title}
                          onChange={e =>
                            setTaskForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          value={taskForm.description}
                          onChange={e =>
                            setTaskForm(prev => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Enter task description"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select
                            value={taskForm.priority}
                            onValueChange={(value: any) =>
                              setTaskForm(prev => ({
                                ...prev,
                                priority: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="task-due-date">Due Date</Label>
                          <Input
                            id="task-due-date"
                            type="date"
                            value={taskForm.due_date}
                            onChange={e =>
                              setTaskForm(prev => ({
                                ...prev,
                                due_date: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-assigned">Assigned To</Label>
                          <Input
                            id="task-assigned"
                            value={taskForm.assigned_to}
                            onChange={e =>
                              setTaskForm(prev => ({
                                ...prev,
                                assigned_to: e.target.value,
                              }))
                            }
                            placeholder="Enter assignee"
                          />
                        </div>
                        <div>
                          <Label htmlFor="task-project">Project</Label>
                          <Select
                            value={taskForm.project_id}
                            onValueChange={value =>
                              setTaskForm(prev => ({
                                ...prev,
                                project_id: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Feature Request</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {task.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {task.assigned_to || 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : 'No due date'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.feature_request ? (
                            <div className="flex items-center space-x-2">
                              <Link className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-blue-600">
                                {task.feature_request.title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Not linked
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTask(task)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateTask(task.id, {
                                  status:
                                    task.status === 'completed'
                                      ? 'todo'
                                      : 'completed',
                                })
                              }
                            >
                              {task.status === 'completed' ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage projects and their associated tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.completed_tasks_count} / {project.tasks_count}{' '}
                        tasks completed
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {project.end_date
                          ? new Date(project.end_date).toLocaleDateString()
                          : 'Ongoing'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure project management integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Integration</div>
                    <div className="text-sm text-gray-500">
                      Enable project management integration
                    </div>
                  </div>
                  <Button
                    variant={settings.enabled ? 'default' : 'outline'}
                    onClick={() =>
                      handleUpdateSettings({ enabled: !settings.enabled })
                    }
                  >
                    {settings.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Create Tasks</div>
                    <div className="text-sm text-gray-500">
                      Automatically create tasks from approved feature requests
                    </div>
                  </div>
                  <Button
                    variant={settings.auto_create_tasks ? 'default' : 'outline'}
                    onClick={() =>
                      handleUpdateSettings({
                        auto_create_tasks: !settings.auto_create_tasks,
                      })
                    }
                  >
                    {settings.auto_create_tasks ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sync Status</div>
                    <div className="text-sm text-gray-500">
                      Synchronize status between feature requests and tasks
                    </div>
                  </div>
                  <Button
                    variant={settings.sync_status ? 'default' : 'outline'}
                    onClick={() =>
                      handleUpdateSettings({
                        sync_status: !settings.sync_status,
                      })
                    }
                  >
                    {settings.sync_status ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sync Assignments</div>
                    <div className="text-sm text-gray-500">
                      Synchronize assignments between feature requests and tasks
                    </div>
                  </div>
                  <Button
                    variant={settings.sync_assignments ? 'default' : 'outline'}
                    onClick={() =>
                      handleUpdateSettings({
                        sync_assignments: !settings.sync_assignments,
                      })
                    }
                  >
                    {settings.sync_assignments ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
