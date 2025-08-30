
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Star, Lock } from 'lucide-react';
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
    tierIcon,
    progressPercentage,
    valueTowardsNextLevel,
    pointsForNextLevel,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-8 sm:max-w-sm">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-white">{levelName}</h1>
          <p className="text-sm text-white/70 leading-relaxed">
            This is the badge for reaching Level {currentLevel} in the {tierName} tier.
          </p>
        </div>

        <div className="relative my-8 flex flex-col items-center justify-center">
            {/* Badge container with glow */}
            <div className="relative h-40 w-36">
              {/* SVG for glowing shield */}
              <svg viewBox="0 0 144 160" className="absolute inset-0 w-full h-full drop-shadow-[0_0_12px_var(--glow-color)]" style={{ '--glow-color': progressColor } as React.CSSProperties}>
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
               {/* Tier Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {tierInfo?.icon}
              </div>
            </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
             <div className="absolute -top-6 right-1/2 translate-x-1/2">
                <div className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: progressColor, color: '#0B0C0E' }}>
                  {progressLabel} XP
                </div>
            </div>
            <Progress value={progressPercentage} indicatorClassName="transition-all duration-700 ease-out" style={{ backgroundColor: progressColor }}/>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/80 bg-background/50">
                <Lock className="h-5 w-5 text-white/80"/>
            </div>
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
