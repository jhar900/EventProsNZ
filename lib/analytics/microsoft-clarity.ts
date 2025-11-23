/**
 * Microsoft Clarity Configuration
 * Centralized Clarity setup and tracking functions
 */

declare global {
  interface Window {
    clarity: (...args: any[]) => void;
  }
}

// Microsoft Clarity configuration
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;

// Initialize Microsoft Clarity
export const initClarity = () => {
  if (!CLARITY_PROJECT_ID || typeof window === 'undefined') {
    return;
  }

  // Microsoft Clarity script loader (IIFE pattern from Microsoft Clarity docs)
  (function (
    c: any,
    l: Document,
    a: string,
    r: string,
    i: string,
    t: HTMLScriptElement | null,
    y: HTMLScriptElement | null
  ) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0] as HTMLScriptElement;
    if (y && y.parentNode) {
      y.parentNode.insertBefore(t, y);
    }
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID, null, null);
};

// Track custom events with Clarity
export const trackClarityEvent = (
  eventName: string,
  data?: Record<string, any>
) => {
  if (!CLARITY_PROJECT_ID || typeof window === 'undefined' || !window.clarity) {
    return;
  }

  window.clarity('event', eventName, data);
};

// Identify user (useful for tracking logged-in users)
export const identifyClarityUser = (
  userId: string,
  metadata?: Record<string, any>
) => {
  if (!CLARITY_PROJECT_ID || typeof window === 'undefined' || !window.clarity) {
    return;
  }

  window.clarity('identify', userId, metadata);
};
