# Types Organization

## Overview

This directory contains comprehensive TypeScript type definitions for the Concoro application. The types are organized into domain-specific modules to ensure type safety, avoid duplication, and maintain a single source of truth for each data structure.

## File Structure

### Core Domain Types
- **`profile.ts`**: Main `UserProfile` interface and all related types (Experience, Education, Skills, Languages, etc.)
- **`concorso.ts`**: Job competition types including `Concorso`, `Provincia`, and related interfaces
- **`articolo.ts`**: Blog article types with SEO metadata and concorso relationships
- **`notification.ts`**: User notification types with deadline tracking and concorso data
- **`chat.ts`**: AI chat interface types for the Genio assistant

### Supporting Types
- **`auth.ts`**: Authentication-specific types and form data interfaces
- **`user.ts`**: Re-exports `UserProfile` type for backward compatibility
- **`global.ts`**: Global type declarations (Window interface extensions)
- **`index.ts`**: Central export file for all types

## Type Definitions Overview

### 🧑‍💼 Profile Types (`profile.ts`)
**Main Interface**: `UserProfile`
- **Contact Information**: `ContactInfo`
- **Work Experience**: `Experience` with company details and skills
- **Education**: `Education` with degree and field information
- **Skills & Languages**: `Skill`, `Language` with proficiency levels
- **Certifications**: `Certification` with issuer and validity dates
- **Publications & Projects**: `Publication`, `Project` for academic/professional work
- **Volunteering**: `Volunteering` experience tracking
- **Work Preferences**: `WorkPreferences` for job matching

### 💼 Concorso Types (`concorso.ts`)
**Main Interface**: `Concorso`
- **Geographic Data**: `Provincia` with region and province information
- **Job Details**: Complete job posting structure with requirements
- **Application Info**: Links, deadlines, and application procedures
- **Categorization**: Sector, category, and organizational placement

### 📰 Article Types (`articolo.ts`)
**Main Interface**: `Articolo`
- **Content**: Title, subtitle, body with SEO optimization
- **Metadata**: Tags, publication dates, slugs for URL generation
- **Relationships**: `ArticoloWithConcorso` for enhanced article display
- **SEO Integration**: Meta descriptions and categorization

### 🔔 Notification Types (`notification.ts`)
**Main Interface**: `Notification`
- **Deadline Tracking**: Days left, expiration dates
- **Concorso Integration**: `NotificationWithConcorso` with full job details
- **User Management**: Read status, user associations
- **Alert System**: Priority levels and notification types

### 💬 Chat Types (`chat.ts`)
**Main Interfaces**: `Message`, `ChatResponse`
- **AI Interaction**: User and assistant message roles
- **Response Handling**: Structured responses with error handling
- **Context Management**: Conversation history and context

## Best Practices

1. **Import from the index file**:
   ```typescript
   import { UserProfile, Concorso, Notification } from '@/types';
   ```

2. **Single Source of Truth**:
   - Profile types: `profile.ts`
   - Job data types: `concorso.ts`
   - Article types: `articolo.ts`
   - Notification types: `notification.ts`
   - Chat types: `chat.ts`

3. **Type Extensions**:
   ```typescript
   interface CustomUserProfile extends Omit<UserProfile, 'field'> {
     field: CustomType;
   }
   ```

4. **Firebase Integration**:
   ```typescript
   // Use Firebase Timestamp for dates
   import { Timestamp } from 'firebase/firestore';
   
   interface MyType {
     createdAt: Timestamp;
     updatedAt: Timestamp;
   }
   ```

## Usage Examples

### Profile Management
```typescript
import { UserProfile, Experience, Education } from '@/types';

// Creating a new experience entry
const newExperience: Experience = {
  id: generateId(),
  positionTitle: 'Software Developer',
  companyName: 'Tech Corp',
  startDate: Timestamp.now(),
  endDate: null,
  isCurrent: true,
  location: 'Milan, Italy',
  skills: ['React', 'TypeScript', 'Node.js']
};

// Updating user profile
const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  // Type-safe updates
};
```

### Concorso Handling
```typescript
import { Concorso, Provincia } from '@/types';

// Working with job competitions
const concorso: Concorso = {
  id: 'job-123',
  Titolo: 'Software Engineer Position',
  Ente: 'Comune di Milano',
  DataChiusura: Timestamp.fromDate(new Date('2024-12-31')),
  // ... other fields
};
```

### Notification System
```typescript
import { Notification, NotificationWithConcorso } from '@/types';

// Creating notifications
const notification: Notification = {
  id: 'notif-123',
  concorso_id: 'job-123',
  user_id: 'user-456',
  daysLeft: 7,
  timestamp: Timestamp.now(),
  isRead: false
};
```

### Blog Articles
```typescript
import { Articolo, ArticoloWithConcorso } from '@/types';

// Article with SEO optimization
const article: Articolo = {
  id: 'article-123',
  articolo_title: 'How to Apply for Public Sector Jobs',
  slug: 'how-to-apply-public-sector-jobs',
  articolo_meta_description: 'Complete guide to...',
  articolo_tags: ['career', 'public-sector'],
  publication_date: Timestamp.now()
};
```

## Type Safety Features

### 🔒 Strict Type Checking
- All interfaces use strict TypeScript configuration
- Firebase `Timestamp` types for date consistency
- Optional vs required field distinction
- Union types for status fields (e.g., `'open' | 'closed'`)

### 🎯 Domain-Specific Types
- **Profile Types**: Comprehensive user data structure
- **Concorso Types**: Complete job posting schema
- **Notification Types**: Deadline and alert management
- **Article Types**: Blog content with SEO metadata
- **Chat Types**: AI interaction patterns

### 🔄 Type Relationships
- **Extends Pattern**: `NotificationWithConcorso` extends `Notification`
- **Union Types**: Flexible status and category definitions
- **Optional Fields**: Graceful handling of missing data
- **Firebase Integration**: Proper `Timestamp` and `FieldValue` usage

## Migration Notes

The codebase has been fully migrated to use centralized types:

### ✅ Completed Migrations
1. **Profile Components**: All 15+ profile-related components updated
2. **Concorso Components**: Job listing and detail components typed
3. **Notification System**: Email and in-app notification types
4. **Blog System**: Article management with SEO types
5. **Chat Interface**: AI assistant type definitions

### 🎯 Type Safety Improvements
- **Firestore Integration**: Proper `Timestamp` usage throughout
- **Form Validation**: Type-safe form data interfaces
- **API Responses**: Structured response types
- **Error Handling**: Typed error interfaces
- **SEO Metadata**: Comprehensive article and page metadata types

### 📝 Recent Updates
- **New Types Added**: `ArticoloWithConcorso`, `NotificationWithConcorso`
- **Enhanced Profile**: Added `WorkPreferences` for job matching
- **SEO Integration**: Article types with slug and meta description support
- **Chat Types**: AI assistant message and response interfaces
- **Global Types**: Window interface extensions for analytics 