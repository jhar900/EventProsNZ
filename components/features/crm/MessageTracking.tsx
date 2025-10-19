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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Send,
  Reply,
  Forward,
  Archive,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface Message {
  id: string;
  message_type: 'inquiry' | 'response' | 'follow_up' | 'general';
  message_content: string;
  message_data: any;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  contact: {
    id: string;
    contact_type: string;
    relationship_status: string;
    contact_user: {
      id: string;
      email: string;
      role: string;
    };
    contact_profile: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
}

interface MessageFilters {
  message_type?: string;
  contact_id?: string;
  date_from?: string;
  date_to?: string;
}

export function MessageTracking() {
  const { isLoading, error, messages, loadMessages } = useCRM();
  const [filters, setFilters] = useState<MessageFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Load messages when filters change
  useEffect(() => {
    loadMessages(filters);
  }, [filters, loadMessages]);

  const handleFilterChange = (key: keyof MessageFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSendMessage = async () => {
    if (!selectedMessage || !newMessage.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/crm/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: selectedMessage.contact.id,
          message_type: 'response',
          message_content: newMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        // Reload messages
        const loadResponse = await fetch(
          `/api/crm/messages?${new URLSearchParams(filters).toString()}`
        );
        const loadData = await loadResponse.json();
        if (loadData.success) {
          setMessages(loadData.messages);
        }
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'bg-blue-100 text-blue-800';
      case 'response':
        return 'bg-green-100 text-green-800';
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Message Tracking
          </h2>
          <p className="text-muted-foreground">
            Track and manage your conversations with contacts
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.message_type || 'all'}
              onValueChange={value => handleFilterChange('message_type', value)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Message Type">
                <SelectValue placeholder="Message Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="response">Response</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
          <CardDescription>
            Your conversation history with contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No messages found</h3>
              <p className="text-muted-foreground">
                Start a conversation with your contacts
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map(message => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              message.contact.contact_profile.avatar_url || ''
                            }
                          />
                          <AvatarFallback>
                            {getInitials(
                              message.contact.contact_profile.first_name,
                              message.contact.contact_profile.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {message.contact.contact_profile.first_name}{' '}
                            {message.contact.contact_profile.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {message.contact.contact_user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {message.message_content}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getMessageTypeColor(message.message_type)}
                      >
                        {message.message_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {message.is_read ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {message.is_read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(message.created_at)}</div>
                        <div className="text-muted-foreground">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reply Modal */}
      {selectedMessage && (
        <Card>
          <CardHeader>
            <CardTitle>
              Reply to {selectedMessage.contact.contact_profile.first_name}{' '}
              {selectedMessage.contact.contact_profile.last_name}
            </CardTitle>
            <CardDescription>Send a response to this contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedMessage(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
