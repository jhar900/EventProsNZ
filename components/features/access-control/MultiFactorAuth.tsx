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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Shield,
  Smartphone,
  Key,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import {
  MFAService,
  MFASettings,
  MFAAttempt,
} from '@/lib/security/mfa-service';

interface MultiFactorAuthProps {
  userId: string;
}

export function MultiFactorAuth({ userId }: MultiFactorAuthProps) {
  const [mfaSettings, setMfaSettings] = useState<MFASettings | null>(null);
  const [mfaAttempts, setMfaAttempts] = useState<MFAAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // TOTP states
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [totpToken, setTotpToken] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // SMS states
  const [smsPhone, setSmsPhone] = useState<string>('');
  const [smsCode, setSmsCode] = useState<string>('');
  const [smsSent, setSmsSent] = useState(false);

  // Backup code states
  const [backupCode, setBackupCode] = useState<string>('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  // UI states
  const [copied, setCopied] = useState<string | null>(null);

  const mfaService = new MFAService();

  useEffect(() => {
    loadMFAData();
  }, [userId]);

  const loadMFAData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settings, attempts] = await Promise.all([
        mfaService.getMFASettings(userId),
        mfaService.getMFAAttempts(userId, 20),
      ]);

      setMfaSettings(settings);
      setMfaAttempts(attempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MFA data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTOTP = async () => {
    try {
      setError(null);
      setSuccess(null);

      const result = await mfaService.generateTOTPSecret(
        userId,
        'user@example.com'
      );
      setTotpSecret(result.secret);
      setQrCodeUrl(result.qrCodeUrl);
      setBackupCodes(result.backupCodes);
      setShowBackupCodes(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate TOTP secret'
      );
    }
  };

  const handleConfirmTOTP = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!totpToken.trim()) {
        setError('Please enter the TOTP token');
        return;
      }

      await mfaService.enableTOTP(userId, totpSecret, totpToken, backupCodes);

      setSuccess('TOTP authentication enabled successfully');
      setTotpToken('');
      setTotpSecret('');
      setQrCodeUrl('');
      setBackupCodes([]);
      setShowBackupCodes(false);
      await loadMFAData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable TOTP');
    }
  };

  const handleEnableSMS = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!smsPhone.trim()) {
        setError('Please enter a phone number');
        return;
      }

      await mfaService.enableSMS(userId, smsPhone);

      setSuccess('SMS authentication enabled successfully');
      setSmsPhone('');
      await loadMFAData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable SMS');
    }
  };

  const handleSendSMSCode = async () => {
    try {
      setError(null);
      setSuccess(null);

      await mfaService.sendSMSCode(userId);
      setSmsSent(true);
      setSuccess('SMS code sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS code');
    }
  };

  const handleVerifySMS = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!smsCode.trim()) {
        setError('Please enter the SMS code');
        return;
      }

      const isValid = await mfaService.verifySMS(userId, smsCode);

      if (isValid) {
        setSuccess('SMS code verified successfully');
        setSmsCode('');
        setSmsSent(false);
        await loadMFAData();
      } else {
        setError('Invalid SMS code');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to verify SMS code'
      );
    }
  };

  const handleVerifyBackupCode = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!backupCode.trim()) {
        setError('Please enter a backup code');
        return;
      }

      const isValid = await mfaService.verifyBackupCode(userId, backupCode);

      if (isValid) {
        setSuccess('Backup code verified successfully');
        setBackupCode('');
        await loadMFAData();
      } else {
        setError('Invalid backup code');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to verify backup code'
      );
    }
  };

  const handleDisableMFA = async (method: 'totp' | 'sms' | 'all') => {
    if (
      !confirm(
        `Are you sure you want to disable ${method === 'all' ? 'all MFA methods' : method.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await mfaService.disableMFA(userId, method);

      setSuccess(
        `${method === 'all' ? 'All MFA methods' : method.toUpperCase()} disabled successfully`
      );
      await loadMFAData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    try {
      setError(null);
      setSuccess(null);

      const codes = await mfaService.generateNewBackupCodes(userId);
      setNewBackupCodes(codes);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate new backup codes'
      );
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="totp">TOTP</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="backup">Backup Codes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication Status
              </CardTitle>
              <CardDescription>
                Current MFA configuration and security status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">
                      TOTP (Authenticator App)
                    </span>
                    <Badge
                      variant={
                        mfaSettings?.totpEnabled ? 'default' : 'secondary'
                      }
                    >
                      {mfaSettings?.totpEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app like Google Authenticator or Authy
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">SMS Authentication</span>
                    <Badge
                      variant={
                        mfaSettings?.smsEnabled ? 'default' : 'secondary'
                      }
                    >
                      {mfaSettings?.smsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via SMS
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="font-medium">Backup Codes</span>
                  <Badge
                    variant={
                      mfaSettings?.backupCodes.length ? 'default' : 'secondary'
                    }
                  >
                    {mfaSettings?.backupCodes.length || 0} remaining
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  One-time use codes for account recovery
                </p>
              </div>

              {mfaSettings?.smsPhone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">SMS Phone Number</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mfaSettings.smsPhone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOTP Tab */}
        <TabsContent value="totp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                TOTP Authentication
              </CardTitle>
              <CardDescription>
                Set up time-based one-time password authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!mfaSettings?.totpEnabled ? (
                <div className="space-y-4">
                  {!totpSecret ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        TOTP authentication is not enabled. Click the button
                        below to set it up.
                      </p>
                      <Button onClick={handleEnableTOTP}>
                        Enable TOTP Authentication
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Step 1: Scan QR Code</Label>
                        <p className="text-sm text-muted-foreground">
                          Use your authenticator app to scan this QR code:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="p-4 border rounded-lg bg-white">
                            <QrCode className="h-32 w-32" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-mono break-all">
                              {qrCodeUrl}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(qrCodeUrl, 'qr')}
                            >
                              {copied === 'qr' ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              Copy URL
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Step 2: Enter Verification Code</Label>
                        <p className="text-sm text-muted-foreground">
                          Enter the 6-digit code from your authenticator app:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            value={totpToken}
                            onChange={e => setTotpToken(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="w-32"
                          />
                          <Button onClick={handleConfirmTOTP}>
                            Verify & Enable
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          TOTP Authentication Enabled
                        </p>
                        <p className="text-sm text-green-700">
                          Your account is protected with TOTP authentication
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisableMFA('totp')}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                SMS Authentication
              </CardTitle>
              <CardDescription>
                Set up SMS-based verification codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!mfaSettings?.smsEnabled ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-phone">Phone Number</Label>
                    <Input
                      id="sms-phone"
                      type="tel"
                      value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your phone number with country code
                    </p>
                  </div>
                  <Button onClick={handleEnableSMS}>
                    Enable SMS Authentication
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          SMS Authentication Enabled
                        </p>
                        <p className="text-sm text-green-700">
                          Phone: {mfaSettings.smsPhone}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisableMFA('sms')}
                    >
                      Disable
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Test SMS Code</Label>
                      <p className="text-sm text-muted-foreground">
                        Send a test code to verify SMS authentication is
                        working:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleSendSMSCode}
                          disabled={smsSent}
                        >
                          {smsSent ? 'Code Sent' : 'Send Test Code'}
                        </Button>
                      </div>
                    </div>

                    {smsSent && (
                      <div className="space-y-2">
                        <Label htmlFor="sms-code">Enter SMS Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sms-code"
                            value={smsCode}
                            onChange={e => setSmsCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="w-32"
                          />
                          <Button onClick={handleVerifySMS}>Verify</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Codes Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Backup Codes
              </CardTitle>
              <CardDescription>
                One-time use codes for account recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Remaining Backup Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {mfaSettings?.backupCodes.length || 0} codes available
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleGenerateNewBackupCodes}
                  >
                    Generate New Codes
                  </Button>
                </div>

                {newBackupCodes.length > 0 && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Important:</strong> Save these backup codes in a
                        secure location. Each code can only be used once.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-2">
                      {newBackupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <code className="text-sm font-mono">{code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(code, `backup-${index}`)
                            }
                          >
                            {copied === `backup-${index}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Test Backup Code</Label>
                  <p className="text-sm text-muted-foreground">
                    Test a backup code to verify it works:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={backupCode}
                      onChange={e =>
                        setBackupCode(e.target.value.toUpperCase())
                      }
                      placeholder="ABCD1234"
                      className="w-32"
                    />
                    <Button onClick={handleVerifyBackupCode}>Verify</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                MFA Attempt History
              </CardTitle>
              <CardDescription>
                Recent multi-factor authentication attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mfaAttempts.length === 0 ? (
                <p className="text-muted-foreground">No MFA attempts found</p>
              ) : (
                <div className="space-y-2">
                  {mfaAttempts.map(attempt => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              attempt.success ? 'default' : 'destructive'
                            }
                          >
                            {attempt.attemptType.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {attempt.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleString()}
                        </p>
                        {attempt.ipAddress && (
                          <p className="text-xs text-muted-foreground">
                            IP: {attempt.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
