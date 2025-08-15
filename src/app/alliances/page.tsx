
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowRight, Swords, Search, PlusCircle, Check, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alliance, AllianceChallenge, AllianceMember, UserData } from '@/types';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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

const AllianceCard3D = ({ alliance }: { alliance: Alliance & { members: AllianceMember[] } }) => {
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
        <Link href={`/alliances/${alliance.id}`} className="flex-shrink-0">
             <div 
                ref={cardRef} 
                className="card-3d w-[261px] h-[348px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl w-full h-full card-3d-content">
                    <div className="relative w-full h-full">
                        <Image 
                            src={alliance.photoURL}
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
             </div>
        </Link>
    );
};

export default function AlliancesPage() {
  const { user } = useAuth();
  const { userAlliances, searchAlliances, sendAllianceChallenge, incomingAllianceChallenges, acceptAllianceChallenge, declineAllianceChallenge } = useFriends();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Alliance[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const alliancesWithMemberData = useMemo(() => {
    return userAlliances.map(alliance => {
      const members = alliance.members || [];
      return { ...alliance, members };
    });
  }, [userAlliances]);

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
  
  return (
    <div className={cn("min-h-screen flex flex-col")}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Swords className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">Challenge an Alliance</h2>
                </div>
              </div>
              <div className="relative w-full max-w-sm">
                <Input 
                  placeholder="Search for an alliance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent border-white/50 rounded-full h-11 pl-4 pr-10 focus-visible:ring-primary/50"
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
                  {searchResults.map(result => (
                    <Card key={result.id} className="p-3">
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
                    </Card>
                  ))}
                </div>
              )}
            </div>

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
                {alliancesWithMemberData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">You are not part of any alliance.</p>
                ) : (
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-4 pb-4">
                            {alliancesWithMemberData.map((alliance) => (
                                <AllianceCard3D key={alliance.id} alliance={alliance} />
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
