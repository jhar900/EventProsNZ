import { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMonitoring from '@/components/features/analytics/PerformanceMonitoring';
import ABTestingDashboard from '@/components/features/analytics/ABTestingDashboard';

export const metadata: Metadata = {
  title: 'Performance Monitoring | EventProsNZ Admin',
  description: 'Monitor system performance and A/B testing results',
};

export default function PerformanceMonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor system performance and manage A/B tests
          </p>
        </div>

        {/* Performance Tabs */}
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Performance</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <PerformanceMonitoring timePeriod="week" />
          </TabsContent>

          <TabsContent value="ab-testing">
            <ABTestingDashboard timePeriod="week" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
