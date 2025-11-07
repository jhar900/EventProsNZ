'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { RESPONSE_TYPES } from '@/types/inquiries';

interface QuickResponseDialogProps {
  inquiryId: string;
  inquirySubject: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickResponseDialog({
  inquiryId,
  inquirySubject,
  isOpen,
  onClose,
  onSuccess,
}: QuickResponseDialogProps) {
  const { user, isLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [responseType, setResponseType] = useState<string>('reply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    // Wait for auth to finish loading
    if (isLoading) {
      setError('Please wait for authentication to complete...');
      return;
    }

    // Get user ID
    const userId = user?.id;

    if (!userId) {
      setError(
        'User not authenticated. Please refresh the page and try again.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Build request body
      const requestBody: Record<string, string> = {
        message: message.trim(),
        response_type: responseType,
        user_id: String(userId),
      };

      // Create headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': String(userId),
      };

      const bodyString = JSON.stringify(requestBody);

      const response = await fetch(`/api/inquiries/${inquiryId}/respond`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to send response');
      }

      // Note: The server automatically updates the inquiry status to 'responded'
      // when a message is created, so we don't need to do it here

      // Call onSuccess BEFORE closing to trigger refresh
      if (onSuccess) {
        onSuccess();
      }

      // Reset form and close dialog
      setMessage('');
      setResponseType('reply');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setResponseType('reply');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Respond to Inquiry</DialogTitle>
          <DialogDescription>Reply to: {inquirySubject}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="responseType">Response Type</Label>
            <Select
              value={responseType}
              onValueChange={setResponseType}
              disabled={isSubmitting}
            >
              <SelectTrigger id="responseType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reply">Reply</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="decline">Decline</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="clarification">Clarification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your response here..."
              rows={6}
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <div className="flex items-center text-red-600 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
