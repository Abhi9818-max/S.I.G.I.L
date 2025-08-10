
"use client";

import React from 'react';
import { UserLevelInfo, UserData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  levelInfo: UserLevelInfo;
  userData: UserData;
  userAvatar: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ levelInfo, userData, userAvatar }) => {
  return (
    <div className="w-[350px] h-[500px] bg-background rounded-2xl shadow-2xl p-4 flex flex-col font-sans border border-white/10">
        <div className="relative w-full h-2/3 rounded-lg overflow-hidden">
            <img src={userAvatar} alt={userData.username} className="w-full h-full object-cover"/>
            <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                 <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="absolute top-3 left-3 bg-black/50 px-3 py-1 rounded-full text-white text-sm backdrop-blur-sm">
                {levelInfo.tierName}
            </div>
        </div>
        <div className="flex-grow flex flex-col justify-center text-white pt-4">
            <div>
                <h2 className="text-2xl font-bold">{userData.username}</h2>
                <p className="text-md text-white/70">{levelInfo.levelName}</p>
            </div>
            <div className="flex items-center justify-between mt-4">
                 <p className="text-xl font-mono p-2 px-4 rounded-lg bg-white/10">
                    Level {levelInfo.currentLevel}
                </p>
                <div className="text-right">
                    <p className="font-bold text-lg">S.I.G.I.L.</p>
                    <p className="text-xs text-white/50">System of Internal Growth</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileCard;
