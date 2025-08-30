
"use client";

import React, { useState, useEffect } from 'react';
import { calculateUserLevelInfo } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientHeader from '@/components/ClientHeader';
import { differenceInDays, parseISO, formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alliance, UserData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';

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
};

type Params = { allianceId: string };

export default function AlliancePage({ params }: { params: Params }) {
  const { allianceId } = params;
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [memberAvatars, setMemberAvatars] = useState<Pick<UserData, 'uid' | 'photoURL' | 'username'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllianceData() {
      if (!db || !allianceId) return;
      
      try {
        const allianceRef = doc(db, 'alliances', allianceId as string);
        const allianceSnap = await getDoc(allianceRef);

        if (allianceSnap.exists()) {
          const allianceData = { id: allianceSnap.id, ...allianceSnap.data() } as Alliance;
          setAlliance(allianceData);
          
          // Fetch member avatars
          const memberIds = allianceData.memberIds;
          if (memberIds && memberIds.length > 0) {
            // Firestore 'in' query is limited to 30 items per query.
            // We chunk the requests to handle more than 30 members.
            const chunks = [];
            for (let i = 0; i < memberIds.length; i += 30) {
              chunks.push(memberIds.slice(i, i + 30));
            }

            const avatarPromises = chunks.map(chunk => {
              const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
              return getDocs(usersQuery);
            });
            
            const snapshots = await Promise.all(avatarPromises);
            const avatars = snapshots.flatMap(snapshot => 
              snapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                      uid: doc.id,
                      photoURL: data.photoURL,
                      username: data.username
                  };
              })
            );
            setMemberAvatars(avatars);
          }
        } else {
          setAlliance(null);
        }
      } catch (error) {
        console.error("Error fetching alliance data:", error);
        setAlliance(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAllianceData();
  }, [allianceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientHeader />
        <main className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Loading Alliance...</h1>
          <Skeleton className="w-64 h-8 mx-auto" />
        </main>
      </div>
    );
  }

  if (!alliance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientHeader />
        <main className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Alliance Not Found</h1>
          <p className="text-muted-foreground">The alliance you are looking for does not exist or could not be loaded.</p>
          <Link href="/alliances" className="mt-4 inline-block text-blue-500 hover:underline">
            &larr; Back to Alliances
          </Link>
        </main>
      </div>
    );
  }
  
  const totalExperience = 0; // Alliances don't have XP, this is a placeholder
  const levelInfo = calculateUserLevelInfo(totalExperience);
  const pageTierClass = `page-tier-group-${levelInfo.tierGroup}`;
  const daysLeft = differenceInDays(parseISO(alliance.endDate), new Date());
  const progressPercentage = Math.min(100, (alliance.progress / alliance.target) * 100);

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', pageTierClass)}>
      <ClientHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Image src={alliance.photoURL} alt={alliance.name} width={96} height={96} className="rounded-lg border-2 border-primary/20 object-cover" />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{alliance.name}</h1>
            <p className="text-muted-foreground mt-1">{alliance.description}</p>
          </div>
        </div>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5" style={{ color: alliance.taskColor }} />
                    <CardTitle>Objective: {alliance.taskName}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: alliance.taskColor }} />
                 <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{alliance.progress.toLocaleString()} / {alliance.target.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {daysLeft >= 0 ? `${formatDistanceToNowStrict(parseISO(alliance.endDate))} remaining` : 'Ended'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Members ({alliance.memberIds.length})</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    {memberAvatars.map(member => (
                        <TooltipProvider key={member.uid}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Avatar>
                                        <AvatarImage src={getAvatarForId(member.uid, member.photoURL)} />
                                        <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{member.username}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/alliances" className="text-blue-500 hover:underline">
            &larr; Back to Alliances
          </Link>
        </div>
      </main>
    </div>
  );
}
