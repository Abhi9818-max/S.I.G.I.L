
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { User, Award } from 'lucide-react';
import { UserData, UserLevelInfo } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import { calculateUserLevelInfo } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LevelIndicator from '@/components/layout/LevelIndicator';

// Simple hash function to get a number from a string for consistent default avatars
const simpleHash = (s: string) => {
    if (!s) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};


interface PublicProfileClientProps {
    initialUserData: UserData;
}

export default function PublicProfileClient({ initialUserData }: PublicProfileClientProps) {
    const [userData, setUserData] = useState<UserData>(initialUserData);
    const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);

    useEffect(() => {
        if (userData) {
            const totalRecordValue = userData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
            const totalExperience = totalRecordValue + (userData.bonusPoints || 0);
            setLevelInfo(calculateUserLevelInfo(totalExperience));
        }
    }, [userData]);

    const userAvatar = userData.photoURL || `/avatars/avatar${(simpleHash(userData.uid) % 12) + 1}.jpeg`;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                 <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <div className="flex items-center gap-4 md:items-start">
                                <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                <AvatarImage src={userAvatar} />
                                <AvatarFallback>{userData.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                                <div className="md:hidden">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-semibold">{userData.username}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-semibold">{userData.username}</h1>
                                </div>
                                <div className="hidden md:block">
                                    {levelInfo && <LevelIndicator levelInfo={levelInfo} />}
                                </div>
                            </div>
                                <div className="mt-1 md:hidden">
                                {levelInfo && <LevelIndicator levelInfo={levelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {userData.bio || "No bio yet."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                    <TabsTrigger value="overview"><User className="mr-2 h-4 w-4" />Overview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-6 space-y-8">
                        <StatsPanel friendData={userData} />
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                            <ContributionGraph 
                                year={new Date().getFullYear()}
                                onDayClick={() => {}} 
                                selectedTaskFilterId={null}
                                records={userData.records} 
                                taskDefinitions={userData.taskDefinitions}
                                displayMode="full"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
