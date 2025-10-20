import { createClient } from '@/lib/supabase/server';
import { DocumentCategory, Document, DocumentFilters } from '@/types/documents';

export class OrganizationService {
  private supabase = createClient();

  async getCategories(): Promise<DocumentCategory[]> {
    try {
      const { data: categories, error } = await this.supabase
        .from('document_categories')
        .select('*')
        .order('category_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return categories || [];
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  async createCategory(
    name: string,
    description?: string
  ): Promise<DocumentCategory> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if category already exists
      const { data: existingCategory, error: existingError } =
        await this.supabase
          .from('document_categories')
          .select('id')
          .eq('category_name', name)
          .single();

      if (existingCategory && !existingError) {
        throw new Error('Category already exists');
      }

      // Create category
      const { data: category, error: categoryError } = await this.supabase
        .from('document_categories')
        .insert({
          category_name: name,
          category_description: description,
          created_by: user.id,
        })
        .select()
        .single();

      if (categoryError) {
        throw new Error(`Category creation failed: ${categoryError.message}`);
      }

      return category;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  async updateCategory(
    categoryId: string,
    name: string,
    description?: string
  ): Promise<DocumentCategory> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user created the category
      const { data: category, error: categoryError } = await this.supabase
        .from('document_categories')
        .select('created_by')
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        throw new Error(`Category not found: ${categoryError.message}`);
      }

      if (category.created_by !== user.id) {
        throw new Error(
          'Access denied: You can only update categories you created'
        );
      }

      // Update category
      const { data: updatedCategory, error: updateError } = await this.supabase
        .from('document_categories')
        .update({
          category_name: name,
          category_description: description,
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      return updatedCategory;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user created the category
      const { data: category, error: categoryError } = await this.supabase
        .from('document_categories')
        .select('created_by')
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        throw new Error(`Category not found: ${categoryError.message}`);
      }

      if (category.created_by !== user.id) {
        throw new Error(
          'Access denied: You can only delete categories you created'
        );
      }

      // Delete category
      const { error: deleteError } = await this.supabase
        .from('document_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  }

  async categorizeDocument(
    documentId: string,
    category: string
  ): Promise<Document> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      if (document.user_id !== user.id) {
        throw new Error(
          'Access denied: You can only categorize documents you own'
        );
      }

      // Update document category
      const { data: updatedDocument, error: updateError } = await this.supabase
        .from('documents')
        .update({ document_category: category })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      return updatedDocument;
    } catch (error) {
      console.error('Categorize document error:', error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    filters?: DocumentFilters
  ): Promise<Document[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let searchQuery = this.supabase
        .from('documents')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .textSearch('document_name', query);

      // Apply additional filters
      if (filters?.document_category) {
        searchQuery = searchQuery.eq(
          'document_category',
          filters.document_category
        );
      }
      if (filters?.file_type) {
        searchQuery = searchQuery.like('mime_type', `${filters.file_type}%`);
      }
      if (filters?.is_public !== undefined) {
        searchQuery = searchQuery.eq('is_public', filters.is_public);
      }
      if (filters?.date_range) {
        searchQuery = searchQuery
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data: documents, error } = await searchQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return documents || [];
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('document_category', category)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return documents || [];
    } catch (error) {
      console.error('Get documents by category error:', error);
      throw error;
    }
  }

  async getCategoryStats(): Promise<{
    categories: Array<{
      category: string;
      count: number;
      totalSize: number;
    }>;
    totalDocuments: number;
    totalSize: number;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get all documents accessible to user
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('document_category, file_size')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      // Calculate stats by category
      const categoryStats = new Map<
        string,
        { count: number; totalSize: number }
      >();
      let totalDocuments = 0;
      let totalSize = 0;

      documents?.forEach(doc => {
        const category = doc.document_category || 'Uncategorized';
        const current = categoryStats.get(category) || {
          count: 0,
          totalSize: 0,
        };
        categoryStats.set(category, {
          count: current.count + 1,
          totalSize: current.totalSize + doc.file_size,
        });
        totalDocuments++;
        totalSize += doc.file_size;
      });

      const categories = Array.from(categoryStats.entries()).map(
        ([category, stats]) => ({
          category,
          count: stats.count,
          totalSize: stats.totalSize,
        })
      );

      return {
        categories,
        totalDocuments,
        totalSize,
      };
    } catch (error) {
      console.error('Get category stats error:', error);
      throw error;
    }
  }

  async bulkCategorizeDocuments(
    documentIds: string[],
    category: string
  ): Promise<Document[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns all documents
      const { data: documents, error: documentsError } = await this.supabase
        .from('documents')
        .select('id, user_id')
        .in('id', documentIds);

      if (documentsError) {
        throw new Error(`Failed to fetch documents: ${documentsError.message}`);
      }

      const userDocuments =
        documents?.filter(doc => doc.user_id === user.id) || [];
      if (userDocuments.length !== documentIds.length) {
        throw new Error(
          'Access denied: You can only categorize documents you own'
        );
      }

      // Update all documents
      const { data: updatedDocuments, error: updateError } = await this.supabase
        .from('documents')
        .update({ document_category: category })
        .in('id', documentIds)
        .select();

      if (updateError) {
        throw new Error(`Bulk update failed: ${updateError.message}`);
      }

      return updatedDocuments || [];
    } catch (error) {
      console.error('Bulk categorize documents error:', error);
      throw error;
    }
  }

  async getRecentDocuments(limit = 10): Promise<Document[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent documents: ${error.message}`);
      }

      return documents || [];
    } catch (error) {
      console.error('Get recent documents error:', error);
      throw error;
    }
  }

  async getPopularCategories(limit = 5): Promise<
    Array<{
      category: string;
      count: number;
    }>
  > {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get category usage stats
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('document_category')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      // Count documents by category
      const categoryCounts = new Map<string, number>();
      documents?.forEach(doc => {
        const category = doc.document_category || 'Uncategorized';
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });

      // Sort by count and return top categories
      return Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Get popular categories error:', error);
      throw error;
    }
  }
}
