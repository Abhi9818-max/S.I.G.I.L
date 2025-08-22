
'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks, BarChart2, Activity, Lock } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, RecordEntry, TaskDefinition, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { subDays, startOfDay, isToday, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import { AppProviders } from '@/components/providers/AppProviders';
import { calculateUserLevelInfo, getContributionLevel } from '@/lib/config';
import { XP_CONFIG } from '@/lib/xp-config';

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

function PublicProfilePageComponent({ params }: { params: { userId: string } }) {
    const router = useRouter();
    const { userId } = params;
    
    const { getPublicUserData } = useFriends();
    
    const [publicUserData, setPublicUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
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
        if (task.unit === 'hours') {
            value = recordValue * 60;
        }

        const phase = getContributionLevel(value, task.intensityThresholds);
        if (phase === 0) return 0;

        const baseXP = task.priority === 'high' ? levelConfig.base_high_xp : levelConfig.base_low_xp;
        
        const phasePercentages = [0, 0.25, 0.50, 0.75, 1.00];
        const percentage = phasePercentages[phase] || 0;

        return Math.round(baseXP * percentage);
    }, []);

    const publicUserLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!publicUserData) return null;

        const getTaskDef = (taskId: string): TaskDefinition | undefined => {
            return publicUserData.taskDefinitions?.find(task => task.id === taskId);
        };
        
        let tempXpForLevelCalc = 0;
        const sortedRecords = [...(publicUserData.records || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        for (const record of sortedRecords) {
            const { currentLevel } = calculateUserLevelInfo(tempXpForLevelCalc);
            const task = getTaskDef(record.taskType || '');
            const recordXp = calculateXpForRecord(record.value, task, currentLevel);
            tempXpForLevelCalc += recordXp;
        }
        
        const totalExperience = tempXpForLevelCalc + (publicUserData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [publicUserData, calculateXpForRecord]);
    
    useEffect(() => {
        const fetchPublicData = async () => {
            if (userId) {
                setIsLoading(true);
                try {
                    const data = await getPublicUserData(userId);
                    if (data) {
                        setPublicUserData(data);
                    } else {
                        toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
                        router.push('/friends');
                    }
                } catch (error) {
                    console.error("Error fetching public user data:", error);
                    toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
                    router.push('/friends');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchPublicData();
    }, [userId, getPublicUserData, router, toast]);

    const pacts = useMemo(() => {
        if (!publicUserData?.todoItems) return [];
        return publicUserData.todoItems.filter(pact => isToday(parseISO(pact.createdAt)))
    }, [publicUserData?.todoItems]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    if (!publicUserData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load user data.
                <Button onClick={() => router.push('/friends')} className="ml-4">Back to Friends</Button>
            </div>
        );
    }
    
    const records = publicUserData.records || [];
    const tasks = publicUserData.taskDefinitions || [];
    const userAvatar = publicUserData.photoURL || getAvatarForId(userId, publicUserData.photoURL);
    const displayName = publicUserData.username;
    
    const canViewPacts = publicUserData.privacySettings?.pacts === 'everyone';
    const canViewActivity = publicUserData.privacySettings?.activity === 'everyone';

    return (
        <div className="min-h-screen flex flex-col">
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8">
                <Button variant="outline" onClick={() => router.back()} className="hidden md:inline-flex mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <div className="flex items-center gap-4 md:items-start">
                             <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                <AvatarImage src={userAvatar} />
                                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="w-full">
                            <h1 className="text-xl font-semibold">{displayName}</h1>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {publicUserData.bio || "No bio yet."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="stats" className="w-full">
                    <TabsList>
                    <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats</TabsTrigger>
                    <TabsTrigger value="pacts" disabled={!canViewPacts}><ListChecks className="mr-2 h-4 w-4" />Pacts</TabsTrigger>
                    <TabsTrigger value="activity" disabled={!canViewActivity}><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="stats" className="mt-6">
                        <StatsPanel friendData={publicUserData} />
                    </TabsContent>
                    
                    <TabsContent value="pacts" className="mt-6">
                        {canViewPacts ? (
                            <PactList items={pacts} isEditable={false} onToggle={()=>{}} onDelete={()=>{}} onToggleDare={()=>{}} />
                        ) : (
                            <PrivateContent message={`${displayName} has made their pacts private.`} />
                        )}
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        {canViewActivity ? (
                            <>
                                <div>
                                    <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                                    <TaskFilterBar
                                        taskDefinitions={tasks}
                                        selectedTaskId={selectedTaskFilterId}
                                        onSelectTask={setSelectedTaskFilterId}
                                    />
                                    <ContributionGraph 
                                        year={new Date().getFullYear()}
                                        onDayClick={() => {}}
                                        onDayDoubleClick={() => {}} 
                                        selectedTaskFilterId={selectedTaskFilterId}
                                        records={records} 
                                        taskDefinitions={tasks}
                                        displayMode="full"
                                    />
                                </div>
                            </>
                        ) : (
                            <PrivateContent message={`${displayName} has made their activity private.`} />
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default function PublicProfilePageWrapper(props: { params: { userId: string } }) {
  return (
    <AppProviders>
      <PublicProfilePageComponent {...props} />
    </AppProviders>
  );
}
