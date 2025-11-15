'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  variables?: string[];
  className?: string;
}

export default function EmailEditor({
  value,
  onChange,
  variables = [],
  className = '',
}: EmailEditorProps) {
  const [htmlContent, setHtmlContent] = useState(value);
  const [showPreview, setShowPreview] = useState(true);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setHtmlContent(value);
  }, [value]);

  const handleChange = (content: string) => {
    setHtmlContent(content);
    onChange(content);
  };

  const insertVariable = (variable: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      if (range) {
        quill.insertText(range.index, `{{${variable}}}`, 'user');
        quill.setSelection(range.index + variable.length + 4);
      } else {
        // If no selection, insert at the end
        const length = quill.getLength();
        quill.insertText(length - 1, `{{${variable}}}`, 'user');
        quill.setSelection(length - 1 + variable.length + 4);
      }
    }
  };

  // Custom toolbar with variable insertion
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link'],
        ['clean'],
      ],
      handlers: {
        // Custom handler for variables will be added via button
      },
    },
  };

  const formats = [
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Variable Insertion Buttons */}
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-sm font-medium text-gray-700 mr-2">
            Insert Variable:
          </span>
          {variables.map(variable => (
            <button
              key={variable}
              type="button"
              onClick={() => insertVariable(variable)}
              className="px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors"
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      )}

      {/* Editor and Preview Toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          HTML Body * (Edit with preview)
        </label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Split View: Editor and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <ReactQuill
            theme="snow"
            value={htmlContent}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            style={{ minHeight: '300px' }}
            placeholder="Start typing your email content here..."
            ref={quillRef}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="border border-gray-300 rounded-md bg-white">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                Live Preview
              </h4>
            </div>
            <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
              <div
                className="email-preview"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    htmlContent || '<p>Start typing to see preview...</p>',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Full Width Preview Option */}
      {!showPreview && (
        <div className="border border-gray-300 rounded-md bg-white">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Live Preview</h4>
          </div>
          <div className="p-4 min-h-[200px]">
            <div
              className="email-preview"
              style={{
                fontFamily: 'Arial, sans-serif',
                maxWidth: '600px',
                margin: '0 auto',
              }}
              dangerouslySetInnerHTML={{
                __html: htmlContent || '<p>Start typing to see preview...</p>',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
