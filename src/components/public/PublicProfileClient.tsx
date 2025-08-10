
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, BarChart2, Activity } from 'lucide-react';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import { calculateUserLevelInfo } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { Badge } from '@/components/ui/badge';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { getPublicUserData } from '@/lib/server/get-public-data';
import { useRouter } from 'next/navigation';

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

export default function PublicProfileClient({ userId }: { userId: string }) {
    const router = useRouter();
    
    const [friendData, setFriendData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const friendLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!friendData) return null;
        const totalRecordValue = friendData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (friendData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [friendData]);
    
    useEffect(() => {
        const fetchFriendData = async () => {
            if (userId) {
                try {
                    const data = await getPublicUserData(userId);
                    if (data) {
                        setFriendData(data);
                    } else {
                        toast({ title: 'Error', description: 'User data not found.', variant: 'destructive' });
                        router.push('/'); 
                    }
                } catch (error) {
                    console.error("Error fetching friend data:", error);
                    toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
                    router.push('/');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchFriendData();
    }, [userId, router, toast]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading public profile...</div>;
    }

    if (!friendData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load user data.
                <Button onClick={() => router.push('/')} className="ml-4">Back to Dashboard</Button>
            </div>
        );
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    
    const friendAvatar = friendData.photoURL || `/avatars/avatar${(simpleHash(userId) % 12) + 1}.jpeg`;
    const displayName = friendData.username;

    return (
        <div className={cn("min-h-screen flex flex-col")}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <Button variant="outline" onClick={() => router.back()} className="hidden md:inline-flex mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <div className="flex items-center gap-4 md:items-start">
                                <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                <AvatarImage src={friendAvatar} />
                                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                                <div className="md:hidden">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-semibold">{displayName}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-semibold">{displayName}</h1>
                                </div>
                                <div className="hidden md:block">
                                    {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                                </div>
                            </div>
                                <div className="mt-1 md:hidden">
                                {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {friendData.bio || "No bio yet."}
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
                    <StatsPanel friendData={friendData} />
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        <div className="mb-8 max-w-4xl mx-auto">
                            <h2 className="text-2xl font-semibold mb-4">Daily Breakdown</h2>
                            <DailyTimeBreakdownChart
                                date={new Date()}
                                records={friendRecords}
                                taskDefinitions={friendTasks}
                            />
                        </div>
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
            </main>
        </div>
    );
};
