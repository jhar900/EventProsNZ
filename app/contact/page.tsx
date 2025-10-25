import { Metadata } from 'next';
import ContactPage from '@/components/features/contact/ContactPage';

export const metadata: Metadata = {
  title: 'Contact Event Pros NZ - Get in Touch with Our Team',
  description:
    "Contact Event Pros NZ for support, inquiries, or partnership opportunities. We're here to help with your event planning needs.",
  keywords:
    'contact event pros nz, event planning support, new zealand events, customer service',
  openGraph: {
    title: 'Contact Event Pros NZ - Get in Touch with Our Team',
    description:
      'Contact Event Pros NZ for support, inquiries, or partnership opportunities.',
    type: 'website',
  },
};

export default function Contact() {
  return <ContactPage />;
}
