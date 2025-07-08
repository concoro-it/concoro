/**
 * Translates Firebase error codes and other error messages into user-friendly Italian messages
 */
export function getItalianErrorMessage(errorCode: string, fallbackMessage?: string): string {
  const errorMessages: Record<string, string> = {
    // Authentication errors
    'auth/user-not-found': 'Nessun account trovato con questa email',
    'auth/wrong-password': 'La password non è corretta',
    'auth/email-already-in-use': 'Questa email è già registrata. Prova ad accedere o usa un\'email diversa',
    'auth/invalid-email': 'L\'indirizzo email non è valido',
    'auth/operation-not-allowed': 'Gli account email/password non sono abilitati. Contatta il supporto',
    'auth/weak-password': 'La password è troppo debole. Scegli una password più forte',
    'auth/user-disabled': 'Questo account è stato disabilitato',
    'auth/email-not-verified': 'Per favore verifica la tua email prima di accedere',
    'auth/invalid-credential': 'Le credenziali fornite non sono valide',
    'auth/account-exists-with-different-credential': 'Esiste già un account con questa email ma con un metodo di accesso diverso',
    'auth/popup-closed-by-user': 'Accesso annullato. Riprova',
    'auth/network-request-failed': 'Errore di connessione. Controlla la tua connessione internet',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'auth/requires-recent-login': 'Per motivi di sicurezza, devi accedere nuovamente',

    // Generic validation errors  
    'validation/email-required': 'L\'email è obbligatoria',
    'validation/password-required': 'La password è obbligatoria',
    'validation/password-mismatch': 'Le password non corrispondono',
    'validation/name-required': 'Il nome è obbligatorio',
    'validation/surname-required': 'Il cognome è obbligatorio',
    'validation/region-required': 'La regione è obbligatoria',
    'validation/city-required': 'La città è obbligatoria',
    'validation/education-required': 'Almeno un\'istruzione è obbligatoria',
    'validation/experience-required': 'Almeno un\'esperienza è obbligatoria',
    'validation/sectors-required': 'Almeno un settore di interesse è obbligatorio',
    'validation/regions-required': 'Almeno una regione preferita è obbligatoria',

    // Generic messages
    'generic/network-error': 'Errore di connessione. Riprova più tardi',
    'generic/server-error': 'Errore del server. Riprova più tardi',
    'generic/unknown-error': 'Si è verificato un errore imprevisto. Riprova',
    'generic/authentication-service-unavailable': 'Servizio di autenticazione non disponibile',
    'generic/verification-email-failed': 'Impossibile inviare l\'email di verifica. Riprova',
    
    // Success messages
    'success/account-created': 'Account creato con successo! Controlla la tua email per verificare l\'account',
    'success/verification-email-sent': 'Email di verifica inviata! Controlla la tua casella di posta',
    'success/password-reset-sent': 'Link per il reset della password inviato alla tua email',
    'success/profile-updated': 'Profilo aggiornato con successo',
    'success/signed-in': 'Accesso effettuato con successo',
    'success/signed-out': 'Disconnessione effettuata con successo',
  };

  // Check for exact match first
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  // If it starts with 'auth/', try to extract just the error code part
  if (errorCode.startsWith('auth/')) {
    const authError = errorMessages[errorCode];
    if (authError) {
      return authError;
    }
  }

  // Check if it's a known error message in English that we can translate
  const englishToItalian: Record<string, string> = {
    'This email is already registered. Please sign in or use a different email.': 'Questa email è già registrata. Prova ad accedere o usa un\'email diversa',
    'No account found with this email. Please sign up first.': 'Nessun account trovato con questa email. Registrati prima di accedere',
    'Incorrect password. Please try again.': 'Password incorretta. Riprova',
    'Please verify your email before signing in.': 'Per favore verifica la tua email prima di accedere',
    'Sign in was cancelled. Please try again.': 'Accesso annullato. Riprova',
    'Authentication service not available': 'Servizio di autenticazione non disponibile',
    'Failed to send verification email. Please try again.': 'Impossibile inviare l\'email di verifica. Riprova',
  };

  if (englishToItalian[errorCode]) {
    return englishToItalian[errorCode];
  }

  // Fallback to provided message or generic error
  return fallbackMessage || errorMessages['generic/unknown-error'];
}

/**
 * Extracts error code from Firebase error object
 */
export function extractErrorCode(error: any): string {
  if (error?.code) {
    return error.code;
  }
  if (error?.message) {
    return error.message;
  }
  return 'generic/unknown-error';
}

/**
 * Helper function to get Italian error message from any error object
 */
export function getItalianError(error: any): string {
  const errorCode = extractErrorCode(error);
  return getItalianErrorMessage(errorCode);
} 