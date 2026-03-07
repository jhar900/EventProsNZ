'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FAQContent from '@/components/features/faq/FAQContent';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  image_url: string | null;
  video_url: string | null;
}

const HEADINGS: Record<string, { heading: string; subheading: string }> = {
  contractor: {
    heading: 'Contractor Help Centre',
    subheading: 'Answers to common questions for contractors on EventProsNZ.',
  },
  event_manager: {
    heading: 'Event Manager Help Centre',
    subheading:
      'Answers to common questions for event managers on EventProsNZ.',
  },
  admin: {
    heading: 'FAQ Overview',
    subheading: 'View FAQs as they appear to users.',
  },
};

export default function DashboardFAQPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.json())
      .then(data => setFaqs(data.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role as
    | 'contractor'
    | 'event_manager'
    | 'admin'
    | undefined;
  const copy = role ? HEADINGS[role] : undefined;

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <FAQContent
          faqs={faqs}
          userRole={role ?? null}
          heading={copy?.heading ?? 'Frequently Asked Questions'}
          subheading={
            copy?.subheading ??
            'Find answers to common questions about EventProsNZ.'
          }
        />
      )}
    </DashboardLayout>
  );
}
