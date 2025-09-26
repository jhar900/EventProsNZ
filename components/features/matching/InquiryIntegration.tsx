'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';

interface InquiryIntegrationProps {
  eventId: string;
  contractorId: string;
  onInquiry?: (contractorId: string, message: string) => void;
}

export function InquiryIntegration({
  eventId,
  contractorId,
  onInquiry,
}: InquiryIntegrationProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/matching/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          contractor_id: contractorId,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send inquiry');
      }

      setSuccess(true);
      setMessage('');
      onInquiry?.(contractorId, message.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setMessage('');
  };

  if (success) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-green-600">
                  Inquiry sent successfully!
                </p>
                <p className="text-sm text-muted-foreground">
                  The contractor has been notified and will respond to your
                  inquiry.
                </p>
                <Button onClick={handleReset} size="sm" variant="outline">
                  Send Another Inquiry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Inquiry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message to Contractor</Label>
            <Textarea
              id="message"
              placeholder="Tell the contractor about your event and what you're looking for..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your event requirements, budget, and timeline.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">{error}</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Inquiry'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">Inquiry Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Include your event date and location</li>
            <li>• Mention your budget range</li>
            <li>• Describe your event type and size</li>
            <li>• Ask about their availability and experience</li>
            <li>• Request a quote or consultation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
