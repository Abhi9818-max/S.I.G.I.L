
"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, BarChart2, Activity, Link as LinkIcon, Check } from 'lucide-react';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay, isToday } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
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


interface PublicProfilePageProps {
  initialUserData: UserData;
}

export default function PublicProfilePage({ initialUserData }: PublicProfilePageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [userData] = useState<UserData>(initialUserData);
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const userLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!userData) return null;
        const totalRecordValue = userData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (userData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [userData]);

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
            title: "Link Copied!",
            description: "Profile link copied to clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    if (!userData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load user data.
                <Button onClick={() => router.push('/')} className="ml-4">Back to Dashboard</Button>
            </div>
        );
    }
    
    const friendRecords = userData.records || [];
    const friendTasks = userData.taskDefinitions || [];
    
    const userAvatar = userData.photoURL || `/avatars/avatar${(simpleHash(userData.uid || userData.username) % 12) + 1}.jpeg`;
    const today = new Date();
    const yesterday = subDays(today, 1);
    const displayName = userData.username;
    
    return (
        <div className={cn("min-h-screen flex flex-col page-tier-group-1")}>
            <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8 mt-12">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => router.push('/')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <Button variant="outline" onClick={handleCopyLink}>
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                </div>
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                         <Avatar className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="w-full">
                            <div className="flex items-center justify-between w-full">
                                <h1 className="text-2xl font-semibold">{displayName}</h1>
                                {userLevelInfo && <LevelIndicator levelInfo={userLevelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
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
                  
                  <TabsContent value="activity" className="mt-6">
                     <div>
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
                  </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};
