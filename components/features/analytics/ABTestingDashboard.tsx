'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Play,
  Pause,
  BarChart3,
  Users,
  TrendingUp,
  Target,
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  description: string;
  test_type: string;
  control_config: Record<string, any>;
  variant_config: Record<string, any>;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface ABTestResults {
  test: ABTest;
  control_results: any[];
  variant_results: any[];
  statistics: {
    control_participants: number;
    variant_participants: number;
    total_participants: number;
    control_avg_metric: number;
    variant_avg_metric: number;
    improvement_percentage: number;
    statistical_significance: number;
    confidence_level: number;
  };
}

interface ABTestingDashboardProps {
  timePeriod: string;
  className?: string;
}

export default function ABTestingDashboard({
  timePeriod,
  className,
}: ABTestingDashboardProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);

  // Form state for creating new tests
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    test_type: '',
    control_config: {},
    variant_config: {},
  });

  const fetchABTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/analytics/ab-tests');
      const data = await response.json();

      if (data.tests) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const response = await fetch(`/api/analytics/ab-tests/${testId}/results`);
      const data = await response.json();

      if (data.test_results) {
        setTestResults(data.test_results);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const createABTest = async () => {
    try {
      const response = await fetch('/api/analytics/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTest),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewTest({
          name: '',
          description: '',
          test_type: '',
          control_config: {},
          variant_config: {},
        });
        fetchABTests();
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  useEffect(() => {
    fetchABTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'search_algorithm':
        return '🔍';
      case 'filter_presentation':
        return '🔧';
      case 'result_ranking':
        return '📊';
      case 'ui_ux':
        return '🎨';
      case 'performance':
        return '⚡';
      default:
        return '🧪';
    }
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 95) return 'text-green-600';
    if (level >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              A/B Testing Dashboard
            </CardTitle>
            <CardDescription>
              Manage and monitor A/B tests for search optimization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchABTests}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New A/B Test</DialogTitle>
                  <DialogDescription>
                    Set up a new A/B test to optimize search performance.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Test Name</Label>
                    <Input
                      id="name"
                      value={newTest.name}
                      onChange={e =>
                        setNewTest({ ...newTest, name: e.target.value })
                      }
                      placeholder="Enter test name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTest.description}
                      onChange={e =>
                        setNewTest({ ...newTest, description: e.target.value })
                      }
                      placeholder="Describe what this test is measuring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="test_type">Test Type</Label>
                    <Select
                      value={newTest.test_type}
                      onValueChange={value =>
                        setNewTest({ ...newTest, test_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search_algorithm">
                          Search Algorithm
                        </SelectItem>
                        <SelectItem value="filter_presentation">
                          Filter Presentation
                        </SelectItem>
                        <SelectItem value="result_ranking">
                          Result Ranking
                        </SelectItem>
                        <SelectItem value="ui_ux">UI/UX</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createABTest}>Create Test</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* A/B Tests List */}
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>
                    No A/B tests found. Create your first test to start
                    optimizing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map(test => (
                    <div
                      key={test.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getTestTypeIcon(test.test_type)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{test.name}</h4>
                              <Badge
                                variant="outline"
                                className={getStatusColor(test.status)}
                              >
                                {test.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {test.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.status === 'active' && (
                            <Button variant="outline" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {test.status === 'paused' && (
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTest(test);
                              fetchTestResults(test.id);
                            }}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 capitalize">
                            {test.test_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Created:
                          </span>
                          <span className="ml-2">
                            {new Date(test.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Duration:
                          </span>
                          <span className="ml-2">
                            {test.start_date && test.end_date
                              ? `${Math.ceil((new Date(test.end_date).getTime() - new Date(test.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                              : 'Not started'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Results Modal */}
            {selectedTest && testResults && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-4">
                  Test Results: {selectedTest.name}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Control Group</span>
                      <Badge variant="outline">Control</Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {testResults.statistics.control_avg_metric.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testResults.statistics.control_participants} participants
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Variant Group</span>
                      <Badge variant="outline">Variant</Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {testResults.statistics.variant_avg_metric.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testResults.statistics.variant_participants} participants
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Improvement:
                      </span>
                      <div
                        className={`text-lg font-bold ${testResults.statistics.improvement_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {testResults.statistics.improvement_percentage > 0
                          ? '+'
                          : ''}
                        {formatPercentage(
                          testResults.statistics.improvement_percentage
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Confidence Level:
                      </span>
                      <div
                        className={`text-lg font-bold ${getConfidenceColor(testResults.statistics.confidence_level)}`}
                      >
                        {testResults.statistics.confidence_level}%
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Total Participants:
                      </span>
                      <div className="text-lg font-bold">
                        {testResults.statistics.total_participants}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* A/B Testing Insights */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">A/B Testing Insights</h4>
              <div className="space-y-2 text-sm">
                {tests.filter(t => t.status === 'active').length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">🧪</span>
                    <span>
                      {tests.filter(t => t.status === 'active').length} active
                      tests running
                    </span>
                  </div>
                )}
                {tests.filter(t => t.status === 'completed').length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <span>
                      {tests.filter(t => t.status === 'completed').length}{' '}
                      completed tests
                    </span>
                  </div>
                )}
                {tests.length === 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600">💡</span>
                    <span>
                      Start with simple tests like search algorithm variations
                      or filter presentation changes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
