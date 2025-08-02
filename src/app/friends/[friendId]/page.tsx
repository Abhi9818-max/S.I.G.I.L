
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { FriendProvider, useFriends } from '@/components/providers/FriendProvider';
import type { UserData, Friend, RecordEntry, TaskDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LevelIndicator from '@/components/layout/LevelIndicator';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import PactList from '@/components/todo/PactList';

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

const FriendProfileContent = () => {
    const params = useParams();
    const router = useRouter();
    const friendId = params.friendId as string;
    
    const { user } = useAuth();
    const { friends, getFriendData } = useFriends();
    const [friendData, setFriendData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);

    const currentUserRecords = useUserRecords();
    const levelInfo = currentUserRecords.getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    useEffect(() => {
        const fetchFriendData = async () => {
            if (friendId) {
                try {
                    const data = await getFriendData(friendId);
                    if (data) {
                        setFriendData(data);
                    } else {
                        router.push('/friends'); // Friend not found or not a friend
                    }
                } catch (error) {
                    console.error("Error fetching friend data:", error);
                    router.push('/friends');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchFriendData();
    }, [friendId, getFriendData, router]);

    const friendStats = useMemo(() => {
        if (!friendData) return { streak: 0, consistency: 0, aggregate: 0, highGoal: null, highGoalProgress: 0 };
        
        const friendRecords = friendData.records || [];
        const friendTasks = friendData.taskDefinitions || [];
        
        // Aggregate
        const today = new Date();
        const startDate = subDays(today, 29);
        const aggregate = friendRecords
            .filter(r => new Date(r.date) >= startDate && new Date(r.date) <= today)
            .reduce((sum, r) => sum + r.value, 0);

        // Consistency
        const recordDates = new Set(friendRecords.map(r => r.date));
        const activeDays = Array.from(recordDates).filter(d => new Date(d) >= startDate && new Date(d) <= today).length;
        const consistency = Math.round((activeDays / 30) * 100);

        // Streak
        let streak = 0;
        let currentDate = startOfDay(new Date());
        if (!recordDates.has(currentDate.toISOString().split('T')[0])) {
            currentDate = subDays(currentDate, 1);
        }
        while (recordDates.has(currentDate.toISOString().split('T')[0])) {
            streak++;
            currentDate = subDays(currentDate, 1);
        }

        return { streak, consistency, aggregate, highGoal: null, highGoalProgress: 0 };
    }, [friendData]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading friend's profile...</div>;
    }

    if (!friendData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load friend data.
                <Button onClick={() => router.push('/friends')} className="ml-4">Back to Friends</Button>
            </div>
        );
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    const friendBonusPoints = friendData.bonusPoints || 0;
    const totalExperience = friendRecords.reduce((sum, r) => sum + r.value, 0) + friendBonusPoints;
    const friendLevelInfo = calculateUserLevelInfo(totalExperience);
    const friendPacts = friendData.todoItems || [];

    const avatarNumber = (simpleHash(friendId) % 12) + 1;
    const friendAvatar = friendData.photoURL || `/avatars/avatar${avatarNumber}.jpeg`;

    const today = new Date();
    const yesterday = subDays(today, 1);

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <Button variant="outline" onClick={() => router.push('/friends')} className="hidden md:inline-flex mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Friends
                </Button>
                <div className="p-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20">
                            <AvatarImage src={friendAvatar} />
                            <AvatarFallback>{friendData.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <h1 className="text-2xl md:text-3xl font-semibold">{friendData.username}</h1>
                        </div>
                        <div className="w-full md:w-auto">
                            <LevelIndicator levelInfo={friendLevelInfo} />
                        </div>
                    </div>
                </div>
                <StatsPanel
                    records={friendRecords}
                    taskDefinitions={friendTasks}
                    highGoals={friendData.highGoals || []}
                    freezeCrystals={friendData.freezeCrystals || 0}
                />

                <div className="p-6 md:p-0">
                    <div className="flex items-center gap-2 mb-2">
                       <ListChecks className="h-6 w-6 text-primary" />
                       <h2 className="text-2xl font-semibold">Pacts</h2>
                    </div>
                   <PactList items={friendPacts} isEditable={false} />
                </div>

                <div className="p-6 md:p-0">
                    <Tabs defaultValue="today" className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Daily Breakdown</h2>
                             <TabsList>
                                <TabsTrigger value="today">Today</TabsTrigger>
                                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="today">
                            <DailyTimeBreakdownChart
                                date={today}
                                records={friendRecords}
                                taskDefinitions={friendTasks}
                                hideFooter={true}
                                hideDescription={true}
                            />
                        </TabsContent>
                        <TabsContent value="yesterday">
                            <DailyTimeBreakdownChart
                                date={yesterday}
                                records={friendRecords}
                                taskDefinitions={friendTasks}
                                hideFooter={true}
                                hideDescription={true}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
                
                <TaskComparisonChart friendData={friendData} />
                
                <div className="p-6 md:p-0">
                    <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                    <TaskFilterBar
                        taskDefinitions={friendTasks}
                        selectedTaskId={selectedTaskFilterId}
                        onSelectTask={setSelectedTaskFilterId}
                    />
                    <ContributionGraph 
                        year={new Date().getFullYear()}
                        onDayClick={() => {}} 
                        selectedTaskFilterId={selectedTaskFilterId}
                        records={friendRecords} 
                        taskDefinitions={friendTasks}
                        displayMode="full"
                    />
                </div>
            </main>
        </div>
    );
};

export default function FriendProfilePage() {
    return (
        <FriendProvider>
            <FriendProfileContent />
        </FriendProvider>
    );
}
