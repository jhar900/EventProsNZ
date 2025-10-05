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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  suggestions: Array<{
    field: string;
    message: string;
  }>;
}

interface InquiryValidationProps {
  onValidationComplete?: (isValid: boolean, errors: string[]) => void;
  className?: string;
}

export function InquiryValidation({
  onValidationComplete,
  className = '',
}: InquiryValidationProps) {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Mock validation function - in real implementation, this would call the API
  const validateInquiry = async (
    inquiryData: any
  ): Promise<ValidationResult> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    const suggestions: Array<{ field: string; message: string }> = [];

    // Basic validation rules
    if (!inquiryData.contractor_id) {
      errors.push({
        field: 'contractor_id',
        message: 'Contractor selection is required',
        severity: 'error',
      });
    }

    if (!inquiryData.subject || inquiryData.subject.length < 5) {
      errors.push({
        field: 'subject',
        message: 'Subject must be at least 5 characters long',
        severity: 'error',
      });
    }

    if (!inquiryData.message || inquiryData.message.length < 20) {
      errors.push({
        field: 'message',
        message: 'Message must be at least 20 characters long',
        severity: 'error',
      });
    }

    // Event details validation
    if (inquiryData.event_details) {
      if (!inquiryData.event_details.event_date) {
        errors.push({
          field: 'event_details.event_date',
          message: 'Event date is required',
          severity: 'error',
        });
      } else {
        const eventDate = new Date(inquiryData.event_details.event_date);
        const now = new Date();
        if (eventDate <= now) {
          errors.push({
            field: 'event_details.event_date',
            message: 'Event date must be in the future',
            severity: 'error',
          });
        }
      }

      if (
        inquiryData.event_details.budget_total &&
        inquiryData.event_details.budget_total < 100
      ) {
        warnings.push({
          field: 'event_details.budget_total',
          message: 'Budget seems low for most events',
        });
      }

      if (
        inquiryData.event_details.attendee_count &&
        inquiryData.event_details.attendee_count > 1000
      ) {
        suggestions.push({
          field: 'event_details.attendee_count',
          message: 'Consider breaking large events into smaller sessions',
        });
      }
    }

    // Content quality checks
    if (inquiryData.message) {
      const message = inquiryData.message.toLowerCase();
      if (message.includes('urgent') && inquiryData.priority !== 'urgent') {
        suggestions.push({
          field: 'priority',
          message: 'Consider setting priority to urgent for urgent requests',
        });
      }

      if (message.length < 50) {
        warnings.push({
          field: 'message',
          message: 'Message could be more detailed to get better responses',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  };

  const handleValidate = async () => {
    setIsValidating(true);

    try {
      // In real implementation, this would get the current form data
      const mockInquiryData = {
        contractor_id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Wedding Photography Inquiry',
        message:
          'Hi, I am planning a wedding for 150 guests on June 15th, 2024. I would like to discuss photography packages and pricing.',
        priority: 'medium',
        event_details: {
          event_type: 'wedding',
          title: 'Sarah & John Wedding',
          event_date: '2024-06-15T18:00:00Z',
          attendee_count: 150,
          budget_total: 5000,
          location: {
            address: '123 Main St, Auckland, New Zealand',
          },
        },
      };

      const result = await validateInquiry(mockInquiryData);
      setValidationResult(result);

      if (onValidationComplete) {
        onValidationComplete(
          result.isValid,
          result.errors.map(e => e.message)
        );
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Validation Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Inquiry Validation
          </CardTitle>
          <CardDescription>
            Validate your inquiry data for completeness and quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleValidate}
            disabled={isValidating}
            className="w-full"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Validate Inquiry
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {/* Overall Status */}
          <Card
            className={
              validationResult.isValid
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}
                >
                  {validationResult.isValid
                    ? 'Validation Passed'
                    : 'Validation Failed'}
                </span>
              </div>
              <p
                className={`text-sm mt-1 ${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}
              >
                {validationResult.isValid
                  ? 'Your inquiry data is valid and ready to send.'
                  : `Found ${validationResult.errors.length} error(s) that need to be fixed.`}
              </p>
            </CardContent>
          </Card>

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Errors</CardTitle>
                <CardDescription>
                  These issues must be fixed before sending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityColor(error.severity)}`}
                    >
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {error.field}
                          </div>
                          <div className="text-sm">{error.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-800">Warnings</CardTitle>
                <CardDescription>
                  These issues should be reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {warning.field}
                          </div>
                          <div className="text-sm">{warning.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {validationResult.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Suggestions</CardTitle>
                <CardDescription>
                  These improvements could enhance your inquiry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-blue-200 bg-blue-50"
                    >
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {suggestion.field}
                          </div>
                          <div className="text-sm">{suggestion.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {validationResult.errors.length}
                  </div>
                  <div className="text-sm text-red-800">Errors</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {validationResult.warnings.length}
                  </div>
                  <div className="text-sm text-yellow-800">Warnings</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.suggestions.length}
                  </div>
                  <div className="text-sm text-blue-800">Suggestions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
