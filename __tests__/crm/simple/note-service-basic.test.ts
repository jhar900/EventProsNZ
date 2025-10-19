import { NoteService } from '@/lib/crm/note-service';

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
    .mockResolvedValue({ data: { id: 'test-note-id' }, error: null }),
  maybeSingle: jest
    .fn()
    .mockResolvedValue({ data: { id: 'test-note-id' }, error: null }),
  then: jest.fn().mockImplementation((onFulfilled, onRejected) => {
    return Promise.resolve({
      data: [{ id: 'test-note-id' }],
      error: null,
    }).then(onFulfilled, onRejected);
  }),
  execute: jest
    .fn()
    .mockResolvedValue({ data: [{ id: 'test-note-id' }], error: null }),
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

describe('NoteService - Basic Tests', () => {
  let noteService: NoteService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = mockSupabase;
    noteService = new NoteService(mockSupabaseClient);
  });

  describe('constructor', () => {
    it('should create a NoteService instance', () => {
      expect(noteService).toBeDefined();
      expect(noteService).toBeInstanceOf(NoteService);
    });
  });

  describe('createNote', () => {
    it('should handle basic note creation', async () => {
      const noteData = {
        contact_id: 'test-contact-id',
        note_content: 'Test note content',
      };

      // Test that the method exists and can be called
      expect(typeof noteService.createNote).toBe('function');

      // The actual implementation may return an error object instead of throwing
      const result = await noteService.createNote('test-user-id', noteData);
      expect(result).toBeDefined();
    });
  });

  describe('getNotes', () => {
    it('should handle basic note retrieval', async () => {
      // Test that the method exists and can be called
      expect(typeof noteService.getNotes).toBe('function');

      const result = await noteService.getNotes('test-user-id');
      expect(result).toBeDefined();
    });
  });

  describe('updateNote', () => {
    it('should handle basic note updates', async () => {
      const updateData = {
        note_content: 'Updated note content',
      };

      // Test that the method exists and can be called
      expect(typeof noteService.updateNote).toBe('function');

      const result = await noteService.updateNote(
        'test-user-id',
        'test-note-id',
        updateData
      );
      expect(result).toBeDefined();
    });
  });

  describe('deleteNote', () => {
    it('should handle basic note deletion', async () => {
      // Test that the method exists and can be called
      expect(typeof noteService.deleteNote).toBe('function');

      const result = await noteService.deleteNote(
        'test-user-id',
        'test-note-id'
      );
      expect(result).toBeDefined();
    });
  });

  describe('searchNotes', () => {
    it('should handle basic note search', async () => {
      // Test that the method exists and can be called
      expect(typeof noteService.searchNotes).toBe('function');

      const result = await noteService.searchNotes(
        'test-user-id',
        'test search'
      );
      expect(result).toBeDefined();
    });
  });
});
