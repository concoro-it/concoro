# Brevo Configuration Setup for Firebase Functions

To enable email notifications, you need to configure the Brevo API key in your Firebase Functions environment.

## 🔧 Setting Up Brevo API Key

### Option 1: Using Firebase CLI (Recommended)

```bash
# Set the Brevo API key in Firebase Functions config
firebase functions:config:set brevo.api_key="your-brevo-api-key-here"

# Deploy the functions to apply the new configuration
firebase deploy --only functions
```

### Option 2: Using Environment Variables (Local Development)

Create a `.env` file in your `functions/` directory:

```bash
# functions/.env
BREVO_API_KEY=your-brevo-api-key-here
```

### Option 3: Using Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Functions** → **Configuration**
4. Add a new environment variable:
   - Key: `brevo.api_key`
   - Value: `your-brevo-api-key-here`

## 🔑 Getting Your Brevo API Key

1. Go to [Brevo Dashboard](https://app.brevo.com/)
2. Navigate to **SMTP & API** → **API Keys**
3. Create a new API key or copy an existing one
4. Make sure the API key has permissions for:
   - Send transactional emails
   - Manage contacts (if using contact sync features)

## 📧 Email Verification Setup

### 1. Verify Sender Domains

In Brevo dashboard:
1. Go to **Senders & IP** → **Domains**
2. Add and verify your domain (`concoro.it`)
3. Set up DKIM authentication

### 2. Configure Sender Addresses

The system uses these sender addresses:
- `notifiche@concoro.it` - For notification emails
- `welcome@concoro.it` - For welcome emails

Make sure these are verified in your Brevo account.

## 🧪 Testing Email Notifications

1. Navigate to `/debug-notifications` in your app
2. Ensure you have some saved concorsos with approaching deadlines
3. Create notifications using the "Create Notifications" button
4. Send a test email using the "Send Test Email" button
5. Check your email inbox and the Email Logs section

## 📊 Monitoring Email Delivery

### In the App
- Check the Email Logs section in `/debug-notifications`
- Monitor the Firebase Functions logs

### In Brevo Dashboard
- Go to **Statistics** → **Email** to see delivery metrics
- Check **Logs** → **Email logs** for detailed delivery information

## 🔧 Troubleshooting

### Common Issues

1. **"BREVO_API_KEY is not configured"**
   - Ensure the API key is properly set using the steps above
   - Redeploy functions after setting the config

2. **403 Forbidden Error**
   - Check if your API key is valid and active
   - Verify API key permissions in Brevo dashboard

3. **Email not delivered**
   - Check sender domain verification
   - Verify recipient email addresses
   - Check Brevo logs for bounce/spam issues

4. **Function timeout**
   - Monitor function execution time in Firebase Console
   - Consider optimizing the notification processing logic

### Debug Commands

```bash
# Check current Firebase Functions config
firebase functions:config:get

# View function logs
firebase functions:log --only createScheduledNotifications
firebase functions:log --only onConcorsoSaved

# Test function locally (requires Firebase emulator)
firebase emulators:start --only functions
```

## 📅 Scheduled Email Notifications

The system automatically:
- Runs daily at 9:00 AM (Rome timezone)
- Checks all users' saved concorsos
- Creates notifications for approaching deadlines
- Sends email summaries for urgent notifications (0, 1, 3, 7 days before deadline)
- Implements anti-spam protection (max one email per 6 hours per user)

## 🎯 Email Content Customization

Email templates are generated dynamically and include:
- **Urgent notifications** (0 days): Red styling, high priority
- **Soon notifications** (1 day): Orange styling, high priority  
- **Upcoming notifications** (>1 day): Blue styling, normal priority

The emails include:
- Responsive HTML design
- Plain text fallback
- Direct links to concorso details
- Unsubscribe/preference management links
- Branding with Concoro logo

## 🔄 Email Log Tracking

The system tracks:
- Email send timestamps
- Notification counts included
- Urgent notification counts
- Test vs automatic sends
- User-specific email frequency

This data is stored in Firestore under:
```
/userProfiles/{userId}/emailLog/{logId}
``` 