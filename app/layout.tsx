import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MicrosoftClarity from '@/components/MicrosoftClarity';
import { AuthProvider } from '@/components/features/auth/AuthProvider';
import { ReactQueryProvider } from '@/lib/react-query';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://event-pros-nz.vercel.app'
  ),
  title: "Event Pros NZ - New Zealand's Event Ecosystem",
  description:
    'Connect event managers with qualified contractors. The complete event planning platform for New Zealand.',
  openGraph: {
    title: 'Event Pros NZ',
    description:
      "New Zealand's Premier Event Ecosystem: Connect with qualified contractors, plan unforgettable events, and grow your business in New Zealand's thriving event industry.",
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ReactQueryProvider>
          <AuthProvider>
            <GoogleAnalytics />
            <MicrosoftClarity />
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
