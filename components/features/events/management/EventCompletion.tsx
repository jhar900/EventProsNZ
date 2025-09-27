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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Calendar,
  User,
  Star,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface EventCompletionProps {
  eventId: string;
}

interface CompletionData {
  completion_notes?: string;
  final_attendance?: number;
  actual_budget?: number;
  lessons_learned?: string;
}

export function EventCompletion({ eventId }: EventCompletionProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData>({
    completion_notes: '',
    final_attendance: 0,
    actual_budget: 0,
    lessons_learned: '',
  });

  const handleCompleteEvent = async () => {
    try {
      setIsCompleting(true);
      const response = await fetch(`/api/events/${eventId}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completion_data: completionData,
          feedback: completionData.completion_notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCompletionForm(false);
        setCompletionData({
          completion_notes: '',
          final_attendance: 0,
          actual_budget: 0,
          lessons_learned: '',
        });
        // Show success message or redirect
      } else {
        }
    } catch (error) {
      } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Completion Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Complete Event
          </CardTitle>
          <CardDescription>
            Mark this event as completed and provide final details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCompletionForm ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Ready to Complete Event?
              </h3>
              <p className="text-muted-foreground mb-4">
                Once completed, this event will be marked as finished and
                contractors will be notified.
              </p>
              <Button onClick={() => setShowCompletionForm(true)}>
                Complete Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="completion_notes">Completion Notes</Label>
                <Textarea
                  id="completion_notes"
                  placeholder="Describe how the event went, any highlights, or final notes..."
                  value={completionData.completion_notes}
                  onChange={e =>
                    setCompletionData(prev => ({
                      ...prev,
                      completion_notes: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="final_attendance">Final Attendance</Label>
                  <input
                    id="final_attendance"
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter final attendance count"
                    value={completionData.final_attendance || ''}
                    onChange={e =>
                      setCompletionData(prev => ({
                        ...prev,
                        final_attendance: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_budget">Actual Budget Used</Label>
                  <input
                    id="actual_budget"
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter actual budget used"
                    value={completionData.actual_budget || ''}
                    onChange={e =>
                      setCompletionData(prev => ({
                        ...prev,
                        actual_budget: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessons_learned">Lessons Learned</Label>
                <Textarea
                  id="lessons_learned"
                  placeholder="What went well? What could be improved? Any lessons learned for future events?"
                  value={completionData.lessons_learned}
                  onChange={e =>
                    setCompletionData(prev => ({
                      ...prev,
                      lessons_learned: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCompleteEvent}
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompleting ? 'Completing...' : 'Complete Event'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompletionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Pre-Completion Checklist
          </CardTitle>
          <CardDescription>
            Ensure all tasks are completed before marking the event as finished
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="checklist1" className="rounded" />
              <label htmlFor="checklist1" className="text-sm">
                All contractors have been notified of event completion
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="checklist2" className="rounded" />
              <label htmlFor="checklist2" className="text-sm">
                Final payments have been processed
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="checklist3" className="rounded" />
              <label htmlFor="checklist3" className="text-sm">
                All equipment has been returned
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="checklist4" className="rounded" />
              <label htmlFor="checklist4" className="text-sm">
                Event feedback has been collected
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="checklist5" className="rounded" />
              <label htmlFor="checklist5" className="text-sm">
                All documentation has been finalized
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
