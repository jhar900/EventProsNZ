import { createClient } from '@/lib/supabase/server';
import { sanitizeHtml, sanitizeText } from '@/lib/security/sanitization';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface TemplatePreview {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateManager {
  private supabase = createClient();

  /**
   * Create a new email template
   */
  async createTemplate(
    template: Omit<
      EmailTemplate,
      'id' | 'created_at' | 'updated_at' | 'version'
    >
  ): Promise<EmailTemplate> {
    try {
      // Sanitize template content
      const sanitizedTemplate = {
        ...template,
        subject: sanitizeText(template.subject),
        html_content: sanitizeHtml(template.html_content),
        text_content: sanitizeText(template.text_content),
        variables: this.extractVariables(
          template.html_content,
          template.text_content
        ),
      };

      const { data, error } = await this.supabase
        .from('email_templates')
        .insert({
          ...sanitizedTemplate,
          version: 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Update an existing email template
   */
  async updateTemplate(
    id: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    try {
      // Get current template
      const currentTemplate = await this.getTemplate(id);
      if (!currentTemplate) {
        throw new Error('Template not found');
      }

      // Sanitize updates
      const sanitizedUpdates: any = { ...updates };
      if (updates.subject) {
        sanitizedUpdates.subject = sanitizeText(updates.subject);
      }
      if (updates.html_content) {
        sanitizedUpdates.html_content = sanitizeHtml(updates.html_content);
      }
      if (updates.text_content) {
        sanitizedUpdates.text_content = sanitizeText(updates.text_content);
      }

      // Extract variables if content changed
      if (updates.html_content || updates.text_content) {
        sanitizedUpdates.variables = this.extractVariables(
          updates.html_content || currentTemplate.html_content,
          updates.text_content || currentTemplate.text_content
        );
      }

      // Increment version
      sanitizedUpdates.version = currentTemplate.version + 1;
      sanitizedUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('email_templates')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Template not found
        }
        throw new Error(`Failed to fetch template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching email template:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<EmailTemplate[]> {
    try {
      let query = this.supabase.from('email_templates').select('*');

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('updated_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<TemplatePreview> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Sanitize variables
      const sanitizedVariables = this.sanitizeObject(variables);

      // Render subject
      const subject = this.replaceVariables(
        template.subject,
        sanitizedVariables
      );

      // Render HTML content
      const html = this.replaceVariables(
        template.html_content,
        sanitizedVariables
      );

      // Render text content
      const text = this.replaceVariables(
        template.text_content,
        sanitizedVariables
      );

      return {
        subject,
        html,
        text,
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(
    templateId: string,
    sampleData?: Record<string, any>
  ): Promise<TemplatePreview> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Generate sample data if not provided
      const variables =
        sampleData || this.generateSampleData(template.variables);

      // Sanitize variables
      const sanitizedVariables = this.sanitizeObject(variables);

      // Render subject
      const subject = this.replaceVariables(
        template.subject,
        sanitizedVariables
      );

      // Render HTML content
      const html = this.replaceVariables(
        template.html_content,
        sanitizedVariables
      );

      // Render text content
      const text = this.replaceVariables(
        template.text_content,
        sanitizedVariables
      );

      return {
        subject,
        html,
        text,
      };
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  /**
   * Get template variables
   */
  getTemplateVariables(template: EmailTemplate): TemplateVariable[] {
    return template.variables.map(variable => ({
      name: variable,
      description: this.getVariableDescription(variable),
      required: this.isVariableRequired(template, variable),
      defaultValue: this.getVariableDefaultValue(variable),
    }));
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(
    template: EmailTemplate,
    variables: Record<string, any>
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const requiredVariables = template.variables.filter(variable =>
      this.isVariableRequired(template, variable)
    );

    // Check for missing required variables
    for (const variable of requiredVariables) {
      if (
        !variables[variable] ||
        variables[variable].toString().trim() === ''
      ) {
        errors.push(`Required variable '${variable}' is missing or empty`);
      }
    }

    // Check for extra variables
    const templateVariables = new Set(template.variables);
    for (const variable of Object.keys(variables)) {
      if (!templateVariables.has(variable)) {
        errors.push(`Unknown variable '${variable}'`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(htmlContent: string, textContent: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();

    // Extract from HTML content
    let match;
    while ((match = variableRegex.exec(htmlContent)) !== null) {
      variables.add(match[1]);
    }

    // Extract from text content
    variableRegex.lastIndex = 0;
    while ((match = variableRegex.exec(textContent)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Replace variables in content
   */
  private replaceVariables(
    content: string,
    variables: Record<string, any>
  ): string {
    if (!content || !variables) {
      return content;
    }

    return content.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Generate sample data for template preview
   */
  private generateSampleData(variables: string[]): Record<string, any> {
    const sampleData: Record<string, any> = {};

    for (const variable of variables) {
      sampleData[variable] = this.getSampleValue(variable);
    }

    return sampleData;
  }

  /**
   * Get sample value for a variable
   */
  private getSampleValue(variable: string): string {
    const sampleValues: Record<string, string> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Event Company',
      eventName: 'Wedding Reception',
      eventDate: '2024-06-15',
      eventLocation: 'Auckland, New Zealand',
      userName: 'johndoe',
      userEmail: 'john.doe@example.com',
      trialDays: '14',
      subscriptionType: 'Premium',
      amount: '$29.99',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    return sampleValues[variable] || `Sample ${variable}`;
  }

  /**
   * Get variable description
   */
  private getVariableDescription(variable: string): string {
    const descriptions: Record<string, string> = {
      firstName: "User's first name",
      lastName: "User's last name",
      email: "User's email address",
      company: 'Company name',
      eventName: 'Event name',
      eventDate: 'Event date',
      eventLocation: 'Event location',
      userName: 'Username',
      userEmail: 'User email',
      trialDays: 'Number of trial days',
      subscriptionType: 'Subscription type',
      amount: 'Amount or price',
      date: 'Current date',
      time: 'Current time',
    };

    return descriptions[variable] || `Variable: ${variable}`;
  }

  /**
   * Check if variable is required
   */
  private isVariableRequired(
    template: EmailTemplate,
    variable: string
  ): boolean {
    // Check if variable appears in required contexts
    const requiredPatterns = [
      new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
      new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
    ];

    return requiredPatterns.some(
      pattern =>
        pattern.test(template.html_content) ||
        pattern.test(template.text_content)
    );
  }

  /**
   * Get variable default value
   */
  private getVariableDefaultValue(variable: string): string | undefined {
    const defaults: Record<string, string> = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      company: 'EventProsNZ',
    };

    return defaults[variable];
  }

  /**
   * Sanitize object properties recursively
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Don't sanitize variable values as they are already safe
        sanitized[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
