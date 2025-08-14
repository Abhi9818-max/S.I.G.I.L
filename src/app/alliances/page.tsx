
"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowRight, Swords, Search, PlusCircle, Check, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alliance, AllianceChallenge } from '@/types';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function AlliancesPage() {
  const { user } = useAuth();
  const { userAlliances, searchAlliances, sendAllianceChallenge, incomingAllianceChallenges, acceptAllianceChallenge, declineAllianceChallenge } = useFriends();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Alliance[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
              <div className="flex gap-2">
                <Input 
                  placeholder="Search for an alliance by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
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
                {userAlliances.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">You are not part of any alliance.</p>
                ) : (
                    <ScrollArea className="h-[60vh] mt-4">
                        <div className="space-y-3 pr-4">
                            {userAlliances.map((alliance, index) => (
                                <div
                                  key={alliance.id}
                                  className="animate-fade-in-up"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <Link href={`/alliances/${alliance.id}`}>
                                      <Card className="p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                        <CardHeader className="p-2">
                                           <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-md flex items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        {alliance.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs mt-1">{alliance.description}</CardDescription>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                           </div>
                                        </CardHeader>
                                      </Card>
                                  </Link>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
