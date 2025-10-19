// Import the proper mock
import { createFinalSupabaseMock } from '../../mocks/supabase-final-mock';

// Mock Supabase client
const mockSupabase = createFinalSupabaseMock();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Import services
import { ContactService } from '@/lib/crm/contact-service';
import { MessageService } from '@/lib/crm/message-service';
import { NoteService } from '@/lib/crm/note-service';
import { ReminderService } from '@/lib/crm/reminder-service';

describe('CRM Services - Essential Tests', () => {
  describe('ContactService', () => {
    let contactService: ContactService;

    beforeEach(() => {
      contactService = new ContactService(mockSupabase);
    });

    it('should have required methods', () => {
      expect(typeof contactService.getContacts).toBe('function');
      expect(typeof contactService.createContact).toBe('function');
      expect(typeof contactService.updateContact).toBe('function');
      expect(typeof contactService.deleteContact).toBe('function');
    });

    it('should handle getContacts operation', async () => {
      const result = await contactService.getContacts('test-user-id');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('contacts');
    });

    it('should handle createContact operation', async () => {
      const contactData = {
        contact_user_id: 'user-123',
        contact_type: 'client',
        relationship_status: 'active',
      };
      const result = await contactService.createContact(
        'test-user-id',
        contactData
      );
      expect(result).toHaveProperty('success');
    });

    it('should handle updateContact operation', async () => {
      const updateData = {
        contact_type: 'client',
        relationship_status: 'active',
      };
      const result = await contactService.updateContact(
        'test-user-id',
        'test-contact-id',
        updateData
      );
      expect(result).toHaveProperty('success');
    });
  });

  describe('MessageService', () => {
    let messageService: MessageService;

    beforeEach(() => {
      messageService = new MessageService(mockSupabase);
    });

    it('should have required methods', () => {
      expect(typeof messageService.getMessages).toBe('function');
      expect(typeof messageService.createMessage).toBe('function');
    });

    it('should handle getMessages operation', async () => {
      const result = await messageService.getMessages({
        user_id: 'test-user-id',
      });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('messages');
    });

    it('should handle createMessage operation', async () => {
      const messageData = {
        contact_id: 'contact-123',
        message_type: 'inquiry',
        message_content: 'Test message',
      };
      const result = await messageService.createMessage(messageData);
      expect(result).toHaveProperty('success');
    });
  });

  describe('NoteService', () => {
    let noteService: NoteService;

    beforeEach(() => {
      noteService = new NoteService(mockSupabase);
    });

    it('should have required methods', () => {
      expect(typeof noteService.getNotes).toBe('function');
      expect(typeof noteService.createNote).toBe('function');
    });

    it('should handle getNotes operation', async () => {
      const result = await noteService.getNotes({ user_id: 'test-user-id' });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('notes');
    });

    it('should handle createNote operation', async () => {
      const noteData = {
        contact_id: 'contact-123',
        note_content: 'Test note',
        note_type: 'general',
      };
      const result = await noteService.createNote('test-user-id', noteData);
      expect(result).toHaveProperty('success');
    });
  });

  describe('ReminderService', () => {
    let reminderService: ReminderService;

    beforeEach(() => {
      reminderService = new ReminderService(mockSupabase);
    });

    it('should have required methods', () => {
      expect(typeof reminderService.getReminders).toBe('function');
      expect(typeof reminderService.createReminder).toBe('function');
    });

    it('should handle getReminders operation', async () => {
      const result = await reminderService.getReminders({
        user_id: 'test-user-id',
      });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('reminders');
    });

    it('should handle createReminder operation', async () => {
      const reminderData = {
        contact_id: 'contact-123',
        reminder_type: 'follow_up',
        reminder_date: '2024-12-25T10:00:00Z',
        reminder_message: 'Follow up with client',
      };
      const result = await reminderService.createReminder(
        'test-user-id',
        reminderData
      );
      expect(result).toHaveProperty('success');
    });
  });
});
