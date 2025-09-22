/**
 * Google Analytics Component
 * Loads Google Analytics script and initializes tracking
 */

"use client";

import { useEffect } from "react";
import { initGA, GA_TRACKING_ID } from "@/lib/analytics/google-analytics";

export default function GoogleAnalytics() {
  useEffect(() => {
    if (GA_TRACKING_ID) {
      initGA();
    }
  }, []);

  // Don't render anything
  return null;
}
