import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  filters: {
    contacts: any;
    messages: any;
    notes: any;
    reminders: any;
  };
}

interface CRMActions {
  // Contacts
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, updates: Partial<Contact>) => void;
  removeContact: (contactId: string) => void;

  // Messages
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;

  // Notes
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  removeNote: (noteId: string) => void;

  // Reminders
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminderId: string, updates: Partial<Reminder>) => void;
  removeReminder: (reminderId: string) => void;

  // Stats
  setStats: (stats: CRMStats) => void;

  // Loading & Error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Filters
  setContactFilters: (filters: any) => void;
  setMessageFilters: (filters: any) => void;
  setNoteFilters: (filters: any) => void;
  setReminderFilters: (filters: any) => void;

  // Reset
  reset: () => void;
}

const initialState: CRMState = {
  contacts: [],
  messages: [],
  notes: [],
  reminders: [],
  stats: null,
  isLoading: false,
  error: null,
  filters: {
    contacts: {},
    messages: {},
    notes: {},
    reminders: {},
  },
};

export const useCRMStore = create<CRMState & CRMActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Contacts
      setContacts: contacts => set({ contacts }),
      addContact: contact =>
        set(state => ({
          contacts: [contact, ...state.contacts],
        })),
      updateContact: (contactId, updates) =>
        set(state => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId ? { ...contact, ...updates } : contact
          ),
        })),
      removeContact: contactId =>
        set(state => ({
          contacts: state.contacts.filter(contact => contact.id !== contactId),
        })),

      // Messages
      setMessages: messages => set({ messages }),
      addMessage: message =>
        set(state => ({
          messages: [message, ...state.messages],
        })),
      updateMessage: (messageId, updates) =>
        set(state => ({
          messages: state.messages.map(message =>
            message.id === messageId ? { ...message, ...updates } : message
          ),
        })),
      removeMessage: messageId =>
        set(state => ({
          messages: state.messages.filter(message => message.id !== messageId),
        })),

      // Notes
      setNotes: notes => set({ notes }),
      addNote: note =>
        set(state => ({
          notes: [note, ...state.notes],
        })),
      updateNote: (noteId, updates) =>
        set(state => ({
          notes: state.notes.map(note =>
            note.id === noteId ? { ...note, ...updates } : note
          ),
        })),
      removeNote: noteId =>
        set(state => ({
          notes: state.notes.filter(note => note.id !== noteId),
        })),

      // Reminders
      setReminders: reminders => set({ reminders }),
      addReminder: reminder =>
        set(state => ({
          reminders: [reminder, ...state.reminders],
        })),
      updateReminder: (reminderId, updates) =>
        set(state => ({
          reminders: state.reminders.map(reminder =>
            reminder.id === reminderId ? { ...reminder, ...updates } : reminder
          ),
        })),
      removeReminder: reminderId =>
        set(state => ({
          reminders: state.reminders.filter(
            reminder => reminder.id !== reminderId
          ),
        })),

      // Stats
      setStats: stats => set({ stats }),

      // Loading & Error
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
      clearError: () => set({ error: null }),

      // Filters
      setContactFilters: filters =>
        set(state => ({
          filters: { ...state.filters, contacts: filters },
        })),
      setMessageFilters: filters =>
        set(state => ({
          filters: { ...state.filters, messages: filters },
        })),
      setNoteFilters: filters =>
        set(state => ({
          filters: { ...state.filters, notes: filters },
        })),
      setReminderFilters: filters =>
        set(state => ({
          filters: { ...state.filters, reminders: filters },
        })),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'crm-store',
    }
  )
);
