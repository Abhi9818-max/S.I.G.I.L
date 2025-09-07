
"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useAlliance } from '@/components/providers/AllianceProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowRight, Swords, Search, PlusCircle, Check, X, ShieldCheck, Pin, PinOff, Download, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alliance, AllianceChallenge, AllianceMember, UserData } from '@/types';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isPast, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
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
}

const getAllianceImage = (alliance: Alliance & { members: AllianceMember[] }) => {
    if (alliance.photoURL) return alliance.photoURL;
    const avatarNumber = (simpleHash(alliance.id) % 21) + 1;
    return `/alliances/alliance${avatarNumber}.jpeg`;
}

const ChallengeDialog = ({
  isOpen,
  onOpenChange,
  myAlliances,
  challengedAlliance,
  onConfirmChallenge,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  myAlliances: Alliance[];
  challengedAlliance: Alliance | null;
  onConfirmChallenge: (challenger: Alliance) => void;
}) => {
  if (!challengedAlliance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge {challengedAlliance.name}</DialogTitle>
          <DialogDescription>
            Select which of your alliances will issue the challenge.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {myAlliances.length > 0 ? (
              myAlliances.map((alliance) => (
                <button
                  key={alliance.id}
                  onClick={() => onConfirmChallenge(alliance)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-4"
                >
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                      src={getAllianceImage(alliance as Alliance & { members: AllianceMember[] })}
                      alt={alliance.name}
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{alliance.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alliance.memberIds.length} members
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">
                You do not have any alliances you created to send a challenge
                from.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


const AllianceCard3D = ({ alliance }: { alliance: Alliance & { members: AllianceMember[] } }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isEnded = isPast(parseISO(alliance.endDate));
    const isObjectiveMet = alliance.progress >= alliance.target;
    const isFailed = isEnded && !isObjectiveMet;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const rotateX = (y / height - 0.5) * -10;
        const rotateY = (x / width - 0.5) * 10;
        cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
        cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.setProperty('--rotate-x', '0deg');
        cardRef.current.style.setProperty('--rotate-y', '0deg');
    };

    return (
        <div 
            ref={cardRef} 
            className="card-3d w-[261px] h-[348px] flex-shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <Link href={`/alliances/${alliance.id}`} className="block w-full h-full card-3d-content overflow-hidden rounded-lg group hover:shadow-2xl">
                <Card className="w-full h-full border-0 rounded-lg">
                    <div className="relative w-full h-full">
                        <Image 
                            src={getAllianceImage(alliance)}
                            alt={alliance.name} 
                            fill 
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isFailed && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                <XCircle className="h-24 w-24 text-red-500/80" strokeWidth={1.5} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent/20" />
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                             <CardTitle className="text-lg text-shadow">{alliance.name}</CardTitle>
                             <div className="flex items-center mt-2 -space-x-2">
                                {alliance.members.slice(0, 4).map(member => (
                                    <Avatar key={member.uid} className="h-6 w-6 border-2 border-background">
                                        <AvatarImage src={getAvatarForId(member.uid, member.photoURL)} />
                                        <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ))}
                                {alliance.members.length > 4 && (
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarFallback className="text-xs">+{alliance.members.length - 4}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>
         </div>
    );
};

export default function AlliancesPage() {
  const { user, userData } = useAuth();
  const { userAlliances, searchAlliances, sendAllianceChallenge } = useAlliance();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Alliance[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [challengedAlliance, setChallengedAlliance] = useState<Alliance | null>(null);

  const { pinned, unpinned, completed, myCreatedAlliances } = useMemo(() => {
    const pinnedIds = new Set(userData?.pinnedAllianceIds || []);
    const alliancesWithMemberData = userAlliances.map(alliance => ({
      ...alliance,
      members: alliance.members || [],
    }));

    const activeAlliances = alliancesWithMemberData.filter(a => a.status === 'ongoing');
    const completedAlliances = alliancesWithMemberData.filter(a => a.status !== 'ongoing');

    const pinned = activeAlliances.filter(a => pinnedIds.has(a.id));
    const unpinned = activeAlliances.filter(a => !pinnedIds.has(a.id));
    
    // FIX: An alliance you created should be eligible to challenge, even if it's already in a challenge.
    const myCreated = activeAlliances.filter(a => a.creatorId === user?.uid);
    
    return { pinned, unpinned, completed: completedAlliances, myCreatedAlliances: myCreated };
  }, [userAlliances, userData?.pinnedAllianceIds, user?.uid]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchAlliances(searchQuery);
      setSearchResults(results.filter(a => !userAlliances.some(ua => ua.id === a.id) && a.creatorId !== user?.uid));
    } catch (e) {
      toast({ title: "Search Failed", description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChallengeClick = (allianceToChallenge: Alliance) => {
    if (myCreatedAlliances.length === 0) {
      toast({
        title: "No Alliance to Challenge With",
        description: "You must be the creator of an active alliance to send challenges.",
        variant: "destructive",
      });
      return;
    }
    setChallengedAlliance(allianceToChallenge);
    setIsChallengeDialogOpen(true);
  };
  
  const handleConfirmChallenge = async (challengerAlliance: Alliance) => {
    if (!challengedAlliance) return;

    try {
      await sendAllianceChallenge(challengerAlliance, challengedAlliance);
      toast({
        title: "Challenge Sent!",
        description: `Your challenge has been sent to ${challengedAlliance.name}.`,
      });
    } catch (e) {
      toast({
        title: "Challenge Failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
        setIsChallengeDialogOpen(false);
        setChallengedAlliance(null);
    }
  };

  const renderAllianceSection = (alliances: (Alliance & { members: AllianceMember[] })[], title?: string) => (
    <div className="space-y-4">
        {title && <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
                {alliances.map((alliance) => (
                    <AllianceCard3D
                        key={alliance.id}
                        alliance={alliance}
                    />
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
  
  return (
    <>
    <div className={cn("min-h-screen flex flex-col")}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {!showSearch && (
                    <div className="flex items-center gap-2">
                        <Swords className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Challenge an Alliance</h2>
                    </div>
                )}
                 {showSearch ? (
                     <div className="relative w-full max-w-sm animate-fade-in-up ml-4">
                        <Input 
                            placeholder="Search for an alliance..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="bg-transparent border-white/50 rounded-full h-11 pl-4 pr-10 focus-visible:ring-primary/50"
                            autoFocus
                            onBlur={() => {
                                if (!searchQuery) setShowSearch(false);
                            }}
                        />
                        <button 
                            onClick={handleSearch} 
                            disabled={isSearching}
                            className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                    <Search className="h-6 w-6" />
                  </Button>
                )}
              </div>
             
              {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
                  {searchResults.map(result => (
                     <div key={result.id} className="p-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
                       <div className="flex justify-between items-center">
                          <Link href={`/alliances/${result.id}`} className="flex-grow">
                             <div>
                               <p className="font-semibold hover:underline">{result.name}</p>
                               <p className="text-xs text-muted-foreground">{result.memberIds.length} members</p>
                             </div>
                          </Link>
                          <Button size="sm" onClick={() => handleChallengeClick(result)} className="ml-4">
                            <Swords className="h-4 w-4 mr-2"/>
                            Challenge
                          </Button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">Your Alliances</h2>
                </div>
                 <Button asChild variant="ghost" size="icon">
                  <Link href="/alliances/create">
                    <PlusCircle className="h-6 w-6" />
                  </Link>
                </Button>
              </div>
                {(pinned.length === 0 && unpinned.length === 0) ? (
                    <p className="text-center text-muted-foreground py-4">You are not part of any active alliance.</p>
                ) : (
                    <div className="space-y-6">
                        {pinned.length > 0 && renderAllianceSection(pinned, "Pinned")}
                        {pinned.length > 0 && unpinned.length > 0 && <Separator />}
                        {unpinned.length > 0 && renderAllianceSection(unpinned)}
                    </div>
                )}
            </div>
            {completed.length > 0 && (
              <div className="space-y-4 pt-8">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-green-400" />
                    <h2 className="text-2xl font-semibold">Completed Alliances</h2>
                </div>
                {renderAllianceSection(completed)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    <ChallengeDialog
      isOpen={isChallengeDialogOpen}
      onOpenChange={setIsChallengeDialogOpen}
      myAlliances={myCreatedAlliances}
      challengedAlliance={challengedAlliance}
      onConfirmChallenge={handleConfirmChallenge}
    />
    </>
  );
}

    