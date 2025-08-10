
"use client";

import React from 'react';
import { UserLevelInfo, UserData, ProfileCardStat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import LevelIndicator from '@/components/layout/LevelIndicator';

interface ProfileCardProps {
  levelInfo: UserLevelInfo;
  userData: UserData;
  userAvatar: string;
  displayStat?: ProfileCardStat;
  currentStreak?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ levelInfo, userData, userAvatar, displayStat, currentStreak }) => {
  const StatDisplay = () => {
    switch (displayStat) {
      case 'currentStreak':
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis flex items-center gap-1"><Flame className="h-4 w-4 text-orange-400" /> {currentStreak} Day Streak</p>;
      case 'totalXp':
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis">{levelInfo.totalAccumulatedValue.toLocaleString()} Total XP</p>;
      case 'tierName':
      default:
        return <p className="text-sm text-white/70 mt-1 h-10 overflow-hidden text-ellipsis">{levelInfo.tierName}</p>;
    }
  };

  return (
    <div className="w-[350px] h-[500px] bg-background rounded-2xl shadow-2xl p-4 flex flex-col font-sans border border-white/10">
        <div className="relative w-full h-2/3 rounded-lg overflow-hidden">
            <img src={userAvatar} alt={userData.username} className="w-full h-full object-cover"/>
            <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                 <TrendingUp className="h-5 w-5 text-white" />
            </div>
        </div>
        <div className="flex-grow flex items-center justify-between text-white pt-4">
            <div className="w-1/2">
                <h2 className="text-2xl font-bold truncate">{userData.username}</h2>
                <StatDisplay />
            </div>
            <div className="text-right w-1/2">
                <LevelIndicator levelInfo={levelInfo} />
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
