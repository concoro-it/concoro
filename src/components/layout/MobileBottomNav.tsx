import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bookmark, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProfileIconProps {
  photoURL?: string | null;
  isActive: boolean;
}

function ProfileIcon({ photoURL, isActive }: ProfileIconProps) {
  if (photoURL) {
    return (
      <div className={cn(
        "relative w-6 h-6 mb-1 rounded-full overflow-hidden border",
        isActive 
          ? "border-primary" 
          : "border-gray-200"
      )}>
        <Image
          src={photoURL}
          alt="Profile"
          fill
          className="object-cover"
        />
      </div>
    );
  }
  
  return (
    <div className={cn(
      "w-6 h-6 mb-1 rounded-full flex items-center justify-center bg-gray-100",
      isActive 
        ? "text-primary border border-primary" 
        : "text-gray-500"
    )}>
      <User className="w-4 h-4" />
    </div>
  );
}

// Custom Bookmark icon component with fixed positioning
function BookmarkIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center w-6 h-6 mb-1">
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "stroke-2",
          isActive ? "text-primary" : "text-gray-500"
        )}
      >
        <path 
          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-[100] w-full h-16 bg-white border-t border-gray-200 rounded-t-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full grid-cols-4 mx-auto">
        {/* Bandi */}
        <Link
          href="/bandi"
          className={cn(
            "flex flex-col items-center justify-center h-full",
            pathname === '/bandi' || pathname.startsWith('/bandi/')
              ? "text-primary"
              : "text-gray-500"
          )}
          aria-label="Bandi e avvisi"
        >
          <div className="h-8 w-8 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Bandi</span>
        </Link>

        {/* Salvati */}
        <Link
          href="/saved-concorsi"
          className={cn(
            "flex flex-col items-center justify-center h-full",
            pathname === '/saved-concorsi'
              ? "text-primary"
              : "text-gray-500"
          )}
          aria-label="Concorsi salvati"
        >
          <div className="h-8 w-8 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Salvati</span>
        </Link>

        {/* Genio AI */}
        <Link
          href="/chat"
          className={cn(
            "flex flex-col items-center justify-center h-full",
            pathname === '/chat'
              ? "text-primary"
              : "text-gray-500"
          )}
          aria-label="Genio AI assistente"
        >
          <div className="h-8 w-8 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Genio AI</span>
        </Link>

        {/* Profilo */}
        <Link
          href={user ? "/profile" : "/signin"}
          className={cn(
            "flex flex-col items-center justify-center h-full",
            pathname === '/profile'
              ? "text-primary"
              : "text-gray-500"
          )}
          aria-label="Profilo utente"
        >
          <div className="h-8 w-8 flex items-center justify-center">
            {user?.photoURL ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <span className="text-xs font-medium">Profilo</span>
        </Link>
      </div>
    </div>
  );
} 