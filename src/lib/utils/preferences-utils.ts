// Utility functions for user preferences logic

interface UserPreferences {
  RegioniPreferite?: string[];
  SettoriInteresse?: string[];
  TipologiaContratto?: string;
  TitoloStudio?: string;
}

/**
 * Check if any user preference field is filled
 * @param preferences - User preferences object from Firestore
 * @returns boolean - true if any field is filled, false if all are empty
 */
export function hasFilledPreferences(preferences: UserPreferences | null | undefined): boolean {
  if (!preferences) return false;
  
  return Boolean(
    (preferences.RegioniPreferite && preferences.RegioniPreferite.length > 0) ||
    (preferences.SettoriInteresse && preferences.SettoriInteresse.length > 0) ||
    (preferences.TipologiaContratto && preferences.TipologiaContratto.trim() !== "") ||
    (preferences.TitoloStudio && preferences.TitoloStudio.trim() !== "")
  );
}

export type { UserPreferences }; 