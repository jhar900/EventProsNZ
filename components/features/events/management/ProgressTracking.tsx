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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Target,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

interface ProgressTrackingProps {
  eventId: string;
}

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
}

export function ProgressTracking({ eventId }: ProgressTrackingProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    milestone_date: '',
    description: '',
  });

  useEffect(() => {
    loadMilestones();
  }, [eventId]);

  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/milestones`);
      const data = await response.json();

      if (data.success) {
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.milestone_name || !newMilestone.milestone_date) return;

    try {
      setIsCreating(true);
      const response = await fetch(`/api/events/${eventId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMilestone),
      });

      const data = await response.json();

      if (data.success) {
        setNewMilestone({
          milestone_name: '',
          milestone_date: '',
          description: '',
        });
        setShowCreateForm(false);
        await loadMilestones();
      } else {
        }
    } catch (error) {
      } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, status: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/milestones/${milestoneId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadMilestones();
      } else {
        }
    } catch (error) {
      }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
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
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return (completed / milestones.length) * 100;
  };

  const getUpcomingMilestones = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.milestone_date);
      return (
        milestoneDate <= nextWeek &&
        milestoneDate >= now &&
        milestone.status === 'pending'
      );
    });
  };

  const getOverdueMilestones = () => {
    const now = new Date();

    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.milestone_date);
      return milestoneDate < now && milestone.status === 'pending';
    });
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

  const progress = calculateProgress();
  const upcomingMilestones = getUpcomingMilestones();
  const overdueMilestones = getOverdueMilestones();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Progress Overview
          </CardTitle>
          <CardDescription>
            Track milestone completion and overall progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">
                  {milestones.filter(m => m.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-medium">
                  {milestones.filter(m => m.status === 'pending').length}
                </div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{milestones.length}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(upcomingMilestones.length > 0 || overdueMilestones.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Milestone Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueMilestones.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-800">
                      {overdueMilestones.length} overdue milestone(s)
                    </span>
                  </div>
                </div>
              )}
              {upcomingMilestones.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      {upcomingMilestones.length} milestone(s) due soon
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Milestone Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add New Milestone
          </CardTitle>
          <CardDescription>
            Create a new milestone to track progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone_name">Milestone Name</Label>
                  <Input
                    id="milestone_name"
                    placeholder="Enter milestone name..."
                    value={newMilestone.milestone_name}
                    onChange={e =>
                      setNewMilestone(prev => ({
                        ...prev,
                        milestone_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone_date">Due Date</Label>
                  <Input
                    id="milestone_date"
                    type="datetime-local"
                    value={newMilestone.milestone_date}
                    onChange={e =>
                      setNewMilestone(prev => ({
                        ...prev,
                        milestone_date: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter milestone description..."
                  value={newMilestone.description}
                  onChange={e =>
                    setNewMilestone(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCreateMilestone}
                  disabled={
                    !newMilestone.milestone_name ||
                    !newMilestone.milestone_date ||
                    isCreating
                  }
                >
                  {isCreating ? 'Creating...' : 'Create Milestone'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewMilestone({
                      milestone_name: '',
                      milestone_date: '',
                      description: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Milestones
          </CardTitle>
          <CardDescription>All milestones for this event</CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No milestones created yet
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(milestone.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {milestone.milestone_name}
                        </h3>
                        <Badge className={getStatusColor(milestone.status)}>
                          {getStatusLabel(milestone.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(milestone.milestone_date)}
                      </div>
                    </div>
                    {milestone.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center space-x-2">
                      {milestone.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateMilestone(milestone.id, 'in_progress')
                          }
                        >
                          Start
                        </Button>
                      )}
                      {milestone.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateMilestone(milestone.id, 'completed')
                          }
                        >
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
