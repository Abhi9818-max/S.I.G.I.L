
"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { TIER_INFO } from '@/lib/config';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { cn } from '@/lib/utils';
import { CornerDownLeft, Star } from 'lucide-react';

const TierCard = ({ tier, index }: { tier: typeof TIER_INFO[0], index: number }) => {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative w-full aspect-[4/1.8]">
            <Image
                src={`/tiers/tier-${index + 1}.png`}
                alt={`Image for ${tier.name}`}
                fill
                className="object-cover object-top"
                unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
      </CardContent>
      <CardHeader>
        <div className="flex items-center gap-3">
            <span className="text-3xl">{tier.icon}</span>
            <div>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>Levels {tier.minLevel} - {tier.maxLevel}</CardDescription>
            </div>
        </div>
      </CardHeader>
    </Card>
  );
};


export default function TiersPage() {
    const { getUserLevelInfo } = useUserRecords();
    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header 
                onAddRecordClick={() => {}} 
                onManageTasksClick={() => {}}
            />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3"><Star className="h-8 w-8"/> Tiers of S.I.G.I.L.</h1>
                    <p className="text-lg text-muted-foreground mt-2">The path of progression, from Ashborn to Endborne.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TIER_INFO.map((tier, index) => (
                        <Link href={`/tiers/${tier.slug}`} key={tier.slug}>
                           <TierCard tier={tier} index={index} />
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Button asChild variant="outline">
                        <Link href="/">
                            <CornerDownLeft className="mr-2 h-4 w-4" />
                            Return to Dashboard
                        </Link>
                    </Button>
                </div>
            </main>
        </div>
    )
}
