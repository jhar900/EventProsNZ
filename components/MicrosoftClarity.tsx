/**
 * Microsoft Clarity Component
 * Loads Microsoft Clarity script and initializes tracking
 */

'use client';

import { useEffect } from 'react';
import {
  initClarity,
  CLARITY_PROJECT_ID,
} from '@/lib/analytics/microsoft-clarity';

export default function MicrosoftClarity() {
  useEffect(() => {
    if (CLARITY_PROJECT_ID) {
      initClarity();
    }
  }, []);

  // Don't render anything
  return null;
}

