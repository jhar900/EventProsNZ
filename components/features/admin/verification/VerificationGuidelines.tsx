'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  FileText,
  Settings,
} from 'lucide-react';

interface VerificationCriterion {
  id: string;
  user_type: 'event_manager' | 'contractor';
  criteria_name: string;
  description: string;
  is_required: boolean;
  validation_rule: string;
  created_at: string;
  updated_at: string;
}

interface VerificationGuidelinesProps {
  criteria: VerificationCriterion[];
}

export function VerificationGuidelines({
  criteria: initialCriteria,
}: VerificationGuidelinesProps) {
  const [criteria, setCriteria] =
    useState<VerificationCriterion[]>(initialCriteria);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    user_type: 'event_manager' as 'event_manager' | 'contractor',
    criteria_name: '',
    description: '',
    is_required: true,
    validation_rule: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setFormData({
      user_type: 'event_manager',
      criteria_name: '',
      description: '',
      is_required: true,
      validation_rule: '',
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (criterion: VerificationCriterion) => {
    setFormData({
      user_type: criterion.user_type,
      criteria_name: criterion.criteria_name,
      description: criterion.description,
      is_required: criterion.is_required,
      validation_rule: criterion.validation_rule,
    });
    setEditingId(criterion.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      user_type: 'event_manager',
      criteria_name: '',
      description: '',
      is_required: true,
      validation_rule: '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/verification/criteria', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify({
          id: editingId,
          ...formData,
        }),
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();

      if (response.ok) {
        if (editingId) {
          setCriteria(prev => prev.map(c => (c.id === editingId ? data : c)));
        } else {
          setCriteria(prev => [...prev, data]);
        }
        handleCancel();
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this criterion?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/verification/criteria/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        setCriteria(prev => prev.filter(c => c.id !== id));
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const groupedCriteria = criteria.reduce(
    (acc, criterion) => {
      if (!acc[criterion.user_type]) {
        acc[criterion.user_type] = [];
      }
      acc[criterion.user_type].push(criterion);
      return acc;
    },
    {} as Record<string, VerificationCriterion[]>
  );

  const getTypeIcon = (type: string) => {
    return type === 'event_manager' ? (
      <Users className="h-5 w-5" />
    ) : (
      <Building2 className="h-5 w-5" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === 'event_manager'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verification Guidelines</h1>
          <p className="text-gray-600">
            Manage verification criteria and guidelines for user verification
          </p>
        </div>
        <Button onClick={handleAdd} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Criterion
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingId ? 'Edit Criterion' : 'Add New Criterion'}
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_type">User Type</Label>
                <select
                  id="user_type"
                  value={formData.user_type}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      user_type: e.target.value as any,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="event_manager">Event Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria_name">Criteria Name</Label>
                <Input
                  id="criteria_name"
                  value={formData.criteria_name}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      criteria_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Profile Complete"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the verification criterion..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_required: checked }))
                  }
                />
                <Label htmlFor="is_required">Required for verification</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validation_rule">
                  Validation Rule (Optional)
                </Label>
                <Input
                  id="validation_rule"
                  value={formData.validation_rule}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      validation_rule: e.target.value,
                    }))
                  }
                  placeholder="e.g., profile_completion_percentage = 100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  loading || !formData.criteria_name || !formData.description
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update' : 'Add'} Criterion
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria by User Type */}
      {Object.entries(groupedCriteria).map(([userType, typeCriteria]) => (
        <Card key={userType}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getTypeIcon(userType)}
              <span className="capitalize">
                {userType.replace('_', ' ')} Verification Criteria
              </span>
              <Badge className={getTypeColor(userType)}>
                {typeCriteria.length} criteria
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeCriteria.map(criterion => (
                <div key={criterion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">
                          {criterion.criteria_name}
                        </h3>
                        {criterion.is_required && (
                          <Badge className="bg-red-100 text-red-800">
                            Required
                          </Badge>
                        )}
                        {!criterion.is_required && (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {criterion.description}
                      </p>
                      {criterion.validation_rule && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500 font-mono">
                            {criterion.validation_rule}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(criterion)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(criterion.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Default Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Default Verification Process</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                Event Manager Verification
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Profile must be 100% complete</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Valid phone number and address required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Email address must be verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Automatic approval after profile completion</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                Contractor Verification
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Complete business profile required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Valid NZBN number required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least 3 portfolio items required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>At least one service type defined</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Valid business contact information</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>
                    Manual review required - admin email notification sent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
