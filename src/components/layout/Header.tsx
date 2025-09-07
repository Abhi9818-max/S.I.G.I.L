

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Settings, ListChecks, Menu as MenuIcon, AppWindow, Award, Sparkles, Server, BarChart2, Share2, Trophy, Target, ShieldCheck, LogOut, Users, Star, Gem, LucideProps, Timer, StickyNote, Mail, Hourglass, Check, X, Bell, User as UserIcon, Heart, Swords, Activity, MessageSquare, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LevelIndicator from './LevelIndicator'; 
import { useUserRecords } from '@/components/providers/UserRecordsProvider'; 
import type { UserLevelInfo, FriendRequest, RelationshipProposal, AllianceInvitation, AllianceChallenge, Notification } from '@/types'; 
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar as AvatarPrimitive, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LevelDetailsModal from './LevelDetailsModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAlliance } from '@/components/providers/AllianceProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

// Simple hash function to get a number from a string for consistent default avatars
const simpleHash = (s: string) => {
    let hash = 0;
    if (s.length === 0) return hash;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

interface HeaderProps {
  onAddRecordClick: () => void;
  onManageTasksClick: () => void;
}

type NavLink = {
  href: string;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
};

type MobileMenuLink = (NavLink & { isSeparator?: never }) | { isSeparator: true; href?: never; label?: never; icon?: never };


const Header: React.FC<HeaderProps> = ({ onAddRecordClick, onManageTasksClick }) => {
  const { getUserLevelInfo } = useUserRecords(); 
  const { user, userData, logout } = useAuth();
  
  const [isLevelDetailsModalOpen, setIsLevelDetailsModalOpen] = useState(false);
  const pathname = usePathname();
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      const info = getUserLevelInfo();
      setLevelInfo(info);
    } catch (error) {
      console.error('Error getting level info:', error);
      setLevelInfo(null);
    }
  }, [getUserLevelInfo]);
  
  const isHomePage = pathname === '/';

  // Hide header on non-home pages on mobile for a more app-like feel with bottom nav
  if (isMobile && !isHomePage) {
    return null;
  }

  const headerTierClass = levelInfo ? `header-tier-group-${levelInfo.tierGroup}` : 'header-tier-group-1';
  
  const navLinks: NavLink[] = [
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/alliances", label: "Alliances", icon: ShieldCheck },
    { href: "/todo", label: "Pacts", icon: ListChecks },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/reputation", label: "Reputation", icon: Users },
  ];

  const mobileMenuLinks: MobileMenuLink[] = [
    { href: "/timer", label: "Timer", icon: Timer },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { isSeparator: true },
    { href: "/reputation", label: "Reputation", icon: Users },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/constellations", label: "Constellations", icon: Sparkles },
    { href: "/tiers", label: "Tiers", icon: Star },
  ];

  const userAvatar = userData?.photoURL || getAvatarForId(user?.uid || '');

  return (
    <>
      <header className={cn("py-3 px-4 md:px-6 sticky top-0 z-50 transition-colors duration-500 backdrop-blur-md border-b border-border/50", headerTierClass)}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <TrendingUp className="h-7 w-7" />
              <h1 className="text-xl font-semibold hidden sm:block">S.I.G.I.L.</h1>
            </Link>
          </div>
          
          <div className="flex-shrink-0 mx-2 sm:mx-4"> 
             <button 
              onClick={() => setIsLevelDetailsModalOpen(true)}
              className="p-1 rounded-md hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="View level details"
            >
              <LevelIndicator levelInfo={levelInfo} />
            </button>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  href={link.href}
                  key={link.href}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 px-3 py-2 text-sm font-medium ring-offset-background transition-all hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border"
                  )}
                >
                  <link.icon className="mr-1.5 h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
            
            {isHomePage && (
              <>
                <Button onClick={onManageTasksClick} variant="ghost" size="sm">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Manage Tasks
                </Button>
                <Button onClick={onAddRecordClick} variant="default" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <AvatarPrimitive className="h-9 w-9">
                      <AvatarImage src={userAvatar} alt={userData?.username}/>
                      <AvatarFallback>
                        {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </AvatarPrimitive>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href="/constellations" className="flex items-center w-full">
                        <Sparkles className="mr-2 h-4 w-4" /> Constellations
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/tiers" className="flex items-center w-full">
                        <Star className="mr-2 h-4 w-4" /> Tiers
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/timer" className="flex items-center w-full">
                        <Timer className="mr-2 h-4 w-4" /> Timer
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/insights" className="flex items-center w-full">
                        <BarChart2 className="mr-2 h-4 w-4" /> Insights
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center w-full text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isHomePage && (
                  <>
                    <DropdownMenuItem onClick={onManageTasksClick} className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddRecordClick} className="flex items-center w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Record
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {mobileMenuLinks.map((link, index) => {
                  if (link.isSeparator) {
                    return <DropdownMenuSeparator key={`sep-${index}`} />;
                  }
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href!} className="flex items-center w-full">
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center w-full text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <LevelDetailsModal
        isOpen={isLevelDetailsModalOpen}
        onOpenChange={setIsLevelDetailsModalOpen}
        levelInfo={levelInfo}
      />
    </>
  );
};

export default Header;
