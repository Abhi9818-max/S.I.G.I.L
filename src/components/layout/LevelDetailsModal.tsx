
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Star } from 'lucide-react';
import Image from 'next/image';
import { TIER_INFO } from '@/lib/config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  levelInfo: UserLevelInfo | null;
}

const LevelDetailsModal: React.FC<LevelDetailsModalProps> = ({ isOpen, onOpenChange, levelInfo }) => {
  if (!levelInfo) return null;

  const {
    currentLevel,
    levelName,
    tierName,
    progressPercentage,
    totalAccumulatedValue,
    valueTowardsNextLevel,
    pointsForNextLevel,
    isMaxLevel,
    tierSlug,
  } = levelInfo;
  
  const tierIndex = TIER_INFO.findIndex(t => t.slug === tierSlug);
  
  const progressLabel = isMaxLevel 
    ? "Max Level" 
    : `${valueTowardsNextLevel.toLocaleString()} / ${pointsForNextLevel?.toLocaleString()} XP`;

  const customCropTiers = ['unknown-blades', 'doompath-heralds', 'elders-of-dust'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto text-white p-6">
        <DialogHeader className="text-center items-center">
          <DialogTitle className="text-3xl font-bold tracking-wider text-shadow-lg">
            {levelName}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-shadow">
            Level {currentLevel} &middot; {tierName}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex justify-center">
          {tierIndex !== -1 && (
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
                <Image
                    src={`/tiers/tier-${tierIndex + 1}.png`}
                    alt={`Image for ${tierName}`}
                    width={200}
                    height={200}
                    className={cn(
                        "h-full w-full object-cover drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                        customCropTiers.includes(tierSlug) && 'object-top'
                    )}
                />
              </div>
          )}
        </div>

        <div className="space-y-4">
            <div className="relative">
                <Progress value={progressPercentage} className="h-4 bg-white/10" indicatorClassName="bg-cyan-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-black drop-shadow-sm text-shadow">{progressLabel}</span>
                </div>
            </div>
             <p className="text-center text-xs text-white/60 text-shadow">
                Total XP Earned: {totalAccumulatedValue.toLocaleString()}
            </p>
        </div>

        <DialogFooter className="mt-6">
          <Button asChild className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm" variant="outline" onClick={() => onOpenChange(false)}>
            <Link href="/tiers">
                <Star className="mr-2 h-4 w-4" />
                View All Tiers
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelDetailsModal;
