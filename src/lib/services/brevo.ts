import type { UserProfile, Experience, Education, Skill, Language } from '@/types';
import type { NotificationWithConcorso } from '@/types';

interface BrevoContact {
  email: string;
  attributes: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    REGION?: string;
    CITY?: string;
    LOCATION?: string;
    IS_STUDENT?: boolean;
    HEADLINE?: string;
    CURRENT_POSITION?: string;
    CURRENT_COMPANY?: string;
    ABOUT?: string;
    PHONE?: string;
    WEBSITE?: string;
    YEARS_OF_EXPERIENCE?: number;
    SKILLS?: string;
    LANGUAGES?: string;
    EDUCATION_COUNT?: number;
    EXPERIENCE_COUNT?: number;
    CERTIFICATIONS_COUNT?: number;
    LATEST_EDUCATION?: string;
    LATEST_POSITION?: string;
    CREATED_AT?: string;
    UPDATED_AT?: string;
    PROFILE_COMPLETE?: boolean;
    PREFERRED_REGIONS?: string;
    SECTOR_INTERESTS?: string;
  };
  listIds?: number[];
}

interface BrevoApiResponse {
  id?: number;
  message?: string;
  code?: string;
}

interface TransactionalEmailData {
  to: Array<{ email: string; name?: string }>;
  templateId?: number;
  sender?: { email: string; name?: string };
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  params?: Record<string, any>;
  tags?: string[];
}

interface NotificationEmailContext {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  concorso: {
    title: string;
    ente: string;
    daysLeft: number;
    deadline: string;
    link: string;
  };
  notificationCount?: number;
}

class BrevoService {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }
  }

  /**
   * Transform UserProfile to Brevo contact format
   */
  private transformUserProfileToBrevoContact(profile: UserProfile): BrevoContact {
    try {
      

      // Extract skills as comma-separated string
      const skillsString = profile.skills
        ?.map(skill => typeof skill === 'string' ? skill : skill.name)
        .join(', ') || '';

      // Extract languages as comma-separated string
      const languagesString = profile.languages
        ?.map(lang => `${lang.language} (${lang.proficiency})`)
        .join(', ') || '';

      // Get latest education
      const latestEducation = profile.education?.length > 0
        ? `${profile.education[0].degree} in ${profile.education[0].fieldOfStudy} at ${profile.education[0].schoolName}`
        : '';

      // Get latest position
      const latestPosition = profile.experience?.length > 0
        ? `${profile.experience[0].positionTitle} at ${profile.experience[0].companyName}`
        : profile.currentPosition || '';

      // Calculate years of experience
      
      const yearsOfExperience = this.calculateYearsOfExperience(profile.experience);
      

    return {
      email: profile.email,
      attributes: {
        FIRSTNAME: profile.firstName,
        LASTNAME: profile.lastName,
        REGION: profile.region,
        CITY: profile.city,
        LOCATION: profile.location,
        IS_STUDENT: profile.isStudent,
        HEADLINE: profile.headline,
        CURRENT_POSITION: profile.currentPosition,
        CURRENT_COMPANY: profile.currentCompany,
        ABOUT: profile.about,
        PHONE: profile.phone || profile.contactInfo?.phone,
        WEBSITE: profile.website || profile.contactInfo?.website,
        YEARS_OF_EXPERIENCE: yearsOfExperience,
        SKILLS: skillsString,
        LANGUAGES: languagesString,
        EDUCATION_COUNT: profile.education?.length || 0,
        EXPERIENCE_COUNT: profile.experience?.length || 0,
        CERTIFICATIONS_COUNT: profile.certifications?.length || 0,
        LATEST_EDUCATION: latestEducation,
        LATEST_POSITION: latestPosition,
        CREATED_AT: this.parseDate(profile.createdAt)?.toISOString() || new Date().toISOString(),
        UPDATED_AT: this.parseDate(profile.updatedAt)?.toISOString() || new Date().toISOString(),
        PROFILE_COMPLETE: this.isProfileComplete(profile),
        // Additional fields that might be in the Firebase document
        PREFERRED_REGIONS: (profile as any).RegioniPreferite?.join(', ') || '',
        SECTOR_INTERESTS: (profile as any).SettoriInteresse?.join(', ') || '',
      }
    };
    } catch (error) {
      console.error('Error transforming profile for Brevo:', error);
      console.error('Profile data:', JSON.stringify(profile, null, 2));
      throw error;
    }
  }

  /**
   * Calculate years of experience from experience array
   */
  private calculateYearsOfExperience(experience: Experience[] = []): number {
    if (!experience.length) return 0;

    let totalMonths = 0;
    for (const exp of experience) {
      // Handle different date formats (Timestamp, Date, or string)
      const startDate = this.parseDate(exp.startDate);
      const endDate = exp.endDate ? this.parseDate(exp.endDate) : new Date();
      
      if (!startDate || !endDate) continue; // Skip if we can't parse the start or end date
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 
        + (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months); // Ensure no negative months
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

     /**
    * Parse various date formats into a Date object
    */
   private parseDate(dateInput: any): Date | null {
     if (!dateInput) return null;
     
     
     
     // If it's already a Date object
     if (dateInput instanceof Date) {
       return dateInput;
     }
     
     // If it's a Firestore Timestamp with toDate method
     if (dateInput && typeof dateInput.toDate === 'function') {
       return dateInput.toDate();
     }
     
     // If it's a string or number, try to parse it
     if (typeof dateInput === 'string' || typeof dateInput === 'number') {
       const parsed = new Date(dateInput);
       return isNaN(parsed.getTime()) ? null : parsed;
     }
     
     // If it has seconds property (Firestore Timestamp-like object)
     if (dateInput && typeof dateInput.seconds === 'number') {
       return new Date(dateInput.seconds * 1000);
     }
     
     console.warn('Unable to parse date:', dateInput);
     return null;
   }

  /**
   * Check if profile is complete enough for job matching
   */
  private isProfileComplete(profile: UserProfile): boolean {
    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.email &&
      profile.region &&
      (profile.experience?.length > 0 || profile.education?.length > 0)
    );
  }

  /**
   * Make API request to Brevo
   */
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Brevo API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Brevo API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Brevo API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Create or update a contact in Brevo
   */
  async createOrUpdateContact(profile: UserProfile): Promise<BrevoApiResponse> {
    try {
      const contact = this.transformUserProfileToBrevoContact(profile);
      
      
      
      const response = await this.makeRequest('/contacts', 'POST', contact);
      
      
      return response;
    } catch (error: any) {
      // If contact already exists, try to update it
      if (error.message.includes('409') || error.message.includes('already exists')) {
        
        return this.updateContact(profile);
      }
      
      console.error('Failed to create/update Brevo contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact in Brevo
   */
  async updateContact(profile: UserProfile): Promise<BrevoApiResponse> {
    try {
      const contact = this.transformUserProfileToBrevoContact(profile);
      const { email, ...updateData } = contact;
      
      
      
      const response = await this.makeRequest(`/contacts/${encodeURIComponent(email)}`, 'PUT', updateData);
      
      
      return response;
    } catch (error) {
      console.error('Failed to update Brevo contact:', error);
      throw error;
    }
  }

  /**
   * Get contact from Brevo by email
   */
  async getContact(email: string): Promise<any> {
    try {
      return await this.makeRequest(`/contacts/${encodeURIComponent(email)}`, 'GET');
    } catch (error) {
      console.error('Failed to get Brevo contact:', error);
      throw error;
    }
  }

  /**
   * Delete contact from Brevo by email
   */
  async deleteContact(email: string): Promise<BrevoApiResponse> {
    try {
      return await this.makeRequest(`/contacts/${encodeURIComponent(email)}`, 'DELETE');
    } catch (error) {
      console.error('Failed to delete Brevo contact:', error);
      throw error;
    }
  }

  /**
   * Add contact to a specific list
   */
  async addContactToList(email: string, listId: number): Promise<BrevoApiResponse> {
    try {
      const data = {
        emails: [email]
      };
      
      return await this.makeRequest(`/contacts/lists/${listId}/contacts/add`, 'POST', data);
    } catch (error) {
      console.error('Failed to add contact to list:', error);
      throw error;
    }
  }

  /**
   * Sync profile completion status - useful for segmentation
   */
  async syncProfileCompletion(profile: UserProfile): Promise<BrevoApiResponse> {
    try {
      const isComplete = this.isProfileComplete(profile);
      
      const updateData = {
        attributes: {
          PROFILE_COMPLETE: isComplete,
          UPDATED_AT: new Date().toISOString()
        }
      };

      return await this.makeRequest(`/contacts/${encodeURIComponent(profile.email)}`, 'PUT', updateData);
    } catch (error) {
      console.error('Failed to sync profile completion:', error);
      throw error;
    }
  }

  /**
   * Send transactional email via Brevo
   */
  async sendTransactionalEmail(emailData: TransactionalEmailData): Promise<BrevoApiResponse> {
    try {
      
      
      const response = await this.makeRequest('/smtp/email', 'POST', emailData);
      
      
      return response;
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }

  /**
   * Send notification email for concorso deadline approaching
   */
  async sendNotificationEmail(
    userEmail: string, 
    userName: string, 
    notifications: NotificationWithConcorso[]
  ): Promise<BrevoApiResponse> {
    try {
      // Group notifications by urgency
      const urgentNotifications = notifications.filter(n => n.daysLeft === 0);
      const soonNotifications = notifications.filter(n => n.daysLeft === 1);
      const upcomingNotifications = notifications.filter(n => n.daysLeft > 1);

      // Determine email type and content based on most urgent notification
      let subject: string;
      let htmlContent: string;
      let priority = 'normal';

      if (urgentNotifications.length > 0) {
        subject = urgentNotifications.length === 1 
          ? `Hai ancora poche ore per candidarti a ${urgentNotifications[0].concorsoTitoloBreve}`
          : `🚨 ${urgentNotifications.length} concorso scadono OGGI!`;
        priority = 'high';
      } else if (soonNotifications.length > 0) {
        subject = soonNotifications.length === 1
          ? `Domani scade ${soonNotifications[0].concorsoTitoloBreve} — Non dimenticarlo!`
          : `⏰ ${soonNotifications.length} concorso scadono domani`;
        priority = 'high';
      } else {
        const firstNotification = upcomingNotifications[0];
        subject = upcomingNotifications.length === 1
          ? `Hai tempo fino a (${firstNotification.daysLeft} giorni per ${firstNotification.concorsoTitoloBreve})`
          : `${upcomingNotifications.length} concorso in scadenza`;
      }

      // Generate HTML content
      htmlContent = this.generateNotificationEmailHTML(userName, notifications);

      const emailData: TransactionalEmailData = {
        to: [{ email: userEmail, name: userName }],
        sender: { 
          email: 'notifiche@concoro.it', 
          name: 'Concoro Smart Reminder' 
        },
        subject: subject,
        htmlContent: htmlContent,
        textContent: this.generateNotificationEmailText(userName, notifications),
        params: {
          USER_NAME: userName,
          NOTIFICATION_COUNT: notifications.length,
          URGENT_COUNT: urgentNotifications.length,
          SOON_COUNT: soonNotifications.length
        },
        tags: ['notification', 'concorso', priority]
      };

      return await this.sendTransactionalEmail(emailData);
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for notification email
   */
  private generateNotificationEmailHTML(userName: string, notifications: NotificationWithConcorso[]): string {
    const formatDate = (timestamp: any) => {
      try {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (error) {
        return 'Data non disponibile';
      }
    };

    // Get deadline status with same logic as app
    const getDeadlineStatus = (daysLeft: number) => {
      if (daysLeft === 0) {
        return { 
          text: 'Scade oggi', 
          color: '#dc2626',
          isUrgent: true
        };
      } else if (daysLeft === 1) {
        return { 
          text: 'Scade domani', 
          color: '#d97706',
          isUrgent: true
        };
      } else if (daysLeft >= 2 && daysLeft <= 7) {
        return { 
          text: `Scade tra ${daysLeft} giorni`, 
          color: '#f59e0b',
          isUrgent: true
        };
      } else {
        return { 
          text: `Scade tra ${daysLeft} giorni`, 
          color: '#6b7280',
          isUrgent: false
        };
      }
    };

    const generateNotificationCard = (notification: NotificationWithConcorso) => {
      const status = getDeadlineStatus(notification.daysLeft);
      
      return `
        <div style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        ">
          <!-- Entity Name -->
          <div style="margin-bottom: 8px;">
            <p style="
              margin: 0;
              color: #6b7280;
              font-size: 14px;
              font-weight: 400;
              line-height: 1.4;
            ">${notification.concorsoEnte || 'Ente'}</p>
          </div>

          <!-- Title -->
          <h3 style="
            margin: 0 0 16px 0;
            color: #111827;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
            word-wrap: break-word;
          ">${notification.concorsoTitoloBreve}</h3>

          <!-- Metadata Row -->
          <div style="
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
          ">
            <!-- Location -->
            <div style="
              display: flex;
              margin-right: 8px;
              align-items: center;
              gap: 6px;
              vertical-align: middle;
              margin-right: 8px;
            ">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/concoro-fc095.firebasestorage.app/o/images%2FEmail%2Fmap-pin.png?alt=media&token=42885f51-8985-4d1a-9e61-b9357c1d82b7" 
                alt="location" 
                style="max-width: 22px; max-height: 22px; vertical-align: middle;"/>
              <span style="vertical-align: middle;">${notification.AreaGeografica || 'N/A'}</span>
            </div>

            <!-- Deadline Status -->
            <div style="
              display: flex;
              margin-right: 8px;
              align-items: center;
              gap: 6px;
              color: ${status.color};
              font-weight: ${status.isUrgent ? '500' : '400'};
              vertical-align: middle;
              margin-right: 8px;
            ">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/concoro-fc095.firebasestorage.app/o/images%2FEmail%2Fcalendar-days.png?alt=media&token=9ecfcd99-d08d-40c4-bca3-c7eecafce908" 
                alt="calendar" 
                style="max-width: 22px; max-height: 22px; vertical-align: middle;"/>
              <span style="vertical-align: middle;">${status.text}</span>
            </div>

            <!-- Positions -->
            <div style="
              display: flex;
              margin-right: 8px;
              align-items: center;
              gap: 6px;
              vertical-align: middle;
              margin-right: 8px;
            ">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/concoro-fc095.firebasestorage.app/o/images%2FEmail%2Fusers.png?alt=media&token=0c080a15-6a8b-40eb-88fa-9277acd685ea" 
                alt="users" 
                style="max-width: 22px; max-height: 22px; vertical-align: middle;"/>
              <span style="vertical-align: middle;">${notification.numero_di_posti || 'N/A'} posti</span>
            </div>
          </div>
        </div>
      `;
    };

    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>I tuoi concorsi in scadenza - Concoro</title>
    <style>
      @media only screen and (max-width: 600px) {
        .container { 
          width: 100% !important; 
          margin: 10px !important;
          border-radius: 8px !important;
        }
        .content { padding: 24px 20px !important; }
        .card { margin: 12px 0 !important; }
        .title { font-size: 18px !important; margin-top: 16px !important; }
        .subtitle { font-size: 15px !important; }
        .button { 
          padding: 8px 24px !important; 
          font-size: 15px !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .metadata {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
        }
      }
    </style>
</head>
<body style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  padding: 20px;
  background-color: #f9fafb;
">
  <div class="container" style="
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  ">
    
    <!-- Header with Logo -->
    <div style="
      padding: 40px 24px 32px 24px;
      text-align: center;
    ">
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/concoro-fc095.firebasestorage.app/o/images%2Fconcoro-logo-light.png?alt=media&token=adc12f0e-bc96-46f2-a19b-3c475a72650d" 
        alt="Concoro" 
        style="max-width: 140px; height: auto;"
      />
    </div>

    <!-- Content -->
    <div class="content" style="padding: 0 24px 32px 24px;">
      
      <!-- Greeting -->
      <div style="margin-bottom: 24px;">
        <h1 class="title" style="
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.3;
        ">Ciao ${userName}!</h1>
        <p class="subtitle" style="
          margin: 0;
          color: #6b7280;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
        ">
          Hai ${notifications.length} ${notifications.length === 1 ? 'concorso' : 'concorsi'} in scadenza che richiedono la tua attenzione.
        </p>
      </div>

      <!-- Notification Cards -->
      <div style="margin-bottom: 24px;">
        ${notifications.slice(0, 3).map(n => generateNotificationCard(n)).join('')}
      </div>

      <!-- Access Message -->
      <div style="
        text-align: center;
        margin-bottom: 20px;
      ">
        <p style="
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        ">Accedi ora per non perdere questa opportunità</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="https://concoro.it/dashboard" 
           class="button"
           style="
             display: inline-block;
             background-color: #051d32;
             color: white;
             padding: 8px 24px;
             text-decoration: none;
             border-radius: 8px;
             font-weight: 600;
             font-size: 16px;
             line-height: 1.5;
             transition: background-color 0.2s ease;
           "
        >
          Vai al tuo dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    ">
      <p style="margin: 0 0 12px 0;">
        Ricevi questa email perché hai salvato dei concorsi su Concoro.
      </p>
      <p style="margin: 0;">
        <a href="https://concoro.it/settings" style="color: #374151; text-decoration: none; font-weight: 500;">Gestisci le tue preferenze</a>
        <span style="color: #d1d5db; margin: 0 8px;">|</span>
        <a href="https://concoro.it" style="color: #374151; text-decoration: none; font-weight: 500;">Vai a Concoro</a>
      </p>
      <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 11px;">
        © 2025 Concoro. Tutti i diritti riservati.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text content for notification email
   */
  private generateNotificationEmailText(userName: string, notifications: NotificationWithConcorso[]): string {
    const formatDate = (timestamp: any) => {
      try {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('it-IT');
      } catch (error) {
        return 'Data non disponibile';
      }
    };

    let content = `Ciao ${userName}!\n\n`;
    content += `Hai ${notifications.length} ${notifications.length === 1 ? 'concorso' : 'concorsi'} in scadenza che richiede la tua attenzione.\n\n`;

    const urgentNotifications = notifications.filter(n => n.daysLeft === 0);
    const soonNotifications = notifications.filter(n => n.daysLeft === 1);
    const upcomingNotifications = notifications.filter(n => n.daysLeft > 1);

    if (urgentNotifications.length > 0) {
      content += `🚨 SCADONO OGGI:\n`;
      urgentNotifications.forEach(n => {
        content += `- ${n.concorsoTitoloBreve} (${n.concorsoEnte})\n`;
        content += `  Scadenza: ${formatDate(n.concorsoDataChiusura)}\n`;
        content += `  Link: https://concoro.it/bandi/${n.concorso_id}\n\n`;
      });
    }

    if (soonNotifications.length > 0) {
      content += `⏰ SCADONO DOMANI:\n`;
      soonNotifications.forEach(n => {
        content += `- ${n.concorsoTitoloBreve} (${n.concorsoEnte})\n`;
        content += `  Scadenza: ${formatDate(n.concorsoDataChiusura)}\n`;
        content += `  Link: https://concoro.it/bandi/${n.concorso_id}\n\n`;
      });
    }

    if (upcomingNotifications.length > 0) {
      content += `📅 PROSSIME SCADENZE:\n`;
      upcomingNotifications.forEach(n => {
        content += `- ${n.concorsoTitoloBreve} (${n.concorsoEnte})\n`;
        content += `  Scade tra ${n.daysLeft} ${n.daysLeft === 1 ? 'giorno' : 'giorni'}\n`;
        content += `  Scadenza: ${formatDate(n.concorsoDataChiusura)}\n`;
        content += `  Link: https://concoro.it/bandi/${n.concorso_id}\n\n`;
      });
    }

    content += `Non perdere queste opportunità!\n`;
    content += `Visualizza tutte le notifiche: https://concoro.it/notifiche\n\n`;
    content += `---\n`;
    content += `Ricevi questa email perché hai salvato dei concorsi su Concoro.\n`;
    content += `Gestisci le tue preferenze: https://concoro.it/settings\n`;
    content += `© 2024 Concoro. Tutti i diritti riservati.`;

    return content;
  }

  /**
   * Send welcome email when user completes profile
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<BrevoApiResponse> {
    try {
      const emailData: TransactionalEmailData = {
        to: [{ email: userEmail, name: userName }],
        sender: { 
          email: 'welcome@concoro.it', 
          name: 'Team Concoro' 
        },
        subject: `Benvenuto su Concoro, ${userName}! 🎉`,
        htmlContent: this.generateWelcomeEmailHTML(userName),
        textContent: this.generateWelcomeEmailText(userName),
        params: {
          USER_NAME: userName
        },
        tags: ['welcome', 'onboarding']
      };

      return await this.sendTransactionalEmail(emailData);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHTML(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto su Concoro!</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { 
        margin: 10px !important; 
        border-radius: 8px !important; 
      }
      .content { 
        padding: 0 16px 24px 16px !important; 
      }
      .title { 
        font-size: 18px !important; 
      }
      .button { 
        padding: 12px 20px !important; 
        font-size: 15px !important; 
      }
      .footer { 
        padding: 16px !important; 
      }
    }
  </style>
</head>
<body style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  padding: 20px;
  background-color: #f9fafb;
">
  <div class="container" style="
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  ">

    <!-- Header with Logo -->
    <div style="padding: 40px 24px 32px 24px; text-align: center;">
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/concoro-fc095.firebasestorage.app/o/images%2Fconcoro-logo-light.png?alt=media&token=adc12f0e-bc96-46f2-a19b-3c475a72650d" 
        alt="Concoro" 
        style="max-width: 140px; height: auto;"
      />
    </div>

    <!-- Content -->
    <div class="content" style="padding: 0 24px 32px 24px;">
      <div style="margin-bottom: 24px;">
        <h1 class="title" style="
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.3;
        ">Benvenuto su Concoro, ${userName}! 🎉</h1>
        <p class="subtitle" style="
          margin: 0;
          color: #6b7280;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
        ">
          Grazie per aver completato il tuo profilo. Sei pronto per iniziare la tua avventura nella Pubblica Amministrazione.
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <ul style="color: #374151; font-size: 15px; padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 8px;">🔍 Esplora concorsi pubblici personalizzati</li>
          <li style="margin-bottom: 8px;">⏰ Ricevi notifiche sulle scadenze</li>
          <li style="margin-bottom: 0;">🤖 Usa Genio AI per trovare i concorsi migliori per te</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="https://concoro.it/dashboard" 
          class="button"
          style="
            display: inline-block;
            background-color: #051d32;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(5, 29, 50, 0.2);
            transition: background-color 0.2s ease;
          "
        >
          Vai al tuo dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer" style="
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    ">
      <p style="margin: 0 0 12px 0;">
        Ricevi questa email perché ti sei registrato a Concoro.
      </p>
      <p style="margin: 0 0 12px 0;">
        <a href="https://concoro.it/settings" style="color: #374151; text-decoration: none; font-weight: 500;">Gestisci le tue preferenze</a>
        <span style="color: #d1d5db; margin: 0 8px;">|</span>
        <a href="https://concoro.it" style="color: #374151; text-decoration: none; font-weight: 500;">Vai a Concoro</a>
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
        © 2025 Concoro. Tutti i diritti riservati.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate welcome email text
   */
  private generateWelcomeEmailText(userName: string): string {
    return `
Ciao ${userName}!

Benvenuto su Concoro! 🎉

Grazie per aver completato il tuo profilo. Ora puoi iniziare a esplorare i concorsi pubblici più adatti a te!

Cosa puoi fare ora:
- Esplora i concorsi pubblici più recenti
- Salva i concorsi che ti interessano
- Ricevi notifiche sulle scadenze
- Usa Genio AI per trovare concorsi personalizzati

Inizia subito:
- Esplora i Concorsi: https://concoro.it/bandi
- Prova Genio AI: https://concoro.it/chat

© 2024 Concoro. Tutti i diritti riservati.
    `;
  }
}

// Lazy singleton instance - only create when needed
let brevoServiceInstance: BrevoService | null = null;

export const getBrevoService = (): BrevoService => {
  if (!brevoServiceInstance) {
    brevoServiceInstance = new BrevoService();
  }
  return brevoServiceInstance;
};

// Keep backward compatibility
export const brevoService = {
  get createOrUpdateContact() { return getBrevoService().createOrUpdateContact.bind(getBrevoService()); },
  get updateContact() { return getBrevoService().updateContact.bind(getBrevoService()); },
  get getContact() { return getBrevoService().getContact.bind(getBrevoService()); },
  get deleteContact() { return getBrevoService().deleteContact.bind(getBrevoService()); },
  get addContactToList() { return getBrevoService().addContactToList.bind(getBrevoService()); },
  get syncProfileCompletion() { return getBrevoService().syncProfileCompletion.bind(getBrevoService()); },
  get sendTransactionalEmail() { return getBrevoService().sendTransactionalEmail.bind(getBrevoService()); },
  get sendNotificationEmail() { return getBrevoService().sendNotificationEmail.bind(getBrevoService()); },
  get sendWelcomeEmail() { return getBrevoService().sendWelcomeEmail.bind(getBrevoService()); }
};

export default brevoService; 