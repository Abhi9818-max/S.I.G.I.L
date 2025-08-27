import React from 'react';
import { calculateUserLevelInfo } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientHeader from '@/components/ClientHeader';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { differenceInDays, parseISO, formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alliance, UserData, RecordEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Users, Calendar, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

// This function now fetches real alliance data
async function fetchAllianceData(allianceId: string): Promise<Alliance | null> {
    if (!db) return null;
    const allianceRef = doc(db, 'alliances', allianceId);
    const allianceSnap = await getDoc(allianceRef);
    if (allianceSnap.exists()) {
        const data = allianceSnap.data();
        
        // Fetch records for all members within the alliance's date range
        const memberRecordsQuery = query(
            collection(db, 'records'), 
            where('ownerId', 'in', data.memberIds),
            where('taskType', '==', data.taskId),
            where('date', '>=', data.startDate.split('T')[0]),
            where('date', '<=', data.endDate.split('T')[0])
        );

        const recordsSnapshot = await getDocs(memberRecordsQuery);
        const memberRecords = recordsSnapshot.docs.map(doc => doc.data() as RecordEntry);
        
        const totalProgress = memberRecords.reduce((sum, record) => sum + record.value, 0);

        return { id: allianceSnap.id, ...data, progress: totalProgress } as Alliance;
    }
    return null;
}

// Function to fetch minimal user data for member avatars
async function fetchMemberAvatars(memberIds: string[]): Promise<Pick<UserData, 'uid' | 'photoURL' | 'username'>[]> {
    if (!db || memberIds.length === 0) return [];
    const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', memberIds));
    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            photoURL: data.photoURL,
            username: data.username
        };
    });
}


type Params = { allianceId: string };

// Kept for dynamic routing, but doesn't pre-build pages
export async function generateStaticParams() {
  return [];
}

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

export default async function AlliancePage({ params }: { params: Params }) {
  const { allianceId } = params;
  const alliance = await fetchAllianceData(allianceId);

  if (!alliance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientHeader />
        <main className="text-center">
          <h1 className="text-2xl font-bold mb-4">Alliance Not Found</h1>
          <p className="text-muted-foreground">The alliance you are looking for does not exist or could not be loaded.</p>
          <Link href="/alliances" className="mt-4 inline-block text-blue-500 hover:underline">
            &larr; Back to Alliances
          </Link>
        </main>
      </div>
    );
  }
  
  const memberAvatars = await fetchMemberAvatars(alliance.memberIds);

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
