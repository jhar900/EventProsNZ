import { Metadata } from 'next';
import { LegalContentManager } from '@/components/features/legal/LegalContentManager';
import { ComplianceTracker } from '@/components/features/legal/ComplianceTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Legal Management | EventProsNZ Admin',
  description: 'Manage legal documents, compliance, and legal inquiries.',
};

export default function LegalAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Legal Management
            </h1>
            <p className="text-gray-600">
              Manage legal documents, compliance status, and legal inquiries.
            </p>
          </div>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content Management</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Tracker</TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <LegalContentManager isAdmin={true} />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceTracker isAdmin={true} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
