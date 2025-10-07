import "@/types/global";

/**
 * Checks if analytics cookies are consented to
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cookieConsent') === 'true';
}

/**
 * Update consent mode based on user's choice
 */
export function updateConsentMode(granted: boolean) {
  if (typeof window === 'undefined' || !window.gtag) return;

  const consentState = granted ? 'granted' : 'denied';
  
  window.gtag('consent', 'update', {
    'ad_storage': consentState,
    'ad_user_data': consentState,
    'ad_personalization': consentState, 
    'analytics_storage': consentState
  });

  
}

/**
 * Load Google Analytics - now simplified since it's initialized in layout
 */
export async function loadGoogleAnalytics(measurementId: string = 'G-NVD6N18QWW') {
  // Google Analytics is now loaded in layout.tsx
  // This function just updates consent if needed
  if (typeof window !== 'undefined' && window.gtag) {
    const hasConsent = hasAnalyticsConsent();
    updateConsentMode(hasConsent);
    
  }
}

/**
 * Test if Google Analytics and consent mode are working
 */
export function testGoogleAnalytics() {
  if (typeof window === 'undefined') {
    
    return;
  }

  
  
  // Check if gtag is available
  if (window.gtag) {
    
  } else {
    
  }

  // Check if dataLayer is available
  if (window.dataLayer && Array.isArray(window.dataLayer)) {
    
    
  } else {
    
  }

  // Check consent status
  const hasConsent = hasAnalyticsConsent();
  

  // Test sending a custom event (if consent is granted)
  if (hasConsent && window.gtag) {
    window.gtag('event', 'test_event', {
      event_category: 'testing',
      event_label: 'google_analytics_setup',
      value: 1
    });
    
  } else {
    
  }
}

/**
 * Generic function to track events (works with gtag if loaded)
 */
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
    
  }
}

/**
 * Track page views (useful for SPA navigation)
 */
export function trackPageView(url: string, title?: string) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-NVD6N18QWW', {
      page_location: url,
      page_title: title,
    });
    
  }
}

/**
 * Loads Plausible Analytics if consent is given
 */
export async function loadPlausible(domain: string) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined') {
    const existingScript = document.querySelector('script[data-domain]');
    if (!existingScript) {
      try {
        const script = document.createElement("script");
        script.src = "https://plausible.io/js/script.js";
        script.defer = true;
        script.setAttribute("data-domain", domain);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        
      } catch (error) {
        console.error('Failed to load Plausible Analytics:', error);
      }
    }
  }
}

/**
 * Track article view with custom event
 */
export function trackArticleView(articleId: string, slug: string, title: string) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    // Track standard page_view event
    window.gtag('event', 'page_view', {
      page_title: title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });

    // Track custom concoro_article_view event
    window.gtag('event', 'concoro_article_view', {
      article_id: articleId,
      slug: slug,
      article_title: title,
      timestamp: new Date().toISOString()
    });

    
  }
}

/**
 * Track concorso engagement events
 */
export function trackConcorsoEngagement(action: string, concorsoId: string, concorsoTitle?: string) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'concorso_engagement', {
      action: action, // 'view', 'save', 'apply', etc.
      concorso_id: concorsoId,
      concorso_title: concorsoTitle,
      timestamp: new Date().toISOString()
    });

    
  }
}

/**
 * Track search actions
 */
export function trackSearch(searchTerm: string, resultsCount: number, filters?: Record<string, any>) {
  if (!hasAnalyticsConsent()) {
    
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      results_count: resultsCount,
      filters: filters ? JSON.stringify(filters) : undefined,
      timestamp: new Date().toISOString()
    });

    
  }
} 