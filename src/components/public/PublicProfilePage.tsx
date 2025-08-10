
"use client";

import React from 'react';
import type { UserData, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { calculateUserLevelInfo } from '@/lib/config';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import LevelIndicator from '@/components/layout/LevelIndicator';

interface PublicProfilePageProps {
  initialUserData: UserData;
}

// Simple hash function to get a number from a string for consistent default avatars
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export default function PublicProfilePage({ initialUserData }: PublicProfilePageProps) {
    const friendLevelInfo: UserLevelInfo | null = React.useMemo(() => {
        if (!initialUserData) return null;
        const totalRecordValue = initialUserData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (initialUserData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [initialUserData]);

    const userAvatar = initialUserData.photoURL || `/avatars/avatar${(simpleHash(initialUserData.uid || initialUserData.username) % 12) + 1}.jpeg`;
    const pageTierClass = friendLevelInfo ? `page-tier-group-${friendLevelInfo.tierGroup}` : 'page-tier-group-1';
    
    return (
        <div className={cn("min-h-screen flex flex-col bg-background", pageTierClass)}>
            <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8">
                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                         <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>{initialUserData.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="w-full">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <h1 className="text-xl font-semibold">{initialUserData.username}</h1>
                                <div className="hidden md:block">
                                    {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                                </div>
                            </div>
                            <div className="mt-1 md:hidden">
                                {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {initialUserData.bio || "No bio yet."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 space-y-8">
                    <StatsPanel friendData={initialUserData} />
                     <div>
                        <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                        <ContributionGraph 
                            year={new Date().getFullYear()}
                            onDayClick={() => {}} // Non-interactive on public page
                            selectedTaskFilterId={null}
                            records={initialUserData.records || []} 
                            taskDefinitions={initialUserData.taskDefinitions || []}
                            displayMode="full"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
