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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react';

interface PrivacyPolicy {
  id: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  isActive: boolean;
  dataHandlingProcedures: Array<{
    procedure: string;
    description: string;
    legalBasis: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface PolicyAcceptance {
  id: string;
  policyId: string;
  userId: string;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
  version: string;
}

export default function PrivacyPolicyManager() {
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
  const [acceptances, setAcceptances] = useState<PolicyAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PrivacyPolicy | null>(
    null
  );
  const [viewingPolicy, setViewingPolicy] = useState<PrivacyPolicy | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: '',
    effectiveDate: '',
    dataHandlingProcedures: [] as Array<{
      procedure: string;
      description: string;
      legalBasis: string;
    }>,
  });

  useEffect(() => {
    loadPolicies();
    loadAcceptances();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      const mockPolicies: PrivacyPolicy[] = [
        {
          id: '1',
          title: 'Privacy Policy v2.1',
          content: 'This is the main privacy policy content...',
          version: '2.1',
          effectiveDate: '2024-01-15T00:00:00Z',
          isActive: true,
          dataHandlingProcedures: [
            {
              procedure: 'Data Collection',
              description: 'We collect personal data for service provision',
              legalBasis: 'Contractual necessity',
            },
            {
              procedure: 'Data Processing',
              description: 'Data is processed for legitimate business purposes',
              legalBasis: 'Legitimate interest',
            },
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          createdBy: 'admin',
        },
        {
          id: '2',
          title: 'Privacy Policy v2.0',
          content: 'Previous version of privacy policy...',
          version: '2.0',
          effectiveDate: '2024-01-01T00:00:00Z',
          isActive: false,
          dataHandlingProcedures: [],
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          createdBy: 'admin',
        },
      ];

      setPolicies(mockPolicies);
    } catch (err) {
      setError('Failed to load privacy policies');
      console.error('Error loading policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAcceptances = async () => {
    try {
      // In a real implementation, this would fetch from the API
      const mockAcceptances: PolicyAcceptance[] = [
        {
          id: '1',
          policyId: '1',
          userId: 'user-1',
          acceptedAt: '2024-01-15T12:00:00Z',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          version: '2.1',
        },
        {
          id: '2',
          policyId: '1',
          userId: 'user-2',
          acceptedAt: '2024-01-15T14:30:00Z',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          version: '2.1',
        },
      ];

      setAcceptances(mockAcceptances);
    } catch (err) {
      console.error('Error loading acceptances:', err);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const newPolicy: PrivacyPolicy = {
        id: Date.now().toString(),
        ...formData,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
      };

      setPolicies(prev => [newPolicy, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError('Failed to create privacy policy');
      console.error('Error creating policy:', err);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;

    try {
      const updatedPolicy: PrivacyPolicy = {
        ...editingPolicy,
        ...formData,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPolicies(prev =>
        prev.map(policy =>
          policy.id === editingPolicy.id ? updatedPolicy : policy
        )
      );
      setIsEditDialogOpen(false);
      setEditingPolicy(null);
      resetForm();
    } catch (err) {
      setError('Failed to update privacy policy');
      console.error('Error updating policy:', err);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this privacy policy?')) {
      return;
    }

    try {
      setPolicies(prev => prev.filter(policy => policy.id !== policyId));
    } catch (err) {
      setError('Failed to delete privacy policy');
      console.error('Error deleting policy:', err);
    }
  };

  const handleToggleActive = async (policyId: string) => {
    try {
      setPolicies(prev =>
        prev.map(policy =>
          policy.id === policyId
            ? { ...policy, isActive: !policy.isActive }
            : policy
        )
      );
    } catch (err) {
      setError('Failed to toggle policy status');
      console.error('Error toggling policy:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      version: '',
      effectiveDate: '',
      dataHandlingProcedures: [],
    });
  };

  const openEditDialog = (policy: PrivacyPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      content: policy.content,
      version: policy.version,
      effectiveDate: new Date(policy.effectiveDate).toISOString().split('T')[0],
      dataHandlingProcedures: policy.dataHandlingProcedures,
    });
    setIsEditDialogOpen(true);
  };

  const addDataHandlingProcedure = () => {
    setFormData(prev => ({
      ...prev,
      dataHandlingProcedures: [
        ...prev.dataHandlingProcedures,
        { procedure: '', description: '', legalBasis: '' },
      ],
    }));
  };

  const removeDataHandlingProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dataHandlingProcedures: prev.dataHandlingProcedures.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateDataHandlingProcedure = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      dataHandlingProcedures: prev.dataHandlingProcedures.map((proc, i) =>
        i === index ? { ...proc, [field]: value } : proc
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Privacy Policy Management
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and track privacy policy versions and user
            acceptances
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Privacy Policy</DialogTitle>
              <DialogDescription>
                Create a new privacy policy version with data handling
                procedures.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Privacy Policy v2.2"
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        version: e.target.value,
                      }))
                    }
                    placeholder="2.2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      effectiveDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Enter privacy policy content..."
                  rows={10}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Data Handling Procedures</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDataHandlingProcedure}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Procedure
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.dataHandlingProcedures.map((proc, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-2 p-3 border rounded-lg"
                    >
                      <Input
                        placeholder="Procedure name"
                        value={proc.procedure}
                        onChange={e =>
                          updateDataHandlingProcedure(
                            index,
                            'procedure',
                            e.target.value
                          )
                        }
                      />
                      <Input
                        placeholder="Description"
                        value={proc.description}
                        onChange={e =>
                          updateDataHandlingProcedure(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Legal basis"
                          value={proc.legalBasis}
                          onChange={e =>
                            updateDataHandlingProcedure(
                              index,
                              'legalBasis',
                              e.target.value
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDataHandlingProcedure(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePolicy}>
                <Save className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="acceptances">User Acceptances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policies</CardTitle>
              <CardDescription>
                Manage privacy policy versions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Acceptances</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map(policy => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.title}
                      </TableCell>
                      <TableCell>{policy.version}</TableCell>
                      <TableCell>
                        <Badge
                          variant={policy.isActive ? 'default' : 'secondary'}
                        >
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(policy.effectiveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {
                          acceptances.filter(acc => acc.policyId === policy.id)
                            .length
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingPolicy(policy)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(policy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(policy.id)}
                          >
                            {policy.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acceptances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Acceptances</CardTitle>
              <CardDescription>
                Track which users have accepted which privacy policy versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Policy Version</TableHead>
                    <TableHead>Accepted At</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acceptances.map(acceptance => {
                    const policy = policies.find(
                      p => p.id === acceptance.policyId
                    );
                    return (
                      <TableRow key={acceptance.id}>
                        <TableCell className="font-medium">
                          {acceptance.userId}
                        </TableCell>
                        <TableCell>
                          {policy?.title} (v{acceptance.version})
                        </TableCell>
                        <TableCell>
                          {new Date(acceptance.acceptedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{acceptance.ipAddress}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {acceptance.userAgent}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
                <p className="text-xs text-muted-foreground">
                  {policies.filter(p => p.isActive).length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Acceptances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptances.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all versions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Acceptance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Policy Dialog */}
      <Dialog
        open={!!viewingPolicy}
        onOpenChange={() => setViewingPolicy(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingPolicy?.title} (v{viewingPolicy?.version})
            </DialogTitle>
            <DialogDescription>
              Effective:{' '}
              {viewingPolicy &&
                new Date(viewingPolicy.effectiveDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Content</h3>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm">
                  {viewingPolicy?.content}
                </pre>
              </div>
            </div>
            {viewingPolicy?.dataHandlingProcedures.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Data Handling Procedures</h3>
                <div className="space-y-2">
                  {viewingPolicy.dataHandlingProcedures.map((proc, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{proc.procedure}</div>
                      <div className="text-sm text-muted-foreground">
                        {proc.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Legal Basis: {proc.legalBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Privacy Policy</DialogTitle>
            <DialogDescription>
              Update the privacy policy details and procedures.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-version">Version</Label>
                <Input
                  id="edit-version"
                  value={formData.version}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, version: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-effectiveDate">Effective Date</Label>
              <Input
                id="edit-effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    effectiveDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={e =>
                  setFormData(prev => ({ ...prev, content: e.target.value }))
                }
                rows={10}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Data Handling Procedures</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDataHandlingProcedure}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              </div>
              <div className="space-y-2">
                {formData.dataHandlingProcedures.map((proc, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-2 p-3 border rounded-lg"
                  >
                    <Input
                      placeholder="Procedure name"
                      value={proc.procedure}
                      onChange={e =>
                        updateDataHandlingProcedure(
                          index,
                          'procedure',
                          e.target.value
                        )
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={proc.description}
                      onChange={e =>
                        updateDataHandlingProcedure(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Legal basis"
                        value={proc.legalBasis}
                        onChange={e =>
                          updateDataHandlingProcedure(
                            index,
                            'legalBasis',
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDataHandlingProcedure(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPolicy(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePolicy}>
              <Save className="h-4 w-4 mr-2" />
              Update Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
