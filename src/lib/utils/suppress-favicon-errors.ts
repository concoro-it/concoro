// Utility to suppress known favicon loading errors in development
export function suppressFaviconErrors() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  // Store original console.error
  const originalError = console.error;
  
  // Patterns of errors to suppress
  const suppressPatterns = [
    'The requested resource isn\'t a valid image for https://faviconkit.com/',
    'upstream image response failed for https://besticon-demo.herokuapp.com/',
    'upstream image response failed for https://logo.clearbit.com/',
    'upstream image response failed for https://www.google.com/s2/favicons',
    'received text/html; charset=utf-8', // Common when favicon services return HTML instead of images
    'faviconkit.com', // Any faviconkit errors
    'besticon-demo.herokuapp.com', // Any besticon errors
    'logo.clearbit.com', // Any clearbit errors
  ];

  // Override console.error to filter out favicon errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this error should be suppressed
    const shouldSuppress = suppressPatterns.some(pattern => 
      message.includes(pattern)
    );
    
    // Only log if it's not a favicon error
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

  // Also suppress unhandled promise rejections for images
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    const shouldSuppress = suppressPatterns.some(pattern => 
      message.includes(pattern)
    );
    
    if (shouldSuppress) {
      event.preventDefault();
      return;
    }
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };
} 