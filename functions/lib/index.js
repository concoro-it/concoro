"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onConcorsoSaved = exports.createScheduledNotifications = exports.onUserProfileUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
admin.initializeApp();
class BrevoEmailService {
    constructor() {
        var _a;
        this.baseUrl = 'https://api.brevo.com/v3';
        this.apiKey = ((_a = functions.config().brevo) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.BREVO_API_KEY || '';
        if (!this.apiKey) {
            functions.logger.warn('BREVO_API_KEY is not configured - emails will not be sent');
        }
    }
    async sendTransactionalEmail(emailData) {
        if (!this.apiKey) {
            functions.logger.warn('Brevo API key not configured, skipping email send');
            return { success: false, reason: 'API key not configured' };
        }
        try {
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/smtp/email`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': this.apiKey,
                    'content-type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                functions.logger.error('Brevo API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(`Brevo API Error: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            functions.logger.info('Email sent successfully via Brevo:', result);
            return result;
        }
        catch (error) {
            functions.logger.error('Failed to send email via Brevo:', error);
            throw error;
        }
    }
    async sendNotificationEmail(userEmail, userName, notifications) {
        const urgentNotifications = notifications.filter(n => n.daysLeft === 0);
        const soonNotifications = notifications.filter(n => n.daysLeft === 1);
        const upcomingNotifications = notifications.filter(n => n.daysLeft > 1);
        let subject;
        let priority = 'normal';
        if (urgentNotifications.length > 0) {
            subject = urgentNotifications.length === 1
                ? `🚨 SCADE OGGI: ${urgentNotifications[0].concorsoTitle || 'Concorso'}`
                : `🚨 ${urgentNotifications.length} concorsi scadono OGGI!`;
            priority = 'high';
        }
        else if (soonNotifications.length > 0) {
            subject = soonNotifications.length === 1
                ? `⏰ Scade domani: ${soonNotifications[0].concorsoTitle || 'Concorso'}`
                : `⏰ ${soonNotifications.length} concorsi scadono domani`;
            priority = 'high';
        }
        else {
            const firstNotification = upcomingNotifications[0];
            subject = upcomingNotifications.length === 1
                ? `📅 Promemoria: ${firstNotification.concorsoTitle || 'Concorso'} (${firstNotification.daysLeft} giorni)`
                : `📅 ${upcomingNotifications.length} concorsi in scadenza`;
        }
        const emailData = {
            to: [{ email: userEmail, name: userName }],
            sender: {
                email: 'notifiche@concoro.it',
                name: 'Concoro - Notifiche Concorsi'
            },
            subject: subject,
            htmlContent: this.generateNotificationEmailHTML(userName, notifications),
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
    }
    generateNotificationEmailHTML(userName, notifications) {
        const urgentNotifications = notifications.filter(n => n.daysLeft === 0);
        const soonNotifications = notifications.filter(n => n.daysLeft === 1);
        const upcomingNotifications = notifications.filter(n => n.daysLeft > 1);
        const formatDate = (timestamp) => {
            try {
                const date = (timestamp === null || timestamp === void 0 ? void 0 : timestamp.toDate) ? timestamp.toDate() : new Date(timestamp);
                return date.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            }
            catch (error) {
                return 'Data non disponibile';
            }
        };
        const generateNotificationCard = (notification, bgColor, urgencyText) => `
      <div style="background-color: ${bgColor}; border-radius: 8px; padding: 20px; margin: 16px 0; border-left: 4px solid #007bff;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">${notification.concorsoTitle || 'Concorso'}</h3>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${notification.concorsoEnte || ''}</p>
        <p style="margin: 0 0 12px 0; color: #d32f2f; font-weight: bold; font-size: 14px;">${urgencyText}</p>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Scadenza: ${formatDate(notification.scadenza)}</p>
        <a href="https://concoro.it/bandi/${notification.concorso_id}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Visualizza Concorso
        </a>
      </div>
    `;
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifiche Concorsi - Concoro</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
            <img src="https://concoro.it/concoro-logo-light.svg" alt="Concoro" style="max-width: 150px; height: auto;">
            <h1 style="color: #007bff; margin: 10px 0 0 0;">Notifiche Concorsi</h1>
        </div>

        <div style="margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">Ciao ${userName}!</h2>
            <p style="margin: 0; color: #666;">Hai ${notifications.length} ${notifications.length === 1 ? 'concorso' : 'concorsi'} in scadenza che richiedono la tua attenzione.</p>
        </div>

        ${urgentNotifications.length > 0 ? `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #d32f2f; margin: 0 0 15px 0; font-size: 20px;">🚨 Scadono OGGI</h3>
            ${urgentNotifications.map(n => generateNotificationCard(n, '#ffebee', '⚠️ SCADE OGGI')).join('')}
        </div>
        ` : ''}

        ${soonNotifications.length > 0 ? `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #f57c00; margin: 0 0 15px 0; font-size: 20px;">⏰ Scadono Domani</h3>
            ${soonNotifications.map(n => generateNotificationCard(n, '#fff8e1', '⏰ Scade domani')).join('')}
        </div>
        ` : ''}

        ${upcomingNotifications.length > 0 ? `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">📅 Prossime Scadenze</h3>
            ${upcomingNotifications.map(n => generateNotificationCard(n, '#e3f2fd', `Scade tra ${n.daysLeft} ${n.daysLeft === 1 ? 'giorno' : 'giorni'}`)).join('')}
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Non perdere queste opportunità!</h3>
            <a href="https://concoro.it/notifiche" 
               style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Visualizza Tutte le Notifiche
            </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p style="margin: 0 0 10px 0;">Ricevi questa email perché hai salvato dei concorsi su Concoro.</p>
            <p style="margin: 0 0 10px 0;">
                <a href="https://concoro.it/settings" style="color: #007bff; text-decoration: none;">Gestisci le tue preferenze</a> | 
                <a href="https://concoro.it" style="color: #007bff; text-decoration: none;">Vai a Concoro</a>
            </p>
            <p style="margin: 0; color: #999;">© 2024 Concoro. Tutti i diritti riservati.</p>
        </div>
    </div>
</body>
</html>
    `;
    }
    generateNotificationEmailText(userName, notifications) {
        const formatDate = (timestamp) => {
            try {
                const date = (timestamp === null || timestamp === void 0 ? void 0 : timestamp.toDate) ? timestamp.toDate() : new Date(timestamp);
                return date.toLocaleDateString('it-IT');
            }
            catch (error) {
                return 'Data non disponibile';
            }
        };
        let content = `Ciao ${userName}!\n\n`;
        content += `Hai ${notifications.length} ${notifications.length === 1 ? 'concorso' : 'concorsi'} in scadenza che richiedono la tua attenzione.\n\n`;
        const urgentNotifications = notifications.filter(n => n.daysLeft === 0);
        const soonNotifications = notifications.filter(n => n.daysLeft === 1);
        const upcomingNotifications = notifications.filter(n => n.daysLeft > 1);
        if (urgentNotifications.length > 0) {
            content += `🚨 SCADONO OGGI:\n`;
            urgentNotifications.forEach(n => {
                content += `- ${n.concorsoTitle || 'Concorso'} (${n.concorsoEnte || ''})\n`;
                content += `  Scadenza: ${formatDate(n.scadenza)}\n`;
                content += `  Link: https://concoro.it/bandi/${n.concorso_id}\n\n`;
            });
        }
        if (soonNotifications.length > 0) {
            content += `⏰ SCADONO DOMANI:\n`;
            soonNotifications.forEach(n => {
                content += `- ${n.concorsoTitle || 'Concorso'} (${n.concorsoEnte || ''})\n`;
                content += `  Scadenza: ${formatDate(n.scadenza)}\n`;
                content += `  Link: https://concoro.it/bandi/${n.concorso_id}\n\n`;
            });
        }
        if (upcomingNotifications.length > 0) {
            content += `📅 PROSSIME SCADENZE:\n`;
            upcomingNotifications.forEach(n => {
                content += `- ${n.concorsoTitle || 'Concorso'} (${n.concorsoEnte || ''})\n`;
                content += `  Scade tra ${n.daysLeft} ${n.daysLeft === 1 ? 'giorno' : 'giorni'}\n`;
                content += `  Scadenza: ${formatDate(n.scadenza)}\n`;
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
}
const brevoEmailService = new BrevoEmailService();
exports.onUserProfileUpdate = functions.firestore
    .document('userProfiles/{userId}')
    .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    if (!data)
        return;
    // Add a guard condition to only trigger when a profile is completed for matching flow
    // Check if profile has required fields including languages OR skills for matching with concorsi
    const hasRequiredFields = data.firstName &&
        data.preferredCategories &&
        data.preferredRegions &&
        data.experience &&
        data.education &&
        (data.languages || data.skills);
    if (hasRequiredFields) {
        try {
            const response = await (0, node_fetch_1.default)('https://n8n.srv865706.hstgr.cloud/webhook/trigger-user-profile-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign(Object.assign({ userId: context.params.userId }, data), { updatedAt: new Date().toISOString() })),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            functions.logger.info('Profile update webhook sent successfully for matching flow', {
                userId: context.params.userId,
                status: response.status
            });
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            functions.logger.error('Error sending profile update webhook', error);
            return { success: false, error: errorMessage };
        }
    }
    else {
        functions.logger.info('Profile update skipped - incomplete profile for matching flow', {
            userId: context.params.userId,
            hasFirstName: !!data.firstName,
            hasPreferredCategories: !!data.preferredCategories,
            hasPreferredRegions: !!data.preferredRegions,
            hasExperience: !!data.experience,
            hasEducation: !!data.education,
            hasLanguages: !!data.languages,
            hasSkills: !!data.skills
        });
        return { success: false, reason: 'Incomplete profile for matching flow' };
    }
});
// Scheduled function to create notifications daily AND send email summaries
exports.createScheduledNotifications = functions.pubsub
    .schedule('0 9 * * *') // Run daily at 9:00 AM
    .timeZone('Europe/Rome')
    .onRun(async (context) => {
    const db = admin.firestore();
    try {
        functions.logger.info('Starting scheduled notification creation and email sending');
        // Get all saved concorsos
        const savedConcorsiSnapshot = await db.collection('savedconcorsi').get();
        if (savedConcorsiSnapshot.empty) {
            functions.logger.info('No saved concorsi found');
            return { success: true, count: 0 };
        }
        // Group by user for efficient processing
        const userSavedConcorsos = new Map();
        savedConcorsiSnapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const concorsoId = data.concorso_id;
            const savedAt = data.savedAt;
            if (!userSavedConcorsos.has(userId)) {
                userSavedConcorsos.set(userId, []);
            }
            userSavedConcorsos.get(userId).push({
                docId: doc.id,
                concorsoId: concorsoId,
                savedAt: savedAt
            });
        });
        let totalNotificationsCreated = 0;
        let totalEmailsSent = 0;
        // Process each user's saved concorsos
        for (const [userId, savedConcorsos] of userSavedConcorsos) {
            const userNotificationsCreated = await processUserNotifications(db, userId, savedConcorsos);
            totalNotificationsCreated += userNotificationsCreated;
            // Send email notifications if there are notifications to send
            try {
                const emailSent = await sendUserEmailNotifications(db, userId);
                if (emailSent)
                    totalEmailsSent++;
            }
            catch (emailError) {
                functions.logger.error('Error sending email notifications for user:', {
                    userId,
                    error: emailError
                });
            }
        }
        functions.logger.info('Scheduled notification creation and email sending completed', {
            usersProcessed: userSavedConcorsos.size,
            totalNotifications: totalNotificationsCreated,
            totalEmailsSent: totalEmailsSent
        });
        return {
            success: true,
            usersProcessed: userSavedConcorsos.size,
            totalNotifications: totalNotificationsCreated,
            totalEmailsSent: totalEmailsSent
        };
    }
    catch (error) {
        functions.logger.error('Error in scheduled notification creation and email sending:', error);
        throw error;
    }
});
// Function to send email notifications to a user
async function sendUserEmailNotifications(db, userId) {
    try {
        // Get user profile for email and name
        const userProfileDoc = await db.collection('userProfiles').doc(userId).get();
        if (!userProfileDoc.exists) {
            functions.logger.warn('User profile not found for email notifications:', { userId });
            return false;
        }
        const userProfile = userProfileDoc.data();
        const userEmail = userProfile.email;
        const userName = userProfile.firstName || 'Utente';
        if (!userEmail) {
            functions.logger.warn('User email not found:', { userId });
            return false;
        }
        // Get user's unread notifications that should trigger emails
        const notificationsSnapshot = await db
            .collection('userProfiles')
            .doc(userId)
            .collection('notifications')
            .where('isRead', '!=', true)
            .where('daysLeft', 'in', [0, 1, 3, 7]) // Only send emails for urgent notifications
            .orderBy('timestamp', 'desc')
            .limit(10) // Limit to avoid overwhelming emails
            .get();
        if (notificationsSnapshot.empty) {
            return false; // No notifications to email about
        }
        // Enrich notifications with concorso data
        const notifications = [];
        for (const notificationDoc of notificationsSnapshot.docs) {
            const notificationData = notificationDoc.data();
            try {
                const concorsoDoc = await db.collection('concorsi').doc(notificationData.concorso_id).get();
                if (concorsoDoc.exists) {
                    const concorsoData = concorsoDoc.data();
                    notifications.push(Object.assign(Object.assign({}, notificationData), { id: notificationDoc.id, concorsoTitle: concorsoData.Titolo || concorsoData.titolo_breve, concorsoEnte: concorsoData.Ente }));
                }
            }
            catch (error) {
                functions.logger.warn('Error enriching notification with concorso data:', {
                    notificationId: notificationDoc.id,
                    concorsoId: notificationData.concorso_id,
                    error
                });
            }
        }
        if (notifications.length === 0) {
            return false; // No valid notifications to send
        }
        // Check if we should send an email (avoid spam - check if we sent one recently)
        const lastEmailCheck = await db
            .collection('userProfiles')
            .doc(userId)
            .collection('emailLog')
            .where('type', '==', 'notification')
            .orderBy('sentAt', 'desc')
            .limit(1)
            .get();
        if (!lastEmailCheck.empty) {
            const lastEmailData = lastEmailCheck.docs[0].data();
            const lastEmailTime = lastEmailData.sentAt.toDate();
            const hoursSinceLastEmail = (new Date().getTime() - lastEmailTime.getTime()) / (1000 * 60 * 60);
            // Don't send if we sent an email in the last 6 hours (to avoid spam)
            if (hoursSinceLastEmail < 6) {
                functions.logger.info('Skipping email - too recent since last notification email:', {
                    userId,
                    hoursSinceLastEmail
                });
                return false;
            }
        }
        // Send the email
        await brevoEmailService.sendNotificationEmail(userEmail, userName, notifications);
        // Log the email send
        await db
            .collection('userProfiles')
            .doc(userId)
            .collection('emailLog')
            .add({
            type: 'notification',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            notificationCount: notifications.length,
            urgentCount: notifications.filter((n) => n.daysLeft === 0).length
        });
        functions.logger.info('Email notification sent successfully:', {
            userId,
            userEmail,
            notificationCount: notifications.length
        });
        return true;
    }
    catch (error) {
        functions.logger.error('Error sending email notifications:', { userId, error });
        throw error;
    }
}
// Trigger when a concorso is saved to create immediate notifications if needed
exports.onConcorsoSaved = functions.firestore
    .document('savedconcorsi/{docId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    const { userId, concorso_id, savedAt } = data;
    try {
        functions.logger.info('Processing new saved concorso', {
            userId,
            concorsoId: concorso_id,
            docId: context.params.docId
        });
        const db = admin.firestore();
        // Get concorso details
        const concorsoDoc = await db.collection('concorsi').doc(concorso_id).get();
        if (!concorsoDoc.exists) {
            functions.logger.warn('Concorso not found', { concorsoId: concorso_id });
            return { success: false, reason: 'Concorso not found' };
        }
        const concorsoData = concorsoDoc.data();
        const notificationsCreated = await createNotificationsForConcorso(db, userId, concorso_id, concorsoData, savedAt);
        functions.logger.info('Immediate notification processing completed', {
            userId,
            concorsoId: concorso_id,
            notificationsCreated
        });
        return { success: true, notificationsCreated };
    }
    catch (error) {
        functions.logger.error('Error processing saved concorso:', error);
        throw error;
    }
});
// Helper function to process notifications for a single user
async function processUserNotifications(db, userId, savedConcorsos) {
    let notificationsCreated = 0;
    for (const saved of savedConcorsos) {
        try {
            // Get concorso details
            const concorsoDoc = await db.collection('concorsi').doc(saved.concorsoId).get();
            if (!concorsoDoc.exists) {
                functions.logger.warn('Concorso not found during processing', {
                    concorsoId: saved.concorsoId,
                    userId
                });
                continue;
            }
            const concorsoData = concorsoDoc.data();
            const created = await createNotificationsForConcorso(db, userId, saved.concorsoId, concorsoData, saved.savedAt);
            notificationsCreated += created;
        }
        catch (error) {
            functions.logger.error('Error processing concorso for user', {
                userId,
                concorsoId: saved.concorsoId,
                error: error
            });
        }
    }
    return notificationsCreated;
}
// Helper function to create notifications for a specific concorso
async function createNotificationsForConcorso(db, userId, concorsoId, concorsoData, savedAt) {
    // Handle different timestamp formats
    let deadlineDate;
    if (concorsoData.DataChiusura && typeof concorsoData.DataChiusura.toDate === 'function') {
        deadlineDate = concorsoData.DataChiusura.toDate();
    }
    else if (concorsoData.DataChiusura && concorsoData.DataChiusura.seconds) {
        deadlineDate = new Date(concorsoData.DataChiusura.seconds * 1000);
    }
    else if (typeof concorsoData.DataChiusura === 'string') {
        deadlineDate = new Date(concorsoData.DataChiusura);
    }
    else {
        functions.logger.warn('Invalid deadline date format', {
            concorsoId,
            DataChiusura: concorsoData.DataChiusura
        });
        return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    deadlineDate.setHours(0, 0, 0, 0); // Reset time to start of day
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // Skip if already expired
    if (daysLeft < 0) {
        functions.logger.info('Concorso already expired', { concorsoId, daysLeft });
        return 0;
    }
    // Notification thresholds: 7, 3, 1, 0 days before deadline
    const notificationThresholds = [7, 3, 1, 0];
    let notificationsCreated = 0;
    for (const threshold of notificationThresholds) {
        if (daysLeft === threshold) {
            // Check if notification already exists for this threshold
            const existingNotificationQuery = await db
                .collection('userProfiles')
                .doc(userId)
                .collection('notifications')
                .where('concorso_id', '==', concorsoId)
                .where('daysLeft', '==', daysLeft)
                .limit(1)
                .get();
            if (existingNotificationQuery.empty) {
                // Create new notification
                const notification = {
                    concorso_id: concorsoId,
                    user_id: userId,
                    daysLeft: daysLeft,
                    scadenza: admin.firestore.Timestamp.fromDate(deadlineDate),
                    publication_date: concorsoData.publication_date || '',
                    savedAt: savedAt || admin.firestore.FieldValue.serverTimestamp(),
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    isRead: false
                };
                await db
                    .collection('userProfiles')
                    .doc(userId)
                    .collection('notifications')
                    .add(notification);
                notificationsCreated++;
                functions.logger.info('Notification created', {
                    userId,
                    concorsoId,
                    daysLeft,
                    concorsoTitle: concorsoData.Titolo || concorsoData.titolo_breve
                });
            }
            else {
                functions.logger.debug('Notification already exists', {
                    userId,
                    concorsoId,
                    daysLeft
                });
            }
        }
    }
    return notificationsCreated;
}
//# sourceMappingURL=index.js.map