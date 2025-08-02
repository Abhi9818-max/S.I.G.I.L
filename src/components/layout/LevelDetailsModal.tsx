
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
    tierIcon,
    tierGroup,
    welcomeMessage,
    progressPercentage,
    totalAccumulatedValue,
    valueTowardsNextLevel,
    pointsForNextLevel,
    isMaxLevel,
    tierSlug,
  } = levelInfo;
  
  const tierIndex = TIER_INFO.findIndex(t => t.slug === tierSlug);

  const getTierProgressClassName = (group: number): string => {
    switch (group) {
      case 1: return 'bg-progress-tier-group-1';
      case 2: return 'bg-progress-tier-group-2';
      case 3: return 'bg-progress-tier-group-3';
      case 4: return 'bg-progress-tier-group-4';
      case 5: return 'bg-progress-tier-group-5';
      default: return 'bg-progress-tier-group-1';
    }
  };
  const progressColorClass = getTierProgressClassName(tierGroup);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {tierIndex !== -1 && (
            <div className="relative mx-auto -mt-2 p-4">
              <Image
                src={`/tiers/tier-${tierIndex + 1}.png`}
                alt={`Image for ${tierName}`}
                width={200}
                height={100}
                className="h-auto rounded-lg mx-auto"
              />
            </div>
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-4xl">{tierIcon}</span>
            <span>{tierName}</span>
          </DialogTitle>
          <DialogDescription className="text-left italic pt-2">
            "{welcomeMessage}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg">Level {currentLevel}: {levelName}</h4>
            <p className="text-sm text-muted-foreground">Your current standing in the S.I.G.I.L. system.</p>
          </div>

          <div>
            <h4 className="font-semibold text-md mb-2">Progress to Next Level</h4>
            {isMaxLevel ? (
              <p className={cn("font-semibold text-lg", progressColorClass.replace('bg-', 'text-'))}>Max Level Reached!</p>
            ) : (
              <>
                <Progress value={progressPercentage} className="h-4" indicatorClassName={progressColorClass} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{valueTowardsNextLevel.toLocaleString()} XP</span>
                  <span>{pointsForNextLevel?.toLocaleString()} XP</span>
                </div>
                 <p className="text-center text-sm mt-1">{progressPercentage.toFixed(1)}% complete</p>
              </>
            )}
          </div>
          
          <Separator />

          <div>
            <h4 className="font-semibold text-md mb-2">Statistics</h4>
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total XP Earned:</span>
                <span className="font-bold text-lg text-primary">{totalAccumulatedValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button asChild className="w-full" variant="outline" onClick={() => onOpenChange(false)}>
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
