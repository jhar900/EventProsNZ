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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  StickyNote,
  Tag,
  Star,
  Calendar,
  User,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface Note {
  id: string;
  note_content: string;
  note_type:
    | 'general'
    | 'meeting'
    | 'call'
    | 'email'
    | 'follow_up'
    | 'important';
  tags: string[];
  is_important: boolean;
  created_at: string;
  updated_at: string;
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

interface NoteFilters {
  note_type?: string;
  contact_id?: string;
  tags?: string;
  is_important?: boolean;
}

export function NotesAndTags() {
  const { notes, isLoading, error, loadNotes, createNote } = useCRM();
  const [filters, setFilters] = useState<NoteFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({
    contact_id: '',
    note_content: '',
    note_type: 'general' as const,
    tags: [] as string[],
    is_important: false,
  });

  // Load notes
  useEffect(() => {
    loadNotes(filters);
  }, [filters, loadNotes]);

  const handleFilterChange = (
    key: keyof NoteFilters,
    value: string | boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === false ? undefined : value,
    }));
  };

  const handleCreateNote = async () => {
    if (!newNote.contact_id || !newNote.note_content.trim()) return;

    try {
      await createNote(newNote);
      setNewNote({
        contact_id: '',
        note_content: '',
        note_type: 'general',
        tags: [],
        is_important: false,
      });
      setIsCreating(false);
      // Reload notes
      loadNotes(filters);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'email':
        return 'bg-purple-100 text-purple-800';
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'important':
        return 'bg-red-100 text-red-800';
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
          <h2 className="text-2xl font-bold tracking-tight">Notes & Tags</h2>
          <p className="text-muted-foreground">
            Manage notes and tags for your contacts
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.note_type || 'all'}
              onValueChange={value => handleFilterChange('note_type', value)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Note Type">
                <SelectValue placeholder="Note Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="important">Important</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={filters.is_important || false}
                onCheckedChange={checked =>
                  handleFilterChange('is_important', checked as boolean)
                }
              />
              <label htmlFor="important" className="text-sm font-medium">
                Important only
              </label>
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

      {/* Create Note Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
            <CardDescription>Add a note for a contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact</label>
                <Select
                  value={newNote.contact_id}
                  onValueChange={value =>
                    setNewNote(prev => ({ ...prev, contact_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Load contacts for selection */}
                    <SelectItem value="1">John Doe</SelectItem>
                    <SelectItem value="2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Note Type</label>
                <Select
                  value={newNote.note_type}
                  onValueChange={value =>
                    setNewNote(prev => ({ ...prev, note_type: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note Content</label>
              <Textarea
                placeholder="Enter your note here..."
                value={newNote.note_content}
                onChange={e =>
                  setNewNote(prev => ({
                    ...prev,
                    note_content: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="important-note"
                  checked={newNote.is_important}
                  onCheckedChange={checked =>
                    setNewNote(prev => ({
                      ...prev,
                      is_important: checked as boolean,
                    }))
                  }
                />
                <label htmlFor="important-note" className="text-sm font-medium">
                  Mark as important
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={
                  !newNote.contact_id ||
                  !newNote.note_content.trim() ||
                  isLoading
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notes ({notes.length})</CardTitle>
          <CardDescription>Your notes and tags for contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No notes found</h3>
              <p className="text-muted-foreground">
                Start by adding your first note
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Important</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map(note => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={note.contact.contact_profile.avatar_url || ''}
                          />
                          <AvatarFallback>
                            {getInitials(
                              note.contact.contact_profile.first_name,
                              note.contact.contact_profile.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {note.contact.contact_profile.first_name}{' '}
                            {note.contact.contact_profile.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {note.contact.contact_user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="truncate">{note.note_content}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getNoteTypeColor(note.note_type)}>
                        {note.note_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {note.is_important ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(note.created_at)}</div>
                        <div className="text-muted-foreground">
                          {formatTime(note.created_at)}
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
                            onClick={() => setSelectedNote(note)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="h-4 w-4 mr-2" />
                            Manage Tags
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Note
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
    </div>
  );
}
