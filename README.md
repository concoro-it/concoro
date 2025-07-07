# Concoro - Italian Public Competition Job Platform

Concoro is a modern web application designed to help Italian professionals discover and apply for public sector job competitions ("concorsi pubblici"). The platform uses AI to match users with relevant opportunities and provides personalized recommendations.

## 🎯 Project Overview

Concoro serves as a comprehensive platform for:
- **Job Discovery**: Browse and search through Italian public sector job competitions
- **AI-Powered Matching**: Get personalized job recommendations based on your profile
- **Career Management**: Track applications, save favorite positions, and manage your career profile
- **Educational Content**: Access blog articles and resources about public sector careers
- **Real-time Updates**: Receive notifications about new opportunities and application deadlines

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Modern component library
- **React Query** - Data fetching and state management

### Backend & Infrastructure
- **Firebase** - Backend-as-a-Service platform
  - **Firestore** - NoSQL database for user data and job listings
  - **Firebase Auth** - User authentication and authorization
  - **Firebase Functions** - Serverless backend logic
  - **Firebase Storage** - File storage for user uploads
- **Google Cloud Build** - CI/CD pipeline
- **Docker** - Containerization for deployment

### AI & Machine Learning
- **Pinecone** - Vector database for embeddings
- **OpenAI GPT** - AI chat interface and job matching
- **Custom Embeddings** - Semantic search and matching algorithms

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **npm** - Package management

## 📁 Project Structure

```
concoro/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (main)/            # Main application pages
│   │   ├── api/               # API routes
│   │   ├── bandi/             # Job listings pages
│   │   ├── blog/              # Blog functionality
│   │   ├── chat/              # AI chat interface
│   │   └── dashboard/         # User dashboard
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── bandi/             # Job listing components
│   │   ├── blog/              # Blog components
│   │   ├── chat/              # Chat components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── ui/                # Reusable UI components
│   │   └── profile/           # User profile components
│   ├── lib/                   # Utility libraries
│   │   ├── firebase/          # Firebase configuration
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Helper functions
│   ├── types/                 # TypeScript type definitions
│   └── hooks/                 # Global React hooks
├── functions/                 # Firebase Cloud Functions
├── public/                    # Static assets
└── scripts/                   # Utility scripts
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
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_pinecone_env
   
   # Firebase Admin (for server-side operations)
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
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
- **Authentication**: Email/password and social login
- **Profile Management**: Educational background, work experience, skills
- **Preferences**: Job type, location, salary expectations
- **Notifications**: Email and in-app notifications for new opportunities

### Job Discovery
- **Advanced Search**: Filter by location, category, requirements
- **AI Matching**: Personalized job recommendations
- **Saved Jobs**: Bookmark interesting positions
- **Application Tracking**: Monitor application status

### AI Assistant
- **Chat Interface**: Ask questions about job opportunities
- **Career Advice**: Get personalized career guidance
- **Document Analysis**: Upload and analyze job requirements

### Content Management
- **Blog System**: Articles about public sector careers
- **Resource Library**: Guides and tips for job applications
- **FAQ Section**: Common questions and answers

## 🔒 Security & Privacy

- **Data Protection**: GDPR compliant data handling
- **Secure Authentication**: Firebase Auth with security rules
- **Privacy Controls**: User data management and deletion options
- **Firestore Security Rules**: Strict access control for user data

## 🛠 Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code quality rules
- **Component Structure**: Consistent naming and organization
- **Git Workflow**: Feature branches with pull request reviews

### Testing
- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for API endpoints

### Performance
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Strategic caching for static content
- **Bundle Analysis**: Regular bundle size monitoring

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
- Email: support@concoro.it
- Documentation: [Internal Wiki]
- Issue Tracking: GitHub Issues

## 🗺 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with more job sources
- [ ] Enhanced AI recommendations
- [ ] Multi-language support
- [ ] Employer portal

### Recent Updates
- ✅ AI chat interface
- ✅ Enhanced user profiles
- ✅ Improved job matching algorithm
- ✅ Mobile-responsive design
- ✅ Real-time notifications

---

**Built with ❤️ for the Italian public sector community** 