import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseScrollRestorationOptions {
  key?: string;
  enabled?: boolean;
}

export function useScrollRestoration(
  options: UseScrollRestorationOptions = {}
) {
  const { key = 'scroll-position', enabled = true } = options;
  const router = useRouter();
  const scrollPositionRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const storageKey = `scroll-${key}`;

    // Save scroll position before navigation
    const handleBeforeUnload = () => {
      if (!isRestoringRef.current) {
        sessionStorage.setItem(storageKey, window.scrollY.toString());
      }
    };

    // Restore scroll position on mount
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (savedPosition) {
        isRestoringRef.current = true;
        const position = parseInt(savedPosition, 10);

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(0, position);
          // Clear the flag after a short delay to allow for smooth scrolling
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        });
      }
    };

    // Save scroll position on scroll
    const handleScroll = () => {
      if (!isRestoringRef.current) {
        scrollPositionRef.current = window.scrollY;
        sessionStorage.setItem(
          storageKey,
          scrollPositionRef.current.toString()
        );
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Restore scroll position on component mount
    restoreScrollPosition();

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, key]);

  // Function to manually save scroll position
  const saveScrollPosition = () => {
    if (enabled) {
      const storageKey = `scroll-${key}`;
      sessionStorage.setItem(storageKey, window.scrollY.toString());
    }
  };

  // Function to manually restore scroll position
  const restoreScrollPosition = () => {
    if (enabled) {
      const storageKey = `scroll-${key}`;
      const savedPosition = sessionStorage.getItem(storageKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        window.scrollTo(0, position);
      }
    }
  };

  // Function to clear saved scroll position
  const clearScrollPosition = () => {
    if (enabled) {
      const storageKey = `scroll-${key}`;
      sessionStorage.removeItem(storageKey);
    }
  };

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}
