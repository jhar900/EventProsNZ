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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangleIcon,
  ShieldIcon,
  ActivityIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  KeyIcon,
  GlobeIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface APIToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  rate_limit: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
  user_id?: string;
  user_email?: string;
}

interface APIAccessControlProps {
  userId?: string;
}

export default function APIAccessControl({ userId }: APIAccessControlProps) {
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<APIToken | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenPermissions, setTokenPermissions] = useState<string[]>([]);
  const [rateLimit, setRateLimit] = useState(1000);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState('tokens');
  const [stats, setStats] = useState({
    total_tokens: 0,
    active_tokens: 0,
    expired_tokens: 0,
    total_requests: 0,
    rate_limited_requests: 0,
  });

  const availablePermissions = [
    'read:users',
    'write:users',
    'read:roles',
    'write:roles',
    'read:permissions',
    'write:permissions',
    'read:sessions',
    'write:sessions',
    'read:audit',
    'read:analytics',
    'admin:all',
  ];

  // Load tokens on component mount
  useEffect(() => {
    loadTokens();
    loadStats();
  }, [userId]);

  const loadTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);

      const response = await fetch(`/api/access/api-tokens?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load API tokens');
      }

      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/access/api-tokens/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createToken = async () => {
    if (!tokenName.trim()) {
      setError('Please provide a token name');
      return;
    }

    if (tokenPermissions.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/access/api-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tokenName,
          permissions: tokenPermissions,
          rate_limit: rateLimit,
          expires_at: expirationDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API token');
      }

      const data = await response.json();
      setSuccess(`API token created successfully. Token: ${data.token.token}`);
      setIsCreateDialogOpen(false);
      setTokenName('');
      setTokenPermissions([]);
      setRateLimit(1000);
      setExpirationDate(undefined);
      loadTokens();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setLoading(false);
    }
  };

  const updateToken = async (tokenId: string, updates: Partial<APIToken>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/access/api-tokens/${tokenId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update API token');
      }

      setSuccess('API token updated successfully');
      loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update token');
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this API token?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/access/api-tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API token');
      }

      setSuccess('API token deleted successfully');
      loadTokens();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete token');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setTokenPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getStatusBadge = (token: APIToken) => {
    if (!token.is_active) {
      return <Badge variant="secondary">INACTIVE</Badge>;
    }

    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return <Badge variant="destructive">EXPIRED</Badge>;
    }

    return <Badge variant="default">ACTIVE</Badge>;
  };

  const getStatusIcon = (token: APIToken) => {
    if (!token.is_active) {
      return <XCircleIcon className="h-4 w-4 text-gray-500" />;
    }

    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return <ClockIcon className="h-4 w-4 text-red-500" />;
    }

    return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  };

  const filteredTokens = tokens.filter(token => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active')
      return (
        token.is_active &&
        (!token.expires_at || new Date(token.expires_at) > new Date())
      );
    if (activeTab === 'expired')
      return token.expires_at && new Date(token.expires_at) < new Date();
    if (activeTab === 'inactive') return !token.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            API Access Control
          </CardTitle>
          <CardDescription>
            Manage API tokens, rate limiting, and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total_tokens})</TabsTrigger>
              <TabsTrigger value="active">
                Active ({stats.active_tokens})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired ({stats.expired_tokens})
              </TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">API Tokens</h3>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Create Token
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create API Token</DialogTitle>
                      <DialogDescription>
                        Create a new API token with specific permissions and
                        rate limits
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="token-name">Token Name</Label>
                        <Input
                          id="token-name"
                          value={tokenName}
                          onChange={e => setTokenName(e.target.value)}
                          placeholder="Enter a descriptive name for this token"
                        />
                      </div>

                      <div>
                        <Label>Permissions</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {availablePermissions.map(permission => (
                            <div
                              key={permission}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={permission}
                                checked={tokenPermissions.includes(permission)}
                                onChange={() => togglePermission(permission)}
                                className="rounded"
                              />
                              <Label htmlFor={permission} className="text-sm">
                                {permission}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="rate-limit">
                          Rate Limit (requests per hour)
                        </Label>
                        <Input
                          id="rate-limit"
                          type="number"
                          value={rateLimit}
                          onChange={e =>
                            setRateLimit(parseInt(e.target.value) || 1000)
                          }
                          min="1"
                          max="10000"
                        />
                      </div>

                      <div>
                        <Label>Expiration Date (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={
                            expirationDate
                              ? expirationDate.toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={e =>
                            setExpirationDate(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createToken} disabled={loading}>
                          {loading ? 'Creating...' : 'Create Token'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map(token => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">
                        {token.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {token.token.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {token.permissions.slice(0, 2).map(permission => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission}
                            </Badge>
                          ))}
                          {token.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{token.permissions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{token.rate_limit}/hour</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(token)}
                          {getStatusBadge(token)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {token.expires_at
                          ? format(new Date(token.expires_at), 'MMM dd, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {token.last_used
                          ? format(new Date(token.last_used), 'MMM dd, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedToken(token);
                              setIsDialogOpen(true);
                            }}
                          >
                            <ActivityIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateToken(token.id, {
                                is_active: !token.is_active,
                              })
                            }
                          >
                            {token.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteToken(token.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTokens.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <KeyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API tokens found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Token Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Token Details</DialogTitle>
            <DialogDescription>
              View and manage API token details
            </DialogDescription>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Token Name</Label>
                  <p className="text-sm font-medium">{selectedToken.name}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedToken)}</div>
                </div>
                <div>
                  <Label>Rate Limit</Label>
                  <p className="text-sm">
                    {selectedToken.rate_limit} requests/hour
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {format(
                      new Date(selectedToken.created_at),
                      'MMM dd, yyyy HH:mm'
                    )}
                  </p>
                </div>
                <div>
                  <Label>Expires</Label>
                  <p className="text-sm">
                    {selectedToken.expires_at
                      ? format(
                          new Date(selectedToken.expires_at),
                          'MMM dd, yyyy HH:mm'
                        )
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <Label>Last Used</Label>
                  <p className="text-sm">
                    {selectedToken.last_used
                      ? format(
                          new Date(selectedToken.last_used),
                          'MMM dd, yyyy HH:mm'
                        )
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Full Token</Label>
                <code className="block mt-1 p-3 bg-muted rounded-md text-sm break-all">
                  {selectedToken.token}
                </code>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {selectedToken.permissions.map(permission => (
                    <div
                      key={permission}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteToken(selectedToken.id);
                    setIsDialogOpen(false);
                  }}
                >
                  Delete Token
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
