# Concoro - Italian Public Competition Job Platform

Concoro is a production-ready web application designed to help Italian professionals discover and apply for public sector job competitions ("concorsi pubblici"). The platform features AI-powered matching, comprehensive SEO optimization, and a modern user experience.

## 🎯 Project Overview

Concoro serves as a comprehensive platform for:
- **Job Discovery**: Browse and search through Italian public sector job competitions with advanced filtering
- **AI-Powered Matching**: Get personalized job recommendations using Pinecone vector search
- **Career Management**: Track applications, save favorite positions, and manage detailed career profiles
- **Educational Content**: Access blog articles and resources about public sector careers
- **Real-time Notifications**: Receive email notifications about deadlines and new opportunities
- **SEO-Optimized**: Comprehensive SEO implementation with structured data and sitemaps

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router and Server Components
- **TypeScript** - Strict type checking enabled
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Shadcn/UI + Radix UI** - Modern, accessible component library (78+ components)
- **Framer Motion** - Smooth animations and transitions
- **React Query** - Server state management and caching

### Backend & Infrastructure
- **Firebase** - Backend-as-a-Service platform
  - **Firestore** - NoSQL database with comprehensive security rules
  - **Firebase Auth** - Email/password + Google OAuth authentication
  - **Firebase Functions** - Serverless functions for notifications and data processing
  - **Firebase Storage** - File storage with security rules
- **Google Cloud Build** - CI/CD pipeline with automated deployment
- **Docker** - Containerization for consistent deployments

### AI & Machine Learning
<<<<<<< Updated upstream
- **Pinecone** - Vector database for embeddings
- **Gemini** - AI chat interface and job matching
- **Custom Embeddings** - Semantic search and matching algorithms
=======
- **Pinecone** - Vector database for semantic job matching
- **Google Generative AI (Gemini)** - AI chat interface and job recommendations
- **Custom Embeddings** - Semantic search algorithms for job matching
- **Brevo** - Email service for transactional emails and notifications
>>>>>>> Stashed changes

### Development & Quality
- **ESLint** - Code linting with Next.js configuration
- **TypeScript** - Strict type checking and excellent type coverage
- **Bundle Analysis** - Custom webpack optimization and performance monitoring
- **Error Boundaries** - Comprehensive error handling throughout the app

## 📁 Project Structure

```
concoro/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages (signin, signup, reset-password)
│   │   ├── (main)/            # Main application pages (settings)
│   │   ├── (protected)/       # Protected routes requiring authentication
│   │   ├── api/               # API routes (sitemap, chat, contact, brevo)
│   │   ├── articolo/          # Blog article pages with dynamic routing
│   │   ├── blog/              # Blog listing and management
│   │   ├── concorsi/          # Job listings with SEO-optimized URLs
│   │   ├── notifiche/         # User notifications
│   │   └── ...                # Static pages (chi-siamo, contatti, etc.)
│   ├── components/            # React components (200+ components)
│   │   ├── auth/              # Authentication components
│   │   ├── bandi/             # Job listing components
│   │   ├── blog/              # Blog components
│   │   ├── chat/              # AI chat interface components
│   │   ├── concorsi/          # Concorso-specific components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components (navbar, footer, mobile nav)
│   │   ├── notifications/     # Notification components
│   │   ├── profile/           # User profile management
│   │   ├── settings/          # User settings components
│   │   └── ui/                # Reusable UI components (78+ components)
│   ├── lib/                   # Utility libraries
│   │   ├── firebase/          # Firebase configuration and utilities
│   │   ├── firebase-admin/    # Server-side Firebase admin
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Business logic services (Brevo, analytics)
│   │   └── utils/             # Helper functions and utilities
│   ├── types/                 # TypeScript type definitions
│   └── hooks/                 # Global React hooks
├── functions/                 # Firebase Cloud Functions
│   └── src/                   # TypeScript source for cloud functions
├── public/                    # Static assets and SEO files
│   ├── sitemap.xml           # Static sitemap
│   ├── robots.txt            # SEO robots file
│   └── ...                   # Images, icons, favicons
├── scripts/                   # Utility and optimization scripts
└── ...                       # Configuration files
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI
- Google Cloud SDK (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd concoro
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Firebase Setup**
   ```bash
   # Login to Firebase
   firebase login
   
   # Set up Firebase project
   firebase use --add
   ```

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # AI Services
   NEXT_PUBLIC_GOOGLE_API_KEY=your_google_ai_key
   GOOGLE_API_KEY=your_google_ai_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_pinecone_env
   
   # Firebase Admin (for server-side operations)
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
   
   # Email Services
   BREVO_API_KEY=your_brevo_api_key
   SMTP_EMAIL=your_smtp_email
   SMTP_PASSWORD=your_smtp_password
   
   # Analytics (optional)
   NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your_domain
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Deploy Firebase Functions** (optional)
   ```bash
   firebase deploy --only functions
   ```

## 🚀 Deployment

The application is configured for deployment on Google Cloud Platform using Cloud Build:

```bash
# Deploy to production
npm run build
firebase deploy
```

## 📱 Key Features

### User Management
- **Authentication**: Email/password and Google OAuth with email verification
- **Profile Management**: Comprehensive profiles with education, experience, skills, languages
- **Work Preferences**: Location, contract type, education level, preferred organizations
- **Notifications**: Email notifications for application deadlines with smart scheduling
- **Data Privacy**: GDPR-compliant data handling with cookie consent

### Job Discovery & Matching
- **Advanced Search**: Filter by location, category, requirements, deadline
- **AI-Powered Matching**: Pinecone vector search for personalized recommendations
- **Saved Jobs**: Bookmark and track favorite positions
- **SEO-Optimized URLs**: Clean, searchable URLs for better discoverability
- **Real-time Updates**: Live data from public sector job sources

### AI Assistant (Genio)
- **Chat Interface**: Interactive AI powered by Google Gemini
- **Career Guidance**: Personalized advice based on user profile
- **Job Analysis**: Smart matching based on requirements and qualifications
- **Multi-language Support**: Italian language optimization

### Content & SEO
- **Blog System**: Educational articles about public sector careers
- **Structured Data**: Rich snippets for job postings and breadcrumbs
- **Dynamic Sitemaps**: Automated sitemap generation for search engines
- **Performance Optimized**: Fast loading with image optimization and caching

### Technical Features
- **Mobile-First Design**: Responsive design with mobile navigation
- **Error Handling**: Comprehensive error boundaries and user-friendly error pages
- **Bundle Optimization**: Custom webpack configuration for optimal performance
- **Security**: Robust Firestore security rules and input validation

## 🔒 Security & Privacy

- **Data Protection**: GDPR compliant data handling with cookie consent banner
- **Secure Authentication**: Firebase Auth with email verification and Google OAuth
- **Firestore Security Rules**: Comprehensive access control with user ownership validation
- **Input Validation**: Server-side validation for all API endpoints
- **Privacy Controls**: User data management and deletion options
- **Secure Headers**: CSRF protection and secure cookie handling

## 🛠 Development Guidelines

### Code Quality
- **TypeScript**: Strict type checking with excellent type coverage
- **ESLint**: Next.js ESLint configuration with custom rules
- **Component Architecture**: 200+ well-organized components with clear separation
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Performance**: Bundle optimization with custom webpack configuration

### Code Standards
- **Consistent Naming**: Clear naming conventions across all components
- **Modular Architecture**: Well-separated concerns between UI, business logic, and data
- **Accessibility**: Radix UI components with proper ARIA attributes
- **Mobile-First**: Responsive design patterns throughout the application

### Performance Optimization
- **Bundle Splitting**: Custom webpack configuration for optimal chunk sizes
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Caching Strategy**: Strategic caching for API responses and static content
- **Code Splitting**: Route-based and feature-based code splitting
- **Bundle Analysis**: Regular monitoring with custom analysis scripts

### Development Scripts
```bash
# Development
npm run dev                 # Start development server
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Run ESLint

# Data Management
npm run upload-jobs        # Upload job data to Firebase
npm run delete-concorsi    # Clean up expired concorsi
npm run generate-slugs     # Generate SEO-friendly slugs

# Performance
npm run analyze-bundle     # Full bundle analysis
npm run check-bundle       # Quick bundle check
npm run optimize-images    # Optimize images
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For technical support or questions about the platform:
- Email: info@concoro.it


## 🗺 Roadmap

### Upcoming Features
- [ ] **Testing Framework**: Jest + React Testing Library implementation
- [ ] **E2E Testing**: Playwright or Cypress for end-to-end testing
- [ ] **API Documentation**: OpenAPI/Swagger documentation
- [ ] **Error Monitoring**: Sentry integration for error tracking
- [ ] **Advanced Analytics**: Enhanced user behavior tracking
- [ ] **Mobile App**: React Native mobile application
- [ ] **Employer Portal**: Organization management interface

### Recently Completed ✅
- ✅ **Comprehensive SEO Implementation**: Structured data, sitemaps, canonical URLs
- ✅ **AI Chat Interface**: Google Gemini-powered job assistant
- ✅ **Enhanced User Profiles**: Comprehensive profile management
- ✅ **Email Notifications**: Brevo integration with smart scheduling
- ✅ **Performance Optimization**: Bundle splitting and image optimization
- ✅ **Security Hardening**: Comprehensive Firestore rules and validation
- ✅ **Mobile-First Design**: Responsive design with mobile navigation
- ✅ **Error Handling**: User-friendly error boundaries and pages

### Technical Debt & Improvements
- [ ] **Testing Coverage**: Currently no test files - high priority
- [ ] **Documentation**: API documentation and component stories
- [ ] **Monitoring**: Performance and error monitoring setup
- [ ] **Bundle Analysis**: Automated bundle size monitoring

---

## 📊 Project Health

**Overall Grade: A- (8.5/10)** 🎉

### Strengths
- ✅ **Excellent Architecture**: Well-structured Next.js application
- ✅ **Strong Security**: Comprehensive authentication and data protection
- ✅ **Outstanding SEO**: Production-ready SEO implementation
- ✅ **Performance Optimized**: Custom webpack configuration and caching
- ✅ **Professional Quality**: Production-ready codebase

### Areas for Improvement
- ⚠️ **Testing**: No testing framework implemented yet
- ⚠️ **Monitoring**: Error tracking and performance monitoring needed
- ⚠️ **Documentation**: API documentation could be enhanced

---

**Built with ❤️ for the Italian public sector community** 
