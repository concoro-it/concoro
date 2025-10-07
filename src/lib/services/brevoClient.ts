import type { UserProfile } from '@/types';

interface BrevoSyncResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  details?: string;
}

/**
 * Client-side service for syncing profiles with Brevo
 */
export class BrevoClientService {
  private baseUrl = '/api/brevo';

  /**
   * Sync a user profile to Brevo
   */
  async syncProfile(profile: UserProfile, sendWelcomeEmail = false): Promise<BrevoSyncResponse> {
    try {
      

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile, sendWelcomeEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to sync profile');
      }

      
      return result;
    } catch (error: any) {
      console.error('Failed to sync profile to Brevo:', error);
      return {
        success: false,
        message: 'Failed to sync profile to Brevo',
        error: error.message,
      };
    }
  }

  /**
   * Update a user profile in Brevo
   */
  async updateProfile(profile: UserProfile): Promise<BrevoSyncResponse> {
    try {
      

      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to update profile');
      }

      
      return result;
    } catch (error: any) {
      console.error('Failed to update profile in Brevo:', error);
      return {
        success: false,
        message: 'Failed to update profile in Brevo',
        error: error.message,
      };
    }
  }

  /**
   * Delete a contact from Brevo
   */
  async deleteContact(email: string): Promise<BrevoSyncResponse> {
    try {
      

      const response = await fetch(`${this.baseUrl}?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to delete contact');
      }

      
      return result;
    } catch (error: any) {
      console.error('Failed to delete contact from Brevo:', error);
      return {
        success: false,
        message: 'Failed to delete contact from Brevo',
        error: error.message,
      };
    }
  }

  /**
   * Sync profile with error handling and retry logic
   */
  async syncProfileWithRetry(profile: UserProfile, maxRetries = 3): Promise<BrevoSyncResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.syncProfile(profile);
        
        if (result.success) {
          return result;
        }
        
        lastError = new Error(result.error || 'Unknown error');
        
        if (attempt < maxRetries) {
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      message: `Failed to sync profile after ${maxRetries} attempts`,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Sync profile completion with welcome email
   */
  async syncProfileCompletion(profile: UserProfile, maxRetries = 3): Promise<BrevoSyncResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.syncProfile(profile, true); // Send welcome email
        
        if (result.success) {
          return result;
        }
        
        lastError = new Error(result.error || 'Unknown error');
        
        if (attempt < maxRetries) {
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      message: `Failed to sync profile completion after ${maxRetries} attempts`,
      error: lastError?.message || 'Unknown error',
    };
  }
}

// Export singleton instance
export const brevoClient = new BrevoClientService();
export default brevoClient; 