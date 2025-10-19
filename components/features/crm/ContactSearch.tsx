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
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building,
  Tag,
  Star,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface Contact {
  id: string;
  contact_type: 'contractor' | 'event_manager' | 'client' | 'vendor' | 'other';
  relationship_status: 'active' | 'inactive' | 'blocked' | 'archived';
  last_interaction: string | null;
  interaction_count: number;
  created_at: string;
  updated_at: string;
  contact_user: {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    last_login: string | null;
    created_at: string;
  };
  contact_profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface SearchFilters {
  contact_type?: string;
  relationship_status?: string;
  tags?: string;
}

export function ContactSearch() {
  const { isLoading, error, searchContacts: searchContactsHook } = useCRM();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setContacts([]);
        return;
      }

      try {
        const results = await searchContactsHook({
          search: searchQuery,
          ...filters,
        });
        setContacts(results);
      } catch (err) {
        // Error is handled by the hook
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, searchContactsHook]);

  // Search contacts
  const searchContacts = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('query', searchQuery);
      if (filters.contact_type)
        params.append('contact_type', filters.contact_type);
      if (filters.relationship_status)
        params.append('relationship_status', filters.relationship_status);
      if (filters.tags) params.append('tags', filters.tags);

      const response = await fetch(`/api/crm/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        setError(data.message || 'Failed to search contacts');
      }
    } catch (err) {
      setError('Failed to search contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'contractor':
        return 'bg-blue-100 text-blue-800';
      case 'event_manager':
        return 'bg-green-100 text-green-800';
      case 'client':
        return 'bg-purple-100 text-purple-800';
      case 'vendor':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact Search</h2>
          <p className="text-muted-foreground">
            Search and filter your contacts
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Contacts</CardTitle>
          <CardDescription>
            Find contacts by name, email, or other criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSearch(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={filters.contact_type || 'all'}
                onValueChange={value =>
                  handleFilterChange('contact_type', value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Contact Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.relationship_status || 'all'}
                onValueChange={value =>
                  handleFilterChange('relationship_status', value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Tags (comma separated)"
                value={filters.tags || 'all'}
                onChange={e => handleFilterChange('tags', e.target.value)}
                className="w-[200px]"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={searchContacts}
                disabled={!searchQuery.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {contacts && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({contacts.length})</CardTitle>
            <CardDescription>
              Contacts matching your search criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Interaction</TableHead>
                  <TableHead>Interactions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={contact.contact_profile.avatar_url || ''}
                          />
                          <AvatarFallback>
                            {getInitials(
                              contact.contact_profile.first_name,
                              contact.contact_profile.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {contact.contact_profile.first_name}{' '}
                            {contact.contact_profile.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contact.contact_user.email}
                          </div>
                          {contact.contact_profile.phone && (
                            <div className="text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {contact.contact_profile.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getContactTypeColor(contact.contact_type)}
                      >
                        {contact.contact_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(contact.relationship_status)}
                      >
                        {contact.relationship_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contact.last_interaction)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {contact.interaction_count}
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && contacts && contacts.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No contacts found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
