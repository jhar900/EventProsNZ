'use client';

import { useEffect, useState } from 'react';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import { HomepageFooter } from '@/components/features/homepage/HomepageFooter';
import FAQContent from '@/components/features/faq/FAQContent';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  image_url: string | null;
  video_url: string | null;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.json())
      .then(data => setFaqs(data.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HomepageLayout>
      <div className="min-h-screen relative overflow-hidden pt-16">
        {/* Hero background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        <div className="relative z-10">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <FAQContent
              faqs={faqs}
              heading="Frequently Asked Questions"
              subheading="Find answers to common questions about EventProsNZ."
            />
          )}
        </div>
      </div>
      <HomepageFooter />
    </HomepageLayout>
  );
}
