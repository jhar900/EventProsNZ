import {
  InquiryTemplate,
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  GetInquiryTemplatesRequest,
  TEMPLATE_TYPES,
} from '@/types/inquiries';

export class TemplateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inquiries/templates';
  }

  // Create a new template
  async createTemplate(
    templateData: CreateInquiryTemplateRequest
  ): Promise<InquiryTemplate> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create template');
    }

    const result = await response.json();
    return result.template;
  }

  // Get templates
  async getTemplates(
    filters?: GetInquiryTemplatesRequest
  ): Promise<InquiryTemplate[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch templates');
    }

    const result = await response.json();
    return result.templates;
  }

  // Get a specific template
  async getTemplate(templateId: string): Promise<InquiryTemplate> {
    const response = await fetch(`${this.baseUrl}/${templateId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch template');
    }

    const result = await response.json();
    return result.template;
  }

  // Update a template
  async updateTemplate(
    templateId: string,
    updateData: UpdateInquiryTemplateRequest
  ): Promise<InquiryTemplate> {
    const response = await fetch(`${this.baseUrl}/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update template');
    }

    const result = await response.json();
    return result.template;
  }

  // Delete a template
  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${templateId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete template');
    }
  }

  // Apply a template to inquiry data
  async applyTemplate(templateId: string, inquiryData: any): Promise<any> {
    const template = await this.getTemplate(templateId);

    try {
      const templateData = JSON.parse(template.template_content);
      return {
        ...inquiryData,
        ...templateData,
      };
    } catch (error) {
      throw new Error('Failed to parse template content');
    }
  }

  // Duplicate a template
  async duplicateTemplate(
    templateId: string,
    newName: string
  ): Promise<InquiryTemplate> {
    const originalTemplate = await this.getTemplate(templateId);

    const duplicateData: CreateInquiryTemplateRequest = {
      template_name: newName,
      template_content: originalTemplate.template_content,
      template_type: originalTemplate.template_type,
      is_public: false, // Duplicates are private by default
    };

    return await this.createTemplate(duplicateData);
  }

  // Get template usage statistics
  async getTemplateStats(templateId: string): Promise<{
    usage_count: number;
    last_used: string | null;
    created_at: string;
    updated_at: string;
  }> {
    const response = await fetch(`${this.baseUrl}/${templateId}/stats`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch template stats');
    }

    return await response.json();
  }

  // Get popular templates
  async getPopularTemplates(limit: number = 10): Promise<InquiryTemplate[]> {
    const response = await fetch(`${this.baseUrl}/popular?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch popular templates');
    }

    const result = await response.json();
    return result.templates;
  }

  // Search templates
  async searchTemplates(
    query: string,
    filters?: GetInquiryTemplatesRequest
  ): Promise<InquiryTemplate[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('search', query);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `${this.baseUrl}/search?${searchParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search templates');
    }

    const result = await response.json();
    return result.templates;
  }

  // Validate template content
  async validateTemplate(templateContent: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template_content: templateContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate template');
    }

    return await response.json();
  }

  // Get template categories
  async getTemplateCategories(): Promise<
    {
      category: string;
      count: number;
    }[]
  > {
    const response = await fetch(`${this.baseUrl}/categories`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch template categories'
      );
    }

    return await response.json();
  }

  // Export templates
  async exportTemplates(
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/export?user_id=${userId}&format=${format}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export templates');
    }

    return await response.blob();
  }

  // Import templates
  async importTemplates(
    file: File,
    userId: string
  ): Promise<{
    imported: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to import templates');
    }

    return await response.json();
  }
}

// Export singleton instance
export const templateService = new TemplateService();
