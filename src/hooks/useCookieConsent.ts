"use client";

import { useState, useEffect } from 'react';

export type CookieConsentStatus = 'true' | 'false' | null;

export function useCookieConsent() {
  const [consentStatus, setConsentStatus] = useState<CookieConsentStatus>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cookieConsent');
      setConsentStatus(stored as CookieConsentStatus);
      setIsLoading(false);
    }
  }, []);

  const updateConsent = (status: 'true' | 'false') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', status);
      setConsentStatus(status);
    }
  };

  const hasConsented = consentStatus === 'true';
  const hasDeclined = consentStatus === 'false';
  const needsConsent = consentStatus === null;

  return {
    consentStatus,
    hasConsented,
    hasDeclined,
    needsConsent,
    isLoading,
    acceptCookies: () => updateConsent('true'),
    declineCookies: () => updateConsent('false'),
  };
} 