'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  image_url: string | null;
  video_url: string | null;
}

interface FAQContentProps {
  faqs: FAQ[];
  userRole?: 'contractor' | 'event_manager' | 'admin' | null;
  heading?: string;
  subheading?: string;
}

const CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'event_managers', label: 'Event Managers' },
];

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v');
    } else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function FAQItem({
  faq,
  open,
  onToggle,
}: {
  faq: FAQ;
  open: boolean;
  onToggle: () => void;
}) {
  const embedUrl = faq.video_url ? getYouTubeEmbedUrl(faq.video_url) : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="text-base font-medium text-gray-900 pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 bg-white border-t border-gray-100">
            <div
              className="prose prose-sm max-w-none text-gray-700 pt-4"
              dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
            {faq.image_url && (
              <div className="mt-4">
                <img
                  src={faq.image_url}
                  alt=""
                  className="rounded-lg max-w-full h-auto border border-gray-200"
                />
              </div>
            )}
            {embedUrl && (
              <div className="mt-4 aspect-video w-full max-w-2xl">
                <iframe
                  src={embedUrl}
                  title="FAQ video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQContent({
  faqs,
  userRole,
  heading = 'Frequently Asked Questions',
  subheading = 'Find answers to common questions about EventProsNZ.',
}: FAQContentProps) {
  // Determine category order based on user role
  const orderedCategories = useMemo(() => {
    if (userRole === 'contractor') {
      return [
        { key: 'contractors', label: 'Contractors' },
        { key: 'general', label: 'General' },
        { key: 'event_managers', label: 'Event Managers' },
      ];
    }
    if (userRole === 'event_manager') {
      return [
        { key: 'event_managers', label: 'Event Managers' },
        { key: 'general', label: 'General' },
        { key: 'contractors', label: 'Contractors' },
      ];
    }
    return CATEGORIES;
  }, [userRole]);

  const faqsByCategory = useMemo(() => {
    const map: Record<string, FAQ[]> = {};
    for (const { key } of orderedCategories) {
      map[key] = faqs.filter(f => f.category === key);
    }
    return map;
  }, [faqs, orderedCategories]);

  const [activeTab, setActiveTab] = useState(orderedCategories[0].key);
  const [openId, setOpenId] = useState<string | null>(null);

  const activeFaqs = faqsByCategory[activeTab] || [];

  function handleTabChange(key: string) {
    setActiveTab(key);
    setOpenId(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          <span className="text-gray-900">Frequently Asked </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
            Questions
          </span>
        </h1>
        <p className="mt-3 text-gray-600">{subheading}</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-orange-100">
        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-8">
          {orderedCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleTabChange(cat.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === cat.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cat.label}
              {faqsByCategory[cat.key]?.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({faqsByCategory[cat.key].length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {activeFaqs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No FAQs in this category yet.
            </p>
          ) : (
            activeFaqs.map(faq => (
              <FAQItem
                key={faq.id}
                faq={faq}
                open={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
