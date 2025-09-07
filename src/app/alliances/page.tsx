
"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useAlliance } from '@/components/providers/AllianceProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowRight, Swords, Search, PlusCircle, Check, X, ShieldCheck, Pin, PinOff, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alliance, AllianceChallenge, AllianceMember, UserData } from '@/types';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toPng } from 'html-to-image';
import AllianceCard from '@/components/alliances/AllianceCard';
import { isPast, parseISO } from 'date-fns';


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

const AllianceCard3D = ({ alliance, isPinned, onPinToggle, onDownload }: { alliance: Alliance & { members: AllianceMember[] }, isPinned: boolean, onPinToggle: (e: React.MouseEvent, allianceId: string) => void, onDownload: (alliance: Alliance & { members: AllianceMember[] }) => void }) => {
    const cardRef = useRef<HTMLDivElement>(null);

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
            <div className="relative w-full h-full group">
                 <div 
                    className="absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity opacity-60 group-hover:opacity-100"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <Button 
                        size="icon" 
                        variant="secondary"
                        className={cn("h-8 w-8", isPinned && "bg-primary text-primary-foreground")}
                        onClick={(e) => onPinToggle(e, alliance.id)}
                        aria-label={isPinned ? 'Unpin alliance' : 'Pin alliance'}
                    >
                        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button 
                        size="icon" 
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => onDownload(alliance)}
                        aria-label="Download alliance card"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
                <Link href={`/alliances/${alliance.id}`} className="block w-full h-full card-3d-content overflow-hidden rounded-lg group-hover:shadow-2xl">
                    <Card className="w-full h-full border-0 rounded-lg">
                        <div className="relative w-full h-full">
                            <Image 
                                src={getAllianceImage(alliance)}
                                alt={alliance.name} 
                                fill 
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
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
         </div>
    );
};

export default function AlliancesPage() {
  const { user, userData } = useAuth();
  const { userAlliances, searchAlliances, sendAllianceChallenge, togglePinAlliance } = useAlliance();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Alliance[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [allianceToDownload, setAllianceToDownload] = useState<(Alliance & { members: AllianceMember[] }) | null>(null);
  const allianceCardRef = useRef<HTMLDivElement>(null);
  
  const handlePinToggle = (e: React.MouseEvent, allianceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinAlliance(allianceId);
  }

  const { pinned, unpinned, completed } = useMemo(() => {
    const pinnedIds = new Set(userData?.pinnedAllianceIds || []);
    const alliancesWithMemberData = userAlliances.map(alliance => ({
      ...alliance,
      members: alliance.members || [],
    }));

    const activeAlliances = alliancesWithMemberData.filter(a => {
        const isEnded = isPast(parseISO(a.endDate));
        const isObjectiveMet = a.progress >= a.target;
        return !isEnded && !isObjectiveMet;
    });

    const completedAlliances = alliancesWithMemberData.filter(a => {
        const isEnded = isPast(parseISO(a.endDate));
        const isObjectiveMet = a.progress >= a.target;
        return isEnded || isObjectiveMet;
    });

    const pinned = activeAlliances.filter(a => pinnedIds.has(a.id));
    const unpinned = activeAlliances.filter(a => !pinnedIds.has(a.id));
    
    return { pinned, unpinned, completed: completedAlliances };
  }, [userAlliances, userData?.pinnedAllianceIds]);

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

  const handleChallenge = async (challengedAlliance: Alliance) => {
    const myAlliance = userAlliances.find(a => a.creatorId === user?.uid);
    if (!myAlliance) {
      toast({ title: "No Alliance Found", description: "You must be the creator of an alliance to send challenges.", variant: "destructive" });
      return;
    }

    try {
      await sendAllianceChallenge(myAlliance, challengedAlliance);
      toast({ title: "Challenge Sent!", description: `Your challenge has been sent to ${challengedAlliance.name}.` });
    } catch (e) {
      toast({ title: "Challenge Failed", description: (e as Error).message, variant: 'destructive' });
    }
  };
  
  const handleDownloadRequest = (alliance: Alliance & { members: AllianceMember[] }) => {
    setAllianceToDownload(alliance);
  };
  
  useEffect(() => {
    if (allianceToDownload && allianceCardRef.current) {
        toPng(allianceCardRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `sigil-alliance-${allianceToDownload.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error("Could not generate alliance card image", err);
                toast({
                    title: "Download Failed",
                    description: "Could not generate the alliance card image.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setAllianceToDownload(null);
            });
    }
  }, [allianceToDownload, toast]);

  const renderAllianceSection = (alliances: (Alliance & { members: AllianceMember[] })[], title?: string) => (
    <div className="space-y-4">
        {title && <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
                {alliances.map((alliance) => (
                    <AllianceCard3D
                        key={alliance.id}
                        alliance={alliance}
                        isPinned={(userData?.pinnedAllianceIds || []).includes(alliance.id)}
                        onPinToggle={handlePinToggle}
                        onDownload={handleDownloadRequest}
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
                          <div>
                            <p className="font-semibold">{result.name}</p>
                            <p className="text-xs text-muted-foreground">{result.memberIds.length} members</p>
                          </div>
                          <Button size="sm" onClick={() => handleChallenge(result)}>
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
          </div>

           <div className="lg:col-start-1 lg:col-span-2 space-y-8">
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
    {/* Offscreen card for image generation */}
    <div className="fixed -left-[9999px] top-0">
        <div ref={allianceCardRef}>
            {allianceToDownload && <AllianceCard alliance={allianceToDownload} />}
        </div>
    </div>
    </>
  );
}
