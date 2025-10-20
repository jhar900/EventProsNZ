'use client';

import React, { useState, useEffect } from 'react';
import { Document, DocumentCategory } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Tag,
  Search,
  Filter,
} from 'lucide-react';

interface FileOrganizationProps {
  documents: Document[];
  categories: DocumentCategory[];
  onCategoryCreate: (name: string, description?: string) => Promise<void>;
  onCategoryUpdate: (
    categoryId: string,
    name: string,
    description?: string
  ) => Promise<void>;
  onCategoryDelete: (categoryId: string) => Promise<void>;
  onDocumentCategorize: (documentId: string, category: string) => Promise<void>;
  onDocumentSearch: (query: string, category?: string) => Promise<void>;
}

export function FileOrganization({
  documents,
  categories,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onDocumentCategorize,
  onDocumentSearch,
}: FileOrganizationProps) {
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] =
    useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] =
    useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory | null>(null);
  const [categoryData, setCategoryData] = useState({
    name: '',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('all');
  const [filteredDocuments, setFilteredDocuments] =
    useState<Document[]>(documents);

  useEffect(() => {
    setFilteredDocuments(documents);
  }, [documents]);

  const handleSearch = async () => {
    try {
      await onDocumentSearch(
        searchQuery,
        selectedCategoryFilter === 'all' ? undefined : selectedCategoryFilter
      );
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    if (categoryId === 'all') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(
        documents.filter(doc => doc.document_category === categoryId)
      );
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryData.name) return;

    try {
      await onCategoryCreate(categoryData.name, categoryData.description);
      setIsCreateCategoryDialogOpen(false);
      setCategoryData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleEditCategory = (category: DocumentCategory) => {
    setSelectedCategory(category);
    setCategoryData({
      name: category.category_name,
      description: category.category_description || '',
    });
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !categoryData.name) return;

    try {
      await onCategoryUpdate(
        selectedCategory.id,
        categoryData.name,
        categoryData.description
      );
      setIsEditCategoryDialogOpen(false);
      setSelectedCategory(null);
      setCategoryData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await onCategoryDelete(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleDocumentCategorize = async (
    documentId: string,
    category: string
  ) => {
    try {
      await onDocumentCategorize(documentId, category);
    } catch (error) {
      console.error('Failed to categorize document:', error);
    }
  };

  const getCategoryDocumentCount = (categoryName: string) => {
    return documents.filter(doc => doc.document_category === categoryName)
      .length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('powerpoint')) return '📈';
    if (mimeType.includes('text/')) return '📄';
    return '📁';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Folder className="h-6 w-6" />
            File Organization
          </h2>
          <p className="text-gray-600">
            Organize and categorize your documents
          </p>
        </div>
        <Button onClick={() => setIsCreateCategoryDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={selectedCategoryFilter}
          onValueChange={handleCategoryFilter}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.category_name}>
                {category.category_name} (
                {getCategoryDocumentCount(category.category_name)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>
          <Filter className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  <CardTitle className="text-lg">
                    {category.category_name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {category.category_description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {getCategoryDocumentCount(category.category_name)} documents
                </span>
                <Badge variant="secondary">{category.category_name}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Documents ({filteredDocuments.length})
        </h3>
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents found
              </h3>
              <p className="text-gray-500 text-center">
                {selectedCategoryFilter === 'all'
                  ? 'Upload documents to get started'
                  : 'No documents in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map(document => (
              <Card
                key={document.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getFileIcon(document.mime_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {document.document_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDate(document.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {document.document_category || 'Uncategorized'}
                      </span>
                      <Select
                        value={document.document_category || 'uncategorized'}
                        onValueChange={value =>
                          handleDocumentCategorize(document.id, value)
                        }
                      >
                        <SelectTrigger className="h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">
                            Uncategorized
                          </SelectItem>
                          {categories.map(category => (
                            <SelectItem
                              key={category.id}
                              value={category.category_name}
                            >
                              {category.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog
        open={isCreateCategoryDialogOpen}
        onOpenChange={setIsCreateCategoryDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Category
            </DialogTitle>
            <DialogDescription>
              Create a new category to organize your documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryData.name}
                onChange={e =>
                  setCategoryData({ ...categoryData, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="category-description">
                Description (Optional)
              </Label>
              <Textarea
                id="category-description"
                value={categoryData.description}
                onChange={e =>
                  setCategoryData({
                    ...categoryData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!categoryData.name}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={isEditCategoryDialogOpen}
        onOpenChange={setIsEditCategoryDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Category
            </DialogTitle>
            <DialogDescription>
              Update the category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={categoryData.name}
                onChange={e =>
                  setCategoryData({ ...categoryData, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-category-description"
                value={categoryData.description}
                onChange={e =>
                  setCategoryData({
                    ...categoryData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={!categoryData.name}
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
