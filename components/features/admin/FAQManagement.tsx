'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminFetch } from '@/lib/adminFetch';
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Image,
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  contractors: 'Contractors',
  event_managers: 'Event Managers',
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'color',
  'background',
  'align',
  'link',
];

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  video_url: string | null;
}

interface FormState {
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  image_url: string;
  video_url: string;
}

const DEFAULT_FORM: FormState = {
  question: '',
  answer: '',
  category: 'general',
  is_active: true,
  image_url: '',
  video_url: '',
};

// Sortable row component
function SortableFAQRow({
  faq,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  faq: FAQ;
  onEdit: (faq: FAQ) => void;
  onDelete: (faq: FAQ) => void;
  onToggleActive: (faq: FAQ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[faq.category] || faq.category}
          </Badge>
          {!faq.is_active && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
          {faq.image_url && <Image className="h-3.5 w-3.5 text-gray-400" />}
          {faq.video_url && <Video className="h-3.5 w-3.5 text-gray-400" />}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">
          {faq.question}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(faq)}
          title={faq.is_active ? 'Hide FAQ' : 'Show FAQ'}
        >
          {faq.is_active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(faq)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(faq)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reorderDirty, setReorderDirty] = useState(false);

  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [imageUploading, setImageUploading] = useState(false);

  const [deletingFaq, setDeletingFaq] = useState<FAQ | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingFaq(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  }

  function openEdit(faq: FAQ) {
    setEditingFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: faq.is_active,
      image_url: faq.image_url || '',
      video_url: faq.video_url || '',
    });
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer,
        category: form.category,
        is_active: form.is_active,
        image_url: form.image_url.trim() || null,
        video_url: form.video_url.trim() || null,
      };

      if (editingFaq) {
        const res = await adminFetch(`/api/admin/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setFaqs(prev =>
            prev.map(f => (f.id === editingFaq.id ? data.faq : f))
          );
        }
      } else {
        const res = await adminFetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setFaqs(prev => [...prev, data.faq]);
        }
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(faq: FAQ) {
    const res = await adminFetch(`/api/admin/faqs/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !faq.is_active }),
    });
    if (res.ok) {
      setFaqs(prev =>
        prev.map(f => (f.id === faq.id ? { ...f, is_active: !f.is_active } : f))
      );
    }
  }

  async function handleDelete() {
    if (!deletingFaq) return;
    const res = await adminFetch(`/api/admin/faqs/${deletingFaq.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setFaqs(prev => prev.filter(f => f.id !== deletingFaq.id));
    }
    setDeletingFaq(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFaqs(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id);
        const newIndex = prev.findIndex(f => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setReorderDirty(true);
    }
  }

  async function handleSaveOrder() {
    setSaving(true);
    try {
      const items = faqs.map((faq, idx) => ({
        id: faq.id,
        display_order: idx,
      }));
      const res = await adminFetch('/api/admin/faqs/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setReorderDirty(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminFetch('/api/admin/faqs/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, image_url: data.url }));
      }
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            FAQ Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag items to reorder. Changes to order must be saved.
          </p>
        </div>
        <div className="flex gap-2">
          {reorderDirty && (
            <Button
              onClick={handleSaveOrder}
              disabled={saving}
              variant="outline"
            >
              {saving ? 'Saving...' : 'Save Order'}
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">No FAQs yet.</p>
          <Button onClick={openCreate} variant="outline" className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add your first FAQ
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={faqs.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {faqs.map(faq => (
              <SortableFAQRow
                key={faq.id}
                faq={faq}
                onEdit={openEdit}
                onDelete={setDeletingFaq}
                onToggleActive={handleToggleActive}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question *</Label>
              <Input
                id="faq-question"
                value={form.question}
                onChange={e =>
                  setForm(prev => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter the question..."
              />
            </div>

            <div className="space-y-2">
              <Label>Answer *</Label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={form.answer}
                  onChange={val => setForm(prev => ({ ...prev, answer: val }))}
                  modules={QUILL_MODULES}
                  formats={QUILL_FORMATS}
                  style={{ minHeight: '200px' }}
                  placeholder="Write the answer..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={val =>
                    setForm(prev => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="contractors">Contractors</SelectItem>
                    <SelectItem value="event_managers">
                      Event Managers
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={form.is_active ? 'active' : 'hidden'}
                  onValueChange={val =>
                    setForm(prev => ({ ...prev, is_active: val === 'active' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              {form.image_url && (
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={form.image_url}
                    alt="FAQ"
                    className="h-20 w-auto rounded border border-gray-200 object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() =>
                      setForm(prev => ({ ...prev, image_url: '' }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
              {imageUploading && (
                <p className="text-xs text-gray-500">Uploading...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-video">YouTube Video URL</Label>
              <Input
                id="faq-video"
                value={form.video_url}
                onChange={e =>
                  setForm(prev => ({ ...prev, video_url: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.question.trim() || !form.answer.trim()}
            >
              {saving
                ? 'Saving...'
                : editingFaq
                  ? 'Save Changes'
                  : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingFaq}
        onOpenChange={open => !open && setDeletingFaq(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete &ldquo;{deletingFaq?.question}
            &rdquo;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFaq(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
