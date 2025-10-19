import { ReminderService } from '@/lib/crm/reminder-service';

// Mock Supabase client with proper method chaining
const createMockQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest
    .fn()
    .mockResolvedValue({ data: { id: 'test-reminder-id' }, error: null }),
  maybeSingle: jest
    .fn()
    .mockResolvedValue({ data: { id: 'test-reminder-id' }, error: null }),
  then: jest.fn().mockImplementation((onFulfilled, onRejected) => {
    return Promise.resolve({
      data: [{ id: 'test-reminder-id' }],
      error: null,
    }).then(onFulfilled, onRejected);
  }),
  execute: jest
    .fn()
    .mockResolvedValue({ data: [{ id: 'test-reminder-id' }], error: null }),
  abortSignal: jest.fn().mockReturnThis(),
  explain: jest
    .fn()
    .mockResolvedValue({ data: { query: 'SELECT * FROM test' }, error: null }),
  rollback: jest.fn().mockResolvedValue({ data: null, error: null }),
  commit: jest.fn().mockResolvedValue({ data: null, error: null }),
  transaction: jest
    .fn()
    .mockImplementation(callback => callback(createMockQuery())),
  subscribe: jest
    .fn()
    .mockImplementation(callback => ({ unsubscribe: jest.fn() })),
  on: jest
    .fn()
    .mockImplementation((event, callback) => ({ unsubscribe: jest.fn() })),
  channel: jest.fn().mockImplementation(name => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
});

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn().mockImplementation(() => createMockQuery()),
};

// Mock the Supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('ReminderService - Basic Tests', () => {
  let reminderService: ReminderService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = mockSupabase;
    reminderService = new ReminderService(mockSupabaseClient);
  });

  describe('constructor', () => {
    it('should create a ReminderService instance', () => {
      expect(reminderService).toBeDefined();
      expect(reminderService).toBeInstanceOf(ReminderService);
    });
  });

  describe('createReminder', () => {
    it('should handle basic reminder creation', async () => {
      const reminderData = {
        contact_id: 'test-contact-id',
        reminder_type: 'follow_up' as const,
        reminder_date: new Date('2024-12-25'),
        reminder_message: 'Test reminder message',
      };

      // Test that the method exists and can be called
      expect(typeof reminderService.createReminder).toBe('function');

      const result = await reminderService.createReminder(
        'test-user-id',
        reminderData
      );
      expect(result).toBeDefined();
    });
  });

  describe('getReminders', () => {
    it('should handle basic reminder retrieval', async () => {
      // Test that the method exists and can be called
      expect(typeof reminderService.getReminders).toBe('function');

      const result = await reminderService.getReminders('test-user-id');
      expect(result).toBeDefined();
    });
  });

  describe('updateReminder', () => {
    it('should handle basic reminder updates', async () => {
      const updateData = {
        reminder_message: 'Updated reminder message',
      };

      // Test that the method exists and can be called
      expect(typeof reminderService.updateReminder).toBe('function');

      const result = await reminderService.updateReminder(
        'test-user-id',
        'test-reminder-id',
        updateData
      );
      expect(result).toBeDefined();
    });
  });

  describe('deleteReminder', () => {
    it('should handle basic reminder deletion', async () => {
      // Test that the method exists and can be called
      expect(typeof reminderService.deleteReminder).toBe('function');

      const result = await reminderService.deleteReminder(
        'test-user-id',
        'test-reminder-id'
      );
      expect(result).toBeDefined();
    });
  });

  describe('getUpcomingReminders', () => {
    it('should handle basic upcoming reminders retrieval', async () => {
      // Test that the method exists and can be called
      expect(typeof reminderService.getUpcomingReminders).toBe('function');

      const result = await reminderService.getUpcomingReminders(
        'test-user-id',
        7
      );
      expect(result).toBeDefined();
    });
  });

  describe('getOverdueReminders', () => {
    it('should handle basic overdue reminders retrieval', async () => {
      // Test that the method exists and can be called
      expect(typeof reminderService.getOverdueReminders).toBe('function');

      const result = await reminderService.getOverdueReminders('test-user-id');
      expect(result).toBeDefined();
    });
  });
});
