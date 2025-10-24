import { EmailTemplateManager } from '@/lib/email/email-template-manager';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/security/sanitization');

// Create a comprehensive mock that supports all Supabase query methods
const createMockQuery = () => {
  const mockQuery = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    lt: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    or: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => mockQuery),
    data: [],
    error: null,
  };
  return mockQuery;
};

const mockSupabase = {
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('EmailTemplateManager', () => {
  let templateManager: EmailTemplateManager;

  beforeEach(() => {
    jest.clearAllMocks();
    templateManager = new EmailTemplateManager();
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      // Mock the insert operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Test Subject',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templateData = {
        name: 'Test Template',
        subject: 'Test Subject',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        is_active: true,
        created_by: 'test-user-id',
      };

      const result = await templateManager.createTemplate(templateData);

      expect(result.id).toBe('test-template-id');
      expect(result.name).toBe('Test Template');
      expect(result.variables).toEqual(['firstName']);
      expect(result.version).toBe(1);
    });

    it('should extract variables from template content', async () => {
      // Mock the insert operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Hello {{firstName}} {{lastName}}!',
          html_content:
            '<p>Hello {{firstName}} {{lastName}}!</p><p>Your email is {{email}}</p>',
          text_content:
            'Hello {{firstName}} {{lastName}}!\nYour email is {{email}}',
          variables: ['firstName', 'lastName', 'email'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templateData = {
        name: 'Test Template',
        subject: 'Hello {{firstName}} {{lastName}}!',
        html_content:
          '<p>Hello {{firstName}} {{lastName}}!</p><p>Your email is {{email}}</p>',
        text_content:
          'Hello {{firstName}} {{lastName}}!\nYour email is {{email}}',
        is_active: true,
        created_by: 'test-user-id',
      };

      await templateManager.createTemplate(templateData);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.arrayContaining(['firstName', 'lastName', 'email']),
        })
      );
    });

    it('should sanitize template content', async () => {
      // Mock the insert operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Test Subject',
          html_content: '<p>Test HTML</p>',
          text_content: 'Test Text',
          variables: [],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templateData = {
        name: 'Test Template',
        subject: 'Test Subject <script>alert("xss")</script>',
        html_content: '<p>Test HTML <script>alert("xss")</script></p>',
        text_content: 'Test Text',
        is_active: true,
        created_by: 'test-user-id',
      };

      await templateManager.createTemplate(templateData);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.not.stringContaining('<script>'),
          html_content: expect.not.stringContaining('<script>'),
        })
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      // Mock the getTemplate operation
      const mockQuery1 = createMockQuery();
      mockQuery1.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Test Subject',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });

      // Mock the update operation
      const mockQuery2 = createMockQuery();
      mockQuery2.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Updated Template',
          subject: 'Updated Subject',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:01:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const updates = {
        name: 'Updated Template',
        subject: 'Updated Subject',
      };

      const result = await templateManager.updateTemplate(
        'test-template-id',
        updates
      );

      expect(result.name).toBe('Updated Template');
      expect(result.version).toBe(2);
    });

    it('should increment version on update', async () => {
      const updates = {
        html_content: '<p>Updated HTML</p>',
      };

      await templateManager.updateTemplate('test-template-id', updates);

      const updateCall = mockSupabase.from().update.mock.calls[0][0];
      expect(updateCall.version).toBe(2);
    });

    it('should extract variables when content changes', async () => {
      const updates = {
        html_content: '<p>Hello {{newVariable}}!</p>',
      };

      await templateManager.updateTemplate('test-template-id', updates);

      const updateCall = mockSupabase.from().update.mock.calls[0][0];
      expect(updateCall.variables).toEqual(['newVariable']);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', async () => {
      // Mock the select operation to return template data
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Test Subject',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const template = await templateManager.getTemplate('test-template-id');

      expect(template).toEqual({
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Test Subject',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
        version: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user-id',
      });
    });

    it('should return null for non-existent template', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });

      const template = await templateManager.getTemplate('non-existent-id');

      expect(template).toBeNull();
    });
  });

  describe('getTemplates', () => {
    it('should return all templates', async () => {
      // Mock the select operation to return templates data
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({
        data: [
          {
            id: 'test-template-id',
            name: 'Test Template',
            subject: 'Test Subject',
            html_content: '<p>Hello {{firstName}}!</p>',
            text_content: 'Hello {{firstName}}!',
            variables: ['firstName'],
            version: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: 'test-user-id',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templates = await templateManager.getTemplates();

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Test Template');
    });

    it('should filter templates by active status', async () => {
      // Mock the select operation to return filtered templates
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({
        data: [
          {
            id: 'test-template-id',
            name: 'Test Template',
            subject: 'Test Subject',
            html_content: '<p>Hello {{firstName}}!</p>',
            text_content: 'Hello {{firstName}}!',
            variables: ['firstName'],
            version: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: 'test-user-id',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templates = await templateManager.getTemplates({ is_active: true });

      expect(templates).toHaveLength(1);
      expect(templates[0].is_active).toBe(true);
    });

    it('should search templates by name or subject', async () => {
      // Mock the select operation to return search results
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({
        data: [
          {
            id: 'test-template-id',
            name: 'Test Template',
            subject: 'Test Subject',
            html_content: '<p>Hello {{firstName}}!</p>',
            text_content: 'Hello {{firstName}}!',
            variables: ['firstName'],
            version: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            created_by: 'test-user-id',
          },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const templates = await templateManager.getTemplates({ search: 'test' });

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Test Template');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      // Mock the delete operation
      const mockQuery = createMockQuery();
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      await templateManager.deleteTemplate('test-template-id');

      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', async () => {
      // Mock the getTemplate operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Hello {{firstName}}!',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const variables = {
        firstName: 'John',
      };

      const result = await templateManager.renderTemplate(
        'test-template-id',
        variables
      );

      expect(result.subject).toBe('Hello John!');
      expect(result.html).toBe('<p>Hello John!</p>');
      expect(result.text).toBe('Hello John!');
    });

    it('should handle missing variables', async () => {
      // Mock the getTemplate operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Hello {{firstName}}!',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const variables = {};

      const result = await templateManager.renderTemplate(
        'test-template-id',
        variables
      );

      expect(result.html).toBe('<p>Hello {{firstName}}!</p>');
    });
  });

  describe('previewTemplate', () => {
    it('should preview template with sample data', async () => {
      // Mock the getTemplate operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Hello {{firstName}}!',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await templateManager.previewTemplate('test-template-id');

      expect(result.subject).toBe('Hello John!');
      expect(result.html).toContain('Hello');
    });

    it('should use provided sample data', async () => {
      // Mock the getTemplate operation
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'test-template-id',
          name: 'Test Template',
          subject: 'Hello {{firstName}}!',
          html_content: '<p>Hello {{firstName}}!</p>',
          text_content: 'Hello {{firstName}}!',
          variables: ['firstName'],
          version: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'test-user-id',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQuery);

      const sampleData = {
        firstName: 'Jane',
      };

      const result = await templateManager.previewTemplate(
        'test-template-id',
        sampleData
      );

      expect(result.html).toBe('<p>Hello Jane!</p>');
    });
  });

  describe('getTemplateVariables', () => {
    it('should return template variables with metadata', async () => {
      const template = {
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Hello {{firstName}}!',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
        version: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user-id',
      };

      const variables = templateManager.getTemplateVariables(template);

      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('firstName');
      expect(variables[0].description).toBe("User's first name");
      expect(variables[0].required).toBe(true);
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate template variables', async () => {
      const template = {
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Hello {{firstName}}!',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
        version: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user-id',
      };

      const validVariables = { firstName: 'John' };
      const invalidVariables = {};

      const validResult = templateManager.validateTemplateVariables(
        template,
        validVariables
      );
      const invalidResult = templateManager.validateTemplateVariables(
        template,
        invalidVariables
      );

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain(
        "Required variable 'firstName' is missing or empty"
      );
    });

    it('should detect unknown variables', async () => {
      const template = {
        id: 'test-template-id',
        name: 'Test Template',
        subject: 'Hello {{firstName}}!',
        html_content: '<p>Hello {{firstName}}!</p>',
        text_content: 'Hello {{firstName}}!',
        variables: ['firstName'],
        version: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'test-user-id',
      };

      const variables = { firstName: 'John', unknownVariable: 'value' };

      const result = templateManager.validateTemplateVariables(
        template,
        variables
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unknown variable 'unknownVariable'");
    });
  });
});
