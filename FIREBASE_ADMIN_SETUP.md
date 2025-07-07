# Firebase Admin Setup Guide

## 🚨 Quick Fix for 500 Error

The email notification system is failing because Firebase Admin can't authenticate. Here's how to fix it:

## 📥 Download Firebase Service Account Key

### Method 1: Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/project/concoro-fc095/settings/serviceaccounts/adminsdk

2. **Generate new private key**:
   - Click "Generate new private key" button
   - Save the downloaded JSON file as: `concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json`
   - **Important**: Place this file in your project root directory (same level as package.json)

3. **Verify the file**:
   ```bash
   # Check if file exists and is readable
   ls -la concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json
   ```

### Method 2: Environment Variables (Alternative)

If you prefer not to store the service account file, set these environment variables in `.env.local`:

```bash
# Get these values from your downloaded service account JSON file
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@concoro-fc095.iam.gserviceaccount.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="concoro-fc095"
```

## 🧪 Test the Setup

1. **Debug endpoint**: Visit http://localhost:3000/api/notifications/debug
   - This will show you exactly what credentials are found/missing

2. **Test email**: Go to `/debug-notifications` and try "Send Test Email"

## 🔒 Security Notes

- **Never commit** the service account JSON file to git
- Add `*firebase-adminsdk*.json` to your `.gitignore`
- For production, use environment variables or secret management

## 📋 What the Service Account File Contains

The JSON file should have this structure:
```json
{
  "type": "service_account",
  "project_id": "concoro-fc095",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@concoro-fc095.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## 🎯 Expected Results

After setup, the debug endpoint should show:
- ✅ `serviceAccountFile.exists: true` OR `environmentVariables.hasFirebasePrivateKey: true`
- ✅ `initializationTest.success: true`
- ✅ `firestoreTest.success: true`

## 📞 Need Help?

If you're still getting errors:
1. Check the debug endpoint output
2. Verify the service account file permissions
3. Ensure the Firebase project ID matches "concoro-fc095" 