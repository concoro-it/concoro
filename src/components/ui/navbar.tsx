"use client";

import { Book, Menu, Sunset, Trees, Sparkles, Settings, User, HelpCircle, LogOut, Search, MapPin, Bell, Bookmark, X, ChevronDown } from "lucide-react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, Suspense } from "react";
import { auth } from "@/lib/firebase/config";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterPopover } from "@/components/jobs/FilterPopover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { NotificationsDropdown } from "@/components/notifications";
import { DynamicLogo } from "@/components/ui/dynamic-logo";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: JSX.Element;
  items?: MenuItem[];
}

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  auth?: {
    login: {
      text: string;
      url: string;
    };
    signup: {
      text: string;
      url: string;
    };
  };
}

const defaultProps: NavbarProps = {
  logo: {
    url: "/",
    src: "/concoro.svg",
    alt: "Concoro",  
  },
  menu: [
  ],
  mobileExtraLinks: [
    { name: "Termini", url: "/terms" },
    { name: "Privacy", url: "/privacy" },
    { name: "Aiuto", url: "/help" },
    { name: "Mappa del Sito", url: "/sitemap" },
  ],
  auth: {
    login: { text: "Accedi", url: "/signin" },
    signup: { text: "Registrati gratuitamente", url: "/signup" },
  },
};

// Simple inline implementation of useClickOutside hook
function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Italian locations for the filter
const italianLocations = [
  "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", 
  "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina", "Padova", 
  "Trieste", "Brescia", "Parma", "Modena", "Reggio Emilia", "Perugia"
].map(location => ({
  label: location,
  value: location
}));

const Navbar = (props: NavbarProps) => {
  const { logo, menu, mobileExtraLinks, auth: authProps } = { ...defaultProps, ...props };
  // Use centralized auth from useAuth hook instead of managing separate state
  const { user: currentUser, loading: isAuthLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // Check for initial search params when component mounts
  useEffect(() => {
    if (searchParams) {
      const q = searchParams.get("q");
      const location = searchParams.get("location");
      
      if (q) setSearchTerm(q);
      if (location) setSelectedLocations([location]);
    }
  }, [searchParams]);

  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.append('q', searchTerm);
    }
    
    if (selectedLocations.length > 0) {
      // For FilterPopover compatibility, we need to handle multiple locations
      selectedLocations.forEach(loc => {
        params.append('location', loc);
      });
    }
    
    // Navigate to search results
    router.push(`/bandi${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Handle location filter change
  const handleLocationChange = (locations: string[]) => {
    setSelectedLocations(locations);
    
    // If we're already on the bandi page, update the search immediately
    if (pathname === '/bandi') {
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('q', searchTerm);
      }
      
      if (locations.length > 0) {
        locations.forEach(loc => {
          params.append('location', loc);
        });
      }
      
      router.push(`/bandi${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  // Clear search inputs
  const clearSearch = () => {
    setSearchTerm('');
    setSelectedLocations([]);
    
    // If we're on the bandi page, clear the search params
    if (pathname === '/bandi') {
      router.push('/bandi');
    }
  };

  // Handle keydown for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch user profile when currentUser changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser && !isAuthLoading) {
        try {
          if (!db) {
            console.error('[Navbar] Firestore is not initialized');
            return;
          }
          const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
          const profileSnap = await getDoc(userProfileRef);
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data() as UserProfile);
          } else {
            console.warn('[Navbar] No user profile found for user:', currentUser.uid);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('[Navbar] Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    // Only fetch when we have a current user and auth is not loading
    if (!isAuthLoading) {
      fetchUserProfile();
    }
  }, [currentUser, isAuthLoading]); // Depend on both currentUser and loading state

  const handleLogout = async () => {
    if (isLoggingOut) {
      
      return;
    }
    
    
    try {
      setIsLoggingOut(true);
      
      await signOut();
      
      
      // Force clear any auth state
      setUserProfile(null);
      
      // Add a small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use replace instead of push to prevent back navigation
      router.replace('/');
      
      
      toast.success("Logout effettuato con successo");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Errore durante il logout. Riprova.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    const firstInitial = firstName?.charAt(0) || "";
    const lastInitial = lastName?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase().trim() || "U";
  };

  if (isAuthLoading) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-2">
              <DynamicLogo
                lightSrc="/concoro-logo-light.svg"
                darkSrc="/concoro-logo-dark.svg"
                alt="Concoro"
                width={147}
                height={33}
                priority
              />
            </div>
            <div className="animate-pulse h-8 w-8 rounded-full bg-muted"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="hidden justify-between lg:flex lg:flex-1">
          <div className="flex items-center">
            <Link href={currentUser ? "/dashboard" : (logo?.url || "/")} className="flex items-center">
              <DynamicLogo
                lightSrc="/concoro-logo-light.svg"
                darkSrc="/concoro-logo-dark.svg"
                alt="Concoro"
                width={147}
                height={33}
                priority
              />
            </Link>
          </div>
          
          {currentUser ? (
            <>
              <div className="flex-1" />
              
              <div className="flex items-center gap-2">
                <Button variant="link" asChild>
                    <a href="/bandi">
                    Bandi
                      <Search className="w-4 h-4 ml-2" />
                    </a>
                </Button>

                <Button variant="link" asChild>
                <a href="/saved-concorsi">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Salvati
                    </a>
                </Button>
                <NotificationsDropdown />
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:link-none">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={userProfile?.profilePicture || currentUser?.photoURL || "/default-avatar.png"} 
                        alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'} 
                        onError={(e) => {
                          const imgElement = e.currentTarget as HTMLImageElement;
                          imgElement.onerror = null; // Prevent infinite loop
                          imgElement.src = "/default-avatar.png";
                        }}
                      />
                      <AvatarFallback className="bg-brand text-white">
                        {getInitials(userProfile?.firstName, userProfile?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email || ''}</p>
                      </div>
                    </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center transition-colors hover:text-brand">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profilo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center transition-colors hover:text-brand">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Impostazioni</span>
                    </Link>
                  </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Esci</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <NavigationMenu.Root className="relative">
                <NavigationMenu.List className="flex flex-row gap-2">
                  {menu?.map((item) => (
                    <NavigationMenu.Item key={item.title}>
                      {item.items ? (
                        <NavigationMenu.Trigger asChild>
                          <Button
                            variant="ghost"
                            className="h-10 w-max"
                          >
                            {item.title}
                          </Button>
                        </NavigationMenu.Trigger>
                      ) : (
                        <NavigationMenu.Link asChild>
                          <Button
                            variant="ghost"
                            className="h-10 w-max"
                            asChild
                          >
                            <Link href={item.url}>
                              {item.title}
                            </Link>
                          </Button>
                        </NavigationMenu.Link>
                      )}

                      {item.items && (
                        <NavigationMenu.Content className="absolute top-full left-0 mt-2 w-full rounded-md border bg-background p-2 shadow-lg data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:w-auto">
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items.map((subItem) => (
                              <li key={subItem.title}>
                                <NavigationMenu.Link asChild>
                                  <Link
                                    href={subItem.url}
                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="flex items-center gap-2">
                                      {subItem.icon}
                                      <div className="text-sm font-medium leading-none">
                                        {subItem.title}
                                      </div>
                                    </div>
                                    <p className="line-clamp-2 mt-1 text-sm leading-snug text-muted-foreground">
                                      {subItem.description}
                                    </p>
                                  </Link>
                                </NavigationMenu.Link>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenu.Content>
                      )}
                    </NavigationMenu.Item>
                  ))}
                </NavigationMenu.List>
              </NavigationMenu.Root>
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href={authProps?.login.url || "/signin"}>
                    {authProps?.login.text || "Accedi"}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={authProps?.signup.url || "/signup"}>
                    {authProps?.signup.text || "Registrati gratuitamente"}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-between lg:hidden">
          <Link href={currentUser ? "/dashboard" : (logo?.url || "/")} className="flex items-center gap-2">
            <DynamicLogo
              lightSrc="/concoro-logo-light.svg"
              darkSrc="/concoro-logo-dark.svg"
              alt="Concoro"
              width={147}
              height={33}
              priority
            />
          </Link>
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link 
                href="/bandi"
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Bandi e avvisi"
              >
                <Search className="h-5 w-5 mobile-hide-search-icon" />
              </Link>
              <NotificationsDropdown className="lg:hidden" />
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={userProfile?.profilePicture || currentUser?.photoURL || "/default-avatar.png"} 
                      alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'} 
                      onError={(e) => {
                        const imgElement = e.currentTarget as HTMLImageElement;
                        imgElement.onerror = null; // Prevent infinite loop
                        imgElement.src = "/default-avatar.png";
                      }}
                    />
                    <AvatarFallback className="bg-brand text-white">
                      {getInitials(userProfile?.firstName, userProfile?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="flex items-center justify-start gap-2 mb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email || ''}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/bandi" className="flex items-center transition-colors hover:text-brand">
                      <Search className="mr-2 h-4 w-4" />
                      <span>Bandi</span>
                    </Link>
                  </DropdownMenuItem>

              
                  <DropdownMenuItem asChild>
                    <Link href="/saved-concorsi" className="flex items-center transition-colors hover:text-brand">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Salvati</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center transition-colors hover:text-brand">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profilo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center transition-colors hover:text-brand">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Impostazioni</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-center transition-colors hover:text-brand">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Aiuto</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Esci</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed inset-y-0 right-0 z-50 h-full w-full border-l bg-background p-6 shadow-lg data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-semibold">
                        Menu
                      </Dialog.Title>
                      <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="sr-only">Close</span>
                      </Dialog.Close>
                    </div>
                    <Accordion.Root type="single" collapsible>
                      {menu?.map((item, index) => (
                        <Accordion.Item
                          key={item.title}
                          value={item.title}
                          className={cn(
                            "border-b py-4",
                            index === 0 && "border-t"
                          )}
                        >
                          {item.items ? (
                            <>
                              <Accordion.Trigger className="flex w-full items-center justify-between py-1 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180">
                                {item.title}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </Accordion.Trigger>
                              <Accordion.Content className="overflow-hidden pt-2 text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                                <div className="flex flex-col gap-2 pl-1">
                                  {item.items.map((subItem) => (
                                    <a
                                      key={subItem.title}
                                      href={subItem.url}
                                      className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                      {subItem.icon}
                                      <span>{subItem.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </Accordion.Content>
                            </>
                          ) : (
                            <a
                              href={item.url}
                              className="flex w-full items-center justify-between py-1 text-sm font-medium transition-all hover:underline"
                            >
                              {item.title}
                            </a>
                          )}
                        </Accordion.Item>
                      ))}
                    </Accordion.Root>
                    <div className="grid grid-cols-2 gap-2">
                      {mobileExtraLinks?.map((link) => (
                        <a
                          key={link.name}
                          href={link.url}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {link.name}
                        </a>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" asChild>
                        <Link href={authProps?.login.url || "/signin"}>
                          {authProps?.login.text || "Accedi"}
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href={authProps?.signup.url || "/signup"}>
                          {authProps?.signup.text || "Registrati gratuitamente"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </div>
      </div>
    </nav>
  );
};

// Wrapper component to handle Suspense boundary for useSearchParams
const NavbarWithSuspense = (props: NavbarProps) => {
  return (
    <Suspense fallback={<div className="h-16 bg-background border-b" />}>
      <Navbar {...props} />
    </Suspense>
  );
};

export { Navbar, NavbarWithSuspense };
export default NavbarWithSuspense; 