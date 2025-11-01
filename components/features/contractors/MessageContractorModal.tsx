'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface MessageContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
  contractorName: string;
}

export function MessageContractorModal({
  isOpen,
  onClose,
  contractorId,
  contractorName,
}: MessageContractorModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a message');
      return;
    }

    if (message.length > 2000) {
      setSubmitStatus('error');
      setErrorMessage('Message must be 2000 characters or less');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/inquiries/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: contractorId,
          inquiry_type: 'general',
          subject: subject.trim() || `Inquiry for ${contractorName}`,
          message: message.trim(),
          priority: 'medium',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setMessage('');
        setSubject('');
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || 'Failed to send message';
        setSubmitStatus('error');
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setSubject('');
      setSubmitStatus('idle');
      setErrorMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-in-out z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Send Message
              </h2>
              <p className="text-sm text-gray-600">
                Send a message to {contractorName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="e.g., Event planning inquiry"
                />
              </div>

              <div>
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Type your message here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {message.length}/2000 characters
                </p>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-800">
                      Message sent successfully!
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-800">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
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
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
