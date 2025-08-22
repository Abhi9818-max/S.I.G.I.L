
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks, ImageIcon, BarChart2, Activity, Lock } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, RecordEntry, TaskDefinition, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import { subDays, startOfDay, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
import { AppProviders } from '@/components/providers/AppProviders';
import { getPublicUserData } from '@/lib/server/get-public-data';
import LevelIndicator from '@/components/layout/LevelIndicator';
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

// Correctly typed props for a Next.js dynamic route page
interface PublicProfilePageProps {
  params: {
    userId: string;
  };
}

function PublicProfilePageComponent({ params }: PublicProfilePageProps) {
    const { userId } = params;
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [friendData, setFriendData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isOwnProfile = user?.uid === userId;

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

    const friendLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!friendData) return null;

        const getFriendTaskDefinitionById = (taskId: string): TaskDefinition | undefined => {
            return friendData.taskDefinitions?.find(task => task.id === taskId);
        };
        
        let cumulativeXp = 0;
        const sortedRecords = [...(friendData.records || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let tempXpForLevelCalc = 0;
        for (const record of sortedRecords) {
            const { currentLevel } = calculateUserLevelInfo(tempXpForLevelCalc);
            const task = getFriendTaskDefinitionById(record.taskType || '');
            const recordXp = calculateXpForRecord(record.value, task, currentLevel);
            tempXpForLevelCalc += recordXp;
        }
        cumulativeXp = tempXpForLevelCalc;

        const totalExperience = cumulativeXp + (friendData.bonusPoints || 0);

        return calculateUserLevelInfo(totalExperience);
    }, [friendData, calculateXpForRecord]);
    
    useEffect(() => {
        const fetchPublicData = async () => {
            if (userId) {
                setIsLoading(true);
                try {
                    const data = await getPublicUserData(userId);
                    if (data) {
                        setFriendData(data);
                    } else {
                        toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
                    }
                } catch (error) {
                    console.error("Error fetching public data:", error);
                    toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchPublicData();
    }, [userId, toast]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    if (!friendData) {
        return <div className="flex items-center justify-center min-h-screen">Could not load user data.</div>;
    }

    const friendAvatar = friendData.photoURL || getAvatarForId(userId, friendData.photoURL);
    const displayName = friendData.username;
    
    const canViewActivity = friendData.privacySettings?.activity === 'everyone' || isOwnProfile;
    const canViewPacts = friendData.privacySettings?.pacts === 'everyone' || isOwnProfile;

    return (
        <div className="min-h-screen flex flex-col">
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8">
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                            <AvatarImage src={friendAvatar} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="w-full">
                            <h1 className="text-xl font-semibold">{displayName}</h1>
                            {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {friendData.bio || "No bio yet."}
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
                        <StatsPanel friendData={friendData} />
                    </TabsContent>
                    
                    <TabsContent value="pacts" className="mt-6">
                        {canViewPacts ? (
                            <PactList items={friendData.todoItems || []} isEditable={false} onToggle={()=>{}} onDelete={()=>{}} onToggleDare={()=>{}} />
                        ) : (
                            <PrivateContent message={`${displayName} has made their pacts private.`} />
                        )}
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        {canViewActivity ? (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-semibold">Daily Breakdown</h2>
                                    <DailyTimeBreakdownChart
                                        date={new Date()}
                                        records={friendData.records}
                                        taskDefinitions={friendData.taskDefinitions}
                                        hideFooter={true}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                                    <ContributionGraph 
                                        year={new Date().getFullYear()}
                                        onDayClick={() => {}}
                                        onDayDoubleClick={() => {}} 
                                        selectedTaskFilterId={null}
                                        records={friendData.records} 
                                        taskDefinitions={friendData.taskDefinitions}
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
}

export default function PublicProfilePage(props: PublicProfilePageProps) {
    return (
        <AppProviders>
            <PublicProfilePageComponent {...props} />
        </AppProviders>
    );
}
