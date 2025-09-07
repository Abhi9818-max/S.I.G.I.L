
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { TIER_INFO } from '@/lib/config';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { cn } from '@/lib/utils';
import { CornerDownLeft, Star } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const TierCard = ({ tier, index, isCurrentTier, isClicked, onClick }: { tier: typeof TIER_INFO[0], index: number, isCurrentTier: boolean, isClicked: boolean, onClick: () => void }) => {
  const customCropTiers = ['unknown-blades', 'doompath-heralds', 'elders-of-dust'];
  return (
    <Card 
        id={`tier-card-${tier.slug}`}
        onClick={onClick}
        className={cn(
            "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer",
            isCurrentTier && 'current-tier-glow',
            isClicked && 'click-glow-animation'
        )}
    >
      <CardContent className="p-0">
        <div className="relative w-full aspect-[1/1]">
            <Image
                src={`/tiers/tier-${index + 1}.png`}
                alt={`Image for ${tier.name}`}
                fill
                className={cn(
                    "object-cover",
                    customCropTiers.includes(tier.slug) && 'object-top'
                )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>
      </CardContent>
      <CardHeader>
        <div className="flex items-center gap-3">
            <span className="text-2xl">{tier.icon}</span>
            <div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>Levels {tier.minLevel} - {tier.maxLevel}</CardDescription>
            </div>
        </div>
      </CardHeader>
    </Card>
  );
};


export default function TiersPage() {
    const { getUserLevelInfo } = useUserRecords();
    const [clickedTierSlug, setClickedTierSlug] = useState<string | null>(null);
    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
    const searchParams = useSearchParams();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const slugToScroll = searchParams.get('scrollTo');
        if (slugToScroll && scrollContainerRef.current) {
            const element = document.getElementById(`tier-card-${slugToScroll}`);
            if (element) {
                // Use a timeout to ensure the page has rendered and elements are in place
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setClickedTierSlug(slugToScroll);
                    setTimeout(() => setClickedTierSlug(null), 1000);
                }, 100);
            }
        }
    }, [searchParams]);

    const handleCardClick = (slug: string) => {
        setClickedTierSlug(slug);
        setTimeout(() => setClickedTierSlug(null), 500); // Remove glow after animation
    };

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header 
                onAddRecordClick={() => {}} 
                onManageTasksClick={() => {}}
            />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up" ref={scrollContainerRef}>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center justify-center gap-3"><Star className="h-8 w-8"/> Tiers of S.I.G.I.L.</h1>
                    <p className="text-lg text-muted-foreground mt-2">The path of progression, from Ashborn to Endborne.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TIER_INFO.map((tier, index) => (
                      <div
                        key={tier.slug}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        <Link href={`/tiers/${tier.slug}`} passHref>
                           <div onClick={() => handleCardClick(tier.slug)}>
                                <TierCard 
                                    tier={tier} 
                                    index={index}
                                    isCurrentTier={levelInfo?.tierSlug === tier.slug}
                                    isClicked={clickedTierSlug === tier.slug}
                                    onClick={() => {}} // The div handles the click for animation
                                />
                           </div>
                        </Link>
                      </div>
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
