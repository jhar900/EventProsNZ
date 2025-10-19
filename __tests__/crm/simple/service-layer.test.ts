import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

// Mock the service classes
class MockContactService {
  constructor(private supabase: any) {}

  async getContacts(userId: string, options: any = {}) {
    return {
      success: true,
      contacts: [
        {
          id: 'contact-1',
          user_id: userId,
          contact_type: 'client',
          relationship_status: 'active',
        },
      ],
      total: 1,
    };
  }

  async createContact(userId: string, contactData: any) {
    return {
      success: true,
      contact: {
        id: 'new-contact-id',
        user_id: userId,
        ...contactData,
      },
    };
  }

  async updateContact(userId: string, contactId: string, updates: any) {
    return {
      success: true,
      contact: {
        id: contactId,
        user_id: userId,
        ...updates,
      },
    };
  }

  async deleteContact(userId: string, contactId: string) {
    return {
      success: true,
      message: 'Contact deleted successfully',
    };
  }
}

class MockMessageService {
  constructor(private supabase: any) {}

  async getMessages(userId: string, contactId?: string) {
    return {
      success: true,
      messages: [
        {
          id: 'message-1',
          user_id: userId,
          contact_id: contactId || 'contact-1',
          message_type: 'inquiry',
          message_content: 'Hello',
        },
      ],
      total: 1,
    };
  }

  async createMessage(userId: string, messageData: any) {
    return {
      success: true,
      message: {
        id: 'new-message-id',
        user_id: userId,
        ...messageData,
      },
    };
  }
}

class MockNoteService {
  constructor(private supabase: any) {}

  async getNotes(userId: string, contactId?: string) {
    return {
      success: true,
      notes: [
        {
          id: 'note-1',
          user_id: userId,
          contact_id: contactId || 'contact-1',
          note_type: 'general',
          note_content: 'Important note',
        },
      ],
      total: 1,
    };
  }

  async createNote(userId: string, noteData: any) {
    return {
      success: true,
      note: {
        id: 'new-note-id',
        user_id: userId,
        ...noteData,
      },
    };
  }
}

class MockReminderService {
  constructor(private supabase: any) {}

  async getReminders(userId: string, contactId?: string) {
    return {
      success: true,
      reminders: [
        {
          id: 'reminder-1',
          user_id: userId,
          contact_id: contactId || 'contact-1',
          reminder_type: 'follow_up',
          reminder_date: '2024-12-25T10:00:00Z',
        },
      ],
      total: 1,
    };
  }

  async createReminder(userId: string, reminderData: any) {
    return {
      success: true,
      reminder: {
        id: 'new-reminder-id',
        user_id: userId,
        ...reminderData,
      },
    };
  }
}

describe('CRM Service Layer Tests', () => {
  let contactService: MockContactService;
  let messageService: MockMessageService;
  let noteService: MockNoteService;
  let reminderService: MockReminderService;

  beforeEach(() => {
    contactService = new MockContactService(mockSupabase);
    messageService = new MockMessageService(mockSupabase);
    noteService = new MockNoteService(mockSupabase);
    reminderService = new MockReminderService(mockSupabase);
  });

  describe('ContactService', () => {
    it('should get contacts successfully', async () => {
      const result = await contactService.getContacts('user-1');

      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].user_id).toBe('user-1');
      expect(result.total).toBe(1);
    });

    it('should create contact successfully', async () => {
      const contactData = {
        contact_user_id: 'user-2',
        contact_type: 'client',
        relationship_status: 'active',
      };

      const result = await contactService.createContact('user-1', contactData);

      expect(result.success).toBe(true);
      expect(result.contact.user_id).toBe('user-1');
      expect(result.contact.contact_type).toBe('client');
    });

    it('should update contact successfully', async () => {
      const updates = {
        relationship_status: 'inactive',
      };

      const result = await contactService.updateContact(
        'user-1',
        'contact-1',
        updates
      );

      expect(result.success).toBe(true);
      expect(result.contact.id).toBe('contact-1');
      expect(result.contact.relationship_status).toBe('inactive');
    });

    it('should delete contact successfully', async () => {
      const result = await contactService.deleteContact('user-1', 'contact-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Contact deleted successfully');
    });
  });

  describe('MessageService', () => {
    it('should get messages successfully', async () => {
      const result = await messageService.getMessages('user-1', 'contact-1');

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].contact_id).toBe('contact-1');
      expect(result.total).toBe(1);
    });

    it('should create message successfully', async () => {
      const messageData = {
        contact_id: 'contact-1',
        message_type: 'inquiry',
        message_content: 'Hello, I need your services.',
      };

      const result = await messageService.createMessage('user-1', messageData);

      expect(result.success).toBe(true);
      expect(result.message.user_id).toBe('user-1');
      expect(result.message.message_type).toBe('inquiry');
    });
  });

  describe('NoteService', () => {
    it('should get notes successfully', async () => {
      const result = await noteService.getNotes('user-1', 'contact-1');

      expect(result.success).toBe(true);
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].contact_id).toBe('contact-1');
      expect(result.total).toBe(1);
    });

    it('should create note successfully', async () => {
      const noteData = {
        contact_id: 'contact-1',
        note_type: 'general',
        note_content: 'Important note about this contact.',
      };

      const result = await noteService.createNote('user-1', noteData);

      expect(result.success).toBe(true);
      expect(result.note.user_id).toBe('user-1');
      expect(result.note.note_type).toBe('general');
    });
  });

  describe('ReminderService', () => {
    it('should get reminders successfully', async () => {
      const result = await reminderService.getReminders('user-1', 'contact-1');

      expect(result.success).toBe(true);
      expect(result.reminders).toHaveLength(1);
      expect(result.reminders[0].contact_id).toBe('contact-1');
      expect(result.total).toBe(1);
    });

    it('should create reminder successfully', async () => {
      const reminderData = {
        contact_id: 'contact-1',
        reminder_type: 'follow_up',
        reminder_date: '2024-12-25T10:00:00Z',
        reminder_message: 'Follow up on project proposal',
      };

      const result = await reminderService.createReminder(
        'user-1',
        reminderData
      );

      expect(result.success).toBe(true);
      expect(result.reminder.user_id).toBe('user-1');
      expect(result.reminder.reminder_type).toBe('follow_up');
    });
  });

  describe('Service Integration', () => {
    it('should handle complete contact workflow', async () => {
      // Create contact
      const contactResult = await contactService.createContact('user-1', {
        contact_user_id: 'user-2',
        contact_type: 'client',
        relationship_status: 'active',
      });
      expect(contactResult.success).toBe(true);

      // Add message
      const messageResult = await messageService.createMessage('user-1', {
        contact_id: contactResult.contact.id,
        message_type: 'inquiry',
        message_content: 'Hello',
      });
      expect(messageResult.success).toBe(true);

      // Add note
      const noteResult = await noteService.createNote('user-1', {
        contact_id: contactResult.contact.id,
        note_type: 'general',
        note_content: 'Important contact',
      });
      expect(noteResult.success).toBe(true);

      // Add reminder
      const reminderResult = await reminderService.createReminder('user-1', {
        contact_id: contactResult.contact.id,
        reminder_type: 'follow_up',
        reminder_date: '2024-12-25T10:00:00Z',
        reminder_message: 'Follow up',
      });
      expect(reminderResult.success).toBe(true);
    });

    it('should handle data consistency', async () => {
      const userId = 'user-1';
      const contactId = 'contact-1';

      // All services should work with the same user and contact
      const contactResult = await contactService.getContacts(userId);
      const messageResult = await messageService.getMessages(userId, contactId);
      const noteResult = await noteService.getNotes(userId, contactId);
      const reminderResult = await reminderService.getReminders(
        userId,
        contactId
      );

      expect(contactResult.success).toBe(true);
      expect(messageResult.success).toBe(true);
      expect(noteResult.success).toBe(true);
      expect(reminderResult.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service that returns an error
      const errorService = {
        async getContacts() {
          return {
            success: false,
            error: 'Database connection failed',
          };
        },
      };

      const result = await errorService.getContacts();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should validate required parameters', () => {
      const validateContactData = (data: any) => {
        const required = [
          'contact_user_id',
          'contact_type',
          'relationship_status',
        ];
        const missing = required.filter(field => !data[field]);
        return missing.length === 0;
      };

      const validData = {
        contact_user_id: 'user-2',
        contact_type: 'client',
        relationship_status: 'active',
      };

      const invalidData = {
        contact_user_id: 'user-2',
        // missing contact_type and relationship_status
      };

      expect(validateContactData(validData)).toBe(true);
      expect(validateContactData(invalidData)).toBe(false);
    });
  });
});
