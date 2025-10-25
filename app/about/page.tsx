import { Metadata } from 'next';
import AboutPage from '@/components/features/about/AboutPage';

export const metadata: Metadata = {
  title: 'About Event Pros NZ - Your Trusted Event Planning Partner',
  description:
    "Learn about Event Pros NZ, New Zealand's premier event planning platform. Discover our mission, team, and commitment to connecting event managers with top contractors.",
  keywords:
    'about event pros nz, event planning nz, new zealand events, event management platform',
  openGraph: {
    title: 'About Event Pros NZ - Your Trusted Event Planning Partner',
    description:
      "Learn about Event Pros NZ, New Zealand's premier event planning platform.",
    type: 'website',
  },
};

export default function About() {
  return <AboutPage />;
}
