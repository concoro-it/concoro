# Brevo Integration for Concoro

This document describes the Brevo (formerly Sendinblue) integration implemented in Concoro to automatically sync user profile information when users complete the signup process.

## Overview

The integration automatically creates or updates contacts in Brevo when:
1. User completes profile setup in `/basic-info` page
2. User signs in with Google for the first time
3. User updates their profile information

## Components

### 1. Brevo Service (`src/lib/services/brevo.ts`)
- **Purpose**: Server-side service that handles direct communication with Brevo API
- **Key Features**:
  - Contact creation and updates
  - Profile data transformation
  - Experience calculation
  - Profile completion validation
  - Error handling and retry logic

### 2. Brevo API Routes (`src/app/api/brevo/route.ts`)
- **Purpose**: Next.js API routes that provide secure server-side access to Brevo API
- **Endpoints**:
  - `POST /api/brevo` - Create or update contact
  - `PUT /api/brevo` - Update existing contact
  - `DELETE /api/brevo?email=<email>` - Delete contact

### 3. Brevo Client Service (`src/lib/services/brevoClient.ts`)
- **Purpose**: Client-side utility for calling Brevo API routes
- **Key Features**:
  - Profile synchronization
  - Retry logic with exponential backoff
  - Error handling

## Brevo Contact Attributes

When a user profile is synced to Brevo, the following attributes are created/updated:

### Basic Information
- `FIRSTNAME` - User's first name
- `LASTNAME` - User's last name
- `EMAIL` - User's email address

### Location & Demographics
- `REGION` - User's region in Italy
- `CITY` - User's city
- `LOCATION` - Combined location string
- `IS_STUDENT` - Boolean indicating if user is a student

### Professional Information
- `HEADLINE` - User's professional headline
- `CURRENT_POSITION` - Current job title
- `CURRENT_COMPANY` - Current employer
- `YEARS_OF_EXPERIENCE` - Calculated years of experience
- `LATEST_POSITION` - Most recent position title and company
- `LATEST_EDUCATION` - Most recent education details

### Contact Information
- `PHONE` - User's phone number
- `WEBSITE` - User's website URL
- `ABOUT` - User's bio/about section

### Skills & Qualifications
- `SKILLS` - Comma-separated list of skills
- `LANGUAGES` - Comma-separated list of languages with proficiency
- `EDUCATION_COUNT` - Number of education entries
- `EXPERIENCE_COUNT` - Number of experience entries
- `CERTIFICATIONS_COUNT` - Number of certifications

### Preferences & Interests
- `PREFERRED_REGIONS` - Comma-separated list of preferred regions
- `SECTOR_INTERESTS` - Comma-separated list of sector interests

### System Information
- `CREATED_AT` - Profile creation timestamp
- `UPDATED_AT` - Last profile update timestamp
- `PROFILE_COMPLETE` - Boolean indicating if profile is complete for job matching

## Configuration

### Environment Variables
Add the following to your `.env.local` file:
```
BREVO_API_KEY=your_brevo_api_key_here
```

### Brevo Dashboard Setup
1. Log in to your Brevo dashboard
2. Create the following custom attributes for contacts:
   - Text attributes: FIRSTNAME, LASTNAME, REGION, CITY, LOCATION, HEADLINE, CURRENT_POSITION, CURRENT_COMPANY, LATEST_POSITION, LATEST_EDUCATION, PHONE, WEBSITE, ABOUT, SKILLS, LANGUAGES, PREFERRED_REGIONS, SECTOR_INTERESTS
   - Number attributes: YEARS_OF_EXPERIENCE, EDUCATION_COUNT, EXPERIENCE_COUNT, CERTIFICATIONS_COUNT
   - Boolean attributes: IS_STUDENT, PROFILE_COMPLETE
   - Date attributes: CREATED_AT, UPDATED_AT

## Integration Points

### 1. Profile Completion (`src/app/basic-info/page.tsx`)
- Triggered when user completes the 4-step profile setup
- Syncs comprehensive profile data including education, experience, and preferences

### 2. Google Sign-in (`src/lib/auth/auth-utils.ts`)
- Triggered when user signs in with Google for the first time
- Creates basic contact with name and email

### 3. Profile Updates (Future Enhancement)
- Can be triggered when user updates profile information
- Updates existing contact in Brevo

## Error Handling

The integration is designed to be non-blocking:
- Brevo sync failures don't prevent user registration or profile completion
- Errors are logged but don't interrupt the user flow
- Retry logic with exponential backoff for transient failures

## Usage Examples

### Manual Profile Sync
```typescript
import { brevoClient } from '@/lib/services/brevoClient';

// Sync a complete profile
const result = await brevoClient.syncProfile(userProfile);

// Sync with retry logic
const result = await brevoClient.syncProfileWithRetry(userProfile, 3);
```

### Server-side Direct Access
```typescript
import { brevoService } from '@/lib/services/brevo';

// Create or update contact
const result = await brevoService.createOrUpdateContact(userProfile);

// Update profile completion status
const result = await brevoService.syncProfileCompletion(userProfile);
```

## Monitoring and Debugging

- Check browser console for client-side sync logs
- Check server logs for API route and service logs
- Verify contact creation in Brevo dashboard
- Monitor API usage in Brevo account

## Future Enhancements

1. **List Management**: Automatically add contacts to specific lists based on profile attributes
2. **Email Campaigns**: Trigger automated email sequences based on profile completion
3. **Profile Updates**: Real-time sync when users update their profiles
4. **Advanced Segmentation**: Use Brevo lists and segments for targeted campaigns
5. **Webhook Integration**: Handle Brevo events like email opens, clicks, etc.

## Security Considerations

- API key is stored securely in environment variables
- All Brevo API calls are made server-side to protect the API key
- Client-side code only communicates with internal API routes
- Contact data is validated before sending to Brevo

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Check if BREVO_API_KEY is correctly set
   - Verify API key has correct permissions in Brevo dashboard

2. **Contact Creation Fails**
   - Ensure required attributes exist in Brevo dashboard
   - Check attribute data types match expectations

3. **Sync Not Triggered**
   - Verify integration points are properly implemented
   - Check console logs for error messages

4. **Profile Not Complete**
   - Ensure profile has required fields (firstName, lastName, email, region)
   - Check profile completion logic in `isProfileComplete` method 