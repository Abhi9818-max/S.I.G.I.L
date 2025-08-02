
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { TIER_INFO, LEVEL_NAMES } from '@/lib/config';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { cn } from '@/lib/utils';
import { ArrowLeft, BookOpen, Star, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export default function TierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const { getUserLevelInfo } = useUserRecords();
    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
    
    const tier = TIER_INFO.find(t => t.slug === slug);
    const tierIndex = TIER_INFO.findIndex(t => t.slug === slug);

    if (!tier) {
        // Optionally, redirect to a 404 page or back to the tiers list
        if (typeof window !== "undefined") {
            router.push('/tiers');
        }
        return <div className="min-h-screen flex items-center justify-center">Loading tier...</div>;
    }

    const levelsInTier = LEVEL_NAMES.slice(tier.minLevel - 1, tier.maxLevel);

    const calculateTierProgress = () => {
        if (!levelInfo) return 0;
        if (levelInfo.currentLevel > tier.maxLevel) return 100;
        if (levelInfo.currentLevel < tier.minLevel) return 0;

        const levelsInThisTier = tier.maxLevel - tier.minLevel + 1;
        const levelsCompletedInThisTier = levelInfo.currentLevel - tier.minLevel;
        
        return (levelsCompletedInThisTier / levelsInThisTier) * 100;
    }

    const tierProgressPercentage = calculateTierProgress();

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <Button variant="outline" onClick={() => router.push('/tiers')} className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Tiers
                </Button>
                
                <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden">
                    <div className="relative w-full">
                        <Image
                            src={`/tiers/tier-${tierIndex + 1}.png`}
                            alt={`Image for ${tier.name}`}
                            width={600}
                            height={300}
                            className="w-full h-auto"
                            unoptimized
                        />
                    </div>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{tier.icon}</span>
                            <div>
                                <CardTitle className="text-3xl">{tier.name}</CardTitle>
                                <CardDescription>Levels {tier.minLevel} - {tier.maxLevel}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <blockquote className="border-l-4 border-primary pl-4 italic text-lg text-foreground/80">
                           "{tier.welcomeMessage}"
                        </blockquote>
                        <div className="mt-6 space-y-2">
                            <p className="text-sm text-muted-foreground">Tier Progress</p>
                            <Progress value={tierProgressPercentage} indicatorClassName={cn(levelInfo && `bg-progress-tier-group-${levelInfo.tierGroup}`)} />
                        </div>
                        {tier.tierEntryBonus && tier.tierEntryBonus > 0 && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <p className="font-semibold flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400"/>Tier Entry Bonus</p>
                                <p className="text-muted-foreground text-sm">Upon reaching this tier, you are awarded <span className="font-bold text-primary">{tier.tierEntryBonus}</span> bonus XP to honor your progress.</p>
                            </div>
                        )}
                    </CardContent>

                    <Separator className="my-6" />

                    <CardContent>
                        <h3 className="text-xl font-semibold mb-4 text-primary">Levels in this Tier</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {levelsInTier.map((levelName, index) => {
                                const levelNumber = tier.minLevel + index;
                                const isCurrentUserLevel = levelInfo?.currentLevel === levelNumber;
                                return (
                                    <div
                                        key={levelName}
                                        className={cn(
                                            "p-3 rounded-lg flex items-center gap-2 transition-all",
                                            isCurrentUserLevel ? "bg-primary/20 border border-primary/50 font-bold" : "bg-muted/50"
                                        )}
                                    >
                                        {isCurrentUserLevel && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                                        <div className="flex-grow">
                                          <span className="text-muted-foreground mr-2 text-xs">Lv. {levelNumber}</span>
                                          <span className="text-sm">{levelName}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
