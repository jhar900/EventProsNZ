'use client';

import { createContext, useContext } from 'react';

interface OnboardingPreviewContextValue {
  isPreview: boolean;
}

const OnboardingPreviewContext = createContext<OnboardingPreviewContextValue>({
  isPreview: false,
});

export function OnboardingPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingPreviewContext.Provider value={{ isPreview: true }}>
      {children}
    </OnboardingPreviewContext.Provider>
  );
}

export function useOnboardingPreview(): OnboardingPreviewContextValue {
  return useContext(OnboardingPreviewContext);
}
