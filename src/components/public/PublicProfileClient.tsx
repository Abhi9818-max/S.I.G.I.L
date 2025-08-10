"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, BarChart2, Activity } from 'lucide-react';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { Badge } from '@/components/ui/badge';
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
  userId: string;
}

const PublicProfileClientPage: React.FC<PublicProfileClientPageProps> = ({ initialUserData, userId }) => {
    const [friendData, setFriendData] = useState<UserData | null>(initialUserData);
    
    const friendLevelInfo: UserLevelInfo | null = React.useMemo(() => {
        if (!friendData) return null;
        const totalRecordValue = friendData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (friendData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [friendData]);
    
    if (!friendData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
                    <p className="text-muted-foreground">This user profile could not be loaded or does not exist.</p>
                     <Button asChild variant="outline" className="mt-8">
                        <Link href="/">Return to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    const friendAvatar = friendData.photoURL || `/avatars/avatar${(simpleHash(userId) % 12) + 1}.jpeg`;
    const displayName = friendData.username;
    
    const pageTierClass = friendLevelInfo ? `page-tier-group-${friendLevelInfo.tierGroup}` : 'page-tier-group-1';

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <header className="py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="container mx-auto flex justify-center">
                    <h1 className="text-lg font-semibold text-primary">Public Profile</h1>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 pb-8 md:p-8 animate-fade-in-up space-y-8">
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={friendAvatar} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="w-full text-center md:text-left">
                           <h1 className="text-3xl font-bold">{displayName}</h1>
                           {friendLevelInfo && <div className="mt-2 flex justify-center md:justify-start"><LevelIndicator levelInfo={friendLevelInfo} /></div>}
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto md:mx-0">
                                {friendData.bio || "No bio available."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="stats" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats & Overview</TabsTrigger>
                    <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Full Activity</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="stats" className="mt-6">
                    <StatsPanel friendData={friendData} />
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">Daily Time Breakdown</h2>
                         <DailyTimeBreakdownChart
                            date={new Date()}
                            records={friendRecords}
                            taskDefinitions={friendTasks}
                            hideFooter={true}
                        />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="mt-6">
                     <div>
                        <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                        <ContributionGraph 
                            year={new Date().getFullYear()}
                            onDayClick={() => {}} 
                            selectedTaskFilterId={null}
                            records={friendRecords} 
                            taskDefinitions={friendTasks}
                            displayMode="full"
                        />
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="text-center mt-8">
                    <Button asChild variant="outline">
                        <Link href="/">Return to Dashboard</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default PublicProfileClientPage;
