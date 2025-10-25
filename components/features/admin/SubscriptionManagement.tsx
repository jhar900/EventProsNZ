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
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Eye,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_name: string;
  plan_tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  payment_method: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string;
  next_billing_date?: string;
}

interface SubscriptionModification {
  id: string;
  user_id: string;
  action:
    | 'upgrade'
    | 'downgrade'
    | 'cancel'
    | 'reactivate'
    | 'extend'
    | 'refund';
  from_plan: string;
  to_plan: string;
  amount: number;
  reason: string;
  admin_notes: string;
  processed_by: string;
  processed_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SubscriptionManagementProps {
  onModifySubscription: (userId: string, modification: any) => Promise<void>;
  onCancelSubscription: (userId: string, reason: string) => Promise<void>;
  onReactivateSubscription: (userId: string) => Promise<void>;
  onExtendSubscription: (userId: string, days: number) => Promise<void>;
  onRefundSubscription: (
    userId: string,
    amount: number,
    reason: string
  ) => Promise<void>;
  loading?: boolean;
}

export default function SubscriptionManagement({
  onModifySubscription,
  onCancelSubscription,
  onReactivateSubscription,
  onExtendSubscription,
  onRefundSubscription,
  loading = false,
}: SubscriptionManagementProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [modifications, setModifications] = useState<
    SubscriptionModification[]
  >([]);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modificationForm, setModificationForm] = useState({
    action: '',
    to_plan: '',
    reason: '',
    admin_notes: '',
  });
  const [cancelReason, setCancelReason] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: '',
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSubscriptions: Subscription[] = [
      {
        id: 'sub1',
        user_id: 'user1',
        user_email: 'john.doe@example.com',
        user_name: 'John Doe',
        plan_name: 'Premium Plan',
        plan_tier: 'premium',
        status: 'active',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        amount: 29.99,
        currency: 'USD',
        payment_method: 'card_ending_1234',
        auto_renew: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        next_billing_date: '2024-02-01T00:00:00Z',
      },
      {
        id: 'sub2',
        user_id: 'user2',
        user_email: 'jane.smith@example.com',
        user_name: 'Jane Smith',
        plan_name: 'Enterprise Plan',
        plan_tier: 'enterprise',
        status: 'active',
        current_period_start: '2024-01-10T00:00:00Z',
        current_period_end: '2024-02-10T00:00:00Z',
        amount: 99.99,
        currency: 'USD',
        payment_method: 'card_ending_5678',
        auto_renew: true,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-15T14:20:00Z',
        next_billing_date: '2024-02-10T00:00:00Z',
      },
      {
        id: 'sub3',
        user_id: 'user3',
        user_email: 'bob.wilson@example.com',
        user_name: 'Bob Wilson',
        plan_name: 'Free Plan',
        plan_tier: 'free',
        status: 'active',
        current_period_start: '2024-01-05T00:00:00Z',
        current_period_end: '2024-02-05T00:00:00Z',
        amount: 0,
        currency: 'USD',
        payment_method: 'none',
        auto_renew: false,
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      },
    ];
    setSubscriptions(mockSubscriptions);
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesFilter =
      filter === 'all' ||
      subscription.status === filter ||
      subscription.plan_tier === filter;
    const matchesSearch =
      search === '' ||
      subscription.user_name.toLowerCase().includes(search.toLowerCase()) ||
      subscription.user_email.toLowerCase().includes(search.toLowerCase()) ||
      subscription.plan_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      cancelled: 'destructive',
      expired: 'secondary',
      past_due: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPlanBadge = (tier: string) => {
    const variants = {
      free: 'secondary',
      premium: 'default',
      enterprise: 'destructive',
    } as const;

    return (
      <Badge variant={variants[tier as keyof typeof variants] || 'secondary'}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const handleModifySubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await onModifySubscription(
        selectedSubscription.user_id,
        modificationForm
      );
      setShowModifyDialog(false);
      setModificationForm({
        action: '',
        to_plan: '',
        reason: '',
        admin_notes: '',
      });
    } catch (error) {
      console.error('Modification failed:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await onCancelSubscription(selectedSubscription.user_id, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  };

  const handleReactivateSubscription = async (subscription: Subscription) => {
    try {
      await onReactivateSubscription(subscription.user_id);
    } catch (error) {
      console.error('Reactivation failed:', error);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await onExtendSubscription(selectedSubscription.user_id, extendDays);
      setShowExtendDialog(false);
      setExtendDays(30);
    } catch (error) {
      console.error('Extension failed:', error);
    }
  };

  const handleRefundSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await onRefundSubscription(
        selectedSubscription.user_id,
        refundForm.amount,
        refundForm.reason
      );
      setShowRefundDialog(false);
      setRefundForm({ amount: 0, reason: '' });
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  const getSubscriptionActions = (subscription: Subscription) => {
    const actions = [];

    if (subscription.status === 'active') {
      actions.push(
        <Button
          key="modify"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSubscription(subscription);
            setShowModifyDialog(true);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      );
      actions.push(
        <Button
          key="cancel"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSubscription(subscription);
            setShowCancelDialog(true);
          }}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      );
    } else if (subscription.status === 'cancelled') {
      actions.push(
        <Button
          key="reactivate"
          variant="outline"
          size="sm"
          onClick={() => handleReactivateSubscription(subscription)}
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      );
    }

    if (subscription.plan_tier !== 'free') {
      actions.push(
        <Button
          key="extend"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSubscription(subscription);
            setShowExtendDialog(true);
          }}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      );
      actions.push(
        <Button
          key="refund"
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedSubscription(subscription);
            setShowRefundDialog(true);
          }}
        >
          <DollarSign className="h-4 w-4" />
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage user subscriptions, billing, and payments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {
                  filteredSubscriptions.filter(s => s.status === 'active')
                    .length
                }{' '}
                Active
              </Badge>
              <Badge variant="outline">
                {
                  filteredSubscriptions.filter(s => s.status === 'cancelled')
                    .length
                }{' '}
                Cancelled
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or plan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter">Filter</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Auto Renew</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map(subscription => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {subscription.user_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlanBadge(subscription.plan_tier)}
                      <span className="text-sm">{subscription.plan_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscription.status)}
                      {getStatusBadge(subscription.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {subscription.amount.toFixed(2)} {subscription.currency}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscription.next_billing_date ? (
                      format(
                        new Date(subscription.next_billing_date),
                        'MMM dd, yyyy'
                      )
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subscription.auto_renew ? 'default' : 'secondary'
                      }
                    >
                      {subscription.auto_renew ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSubscriptionActions(subscription)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modify Subscription Dialog */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Subscription</DialogTitle>
            <DialogDescription>
              Change subscription plan for {selectedSubscription?.user_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={modificationForm.action}
                onValueChange={value =>
                  setModificationForm(prev => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upgrade">Upgrade Plan</SelectItem>
                  <SelectItem value="downgrade">Downgrade Plan</SelectItem>
                  <SelectItem value="extend">Extend Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="to-plan">New Plan</Label>
              <Select
                value={modificationForm.to_plan}
                onValueChange={value =>
                  setModificationForm(prev => ({ ...prev, to_plan: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="premium">Premium Plan</SelectItem>
                  <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Reason for modification..."
                value={modificationForm.reason}
                onChange={e =>
                  setModificationForm(prev => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Input
                id="admin-notes"
                placeholder="Internal notes..."
                value={modificationForm.admin_notes}
                onChange={e =>
                  setModificationForm(prev => ({
                    ...prev,
                    admin_notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModifyDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleModifySubscription} disabled={loading}>
              Modify Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Cancel subscription for {selectedSubscription?.user_name}. This
              action can be reversed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Input
                id="cancel-reason"
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend subscription for {selectedSubscription?.user_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="extend-days">Extension Days</Label>
              <Input
                id="extend-days"
                type="number"
                placeholder="Number of days to extend..."
                value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExtendSubscription} disabled={loading}>
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process refund for {selectedSubscription?.user_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                placeholder="Refund amount..."
                value={refundForm.amount}
                onChange={e =>
                  setRefundForm(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="refund-reason">Refund Reason</Label>
              <Input
                id="refund-reason"
                placeholder="Reason for refund..."
                value={refundForm.reason}
                onChange={e =>
                  setRefundForm(prev => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRefundSubscription} disabled={loading}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
