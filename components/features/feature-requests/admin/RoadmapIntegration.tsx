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
  Calendar,
  Plus,
  Edit,
  Trash2,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  GitBranch,
  Users,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  feature_request_ids: string[];
  created_at: string;
  updated_at: string;
  feature_requests?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  vote_count: number;
  created_at: string;
  category?: {
    name: string;
    color: string;
  };
}

export default function RoadmapIntegration() {
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('milestones');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] =
    useState<RoadmapMilestone | null>(null);

  // Form state for creating milestones
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    target_date: '',
    feature_request_ids: [] as string[],
  });

  useEffect(() => {
    fetchMilestones();
    fetchFeatureRequests();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/roadmap');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch milestones');
      }

      setMilestones(data.milestones || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch milestones'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureRequests = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests?status=planned,in_development'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feature requests');
      }

      setFeatureRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching feature requests:', err);
    }
  };

  const handleCreateMilestone = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneForm),
      });

      if (response.ok) {
        toast.success('Milestone created successfully');
        setShowCreateDialog(false);
        setMilestoneForm({
          title: '',
          description: '',
          target_date: '',
          feature_request_ids: [],
        });
        fetchMilestones();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create milestone');
      }
    } catch (err) {
      console.error('Error creating milestone:', err);
      toast.error('Failed to create milestone');
    }
  };

  const handleUpdateMilestone = async (
    milestoneId: string,
    updates: Partial<RoadmapMilestone>
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/roadmap/${milestoneId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        toast.success('Milestone updated successfully');
        fetchMilestones();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update milestone');
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
      toast.error('Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/roadmap/${milestoneId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Milestone deleted successfully');
        fetchMilestones();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete milestone');
      }
    } catch (err) {
      console.error('Error deleting milestone:', err);
      toast.error('Failed to delete milestone');
    }
  };

  const handleAddFeatureRequest = async (
    milestoneId: string,
    featureRequestId: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/roadmap/${milestoneId}/feature-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feature_request_id: featureRequestId }),
        }
      );

      if (response.ok) {
        toast.success('Feature request added to milestone');
        fetchMilestones();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add feature request');
      }
    } catch (err) {
      console.error('Error adding feature request:', err);
      toast.error('Failed to add feature request');
    }
  };

  const handleRemoveFeatureRequest = async (
    milestoneId: string,
    featureRequestId: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/roadmap/${milestoneId}/feature-requests/${featureRequestId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Feature request removed from milestone');
        fetchMilestones();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove feature request');
      }
    } catch (err) {
      console.error('Error removing feature request:', err);
      toast.error('Failed to remove feature request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4 text-blue-500" />;
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
      case 'planned':
        return 'bg-blue-100 text-blue-800';
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
          <Button onClick={fetchMilestones} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roadmap Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Milestones
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milestones.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'planned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roadmap Milestones</CardTitle>
                  <CardDescription>
                    Manage development milestones and feature request
                    assignments
                  </CardDescription>
                </div>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Roadmap Milestone</DialogTitle>
                      <DialogDescription>
                        Create a new milestone for the development roadmap
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="milestone-title">Title</Label>
                        <Input
                          id="milestone-title"
                          value={milestoneForm.title}
                          onChange={e =>
                            setMilestoneForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Enter milestone title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-description">
                          Description
                        </Label>
                        <Textarea
                          id="milestone-description"
                          value={milestoneForm.description}
                          onChange={e =>
                            setMilestoneForm(prev => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Enter milestone description"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="target-date">Target Date</Label>
                        <Input
                          id="target-date"
                          type="date"
                          value={milestoneForm.target_date}
                          onChange={e =>
                            setMilestoneForm(prev => ({
                              ...prev,
                              target_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Feature Requests</Label>
                        <Select
                          onValueChange={value => {
                            if (
                              !milestoneForm.feature_request_ids.includes(value)
                            ) {
                              setMilestoneForm(prev => ({
                                ...prev,
                                feature_request_ids: [
                                  ...prev.feature_request_ids,
                                  value,
                                ],
                              }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add feature request to milestone" />
                          </SelectTrigger>
                          <SelectContent>
                            {featureRequests.map(request => (
                              <SelectItem key={request.id} value={request.id}>
                                {request.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {milestoneForm.feature_request_ids.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {milestoneForm.feature_request_ids.map(id => {
                              const request = featureRequests.find(
                                r => r.id === id
                              );
                              return request ? (
                                <div
                                  key={id}
                                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                >
                                  <span className="text-sm">
                                    {request.title}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setMilestoneForm(prev => ({
                                        ...prev,
                                        feature_request_ids:
                                          prev.feature_request_ids.filter(
                                            rid => rid !== id
                                          ),
                                      }))
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateMilestone}>
                          Create Milestone
                        </Button>
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
                      <TableHead>Milestone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead>Feature Requests</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milestones.map(milestone => (
                      <TableRow key={milestone.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{milestone.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {milestone.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(milestone.status)}
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              milestone.target_date
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {milestone.feature_request_ids.length} requests
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMilestone(milestone)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteMilestone(milestone.id)
                              }
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

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Timeline</CardTitle>
              <CardDescription>
                Visual timeline of planned milestones and feature releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones
                  .sort(
                    (a, b) =>
                      new Date(a.target_date).getTime() -
                      new Date(b.target_date).getTime()
                  )
                  .map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            milestone.status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : milestone.status === 'in_progress'
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : milestone.status === 'in_progress' ? (
                            <GitBranch className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {milestone.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(
                                milestone.target_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {milestone.description}
                        </p>
                        {milestone.feature_requests &&
                          milestone.feature_requests.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {milestone.feature_requests.map(request => (
                                <Badge
                                  key={request.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {request.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                      </div>
                      {index < milestones.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
