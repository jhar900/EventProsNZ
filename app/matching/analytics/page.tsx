'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Star,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react';

interface AnalyticsPageProps {
  searchParams: {
    eventId?: string;
  };
}

// Mock data for analytics
const matchingData = [
  { name: 'Compatibility', value: 85, color: '#8884d8' },
  { name: 'Availability', value: 92, color: '#82ca9d' },
  { name: 'Budget', value: 78, color: '#ffc658' },
  { name: 'Location', value: 88, color: '#ff7300' },
  { name: 'Performance', value: 82, color: '#00ff00' },
];

const contractorData = [
  { name: 'Premium', value: 15, color: '#8884d8' },
  { name: 'Standard', value: 35, color: '#82ca9d' },
  { name: 'Basic', value: 50, color: '#ffc658' },
];

const scoreDistribution = [
  { score: '90-100%', count: 12, color: '#22c55e' },
  { score: '80-89%', count: 18, color: '#84cc16' },
  { score: '70-79%', count: 25, color: '#eab308' },
  { score: '60-69%', count: 15, color: '#f97316' },
  { score: '50-59%', count: 8, color: '#ef4444' },
];

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const eventId = searchParams.eventId;

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Event ID Required
          </h1>
          <p className="text-muted-foreground">
            Please provide a valid event ID to view matching analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Matching Analytics</h1>
          <p className="text-muted-foreground">
            Analyze contractor matching performance and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Total Matches</span>
              </div>
              <p className="text-2xl font-bold">78</p>
              <p className="text-sm text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Premium Matches</span>
              </div>
              <p className="text-2xl font-bold">15</p>
              <p className="text-sm text-muted-foreground">19% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Avg Score</span>
              </div>
              <p className="text-2xl font-bold">82%</p>
              <p className="text-sm text-muted-foreground">
                +5% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Response Time</span>
              </div>
              <p className="text-2xl font-bold">4.2h</p>
              <p className="text-sm text-muted-foreground">
                -0.8h from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Contractor Types */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contractorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contractorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Matching Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Matching Factors Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchingData.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {factor.value}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {factor.value >= 90
                          ? 'Excellent'
                          : factor.value >= 80
                            ? 'Good'
                            : factor.value >= 70
                              ? 'Fair'
                              : 'Poor'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={factor.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Location Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="font-medium">Local Contractors</p>
                <p className="text-2xl font-bold text-blue-600">45</p>
                <p className="text-sm text-muted-foreground">Within 25km</p>
              </div>
              <div className="text-center space-y-2">
                <DollarSign className="h-8 w-8 text-green-500 mx-auto" />
                <p className="font-medium">Budget Matches</p>
                <p className="text-2xl font-bold text-green-600">32</p>
                <p className="text-sm text-muted-foreground">
                  Within budget range
                </p>
              </div>
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 text-purple-500 mx-auto" />
                <p className="font-medium">Available</p>
                <p className="text-2xl font-bold text-purple-600">28</p>
                <p className="text-sm text-muted-foreground">For event date</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">High Compatibility Matches</p>
                  <p className="text-sm text-muted-foreground">
                    Focus on contractors with 85%+ compatibility scores for
                    better outcomes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Location Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Consider expanding search radius to 50km for more options
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Budget Flexibility</p>
                  <p className="text-sm text-muted-foreground">
                    Increase budget range by 10% to access premium contractors
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
