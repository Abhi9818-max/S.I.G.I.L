
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, Activity, Award } from 'lucide-react';
import { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import { calculateUserLevelInfo } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { subDays } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import LevelIndicator from '@/components/layout/LevelIndicator';

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
    const [userData] = useState<UserData>(initialUserData);
    const [isLoading, setIsLoading] = useState(false); // Can be used for future client-side updates
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);

    const userLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!userData) return null;
        const totalRecordValue = userData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (userData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [userData]);
    
    // Client-side effect for animations or other browser-specific tasks
    useEffect(() => {
        // e.g., trigger animations on load
    }, []);

    if (isLoading || !userData) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    const { username, bio, photoURL, records, taskDefinitions, unlockedAchievements } = userData;
    const userAvatar = photoURL || `/avatars/avatar${(simpleHash(userData.uid || '') % 12) + 1}.jpeg`;
    const today = new Date();
    const yesterday = subDays(today, 1);

    return (
        <div className={cn("min-h-screen flex flex-col", userLevelInfo ? `page-tier-group-${userLevelInfo.tierGroup}` : 'page-tier-group-1')}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <Button variant="outline" onClick={() => window.history.back()} className="hidden md:inline-flex mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <div className="flex items-center gap-4 md:items-start">
                             <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                <AvatarImage src={userAvatar} />
                                <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                             <div className="md:hidden">
                                <h1 className="text-lg font-semibold">{username}</h1>
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <h1 className="text-xl font-semibold">{username}</h1>
                               <div className="hidden md:block">
                                    {userLevelInfo && <LevelIndicator levelInfo={userLevelInfo} />}
                                </div>
                            </div>
                             <div className="mt-1 md:hidden">
                                {userLevelInfo && <LevelIndicator levelInfo={userLevelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {bio || "No bio yet."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="activity" className="w-full">
                  <TabsList>
                    <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                    <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats</TabsTrigger>
                    <TabsTrigger value="achievements"><Award className="mr-2 h-4 w-4" />Achievements ({unlockedAchievements?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="activity" className="mt-6">
                     <div className="mb-8 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold">Daily Breakdown</h2>
                            <Tabs defaultValue="today" className="w-auto">
                                <TabsList>
                                    <TabsTrigger value="today">Today</TabsTrigger>
                                    <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap">
                            <Tabs defaultValue="today" className="w-full inline-block min-w-full">
                                <TabsContent value="today" className="mt-4">
                                    <div className="w-[600px] md:w-full md:mx-auto md:transform-none transform -translate-x-1/4">
                                        <DailyTimeBreakdownChart
                                            date={today}
                                            records={records}
                                            taskDefinitions={taskDefinitions}
                                            hideFooter={true}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="yesterday" className="mt-4">
                                    <div className="w-full md:mx-auto">
                                        <DailyTimeBreakdownChart
                                            date={yesterday}
                                            records={records}
                                            taskDefinitions={taskDefinitions}
                                            hideFooter={true}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                     <div>
                        <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                        <TaskFilterBar
                            taskDefinitions={taskDefinitions || []}
                            selectedTaskId={selectedTaskFilterId}
                            onSelectTask={setSelectedTaskFilterId}
                        />
                        <ContributionGraph 
                            year={new Date().getFullYear()}
                            onDayClick={() => {}} 
                            selectedTaskFilterId={selectedTaskFilterId}
                            records={records} 
                            taskDefinitions={taskDefinitions}
                            displayMode="full"
                        />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats" className="mt-6">
                    <StatsPanel friendData={userData} selectedTaskFilterId={selectedTaskFilterId} />
                  </TabsContent>
                  
                  <TabsContent value="achievements" className="mt-6">
                     <div className="text-center text-muted-foreground py-10">
                        Feature coming soon.
                    </div>
                  </TabsContent>
                  
                </Tabs>
            </main>
        </div>
    );
};
