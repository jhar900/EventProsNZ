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
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
  Users,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface BulkAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresConfirmation: boolean;
  requiresInput: boolean;
  inputType?: 'text' | 'textarea' | 'select';
  inputOptions?: { value: string; label: string }[];
  destructive?: boolean;
}

interface BulkUserActionsProps {
  selectedUsers: User[];
  onAction: (action: string, userIds: string[], data?: any) => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'verify',
    name: 'Verify Users',
    description: 'Mark selected users as verified',
    icon: <Shield className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: false,
  },
  {
    id: 'suspend',
    name: 'Suspend Users',
    description: 'Suspend selected user accounts',
    icon: <XCircle className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: true,
    inputType: 'textarea',
    destructive: true,
  },
  {
    id: 'activate',
    name: 'Activate Users',
    description: 'Activate selected user accounts',
    icon: <CheckCircle className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: false,
  },
  {
    id: 'send_email',
    name: 'Send Email',
    description: 'Send email to selected users',
    icon: <Mail className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: true,
    inputType: 'textarea',
  },
  {
    id: 'change_role',
    name: 'Change Role',
    description: 'Change role for selected users',
    icon: <Users className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: true,
    inputType: 'select',
    inputOptions: [
      { value: 'admin', label: 'Admin' },
      { value: 'event_manager', label: 'Event Manager' },
      { value: 'contractor', label: 'Contractor' },
    ],
  },
  {
    id: 'export',
    name: 'Export Data',
    description: 'Export selected users data',
    icon: <Download className="h-4 w-4" />,
    requiresConfirmation: false,
    requiresInput: false,
  },
  {
    id: 'delete',
    name: 'Delete Users',
    description: 'Permanently delete selected users',
    icon: <Trash2 className="h-4 w-4" />,
    requiresConfirmation: true,
    requiresInput: true,
    inputType: 'textarea',
    destructive: true,
  },
];

export default function BulkUserActions({
  selectedUsers,
  onAction,
  onClearSelection,
  loading = false,
}: BulkUserActionsProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionInput, setActionInput] = useState('');
  const [actionData, setActionData] = useState<any>(null);

  const handleActionSelect = (actionId: string) => {
    const action = BULK_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    setSelectedAction(actionId);
    setActionInput('');
    setActionData(null);

    if (action.requiresConfirmation) {
      setShowConfirmDialog(true);
    } else {
      executeAction(actionId);
    }
  };

  const executeAction = async (actionId: string) => {
    const action = BULK_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    const userIds = selectedUsers.map(user => user.id);
    let data = null;

    if (action.requiresInput && actionInput) {
      if (action.inputType === 'select') {
        data = { value: actionInput };
      } else {
        data = { message: actionInput };
      }
    }

    try {
      await onAction(actionId, userIds, data);
      setShowConfirmDialog(false);
      setSelectedAction('');
      setActionInput('');
      setActionData(null);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleConfirmAction = () => {
    executeAction(selectedAction);
  };

  const selectedActionData = BULK_ACTIONS.find(a => a.id === selectedAction);

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Actions
            </CardTitle>
            <CardDescription>
              Perform actions on {selectedUsers.length} selected user
              {selectedUsers.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedUsers.length} selected</Badge>
            <Button variant="outline" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selected Users Preview */}
          <div className="max-h-32 overflow-y-auto">
            <div className="grid gap-2">
              {selectedUsers.slice(0, 10).map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user.profiles?.first_name?.[0] ||
                          user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {user.profiles?.first_name && user.profiles?.last_name
                          ? `${user.profiles.first_name} ${user.profiles.last_name}`
                          : user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    <Badge
                      variant={
                        user.status === 'active' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {selectedUsers.length > 10 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... and {selectedUsers.length - 10} more users
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <Label htmlFor="bulk-action">Select Action</Label>
            <Select value={selectedAction} onValueChange={handleActionSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an action..." />
              </SelectTrigger>
              <SelectContent>
                {BULK_ACTIONS.map(action => (
                  <SelectItem key={action.id} value={action.id}>
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <div>
                        <div className="font-medium">{action.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {BULK_ACTIONS.map(action => (
              <Button
                key={action.id}
                variant={action.destructive ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleActionSelect(action.id)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedActionData?.icon}
                Confirm {selectedActionData?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedActionData?.destructive && (
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    This action cannot be undone
                  </div>
                )}
                You are about to {selectedActionData?.name.toLowerCase()}{' '}
                {selectedUsers.length} user
                {selectedUsers.length !== 1 ? 's' : ''}. Are you sure you want
                to continue?
              </DialogDescription>
            </DialogHeader>

            {selectedActionData?.requiresInput && (
              <div className="space-y-4">
                {selectedActionData.inputType === 'select' ? (
                  <div>
                    <Label htmlFor="action-input">Select Value</Label>
                    <Select value={actionInput} onValueChange={setActionInput}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a value..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedActionData.inputOptions?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="action-input">
                      {selectedActionData.inputType === 'textarea'
                        ? 'Message'
                        : 'Input'}
                    </Label>
                    {selectedActionData.inputType === 'textarea' ? (
                      <Textarea
                        id="action-input"
                        placeholder="Enter your message..."
                        value={actionInput}
                        onChange={e => setActionInput(e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <input
                        id="action-input"
                        type="text"
                        placeholder="Enter input..."
                        value={actionInput}
                        onChange={e => setActionInput(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant={
                  selectedActionData?.destructive ? 'destructive' : 'default'
                }
                onClick={handleConfirmAction}
                disabled={
                  loading || (selectedActionData?.requiresInput && !actionInput)
                }
              >
                {loading
                  ? 'Processing...'
                  : `Confirm ${selectedActionData?.name}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
