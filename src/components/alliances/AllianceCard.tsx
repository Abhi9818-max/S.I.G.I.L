
"use client";

import React from 'react';
import type { Alliance } from '@/types';
import { Shield, Target, Calendar, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
}

interface AllianceCardProps {
  alliance: Alliance;
}

const AllianceCard: React.FC<AllianceCardProps> = ({ alliance }) => {
    const { name, description, taskName, taskColor, target, startDate, endDate, members, progress, photoURL } = alliance;
    const progressPercentage = Math.min((progress / target) * 100, 100);
    const timeRemaining = differenceInDays(parseISO(endDate), new Date());
  
  return (
    <div className="w-[450px] h-auto bg-background rounded-2xl shadow-2xl p-6 flex flex-col font-sans border border-white/10">
        <header className="flex items-center gap-4 mb-4">
             <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/20">
                <Image src={photoURL} alt={name} fill className="object-cover" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white truncate">{name}</h2>
                <p className="text-sm text-white/70 mt-1">{description}</p>
            </div>
        </header>
        
        <main className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5" style={{ color: taskColor }} />
                    <h3 className="font-semibold text-lg text-white" style={{ color: taskColor }}>Objective: {taskName}</h3>
                </div>
                <div className="space-y-2 mt-4">
                    <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: taskColor }} />
                    <div className="flex justify-between text-sm text-white/60">
                        <span>{progress.toLocaleString()} / {target.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {timeRemaining >= 0 ? `${timeRemaining} days left` : 'Ended'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Members ({members.length})</h3>
                <div className="flex flex-wrap gap-2">
                    {members.slice(0, 8).map(member => (
                        <Avatar key={member.uid}>
                            <AvatarImage src={getAvatarForId(member.uid, member.photoURL)} />
                            <AvatarFallback>{(member.nickname || member.username).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    ))}
                    {members.length > 8 && (
                        <Avatar>
                            <AvatarFallback>+{members.length - 8}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>
        </main>
        
        <footer className="text-center pt-4 mt-auto border-t border-white/10">
            <p className="font-bold text-lg text-white/90">S.I.G.I.L. Alliance</p>
        </footer>
    </div>
  );
};

export default AllianceCard;
