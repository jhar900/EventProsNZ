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
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Shield,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format } from 'date-fns';

interface VerificationRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  documents: {
    id: string;
    type: string;
    url: string;
    status: string;
  }[];
  verification_criteria: {
    id: string;
    name: string;
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface UserVerificationWorkflowProps {
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (
    requestId: string,
    reason: string,
    notes?: string
  ) => Promise<void>;
  onResubmit: (requestId: string) => Promise<void>;
  loading?: boolean;
}

export default function UserVerificationWorkflow({
  onApprove,
  onReject,
  onResubmit,
  loading = false,
}: UserVerificationWorkflowProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockRequests: VerificationRequest[] = [
      {
        id: '1',
        user_id: 'user1',
        user_email: 'john.doe@example.com',
        user_name: 'John Doe',
        user_role: 'contractor',
        status: 'pending',
        submitted_at: '2024-01-15T10:30:00Z',
        documents: [
          {
            id: 'doc1',
            type: 'identity',
            url: '/documents/identity.pdf',
            status: 'uploaded',
          },
          {
            id: 'doc2',
            type: 'business_license',
            url: '/documents/license.pdf',
            status: 'uploaded',
          },
        ],
        verification_criteria: [
          {
            id: 'criteria1',
            name: 'Identity Verification',
            required: true,
            status: 'approved',
          },
          {
            id: 'criteria2',
            name: 'Business License',
            required: true,
            status: 'pending',
          },
          {
            id: 'criteria3',
            name: 'Insurance Certificate',
            required: false,
            status: 'pending',
          },
        ],
      },
      {
        id: '2',
        user_id: 'user2',
        user_email: 'jane.smith@example.com',
        user_name: 'Jane Smith',
        user_role: 'contractor',
        status: 'pending',
        submitted_at: '2024-01-14T14:20:00Z',
        documents: [
          {
            id: 'doc3',
            type: 'identity',
            url: '/documents/identity2.pdf',
            status: 'uploaded',
          },
        ],
        verification_criteria: [
          {
            id: 'criteria4',
            name: 'Identity Verification',
            required: true,
            status: 'pending',
          },
        ],
      },
    ];
    setRequests(mockRequests);
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch =
      search === '' ||
      request.user_name.toLowerCase().includes(search.toLowerCase()) ||
      request.user_email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (requestId: string) => {
    try {
      await onApprove(requestId, adminNotes);
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved' as const, admin_notes: adminNotes }
            : req
        )
      );
      setAdminNotes('');
    } catch (error) {
      // Error handled
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await onReject(requestId, rejectionReason, adminNotes);
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'rejected' as const,
                rejection_reason: rejectionReason,
                admin_notes: adminNotes,
              }
            : req
        )
      );
      setRejectionReason('');
      setAdminNotes('');
      setShowRejectDialog(false);
    } catch (error) {
      // Error handled
    }
  };

  const handleResubmit = async (requestId: string) => {
    try {
      await onResubmit(requestId);
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'pending' as const } : req
        )
      );
    } catch (error) {
      // Error handled
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCriteriaStatus = (
    criteria: VerificationRequest['verification_criteria'][0]
  ) => {
    if (criteria.status === 'approved') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (criteria.status === 'rejected') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Verification Queue
              </CardTitle>
              <CardDescription>
                Review and approve user verification requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredRequests.filter(r => r.status === 'pending').length}{' '}
                Pending
              </Badge>
              <Badge variant="outline">
                {filteredRequests.filter(r => r.status === 'approved').length}{' '}
                Approved
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
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter">Status</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.user_role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      {getStatusBadge(request.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{request.documents.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {request.verification_criteria.map(criteria => (
                        <div
                          key={criteria.id}
                          className="flex items-center gap-1"
                        >
                          {getCriteriaStatus(criteria)}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.submitted_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={loading}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectDialog(true);
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {request.status === 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResubmit(request.id)}
                          disabled={loading}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Verification Request Details</DialogTitle>
            <DialogDescription>
              Review all documents and criteria for {selectedRequest?.user_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>User Information</Label>
                  <div className="space-y-2">
                    <div>
                      <strong>Name:</strong> {selectedRequest.user_name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedRequest.user_email}
                    </div>
                    <div>
                      <strong>Role:</strong> {selectedRequest.user_role}
                    </div>
                    <div>
                      <strong>Status:</strong>{' '}
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Submission Details</Label>
                  <div className="space-y-2">
                    <div>
                      <strong>Submitted:</strong>{' '}
                      {format(new Date(selectedRequest.submitted_at), 'PPP')}
                    </div>
                    {selectedRequest.reviewed_at && (
                      <div>
                        <strong>Reviewed:</strong>{' '}
                        {format(new Date(selectedRequest.reviewed_at), 'PPP')}
                      </div>
                    )}
                    {selectedRequest.reviewed_by && (
                      <div>
                        <strong>Reviewed by:</strong>{' '}
                        {selectedRequest.reviewed_by}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {selectedRequest.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {doc.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <Badge variant="outline">{doc.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Criteria */}
              <div>
                <Label>Verification Criteria</Label>
                <div className="space-y-2">
                  {selectedRequest.verification_criteria.map(criteria => (
                    <div
                      key={criteria.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        {getCriteriaStatus(criteria)}
                        <span className="font-medium">{criteria.name}</span>
                        {criteria.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">{criteria.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedRequest.admin_notes && (
                <div>
                  <Label>Admin Notes</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {selectedRequest.admin_notes}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.rejection_reason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <div className="p-3 bg-destructive/10 rounded-md">
                    {selectedRequest.rejection_reason}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Verification Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this verification request. This
              will be sent to the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this verification request is being rejected..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Internal)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Internal notes (not sent to user)..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedRequest && handleReject(selectedRequest.id)
              }
              disabled={!rejectionReason.trim() || loading}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
