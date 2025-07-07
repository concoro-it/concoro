# Cookie Consent System for Concoro

This implementation provides a GDPR-compliant cookie consent banner for the Concoro web application.

## Components

### 1. `AlertCookieNotice` Component
- **Location**: `src/components/ui/alert-cookie-notice.tsx`
- **Purpose**: Displays a dismissible cookie consent banner
- **Features**:
  - Fixed position at bottom of screen
  - Mobile-responsive design
  - Three action buttons: Accept, Decline, Only Essential
  - Links to privacy policy and terms of service
  - Automatically loads analytics after consent

### 2. `useCookieConsent` Hook
- **Location**: `src/hooks/useCookieConsent.ts`
- **Purpose**: Manages cookie consent state throughout the app
- **Returns**:
  - `consentStatus`: Current consent status ('true', 'false', or null)
  - `hasConsented`: Boolean for accepted cookies
  - `hasDeclined`: Boolean for declined cookies
  - `needsConsent`: Boolean for no consent given yet
  - `isLoading`: Boolean for initial load state
  - `acceptCookies()`: Function to accept cookies
  - `declineCookies()`: Function to decline cookies

### 3. Analytics Utilities
- **Location**: `src/lib/analytics.ts`
- **Purpose**: Conditional loading of analytics scripts
- **Functions**:
  - `hasAnalyticsConsent()`: Check if consent is granted
  - `loadGoogleAnalytics(id)`: Load Google Analytics
  - `loadPlausible(domain)`: Load Plausible Analytics
  - `trackEvent(name, params)`: Track custom events
  - `trackPageView(url, title)`: Track page views

## Setup Instructions

### 1. Integration (Already Done)
The cookie banner is integrated into `ClientLayout.tsx` and will appear on all pages.

### 2. Configure Analytics
To enable analytics tracking, update the `loadAnalytics()` function in `alert-cookie-notice.tsx`:

```typescript
function loadAnalytics() {
  // Replace with your actual measurement IDs
  loadGoogleAnalytics('YOUR_GA_MEASUREMENT_ID');
  loadPlausible('your-domain.com');
}
```

### 3. Environment Variables (Optional)
Add analytics IDs to your environment variables:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=concoro.it
```

Then update the component:

```typescript
loadGoogleAnalytics(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!);
loadPlausible(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN!);
```

## Usage Examples

### Check Consent Status
```typescript
import { useCookieConsent } from '@/hooks/useCookieConsent';

function MyComponent() {
  const { hasConsented, needsConsent } = useCookieConsent();
  
  if (needsConsent) {
    return <div>Please accept cookies to use this feature</div>;
  }
  
  return <div>Feature content</div>;
}
```

### Track Events
```typescript
import { trackEvent } from '@/lib/analytics';

function handleButtonClick() {
  trackEvent('button_click', {
    button_name: 'signup',
    page: 'homepage'
  });
}
```

### Track Page Views
```typescript
import { trackPageView } from '@/lib/analytics';
import { usePathname } from 'next/navigation';

function MyPage() {
  const pathname = usePathname();
  
  useEffect(() => {
    trackPageView(window.location.href, document.title);
  }, [pathname]);
}
```

## GDPR Compliance Features

- ✅ **Clear consent**: Users must actively accept or decline
- ✅ **Granular control**: Accept all, decline all, or essential only
- ✅ **Easy withdrawal**: Users can change preferences anytime
- ✅ **No pre-ticked boxes**: No default consent
- ✅ **Clear information**: Links to privacy policy and terms
- ✅ **Conditional loading**: Analytics only load after consent
- ✅ **Persistent choice**: Decision stored in localStorage

## Customization

### Styling
The banner uses Tailwind CSS and follows Concoro's design system:
- Primary color: `#0A1F44`
- Responsive design with mobile-first approach
- Consistent with existing UI components

### Text Content
Update the text in `alert-cookie-notice.tsx` to match your requirements:
- Title: Currently "Usiamo i cookie 🍪"
- Description: Explanation of cookie usage
- Button labels: "Accetta tutti", "Rifiuta", "Solo necessari"

### Position
Currently positioned at bottom-left on desktop, full-width on mobile. 
Modify the positioning classes in the component as needed.

## Browser Support

- Supports all modern browsers
- Uses localStorage for persistence
- Graceful degradation for older browsers
- TypeScript support with proper type definitions

## Testing

Test the implementation by:
1. Clearing localStorage
2. Refreshing the page
3. Verifying banner appears
4. Testing all button actions
5. Checking analytics loading in Network tab
6. Verifying localStorage values

## Notes

- Banner appears only when `cookieConsent` localStorage key is not set
- Once set, the banner won't appear again unless localStorage is cleared
- Analytics scripts are loaded dynamically only after consent
- The system respects user's choice and doesn't reload denied scripts 