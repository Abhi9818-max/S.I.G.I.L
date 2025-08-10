
"use client";

import React from 'react';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LevelIndicator from '@/components/layout/LevelIndicator';
import { BarChart2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

interface PublicProfileClientPageProps {
  initialUserData: UserData;
}

export default function PublicProfileClientPage({ initialUserData }: PublicProfileClientPageProps) {
  const [userData] = React.useState<UserData>(initialUserData);
  const [selectedTaskFilterId, setSelectedTaskFilterId] = React.useState<string | null>(null);

  const userLevelInfo: UserLevelInfo | null = React.useMemo(() => {
    if (!userData) return null;
    const totalRecordValue = userData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
    const totalExperience = totalRecordValue + (userData.bonusPoints || 0);
    return calculateUserLevelInfo(totalExperience);
  }, [userData]);
  
  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        User not found.
      </div>
    );
  }

  const userAvatar = userData.photoURL || `/avatars/avatar${(simpleHash(userData.uid || '') % 12) + 1}.jpeg`;
  const displayName = userData.username;
  const pageTierClass = userLevelInfo ? `page-tier-group-${userLevelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", pageTierClass)}>
      <header className="py-4 px-4 md:px-6 sticky top-0 z-50 transition-colors duration-500 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between">
           <Link href="/" className="text-xl font-semibold">S.I.G.I.L.</Link>
           {userLevelInfo && <LevelIndicator levelInfo={userLevelInfo} />}
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="pt-6 md:p-0">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <Avatar className="h-24 w-24 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
              <AvatarImage src={userAvatar} alt={displayName} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap max-w-xl mx-auto md:mx-0">
                {userData.bio || "No bio yet."}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList>
            <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="mt-6">
            <StatsPanel friendData={userData} />
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6 space-y-8">
            <ContributionGraph
                year={new Date().getFullYear()}
                onDayClick={() => {}}
                selectedTaskFilterId={selectedTaskFilterId}
                records={userData.records}
                taskDefinitions={userData.taskDefinitions}
                displayMode="full"
            />
            <DailyTimeBreakdownChart
                date={new Date()}
                records={userData.records}
                taskDefinitions={userData.taskDefinitions}
                hideFooter={true}
            />
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8">
            <Button asChild variant="outline">
                <Link href="/">
                    Return to the App
                </Link>
            </Button>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
          This is a public profile on S.I.G.I.L.
      </footer>
    </div>
  );
};
