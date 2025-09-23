'use client';

import React from 'react';
import NavigationHeader from './NavigationHeader';
import Footer from './Footer';
import ErrorBoundary from '@/components/ui/error-boundary';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

function PageLayout({
  children,
  className = '',
  showFooter = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationHeader />
      <main className={`flex-1 ${className}`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export { PageLayout };
export default PageLayout;
