'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface Reminder {
  id: string;
  reminder_type:
    | 'call'
    | 'email'
    | 'meeting'
    | 'follow_up'
    | 'deadline'
    | 'other';
  reminder_date: string;
  reminder_message: string | null;
  is_completed: boolean;
  completed_at: string | null;
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

interface CRMStats {
  totalContacts: number;
  activeContacts: number;
  totalInteractions: number;
  pendingReminders: number;
  recentActivity: number;
}

interface CRMState {
  contacts: Contact[];
  messages: Message[];
  notes: Note[];
  reminders: Reminder[];
  stats: CRMStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useCRM() {
  const [state, setState] = useState<CRMState>({
    contacts: [],
    messages: [],
    notes: [],
    reminders: [],
    stats: null,
    isLoading: false,
    error: null,
  });

  // Load contacts
  const loadContacts = useCallback(async (filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters?.contact_type)
        params.append('contact_type', filters.contact_type);
      if (filters?.relationship_status)
        params.append('relationship_status', filters.relationship_status);
      if (filters?.search) params.append('query', filters.search);

      const response = await fetch(`/api/crm/contacts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, contacts: data.contacts }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to load contacts',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load contacts',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Create contact
  const createContact = useCallback(async (contactData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          contacts: [data.contact, ...prev.contacts],
        }));
        return data.contact;
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to create contact',
        }));
        return null;
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to create contact',
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Update contact
  const updateContact = useCallback(async (contactId: string, updates: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          contacts: prev.contacts.map(contact =>
            contact.id === contactId ? data.contact : contact
          ),
        }));
        return data.contact;
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to update contact',
        }));
        return null;
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to update contact',
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Delete contact
  const deleteContact = useCallback(async (contactId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          contacts: prev.contacts.filter(contact => contact.id !== contactId),
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to delete contact',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to delete contact',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load messages
  const loadMessages = useCallback(async (filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters?.contact_id) params.append('contact_id', filters.contact_id);
      if (filters?.message_type)
        params.append('message_type', filters.message_type);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/crm/messages?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, messages: data.messages }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to load messages',
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to load messages' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Create message
  const createMessage = useCallback(async (messageData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/crm/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          messages: [data.message, ...prev.messages],
        }));
        return data.message;
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to create message',
        }));
        throw new Error(data.message || 'Failed to create message');
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to create message' }));
      throw err;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load notes
  const loadNotes = useCallback(async (filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters?.contact_id) params.append('contact_id', filters.contact_id);
      if (filters?.note_type) params.append('note_type', filters.note_type);
      if (filters?.tags) params.append('tags', filters.tags);
      if (filters?.is_important !== undefined)
        params.append('is_important', filters.is_important.toString());

      const response = await fetch(`/api/crm/notes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, notes: data.notes }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to load notes',
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to load notes' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Create note
  const createNote = useCallback(async (noteData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, notes: [data.note, ...prev.notes] }));
        return data.note;
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to create note',
        }));
        throw new Error(data.message || 'Failed to create note');
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to create note' }));
      throw err;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load reminders
  const loadReminders = useCallback(async (filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters?.contact_id) params.append('contact_id', filters.contact_id);
      if (filters?.reminder_type)
        params.append('reminder_type', filters.reminder_type);
      if (filters?.is_completed !== undefined)
        params.append('is_completed', filters.is_completed.toString());

      const response = await fetch(`/api/crm/reminders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, reminders: data.reminders }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to load reminders',
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to load reminders' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Create reminder
  const createReminder = useCallback(async (reminderData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/crm/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          reminders: [data.reminder, ...prev.reminders],
        }));
        return data.reminder;
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to create reminder',
        }));
        throw new Error(data.message || 'Failed to create reminder');
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to create reminder' }));
      throw err;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Update reminder
  const updateReminder = useCallback(
    async (reminderId: string, updates: any) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch(`/api/crm/reminders/${reminderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            reminders: prev.reminders.map(reminder =>
              reminder.id === reminderId ? data.reminder : reminder
            ),
          }));
          return data.reminder;
        } else {
          setState(prev => ({
            ...prev,
            error: data.message || 'Failed to update reminder',
          }));
          throw new Error(data.message || 'Failed to update reminder');
        }
      } catch (err) {
        setState(prev => ({ ...prev, error: 'Failed to update reminder' }));
        throw err;
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  // Search contacts
  const searchContacts = useCallback(async (query: string, filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      params.append('query', query);
      if (filters?.contact_type)
        params.append('contact_type', filters.contact_type);
      if (filters?.relationship_status)
        params.append('relationship_status', filters.relationship_status);
      if (filters?.tags) params.append('tags', filters.tags);

      const response = await fetch(`/api/crm/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, contacts: data.contacts }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to search contacts',
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to search contacts' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Export contacts
  const exportContacts = useCallback(async (format: string, filters?: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      params.append('format', format);
      if (filters?.contact_type)
        params.append('contact_type', filters.contact_type);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/crm/export?${params.toString()}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to export contacts',
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to export contacts' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set error (for testing purposes)
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    loadMessages,
    createMessage,
    loadNotes,
    createNote,
    loadReminders,
    createReminder,
    updateReminder,
    searchContacts,
    exportContacts,
    clearError,
    setError,
  };
}
