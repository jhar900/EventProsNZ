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
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Send,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
} from 'lucide-react';

interface SatisfactionData {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  job_id: string;
  job_title: string;
  rating: number;
  feedback: string;
  category: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
  response?: string;
  responded_at?: string;
  tags: string[];
}

interface SatisfactionMetrics {
  totalResponses: number;
  averageRating: number;
  responseRate: number;
  satisfactionTrend: number;
  topCategories: Array<{
    category: string;
    averageRating: number;
    count: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  trends: Array<{
    date: string;
    averageRating: number;
    responseCount: number;
  }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonThemes: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
}

interface SurveyCampaign {
  id: string;
  name: string;
  targetAudience: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  responseRate: number;
  averageRating: number;
  totalSent: number;
  totalResponses: number;
  created_at: string;
  scheduled_for?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserSatisfactionTracker() {
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData[]>(
    []
  );
  const [filteredData, setFilteredData] = useState<SatisfactionData[]>([]);
  const [metrics, setMetrics] = useState<SatisfactionMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<SurveyCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeRange: '30d',
    rating: 'all',
    status: 'all',
    category: 'all',
    search: '',
  });
  const [newSurvey, setNewSurvey] = useState({
    name: '',
    targetAudience: 'all',
    scheduled_for: '',
  });

  const loadSatisfactionData = async () => {
    try {
      setIsLoading(true);
      const [dataResponse, metricsResponse, campaignsResponse] =
        await Promise.all([
          fetch(`/api/admin/users/satisfaction?timeRange=${filters.timeRange}`),
          fetch('/api/admin/users/satisfaction/metrics'),
          fetch('/api/admin/users/satisfaction/campaigns'),
        ]);

      if (dataResponse.ok) {
        const satisfactionResponse = await dataResponse.json();
        setSatisfactionData(satisfactionResponse.feedback || []);
        setFilteredData(satisfactionResponse.feedback || []);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error('Error loading satisfaction data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSatisfactionData();
  }, [filters.timeRange]);

  useEffect(() => {
    let filtered = satisfactionData;

    if (filters.rating !== 'all') {
      const ratingValue = parseInt(filters.rating);
      filtered = filtered.filter(item => item.rating === ratingValue);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.user_name.toLowerCase().includes(searchLower) ||
          item.job_title.toLowerCase().includes(searchLower) ||
          item.feedback.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
  }, [satisfactionData, filters]);

  const sendSurvey = async (campaignId: string) => {
    try {
      const response = await fetch(
        `/api/admin/users/satisfaction/campaigns/${campaignId}/send`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        await loadSatisfactionData();
      }
    } catch (error) {
      console.error('Error sending survey:', error);
    }
  };

  const createSurveyCampaign = async () => {
    try {
      const response = await fetch('/api/admin/users/satisfaction/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSurvey),
      });

      if (response.ok) {
        await loadSatisfactionData();
        setNewSurvey({
          name: '',
          targetAudience: 'all',
          scheduled_for: '',
        });
      }
    } catch (error) {
      console.error('Error creating survey campaign:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'reviewed':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Reviewed
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading satisfaction data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            User Satisfaction Tracker
          </h1>
          <p className="text-muted-foreground">
            Monitor user satisfaction, collect feedback, and improve user
            experience
          </p>
        </div>
        <Button onClick={loadSatisfactionData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageRating.toFixed(1)}/5
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalResponses} total responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Rate
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.responseRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Survey completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfaction Trend
              </CardTitle>
              {metrics.satisfactionTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${metrics.satisfactionTrend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {metrics.satisfactionTrend > 0 ? '+' : ''}
                {metrics.satisfactionTrend.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Positive Sentiment
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.sentimentAnalysis.positive.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Positive feedback</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter satisfaction data and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select
                value={filters.timeRange}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, timeRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Rating</label>
              <Select
                value={filters.rating}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, rating: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="decorations">Decorations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback ({filteredData.length})</CardTitle>
              <CardDescription>
                Recent user satisfaction feedback and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{item.user_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.user_email}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(item.rating)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(item.status)}
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-medium">
                        Job: {item.job_title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {item.feedback}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Distribution of user ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
                <CardDescription>Average rating over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip formatter={value => [`${value}/5`, 'Rating']} />
                    <Line
                      type="monotone"
                      dataKey="averageRating"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Average satisfaction by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topCategories.map(category => (
                  <div
                    key={category.category}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">
                        {category.category}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {getRatingStars(Math.round(category.averageRating))}
                        </div>
                        <span className="font-medium">
                          {category.averageRating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.count} responses
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Survey Campaigns</CardTitle>
              <CardDescription>
                Manage satisfaction survey campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: {campaign.targetAudience} • Status:{' '}
                          {campaign.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{campaign.status}</Badge>
                        {campaign.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendSurvey(campaign.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Sent</div>
                        <div className="font-medium">{campaign.totalSent}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Responses</div>
                        <div className="font-medium">
                          {campaign.totalResponses}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          Response Rate
                        </div>
                        <div className="font-medium">
                          {campaign.responseRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Avg Rating</div>
                        <div className="font-medium">
                          {campaign.averageRating.toFixed(1)}/5
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Insights</CardTitle>
              <CardDescription>
                Key insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        High Satisfaction Areas
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Users consistently rate job matching and contractor
                        quality highly. Continue focusing on these strengths.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">
                        Improvement Areas
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Response time and communication could be improved.
                        Consider implementing automated status updates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Trending Themes
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Users frequently mention ease of use and helpful
                        customer support. These are key differentiators to
                        highlight in marketing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
