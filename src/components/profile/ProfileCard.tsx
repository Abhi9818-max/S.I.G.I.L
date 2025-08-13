
"use client";

import React from 'react';
import { UserLevelInfo, UserData, ProfileCardStat, Achievement } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, TrendingUp, Star, Heart, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import LevelIndicator from '@/components/layout/LevelIndicator';
import Image from 'next/image';
import { ACHIEVEMENTS } from '@/lib/achievements';

interface ProfileCardProps {
  levelInfo: UserLevelInfo;
  userData: UserData;
  userAvatar: string;
  displayStat?: ProfileCardStat;
  currentStreak?: number;
  relationship?: string | null;
  equippedTitle?: Achievement | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ levelInfo, userData, userAvatar, displayStat, currentStreak, relationship, equippedTitle }) => {
  
  const StatDisplay = () => {
    if (relationship) {
      return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Heart className="h-4 w-4 text-pink-400" /> {relationship}</p>;
    }
    
    // Fallback logic when no relationship is defined.
    switch (displayStat) {
      case 'equippedTitle':
        if (equippedTitle) {
          const Icon = equippedTitle.icon;
          return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Icon className="h-4 w-4 text-yellow-400" /> {equippedTitle.name}</p>;
        }
        // Fallthrough to tier name if no title is equipped
      case 'tierName':
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400"/> {levelInfo.tierName}</p>;
      case 'currentStreak':
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Flame className="h-4 w-4 text-orange-400" /> {currentStreak} Day Streak</p>;
      case 'totalXp':
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><TrendingUp className="h-4 w-4"/> {levelInfo.totalAccumulatedValue.toLocaleString()} Total XP</p>;
      default:
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400"/> {levelInfo.tierName}</p>;
    }
  };

  return (
    <div className="w-[350px] h-[500px] bg-background rounded-2xl shadow-2xl p-4 flex flex-col font-sans border border-white/10">
        <div className="relative w-full h-2/3 rounded-lg overflow-hidden">
            <Image src={userAvatar} alt={userData.username} fill className="object-cover"/>
            <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                 <TrendingUp className="h-5 w-5 text-white" />
            </div>
        </div>
        <div className="flex-grow flex items-start justify-between text-white pt-4">
            <div className="w-1/2">
                <h2 className="text-2xl font-bold truncate">{userData.username}</h2>
                <StatDisplay />
            </div>
            <div className="w-1/2 flex justify-end">
              <div className="flex flex-col items-end -mt-1 -mr-1">
                <LevelIndicator levelInfo={levelInfo} />
              </div>
            </div>
        </div>
         <div className="text-center pt-4 mt-auto border-t border-white/10">
            <p className="font-bold text-lg text-white/90">S.I.G.I.L.</p>
            <p className="text-xs text-white/50">System of Internal Growth</p>
        </div>
    </div>
  );
};

export default ProfileCard;
