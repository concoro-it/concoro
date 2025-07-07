You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. Leverage shadcn/ui for a clean LinkedIn-style design. The application must be deployed to Vercel.

Your job is to create a social media application (like LinkedIn) with the following requirements and layout (based on the provided LinkedIn screenshots):

1. **UI Layout & Pages**  
   - **Global Header**: Top navigation with logo/branding on the left, a central search bar, and icons/links on the right for Home, Network, Jobs, Messaging, Notifications, and Profile.  
   - **Left Sidebar**: Displays the user’s mini-profile card (avatar, name, current position, location). Underneath, links to sections like “Preferences,” “My Jobs,” “Career Insights,” and a “Post a free job” button.  
   - **Center Feed/Content**:  
     - On **Home** (`/`), show a feed of job picks or announcements matching the user’s profile (or a default feed if none match).  
     - On **Concorsi** (`/concorsi`), show a two-column layout:
       1. Left column: List of concorsi/jobs (title, location, category, date, “Promoted” tag, etc.).  
       2. Right column: The selected concorso’s details (title, full description, “Apply” button, “Save” button, and any additional info).  
     - On **Profile** (`/profile`), replicate the LinkedIn layout:  
       - A top banner with the user’s avatar, name, and headline.  
       - Main content with sections like “Analytics,” “About,” “Activity,” “Experience,” “Skills,” etc.  
       - A right sidebar for “Suggested for you,” “Analytics,” or “Who viewed your profile.”  
   - **Responsive Design**: Ensure all layouts collapse gracefully for mobile screens, possibly stacking columns or hiding sidebars.

2. **Firebase Setup (from scratch)**  
   - Initialize Firebase Auth, Firestore, Storage, and Cloud Messaging (for push notifications).  
   - Store CSV data in Firestore (`concorsi` collection).  
   - Keep user profile data in Firestore (`users` collection).  

3. **User Authentication**  
   - Firebase Auth with Google Sign-In (plus optional Email/Password, GitHub, Twitter).  
   - Persistent login state. Sign out option in the user’s profile menu (top-right corner).  

4. **User Profiles**  
   - Firestore doc: `users/{uid}`. Fields include:  
     - Name, Bio, Profile Picture, Education, Experience  
     - Skills, Interests, Languages, Location, Driving License, Certifications  
     - Honors & Awards, and **Saved Concorsi** (bookmarked jobs)  
   - **Profile Editing**: Provide a form (using shadcn/ui) to let users update sections (e.g., “About,” “Experience,” etc.).  

5. **Concorsi Data & Import**  
   - Import the CSV file (`extracted_job_info.csv`) into Firestore.  
   - Each concorso doc includes: title, category, location, postedDate, deadline, description, etc.  
   - Add indexing for (location, category, date) to enable searching, filtering, sorting.  

6. **Home Feed (Center Column)**  
   - Shows relevant/job picks “For You,” based on user’s profile/skills or any saved concorsi.  
   - If none match, show a default feed (most recent concorsi).  
   - Let users see “Suggested job searches” and possibly “Promoted” listings.  

7. **Concorsi Page (Two-Column Layout)**  
   - **Left Column**: List of relevant or searched concorsi.  
     - A search bar for name/location/category.  
     - Filters for location, category, date, etc.  
     - Sorting by date, relevance, popularity.  
   - **Right Column**: When a user selects a concorso, display details here:  
     - Title, location, job type, description.  
     - **Buttons**: “Apply” and “Save.” (Save toggles the bookmark state.)  
     - “Promoted” tag or “You’d be a top applicant” info if relevant.  

8. **Saving/Bookmarking Concorsi**  
   - When the user taps “Save,” add the concorso ID to their `savedConcorsi` array in Firestore.  
   - If the user wants to “Unsave,” remove it from that array.  
   - Reflect the save status on both the feed and detailed view (icon or text change).  

9. **Notifications (Firebase Cloud Messaging)**  
   - Request the user’s permission for push notifications.  
   - Send notifications when new concorsi match the user’s profile, or when a saved concorso updates.  
   - Possibly show a “bell” icon in the top nav for in-app notifications in addition to push.  

10. **Styling & Interaction**  
   - Use **shadcn/ui** and Tailwind to replicate LinkedIn’s minimal styling: soft grays, a white background, subtle borders, etc.  
   - **Left Sidebar**: Show the user’s mini profile card with small avatar, name, headline, plus quick links.  
   - **Top Search Bar**: Let users search for concorsi by title/keyword.  
   - **Right Sidebar**: On Home and Profile pages, display relevant modules (e.g., “Suggested job searches,” “Analytics,” “Who viewed your profile,” or ads).  
   - Provide all interactive elements with relevant hover states (like “X” to remove a suggested job, “Save” toggling to “Saved”).  

11. **Deployment**  
   - Configure environment variables for Firebase in Vercel.  
   - Deploy to Vercel so the site is publicly accessible.  
   - Ensure all pages build successfully with the correct layouts from your LinkedIn screenshots.  

### Implementation Notes
- Use the **Next.js 13 App Router** (e.g. `app/layout.tsx` for the global nav/sidebar layout).  
- Show multi-column layouts for the feed and job listings, similar to LinkedIn.  
- The right sidebar components can be conditionally rendered depending on the page (Home vs. Profile vs. Concorsi).  
- Ensure user authentication is required for certain pages (profile edit, saving concorsi).  
- Provide adequate error/loading states when fetching data from Firestore.  
- Replace or overwrite any existing code in the codebase with this new LinkedIn-style social-media/jobs application.  

**Task:** Transform the codebase into this LinkedIn-inspired application, implementing all core features, UI layout, Firebase integration, notifications, and Vercel deployment.