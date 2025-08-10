
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import { calculateUserLevelInfo } from '@/lib/config';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { TrendingUp, BarChart2 } from 'lucide-react';

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

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    
    const { getPublicUserData } = useFriends();
    const [publicData, setPublicData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const levelInfo: UserLevelInfo | null = useMemo(() => {
        if (!publicData) return null;
        const totalRecordValue = publicData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (publicData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [publicData]);
    
    useEffect(() => {
        const fetchPublicData = async () => {
            if (userId) {
                try {
                    const data = await getPublicUserData(userId);
                    if (data) {
                        setPublicData(data);
                    } else {
                        // Handle user not found
                    }
                } catch (error) {
                    console.error("Error fetching public user data:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchPublicData();
    }, [userId, getPublicUserData]);
    
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading public profile...</div>;
    }

    if (!publicData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>This user profile is either private or does not exist.</p>
            </div>
        );
    }
    
    const userAvatar = publicData.photoURL || `/avatars/avatar${(simpleHash(userId) % 12) + 1}.jpeg`;
    const displayName = publicData.username;
    
    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                         <Avatar className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="w-full">
                            <div className="flex items-center justify-between w-full">
                                <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                                {levelInfo && <LevelIndicator levelInfo={levelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {publicData.bio || "This user has not set a bio."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-8 mt-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BarChart2 className="h-6 w-6 text-primary"/>Stats Overview</h2>
                        <StatsPanel friendData={publicData} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Contribution Graph</h2>
                        <ContributionGraph 
                            year={new Date().getFullYear()}
                            onDayClick={() => {}} // Read-only
                            selectedTaskFilterId={null}
                            records={publicData.records} 
                            taskDefinitions={publicData.taskDefinitions}
                            displayMode="full"
                        />
                    </div>
                </div>

                <footer className="text-center py-4 mt-8 text-sm text-muted-foreground border-t">
                    Viewing public profile of {displayName}.
                </footer>
            </main>
        </div>
    );
};
