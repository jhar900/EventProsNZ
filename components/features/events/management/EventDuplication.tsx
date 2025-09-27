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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Copy,
  Calendar,
  User,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

interface EventDuplicationProps {
  eventId: string;
}

interface DuplicateEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  budget_total: number;
  status: string;
  created_at: string;
}

export function EventDuplication({ eventId }: EventDuplicationProps) {
  const [duplicates, setDuplicates] = useState<DuplicateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDuplicate, setNewDuplicate] = useState({
    new_title: '',
    new_date: '',
    changes: '',
  });

  useEffect(() => {
    loadDuplicates();
  }, [eventId]);

  const loadDuplicates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/duplicates`);
      const data = await response.json();

      if (data.success) {
        setDuplicates(data.duplicates || []);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDuplicate = async () => {
    if (!newDuplicate.new_title || !newDuplicate.new_date) return;

    try {
      setIsCreating(true);
      const changes = newDuplicate.changes
        ? { description: newDuplicate.changes }
        : undefined;

      const response = await fetch(`/api/events/${eventId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_title: newDuplicate.new_title,
          new_date: newDuplicate.new_date,
          changes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewDuplicate({
          new_title: '',
          new_date: '',
          changes: '',
        });
        setShowCreateForm(false);
        await loadDuplicates();
      } else {
        }
    } catch (error) {
      } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Duplicate Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Duplicate Event
          </CardTitle>
          <CardDescription>
            Create a copy of this event for recurring or similar events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Duplicate Event
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_title">New Event Title</Label>
                  <Input
                    id="new_title"
                    placeholder="Enter new event title..."
                    value={newDuplicate.new_title}
                    onChange={e =>
                      setNewDuplicate(prev => ({
                        ...prev,
                        new_title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_date">New Event Date</Label>
                  <Input
                    id="new_date"
                    type="datetime-local"
                    value={newDuplicate.new_date}
                    onChange={e =>
                      setNewDuplicate(prev => ({
                        ...prev,
                        new_date: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="changes">Changes Description (Optional)</Label>
                <Textarea
                  id="changes"
                  placeholder="Describe any changes you want to make to the duplicated event..."
                  value={newDuplicate.changes}
                  onChange={e =>
                    setNewDuplicate(prev => ({
                      ...prev,
                      changes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCreateDuplicate}
                  disabled={
                    !newDuplicate.new_title ||
                    !newDuplicate.new_date ||
                    isCreating
                  }
                >
                  {isCreating ? 'Creating...' : 'Create Duplicate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewDuplicate({
                      new_title: '',
                      new_date: '',
                      changes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Event Duplicates
          </CardTitle>
          <CardDescription>All events created from this event</CardDescription>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No duplicates created yet
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map(duplicate => (
                <div
                  key={duplicate.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Copy className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{duplicate.title}</h3>
                        <Badge className={getStatusColor(duplicate.status)}>
                          {getStatusLabel(duplicate.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(duplicate.event_date)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />$
                          {duplicate.budget_total?.toLocaleString() || '0'}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {duplicate.event_type
                            ?.replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase()) || 'Event'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created: {formatDate(duplicate.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
