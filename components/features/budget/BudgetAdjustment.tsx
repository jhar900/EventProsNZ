'use client';

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface BudgetAdjustment {
  service_category: string;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  reason: string;
}

interface BudgetAdjustmentProps {
  adjustments: BudgetAdjustment[];
  onAdjustmentUpdate?: (budget: any) => void;
}

export function BudgetAdjustment({
  adjustments,
  onAdjustmentUpdate,
}: BudgetAdjustmentProps) {
  const [newAdjustments, setNewAdjustments] = useState<BudgetAdjustment[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newAdjustment, setNewAdjustment] = useState<BudgetAdjustment>({
    service_category: '',
    adjustment_type: 'percentage',
    adjustment_value: 0,
    reason: '',
  });

  const serviceCategories = [
    'catering',
    'photography',
    'music',
    'venue',
    'decorations',
    'flowers',
    'transportation',
    'entertainment',
    'lighting',
    'security',
    'staffing',
    'equipment',
  ];

  const handleAddAdjustment = () => {
    if (newAdjustment.service_category && newAdjustment.reason) {
      setNewAdjustments(prev => [...prev, { ...newAdjustment }]);
      setNewAdjustment({
        service_category: '',
        adjustment_type: 'percentage',
        adjustment_value: 0,
        reason: '',
      });
      setShowAddForm(false);
    }
  };

  const handleRemoveAdjustment = (index: number) => {
    setNewAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyAdjustments = async () => {
    if (newAdjustments.length === 0) return;

    setIsApplying(true);

    try {
      const response = await fetch('/api/budget/breakdown', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: 'current-event', // This should be passed as a prop
          service_categories: newAdjustments.map(adj => adj.service_category),
          adjustments: newAdjustments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onAdjustmentUpdate?.(data);
        setNewAdjustments([]);
      }
    } catch (error) {
      console.error('Error applying adjustments:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const calculateTotalAdjustment = () => {
    return newAdjustments.reduce((sum, adj) => {
      if (adj.adjustment_type === 'percentage') {
        return sum + adj.adjustment_value / 100;
      }
      return sum + adj.adjustment_value;
    }, 0);
  };

  const getAdjustmentColor = (value: number) => {
    if (value > 0) return 'text-red-600';
    if (value < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getAdjustmentIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Budget Adjustment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Budget Adjustments
          </CardTitle>
          <CardDescription>
            Customize your budget by adjusting individual service categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {newAdjustments.length} Adjustment
                {newAdjustments.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-muted-foreground">
                Total impact: {calculateTotalAdjustment() > 0 ? '+' : ''}$
                {Math.abs(calculateTotalAdjustment()).toLocaleString()}
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Adjustment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Adjustment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Budget Adjustment</CardTitle>
            <CardDescription>
              Specify how you want to adjust a service category budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Select
                  value={newAdjustment.service_category}
                  onValueChange={value =>
                    setNewAdjustment(prev => ({
                      ...prev,
                      service_category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() +
                          category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={newAdjustment.adjustment_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setNewAdjustment(prev => ({
                      ...prev,
                      adjustment_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentValue">
                  Adjustment Value
                  {newAdjustment.adjustment_type === 'percentage'
                    ? ' (%)'
                    : ' ($)'}
                </Label>
                <Input
                  id="adjustmentValue"
                  type="number"
                  value={newAdjustment.adjustment_value}
                  onChange={e =>
                    setNewAdjustment(prev => ({
                      ...prev,
                      adjustment_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder={
                    newAdjustment.adjustment_type === 'percentage'
                      ? '10'
                      : '500'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  value={newAdjustment.reason}
                  onChange={e =>
                    setNewAdjustment(prev => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Explain why you're making this adjustment..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAdjustment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Adjustment
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Adjustments */}
      {newAdjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Adjustments</CardTitle>
            <CardDescription>
              Review and apply your budget adjustments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newAdjustments.map((adjustment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium capitalize">
                    {adjustment.service_category.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {adjustment.reason}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {adjustment.adjustment_type === 'percentage'
                        ? 'Percentage'
                        : 'Fixed Amount'}
                    </Badge>
                    <span
                      className={`text-sm font-medium ${getAdjustmentColor(adjustment.adjustment_value)}`}
                    >
                      {adjustment.adjustment_type === 'percentage'
                        ? `${adjustment.adjustment_value > 0 ? '+' : ''}${adjustment.adjustment_value}%`
                        : `${adjustment.adjustment_value > 0 ? '+' : ''}$${Math.abs(adjustment.adjustment_value).toLocaleString()}`}
                    </span>
                    {getAdjustmentIcon(adjustment.adjustment_value)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAdjustment(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Button onClick={handleApplyAdjustments} disabled={isApplying}>
                <Save className="h-4 w-4 mr-2" />
                {isApplying ? 'Applying...' : 'Apply Adjustments'}
              </Button>
              <Button variant="outline" onClick={() => setNewAdjustments([])}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Impact Analysis */}
      {newAdjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {newAdjustments.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Adjustments
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${getAdjustmentColor(calculateTotalAdjustment())}`}
                >
                  {calculateTotalAdjustment() > 0 ? '+' : ''}$
                  {Math.abs(calculateTotalAdjustment()).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Impact
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {
                    newAdjustments.filter(
                      adj => adj.adjustment_type === 'percentage'
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Percentage Adjustments
                </div>
              </div>
            </div>

            {calculateTotalAdjustment() > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These adjustments will increase your total budget by $
                  {calculateTotalAdjustment().toLocaleString()}. Make sure you
                  have sufficient funds available.
                </AlertDescription>
              </Alert>
            )}

            {calculateTotalAdjustment() < 0 && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  These adjustments will decrease your total budget by $
                  {Math.abs(calculateTotalAdjustment()).toLocaleString()}. This
                  could help you stay within budget or allow for additional
                  services.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Adjustments */}
      {adjustments && adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Adjustments</CardTitle>
            <CardDescription>
              Adjustments that have been applied to your budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adjustments.map((adjustment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium capitalize">
                      {adjustment.service_category.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {adjustment.reason}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {adjustment.adjustment_type === 'percentage'
                          ? 'Percentage'
                          : 'Fixed Amount'}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${getAdjustmentColor(adjustment.adjustment_value)}`}
                      >
                        {adjustment.adjustment_type === 'percentage'
                          ? `${adjustment.adjustment_value > 0 ? '+' : ''}${adjustment.adjustment_value}%`
                          : `${adjustment.adjustment_value > 0 ? '+' : ''}$${Math.abs(adjustment.adjustment_value).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
