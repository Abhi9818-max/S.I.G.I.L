
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Settings, ListChecks, Menu as MenuIcon, AppWindow, Award, Sparkles, Server, BarChart2, Share2, Trophy, Target, ShieldCheck, LogOut, Users, Star, Gem, LucideProps, Timer, StickyNote, Mail, Hourglass, Check, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LevelIndicator from './LevelIndicator'; 
import { useUserRecords } from '@/components/providers/UserRecordsProvider'; 
import type { UserLevelInfo, FriendRequest, RelationshipProposal, AllianceInvitation, AllianceChallenge } from '@/types'; 
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

const RequestsPopover = ({
    incomingRequests,
    incomingRelationshipProposals,
    incomingAllianceInvitations,
    incomingAllianceChallenges,
    onAcceptFriend,
    onDeclineFriend,
    onAcceptRelationship,
    onDeclineRelationship,
    onAcceptAllianceInvite,
    onDeclineAllianceInvite,
    onAcceptAllianceChallenge,
    onDeclineAllianceChallenge,
}: any) => (
    <PopoverContent className="w-80" align="end">
        <ScrollArea className="h-96">
        <div className="p-4 space-y-4">
            <h4 className="font-medium leading-none">Incoming Requests</h4>
            <Separator />
             {incomingRequests.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Friend Requests</h5>
                    {incomingRequests.map((req: FriendRequest) => (
                         <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                             <div className="flex items-center gap-2">
                                 <AvatarPrimitive className="h-8 w-8"><AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)}/><AvatarFallback>{req.senderUsername.charAt(0)}</AvatarFallback></AvatarPrimitive>
                                 <span className="text-sm font-medium">{req.senderUsername}</span>
                             </div>
                             <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptFriend(req)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineFriend(req.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
             )}
              {incomingRelationshipProposals.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Relationship Proposals</h5>
                    {incomingRelationshipProposals.map((prop: RelationshipProposal) => (
                         <div key={prop.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                             <div className="flex items-center gap-2">
                                 <Heart className="h-4 w-4 text-pink-400"/><span className="text-sm font-medium">{prop.senderUsername} wants to be your {prop.correspondingRelationship}.</span>
                             </div>
                             <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptRelationship(prop)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineRelationship(prop.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingAllianceInvitations.length > 0 && (
                 <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Alliance Invitations</h5>
                     {incomingAllianceInvitations.map((invite: AllianceInvitation) => (
                         <div key={invite.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                 <ShieldCheck className="h-4 w-4 text-cyan-400"/><span className="text-sm font-medium">Invite to {invite.allianceName} from {invite.senderUsername}</span>
                            </div>
                            <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptAllianceInvite(invite)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineAllianceInvite(invite.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingAllianceChallenges.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Alliance Challenges</h5>
                    {incomingAllianceChallenges.map((challenge: AllianceChallenge) => (
                         <div key={challenge.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Swords className="h-4 w-4 text-red-500"/><span className="text-sm font-medium">{challenge.challengerAllianceName} challenges you!</span>
                            </div>
                            <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptAllianceChallenge(challenge)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineAllianceChallenge(challenge.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingRequests.length === 0 && incomingRelationshipProposals.length === 0 && incomingAllianceInvitations.length === 0 && incomingAllianceChallenges.length === 0 && (
                <p className="text-xs text-center text-muted-foreground p-2">No incoming requests.</p>
              )}
        </div>
        </ScrollArea>
    </PopoverContent>
);


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
  const { 
    acceptFriendRequest, 
    declineFriendRequest,
    incomingRequests, 
    acceptRelationshipProposal, 
    declineRelationshipProposal,
    incomingRelationshipProposals,
  } = useFriends();
  const {
    acceptAllianceInvitation,
    declineAllianceInvitation,
    incomingAllianceInvitations,
    acceptAllianceChallenge,
    declineAllianceChallenge,
    incomingAllianceChallenges
  } = useAlliance();

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
  
  const allRequestsCount = incomingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length + incomingAllianceChallenges.length;

  const navLinks: NavLink[] = [
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/alliances", label: "Alliances", icon: ShieldCheck },
    { href: "/todo", label: "Pacts", icon: ListChecks },
    { href: "/timer", label: "Timer", icon: Timer },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/reputation", label: "Reputation", icon: Users },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/constellations", label: "Constellations", icon: Sparkles },
    { href: "/tiers", label: "Tiers", icon: Star },
  ];

  const mobileMenuLinks: MobileMenuLink[] = [
    ...navLinks,
    { isSeparator: true },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const userAvatar = userData?.photoURL || getAvatarForId(user?.uid);

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
            {navLinks.map(link => (
              <Button asChild key={link.href} variant={pathname === link.href ? "secondary" : "ghost"} size="sm">
                <Link href={link.href}>
                  <link.icon className="mr-1.5 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
            
            {isHomePage && (
              <>
                <Button onClick={onManageTasksClick} variant="ghost" size="sm">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Manage Tasks
                </Button>
                <Button onClick={onAddRecordClick} variant="secondary" size="sm">
                  Add Record
                </Button>
              </>
            )}

            <Popover>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5"/>
                      {allRequestsCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{allRequestsCount}</Badge>}
                  </Button>
              </PopoverTrigger>
              <RequestsPopover 
                  incomingRequests={incomingRequests}
                  incomingRelationshipProposals={incomingRelationshipProposals}
                  incomingAllianceInvitations={incomingAllianceInvitations}
                  incomingAllianceChallenges={incomingAllianceChallenges}
                  onAcceptFriend={acceptFriendRequest}
                  onDeclineFriend={declineFriendRequest}
                  onAcceptRelationship={acceptRelationshipProposal}
                  onDeclineRelationship={declineRelationshipProposal}
                  onAcceptAllianceInvite={acceptAllianceInvitation}
                  onDeclineAllianceInvite={declineAllianceInvitation}
                  onAcceptAllianceChallenge={acceptAllianceChallenge}
                  onDeclineAllianceChallenge={declineAllianceChallenge}
              />
            </Popover>

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
                 <DropdownMenuItem onClick={() => setIsLevelDetailsModalOpen(true)} className="flex items-center w-full">
                  <Award className="mr-2 h-4 w-4" />
                  View Level Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {isHomePage && (
                  <>
                    <DropdownMenuItem onClick={onManageTasksClick} className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddRecordClick} className="flex items-center w-full">
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
