# Firebase Cloud Functions for Concoro

This directory contains Firebase Cloud Functions for the Concoro application.

## Current Functions

### onUserProfileUpdate

This function listens to writes on the `userProfiles` collection and sends a POST request to an n8n webhook when a profile is updated with the required fields for the matching flow. The function triggers when a user profile contains:

- `firstName` - User's first name
- `preferredCategories` - Categories of interest for matching
- `preferredRegions` - Preferred regions for opportunities
- `experience` - User's work experience
- `education` - User's educational background
- `languages` OR `skills` - User's languages or skills for matching with concorsi (competitions/contests)

The function is designed to initiate the matching process between user profiles and available concorsi based on these criteria.

## Setup and Deployment

1. Install dependencies:
   ```
   cd functions
   npm install
   ```

2. Update the webhook URL:
   Open `src/index.ts` and replace `https://n8n.srv865706.hstgr.cloud/webhook/trigger-user-profile-update` with your actual n8n webhook URL.

3. Build the functions:
   ```
   npm run build
   ```

4. Deploy to Firebase:
   ```
   npm run deploy
   ```
   
   Or from the project root:
   ```
   firebase deploy --only functions
   ```

## Testing

You can test the function by updating a document in the `userProfiles` collection with the required fields.

Example using Firebase Admin SDK:

```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Update a user profile for matching flow
admin.firestore().collection('userProfiles').doc('userId123').set({
  firstName: 'John',
  preferredCategories: ['Technology', 'Finance'],
  preferredRegions: ['Lombardia', 'Lazio'],
  experience: [
    {
      title: 'Software Developer',
      company: 'Tech Corp',
      duration: '2 years'
    }
  ],
  education: [
    {
      degree: 'Computer Science',
      institution: 'University of Milan',
      year: '2022'
    }
  ],
  languages: ['Italian', 'English', 'Spanish'],
  skills: ['JavaScript', 'React', 'Node.js']
}, { merge: true });
```

## Viewing Logs

You can view the function logs with:
```
npm run logs
```

Or from the project root:
```
firebase functions:log
``` 