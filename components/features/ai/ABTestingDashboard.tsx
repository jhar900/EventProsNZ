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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Eye,
  Copy,
  Download,
  Upload,
  Filter,
  Calendar,
  Activity,
  Zap,
  Award,
  Star,
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: ABTestVariant[];
  targetAudience: {
    eventTypes?: string[];
    userSegments?: string[];
    locations?: string[];
    minExperience?: number;
  };
  metrics: ABTestMetrics;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number;
  configuration: Record<string, any>;
  isControl: boolean;
}

interface ABTestMetrics {
  totalParticipants: number;
  variants: Record<
    string,
    {
      participants: number;
      conversions: number;
      conversionRate: number;
      averageEngagement: number;
      averageRating: number;
      averageTimeOnPage: number;
      bounceRate: number;
      revenue: number;
      costPerConversion: number;
    }
  >;
  statisticalSignificance: {
    isSignificant: boolean;
    confidenceLevel: number;
    pValue: number;
    winner?: string;
    improvement?: number;
  };
}

interface ABTestingDashboardProps {
  onTestCreate?: (test: ABTest) => void;
  onTestUpdate?: (testId: string, updates: Partial<ABTest>) => void;
  onTestDelete?: (testId: string) => void;
  className?: string;
}

export function ABTestingDashboard({
  onTestCreate,
  onTestUpdate,
  onTestDelete,
  className = '',
}: ABTestingDashboardProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/ab-testing');
      if (!response.ok) {
        throw new Error('Failed to load A/B tests');
      }
      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (
    testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
  ) => {
    try {
      const response = await fetch('/api/ai/ab-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      const newTest = await response.json();
      setTests(prev => [...prev, newTest]);
      setShowCreateForm(false);
      onTestCreate?.(newTest);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create test'
      );
    }
  };

  const handleUpdateTest = async (testId: string, updates: Partial<ABTest>) => {
    try {
      const response = await fetch(`/api/ai/ab-testing/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update test');
      }

      const updatedTest = await response.json();
      setTests(prev =>
        prev.map(test => (test.id === testId ? updatedTest : test))
      );
      setSelectedTest(updatedTest);
      setShowEditForm(false);
      onTestUpdate?.(testId, updates);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update test'
      );
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/ai/ab-testing/${testId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      setTests(prev => prev.filter(test => test.id !== testId));
      setSelectedTest(null);
      onTestDelete?.(testId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete test'
      );
    }
  };

  const handleTestAction = async (
    testId: string,
    action: 'start' | 'pause' | 'complete'
  ) => {
    try {
      const response = await fetch(`/api/ai/ab-testing/${testId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} test`);
      }

      await loadTests();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : `Failed to ${action} test`
      );
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <Square className="h-4 w-4" />;
      case 'draft':
        return <Edit className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading A/B tests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">A/B Testing Dashboard</h3>
          <p className="text-muted-foreground">
            Manage and monitor A/B tests for AI recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{tests.length}</div>
                    <div className="text-sm text-muted-foreground">
                      Total Tests
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tests.filter(t => t.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Tests
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tests.reduce(
                        (sum, test) => sum + test.metrics.totalParticipants,
                        0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Participants
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {
                        tests.filter(
                          t => t.metrics.statisticalSignificance.isSignificant
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Significant Results
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.slice(0, 5).map(test => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {test.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTest(test)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          {/* Tests List */}
          <div className="space-y-4">
            {tests.map(test => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{test.name}</h4>
                        <Badge className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          <span className="ml-1">{test.status}</span>
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {test.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {test.metrics.totalParticipants} participants
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{test.variants.length} variants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(test.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {test.metrics.statisticalSignificance.isSignificant
                              ? 'Significant'
                              : 'Not significant'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {test.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleTestAction(test.id, 'start')}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}

                      {test.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestAction(test.id, 'pause')}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleTestAction(test.id, 'complete')
                            }
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        </>
                      )}

                      {test.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => handleTestAction(test.id, 'start')}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTest(test);
                          setShowEditForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {selectedTest ? (
            <TestAnalytics test={selectedTest} />
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a test to view detailed analytics.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-complete">Auto-complete tests</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically complete tests when statistical significance
                    is reached
                  </p>
                </div>
                <Switch id="auto-complete" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for test updates
                  </p>
                </div>
                <Switch id="email-notifications" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-retention">Data retention</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep test data for analysis after completion
                  </p>
                </div>
                <Switch id="data-retention" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Test Form */}
      {showCreateForm && (
        <CreateTestForm
          onSave={handleCreateTest}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Test Form */}
      {showEditForm && selectedTest && (
        <EditTestForm
          test={selectedTest}
          onSave={updates => handleUpdateTest(selectedTest.id, updates)}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

// Test Analytics Component
function TestAnalytics({ test }: { test: ABTest }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{test.name} - Analytics</CardTitle>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Status */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Test Status</h4>
              <p className="text-sm text-muted-foreground">
                {test.status} • Started{' '}
                {new Date(test.startDate).toLocaleDateString()}
              </p>
            </div>
            <Badge
              className={
                test.metrics.statisticalSignificance.isSignificant
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {test.metrics.statisticalSignificance.isSignificant
                ? 'Statistically Significant'
                : 'Not Significant'}
            </Badge>
          </div>

          {/* Variants Performance */}
          <div>
            <h4 className="font-semibold mb-4">Variants Performance</h4>
            <div className="space-y-4">
              {test.variants.map(variant => {
                const metrics = test.metrics.variants[variant.id];
                return (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{variant.name}</h5>
                        {variant.isControl && (
                          <Badge variant="outline">Control</Badge>
                        )}
                        {test.metrics.statisticalSignificance.winner ===
                          variant.id && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {variant.weight}% traffic
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-2xl font-bold">
                          {metrics.participants}
                        </div>
                        <div className="text-muted-foreground">
                          Participants
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {metrics.conversionRate.toFixed(1)}%
                        </div>
                        <div className="text-muted-foreground">
                          Conversion Rate
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {metrics.averageEngagement.toFixed(1)}%
                        </div>
                        <div className="text-muted-foreground">Engagement</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          ${metrics.revenue.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Significance */}
          <div>
            <h4 className="font-semibold mb-4">Statistical Significance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {test.metrics.statisticalSignificance.confidenceLevel.toFixed(
                    1
                  )}
                  %
                </div>
                <div className="text-muted-foreground">Confidence Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {test.metrics.statisticalSignificance.pValue.toFixed(3)}
                </div>
                <div className="text-muted-foreground">P-Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {test.metrics.statisticalSignificance.improvement?.toFixed(
                    1
                  ) || 0}
                  %
                </div>
                <div className="text-muted-foreground">Improvement</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {test.metrics.totalParticipants}
                </div>
                <div className="text-muted-foreground">Total Participants</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Test Form Component
function CreateTestForm({
  onSave,
  onCancel,
}: {
  onSave: (
    test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
  ) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    variants: [
      {
        id: 'control',
        name: 'Control',
        description: 'Current version',
        weight: 50,
        isControl: true,
        configuration: {},
      },
      {
        id: 'variant',
        name: 'Variant A',
        description: 'New version',
        weight: 50,
        isControl: false,
        configuration: {},
      },
    ],
    targetAudience: {
      eventTypes: [],
      userSegments: [],
      locations: [],
      minExperience: 0,
    },
    createdBy: 'current-user',
  });

  const handleSave = () => {
    onSave({
      ...formData,
      status: 'draft',
      startDate: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create A/B Test</CardTitle>
        <CardDescription>
          Create a new A/B test to optimize AI recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="test-name">Test Name</Label>
          <Input
            id="test-name"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Recommendation Algorithm Test"
          />
        </div>

        <div>
          <Label htmlFor="test-description">Description</Label>
          <Textarea
            id="test-description"
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe what this test is trying to optimize..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create Test</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Edit Test Form Component
function EditTestForm({
  test,
  onSave,
  onCancel,
}: {
  test: ABTest;
  onSave: (updates: Partial<ABTest>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: test.name,
    description: test.description,
    variants: test.variants,
    targetAudience: test.targetAudience,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit A/B Test</CardTitle>
        <CardDescription>
          Update test configuration and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="edit-test-name">Test Name</Label>
          <Input
            id="edit-test-name"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor="edit-test-description">Description</Label>
          <Textarea
            id="edit-test-description"
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
