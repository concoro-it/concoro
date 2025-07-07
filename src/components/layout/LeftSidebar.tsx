import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { Settings, Briefcase, Sparkles, User, Bookmark, Bell } from 'lucide-react';
import type { UserProfile } from '@/types';

export default function LeftSidebar() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && db) {
        try {
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          const profileSnap = await getDoc(userProfileRef);
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const quickLinks = [
    { icon: User, label: 'Profilo', href: '/profile' },
    { icon: Bookmark, label: 'Concorsi Salvati', href: '/saved-concorsi' },
    { icon: Bell, label: 'Preferenze Lavorative', href: '/preferenze-lavorative' },
    { icon: Settings, label: 'Impostazioni', href: '/settings' },
  ];

  return (
    <div className="hidden md:block space-y-6">
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="relative h-24 rounded-t-lg" style={{ 
          backgroundImage: "url('/left-sidebar.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          <img
            src={userProfile?.profilePicture || user?.photoURL || '/placeholder-avatar.png'}
            alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'}
            className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white"
          />
        </div>
        <div className="p-4 pt-8">
          <h2 className="font-semibold text-lg">
            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Guest'}
          </h2>
          {userProfile?.jobTitle && (
            <p className="text-sm text-gray-600 mt-1">{userProfile.jobTitle}</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 space-y-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
            >
              <link.icon className="h-5 w-5" />
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Post Job Button */}
      <Link href="/chat" className="w-full bg-white rounded-lg shadow p-4 flex items-center gap-3 text-gray-600 hover:text-blue-600">
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-medium">Chiedi a Genio</span>
      </Link>
    </div>
  );
} 