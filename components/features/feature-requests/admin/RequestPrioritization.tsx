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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
  Users,
  DollarSign,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  vote_count: number;
  view_count: number;
  created_at: string;
  category?: {
    name: string;
    color: string;
  };
  author?: {
    first_name: string;
    last_name: string;
  };
  impact_score?: number;
  effort_score?: number;
  priority_score?: number;
}

interface PrioritizationCriteria {
  impact_weight: number;
  effort_weight: number;
  urgency_weight: number;
  community_weight: number;
  business_weight: number;
}

export default function RequestPrioritization() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<PrioritizationCriteria>({
    impact_weight: 30,
    effort_weight: 25,
    urgency_weight: 20,
    community_weight: 15,
    business_weight: 10,
  });
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (autoCalculate) {
      calculatePriorityScores();
    }
  }, [criteria, autoCalculate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/admin/feature-requests?status=submitted,under_review,planned'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriorityScores = () => {
    const updatedRequests = requests.map(request => {
      // Calculate impact score based on votes, views, and comments
      const communityEngagement =
        request.vote_count * 2 +
        request.view_count * 0.1 +
        (request.comments_count || 0);
      const impactScore = Math.min(100, communityEngagement / 10);

      // Calculate effort score (inverse - lower effort = higher score)
      const effortScore = Math.max(10, 100 - (request.effort_estimate || 50));

      // Calculate urgency score based on age and status
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(request.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const urgencyScore = Math.min(100, daysSinceCreated * 2);

      // Calculate business value (placeholder - would be based on business metrics)
      const businessScore =
        request.priority === 'urgent'
          ? 100
          : request.priority === 'high'
            ? 80
            : request.priority === 'medium'
              ? 60
              : 40;

      // Calculate weighted priority score
      const priorityScore =
        (impactScore * criteria.impact_weight) / 100 +
        (effortScore * criteria.effort_weight) / 100 +
        (urgencyScore * criteria.urgency_weight) / 100 +
        (communityEngagement * criteria.community_weight) / 100 +
        (businessScore * criteria.business_weight) / 100;

      return {
        ...request,
        impact_score: Math.round(impactScore),
        effort_score: Math.round(effortScore),
        priority_score: Math.round(priorityScore),
      };
    });

    // Sort by priority score
    updatedRequests.sort(
      (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
    );
    setRequests(updatedRequests);
  };

  const handleCriteriaChange = (
    key: keyof PrioritizationCriteria,
    value: number
  ) => {
    setCriteria(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleManualPriorityUpdate = async (
    requestId: string,
    newPriority: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/${requestId}/priority`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      if (response.ok) {
        toast.success('Priority updated successfully');
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update priority');
      }
    } catch (err) {
      console.error('Error updating priority:', err);
      toast.error('Failed to update priority');
    }
  };

  const handleBulkPriorityUpdate = async (newPriority: string) => {
    if (selectedRequests.length === 0) {
      toast.error('Please select requests to update priority');
      return;
    }

    try {
      const response = await fetch('/api/admin/feature-requests/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_ids: selectedRequests,
          action: `priority_${newPriority}`,
        }),
      });

      if (response.ok) {
        toast.success(`Bulk priority update to ${newPriority} completed`);
        setSelectedRequests([]);
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update priorities');
      }
    } catch (err) {
      console.error('Error updating priorities:', err);
      toast.error('Failed to update priorities');
    }
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRequests(
      selectedRequests.length === requests.length ? [] : requests.map(r => r.id)
    );
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
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
          <Button onClick={fetchRequests} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prioritization Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prioritization Criteria
          </CardTitle>
          <CardDescription>
            Configure how feature requests are automatically prioritized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact-weight">Impact Weight</Label>
              <div className="space-y-2">
                <Slider
                  id="impact-weight"
                  min={0}
                  max={100}
                  step={5}
                  value={[criteria.impact_weight]}
                  onValueChange={([value]) =>
                    handleCriteriaChange('impact_weight', value)
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">{criteria.impact_weight}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effort-weight">Effort Weight</Label>
              <div className="space-y-2">
                <Slider
                  id="effort-weight"
                  min={0}
                  max={100}
                  step={5}
                  value={[criteria.effort_weight]}
                  onValueChange={([value]) =>
                    handleCriteriaChange('effort_weight', value)
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">{criteria.effort_weight}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency-weight">Urgency Weight</Label>
              <div className="space-y-2">
                <Slider
                  id="urgency-weight"
                  min={0}
                  max={100}
                  step={5}
                  value={[criteria.urgency_weight]}
                  onValueChange={([value]) =>
                    handleCriteriaChange('urgency_weight', value)
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">
                    {criteria.urgency_weight}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-weight">Community Weight</Label>
              <div className="space-y-2">
                <Slider
                  id="community-weight"
                  min={0}
                  max={100}
                  step={5}
                  value={[criteria.community_weight]}
                  onValueChange={([value]) =>
                    handleCriteriaChange('community_weight', value)
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">
                    {criteria.community_weight}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-weight">Business Weight</Label>
              <div className="space-y-2">
                <Slider
                  id="business-weight"
                  min={0}
                  max={100}
                  step={5}
                  value={[criteria.business_weight]}
                  onValueChange={([value]) =>
                    handleCriteriaChange('business_weight', value)
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">
                    {criteria.business_weight}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-calculate"
                checked={autoCalculate}
                onChange={e => setAutoCalculate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="auto-calculate">
                Auto-calculate priority scores
              </Label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={calculatePriorityScores}
                disabled={autoCalculate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Criteria
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedRequests.length} request(s) selected
              </span>
              <div className="flex space-x-2">
                <Select onValueChange={handleBulkPriorityUpdate}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Set Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequests([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prioritized Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prioritized Requests
          </CardTitle>
          <CardDescription>
            Feature requests ranked by calculated priority score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedRequests.length === requests.length &&
                        requests.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Priority Score</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Effort</TableHead>
                  <TableHead>Current Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request, index) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {request.description}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          {request.category && (
                            <Badge variant="outline" className="text-xs">
                              {request.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-lg font-bold ${getScoreColor(request.priority_score || 0)}`}
                      >
                        {request.priority_score || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-sm ${getScoreColor(request.impact_score || 0)}`}
                      >
                        {request.impact_score || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-sm ${getScoreColor(request.effort_score || 0)}`}
                      >
                        {request.effort_score || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={request.priority}
                        onValueChange={value =>
                          handleManualPriorityUpdate(request.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
