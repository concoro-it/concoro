# Types Organization

## Overview

This directory contains TypeScript type definitions for the application. The types are organized to avoid duplication and ensure a single source of truth for each data structure.

## Structure

- `profile.ts`: Contains the main `UserProfile` interface and all related types (Experience, Education, etc.)
- `user.ts`: Re-exports the `UserProfile` type from profile.ts for backward compatibility
- `auth.ts`: Contains auth-specific types and a modified version of `UserProfile` for backward compatibility
- `index.ts`: Re-exports all types from their respective files for easier imports

## Best Practices

1. **Import from the index file**:
   ```typescript
   import { UserProfile } from '@/types';
   ```

2. **Single Source of Truth**:
   - All profile-related types should be defined in `profile.ts`
   - Don't create duplicate type definitions

3. **Type Extensions**:
   - If you need a variation of an existing type, extend it:
   ```typescript
   interface CustomUserProfile extends Omit<UserProfile, 'field'> {
     field: CustomType;
   }
   ```

## Migration Notes

The codebase previously had duplicate `UserProfile` interfaces in multiple files, which has been consolidated. If you encounter any typing issues, ensure you're importing from `@/types` instead of specific files.

## Recent Updates

All profile-related components have been updated to use the centralized types:

1. **Profile Page Components**:
   - `ProfileHeader`, `AboutSection`
   - `ExperienceSection` and `ExperienceForm`
   - `EducationSection` and `EducationForm` 
   - `SkillsSection` and `SkillsForm`
   - `LanguagesSection` and `LanguagesForm`


2. **Layout Components**:
   - `LeftSidebar` and `Navbar` now use the proper `UserProfile` type

3. **Type Safety Improvements**:
   - Added proper type casting when fetching user profiles from Firestore
   - Fixed field references (e.g., `profilePicture` instead of `profileImageURL`) 