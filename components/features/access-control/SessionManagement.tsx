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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  SecureAuthService,
  SecureSession,
} from '@/lib/security/secure-auth-service';

interface SessionManagementProps {
  userId: string;
  isAdmin?: boolean;
}

export function SessionManagement({
  userId,
  isAdmin = false,
}: SessionManagementProps) {
  const [sessions, setSessions] = useState<SecureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Session configuration
  const [sessionTimeout, setSessionTimeout] = useState(24 * 60 * 60 * 1000); // 24 hours in ms
  const [maxSessions, setMaxSessions] = useState(5);
  const [requireReauth, setRequireReauth] = useState(true);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([
    'http://localhost:3000',
    'https://eventpros.co.nz',
  ]);

  const authService = new SecureAuthService();

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const userSessions = await authService.getUserSessions(userId);
      setSessions(userSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    try {
      setError(null);
      setSuccess(null);

      await authService.invalidateSession(sessionId);

      setSuccess('Session invalidated successfully');
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to invalidate session'
      );
    }
  };

  const handleInvalidateAllSessions = async () => {
    if (
      !confirm(
        'Are you sure you want to invalidate all sessions? This will log out all devices.'
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await authService.invalidateAllUserSessions(userId);

      setSuccess('All sessions invalidated successfully');
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to invalidate all sessions'
      );
    }
  };

  const handleForceTimeout = async (sessionId: string) => {
    try {
      setError(null);
      setSuccess(null);

      await authService.forceSessionTimeout(sessionId);

      setSuccess('Session forced to timeout');
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to force session timeout'
      );
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;

    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('Android') ||
      userAgent.includes('iPhone')
    ) {
      return <Smartphone className="h-4 w-4" />;
    }

    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('Mobile')) return 'Mobile Device';

    return 'Unknown Device';
  };

  const getLocationFromIP = (ipAddress?: string) => {
    if (!ipAddress) return 'Unknown Location';

    // In production, you would use a geolocation service
    if (
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')
    ) {
      return 'Local Network';
    }

    return 'External Network';
  };

  const formatDuration = (createdAt: Date, lastActivity: Date) => {
    const now = new Date();
    const totalDuration = now.getTime() - createdAt.getTime();
    const activeDuration = now.getTime() - lastActivity.getTime();

    const totalHours = Math.floor(totalDuration / (1000 * 60 * 60));
    const activeMinutes = Math.floor(activeDuration / (1000 * 60));

    return {
      total:
        totalHours > 24
          ? `${Math.floor(totalHours / 24)}d ${totalHours % 24}h`
          : `${totalHours}h`,
      active:
        activeMinutes < 60
          ? `${activeMinutes}m`
          : `${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m`,
    };
  };

  const isSessionExpired = (expiresAt: Date) => {
    return new Date() > expiresAt;
  };

  const isSessionInactive = (lastActivity: Date) => {
    const inactiveThreshold = 2 * 60 * 60 * 1000; // 2 hours
    return new Date().getTime() - lastActivity.getTime() > inactiveThreshold;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Session Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Overview
          </CardTitle>
          <CardDescription>
            Current session status and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Active Sessions</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Expired Sessions</p>
              <p className="text-2xl font-bold text-red-600">
                {sessions.filter(s => isSessionExpired(s.expiresAt)).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Inactive Sessions</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sessions.filter(s => isSessionInactive(s.lastActivity)).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Max Sessions</p>
              <p className="text-2xl font-bold">{maxSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Configuration */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Session Configuration</CardTitle>
            <CardDescription>
              Configure session timeout and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={sessionTimeout / (1000 * 60 * 60)}
                  onChange={e =>
                    setSessionTimeout(parseInt(e.target.value) * 60 * 60 * 1000)
                  }
                  min="1"
                  max="168"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-sessions">Maximum Sessions</Label>
                <Input
                  id="max-sessions"
                  type="number"
                  value={maxSessions}
                  onChange={e => setMaxSessions(parseInt(e.target.value))}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="require-reauth">
                    Require Re-authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Force users to re-authenticate for sensitive operations
                  </p>
                </div>
                <Switch
                  id="require-reauth"
                  checked={requireReauth}
                  onCheckedChange={setRequireReauth}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleInvalidateAllSessions}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              End All Sessions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No active sessions found</p>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => {
                const duration = formatDuration(
                  session.createdAt,
                  session.lastActivity
                );
                const isExpired = isSessionExpired(session.expiresAt);
                const isInactive = isSessionInactive(session.lastActivity);

                return (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.userAgent)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {getDeviceName(session.userAgent)}
                            </h3>
                            {isExpired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {isInactive && !isExpired && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {!isExpired && !isInactive && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {getLocationFromIP(session.ipAddress)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {duration.total} total, {duration.active} active
                            </span>
                            <span>
                              Last activity:{' '}
                              {new Date(session.lastActivity).toLocaleString()}
                            </span>
                          </div>
                          {session.ipAddress && (
                            <p className="text-xs text-muted-foreground">
                              IP: {session.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isInactive && !isExpired && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForceTimeout(session.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Force Timeout
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvalidateSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          End Session
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>Tips to keep your sessions secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Regularly review active sessions</p>
                <p className="text-sm text-muted-foreground">
                  Check for any unfamiliar devices or locations and end
                  suspicious sessions immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Use strong, unique passwords</p>
                <p className="text-sm text-muted-foreground">
                  Enable multi-factor authentication for additional security.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Log out from shared devices</p>
                <p className="text-sm text-muted-foreground">
                  Always log out when using public or shared computers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Report suspicious activity</p>
                <p className="text-sm text-muted-foreground">
                  If you notice any unusual sessions, contact support
                  immediately.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
