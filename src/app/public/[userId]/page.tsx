
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks, BarChart2, Activity, Heart, Lock } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, RecordEntry, TaskDefinition, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay, isToday, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
import { Separator } from '@/components/ui/separator';
import { calculateUserLevelInfo, getContributionLevel } from '@/lib/config';
import { XP_CONFIG } from '@/lib/xp-config';
import { AppProviders } from '@/components/providers/AppProviders';

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

const PrivateContent = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg mt-6">
    <Lock className="h-10 w-10" />
    <p className="font-semibold text-lg">Content is Private</p>
    <p>{message}</p>
  </div>
);

// Correctly typed props for the page
interface PublicProfilePageProps {
  params: {
    userId: string;
  };
}

function PublicProfilePageContent({ params }: PublicProfilePageProps) {
    const { userId } = params;
    const { getPublicUserData } = useFriends();
    
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const calculateXpForRecord = useCallback((
      recordValue: number,
      task: TaskDefinition | undefined,
      userLevel: number
    ): number => {
        if (!task || !XP_CONFIG || XP_CONFIG.length === 0) return 0;
        
        const levelConfig = XP_CONFIG.find(c => c.level === userLevel);
        if (!levelConfig) return 0;

        let value = recordValue;
        if (task.unit === 'hours') value = recordValue * 60;

        const phase = getContributionLevel(value, task.intensityThresholds);
        if (phase === 0) return 0;

        const baseXP = task.priority === 'high' ? levelConfig.base_high_xp : levelConfig.base_low_xp;
        const phasePercentages = [0, 0.25, 0.50, 0.75, 1.00];
        const percentage = phasePercentages[phase] || 0;

        return Math.round(baseXP * percentage);
    }, []);

    const userLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!userData) return null;
        const getTaskDef = (taskId: string) => userData.taskDefinitions?.find(t => t.id === taskId);
        
        let cumulativeXp = 0;
        const sortedRecords = [...(userData.records || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        for (const record of sortedRecords) {
            const { currentLevel } = calculateUserLevelInfo(cumulativeXp);
            const task = getTaskDef(record.taskType || '');
            cumulativeXp += calculateXpForRecord(record.value, task, currentLevel);
        }
        
        return calculateUserLevelInfo(cumulativeXp + (userData.bonusPoints || 0));
    }, [userData, calculateXpForRecord]);
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (userId) {
                try {
                    const data = await getPublicUserData(userId);
                    if (data) {
                        setUserData(data);
                    } else {
                        toast({ title: 'Error', description: 'User data not found.', variant: 'destructive' });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserData();
    }, [userId, getPublicUserData, toast]);

    const userPacts = useMemo(() => {
        if (!userData?.todoItems) return [];
        return userData.todoItems.filter(pact => isToday(new Date(pact.createdAt)));
    }, [userData?.todoItems]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    if (!userData) {
        return <div className="flex items-center justify-center min-h-screen">Could not load user data.</div>;
    }

    const canViewPacts = userData.privacySettings?.pacts === 'everyone';
    const canViewActivity = userData.privacySettings?.activity === 'everyone';

    return (
        <div className="min-h-screen flex flex-col">
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8">
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20">
                            <AvatarImage src={getAvatarForId(userId, userData.photoURL)} />
                            <AvatarFallback>{userData.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-semibold">{userData.username}</h1>
                            <p className="text-sm text-muted-foreground italic mt-2">{userData.bio || "No bio yet."}</p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="activity" className="w-full">
                    <TabsList>
                        <TabsTrigger value="activity" disabled={!canViewActivity}><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                        <TabsTrigger value="pacts" disabled={!canViewPacts}><ListChecks className="mr-2 h-4 w-4" />Pacts</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="activity" className="mt-6">
                        {canViewActivity ? (
                            <>
                                <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                                <ContributionGraph 
                                    year={new Date().getFullYear()}
                                    onDayClick={() => {}}
                                    onDayDoubleClick={() => {}}
                                    selectedTaskFilterId={null}
                                    records={userData.records}
                                    taskDefinitions={userData.taskDefinitions}
                                    displayMode="full"
                                />
                            </>
                        ) : <PrivateContent message={`${userData.username} has made their activity private.`} />}
                    </TabsContent>
                    
                    <TabsContent value="pacts" className="mt-6">
                        {canViewPacts ? (
                            <PactList items={userPacts} isEditable={false} onToggle={()=>{}} onDelete={()=>{}} onToggleDare={()=>{}} />
                        ) : <PrivateContent message={`${userData.username} has made their pacts private.`} />}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

export default function PublicProfilePageWrapper(props: PublicProfilePageProps) {
  return (
    <AppProviders>
      <PublicProfilePageContent {...props} />
    </AppProviders>
  )
}
