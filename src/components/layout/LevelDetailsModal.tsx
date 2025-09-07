
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { TIER_INFO } from '@/lib/config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  levelInfo: UserLevelInfo | null;
}

const LevelDetailsModal: React.FC<LevelDetailsModalProps> = ({ isOpen, onOpenChange, levelInfo }) => {
  const router = useRouter();

  if (!levelInfo) return null;

  const {
    currentLevel,
    levelName,
    tierName,
    tierIcon,
    progressPercentage,
    valueTowardsNextLevel,
    pointsForNextLevel,
    nextLevelValueTarget,
    isMaxLevel,
    tierGroup,
  } = levelInfo;

  const progressLabel = isMaxLevel
    ? "MAX"
    : `${valueTowardsNextLevel.toLocaleString()}/${pointsForNextLevel?.toLocaleString()}`;

  const getProgressColor = (group: number): string => {
    const colors: Record<number, string> = {
      1: 'hsl(var(--progress-tier-group-1))',
      2: 'hsl(var(--progress-tier-group-2))',
      3: 'hsl(var(--progress-tier-group-3))',
      4: 'hsl(var(--progress-tier-group-4))',
      5: 'hsl(var(--progress-tier-group-5))',
    };
    return colors[group] || colors[1];
  };

  const progressColor = getProgressColor(tierGroup);
  const tierInfo = TIER_INFO.find(t => t.tierGroup === tierGroup);

  const handleBadgeClick = () => {
    onOpenChange(false);
    router.push('/tiers');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-8 bg-[rgba(21,23,25,0.5)] border-white/10 shadow-2xl backdrop-blur-lg sm:rounded-3xl">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-white">{levelName}</h1>
          <p className="text-sm text-white/70 leading-relaxed">
            This is the badge for reaching Level {currentLevel} in the {tierName} tier.
          </p>
        </div>

        <button 
          className="relative my-8 flex flex-col items-center justify-center group"
          onClick={handleBadgeClick}
          aria-label="View all tiers"
        >
            <div className="relative h-40 w-36 transition-transform duration-300 ease-in-out group-hover:scale-110">
              <svg viewBox="0 0 144 160" className="absolute inset-0 w-full h-full drop-shadow-[0_0_12px_var(--glow-color)] transition-all duration-300" style={{ '--glow-color': progressColor } as React.CSSProperties}>
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <path 
                  d="M72 4 L140 40 L140 120 L72 156 L4 120 L4 40 Z" 
                  fill="hsl(var(--card)/0.2)"
                  stroke={progressColor}
                  strokeWidth="3"
                  filter="url(#glow)"
                />
                 <path 
                  d="M72 4 L140 40 L140 120 L72 156 L4 120 L4 40 Z" 
                  fill="transparent"
                  stroke={progressColor}
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {tierInfo?.icon}
              </div>
            </div>
        </button>

        <div className="space-y-4">
          <div className="relative">
            <Progress value={progressPercentage} indicatorClassName="transition-all duration-700 ease-out" style={{ backgroundColor: progressColor }}/>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/80 bg-background/50 cursor-help">
                            <Lock className="h-5 w-5 text-white/80"/>
                        </div>
                    </TooltipTrigger>
                    {!isMaxLevel && nextLevelValueTarget && (
                        <TooltipContent>
                            <p>{nextLevelValueTarget.toLocaleString()} XP to Unlock</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-center text-xs text-white/60">
            {isMaxLevel ? "You have reached the final form." : `Earn ${((pointsForNextLevel || 0) - valueTowardsNextLevel).toLocaleString()} more XP to unlock the next level.`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelDetailsModal;
