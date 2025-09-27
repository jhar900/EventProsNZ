/**
 * Google Analytics Configuration
 * Centralized analytics setup and tracking functions
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID) {
    return;
  }

  // Load Google Analytics script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA_TRACKING_ID || typeof window === "undefined") return;

  window.gtag("config", GA_TRACKING_ID, {
    page_title: title || document.title,
    page_location: url,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!GA_TRACKING_ID || typeof window === "undefined") return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track ecommerce events
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string,
  items: any[]
) => {
  if (!GA_TRACKING_ID || typeof window === "undefined") return;

  window.gtag("event", "purchase", {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  });
};

// Track conversions
export const trackConversion = (
  conversionId: string,
  value?: number,
  currency?: string
) => {
  if (!GA_TRACKING_ID || typeof window === "undefined") return;

  window.gtag("event", "conversion", {
    send_to: `${GA_TRACKING_ID}/${conversionId}`,
    value: value,
    currency: currency || "NZD",
  });
};
