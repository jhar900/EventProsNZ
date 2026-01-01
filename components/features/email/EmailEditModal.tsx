'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailEditFormData {
  name: string;
  subject: string;
  htmlContent: string;
  delay?: number;
  status?: 'active' | 'paused' | 'draft';
  textContent?: string;
}

interface EmailEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: { id: string; name: string; templateId?: string } | null;
  formData: EmailEditFormData;
  onFormDataChange: (data: EmailEditFormData) => void;
  loading?: boolean;
  onSave: () => void;
  showDelayField?: boolean;
  nameLabel?: string;
  previewLabel?: string;
}

export function EmailEditModal({
  open,
  onOpenChange,
  email,
  formData,
  onFormDataChange,
  loading = false,
  onSave,
  showDelayField = false,
  nameLabel = 'Email Name',
  previewLabel = 'HTML Email Preview:',
}: EmailEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit: {email?.name}</DialogTitle>
          <DialogDescription>
            Update the email template content and settings
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">{nameLabel}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e =>
                  onFormDataChange({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    subject: e.target.value,
                  })
                }
              />
            </div>
            {showDelayField && (
              <div>
                <Label htmlFor="edit-delay">Delay (hours)</Label>
                <Input
                  id="edit-delay"
                  type="number"
                  value={formData.delay || 0}
                  onChange={e =>
                    onFormDataChange({
                      ...formData,
                      delay: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-html">HTML Content</Label>
              <textarea
                id="edit-html"
                value={formData.htmlContent}
                onChange={e =>
                  onFormDataChange({
                    ...formData,
                    htmlContent: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md h-64 font-mono text-sm"
                placeholder="Enter HTML content"
              />
              {formData.htmlContent && (
                <div className="mt-3">
                  <Label className="text-sm font-medium mb-2 block">
                    {previewLabel}
                  </Label>
                  <div className="border border-gray-300 rounded-md bg-white shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="ml-auto text-xs text-gray-500">
                        HTML Email
                      </div>
                    </div>
                    <div
                      className="p-4 min-h-[200px] bg-white"
                      style={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        maxWidth: '600px',
                        margin: '0 auto',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: formData.htmlContent,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!email}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
